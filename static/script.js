// Configuration for Marked.js and Highlight.js
const renderer = new marked.Renderer();
renderer.code = function (code, language) {
    const validLanguage = (language && hljs.getLanguage(language)) ? language : 'plaintext';
    let highlightedCode;
    try {
        highlightedCode = hljs.highlight(code, { language: validLanguage }).value;
    } catch (e) {
        highlightedCode = hljs.highlightAuto(code).value;
    }

    return `<div class="code-wrapper">
        <div class="code-header">
            <span class="code-lang">${language || 'code'}</span>
            <button class="copy-btn">
                <i class="fa-regular fa-copy"></i> Copy
            </button>
        </div>
        <pre><code class="hljs ${validLanguage}">${highlightedCode}</code></pre>
    </div>`;
};

marked.setOptions({
    renderer: renderer,
    breaks: true,
    gfm: true
});

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const attachmentPreview = document.getElementById('attachmentPreview');
const attachmentIcon = document.getElementById('attachmentIcon');
const attachmentName = document.getElementById('attachmentName');
const removeAttachment = document.getElementById('removeAttachment');

let messageHistory = [];
let currentFile = null;
let currentFileData = null;

attachBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    currentFile = file;
    attachmentName.textContent = file.name;
    if (file.type.startsWith('image/')) {
        attachmentIcon.className = 'fa-solid fa-image';
        const reader = new FileReader();
        reader.onload = (e) => { currentFileData = e.target.result; };
        reader.readAsDataURL(file);
    } else {
        attachmentIcon.className = 'fa-solid fa-file-pdf';
        currentFileData = null;
    }
    attachmentPreview.style.display = 'flex';
});

removeAttachment.addEventListener('click', clearAttachment);

function clearAttachment() {
    currentFile = null;
    currentFileData = null;
    fileInput.value = '';
    attachmentPreview.style.display = 'none';
}

userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

