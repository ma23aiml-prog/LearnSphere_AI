from flask import Blueprint
from controllers.upload_controller import upload_pdf

upload_bp = Blueprint("upload", __name__)

upload_bp.route("/upload", methods=["POST"])(upload_pdf)