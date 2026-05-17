import asyncio
import logging

import httpx
from fastmcp import FastMCP

logger = logging.getLogger(__name__)
logging.basicConfig(format="[%(levelname)s]: %(message)s", level=logging.INFO)

mcp = FastMCP("Weather MCP Server 🌤️")


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


if __name__ == "__main__":
    mcp.run()
