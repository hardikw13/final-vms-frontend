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


(async function init() {

  const data = await loadData();


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


  confirmBtn.addEventListener("click", () => {

    window.location.href =
      data.nextPage;

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