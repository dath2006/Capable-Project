# Use official Python 3.12 slim bookworm image
FROM python:3.12-slim-bookworm

# Install uv from the official pre-built image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory inside the container
WORKDIR /app

# Enable Python bytecode compilation for faster execution/startup
ENV UV_COMPILE_BYTECODE=1

# Copy only dependency files first to leverage Docker build caching
COPY pyproject.toml uv.lock ./

# Install dependencies (without installing the project package itself)
# Use a cache mount to speed up subsequent builds
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Copy the rest of the application code
COPY . .

# Complete the synchronization to install the backend project itself
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Pre-download and cache the sentence-transformers embedding model during build time
# This ensures faster container startup and eliminates runtime downloading latency
RUN uv run python -c "from langchain_huggingface import HuggingFaceEmbeddings; HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')"

# Ensure directory structures for data and media persistence exist
RUN mkdir -p /app/data /app/media

# Expose backend API port (exposed metadata can be overridden)
EXPOSE 8111

# Set production environment variables
ENV HOST=0.0.0.0
ENV PORT=8111
ENV DATABASE_URL=sqlite:////app/data/app.db

# Run uvicorn to start the FastAPI application dynamically using the PORT env var
CMD ["sh", "-c", "uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]

