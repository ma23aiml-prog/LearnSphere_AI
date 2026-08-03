from flask import Blueprint
from controllers.user_controller import profile

user_bp = Blueprint("user", __name__)

user_bp.route("/profile", methods=["GET"])(profile)