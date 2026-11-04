from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import client
from routes.auth_routes import auth_bp
from flask_jwt_extended import JWTManager
from routes.user_routes import user_bp
from routes.upload_routes import upload_bp
from routes.file_routes import file_bp
from routes.search_routes import search_bp
from routes.chat_routes import chat_bp
from routes.quiz_routes import quiz_bp


app = Flask(__name__)
app.config.from_object(Config)
jwt = JWTManager(app)

CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/user")
app.register_blueprint(upload_bp, url_prefix="/api")
app.register_blueprint(file_bp, url_prefix="/api/files")
app.register_blueprint(search_bp, url_prefix="/api/search")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(quiz_bp, url_prefix="/api/quiz")

@app.route("/")
def home():
    return jsonify({
        "project": "LearnSphere AI",
        "version": "1.0.0",
        "status": "Running"
    })


@app.route("/test-db")
def test_db():
    try:
        client.admin.command("ping")
        return jsonify({
            "status": "success",
            "message": "MongoDB Connected Successfully"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.errorhandler(Exception)
def handle_unhandled_exception(e):
    """Return JSON for all unhandled exceptions instead of Flask's HTML page."""
    import traceback
    app.logger.error("Unhandled exception: %s", traceback.format_exc())
    return jsonify({
        "success": False,
        "message": "Internal server error. Check server logs."
    }), 500


if __name__ == "__main__":
    app.run(debug=True)