from database import db
from datetime import datetime


chat_collection = db["chat_history"]


def save_chat(user_email, question, answer):
    result = chat_collection.insert_one({
        "user_email": user_email,
        "question": question,
        "answer": answer,
        "created_at": datetime.utcnow()
    })
    return str(result.inserted_id)


def get_user_chats(user_email):
    return list(
        chat_collection.find(
            {"user_email": user_email},
            {
                "_id": 0,
                "question": 1,
                "answer": 1,
                "created_at": 1
            }
        ).sort("created_at", -1)
    )


def delete_user_chats(user_email):
    result = chat_collection.delete_many({"user_email": user_email})
    return result.deleted_count