from google.adk.agents.llm_agent import Agent
from .weather_agent import weather_agent
from .place_agent import place_agent
from .logistic_agent import logistic_agent

root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description='Your go-to assistant for planning fun activities for your kids',
    instruction="""You are a Root Agent. User need to provide the location, activity type and the time period. 
    Use the sub-agents to plan the activity. 
    First use weather agent to get the weather forecast, 
    then use place agent to find the best places, 
    and finally use logistic agent to plan the activity. 
    Each agent will provide its response to the next agent and each agent is execute once only.
    Provide the best result to the user.
    """,
    sub_agents=[weather_agent, place_agent, logistic_agent]
)
