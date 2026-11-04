from flask import Blueprint
from controllers.search_controller import search


search_bp = Blueprint(
    "search",
    __name__
)


search_bp.route(
    "/",
    methods=["POST"]
)(search)