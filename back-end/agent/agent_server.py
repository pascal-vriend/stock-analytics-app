# agent_server.py
from fastapi import FastAPI
from google.adk.agents import Agent
from google.adk.a2a.utils.agent_to_a2a import to_a2a
from google.adk.tools import google_search, AgentTool, ToolContext
from google.adk.sessions import InMemorySessionService
from google.adk.sessions import Runner
from google.adk import types
import uuid
import requests

APP_NAME = "adk_fastapi_server"
USER_ID = "fastapi_user"

session_service = InMemorySessionService()


def get_stock_quote(ticker: str) -> dict:
    """Get the latest price, absolute change, and percent change for a stock
    ticker symbol (e.g. 'AAPL', 'MSFT'). Use this whenever the user asks about
    a stock's current price or recent performance."""
    resp = requests.get(f"http://alpha-service:8000/stocks/{ticker}", timeout=10)
    resp.raise_for_status()
    return resp.json()


root_agent = Agent(
    name="stock_analyst",
    model="gemini-2.5-flash",
    description="Analyzes stocks using live market data from the alpha-service.",
    instruction=(
        "You are a stock-analysis assistant for a portfolio app. When a user asks "
        "about a stock, call get_stock_quote to fetch live data, then explain the "
        "price and movement in plain language. Only state numbers that came from a "
        "tool result. If a tool fails or you lack the data, say so clearly — never "
        "guess or invent a price."
    ),
    tools=[get_stock_quote],
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
    sources = []  # citations: every tool call becomes a traceable source

    async for event in runner.run_async(
            user_id=USER_ID, session_id=session_id, new_message=user_content
    ):
        if not (event.content and event.content.parts):
            continue
        for part in event.content.parts:
            # Whenever the model calls a tool, record where the data came from.
            fc = getattr(part, "function_call", None)
            if fc and fc.name == "get_stock_quote":
                ticker = (fc.args or {}).get("ticker", "").upper()
                source = {
                    "uri": f"http://alpha-service:8000/stocks/{ticker}",
                    "title": f"Live market quote: {ticker}",
                }
                if source not in sources:
                    sources.append(source)
            # Collect the model's final natural-language answer.
            if event.is_final_response() and getattr(part, "text", None):
                final_text += part.text

    await session_service.delete_session(session_id=session_id, user_id=USER_ID, app_name=APP_NAME)

    return {"text": final_text, "sources": sources}


@app.get("/health")
async def health():
    return {"status": "ok"}
