import os
from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from utils.embedding import embedding_model


# --------------------------------------------------
# Load Environment Variables
# --------------------------------------------------
load_dotenv()


# --------------------------------------------------
# Gemini API Key
# --------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

print("Gemini API Key Loaded Successfully")


# --------------------------------------------------
# Vector Store Path
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

VECTOR_DB_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "..", "vector_store")
)

print("Vector DB Path:", VECTOR_DB_PATH)


# --------------------------------------------------
# Load ChromaDB
# --------------------------------------------------
vectorstore = Chroma(
    collection_name="learnsphere_documents",
    persist_directory=VECTOR_DB_PATH,
    embedding_function=embedding_model
)

print(
    "Collection Count:",
    vectorstore._collection.count()
)


# --------------------------------------------------
# Gemini LLM
# --------------------------------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    temperature=0,
    google_api_key=GEMINI_API_KEY
)


# --------------------------------------------------
# Prompt Template
# --------------------------------------------------
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a helpful AI tutor.

You MUST answer ONLY from the provided context.

If the context contains the answer,
answer it directly.

If the answer does not exist in the context,
say that the information is not available
in the uploaded documents.

Be concise.
"""
        ),
        (
            "human",
            """
Context:

{context}

Question:

{question}
"""
        )
    ]
)


# --------------------------------------------------
# Ask Function
# --------------------------------------------------
def ask(question, user_email):

    # Retrieve only documents belonging to this user
    docs = vectorstore.similarity_search(
        question,
        k=3,
        filter={
            "user_email": user_email
        }
    )

    print("=" * 40)
    print("User:", user_email)
    print("Retrieved:", len(docs))
    print("=" * 40)


    # No relevant documents
    if not docs:
        return "No relevant documents found."


    # Display retrieved documents
    for i, doc in enumerate(docs, start=1):

        print(f"\nDocument {i}")

        print("Filename:",
              doc.metadata.get("filename"))

        print(doc.page_content)


    # Create context
    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )


    print("\n========== CONTEXT ==========")
    print(context)
    print("=============================")


    # Create prompt
    messages = prompt.format_messages(
        context=context,
        question=question
    )


    # Ask Gemini
    response = llm.invoke(messages)


    print("\n========== RAW RESPONSE ==========")
    print(response)
    print("==================================")


    # Extract response text
    if hasattr(response, "text"):
        return response.text


    if isinstance(response.content, str):
        return response.content


    if isinstance(response.content, list):

        text = ""

        for item in response.content:

            if isinstance(item, dict):

                if item.get("type") == "text":
                    text += item.get("text", "")

            else:

                if hasattr(item, "text"):
                    text += item.text

        return text.strip()


    return str(response)