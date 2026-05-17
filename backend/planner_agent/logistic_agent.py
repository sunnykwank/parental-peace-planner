from google.adk.agents.llm_agent import LlmAgent

logistic_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='logistic_agent',
    description='A helpful assistant for user questions about logistics.',
    instruction="""You are a Logistic Agent which based on {place_data} and {weather_data} only to determine the plan for the time period.
    Provide a full itinerary with the schedule, suggested activity and suggested places.
    Don't provide answers to any other questions, just answer places related questions
    """
)
