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
    data = request.json
    messages = data.get('messages', [])
    
    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    # Add the requested system message
    messages.insert(0, {"role":"system","content":"/think"})

    def generate():
        try:
            completion = client.chat.completions.create(
              model="meta/llama-3.1-70b-instruct",
              messages=messages,
              temperature=0.6,
              top_p=0.95,
              max_tokens=65536,
              frequency_penalty=0,
              presence_penalty=0,
              stream=True
            )

            for chunk in completion:
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
