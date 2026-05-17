from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters
from google.adk.agents.llm_agent import LlmAgent
import os

server_path = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "mcp",
    "place-mcp-server.py",
)

# Connect to your local weather server
place_tools = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command="python",
            args=[server_path],
        )
    )
)

place_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='place_agent',
    description='A helpful assistant for user questions about places.',
    instruction="""You are a Place Agent which finding places that suitable for kids based on the location and activity type provided by the user.
    You need to based on the weather_agent's response to determine whether the places should be indoor or outdoor.
    if the weather is 'Outdoor-Safe', then the places should be outdoor.
    if the weather is 'Indoor-Only', then the places should be indoor.
    if the weather is 'Mixed', then the places can be indoor or outdoor.
    use the `search_toddler_spots` tool to search for the suitable places for the specified location.
    Don't provide answers to any other questions, just answer places related questions
    """,
    tools=[place_tools]
)
