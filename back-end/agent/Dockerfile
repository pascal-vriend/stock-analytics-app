FROM python:3.11-slim

WORKDIR /app


RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && rm -rf /var/lib/apt/lists/*

# Copy code
COPY agent_server.py /app/agent_server.py
COPY requirements.txt /app/requirements.txt

# Install python deps
RUN pip install --no-cache-dir -r requirements.txt

# Run uvicorn to serve the FastAPI app (bind 0.0.0.0 so other containers can reach it)
CMD ["uvicorn", "agent_server:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
