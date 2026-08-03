import bcrypt
from flask_jwt_extended import create_access_token
from models.user_model import UserModel


class AuthService:

    @staticmethod
    def hash_password(password):
        return bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

    @staticmethod
    def register_user(data):

        existing = UserModel.find_by_email(data["email"])

        if existing:
            return False, "Email already registered"

        data["password"] = AuthService.hash_password(data["password"])

        UserModel.create_user(data)

        return True, "User registered successfully"

    @staticmethod
    def login_user(email, password):

        user = UserModel.find_by_email(email)

        if not user:
            return False, "User not found"

        if not bcrypt.checkpw(
            password.encode("utf-8"),
            user["password"].encode("utf-8")
        ):
            return False, "Invalid password"

        token = create_access_token(identity=user["email"])

        return True, token