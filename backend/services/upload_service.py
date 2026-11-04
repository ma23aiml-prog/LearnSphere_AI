import os
from datetime import datetime
from torch import chunk
from werkzeug.utils import secure_filename


from models.document_model import documents_collection
from utils.pdf_extractor import extract_text_from_pdf
from utils.text_splitter import split_text

class UploadService:

    @staticmethod
    def upload_pdf(file, user_email):

        if file.filename == "":
            return False, "No file selected"

        if not file.filename.lower().endswith(".pdf"):
            return False, "Only PDF files are allowed"

        filename = secure_filename(file.filename)

        upload_folder = "uploads"

        os.makedirs(upload_folder, exist_ok=True)

        filepath = os.path.join(upload_folder, filename)

        file.save(filepath)
        text = extract_text_from_pdf(filepath)
        chunks = split_text(text)
        from utils.embedding import generate_embeddings
        from utils.chroma_db import store_embeddings

        embeddings = generate_embeddings(chunks)

        store_embeddings(
            chunks,
            embeddings,
            filename,
            user_email
        )
        

        print("Number of chunks:", len(chunks))

        for i, chunk in enumerate(chunks, start=1):
            print(f"\nChunk {i}:")
            print(chunk)

        print("========== Extracted Text ==========")
        print(text)
        print("====================================")
        


        document = {
            "user_email": user_email,
            "filename": filename,
            "filepath": filepath,
            "uploaded_at": datetime.utcnow(),
            "extracted_text": text
        }

        documents_collection.insert_one(document)

        return True, filename