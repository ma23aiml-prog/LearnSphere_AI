from flask import request, jsonify
from utils.vector_store import search_documents


def search():

    data = request.get_json()

    if not data or "query" not in data:
        return jsonify({
            "message": "Query required"
        }), 400


    query = data["query"]


    results = search_documents(query)


    return jsonify({
        "query": query,
        "results": results
    }), 200