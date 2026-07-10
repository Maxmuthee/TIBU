"""
RAG Engine — The brain behind "Ask TIBU"

Uses Azure OpenAI (LLM + Embeddings) and Azure AI Search (vector store)
to answer student questions grounded in official USIU-Africa documents.
"""

from openai import AsyncAzureOpenAI
from azure.search.documents.aio import SearchClient as AsyncSearchClient
from azure.search.documents.models import VectorizedQuery
from azure.core.credentials import AzureKeyCredential

from app.config import get_settings

settings = get_settings()

# Azure OpenAI async client — EMBEDDINGS (text-embedding-ada-002)
openai_client = AsyncAzureOpenAI(
    azure_endpoint=settings.azure_openai_endpoint.strip(),
    api_key=settings.azure_openai_api_key.strip(),
    api_version=settings.azure_openai_api_version.strip(),
)

# Azure AI Foundry async client — CHAT (gpt-oss-120b open model)
chat_client = AsyncAzureOpenAI(
    azure_endpoint=settings.azure_chat_endpoint.strip(),
    api_key=settings.azure_chat_api_key.strip(),
    api_version=settings.azure_chat_api_version.strip(),
)

# Azure AI Search async client
search_client = AsyncSearchClient(
    endpoint=settings.azure_search_endpoint.strip(),
    index_name=settings.azure_search_index_name.strip(),
    credential=AzureKeyCredential(settings.azure_search_api_key.strip()),
)

SYSTEM_PROMPT = """You are TIBU (The Integrated University Buddy), an AI assistant for students at 
United States International University-Africa (USIU-Africa). 

Your role:
- Answer questions about USIU-Africa academics, courses, fees, campus facilities, clubs, events, and services.
- Always base your answers on the provided context from official university documents.
- If the context doesn't contain enough information to answer, say so honestly and suggest where the student might find help (e.g., "I'd recommend contacting the Registrar's Office for the most current information.").
- Be friendly, concise, and helpful. You're a fellow student's best resource.
- Never make up information about courses, fees, deadlines, or policies.

When answering:
1. Use the context provided to give accurate answers.
2. Cite which document/source your information comes from when possible.
3. If a student seems stressed or mentions mental health concerns, gently point them to the Wellness Center.
"""


async def ask_tibu(question: str, conversation_history: list[dict] | None = None) -> dict:
    """
    Main RAG pipeline:
    1. Search Azure AI Search for relevant document chunks
    2. Build a prompt with retrieved context
    3. Send to Azure OpenAI for a grounded answer
    """
    # Step 1: Embed the question
    embed_response = await openai_client.embeddings.create(
        model=settings.azure_openai_embedding_deployment,
        input=[question],
    )
    question_vector = embed_response.data[0].embedding

    # Step 2: Retrieve relevant documents via vector + text hybrid search
    search_results = await search_client.search(
        search_text=question,
        vector_queries=[
            VectorizedQuery(
                vector=question_vector,
                k_nearest_neighbors=5,
                fields="content_vector",
            )
        ],
        top=5,
        select=["content", "title", "source"],
    )

    # Step 3: Build context from search results
    context_chunks = []
    sources = []
    async for result in search_results:
        context_chunks.append(result["content"])
        if result.get("source"):
            sources.append(result["source"])

    context_text = "\n\n---\n\n".join(context_chunks) if context_chunks else "No relevant documents found."

    # Step 4: Build messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add conversation history for multi-turn chat
    if conversation_history:
        messages.extend(conversation_history[-6:])  # Last 3 exchanges

    messages.append(
        {
            "role": "user",
            "content": f"Context from USIU-Africa documents:\n{context_text}\n\n---\n\nStudent question: {question}",
        }
    )

    # Step 5: Get LLM response
    response = await chat_client.chat.completions.create(
        model=settings.azure_chat_deployment,
        messages=messages,
        temperature=0.3,
        max_tokens=1000,
    )

    answer = response.choices[0].message.content

    return {
        "answer": answer,
        "sources": list(set(sources)),
    }
