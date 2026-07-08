const FALLBACK_DATA = {
  brand: { title: "Pre Approved Visitor" },
  backLink: "pre-approved-confirm.html",
  success: {
    title: "Registered!",
    subtitle: "Your visit has been recorded. Show this pass to the security desk."
  },
  pass: {
    label: "Visitor Pass",
    items: [
      { label: "Host", value: "Dr. Anjali Mehta" },
      { label: "Date", value: "21 Jun 2026" },
      { label: "Check-in", value: "11:32 AM" },
      { label: "Pass ID", value: "VP-2024-03691" }
    ]
  },
  doneButtonText: "Done · Return to home",
  homeLink: "welcome.html"
};

async function loadData() {
  try {
    const res = await fetch("pre-approved-success-data.json");
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch (err) {
    console.warn("Falling back to inline data (serve via a local server to load pre-approved-success-data.json):", err.message);
    return FALLBACK_DATA;
  }
}

function renderPassItem(item) {
  const el = document.createElement("div");
  el.className = "pass-item";
  el.innerHTML = `<span class="label">${item.label}</span><span class="value">${item.value}</span>`;
  return el;
}

(async function init() {
  const data = await loadData();

  document.getElementById("brandTitle").textContent = data.brand.title;
  document.getElementById("successTitle").textContent = data.success.title;
  document.getElementById("successSubtitle").textContent = data.success.subtitle;
  document.getElementById("passLabel").textContent = data.pass.label;

  const grid = document.getElementById("passGrid");
  data.pass.items.forEach((item) => grid.appendChild(renderPassItem(item)));

  const doneBtn = document.getElementById("doneBtn");
  doneBtn.textContent = data.doneButtonText;
  doneBtn.addEventListener("click", () => {
    window.location.href = data.homeLink;
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = data.backLink;
  });
})();