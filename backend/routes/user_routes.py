from flask import Blueprint
from controllers.user_controller import profile, update_name

user_bp = Blueprint("user", __name__)

user_bp.route("/profile", methods=["GET"])(profile)
user_bp.route("/name",    methods=["PUT"])(update_name)