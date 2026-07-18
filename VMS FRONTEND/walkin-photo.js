import {
    FaceDetector,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

let faceDetector;
let isDetecting = false;
let capturedBlob = null;
const MIN_FACE_WIDTH = 180;
const MAX_FACE_WIDTH = 280;
const CENTER_TOLERANCE_X = 60;

const MIN_OFFSET_Y = 30;
const MAX_OFFSET_Y = 100;

const video = document.getElementById("cameraVideo");
const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas.getContext("2d");
const faceStatus = document.getElementById("faceStatus");
const captureBtn = document.getElementById("captureBtn");
const debugFaces = document.getElementById("debugFaces");
const debugWidth = document.getElementById("debugWidth");
const debugHeight = document.getElementById("debugHeight");
const debugConfidence = document.getElementById("debugConfidence");
const debugOffsetX = document.getElementById("debugOffsetX");
const debugOffsetY = document.getElementById("debugOffsetY");

const previewModal = document.getElementById("photoPreviewModal");
const previewImage = document.getElementById("previewImage");

const retakeBtn = document.getElementById("retakeBtn");
const continueBtn = document.getElementById("continueBtn");


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



async function initializeFaceDetector() {

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceDetector = await FaceDetector.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
            },

            runningMode: "VIDEO"
        }
    );

    console.log("✅ Face Detector Ready");
}


function detectFaces() {

    if (!isDetecting) {
        return;
    }

    if (!faceDetector) {
        return;
    }

    if (video.readyState < 2) {
        requestAnimationFrame(detectFaces);
        return;
    }

    // 🧹 Clear the previous frame's drawings
    overlayCtx.clearRect(
        0,
        0,
        overlayCanvas.width,
        overlayCanvas.height
    );

    // 👇 Ask MediaPipe to detect faces in the current frame
const detections =
    faceDetector.detectForVideo(
        video,
        performance.now()
    );

// Get all detected faces
const faces = detections.detections;
const numberOfFaces = faces.length;
debugFaces.textContent = numberOfFaces;

if (numberOfFaces === 0) {

    faceStatus.textContent = "No face detected";

    captureBtn.disabled = true;
    debugWidth.textContent = "-";
debugHeight.textContent = "-";
debugConfidence.textContent = "-";
debugOffsetX.textContent = "-";
debugOffsetY.textContent = "-";

}

else if (numberOfFaces > 1) {

    faceStatus.textContent = "Only one person should appear";

    captureBtn.disabled = true;

}




if (faces.length > 0) {

    // Take the first detected face
    const face = faces[0];

// Bounding box
const box = face.boundingBox;

// Calculate the center of the detected face
const faceCenterX = box.originX + (box.width / 2);
const faceCenterY = box.originY + (box.height / 2);

// Calculate the center of the camera
const cameraCenterX = overlayCanvas.width / 2;
const cameraCenterY = overlayCanvas.height / 2;

// Calculate how far the face is from the center
const offsetX = faceCenterX - cameraCenterX;
const offsetY = faceCenterY - cameraCenterY;

debugOffsetX.textContent = Math.round(offsetX);
debugOffsetY.textContent = Math.round(offsetY);

let isFaceSizeValid = false;
let isFaceCentered = false;

if (box.width < MIN_FACE_WIDTH) {

    faceStatus.textContent = "Move closer";

}
else if (box.width > MAX_FACE_WIDTH) {

    faceStatus.textContent = "Move slightly back";

}
else {

    isFaceSizeValid = true;

    if (offsetX < -CENTER_TOLERANCE_X) {

        faceStatus.textContent = "Move Left";

    }
    else if (offsetX > CENTER_TOLERANCE_X) {

        faceStatus.textContent = "Move Right";

    }
    else if (offsetY < MIN_OFFSET_Y) {

        faceStatus.textContent = "Move Down";

    }
    else if (offsetY > MAX_OFFSET_Y) {

        faceStatus.textContent = "Move Up";

    }
    else {

        faceStatus.textContent = "Good position";

        isFaceCentered = true;
    }
}

captureBtn.disabled = !(isFaceSizeValid && isFaceCentered);



    debugWidth.textContent = Math.round(box.width);

debugHeight.textContent = Math.round(box.height);

debugConfidence.textContent =
    face.categories[0].score.toFixed(2);

    overlayCtx.strokeStyle = "lime";
    overlayCtx.lineWidth = 4;

    overlayCtx.strokeRect(
        box.originX,
        box.originY,
        box.width,
        box.height
    );
}

requestAnimationFrame(detectFaces);
}


