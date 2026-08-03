from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import client
from routes.auth_routes import auth_bp
from flask_jwt_extended import JWTManager
from routes.user_routes import user_bp


app = Flask(__name__)
app.config.from_object(Config)
jwt = JWTManager(app)

CORS(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/user")

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


if __name__ == "__main__":
    app.run(debug=True)