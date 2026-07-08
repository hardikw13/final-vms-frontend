const ICONS = {
  qr: `<svg viewBox="0 0 24 24" fill="none" stroke="#3b4257" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="17.5" y1="14" x2="17.5" y2="17.5"/><line x1="14" y1="17.5" x2="21" y2="17.5"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="#7c4fd6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  box: `<svg viewBox="0 0 24 24" fill="none" stroke="#b9790f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><line x1="12" y1="13" x2="12" y2="21"/></svg>`
};

const ICON_BG = { qr: "var(--icon-gray-bg)", camera: "var(--icon-violet-bg)", box: "var(--icon-amber-bg)" };

const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

const FALLBACK_DATA = {
  brand: { name: "EduGate VMS", tagline: "Select Visitor Type" },
  heading: { title: "How are you visiting today?", subtitle: "Choose your visitor category to continue" },
  types: [
    { icon: "qr", badgeText: "Fastest Entry", badgeColor: "green", title: "Pre-Approved Visitor", description: "You have a QR code from a previous invitation", link: "pre-approved-scan.html" },
    { icon: "camera", badgeText: "Email OTP", badgeColor: "violet", title: "Walk-in Visitor", description: "First-time or unscheduled visit — face capture & OTP verification required", link: "walkin-photo.html" },
    { icon: "box", badgeText: "Order Scan", badgeColor: "blue", title: "Delivery Personnel", description: "Upload or scan your delivery order ID for quick processing", link: "delivery-personnel.html" }
  ]
};

async function loadData() {
  try {
    const res = await fetch("select-visitor-type-data.json");
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch (err) {
    console.warn("Falling back to inline data (serve via a local server to load select-visitor-type-data.json):", err.message);
    return FALLBACK_DATA;
  }
}

function renderTypeCard(type) {
  const el = document.createElement("a");
  el.className = "type-card";
  el.href = type.link;
  el.innerHTML = `
    <div class="type-icon" style="background-color:${ICON_BG[type.icon] || "var(--icon-gray-bg)"}">${ICONS[type.icon] || ""}</div>
    <div class="type-body">
      <div class="type-title-row">
        <h4>${type.title}</h4>
        <span class="badge ${type.badgeColor}">${type.badgeText}</span>
      </div>
      <p>${type.description}</p>
    </div>
    <span class="chevron">${CHEVRON}</span>
  `;
  return el;
}

(async function init() {
  const data = await loadData();

  document.getElementById("brandName").textContent = data.brand.name;
  document.getElementById("brandTagline").textContent = data.brand.tagline;

  document.getElementById("headingTitle").textContent = data.heading.title;
  document.getElementById("headingSubtitle").textContent = data.heading.subtitle;

  const list = document.getElementById("typeList");
  data.types.forEach((type) => list.appendChild(renderTypeCard(type)));
})();