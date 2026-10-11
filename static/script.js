/**
 * MAYUR AI — GROK & GEMINI CHATBOT WITH GODLY-LEVEL ANIMATIONS
 * Powered by Meta Muse Glimmer 30B via NVIDIA NeMo
 */

// ==========================================================================
// 1. STATE & INITIALIZATION
// ==========================================================================
let messageHistory = [];
let currentFile = null;
let currentFileData = null;
let currentFileType = null;
let activePalette = localStorage.getItem('mayur_palette') || 'mayura';
let chatSessions = JSON.parse(localStorage.getItem('mayur_recents') || '[]');

// ==========================================================================
// 2. MARKED.JS & HIGHLIGHT.JS SETUP
// ==========================================================================
const renderer = new marked.Renderer();

renderer.code = function (arg1, arg2) {
    let code = typeof arg1 === 'object' ? arg1.text : arg1;
    let language = typeof arg1 === 'object' ? arg1.lang : arg2;
    code = code || '';
    const validLang = (language && hljs.getLanguage(language)) ? language : 'plaintext';
    let highlighted;
    try {
        highlighted = hljs.highlight(code, { language: validLang }).value;
    } catch (e) {
        try {
            highlighted = hljs.highlightAuto(code).value;
        } catch (err) {
            highlighted = code;
        }
    }

    return `<div class="code-box">
        <div class="code-top">
            <span>${language || 'code'}</span>
            <button class="copy-code-btn" onclick="copyCode(this)">
                <i class="fa-regular fa-copy"></i> Copy
            </button>
        </div>
        <pre><code class="hljs ${validLang}">${highlighted}</code></pre>
    </div>`;
};

marked.setOptions({
    renderer: renderer,
    breaks: true,
    gfm: true
});

window.copyCode = function (btn) {
    const code = btn.closest('.code-box').querySelector('code').innerText;
    navigator.clipboard.writeText(code).then(() => {
        playClickSound();
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        setTimeout(() => btn.innerHTML = original, 2000);
    });
};

// ==========================================================================
// 3. SOUND SYNTHESIS (WEB AUDIO API - ZERO ASSETS)
// ==========================================================================
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playClickSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.035);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.035);
    } catch (e) { }
}

function playSendSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) { }
}

function playCompleteSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const freqs = [587.33, 739.99, 880.00]; // D5, F#5, A5
        freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
            gain.gain.setValueAtTime(0.025, ctx.currentTime + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.05 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.05);
            osc.stop(ctx.currentTime + idx * 0.05 + 0.35);
        });
    } catch (e) { }
}

// ==========================================================================
// 4. GODLY FLUID MAGNETIC CURSOR ENGINE
// ==========================================================================
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
let mouseX = -100, mouseY = -100;
let ringX = -100, ringY = -100;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursorDot) {
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
    }
});

function animateCursorRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    if (cursorRing) {
        cursorRing.style.left = `${ringX}px`;
        cursorRing.style.top = `${ringY}px`;
    }
    requestAnimationFrame(animateCursorRing);
}
requestAnimationFrame(animateCursorRing);

function updateCursorListeners() {
    const targets = document.querySelectorAll('button, a, .prompt-card, textarea, input, .recent-chat-item, .theme-pill');
    targets.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
}

// ==========================================================================
// 5. AMBIENT PARTICLES CANVAS
// ==========================================================================
const ambientCanvas = document.getElementById('ambientCanvas');
const actx = ambientCanvas ? ambientCanvas.getContext('2d') : null;
let particles = [];
let cw = 0, ch = 0;

