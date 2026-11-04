import os
import chromadb

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTOR_DB_PATH = os.path.join(BASE_DIR, "vector_store")

client = chromadb.PersistentClient(path=VECTOR_DB_PATH)

collection = client.get_or_create_collection(
    name="learnsphere_documents"
)

def store_embeddings(chunks, embeddings, filename, user_email):

    ids = []
    metadatas = []

    for i in range(len(chunks)):
        ids.append(f"{user_email}_{filename}_{i}")

        metadatas.append({
            "user_email": user_email,
            "filename": filename,
            "chunk": str(i)
        })

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,      # <-- Removed .tolist()
        metadatas=metadatas
    )

    print(f"Stored {len(chunks)} chunks in ChromaDB.")