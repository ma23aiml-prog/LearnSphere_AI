from flask import request, jsonify
from services.auth_service import AuthService
from utils.validators import validate_registration


def register():

    data = request.get_json()

    valid, message = validate_registration(data)

    if not valid:
        return jsonify({
            "success": False,
            "message": message
        }), 400

    success, message = AuthService.register_user(data)

    if not success:
        return jsonify({
            "success": False,
            "message": message
        }), 400

    return jsonify({
        "success": True,
        "message": message
    }), 201


def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received"
        }), 400

    email = data.get("email")
    password = data.get("password")

    success, result = AuthService.login_user(email, password)

    if not success:
        return jsonify({
            "success": False,
            "message": result
        }), 401

    return jsonify({
        "success": True,
        "token": result
    }), 200