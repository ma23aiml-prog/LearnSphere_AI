from database import db
from datetime import datetime


quiz_results_collection = db["quiz_results"]


def save_quiz_result(user_email, filename, score, total, questions):
    """Save a completed quiz result."""
    result = quiz_results_collection.insert_one({
        "user_email": user_email,
        "filename": filename or "All Documents",
        "score": score,
        "total": total,
        "percent": round((score / total) * 100) if total > 0 else 0,
        "questions": questions,
        "completed_at": datetime.utcnow()
    })
    return str(result.inserted_id)


def get_quiz_results(user_email, limit=50):
    """Get all quiz results for a user, newest first."""
    results = list(
        quiz_results_collection.find(
            {"user_email": user_email},
            {"_id": 0}
        ).sort("completed_at", -1).limit(limit)
    )
    return results


def get_quiz_stats(user_email):
    """Compute aggregate stats for a user."""
    results = get_quiz_results(user_email, limit=200)
    if not results:
        return {
            "total_quizzes": 0,
            "avg_score": 0,
            "best_score": 0,
            "total_questions": 0,
            "correct_answers": 0,
        }

    total_quizzes = len(results)
    percents = [r["percent"] for r in results]
    avg_score = round(sum(percents) / total_quizzes)
    best_score = max(percents)
    total_questions = sum(r["total"] for r in results)
    correct_answers = sum(r["score"] for r in results)

    return {
        "total_quizzes": total_quizzes,
        "avg_score": avg_score,
        "best_score": best_score,
        "total_questions": total_questions,
        "correct_answers": correct_answers,
    }
