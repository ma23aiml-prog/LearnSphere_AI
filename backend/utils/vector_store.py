import os
from langchain_chroma import Chroma
from utils.embedding import embedding_model


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTOR_DB_PATH = os.path.join(BASE_DIR, "vector_store")


vector_db = Chroma(
    collection_name="learnsphere_documents",
    embedding_function=embedding_model,
    persist_directory=VECTOR_DB_PATH
)


def add_documents(chunks, user_email, filename):
    metadatas = [
        {
            "user_email": user_email,
            "filename": filename
        }
        for _ in chunks
    ]
    vector_db.add_texts(
        texts=chunks,
        metadatas=metadatas
    )


def search_documents(query, user_email, k=3):
    results = vector_db.similarity_search(
        query,
        k=k,
        filter={
            "user_email": user_email
        }
    )
    return [
        doc.page_content
        for doc in results
    ]


def delete_documents_by_filename(user_email, filename):
    try:
        collection = vector_db._collection
        results = collection.get(
            where={"$and": [{"user_email": {"$eq": user_email}}, {"filename": {"$eq": filename}}]}
        )
        ids = results.get("ids", [])
        if ids:
            collection.delete(ids=ids)
        return len(ids)
    except Exception as e:
        print("Vector delete error:", e)
        return 0