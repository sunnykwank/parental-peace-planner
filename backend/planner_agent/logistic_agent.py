from google.adk.agents.llm_agent import LlmAgent

logistic_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='logistic_agent',
    description='A helpful assistant for user questions about logistics.',
    instruction="""You are a Logistic Agent which based on the locations provided by place_agent to determine the plan for the time period.
    You need to based on the weather_agent's response to determine the order of the locations and the time period for each location.
    Don't provide answers to any other questions, just answer places related questions
    """
)
