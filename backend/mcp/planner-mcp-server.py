import asyncio
import logging

import httpx
from fastmcp import FastMCP
from dotenv import load_dotenv
import os

logger = logging.getLogger(__name__)
logging.basicConfig(format="[%(levelname)s]: %(message)s", level=logging.INFO)

mcp = FastMCP("Planner MCP Server")

# Your Google Maps API Key from .env or environment
load_dotenv()
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


@mcp.tool()
async def get_forecast(
    latitude: float,
    longitude: float,
):
    """
    Fetches the 24-hour forecast for a specific location.
    Use this to determine if activities should be indoor or outdoor.

    Args:
        latitude: The latitude of the location (e.g., "37.7749").
        longitude: The longitude of the location (e.g., "-122.4194").

    Returns:
        A dictionary containing the forecast data, or an error message if the request fails.
    """
    logger.info(
        f"--- 🛠️ Tool: get_forecast called for {latitude}, {longitude} ---"
    )
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "precipitation_probability,temperature_2m",
        "forecast_days": 1
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()

        return data
        
        # # Format a simple summary for the LLM
        # probs = data["hourly"]["precipitation_probability"]
        # max_rain = max(probs)
        
        # if max_rain > 40:
        #     return f"Warning: High chance of rain today (up to {max_rain}%). Recommend indoor activities."
        # else:
        #     return f"Clear skies expected. Max rain chance is {max_rain}%. Outdoor activities are safe."


@mcp.tool()
async def get_coordinates(location: str):
    """
    Fetches the latitude and longitude coordinates for a specific location.

    Args:
        location: The name of the location (e.g., "San Francisco").

    Returns:
        A dictionary containing the latitude and longitude, or an error message.
    """
    logger.info(f"--- 🛠️ Tool: get_coordinates called for {location} ---")
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {
        "name": location,
        "count": 1,
        "language": "en",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        
        if data["results"]:
            result = data["results"][0]
            return {
                "latitude": result["latitude"],
                "longitude": result["longitude"]
            }
        else:
            return f"Could not find coordinates for {location}."

@mcp.tool()
async def search_toddler_spots(location_name: str, activity_type: str = "play area") -> str:
    """
    Searches for toddler-friendly spots (parks, cafes, museums).
    activity_type can be 'soft play', 'playground', 'family cafe', etc.
    """
    logger.info(f"--- 🛠️ Tool: search_toddler_spots called for {location_name} and {activity_type} ---")
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        # FieldMask: Only fetch what we need (saves money/latency)
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.types"
    }
    
    # We combine the location and activity into a single natural language query
    payload = {
        "textQuery": f"toddler friendly {activity_type} in {location_name}",
        "maxResultCount": 5
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        data = response.json()
        
        if "places" not in data:
            return "No toddler-friendly spots found in that area."

        results = []
        for place in data["places"]:
            name = place["displayName"]["text"]
            address = place["formattedAddress"]
            rating = place.get("rating", "N/A")
            results.append(f"- {name} (Rating: {rating}): {address}")
        
        return "\n".join(results)

if __name__ == "__main__":
    asyncio.run(mcp.run_http_async(transport="sse", host="0.0.0.0", port=8080))
