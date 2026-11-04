from flask import request, jsonify
from utils.vector_store import search_documents
from services.gemini_service import generate_answer


def chat():

    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({
            "message": "Question required"
        }),400


    question = data["question"]


    # Retrieve relevant chunks
    chunks = search_documents(
        question,
        k=5
    )


    context = "\n\n".join(chunks)


    # Generate Gemini response
    answer = generate_answer(
        question,
        context
    )


    return jsonify({
        "question": question,
        "answer": answer,
        "sources": chunks
    }),200