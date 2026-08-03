import re


def validate_registration(data):

    required = ["name", "email", "password"]

    for field in required:
        if field not in data or not data[field]:
            return False, f"{field} is required"

    email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'

    if not re.match(email_regex, data["email"]):
        return False, "Invalid email"

    if len(data["password"]) < 8:
        return False, "Password must be at least 8 characters"

    return True, ""