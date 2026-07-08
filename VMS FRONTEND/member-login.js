const ROLE_ICONS = {
  security: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  host: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/></svg>`,
  admin: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>`
};

const FALLBACK_DATA = {
  pageTitle: "Member Sign In",
  pageSubtitle: "Use your Employee Id and Password",
  employeeIdPlaceholder: "EMP-20240001",
  demoLabel: "Demo: select your role",
  roles: [
    { key: "security", label: "Security" },
    { key: "host", label: "Host" },
    { key: "admin", label: "Admin" }
  ],
  signInText: "Sign In",
  hintText: "Role is automatically detected from Employee ID",
  backLinkText: "Back to Home",
  backLink: "welcome.html"
};

async function loadData() {
  try {
    const res = await fetch("member-login-data.json");
    if (!res.ok) throw new Error("Bad response");
    return await res.json();
  } catch {
    return FALLBACK_DATA;
  }
}

function renderRoleButton(role) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "role-btn";
  btn.dataset.role = role.key;
  btn.innerHTML = `${ROLE_ICONS[role.key] || ""}<span>${role.label}</span>`;
  return btn;
}

(async function () {

  const data = await loadData();

  document.getElementById("pageTitle").textContent = data.pageTitle;
  document.getElementById("pageSubtitle").textContent = data.pageSubtitle;
  document.getElementById("employeeId").placeholder = data.employeeIdPlaceholder;
  document.getElementById("demoLabel").textContent = data.demoLabel;
  document.getElementById("signInBtn").textContent = data.signInText;
  document.getElementById("hintText").textContent = data.hintText;

  const backLink = document.getElementById("backLink");
  backLink.querySelector("span").textContent = data.backLinkText;
  backLink.href = data.backLink;

  const roleGrid = document.getElementById("roleGrid");

  data.roles.forEach(role => {
    roleGrid.appendChild(renderRoleButton(role));
  });

  const employeeId = document.getElementById("employeeId");
  const password = document.getElementById("password");
  const signInBtn = document.getElementById("signInBtn");

  let selectedRole = "";

  function updateButton() {
    signInBtn.disabled = !(
      employeeId.value.trim() &&
      password.value.trim() &&
      selectedRole
    );
  }

  employeeId.addEventListener("input", updateButton);
  password.addEventListener("input", updateButton);

  roleGrid.addEventListener("click", function (e) {

    const btn = e.target.closest(".role-btn");
    if (!btn) return;

    document.querySelectorAll(".role-btn").forEach(b => {
      b.classList.remove("active");
    });

    btn.classList.add("active");
    selectedRole = btn.dataset.role;

    updateButton();
  });

  document.getElementById("loginForm").addEventListener("submit", function (e) {

    e.preventDefault();

    if (signInBtn.disabled) return;

    // Redirect according to selected role
    if (selectedRole === "host") {
      window.location.href = "host-dashboard.html";
    }

    else if (selectedRole === "security") {
      window.location.href = "security-dashboard.html";
    }

    else if (selectedRole === "admin") {
      window.location.href = "admin-dashboard.html";
    }

    else {
      alert("Please select a role.");
    }

  });

})();