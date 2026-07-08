const FALLBACK_DATA = {
  brand: { title: "Walk-in Registration" },
  steps: [
    { key: "photo", label: "Photo" },
    { key: "details", label: "Details" },
    { key: "otp", label: "OTP" }
  ],
  success: {
    title: "Registration Successful",
    subtitle: "Your registration is complete. Present the visitor pass at the security desk for entry."
  },
  pass: {
    label: "Visitor Pass",
    badge: "Walk-in Visitor",
    qrCaption: "Show this QR at the security gate to check in"
  },
  notifiedTextTemplate: "{department} department head has been notified",
  validityNote: "This pass is valid only for today",
  doneButtonText: "Done · Return to home",
  homeLink: "welcome.html"
};

async function loadData() {
  try {
    const res = await fetch("walkin-success-data.json");
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch (err) {
    console.warn("Falling back to inline data:", err.message);
    return FALLBACK_DATA;
  }
}

function renderAllCompletedSteps(container, steps) {
  container.innerHTML = "";
  steps.forEach((step, i) => {
    const stepEl = document.createElement("div");
    stepEl.className = "step completed";
    stepEl.innerHTML = `
      <span class="step-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
      <span class="step-label">${step.label}</span>
    `;
    container.appendChild(stepEl);
    if (i < steps.length - 1) {
      const line = document.createElement("div");
      line.className = "step-line completed";
      container.appendChild(line);
    }
  });
}

function renderPassItem(label, value) {
  const el = document.createElement("div");
  el.className = "pass-item";
  el.innerHTML = `<span class="label">${label}</span><span class="value">${value}</span>`;
  return el;
}

function formatToday() {
  const now = new Date();
  return now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    ` (${now.toLocaleDateString("en-US", { weekday: "long" })})`;
}

function generatePassId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VP-${year}-${rand}`;
}

(async function init() {
  const data = await loadData();

  document.getElementById("brandTitle").textContent = data.brand.title;
  renderAllCompletedSteps(document.getElementById("stepIndicator"), data.steps);

  document.getElementById("successTitle").textContent = data.success.title;
  document.getElementById("successSubtitle").textContent = data.success.subtitle;
  document.getElementById("passLabel").textContent = data.pass.label;
  document.getElementById("passBadge").textContent = data.pass.badge;
  document.getElementById("passQrCaption").textContent = data.pass.qrCaption;
  document.getElementById("validityNote").textContent = data.validityNote;
  document.getElementById("doneBtn").textContent = data.doneButtonText;

  let details = {};
  try {
    details = JSON.parse(localStorage.getItem("eduGateWalkinDetails") || "{}");
  } catch (e) { /* ignore */ }

  const fullName = [details.firstName, details.lastName].filter(Boolean).join(" ") || "Visitor";
  document.getElementById("passName").textContent = fullName;
  document.getElementById("passType").textContent = `${details.visitorType || "Guest"} Visitor`;
  document.getElementById("passPurpose").textContent = `Purpose: ${details.purpose || "—"}`;

  const storedPhoto = localStorage.getItem("eduGateWalkinPhoto");
  if (storedPhoto) {
    document.getElementById("passPhotoImg").src = storedPhoto;
    document.getElementById("passPhotoImg").hidden = false;
    document.querySelector("#passPhoto svg").hidden = true;
  }

  const grid = document.getElementById("passGrid");
  grid.appendChild(renderPassItem("Host", details.personToMeet || "—"));
  grid.appendChild(renderPassItem("Date", formatToday()));
  grid.appendChild(renderPassItem("Check-in Time", new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })));
  grid.appendChild(renderPassItem("Pass ID", generatePassId()));

  document.getElementById("notifiedText").textContent = data.notifiedTextTemplate.replace(
    "{department}",
    details.department || "the"
  );

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "walkin-otp.html";
  });

  document.getElementById("doneBtn").addEventListener("click", () => {
    localStorage.removeItem("eduGateWalkinPhoto");
    localStorage.removeItem("eduGateWalkinDetails");
    window.location.href = data.homeLink;
  });
})();
