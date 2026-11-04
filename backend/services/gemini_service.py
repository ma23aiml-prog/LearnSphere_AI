from google import genai
import os


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_answer(question, context):

    prompt = f"""
You are LearnSphere AI, an intelligent study assistant.

Answer the student's question using only the provided study material.

Context:
{context}

Question:
{question}

Instructions:
- Explain clearly.
- Use simple examples.
- If the answer is not available in the context, say:
"I could not find this information in the uploaded material."
"""


    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=prompt
    )

    return response.text