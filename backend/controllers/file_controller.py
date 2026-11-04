from flask import request, jsonify
from werkzeug.utils import secure_filename
from models.file_model import save_file, get_user_files, delete_file, get_filename_by_id
from PyPDF2 import PdfReader
from utils.vector_store import add_documents, delete_documents_by_filename
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
import os


UPLOAD_FOLDER = "uploads"


# =========================
# UPLOAD PDF
# =========================
def upload_file():
    try:
        verify_jwt_in_request()
        user_email = get_jwt_identity()
    except Exception:
        return jsonify({"message": "Authentication required"}), 401

    if "file" not in request.files:
        return jsonify({"message": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"message": "No selected file"}), 400

    filename = secure_filename(file.filename)

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        return jsonify({"message": f"Failed to read PDF: {str(e)}"}), 400

    if not text.strip():
        return jsonify({"message": "Could not extract text from PDF"}), 400

    chunk_size = 500
    chunks = [
        text[i:i + chunk_size]
        for i in range(0, len(text), chunk_size)
    ]

    file_id = save_file(user_email, filename, chunks)
    add_documents(chunks, user_email, filename)

    return jsonify({
        "message": "File uploaded successfully",
        "file_id": str(file_id),
        "chunks": len(chunks),
        "embedding_status": "completed"
    }), 200


# =========================
# GET USER DOCUMENTS
# =========================
def get_files():
    try:
        verify_jwt_in_request()
        user_email = get_jwt_identity()
    except Exception:
        return jsonify({"message": "Authentication required"}), 401

    files = get_user_files(user_email)
    return jsonify({"files": files}), 200


# =========================
# DELETE DOCUMENT
# =========================
def delete_file_endpoint():
    try:
        verify_jwt_in_request()
        user_email = get_jwt_identity()
    except Exception:
        return jsonify({"message": "Authentication required"}), 401

    data = request.get_json()
    file_id = data.get("file_id") if data else None

    if not file_id:
        return jsonify({"message": "file_id required"}), 400

    # Get filename before deleting
    filename = get_filename_by_id(user_email, file_id)

    if not filename:
        return jsonify({"message": "File not found"}), 404

    # Delete from MongoDB
    deleted = delete_file(user_email, file_id)

    if not deleted:
        return jsonify({"message": "Could not delete file"}), 500

    # Delete from ChromaDB
    delete_documents_by_filename(user_email, filename)

    # Delete from disk if exists
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    return jsonify({"message": "File deleted successfully"}), 200


# =========================
# SEARCH DOCUMENTS
# =========================
def search_files():
    try:
        verify_jwt_in_request()
        user_email = get_jwt_identity()
    except Exception:
        return jsonify({"message": "Authentication required"}), 401

    query = request.args.get("q", "").strip().lower()
    if not query:
        return jsonify({"results": []}), 200

    # Search filenames
    from models.file_model import get_user_files
    all_files = get_user_files(user_email)
    results = [f for f in all_files if query in f.get("filename", "").lower()]

    return jsonify({"results": results, "query": query}), 200