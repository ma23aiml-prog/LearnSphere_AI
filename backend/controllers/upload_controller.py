from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.upload_service import UploadService


@jwt_required()
def upload_pdf():

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "message": "No file uploaded"
        }), 400

    file = request.files["file"]
    print("Filename:", file.filename)
    print("Content-Type:", file.content_type)

    user_email = get_jwt_identity()

    success, result = UploadService.upload_pdf(file, user_email)

    if not success:
        return jsonify({
            "success": False,
            "message": result
        }), 400

    return jsonify({
        "success": True,
        "message": "PDF uploaded successfully",
        "filename": result
    }), 201