function resizeCanvas() {
    if (!ambientCanvas) return;
    cw = ambientCanvas.width = window.innerWidth;
    ch = ambientCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class StardustParticle {
    constructor(x, y, color, speed) {
        this.x = x || Math.random() * cw;
        this.y = y || Math.random() * ch;
        this.size = Math.random() * 2 + 0.8;
        this.color = color || '#00b4d8';
        this.vx = (Math.random() - 0.5) * (speed || 0.4);
        this.vy = (Math.random() - 0.5) * (speed || 0.4);
        this.alpha = Math.random() * 0.4 + 0.1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = cw;
        if (this.x > cw) this.x = 0;
        if (this.y < 0) this.y = ch;
        if (this.y > ch) this.y = 0;
    }
    draw() {
        if (!actx) return;
        actx.save();
        actx.globalAlpha = this.alpha;
        actx.fillStyle = this.color;
        actx.beginPath();
        actx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        actx.fill();
        actx.restore();
    }
}

for (let i = 0; i < 35; i++) {
    const colors = ['#00b4d8', '#ff9933', '#ff4d80', '#d4af37'];
    particles.push(new StardustParticle(null, null, colors[Math.floor(Math.random() * colors.length)]));
}

function triggerSparkBurst(x, y) {
    const burstX = x || cw / 2;
    const burstY = y || ch - 80;
    const colors = ['#00b4d8', '#ff9933', '#ff4d80', '#d4af37', '#ffffff'];
    for (let i = 0; i < 30; i++) {
        const p = new StardustParticle(burstX, burstY, colors[Math.floor(Math.random() * colors.length)], 4.5);
        p.alpha = 0.9;
        particles.push(p);
    }
    if (particles.length > 70) particles.splice(0, 30);
}

function renderCanvas() {
    if (!actx || !ambientCanvas) return;
    actx.clearRect(0, 0, cw, ch);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(renderCanvas);
}
requestAnimationFrame(renderCanvas);

// ==========================================================================
// 6. 3D CARD PERSPECTIVE TILT & SPECULAR SHEEN (GODLY POLISH)
// ==========================================================================
function initCardTilts() {
    const cards = document.querySelectorAll('.prompt-card');
    cards.forEach(card => {
        const glow = card.querySelector('.card-glow');

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -7;
            const rotateY = ((x - centerX) / centerX) * 7;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;

            if (glow) {
                glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.16), transparent 60%)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}
initCardTilts();

// ==========================================================================
// 7. DOM ELEMENTS
// ==========================================================================
const chatViewport = document.getElementById('chatViewport');
const welcomeContainer = document.getElementById('welcomeContainer');
const messagesContainer = document.getElementById('messagesContainer');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');

// Attachments
const dockAttachmentPreview = document.getElementById('dockAttachmentPreview');
const attachmentIcon = document.getElementById('attachmentIcon');
const attachmentName = document.getElementById('attachmentName');
const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');

// Sidebar & Layout
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const newChatBtn = document.getElementById('newChatBtn');
const headerNewChatBtn = document.getElementById('headerNewChatBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const recentsList = document.getElementById('recentsList');

// Theme
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeLabel = document.getElementById('themeLabel');

// ==========================================================================
// 8. HERITAGE PALETTE MODES (PEACOCK, TIGER, LOTUS)
// ==========================================================================
function applyPalette(palette) {
    document.body.classList.remove('theme-mayura', 'theme-tiger', 'theme-lotus');
    document.body.classList.add(`theme-${palette}`);
    activePalette = palette;
    localStorage.setItem('mayur_palette', palette);

    document.querySelectorAll('.theme-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-palette') === palette);
    });

    const emblemIcon = document.querySelector('.emblem-symbol');
    const heroEmblem = document.querySelector('.hero-emblem-icon');
    const iconMap = { mayura: '🦚', tiger: '🐅', lotus: '🪷' };
    if (emblemIcon) emblemIcon.textContent = iconMap[palette] || '🦚';
    if (heroEmblem) heroEmblem.textContent = iconMap[palette] || '🦚';
}

document.querySelectorAll('.theme-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        playClickSound();
        const pal = pill.getAttribute('data-palette');
        applyPalette(pal);
    });
});
applyPalette(activePalette);

// Light / Dark Theme Toggle
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('mayur_theme', theme);
    if (themeLabel) {
        themeLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        playClickSound();
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });
}
const savedTheme = localStorage.getItem('mayur_theme') || 'dark';
applyTheme(savedTheme);

// ==========================================================================
// 9. SIDEBAR COLLAPSE & MOBILE CONTROLS
// ==========================================================================
function toggleSidebar() {
    playClickSound();
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
        sidebarBackdrop.classList.toggle('open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

toggleSidebarBtn?.addEventListener('click', toggleSidebar);
collapseSidebarBtn?.addEventListener('click', toggleSidebar);
sidebarBackdrop?.addEventListener('click', toggleSidebar);

// New Chat
function resetChat() {
    playClickSound();
    messageHistory = [];
    messagesContainer.innerHTML = '';
    welcomeContainer.style.display = 'block';
    clearAttachment();
    promptInput.value = '';
    promptInput.style.height = 'auto';
    promptInput.focus();
}

newChatBtn?.addEventListener('click', resetChat);
headerNewChatBtn?.addEventListener('click', resetChat);
clearChatBtn?.addEventListener('click', resetChat);

// Keyboard shortcut ⌘K / Ctrl+K for New Chat
window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        resetChat();
    }
});

