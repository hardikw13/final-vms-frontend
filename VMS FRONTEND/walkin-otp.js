const FALLBACK_DATA = {
  brand: { title: "Walk-in Registration" },
  steps: [
    { key: "photo", label: "Photo" },
    { key: "details", label: "Details" },
    { key: "otp", label: "OTP" }
  ],
  currentStep: "otp",
  title: "Verify Your Email",
  subtitlePrefix: "We've sent a 6 digit verification code to",
  changeEmailText: "Change Email",
  changeEmailLink: "walkin-details.html",
  timerLabel: "Code expires in",
  timerSeconds: 299,
  verifyButtonText: "Verify OTP",
  resendPrompt: "Didn't receive the code?",
  resendButtonText: "Resend OTP",
  securityNoteText: "For security, do not share this code with anyone",
  nextPage: "walkin-success.html"
};

async function loadData() {
  try {
    const res = await fetch("walkin-otp-data.json");
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch (err) {
    console.warn("Falling back to inline data:", err.message);
    return FALLBACK_DATA;
  }
}

function renderStepIndicator(container, steps, currentKey) {
  container.innerHTML = "";
  const currentIndex = steps.findIndex((s) => s.key === currentKey);
  steps.forEach((step, i) => {
    const state = i < currentIndex ? "completed" : i === currentIndex ? "active" : "upcoming";
    const stepEl = document.createElement("div");
    stepEl.className = `step ${state}`;
    stepEl.innerHTML = `
      <span class="step-circle">${state === "completed" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : i + 1}</span>
      <span class="step-label">${step.label}</span>
    `;
    container.appendChild(stepEl);
    if (i < steps.length - 1) {
      const line = document.createElement("div");
      line.className = `step-line ${i < currentIndex ? "completed" : ""}`;
      container.appendChild(line);
    }
  });
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return "you***@example.com";
  const [name, domain] = email.split("@");
  const visible = name.slice(0, Math.min(3, name.length));
  return `${visible}***@${domain}`;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

(async function init() {
  const data = await loadData();

  document.getElementById("brandTitle").textContent = data.brand.title;
  renderStepIndicator(document.getElementById("stepIndicator"), data.steps, data.currentStep);

  document.getElementById("otpTitle").textContent = data.title;
  document.getElementById("changeEmailLink").textContent = data.changeEmailText;
  document.getElementById("changeEmailLink").href = data.changeEmailLink;
  document.getElementById("timerLabel").textContent = data.timerLabel;
  document.getElementById("verifyBtn").textContent = data.verifyButtonText;
  document.getElementById("resendPrompt").textContent = data.resendPrompt;
  document.getElementById("resendBtn").textContent = data.resendButtonText;
  document.getElementById("securityNote").lastChild.textContent = ` ${data.securityNoteText}`;

  // Pull the email entered on the Details page for the "sent to ***" line
  let storedDetails = {};
  try {
    storedDetails = JSON.parse(localStorage.getItem("eduGateWalkinDetails") || "{}");
  } catch (e) { /* ignore */ }
  document.getElementById("maskedEmail").textContent = maskEmail(storedDetails.email);
  document.getElementById("otpSubtitle").childNodes[0].textContent = `${data.subtitlePrefix} `;

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "walkin-details.html";
  });

  // ---- OTP boxes: auto-advance focus, backspace goes back, only digits ----
  const boxes = Array.from(document.querySelectorAll(".otp-box"));
  const verifyBtn = document.getElementById("verifyBtn");

  function updateVerifyState() {
    verifyBtn.disabled = !boxes.every((b) => b.value.trim().length === 1);
  }

  boxes.forEach((box, i) => {
    box.addEventListener("input", () => {
      box.value = box.value.replace(/[^0-9]/g, "").slice(0, 1);
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
      updateVerifyState();
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !box.value && i > 0) boxes[i - 1].focus();
    });
  });

  // ---- Countdown timer ----
  let secondsLeft = data.timerSeconds;
  const timerValue = document.getElementById("timerValue");
  const resendBtn = document.getElementById("resendBtn");

  function tick() {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      timerValue.textContent = "Expired";
      clearInterval(timerInterval);
    } else {
      timerValue.textContent = formatTime(secondsLeft);
    }
  }
  let timerInterval = setInterval(tick, 1000);
  timerValue.textContent = formatTime(secondsLeft);

  resendBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    secondsLeft = data.timerSeconds;
    timerValue.textContent = formatTime(secondsLeft);
    timerInterval = setInterval(tick, 1000);
    boxes.forEach((b) => (b.value = ""));
    boxes[0].focus();
    updateVerifyState();
  });

  verifyBtn.addEventListener("click", () => {
    if (verifyBtn.disabled) return;
    // OTP verified — visitor can walk in directly, no security approval queue needed
    window.location.href = data.nextPage;
  });
})();
