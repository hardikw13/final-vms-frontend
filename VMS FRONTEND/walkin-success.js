const FALLBACK_DATA = {
  brand: { title: "Walk-in Registration" },
  steps: [
    { key: "photo", label: "Photo" },
    { key: "details", label: "Details" },
    { key: "otp", label: "OTP" }
  ],
  success: {
    title: "Registration Submitted",
    subtitle: "Your identity has been verified successfully. Your visit request has been submitted for approval. Please wait while the host or department reviews your request."
  },
  notifiedText: "Your host/department has been notified.",
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

(async function init() {
  const data = await loadData();

  document.getElementById("brandTitle").textContent = data.brand.title;
  renderAllCompletedSteps(document.getElementById("stepIndicator"), data.steps);

  document.getElementById("successTitle").textContent = data.success.title;
  document.getElementById("successSubtitle").textContent = data.success.subtitle;
  document.getElementById("notifiedText").textContent = data.notifiedText;
  document.getElementById("doneBtn").textContent = data.doneButtonText;

  let details = {};
  try {
    details = JSON.parse(localStorage.getItem("eduGateWalkinDetails") || "{}");
  } catch (e) { /* ignore */ }

  const fullName = [details.firstName, details.lastName].filter(Boolean).join(" ") || "Visitor";
  document.getElementById("passName").textContent = fullName;
  document.getElementById("passPurpose").textContent = `Purpose: ${details.purpose || "—"}`;

  const storedPhoto = localStorage.getItem("eduGateWalkinPhoto");
  if (storedPhoto) {
    document.getElementById("passPhotoImg").src = storedPhoto;
    document.getElementById("passPhotoImg").hidden = false;
    document.querySelector("#passPhoto svg").hidden = true;
  }

  const grid = document.getElementById("passGrid");
  grid.appendChild(renderPassItem("Department", details.department || "—"));
  grid.appendChild(renderPassItem("Person to Meet", details.personToMeet || "—"));

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "walkin-otp.html";
  });

  document.getElementById("doneBtn").addEventListener("click", () => {
    localStorage.removeItem("eduGateWalkinPhoto");
    localStorage.removeItem("eduGateWalkinDetails");
    window.location.href = data.homeLink;
  });
})();
