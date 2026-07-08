// ---- Inline SVG icons as real markup (rendered directly in the DOM, not as CSS data-URI backgrounds) ----
const ICONS = {
  visitor: `<svg viewBox="0 0 24 24" fill="none" stroke="#14183a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  login: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
};

// Fallback data, used only if welcome-data.json can't be fetched (e.g. opened via double-click / file://)
const FALLBACK_DATA = {
  brand: { name: "EduGate VMS", tagline: "Visitor Management System" },
  hero: {
    title: "Welcome to EduGate",
    subtitle: "Secure, smart visitor management for modern educational institutions"
  },
  actions: [
    { icon: "visitor", title: "Visitor Registration", description: "Register your visit, scan QR or walk in", cta: "Get Started", link: "select-visitor-type.html", style: "light" },
    { icon: "login", title: "Member Login", description: "Staff, faculty & security access", cta: "Sign In", link: "member-login.html", style: "dark" }
  ],
  trustNote: "Trusted by educational institutions across India for secure, monitored campus entry"
};

async function loadContent() {
  try {
    const res = await fetch("welcome-data.json");
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch (err) {
    // Likely opened directly as a file:// URL, where fetch of local JSON is blocked.
    // Serve the app anyway from the built-in fallback so it still renders correctly.
    console.warn("Falling back to inline data (serve via a local server to load welcome-data.json):", err.message);
    return FALLBACK_DATA;
  }
}

function renderActionCard(action) {
  const el = document.createElement("a");
  el.className = "action-card" + (action.style === "dark" ? " dark" : "");
  el.href = action.link;
  el.innerHTML = `
    <div class="action-icon">${ICONS[action.icon] || ""}</div>
    <h4>${action.title}</h4>
    <p>${action.description}</p>
    <span class="cta">${action.cta} &rarr;</span>
  `;
  return el;
}

(async function init() {
  const data = await loadContent();

  // Header (rendered once, this is the single logo/name instance on the page)
  document.getElementById("brandName").textContent = data.brand.name;
  document.getElementById("brandTagline").textContent = data.brand.tagline;

  // Hero
  document.getElementById("heroTitle").textContent = data.hero.title;
  document.getElementById("heroSubtitle").textContent = data.hero.subtitle;

  // Actions
  const actionsContainer = document.getElementById("actionsContainer");
  data.actions.forEach((action) => actionsContainer.appendChild(renderActionCard(action)));

  // Trust strip (fills the space left after removing the feature row)
  document.querySelector(".trust-strip p").textContent = data.trustNote;
})();