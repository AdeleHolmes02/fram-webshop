document.addEventListener("DOMContentLoaded", () => {
  const messagesEl = document.getElementById("chatMessages");
  const formEl = document.getElementById("chatForm");
  const inputEl = document.getElementById("chatInput");
  const sendIconEl = document.getElementById("chatSendIcon");
  const errorEl = document.getElementById("chatError");

  if (!messagesEl || !formEl || !inputEl || !sendIconEl) {
    console.warn("Chat elements missing:", { messagesEl, formEl, inputEl, sendIconEl });
    return;
  }

  const BOT_LABEL = "FRAM";
  const TEXTAREA_MAX_PX = 160;

  const ICON_SEND = "↑";
  const ICON_CANCEL = "×";

  // Backend endpoint (lokalt)
  const API_URL = "http://localhost:3001/api/chat";

  let isBusy = false;

  /* HELPERS */
  function normalize(text) {
    return text.trim().replace(/[ \t]+/g, " ");
  }

  function showError(show, msg = "") {
    if (!errorEl) return;
    errorEl.hidden = !show;
    if (msg) errorEl.textContent = msg;
  }

  function setBusy(state) {
    isBusy = state;
    inputEl.disabled = state;

    sendIconEl.style.fontSize = "";
    sendIconEl.textContent = state ? ICON_CANCEL : ICON_SEND;
  }

  function isNearBottom(thresholdPx = 100) {
    return (
      messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight <
      thresholdPx
    );
  }

  function scrollToBottom(force = false) {
    if (!force && !isNearBottom()) return;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function autoResizeTextarea() {
    inputEl.style.height = "auto";
    const next = Math.min(inputEl.scrollHeight, TEXTAREA_MAX_PX);
    inputEl.style.height = `${next}px`;
    inputEl.style.overflowY = inputEl.scrollHeight > TEXTAREA_MAX_PX ? "auto" : "hidden";
  }

  function resetTextarea() {
    inputEl.value = "";
    inputEl.style.height = "auto";
    inputEl.style.overflowY = "hidden";
  }

  function focusInput() {
    inputEl.focus({ preventScroll: true });
  }

  /* MESSAGE RENDERING */
  function createRow(role, contentEl, { isTyping = false } = {}) {
    const row = document.createElement("div");
    row.className = `chat-row chat-row--${role}`;
    if (isTyping) row.dataset.typingRow = "true";

    const name = document.createElement("div");
    name.className = "chat-name";
    name.textContent = role === "bot" ? BOT_LABEL : "";
    if (role === "user") name.setAttribute("aria-hidden", "true");

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble chat-bubble--${role}`;
    bubble.appendChild(contentEl);

    row.appendChild(name);
    row.appendChild(bubble);
    return row;
  }

  function addTextMessage(role, text) {
    const span = document.createElement("span");
    span.textContent = text;

    const shouldStick = isNearBottom();
    messagesEl.appendChild(createRow(role, span));
    requestAnimationFrame(() => scrollToBottom(shouldStick));
  }

  function addTyping() {
    const typing = document.createElement("div");
    typing.className = "chat-typing";
    typing.setAttribute("aria-label", "Typing");

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.className = "chat-dot";
      typing.appendChild(dot);
    }

    const shouldStick = isNearBottom();
    messagesEl.appendChild(createRow("bot", typing, { isTyping: true }));
    requestAnimationFrame(() => scrollToBottom(shouldStick));
  }

  function removeTyping() {
    const typingRow = messagesEl.querySelector("[data-typing-row]");
    if (typingRow) typingRow.remove();
  }

  /* AI CALL */
  async function askFram(userText) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });

    // Prøv å parse body uansett status (serveren sender json ved feil også)
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // 429 osv → bruk message fra server hvis den finnes
      const msg = data?.message || "Chat er midlertidig utilgjengelig. Prøv igjen senere.";
      throw new Error(msg);
    }

    return data.reply || "";
  }

  /* RESET (always fresh chat) */
  function startFreshChat() {
    messagesEl.innerHTML = "";
    showError(false);
    setBusy(false);

    addTextMessage("bot", "Hei! Hva kan jeg hjelpe deg med i dag?");
    resetTextarea();
    autoResizeTextarea();

    requestAnimationFrame(() => scrollToBottom(true));
    setTimeout(() => focusInput(), 0);
  }

  /* Scrollbar auto-hide toggle */
  let scrollHideTimer = null;

  messagesEl.addEventListener(
    "scroll",
    () => {
      messagesEl.classList.add("is-scrolling");
      window.clearTimeout(scrollHideTimer);
      scrollHideTimer = window.setTimeout(() => {
        messagesEl.classList.remove("is-scrolling");
      }, 700);
    },
    { passive: true }
  );

  /* EVENTS */
  inputEl.addEventListener("input", autoResizeTextarea);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formEl.requestSubmit();
    }
  });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isBusy) return;

    showError(false);

    const text = normalize(inputEl.value);
    if (!text) return;

    const shouldStick = isNearBottom();

    addTextMessage("user", text);

    resetTextarea();
    autoResizeTextarea();
    focusInput();

    setBusy(true);
    addTyping();

    try {
      const reply = await askFram(text);
      removeTyping();

      if (reply && reply.trim()) {
        addTextMessage("bot", reply);
      } else {
        addTextMessage("bot", "Beklager — jeg fikk ikke noe svar akkurat nå. Prøv igjen.");
      }
    } catch (err) {
      removeTyping();
      showError(true, err?.message || "Chat er midlertidig utilgjengelig.");
      addTextMessage("bot", "Chat er midlertidig utilgjengelig akkurat nå. Prøv igjen senere.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scrollToBottom(shouldStick));
      focusInput();
    }
  });

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) startFreshChat();
  });

  /* INIT */
  startFreshChat();
});
