# Mayur AI | Indic Intelligence

A clean, minimalist conversational chatbot inspired by **Gemini** and **Grok**, infused with the radiant beauty of India's national treasures: the **Peacock** (Mayura), the **Royal Bengal Tiger** (Bagh), and the **Sacred Lotus** (Kamal).

Powered by Meta's **`meta/muse-glimmer-30b`** on NVIDIA NeMo.

---

## 🦚 Highlights

- **Clean Grok & Gemini Simplicity**: Minimalist sidebar with recent sessions, centered Gemini-style welcome hero, and floating pill input capsule.
- **Indian Heritage Aurora Gradients**:
  - 🦚 **Mayura (Peacock Aurora)**: Iridescent cyan and royal blue into saffron.
  - 🐅 **Bagh (Royal Tiger Ember)**: Fiery sunset amber, gold, and saffron.
  - 🪷 **Kamal (Sacred Lotus Bloom)**: Deep rose, magenta, and cyan bloom.
- **Multimodal Inputs**: Seamlessly upload and analyze images or extract text from PDFs.
- **Real-Time Streaming**: High-speed SSE responses with smooth typewriter cursor and markdown formatting.
- **Message Utility**: 1-click code block copying, response copy, and text-to-speech voice read-aloud.

---

## ⚡ Technical Setup

Configured in `app.py`:
- **Inference Provider**: NVIDIA NeMo Integrate Endpoint (`https://integrate.api.nvidia.com/v1`)
- **Model**: `meta/muse-glimmer-30b`
- **Parameters**: `temperature=1.0`, `top_p=0.7`, `max_tokens=4096`, `stream=True`

---

## 🚀 Getting Started

1. **Install requirements**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Flask server**:
   ```bash
   python app.py
   ```

3. **Open the browser**:
   Navigate to `http://localhost:5000`
