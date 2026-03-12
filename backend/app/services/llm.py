from langchain_core.prompts import PromptTemplate

from ..ai import build_chat_model

def get_ai_response(query: str) -> str:
    """Generate a concise answer using the shared backend LLM chain."""
    prompt_template = PromptTemplate.from_template("Provide a concise response to: {query}")
    chain = prompt_template | build_chat_model(temperature=0.3)
    response = chain.invoke({"query": query})
    return response.content if hasattr(response, "content") else str(response)
