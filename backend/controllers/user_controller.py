from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user_model import UserModel
from models.file_model import get_user_files
from models.chat_model import get_user_chats
from database import users_collection


@jwt_required()
def profile():
    current_user = get_jwt_identity()
    user = UserModel.get_profile(current_user)

    doc_count = len(get_user_files(current_user))
    chat_count = len(get_user_chats(current_user))

    return jsonify({
        "success": True,
        "email": current_user,
        "name": user.get("name", "") if user else "",
        "doc_count": doc_count,
        "chat_count": chat_count
    }), 200


@jwt_required()
def update_name():
    current_user = get_jwt_identity()
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name cannot be empty"}), 400
    if len(name) > 60:
        return jsonify({"error": "Name too long"}), 400
    users_collection.update_one(
        {"email": current_user},
        {"$set": {"name": name}}
    )
    return jsonify({"success": True, "name": name}), 200