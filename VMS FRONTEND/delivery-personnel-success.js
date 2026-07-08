const FALLBACK_DATA = {
  brand: { title: "Delivery Personnel" },
  backLink: "delivery-personnel.html",
  success: {
    title: "Submitted!",
    subtitle: "Your delivery details have been sent to the security desk for verification."
  },
  pass: { label: "Delivery Pass" },
  statusText: "Awaiting security confirmation",
  doneButtonText: "Done · Return to home",
  homeLink: "welcome.html",
  // Used only if no real submission is found in localStorage (e.g. page opened directly)
  sampleSubmission: {
    companyName: "Zomato",
    contactNumber: "98765 43210",
    orderId: "ORD-2026-4821",
    recipient: "Front Desk",
    deliveryBoy: "Ramesh Yadav"
  }
};

async function loadData() {
  try {
    const res = await fetch("delivery-personnel-success-data.json");
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch (err) {
    console.warn("Falling back to inline data (serve via a local server to load delivery-personnel-success-data.json):", err.message);
    return FALLBACK_DATA;
  }
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
  document.getElementById("successTitle").textContent = data.success.title;
  document.getElementById("successSubtitle").textContent = data.success.subtitle;
  document.getElementById("passLabel").textContent = data.pass.label;
  document.getElementById("passStatus").textContent = data.statusText;

  // Prefer the real submission from the previous page; fall back to sample data
  let submission = data.sampleSubmission;
  try {
    const stored = localStorage.getItem("eduGateDeliverySubmission");
    if (stored) submission = JSON.parse(stored);
  } catch (err) {
    console.warn("Could not read stored submission, using sample data:", err.message);
  }

  const grid = document.getElementById("passGrid");
  grid.appendChild(renderPassItem("Company", submission.companyName));
  grid.appendChild(renderPassItem("Order ID", submission.orderId));
  grid.appendChild(renderPassItem("Contact", submission.contactNumber));
  grid.appendChild(renderPassItem("Recipient", submission.recipient));
  grid.appendChild(renderPassItem("Delivery By", submission.deliveryBoy));

  const doneBtn = document.getElementById("doneBtn");
  doneBtn.textContent = data.doneButtonText;
  doneBtn.addEventListener("click", () => {
    window.location.href = data.homeLink;
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = data.backLink;
  });
})();