// ==========================================================================
// 10. RECENTS CHAT SESSIONS
// ==========================================================================
function renderRecents() {
    if (!recentsList) return;
    if (chatSessions.length === 0) {
        recentsList.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted); padding:4px 8px;">No recent chats</span>`;
        return;
    }
    recentsList.innerHTML = chatSessions.slice(0, 10).map((item) => `
        <div class="recent-chat-item" onclick="loadRecentPrompt('${encodeURIComponent(item.title)}')">
            <span><i class="fa-regular fa-message" style="margin-right:8px; font-size:0.75rem;"></i>${item.title}</span>
        </div>
    `).join('');
    updateCursorListeners();
}

window.loadRecentPrompt = function (encTitle) {
    playClickSound();
    const title = decodeURIComponent(encTitle);
    promptInput.value = title;
    sendMessage();
};

function addRecent(title) {
    const cleanTitle = title.slice(0, 34) + (title.length > 34 ? '...' : '');
    chatSessions = chatSessions.filter(c => c.title !== cleanTitle);
    chatSessions.unshift({ title: cleanTitle, time: Date.now() });
    localStorage.setItem('mayur_recents', JSON.stringify(chatSessions));
    renderRecents();
}
renderRecents();

// ==========================================================================
// 11. PROMPT CARDS (GEMINI STYLE)
// ==========================================================================
document.querySelectorAll('.prompt-card').forEach(card => {
    card.addEventListener('click', () => {
        playClickSound();
        const prompt = card.getAttribute('data-prompt');
        if (prompt) {
            promptInput.value = prompt;
            sendMessage();
        }
    });
});

// ==========================================================================
// 12. ATTACHMENT HANDLING (IMAGE & PDF)
// ==========================================================================
if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => {
        playClickSound();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        currentFile = file;
        attachmentName.textContent = file.name;

        if (file.type.startsWith('image/')) {
            currentFileType = 'image';
            attachmentIcon.className = 'fa-solid fa-image';
            const reader = new FileReader();
            reader.onload = (re) => {
                currentFileData = re.target.result;
                dockAttachmentPreview.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        } else {
            currentFileType = 'pdf';
            attachmentIcon.className = 'fa-solid fa-file-pdf';
            currentFileData = null;
            dockAttachmentPreview.style.display = 'flex';
        }
    });
}

removeAttachmentBtn?.addEventListener('click', () => {
    playClickSound();
    clearAttachment();
});

function clearAttachment() {
    currentFile = null;
    currentFileData = null;
    currentFileType = null;
    if (fileInput) fileInput.value = '';
    if (dockAttachmentPreview) dockAttachmentPreview.style.display = 'none';
}

