const FALLBACK_DATA = {
  brand: { title: "Pre Approved Visitor" },
  backLink: "select-visitor-type.html",
  scan: {
    title: "Scan Your QR Code",
    subtitle: "Position your invitation QR code in front of the camera",
    scanningLabel: "Scanning",
    buttonText: "📁 Upload from Gallery",
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

// ---------- camera state ----------
let cameraStream = null;
let scanLoopId = null;

// ---------- handles a successfully decoded token, from any source ----------
function handleScannedToken(token, nextPage) {

  if (!token || !token.trim()) return;

  stopCamera();

  sessionStorage.setItem("qrToken", token.trim());

  window.location.href = nextPage;

}

// ---------- start camera and continuously scan frames for a QR code ----------
// (camera is confined to the small viewfinder box purely via CSS —
// this function's logic is unchanged, only how it's displayed changed)
async function startCamera(nextPage) {

  const video = document.getElementById("qrVideo");
  const canvas = document.getElementById("qrCanvas");
  const ctx = canvas.getContext("2d");

  try {

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    video.srcObject = cameraStream;
    await video.play();

  } catch (err) {

    console.warn("Camera permission denied or unavailable:", err.message);
    // Camera not available — user can still use "Upload from Gallery"
    return;

  }

  function tick() {

    if (video.readyState === video.HAVE_ENOUGH_DATA) {

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        handleScannedToken(code.data, nextPage);
        return; // stop the loop, we found one
      }

    }

    scanLoopId = requestAnimationFrame(tick);

  }

  scanLoopId = requestAnimationFrame(tick);

}

// ---------- stop camera + scan loop (call before navigating away) ----------
function stopCamera() {

  if (scanLoopId) {
    cancelAnimationFrame(scanLoopId);
    scanLoopId = null;
  }

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

}

// ---------- decode a QR code from an uploaded gallery image ----------
function decodeImageFile(file, nextPage) {

  const reader = new FileReader();

  reader.onload = (e) => {

    const img = new Image();

    img.onload = () => {

      const canvas = document.getElementById("qrCanvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        handleScannedToken(code.data, nextPage);
      } else {
        alert("Could not detect a QR code in that image. Please try another photo.");
      }

    };

    img.src = e.target.result;

  };

  reader.readAsDataURL(file);

}

(async function init() {
  const data = await loadData();

  document.getElementById("brandTitle").textContent = data.brand.title;
  document.getElementById("scanTitle").textContent = data.scan.title;
  document.getElementById("scanSubtitle").textContent = data.scan.subtitle;
  document.getElementById("altText").textContent = data.altText;
  document.getElementById("altLink").textContent = data.altLinkText;
  document.getElementById("altLink").href = data.altLink;

  // "Scanning..." label with animated dots, base text driven by JSON
  const scanningLabel = document.getElementById("scanningLabel");
  scanningLabel.innerHTML = `${data.scan.scanningLabel}<span class="dots">...</span>`;

  document.getElementById("backBtn").addEventListener("click", () => {
    stopCamera();
    window.location.href = data.backLink;
  });

  // ---------- single button: Upload from Gallery ----------
  const galleryBtn = document.getElementById("galleryBtn");
  const galleryInput = document.getElementById("galleryInput");

  galleryBtn.textContent = data.scan.buttonText;

  galleryBtn.addEventListener("click", () => {
    galleryInput.click();
  });

  galleryInput.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (file) {
      decodeImageFile(file, data.scan.nextPage);
    }

    galleryInput.value = ""; // allow re-selecting the same file later

  });

  // ---------- request camera permission and start live scanning ----------
  // (still runs in the background inside the small viewfinder box —
  // if it finds a code first, it navigates automatically, same as gallery)
  if (document.getElementById("qrVideo")) {
    startCamera(data.scan.nextPage);
  }

  window.addEventListener("beforeunload", stopCamera);

})();