from database import db
from datetime import datetime
from bson import ObjectId

files_collection = db["uploaded_files"]


def save_file(user_email, filename, chunks):
    result = files_collection.insert_one({
        "user_email": user_email,
        "filename": filename,
        "chunk_count": len(chunks),
        "uploaded_at": datetime.utcnow()
    })
    return str(result.inserted_id)


def get_user_files(user_email):
    files = list(
        files_collection.find(
            {"user_email": user_email}
        ).sort("uploaded_at", -1)
    )
    for f in files:
        f["file_id"] = str(f["_id"])
        del f["_id"]
    return files


def delete_file(user_email, file_id):
    result = files_collection.delete_one({
        "_id": ObjectId(file_id),
        "user_email": user_email
    })
    return result.deleted_count > 0


def get_filename_by_id(user_email, file_id):
    doc = files_collection.find_one({
        "_id": ObjectId(file_id),
        "user_email": user_email
    })
    return doc["filename"] if doc else None