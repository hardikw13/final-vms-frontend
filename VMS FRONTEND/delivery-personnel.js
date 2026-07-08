const FALLBACK_DATA = {
  brand: { title: "Delivery Personnel" },
  backLink: "select-visitor-type.html",
  heading: {
    title: "Delivery Check-in",
    subtitle: "Enter the delivery details below for quick processing"
  },
  form: {
    companyNameLabel: "Company Name",
    contactNumberLabel: "Contact Number",
    orderIdLabel: "Order ID",
    recipientLabel: "Recipient Name",
    deliveryBoyLabel: "Delivery Boy Name",
    submitButtonText: "Submit for Verification"
  },
  nextPage: "delivery-personnel-success.html"
};

async function loadData() {
  try {
    const res = await fetch("delivery-personnel-data.json");
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch (err) {
    console.warn("Falling back to inline data (serve via a local server to load delivery-personnel-data.json):", err.message);
    return FALLBACK_DATA;
  }
}

(async function init() {
  const data = await loadData();

  document.getElementById("brandTitle").textContent = data.brand.title;
  document.getElementById("headingTitle").textContent = data.heading.title;
  document.getElementById("headingSubtitle").textContent = data.heading.subtitle;
  document.getElementById("companyNameLabel").textContent = data.form.companyNameLabel;
  document.getElementById("contactNumberLabel").textContent = data.form.contactNumberLabel;
  document.getElementById("orderIdLabel").textContent = data.form.orderIdLabel;
  document.getElementById("recipientLabel").textContent = data.form.recipientLabel;
  document.getElementById("deliveryBoyLabel").textContent = data.form.deliveryBoyLabel;
  document.getElementById("submitBtn").textContent = data.form.submitButtonText;

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = data.backLink;
  });

  const form = document.getElementById("deliveryForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const submission = {
      companyName: document.getElementById("companyName").value || "—",
      contactNumber: document.getElementById("contactNumber").value || "—",
      orderId: document.getElementById("orderId").value || "—",
      recipient: document.getElementById("recipient").value || "—",
      deliveryBoy: document.getElementById("deliveryBoy").value || "—",
      submittedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    localStorage.setItem("eduGateDeliverySubmission", JSON.stringify(submission));

    window.location.href = data.nextPage;
  });
})();