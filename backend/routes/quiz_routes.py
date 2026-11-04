from flask import Blueprint
from controllers.quiz_controller import (
    generate_quiz,
    generate_flashcards,
    generate_summary,
    save_result,
    get_progress,
    generate_study_plan,
)

quiz_bp = Blueprint("quiz", __name__)

quiz_bp.route("/generate",    methods=["POST"])(generate_quiz)
quiz_bp.route("/flashcards",  methods=["POST"])(generate_flashcards)
quiz_bp.route("/summary",     methods=["POST"])(generate_summary)
quiz_bp.route("/result",      methods=["POST"])(save_result)
quiz_bp.route("/progress",    methods=["GET"])(get_progress)
quiz_bp.route("/study-plan",  methods=["POST"])(generate_study_plan)
