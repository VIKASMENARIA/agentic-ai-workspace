import base64
import requests
import json
import PyPDF2
from flask import Flask, render_template, request, Response, jsonify
from openai import OpenAI

app = Flask(__name__)

# Nvidia API Key from user
NVAPI_KEY = "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"

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = NVAPI_KEY
)

SYSTEM_PROMPT = (
    "You are Mayur AI — an intelligent, elegant, and warm conversational AI inspired by the timeless treasures of India: "
    "the vibrant grace of the Peacock (Mayura), the fierce precision and courage of the Royal Bengal Tiger, "
    "and the serene purity and wisdom of the Lotus (Kamal). "
    "You communicate like Grok and Gemini: concise, witty when appropriate, razor-sharp on facts, math, and code, "
    "and deeply insightful on complex ideas. "
    "Format responses cleanly with markdown, bullet points, and code blocks where helpful. "
    "Treat every seeker with respect, intellectual brilliance, and warmth."
)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/upload_pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.lower().endswith('.pdf'):
        try:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return jsonify({"text": text})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    messages = data.get('messages', [])
    model_name = data.get('model', 'meta/muse-glimmer-30b')
    temperature = float(data.get('temperature', 1.0))
    top_p = float(data.get('top_p', 0.7))
    max_tokens = int(data.get('max_tokens', 4096))
    
    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    # Ensure system prompt is present
    cleaned_messages = [m for m in messages if m.get('role') != 'system']
    prepared_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + cleaned_messages

    def generate():
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=prepared_messages,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                stream=True
            )

            for chunk in completion:
                if not getattr(chunk, "choices", None) or len(chunk.choices) == 0:
                    continue
                if chunk.choices[0].delta.content is not None:
                    yield f"data: {chunk.model_dump_json()}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    resp_headers = {
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream'
    }
    return Response(generate(), headers=resp_headers)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