function calculateBlur(canvas) {

    const ctx = canvas.getContext("2d");

    const { width, height } = canvas;

    const imageData = ctx.getImageData(0, 0, width, height);

    const pixels = imageData.data;

    let edgeStrength = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {

        for (let x = 1; x < width - 1; x++) {

            const center = (y * width + x) * 4;

            const left = (y * width + (x - 1)) * 4;
            const right = (y * width + (x + 1)) * 4;

            const top = ((y - 1) * width + x) * 4;
            const bottom = ((y + 1) * width + x) * 4;

            const gx =
                Math.abs(pixels[right] - pixels[left]) +
                Math.abs(pixels[right + 1] - pixels[left + 1]) +
                Math.abs(pixels[right + 2] - pixels[left + 2]);

            const gy =
                Math.abs(pixels[bottom] - pixels[top]) +
                Math.abs(pixels[bottom + 1] - pixels[top + 1]) +
                Math.abs(pixels[bottom + 2] - pixels[top + 2]);

            edgeStrength += gx + gy;

            count++;
        }
    }

    return edgeStrength / count;

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

  
  const placeholder = document.getElementById("cameraPlaceholder");
  const canvas = document.getElementById("captureCanvas");
  captureBtn.disabled = true;
  let stream = null;

  await initializeFaceDetector();

  // Try to start the camera; if it's unavailable or denied, we just keep the icon
  // placeholder and let "Capture Photo" continue the flow without a real photo.
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    await video.play();

    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;

    isDetecting = true;
    detectFaces();



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




    try {

    const blurScore = calculateBlur(canvas);

    console.log("Blur Score:", blurScore);

    alert("Blur Score: " + blurScore);

} catch (err) {

    console.error("Blur Error:", err);

    alert(err.message);

}

  // 2. Convert the canvas image into a Blob
  // canvas.toBlob(
  //   async (blob) => {
  //     if (!blob) {
  //       console.error("Could not create photo blob.");
  //       return;
  //     }

  canvas.toBlob((blob) => {

    if (!blob) {
        console.error("Could not create photo blob.");
        return;
    }

    capturedBlob = blob;

    previewImage.src = URL.createObjectURL(blob);

    previewModal.hidden = false;

}, "image/jpeg", 0.85);

});


retakeBtn.addEventListener("click", () => {

    previewModal.hidden = true;

    URL.revokeObjectURL(previewImage.src);

    previewImage.src = "";

    capturedBlob = null;

});

continueBtn.addEventListener("click", async () => {
  if (!capturedBlob) {
        return;
    }

  continueBtn.disabled = true;
        try {
        // 3. Create multipart/form-data
        const formData = new FormData();

        formData.append(
    "photo",
    capturedBlob,
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
        isDetecting = false;
        // 6. Stop the camera
        stream
          .getTracks()
          .forEach((track) => track.stop());

          previewModal.hidden = true;

        // 7. Continue to visitor details
        window.location.href = data.nextPage;

      } catch (error) {
        console.error(
          "Photo upload error:",
          error
        );
        continueBtn.disabled = false;
      }


});
})();

//       try {
//         // 3. Create multipart/form-data
//         const formData = new FormData();

//         formData.append(
//           "photo",
//           blob,
//           "visitor-photo.jpg"
//         );

//         // 4. Send the photo to our backend
//         const response = await fetch(
//           "http://localhost:5000/api/registration/photo",
//           {
//             method: "POST",
//             body: formData
//           }
//         );

//         const result = await response.json();

//         if (!response.ok) {
//           throw new Error(
//             result.error || "Photo upload failed."
//           );
//         }

//         // 5. Temporarily hold the returned Supabase photo URL
//         sessionStorage.setItem(
//           "eduGateWalkinPhotoUrl",
//           result.photo_url
//         );

//         console.log(
//           "Photo uploaded successfully:",
//           result.photo_url
//         );
//         isDetecting = false;
//         // 6. Stop the camera
//         stream
//           .getTracks()
//           .forEach((track) => track.stop());

//         // 7. Continue to visitor details
//         window.location.href = data.nextPage;

//       } catch (error) {
//         console.error(
//           "Photo upload error:",
//           error
//         );
//       }
//     },
//     "image/jpeg",
//     0.85
//   );
// });
// })();
