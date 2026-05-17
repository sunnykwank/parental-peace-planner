from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters
from google.adk.agents.llm_agent import LlmAgent
import os

server_path = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "mcp",
    "weather-mcp-server.py",
)

# Connect to your local weather server
weather_tools = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command="python",
            args=[server_path],
        )
    )
)

weather_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='weather_agent',
    description='A helpful assistant for user questions about weather.',
    instruction="""You are a Weather Agent to provide information about the weather forecast for a specific location for the next 24 hours.
    if user provide location name, always use the `get_coordinates` tool to get the coordinates for the specified location.
    if the user provide latitude and longitude, use the `get_forecast` tool to get the weather forecast for the specified location.
    Your job is to classify the weather as 'Outdoor-Safe,' 'Mixed,' or 'Indoor-Only' based on hourly rain probability.
    Don't provide answers to any other questions, just answer weather related questions""",
    tools=[weather_tools]
)
