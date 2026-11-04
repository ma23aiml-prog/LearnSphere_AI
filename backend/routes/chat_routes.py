from flask import Blueprint, request, jsonify
from utils.rag_chain import ask
from models.chat_model import save_chat, get_user_chats, delete_user_chats
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity


chat_bp = Blueprint("chat", __name__)


# =========================
# ASK AI
# =========================
@chat_bp.route("/ask", methods=["POST"])
def chat():
    try:
        verify_jwt_in_request()
        user_email = get_jwt_identity()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json()
    if not data or "question" not in data:
        return jsonify({"error": "Question is required"}), 400

    question = data["question"].strip()
    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400

    try:
        answer = ask(question, user_email)
        save_chat(user_email, question, answer)
        return jsonify({"question": question, "answer": answer}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# GET CHAT HISTORY
# =========================
@chat_bp.route("/history", methods=["GET"])
def chat_history():
    try:
        verify_jwt_in_request()
        user_email = get_jwt_identity()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    try:
        chats = get_user_chats(user_email)
        return jsonify({"history": chats}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# CLEAR CHAT HISTORY
# =========================
@chat_bp.route("/history", methods=["DELETE"])
def clear_history():
    try:
        verify_jwt_in_request()
        user_email = get_jwt_identity()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    try:
        count = delete_user_chats(user_email)
        return jsonify({"message": f"Cleared {count} conversations"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500