import os
import re
import time
from collections import defaultdict
from datetime import datetime, timedelta

import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, jsonify, make_response, render_template, request

app = Flask(__name__)

# Carregar variáveis de ambiente
load_dotenv()
API_KEY = os.environ.get("API_KEY")
# Verifica se estamos em ambiente de deploy ou local
# Por padrão, ambientes locais não terão limites de uso
ENABLE_USAGE_LIMIT = os.environ.get("ENABLE_USAGE_LIMIT", "False").lower() == "true"

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# Constante para o limite de caracteres
MAX_CHARS = 500

# Sistema de controle de uso - armazenamento em memória
# Em um ambiente de produção, seria melhor usar um banco de dados
usage_tracker = defaultdict(lambda: {"count": 0, "reset_time": None})
DAILY_LIMIT = 3


@app.route("/")
def index():
    # Passar informação se a limitação está ativa para o front-end
    return render_template("index.html", usage_limit_enabled=ENABLE_USAGE_LIMIT)


@app.route("/check-limit", methods=["GET"])
def check_limit():
    # Se a limitação estiver desativada, sempre retorna que há usos disponíveis
    if not ENABLE_USAGE_LIMIT:
        return jsonify(
            {
                "remaining_uses": 999,
                "limit_reached": False,
                "daily_limit": DAILY_LIMIT,
                "limit_enabled": False,
            }
        )

    # Obter ID do usuário (usando IP como identificador simples)
    user_id = request.remote_addr

    # Verificar se o usuário já tem um registro
    user_data = usage_tracker[user_id]

    # Verificar se é um novo dia (resetar contagem)
    now = datetime.now()
    if user_data["reset_time"] is None or now > user_data["reset_time"]:
        user_data["count"] = 0
        # Definir o tempo de reset para o final do dia atual
        user_data["reset_time"] = now.replace(
            hour=23, minute=59, second=59
        ) + timedelta(seconds=1)

    # Retornar o status do limite
    remaining = max(0, DAILY_LIMIT - user_data["count"])
    return jsonify(
        {
            "remaining_uses": remaining,
            "limit_reached": remaining <= 0,
            "daily_limit": DAILY_LIMIT,
            "limit_enabled": True,
        }
    )


@app.route("/generate-commit", methods=["POST"])
def generate_commit():
    try:
        data = request.json
        text = data.get("text", "")
        language = data.get("language", "english")

        # Validar tamanho do texto (sempre aplicar esta verificação)
        if len(text) > MAX_CHARS:
            return (
                jsonify(
                    {
                        "error": (
                            "Text exceeds the 500 character limit."
                            if language == "english"
                            else "O texto excede o limite de 500 caracteres."
                        )
                    }
                ),
                400,
            )

        # Verificação de limite de uso (apenas se ativada)
        if ENABLE_USAGE_LIMIT:
            # Obter ID do usuário (usando IP como identificador simples)
            user_id = request.remote_addr

            # Verificar se o usuário já tem um registro
            user_data = usage_tracker[user_id]

            # Verificar se é um novo dia (resetar contagem)
            now = datetime.now()
            if user_data["reset_time"] is None or now > user_data["reset_time"]:
                user_data["count"] = 0
                # Definir o tempo de reset para o final do dia atual
                user_data["reset_time"] = now.replace(
                    hour=23, minute=59, second=59
                ) + timedelta(seconds=1)

            # Verificar se o usuário excedeu o limite
            if user_data["count"] >= DAILY_LIMIT:
                return (
                    jsonify(
                        {
                            "error": "Daily limit exceeded",
                            "limit_exceeded": True,
                            "daily_limit": DAILY_LIMIT,
                        }
                    ),
                    429,
                )  # 429 Too Many Requests

        # Sanitizar a entrada para prevenir prompt injection
        text = sanitize_input(text)

        # Criar prompt baseado no idioma
        if language == "portuguese":
            prompt = create_portuguese_prompt(text)
        else:
            prompt = create_english_prompt(text)

        # Fazer a chamada à API com tratamento de erro melhorado
        response = model.generate_content(prompt)

        # Incrementar o contador de uso apenas se a limitação estiver ativa
        if ENABLE_USAGE_LIMIT:
            usage_tracker[request.remote_addr]["count"] += 1
            remaining = DAILY_LIMIT - usage_tracker[request.remote_addr]["count"]
        else:
            remaining = 999  # Valor arbitrário alto para representar "ilimitado"

        # Retornar os dados de uso junto com a resposta
        return jsonify(
            {
                "message": response.text,
                "usage": {
                    "count": (
                        usage_tracker[request.remote_addr]["count"]
                        if ENABLE_USAGE_LIMIT
                        else 0
                    ),
                    "remaining": remaining,
                    "daily_limit": DAILY_LIMIT if ENABLE_USAGE_LIMIT else None,
                    "limit_enabled": ENABLE_USAGE_LIMIT,
                },
            }
        )
    except Exception as e:
        # Log do erro sem expor detalhes sensíveis
        app.logger.error(f"Error generating commit: {type(e).__name__}")

        # Resposta segura para o cliente
        error_message = (
            "An error occurred while generating the commit message."
            if language == "english"
            else "Ocorreu um erro ao gerar a mensagem de commit."
        )
        return jsonify({"error": error_message}), 500


def sanitize_input(text):
    """Sanitiza a entrada para prevenir prompt injection."""
    # Remove quaisquer comandos que possam tentar manipular o prompt
    # ou obter informações sensíveis
    patterns = [
        r"(ignore|disregard|forget)(\s+the\s+)?(\s+previous|above)(\s+instructions|prompt)",
        r"(reveal|show|give|display|print)(\s+me|us)?(\s+the|your)?(\s+api\s+key|credentials|secrets)",
        r"system\s+prompt",
        r"original\s+instructions",
    ]

    sanitized = text
    for pattern in patterns:
        sanitized = re.sub(pattern, "[removed]", sanitized, flags=re.IGNORECASE)

    return sanitized


def create_english_prompt(text):
    """Cria um prompt seguro em inglês."""
    return (
        "You are a helpful assistant that generates commit messages following the Conventional Commits specification. "
        "The user will provide a brief description or a code snippet of their changes. Your task is to:\n\n"
        "1. Identify the type of change based on the input.\n"
        "2. If applicable, identify the scope of the change.\n"
        "3. Write a clear and concise commit message in English in the format: <type>: <description>\n"
        "4. Response must be only the commit message.\n"
        f"Changes description: {text}"
    )


def create_portuguese_prompt(text):
    """Cria um prompt seguro em português."""
    return (
        "You are a helpful assistant that generates commit messages following the Conventional Commits specification. "
        "The user will provide a brief description or a code snippet of their changes. Your task is to:\n\n"
        "1. Identify the type of change based on the input.\n"
        "2. If applicable, identify the scope of the change.\n"
        "3. Write a clear and concise commit message in Portuguese in the format: <type>: <description>\n"
        "4. Response must be only the commit message.\n"
        f"Descrição das alterações: {text}"
    )


if __name__ == "__main__":
    app.run()
