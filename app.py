import os

import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Carregar variáveis de ambiente
load_dotenv()
API_KEY = os.environ.get("API_KEY")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate-commit", methods=["POST"])
def generate_commit():
    data = request.json
    text = data.get("text", "")
    language = data.get("language", "english")

    # Criar prompt baseado no idioma
    if language == "portuguese":
        prompt = (
            "You are a helpful assistant that generates commit messages following the Conventional Commits specification. "
            "The user will provide a brief description or a code snippet of their changes. Your task is to:\n\n"
            "1. Identify the type of change based on the input.\n"
            "2. If applicable, identify the scope of the change.\n"
            "3. Write a clear and concise commit message in Portuguese in the format: <type>: <description>\n"
            "4. Response must be only the commit message.\n"
            f"{text}"
        )
    else:
        prompt = (
            "You are a helpful assistant that generates commit messages following the Conventional Commits specification. "
            "The user will provide a brief description or a code snippet of their changes. Your task is to:\n\n"
            "1. Identify the type of change based on the input.\n"
            "2. If applicable, identify the scope of the change.\n"
            "3. Write a clear and concise commit message in English in the format: <type>: <description>\n"
            "4. Response must be only the commit message.\n"
            f"{text}"
        )

    try:
        response = model.generate_content(prompt)
        return jsonify({"message": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