async function sendMessage() {
    let text = userInput.value.trim();
    if (!text && !currentFile) return;

    let displayHtml = text;
    let payloadMessage = { role: "user" };

    if (currentFile) {
        if (currentFile.type.startsWith('image/')) {
            displayHtml = `<img src="${currentFileData}" class="attached-image-msg"><br>` + text;
            payloadMessage.content = [
                { type: "text", text: text || "Please analyze this image." },
                { type: "image_url", image_url: { url: currentFileData } }
            ];
        } else if (currentFile.name.toLowerCase().endsWith('.pdf')) {
            displayHtml = `<div style="color:#ef4444; font-size:0.85em; margin-bottom: 8px;"><i class="fa-solid fa-file-pdf"></i> Attached: ${currentFile.name}</div>` + text;

            // Upload PDF to get text
            const formData = new FormData();
            formData.append('file', currentFile);

            try {
                const pdfRes = await fetch('/api/upload_pdf', { method: 'POST', body: formData });
                const pdfData = await pdfRes.json();
                if (pdfData.text) {
                    text = `[Content from attached PDF '${currentFile.name}']:\n${pdfData.text}\n\n[User Instructions]:\n${text}`;
                } else {
                    text = `[Failed to read PDF]\n\n${text}`;
                }
            } catch (err) {
                console.error("PDF upload error:", err);
            }
            payloadMessage.content = text;
        }
        clearAttachment();
    } else {
        payloadMessage.content = text;
    }

    appendMessage('user', displayHtml);
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    messageHistory.push(payloadMessage);

    // Append AI placeholder
    const aiMessageEl = createMessageElement('ai', '');
    chatMessages.appendChild(aiMessageEl);
    const contentEl = aiMessageEl.querySelector('.msg-text');

    // Add immersive typing indicator initially
    contentEl.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    scrollToBottom();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messageHistory })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error Status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = "";
        let buffer = "";

        let firstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Fix for SSE stream chunking: Only process complete lines ending in \n.
            // Incomplete lines are popped and put back into the buffer for the next chunk read.
            // This prevents "slow" parsing bugs where JSON splits across network chunks.
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep last incomplete string

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6).trim();
                    if (dataStr === '[DONE]') {
                        break;
                    }
                    if (dataStr) {
                        try {
                            const data = JSON.parse(dataStr);

                            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                                if (firstChunk) {
                                    contentEl.innerHTML = '';
                                    firstChunk = false;
                                }
                                fullText += data.choices[0].delta.content;

                                // Render safe markdown on the fly with a blinking cursor
                                const rawHtml = marked.parse(fullText);
                                contentEl.innerHTML = DOMPurify.sanitize(rawHtml) + '<span class="cursor" style="display:inline-block;width:8px;height:1.1em;background:#6366f1;animation:blink 1s step-end infinite;vertical-align:middle;margin-left:4px;border-radius:2px;box-shadow:0 0 8px rgba(99,102,241,0.8);"></span>';

                                scrollToBottom();
                            } else if (data.error) {
                                fullText += "\n\n**Error:** " + data.error;
                                contentEl.innerHTML = DOMPurify.sanitize(marked.parse(fullText));
                            }
                        } catch (e) {
                            // Silently suppress JSON parse errors for incomplete chunks
                        }
                    }
                }
            }
        }

        // Finalize (remove cursor)
        contentEl.innerHTML = DOMPurify.sanitize(marked.parse(fullText));
        messageHistory.push({ role: "assistant", content: fullText });

    } catch (error) {
        console.error('Fetch Error:', error);
        contentEl.innerHTML = `<p style="color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">Connection to inference node degraded or failed. Check the server terminal.</p>`;
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function appendMessage(sender, text) {
    const messageEl = createMessageElement(sender, text);
    chatMessages.appendChild(messageEl);
    scrollToBottom();
}

function createMessageElement(sender, text) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;

    let avatarHtml = '';
    if (sender === 'user') {
        avatarHtml = `<div class="msg-avatar user-avatar-msg"><i class="fa-solid fa-user"></i></div>`;
    } else {
        avatarHtml = `<div class="msg-avatar ai-avatar"><i class="fa-solid fa-om"></i></div>`;
    }

    let contentHtml = '';
    if (sender === 'user') {
        const escapedText = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            // Revert escapes for allowed HTML like our image and pdf previews
            .replace(/&lt;img src=&quot;(.*?)&quot; class=&quot;attached-image-msg&quot;&gt;/g, '<img src="$1" class="attached-image-msg">')
            .replace(/&lt;div style=&quot;color:#ef4444; font-size:0.85em; margin-bottom: 8px;&quot;&gt;&lt;i class=&quot;fa-solid fa-file-pdf&quot;&gt;&lt;\/i&gt; Attached: (.*?)&lt;\/div&gt;/g, '<div style="color:#ef4444; font-size:0.85em; margin-bottom: 8px;"><i class="fa-solid fa-file-pdf"></i> Attached: $1</div>')
            .replace(/&lt;br&gt;/g, '<br>'); // Specifically for the image break we added

        contentHtml = `<div class="msg-text">${escapedText}</div>`;
    } else {
        contentHtml = `<div class="msg-text">${text}</div>`;
    }

    div.innerHTML = `
        ${avatarHtml}
        <div class="msg-content">
            ${sender === 'ai' ? '<div class="msg-name">VishtaarAi Divine Response</div>' : `<div class="msg-name">Developer Node</div>`}
            ${contentHtml}
        </div>
    `;
    return div;
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Global blink styling for cursor
const style = document.createElement('style');
style.innerHTML = `@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
document.head.appendChild(style);

window.addEventListener('DOMContentLoaded', () => {
    userInput.focus();
});

// Event delegation for copy buttons
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.copy-btn');
    if (btn) {
        const codeWrapper = btn.closest('.code-wrapper');
        if (codeWrapper) {
            const codeBlock = codeWrapper.querySelector('code');
            const text = codeBlock.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalHtml = '<i class="fa-regular fa-copy"></i> Copy';
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.classList.remove('copied');
                }, 2000);
            });
        }
    }
});
