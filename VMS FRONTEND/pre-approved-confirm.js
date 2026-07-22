const FALLBACK_DATA = {
  brand: {
    title: "Pre Approved Visitor"
  },

  backLink: "pre-approved-scan.html",

  verified: {
    title: "QR Code Verified",
    invitationId: "Invitation ID: INV-2024-08-1847"
  },

  detailsTitle: "Confirm Your Details",

  details: [
    {
      label: "Name",
      value: "Rajesh Kumar"
    },
    {
      label: "Host",
      value: "Dr. Anjali Mehta — Dept. of CS"
    },
    {
      label: "Purpose",
      value: "Research Collaboration Meeting"
    },
    {
      label: "Date",
      value: "Today, 21 Jun 2026"
    },
    {
      label: "Department",
      value: "Computer Science"
    }
  ],

  confirmButtonText: "Confirm Check-in",

  nextPage: "pre-approved-success.html",

  rescanLinkText: "Re-scan QR",

  rescanLink: "pre-approved-scan.html"
};


async function loadData() {

  try {

    const res = await fetch(
      "pre-approved-confirm-data.json"
    );

    if (!res.ok) {
      throw new Error("bad response");
    }

    return await res.json();

  } catch (err) {

    console.warn(
      "Falling back to inline data:",
      err.message
    );

    return FALLBACK_DATA;
  }

}


function renderDetailRow(item) {

  const row = document.createElement("div");

  row.className = "details-row";

  row.innerHTML = `
    <span class="label">${item.label}</span>
    <span class="value">${item.value}</span>
  `;

  return row;

}


// ---------- NEW: fetch real visit data using the QR token ----------

async function fetchVisitFromToken(token) {

  const res = await fetch(`https://edugate-9yl5.onrender.com/api/visits/scan-info/${token}`);
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Invalid or expired QR code.");
  }

  return result.data.visit;

}

function buildDetailsFromVisit(visit) {

  const host = visit.assigned_host || visit.requested_host;

  return [
    { label: "Name", value: visit.visitor.full_name },
    {
      label: "Host",
      value: host
        ? `${host.user.name}${host.department ? " — Dept. of " + host.department.department_name : ""}`
        : "—"
    },
    { label: "Purpose", value: visit.purpose || "—" },
    {
      label: "Date",
      value: new Date(visit.visit_date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
      })
    },
    { label: "Department", value: visit.department?.department_name || "—" }
  ];

}


(async function init() {

  const data = await loadData();

  // ---------- NEW: overlay real backend data if a QR token exists ----------

  const qrToken = sessionStorage.getItem("qrToken");

  let liveVisit = null;

  if (qrToken) {

    try {

      liveVisit = await fetchVisitFromToken(qrToken);

      data.verified.invitationId = `Invitation ID: VIS-${liveVisit.visit_id}`;

      data.details = buildDetailsFromVisit(liveVisit);

      data.nextPage = "pre-approved-success.html";

    } catch (err) {

      // ---------- CHANGED: a real token means this is a real scan —
      // never mask a real error (e.g. "already checked in",
      // "not valid for today") behind fake fallback data.
      console.error("Live visit fetch failed:", err.message);

      sessionStorage.removeItem("qrToken");

      alert(err.message);

      window.location.href = "pre-approved-scan.html";

      return;

    }

  }


  document.getElementById("brandTitle").textContent =
    data.brand.title;

  document.getElementById("verifiedTitle").textContent =
    data.verified.title;

  document.getElementById("invitationId").textContent =
    data.verified.invitationId;

  document.getElementById("detailsTitle").textContent =
    data.detailsTitle;


  const list =
    document.getElementById("detailsList");


  data.details.forEach((item) => {

    list.appendChild(
      renderDetailRow(item)
    );

  });


  const confirmBtn =
    document.getElementById("confirmBtn");


  confirmBtn.textContent =
    data.confirmButtonText;


  confirmBtn.addEventListener("click", async () => {

    // ---------- NEW: real check-in call when we have a live visit ----------

    if (!qrToken || !liveVisit) {
      // no real token — fall back to old static navigation
      window.location.href = data.nextPage;
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Checking in...";

    try {

      const mode = new URLSearchParams(window.location.search).get("mode");

const headers = {};

if (mode === "register") {
    const token = localStorage.getItem("token");

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
}

      const res = await fetch(`https://edugate-9yl5.onrender.com/api/visits/self-checkin/${qrToken}`, {
        method: "PATCH",
        headers
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Check-in failed. Please try again.");
        confirmBtn.disabled = false;
        confirmBtn.textContent = data.confirmButtonText;
        return;
      }

      sessionStorage.setItem("checkedInVisit", JSON.stringify(result.data.visit));
      sessionStorage.removeItem("qrToken");

      window.location.href = data.nextPage;

    } catch (err) {

      console.error("Error checking in:", err);
      alert("Something went wrong. Please try again.");
      confirmBtn.disabled = false;
      confirmBtn.textContent = data.confirmButtonText;

    }

  });


  const rescanLink =
    document.getElementById("rescanLink");


  rescanLink.textContent =
    data.rescanLinkText;

  rescanLink.href =
    data.rescanLink;


  document.getElementById("backBtn")
    .addEventListener("click", () => {

      window.location.href =
        data.backLink;

    });

})();