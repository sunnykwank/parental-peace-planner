from google.adk.agents import SequentialAgent
from .weather_agent import weather_agent
from .place_agent import place_agent
from .logistic_agent import logistic_agent

root_agent = SequentialAgent(
    # model='gemini-2.5-flash',
    name='root_agent',
    description='Your go-to assistant for planning fun activities for your kids',
    # instruction="""You are the Parental Peace Planner orchestrator. Delegate tasks to specialists.
    # User need to provide the location, activity type and the time period. 
    # Result:
    # A full itinerary with the schedule, suggested activity and suggested places.
    # Step:
    # 1. use weather agent to get the weather forecast for the location provided, 
    # 2. use place agent to find the best places for the location and the activity type provided, 
    # 3. use logistic agent to plan the activity. 
    # Provide the best result to the user.
    # """,
    sub_agents=[weather_agent, place_agent, logistic_agent]
)
