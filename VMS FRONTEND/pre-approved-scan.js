const FALLBACK_DATA = {
  brand: { title: "Pre Approved Visitor" },
  backLink: "select-visitor-type.html",
  scan: {
    title: "Scan Your QR Code",
    subtitle: "Position your invitation QR code in front of the camera",
    scanningLabel: "Scanning",
    buttonText: "Simulate QR Scan",
    nextPage: "pre-approved-confirm.html"
  },
  altText: "Don't have a QR code?",
  altLinkText: "Register as Walk-in",
  altLink: "walkin-photo.html"
};

async function loadData() {
  try {
    const res = await fetch("pre-approved-scan-data.json");
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch (err) {
    console.warn("Falling back to inline data (serve via a local server to load pre-approved-scan-data.json):", err.message);
    return FALLBACK_DATA;
  }
}

(async function init() {
  const data = await loadData();

  document.getElementById("brandTitle").textContent = data.brand.title;
  document.getElementById("scanTitle").textContent = data.scan.title;
  document.getElementById("scanSubtitle").textContent = data.scan.subtitle;
  document.getElementById("simulateBtn").textContent = data.scan.buttonText;
  document.getElementById("altText").textContent = data.altText;
  document.getElementById("altLink").textContent = data.altLinkText;
  document.getElementById("altLink").href = data.altLink;

  // "Scanning..." label with animated dots, base text driven by JSON
  const scanningLabel = document.getElementById("scanningLabel");
  scanningLabel.innerHTML = `${data.scan.scanningLabel}<span class="dots">...</span>`;

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = data.backLink;
  });

  document.getElementById("simulateBtn").addEventListener("click", () => {
    window.location.href = data.scan.nextPage;
  });
})();