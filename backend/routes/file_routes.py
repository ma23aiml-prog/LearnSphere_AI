from flask import Blueprint
from controllers.file_controller import upload_file, get_files, delete_file_endpoint, search_files


file_bp = Blueprint("file", __name__)

# Upload PDF
file_bp.route("/upload", methods=["POST"])(upload_file)

# Get user's documents
file_bp.route("", methods=["GET"])(get_files)

# Delete document
file_bp.route("/delete", methods=["DELETE"])(delete_file_endpoint)

# Search documents
file_bp.route("/search", methods=["GET"])(search_files)