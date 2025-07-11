let recognition;
let isRecognizing = false;

const chatbox = document.getElementById("chatbox");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const stopSpeechBtn = document.getElementById("stopSpeechBtn");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.innerText = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

function addMessage(text, className) {
  const msgDiv = document.createElement("div");
  msgDiv.className = className;
  msgDiv.textContent = text;

  // Add timestamp
  const timestamp = document.createElement("span");
  timestamp.className = "timestamp";
  const now = new Date();
  timestamp.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  msgDiv.appendChild(timestamp);

  chatbox.appendChild(msgDiv);
  chatbox.scrollTo({
    top: chatbox.scrollHeight,
    behavior: "smooth"
  });
}

function addTypingIndicator() {
  if (document.querySelector(".typing")) return; // Only one typing indicator
  const typingDiv = document.createElement("div");
  typingDiv.className = "typing";
  typingDiv.textContent = "Sk is typing...";
  chatbox.appendChild(typingDiv);
  chatbox.scrollTo({
    top: chatbox.scrollHeight,
    behavior: "smooth"
  });
}

function removeTypingIndicator() {
  const typingDiv = document.querySelector(".typing");
  if (typingDiv) typingDiv.remove();
}

function setLoading(isLoading) {
  if (isLoading) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<span class="spinner"></span> Sending...`;
  } else {
    sendBtn.disabled = false;
    sendBtn.innerHTML = "Send";
  }
}

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    console.warn("Text-to-Speech not supported in this browser.");
    return;
  }
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;

  // Enable stop button when speech starts
  stopSpeechBtn.disabled = false;

  utterance.onend = () => {
    stopSpeechBtn.disabled = true;
  };

  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    showToast("🔇 AI speech stopped");
    stopSpeechBtn.disabled = true;
  }
}

function sendMessage() {
  const userText = document.getElementById("userInput").value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  document.getElementById("userInput").value = "";

  addTypingIndicator();
  setLoading(true);

  fetch("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: userText }),
  })
    .then((res) => res.json())
    .then((data) => {
      removeTypingIndicator();
      setLoading(false);
      addMessage(data.reply, "bot");

      // Speak the bot reply aloud
      speakText(data.reply);
    })
    .catch((err) => {
      removeTypingIndicator();
      setLoading(false);
      addMessage("⚠️ Error communicating with server.", "bot");
    });
}

function startVoice() {
  if (isRecognizing) return;

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();
  isRecognizing = true;

  startBtn.disabled = true;
  stopBtn.disabled = false;
  startBtn.style.backgroundColor = "#777";
  startBtn.innerText = "🎧";
  showToast("🎤 Listening...");

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("userInput").value = transcript;
    sendMessage();
  };

  recognition.onerror = function (event) {
    alert("Speech recognition error: " + event.error);
  };

  recognition.onend = function () {
    isRecognizing = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    startBtn.style.backgroundColor = "#58a6ff";
    startBtn.innerText = "🎤";
    showToast("🎤 Voice input stopped.");
  };
}

function stopVoice() {
  if (!isRecognizing) return;
  recognition.stop();
  isRecognizing = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  startBtn.style.backgroundColor = "#58a6ff";
  startBtn.innerText = "🎤";
  showToast("🎤 Voice input stopped.");
}

function clearChat() {
  chatbox.innerHTML = "";
  showToast("Chat cleared");
}

document.getElementById("userInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !sendBtn.disabled) {
    sendMessage();
  }
});
