from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity


@jwt_required()
def profile():

    current_user = get_jwt_identity()

    return jsonify({
        "success": True,
        "email": current_user
    }), 200