// ==========================================================================
// 13. TEXTAREA AUTO-RESIZE & KEY SHORTCUTS
// ==========================================================================
if (promptInput) {
    promptInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    promptInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

sendBtn?.addEventListener('click', sendMessage);

// ==========================================================================
// 14. CHAT STREAMING WITH META MUSE GLIMMER 30B
// ==========================================================================
async function sendMessage() {
    let text = promptInput.value.trim();
    if (!text && !currentFile) return;

    // Hide welcome screen
    if (welcomeContainer) welcomeContainer.style.display = 'none';

    playSendSound();
    triggerSparkBurst(window.innerWidth / 2, window.innerHeight - 80);

    let displayHtml = text;
    let payloadMessage = { role: "user" };

    if (currentFile) {
        if (currentFileType === 'image') {
            displayHtml = `<img src="${currentFileData}" style="max-width:320px; border-radius:12px; margin-bottom:8px; display:block;"><br>` + text;
            payloadMessage.content = [
                { type: "text", text: text || "Please examine this image." },
                { type: "image_url", image_url: { url: currentFileData } }
            ];
        } else if (currentFile.name.toLowerCase().endsWith('.pdf')) {
            displayHtml = `<div style="color:var(--tiger-saffron); font-size:0.85em; margin-bottom:6px;"><i class="fa-solid fa-file-pdf"></i> Attached: ${currentFile.name}</div>` + text;

            const formData = new FormData();
            formData.append('file', currentFile);
            try {
                const pdfRes = await fetch('/api/upload_pdf', { method: 'POST', body: formData });
                const pdfData = await pdfRes.json();
                if (pdfData.text) {
                    text = `[Content from attached PDF '${currentFile.name}']:\n${pdfData.text}\n\n[User Query]:\n${text}`;
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

    // Append User Message
    appendMessage('user', displayHtml);
    promptInput.value = '';
    promptInput.style.height = 'auto';
    sendBtn.disabled = true;

    messageHistory.push(payloadMessage);
    if (text) addRecent(text);

    // Create AI Placeholder Message
    const aiMessageEl = createMessageElement('ai', '');
    messagesContainer.appendChild(aiMessageEl);
    const bodyEl = aiMessageEl.querySelector('.message-body');

    bodyEl.innerHTML = `
        <div class="typing-dots">
            <span></span><span></span><span></span>
        </div>
    `;
    scrollToBottom();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messageHistory,
                model: "meta/muse-glimmer-30b",
                temperature: 1.0,
                top_p: 0.7,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            throw new Error(`Inference Status: ${response.status}`);
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
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6).trim();
                    if (dataStr === '[DONE]') break;
                    if (dataStr) {
                        let data;
                        try {
                            data = JSON.parse(dataStr);
                        } catch (e) {
                            continue;
                        }

                        if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                            if (firstChunk) {
                                bodyEl.innerHTML = '';
                                firstChunk = false;
                            }
                            fullText += data.choices[0].delta.content;

                            try {
                                bodyEl.innerHTML = DOMPurify.sanitize(marked.parse(fullText), {
                                    ADD_ATTR: ['class', 'target', 'onclick', 'style'],
                                    ADD_TAGS: ['span', 'code', 'button']
                                }) + '<span class="mayur-cursor"></span>';
                                scrollToBottom();
                            } catch (err) {
                                bodyEl.innerText = fullText;
                            }
                        } else if (data.error) {
                            fullText += "\n\n**Notice:** " + data.error;
                            bodyEl.innerHTML = DOMPurify.sanitize(marked.parse(fullText));
                        }
                    }
                }
            }
        }

        // Finalize AI message
        try {
            bodyEl.innerHTML = DOMPurify.sanitize(marked.parse(fullText), {
                ADD_ATTR: ['class', 'target', 'onclick', 'style'],
                ADD_TAGS: ['span', 'code', 'button']
            });
        } catch (err) {
            bodyEl.innerText = fullText;
        }

        messageHistory.push({ role: "assistant", content: fullText });
        playCompleteSound();
        triggerSparkBurst(window.innerWidth / 2, 200);
        setupMessageActions(aiMessageEl, fullText);
        updateCursorListeners();

    } catch (err) {
        console.error("Chat error:", err);
        bodyEl.innerHTML = `<span style="color:#ef4444;"><i class="fa-solid fa-circle-exclamation"></i> Could not reach the inference node. Please check your connection or server console.</span>`;
    } finally {
        sendBtn.disabled = false;
        promptInput.focus();
    }
}

function appendMessage(sender, text) {
    const el = createMessageElement(sender, text);
    messagesContainer.appendChild(el);
    scrollToBottom();
    updateCursorListeners();
}

function createMessageElement(sender, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-message ${sender}`;

    const iconMap = { mayura: '🦚', tiger: '🐅', lotus: '🪷' };
    const avatarIcon = iconMap[activePalette] || '🦚';

    if (sender === 'ai') {
        wrapper.innerHTML = `
            <div class="message-avatar">${avatarIcon}</div>
            <div class="message-body">${content}</div>
        `;
    } else {
        wrapper.innerHTML = `
            <div class="message-body">${content}</div>
        `;
    }

    return wrapper;
}

function setupMessageActions(messageEl, fullText) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="msg-action-btn copy-btn" title="Copy response">
            <i class="fa-regular fa-copy"></i>
        </button>
        <button class="msg-action-btn speak-btn" title="Read aloud">
            <i class="fa-solid fa-volume-high"></i>
        </button>
    `;

    const body = messageEl.querySelector('.message-body');
    body.appendChild(actionsDiv);

    const copyBtn = actionsDiv.querySelector('.copy-btn');
    const speakBtn = actionsDiv.querySelector('.speak-btn');

    copyBtn.addEventListener('click', () => {
        playClickSound();
        navigator.clipboard.writeText(fullText).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>', 2000);
        });
    });

    speakBtn.addEventListener('click', () => {
        playClickSound();
        if ('speechSynthesis' in window) {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                return;
            }
            const cleanText = fullText.replace(/[#*`_\[\]()]/g, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    });
}

function scrollToBottom() {
    chatViewport.scrollTop = chatViewport.scrollHeight;
}

// Initial setup
window.addEventListener('DOMContentLoaded', () => {
    promptInput.focus();
    updateCursorListeners();
});
