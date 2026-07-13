const FALLBACK_DATA = {
  brand: { title: "Walk-in Registration" },
  backLink: "select-visitor-type.html",
  steps: [
    { key: "photo", label: "Photo" },
    { key: "details", label: "Details" },
    { key: "otp", label: "OTP" }
  ],
  currentStep: "photo",
  face: {
    title: "Face Capture",
    subtitle: "Look directly at the camera for identity verification"
  },
  tips: [
    { icon: "sun", label: "Good Lighting" },
    { icon: "glasses", label: "No hat or sunglasses" },
    { icon: "person", label: "Look straight" }
  ],
  captureButtonText: "Capture Photo",
  nextPage: "walkin-details.html"
};

const TIP_ICONS = {
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/><line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/></svg>`,
  glasses: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="3.5"/><circle cx="18" cy="12" r="3.5"/><line x1="9.5" y1="12" x2="14.5" y2="12"/><path d="M2 12l1.5-4"/><path d="M22 12l-1.5-4"/></svg>`,
  person: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/></svg>`
};

async function loadData() {
  try {
    const res = await fetch("walkin-photo-data.json");
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch (err) {
    console.warn("Falling back to inline data (serve via a local server to load walkin-photo-data.json):", err.message);
    return FALLBACK_DATA;
  }
}

function renderStepIndicator(container, steps, currentKey) {
  container.innerHTML = "";
  const currentIndex = steps.findIndex((s) => s.key === currentKey);
  steps.forEach((step, i) => {
    const state = i < currentIndex ? "completed" : i === currentIndex ? "active" : "upcoming";
    const stepEl = document.createElement("div");
    stepEl.className = `step ${state}`;
    stepEl.innerHTML = `
      <span class="step-circle">${state === "completed" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : i + 1}</span>
      <span class="step-label">${step.label}</span>
    `;
    container.appendChild(stepEl);
    if (i < steps.length - 1) {
      const line = document.createElement("div");
      line.className = `step-line ${i < currentIndex ? "completed" : ""}`;
      container.appendChild(line);
    }
  });
}

function renderTip(tip) {
  const el = document.createElement("div");
  el.className = "tip-item";
  el.innerHTML = `<div class="tip-icon">${TIP_ICONS[tip.icon] || ""}</div><span>${tip.label}</span>`;
  return el;
}

(async function init() {
  const data = await loadData();

  document.getElementById("brandTitle").textContent = data.brand.title;
  document.getElementById("faceTitle").textContent = data.face.title;
  document.getElementById("faceSubtitle").textContent = data.face.subtitle;
  document.getElementById("captureBtnText").textContent = data.captureButtonText;

  renderStepIndicator(document.getElementById("stepIndicator"), data.steps, data.currentStep);

  const tipsRow = document.getElementById("tipsRow");
  data.tips.forEach((tip) => tipsRow.appendChild(renderTip(tip)));

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = data.backLink;
  });

  const video = document.getElementById("cameraVideo");
  const placeholder = document.getElementById("cameraPlaceholder");
  const canvas = document.getElementById("captureCanvas");
  let stream = null;

  // Try to start the camera; if it's unavailable or denied, we just keep the icon
  // placeholder and let "Capture Photo" continue the flow without a real photo.
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    video.hidden = false;
    placeholder.hidden = true;
  } catch (err) {
    console.warn("Camera unavailable, continuing without a live preview:", err.message);
  }

  document.getElementById("captureBtn").addEventListener("click", async () => {
  if (!stream) {
    console.warn("No camera stream available.");
    return;
  }

  // 1. Capture the current video frame onto the canvas
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 320;

  canvas
    .getContext("2d")
    .drawImage(video, 0, 0, canvas.width, canvas.height);

  // 2. Convert the canvas image into a Blob
  canvas.toBlob(
    async (blob) => {
      if (!blob) {
        console.error("Could not create photo blob.");
        return;
      }

      try {
        // 3. Create multipart/form-data
        const formData = new FormData();

        formData.append(
          "photo",
          blob,
          "visitor-photo.jpg"
        );

        // 4. Send the photo to our backend
        const response = await fetch(
          "http://localhost:5000/api/registration/photo",
          {
            method: "POST",
            body: formData
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Photo upload failed."
          );
        }

        // 5. Temporarily hold the returned Supabase photo URL
        sessionStorage.setItem(
          "eduGateWalkinPhotoUrl",
          result.photo_url
        );

        console.log(
          "Photo uploaded successfully:",
          result.photo_url
        );

        // 6. Stop the camera
        stream
          .getTracks()
          .forEach((track) => track.stop());

        // 7. Continue to visitor details
        window.location.href = data.nextPage;

      } catch (error) {
        console.error(
          "Photo upload error:",
          error
        );
      }
    },
    "image/jpeg",
    0.85
  );
});
})();
