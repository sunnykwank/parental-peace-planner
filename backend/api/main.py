import os
import json
import requests

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import google.auth
from google.auth.transport.requests import Request

from dotenv import load_dotenv


app = FastAPI(
    title="Parental Peace Planner Agent API",
    description="FastAPI backend that calls Vertex AI Agent Engine",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION_ID = os.getenv("LOCATION_ID", "us-central1")
RESOURCE_ID = os.getenv("RESOURCE_ID")
USER_ID = "planner_user"


class PlanRequest(BaseModel):
    location: str
    time_period: str
    activity_type: str


def get_access_token() -> str:
    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    credentials.refresh(Request())
    return credentials.token


def extract_text_from_sse(response_text: str) -> str:
    final_text_parts = []

    for line in response_text.splitlines():
        # if not line.startswith("data:"):
        #     continue

        # raw_json = line.replace("data:", "").strip()

        if not line:
            continue

        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue

        # Different Agent Engine responses can wrap text slightly differently.
        # This tries to extract text from common response formats.
        if "content" in event:
            content = event.get("content", {})
            parts = content.get("parts", [])
            for part in parts:
                if "text" in part:
                    final_text_parts.append(part["text"])

        if "parts" in event:
            for part in event.get("parts", []):
                if "text" in part:
                    final_text_parts.append(part["text"])

        if "text" in event:
            final_text_parts.append(event["text"])

    return "\n".join(final_text_parts).strip()


def call_remote_agent(prompt: str) -> str:
    if not PROJECT_ID or not RESOURCE_ID:
        raise HTTPException(
            status_code=500,
            detail="PROJECT_ID and RESOURCE_ID must be set as environment variables.",
        )

    token = get_access_token()

    query_url = (
        f"https://{LOCATION_ID}-aiplatform.googleapis.com/v1/"
        f"projects/{PROJECT_ID}/locations/{LOCATION_ID}/"
        f"reasoningEngines/{RESOURCE_ID}:query"
    )

    stream_url = (
        f"https://{LOCATION_ID}-aiplatform.googleapis.com/v1/"
        f"projects/{PROJECT_ID}/locations/{LOCATION_ID}/"
        f"reasoningEngines/{RESOURCE_ID}:streamQuery?alt=sse"
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    session_response = requests.post(
        query_url,
        headers=headers,
        json={
            "class_method": "async_create_session",
            "input": {
                "user_id": USER_ID,
            },
        },
        timeout=180,
    )

    if session_response.status_code >= 400:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create remote session: {session_response.text}",
        )

    session_data = session_response.json()
    session_id = session_data["output"]["id"]

    message_response = requests.post(
        stream_url,
        headers=headers,
        json={
            "class_method": "async_stream_query",
            "input": {
                "user_id": USER_ID,
                "session_id": session_id,
                "message": prompt,
            },
        },
        timeout=360,
    )

    if message_response.status_code >= 400:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to query remote agent: {message_response.text}",
        )

    final_text = extract_text_from_sse(message_response.text)

    if not final_text:
        return message_response.text

    return final_text


@app.get("/")
def home():
    return {
        "message": "Parental Peace Planner Agent API is running and calling Vertex AI Agent Engine"
    }


@app.post("/plan-itinerary")
def plan_itinerary(request: PlanRequest):
    prompt = f"""
Plan the itinerary with the following infomration

Location: {request.location}
Time Period: {request.time_period}
Activity Type: {request.activity_type}
"""

    response = call_remote_agent(prompt)

    return {
        "result": response
    }
