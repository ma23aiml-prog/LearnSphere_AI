import chromadb
from utils.embedding import generate_embeddings


client = chromadb.PersistentClient(
    path="vector_store"
)

collection = client.get_collection(
    name="learnsphere_documents"
)


def semantic_search(query, user_email, top_k=3):

    # Convert question into embedding
    query_embedding = generate_embeddings([query])[0]


    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={
            "user_email": user_email
        }
    )


    documents = results["documents"][0]
    metadata = results["metadatas"][0]


    return [
        {
            "text": documents[i],
            "filename": metadata[i]["filename"],
            "chunk": metadata[i]["chunk"]
        }
        for i in range(len(documents))
    ]