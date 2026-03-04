import base64
import requests
import json
import PyPDF2
from flask import Flask, render_template, request, Response, jsonify

app = Flask(__name__)

# Nvidia API Key from user
NVAPI_KEY = "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"
INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

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

    headers = {
        "Authorization": f"Bearer {NVAPI_KEY}",
        "Accept": "text/event-stream"
    }

    payload = {
        "model": "qwen/qwen3.5-397b-a17b",
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.60,
        "top_p": 0.95,
        "top_k": 20,
        "presence_penalty": 0,
        "repetition_penalty": 1,
        "stream": True,
        "chat_template_kwargs": {"enable_thinking": True},
    }

    def generate():
        try:
            response = requests.post(INVOKE_URL, headers=headers, json=payload, stream=True)
            # Check for non-200 responses
            if response.status_code != 200:
                yield f"data: {json.dumps({'error': f'API Error {response.status_code}: {response.text}'})}\n\n"
                return

            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    # Forward SSE exactly as returned by the API
                    yield f"{decoded}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    headers = {
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream'
    }
    return Response(generate(), headers=headers)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
