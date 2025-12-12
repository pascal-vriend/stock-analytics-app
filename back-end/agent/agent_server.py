# agent_server.py
from fastapi import FastAPI
from google.adk.agents import Agent
from google.adk.a2a.utils.agent_to_a2a import to_a2a
from google.adk.tools import google_search, AgentTool, ToolContext
from google.adk.sessions import InMemorySessionService
from google.adk.sessions import Runner
from google.adk import types
import uuid

APP_NAME = "adk_fastapi_server"
USER_ID = "fastapi_user"

session_service = InMemorySessionService()
root_agent = Agent(
    name="helpful_assistant",
    model="gemini-2.5-flash-lite",
    description="A simple agent that can answer general questions.",
    instruction="You are a helpful assistant. Use Google Search for current info or if unsure.",
    tools=[google_search],
)
runner = Runner(
    agent=root_agent, app_name=APP_NAME, session_service=session_service
)

agent_app = to_a2a(root_agent, port=8001)


app = FastAPI(title="Composite ADK Server")
app.mount("/agent", agent_app)


@app.post("/generate")
async def generate(request: dict):
    prompt = request.get("prompt")
    if not prompt:
        return {"text": "No prompt provided.", "sources": []}

    session_id = f"single_turn_{uuid.uuid4().hex[:8]}"

    session = await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=session_id
    )



    user_content = types.Content(parts=[types.Part(text=prompt)])

    final_text = ""

    async for event in runner.run_async(
            user_id=USER_ID, session_id=session_id, new_message=user_content
    ):
        if event.is_final_response() and event.content:
            for part in event.content.parts:
                if hasattr(part, "text"):
                    final_text += part.text

    await session_service.delete_session(session_id=session_id, user_id=USER_ID, app_name=APP_NAME)

    # 5. Return the result
    return {"text": final_text, "sources": []}
@app.get("/health")
async def health():
    return {"status": "ok"}
