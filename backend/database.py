from pymongo import MongoClient
from config import Config

client = MongoClient(Config.MONGO_URI)

db = client["learnsphere_ai"]

users_collection = db["users"]
documents_collection = db["documents"]
quiz_collection = db["quizzes"]