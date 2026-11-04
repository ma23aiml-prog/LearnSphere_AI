from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
import os
import json
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_chroma import Chroma
from utils.embedding import embedding_model
from models.quiz_model import save_quiz_result, get_quiz_results, get_quiz_stats
from dotenv import load_dotenv

load_dotenv()

# --------------------------------------------------
# LLM
# --------------------------------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.4,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# --------------------------------------------------
# Prompts
# --------------------------------------------------
QUIZ_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert quiz creator.
Based on the provided context, generate exactly {count} multiple choice questions.
Return ONLY a valid JSON array — no markdown, no code blocks, no extra text.
Format:
[
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Brief explanation why this is correct."
  }}
]"""),
    ("human", "Context:\n{context}\n\nGenerate {count} quiz questions from this content.")
])

FLASHCARD_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert educator creating flashcards.
Based on the provided context, generate exactly {count} flashcards.
Return ONLY a valid JSON array — no markdown, no code blocks, no extra text.
Format:
[
  {{
    "front": "Question or concept on the front of the card",
    "back": "Clear, concise answer or explanation"
  }}
]"""),
    ("human", "Context:\n{context}\n\nGenerate {count} flashcards from this content.")
])

SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert at summarising educational content.
Create a clear, structured summary of the provided content.
Use bullet points for key concepts. Be concise but comprehensive.
Do NOT use markdown code blocks. Use plain text with bullet points (•)."""),
    ("human", "Content to summarise:\n{context}")
])

# --------------------------------------------------
# Helpers
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTOR_DB_PATH = os.path.join(BASE_DIR, "vector_store")


def _get_user_context(user_email, filename=None, k=10):
    """Fetch document chunks from ChromaDB for a user (optionally filtered by filename)."""
    try:
        db = Chroma(
            collection_name="learnsphere_documents",
            embedding_function=embedding_model,
            persist_directory=VECTOR_DB_PATH
        )
        where = {"user_email": {"$eq": user_email}}
        if filename:
            where = {"$and": [
                {"user_email": {"$eq": user_email}},
                {"filename": {"$eq": filename}}
            ]}
        results = db._collection.get(where=where, limit=k)
        docs = results.get("documents", [])
        return "\n\n".join(docs) if docs else ""
    except Exception as e:
        print("Context fetch error:", e)
        return ""


def _parse_json_response(text):
    """Robustly extract JSON array from an LLM response."""
    # Strip markdown code fences if present
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError("No JSON array found in LLM response")
    return json.loads(text[start:end + 1])


def _auth():
    """Verify JWT and return user email, or raise Exception."""
    verify_jwt_in_request()
    return get_jwt_identity()


# --------------------------------------------------
# Endpoints
# --------------------------------------------------

def generate_quiz():
    try:
        user_email = _auth()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json() or {}
    filename = data.get("filename") or None
    count = min(int(data.get("count", 5)), 10)

    context = _get_user_context(user_email, filename, k=12)
    if not context.strip():
        return jsonify({"error": "No document content found. Upload a PDF first."}), 400

    try:
        messages = QUIZ_PROMPT.format_messages(context=context, count=count)
        response = llm.invoke(messages)
        text = response.content if isinstance(response.content, str) else str(response.content)
        questions = _parse_json_response(text)
        return jsonify({"questions": questions, "count": len(questions)}), 200
    except Exception as e:
        return jsonify({"error": f"Quiz generation failed: {str(e)}"}), 500


def generate_flashcards():
    try:
        user_email = _auth()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json() or {}
    filename = data.get("filename") or None
    count = min(int(data.get("count", 8)), 15)

    context = _get_user_context(user_email, filename, k=12)
    if not context.strip():
        return jsonify({"error": "No document content found. Upload a PDF first."}), 400

    try:
        messages = FLASHCARD_PROMPT.format_messages(context=context, count=count)
        response = llm.invoke(messages)
        text = response.content if isinstance(response.content, str) else str(response.content)
        cards = _parse_json_response(text)
        return jsonify({"cards": cards, "count": len(cards)}), 200
    except Exception as e:
        return jsonify({"error": f"Flashcard generation failed: {str(e)}"}), 500


def generate_summary():
    try:
        user_email = _auth()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json() or {}
    filename = data.get("filename") or None

    context = _get_user_context(user_email, filename, k=15)
    if not context.strip():
        return jsonify({"error": "No document content found. Upload a PDF first."}), 400

    try:
        messages = SUMMARY_PROMPT.format_messages(context=context)
        response = llm.invoke(messages)
        text = response.content if isinstance(response.content, str) else str(response.content)
        return jsonify({
            "summary": text.strip(),
            "filename": filename or "All Documents"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Summary generation failed: {str(e)}"}), 500


def save_result():
    """Save a completed quiz result sent from the frontend."""
    try:
        user_email = _auth()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json() or {}
    score   = data.get("score", 0)
    total   = data.get("total", 0)
    filename = data.get("filename") or None
    questions = data.get("questions", [])

    if total == 0:
        return jsonify({"error": "Invalid result data"}), 400

    result_id = save_quiz_result(user_email, filename, score, total, questions)
    return jsonify({"message": "Result saved", "result_id": result_id}), 200


def get_progress():
    """Return quiz history + aggregate stats for the user."""
    try:
        user_email = _auth()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    stats   = get_quiz_stats(user_email)
    history = get_quiz_results(user_email, limit=20)

    # Convert datetime objects to strings for JSON serialisation
    for h in history:
        if "completed_at" in h and hasattr(h["completed_at"], "isoformat"):
            h["completed_at"] = h["completed_at"].isoformat()

    return jsonify({"stats": stats, "history": history}), 200


STUDY_PLAN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert study coach and educator.
Based on the provided learning material, create a detailed 7-day study plan.
Return ONLY a valid JSON array — no markdown, no code blocks, no extra text.
Each day should have 2-3 specific tasks based on the actual content.
Format:
[
  {{
    "day": 1,
    "title": "Day 1: Introduction & Core Concepts",
    "tasks": [
      "Read and understand: [specific topic from document]",
      "Create flashcards for: [specific terms]",
      "Practice: [specific exercise]"
    ],
    "focus": "Foundation",
    "duration": "45 mins"
  }}
]"""),
    ("human", "Learning material:\n{context}\n\nCreate a 7-day study plan to master this content.")
])


def generate_study_plan():
    try:
        user_email = _auth()
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json() or {}
    filename = data.get("filename") or None

    context = _get_user_context(user_email, filename, k=15)
    if not context.strip():
        return jsonify({"error": "No document content found. Upload a PDF first."}), 400

    try:
        messages = STUDY_PLAN_PROMPT.format_messages(context=context)
        response = llm.invoke(messages)
        text = response.content if isinstance(response.content, str) else str(response.content)
        plan = _parse_json_response(text)
        return jsonify({"plan": plan, "filename": filename or "All Documents"}), 200
    except Exception as e:
        return jsonify({"error": f"Study plan generation failed: {str(e)}"}), 500
