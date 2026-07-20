import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

let faceLandmarker;
const JITTER_HISTORY_LENGTH = 15;
const mouthChinHistory = [];
let isDetecting = false;
let capturedBlob = null;
const MIN_FACE_WIDTH = 180;
const MAX_FACE_WIDTH = 280;
const CENTER_TOLERANCE_X = 60;

const MIN_OFFSET_Y = 30;
const MAX_OFFSET_Y = 100;

// ==========================================
// Face Visibility Validation Constants & State
// ==========================================
// Adjust these parameters to tune the sensitivity of the occlusion checks:
const DETECTION_WINDOW_SIZE = 30;       // Number of frames to track face detection availability
const NOSE_CHIN_RATIO_PRIMARY = 0.43;   // Primary ratio threshold: ratios below this are flagged as occluded
const NOSE_CHIN_RATIO_SUPPORT = 0.45;   // Supporting ratio threshold: checked in combination with jitter
const JITTER_THRESHOLD = 0.50;          // Supporting jitter threshold in pixels
const AVAILABILITY_LOSS_THRESHOLD = 0.10; // Minimum availability to treat complete face loss as occlusion

const OCCLUSION_SCORE_THRESHOLD = 1.0;  // Score needed to flag a frame as occluded
const NOSE_RATIO_PRIMARY_SCORE = 1.0;   // Weight for strong nose-chin ratio deviation
const NOSE_RATIO_SUPPORT_SCORE = 0.6;   // Weight for mild nose-chin ratio deviation
const JITTER_SUPPORT_SCORE = 0.5;       // Weight for high mouth jitter
const AVAILABILITY_SUPPORT_SCORE = 0.5; // Weight for face detection availability drop
const AVAILABILITY_DROP_THRESHOLD = 0.90; // Availability drops below 90%

const OCCLUDED_ENTER_FRAMES = 10;
const OCCLUDED_EXIT_FRAMES = 5;

const faceDetectionHistory = [];        // Sliding history of face detection booleans (true = detected, false = not)
let occlusionState = "NORMAL";          // Stable state variable: "NORMAL" or "OCCLUDED"
let occludedEnterFramesCounter = 0;
let occludedExitFramesCounter = 0;

const video = document.getElementById("cameraVideo");
const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas.getContext("2d");
const faceStatus = document.getElementById("faceStatus");
const captureBtn = document.getElementById("captureBtn");

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
    // console.warn("Falling back to inline data (serve via a local server to load walkin-photo-data.json):", err.message);
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



async function initializeFaceLandmarker() {

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
      },

      runningMode: "VIDEO",
      outputFaceBlendshapes: true
    }
  );

  // console.log("✅ Face Landmarker Ready");
}

function distancePx(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = (p1.x - p2.x) * overlayCanvas.width;
  const dy = (p1.y - p2.y) * overlayCanvas.height;
  return Math.sqrt(dx * dx + dy * dy);
}


function detectFaces() {

  if (!isDetecting) {
    return;
  }

  if (!faceLandmarker) {
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
  const results =
    faceLandmarker.detectForVideo(
      video,
      performance.now()
    );

  // Get all detected faces
  const faces = results.faceLandmarks || [];
  const numberOfFaces = faces.length;

  // Track face detection availability over the sliding window
  const hasFace = numberOfFaces > 0;
  faceDetectionHistory.push(hasFace);
  if (faceDetectionHistory.length > DETECTION_WINDOW_SIZE) {
    faceDetectionHistory.shift();
  }
  const detectedCount = faceDetectionHistory.filter(Boolean).length;
  const detectionAvailability = faceDetectionHistory.length > 0 ? (detectedCount / faceDetectionHistory.length) : 0;

  // Helpers to handle resets when face is not available
  const clearDebugPanelAndDisable = () => {
    captureBtn.disabled = true;
    mouthChinHistory.length = 0;
  };

  const updateDebugOcclusion = () => {
    // Debug UI is removed; do nothing
  };

  const resetOcclusionCounters = () => {
    occludedEnterFramesCounter = 0;
    occludedExitFramesCounter = 0;
    occlusionState = "NORMAL";
  };

  // Evaluate priority validations:
  // 1. No face detected
  if (numberOfFaces === 0) {
    resetOcclusionCounters();
    updateDebugOcclusion();
    faceStatus.textContent = "No face detected";
    clearDebugPanelAndDisable();
    requestAnimationFrame(detectFaces);
    return;
  }

  // 2. Multiple faces detected
  if (numberOfFaces > 1) {
    resetOcclusionCounters();
    updateDebugOcclusion();
    faceStatus.textContent = "Only one person should appear";
    clearDebugPanelAndDisable();
    requestAnimationFrame(detectFaces);
    return;
  }

  // Since numberOfFaces === 1, we can compute landmarks and bounding box
  const landmarks = faces[0];

  // Compute Bounding Box from normalized landmarks
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
  }

  const box = {
    originX: minX * overlayCanvas.width,
    originY: minY * overlayCanvas.height,
    width: (maxX - minX) * overlayCanvas.width,
    height: (maxY - minY) * overlayCanvas.height
  };

  // Calculate the center of the detected face
  const faceCenterX = box.originX + (box.width / 2);
  const faceCenterY = box.originY + (box.height / 2);

  // Calculate the center of the camera
  const cameraCenterX = overlayCanvas.width / 2;
  const cameraCenterY = overlayCanvas.height / 2;

  // Calculate how far the face is from the center
  const offsetX = faceCenterX - cameraCenterX;
  const offsetY = faceCenterY - cameraCenterY;


  // 3. Face too close / too far
  if (box.width < MIN_FACE_WIDTH) {
    resetOcclusionCounters();
    updateDebugOcclusion();
    faceStatus.textContent = "Move closer";
    captureBtn.disabled = true;
    // Draw bounding box
    overlayCtx.strokeStyle = "lime";
    overlayCtx.lineWidth = 4;
    overlayCtx.strokeRect(box.originX, box.originY, box.width, box.height);
    requestAnimationFrame(detectFaces);
    return;
  }

  if (box.width > MAX_FACE_WIDTH) {
    resetOcclusionCounters();
    updateDebugOcclusion();
    faceStatus.textContent = "Move slightly back";
    captureBtn.disabled = true;
    // Draw bounding box
    overlayCtx.strokeStyle = "lime";
    overlayCtx.lineWidth = 4;
    overlayCtx.strokeRect(box.originX, box.originY, box.width, box.height);
    requestAnimationFrame(detectFaces);
    return;
  }

  // 4. Face not centered
  if (offsetX < -CENTER_TOLERANCE_X) {
    resetOcclusionCounters();
    updateDebugOcclusion();
    faceStatus.textContent = "Move Left";
    captureBtn.disabled = true;
    overlayCtx.strokeStyle = "lime";
    overlayCtx.lineWidth = 4;
    overlayCtx.strokeRect(box.originX, box.originY, box.width, box.height);
    requestAnimationFrame(detectFaces);
    return;
  }

  if (offsetX > CENTER_TOLERANCE_X) {
    resetOcclusionCounters();
    updateDebugOcclusion();
    faceStatus.textContent = "Move Right";
    captureBtn.disabled = true;
    overlayCtx.strokeStyle = "lime";
    overlayCtx.lineWidth = 4;
    overlayCtx.strokeRect(box.originX, box.originY, box.width, box.height);
    requestAnimationFrame(detectFaces);
    return;
  }

  if (offsetY < MIN_OFFSET_Y) {
    resetOcclusionCounters();
    updateDebugOcclusion();
    faceStatus.textContent = "Move Down";
    captureBtn.disabled = true;
    overlayCtx.strokeStyle = "lime";
    overlayCtx.lineWidth = 4;
    overlayCtx.strokeRect(box.originX, box.originY, box.width, box.height);
    requestAnimationFrame(detectFaces);
    return;
  }

  if (offsetY > MAX_OFFSET_Y) {
    resetOcclusionCounters();
    updateDebugOcclusion();
    faceStatus.textContent = "Move Up";
    captureBtn.disabled = true;
    overlayCtx.strokeStyle = "lime";
    overlayCtx.lineWidth = 4;
    overlayCtx.strokeRect(box.originX, box.originY, box.width, box.height);
    requestAnimationFrame(detectFaces);
    return;
  }

  // Positioning is valid! Evaluate occlusion validation (Priority 5) using the existing algorithm
  const noseToChin = distancePx(landmarks[4], landmarks[152]);
  const faceHeight = distancePx(landmarks[10], landmarks[152]);
  const noseChinRatio = faceHeight > 0 ? (noseToChin / faceHeight) : 0;
  const mouthWidth = distancePx(landmarks[61], landmarks[291]);
  const mouthHeight = distancePx(landmarks[0], landmarks[17]);
  const mouthRatio = mouthHeight > 0 ? (mouthWidth / mouthHeight) : 0;

  // Jitter tracking
  const anchor = landmarks[4];
  const currentFrame = {
    pt61: { x: (landmarks[61].x - anchor.x) * overlayCanvas.width, y: (landmarks[61].y - anchor.y) * overlayCanvas.height },
    pt291: { x: (landmarks[291].x - anchor.x) * overlayCanvas.width, y: (landmarks[291].y - anchor.y) * overlayCanvas.height },
    pt152: { x: (landmarks[152].x - anchor.x) * overlayCanvas.width, y: (landmarks[152].y - anchor.y) * overlayCanvas.height }
  };
  mouthChinHistory.push(currentFrame);
  if (mouthChinHistory.length > JITTER_HISTORY_LENGTH) {
    mouthChinHistory.shift();
  }

  let jitterVal = 0;
  if (mouthChinHistory.length > 1) {
    const pointsKeys = ['pt61', 'pt291', 'pt152'];
    let sumStdDev = 0;
    for (const key of pointsKeys) {
      let sumX = 0, sumY = 0;
      for (const frame of mouthChinHistory) {
        sumX += frame[key].x;
        sumY += frame[key].y;
      }
      const meanX = sumX / mouthChinHistory.length;
      const meanY = sumY / mouthChinHistory.length;

      let varX = 0, varY = 0;
      for (const frame of mouthChinHistory) {
        varX += Math.pow(frame[key].x - meanX, 2);
        varY += Math.pow(frame[key].y - meanY, 2);
      }
      const stdDevX = Math.sqrt(varX / mouthChinHistory.length);
      const stdDevY = Math.sqrt(varY / mouthChinHistory.length);

      sumStdDev += Math.sqrt(stdDevX * stdDevX + stdDevY * stdDevY);
    }
    jitterVal = sumStdDev / pointsKeys.length;
  }

  // Mouth shapes
  let mouthShapesText = "N/A";
  if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
    const categories = results.faceBlendshapes[0].categories;
    const mouthShapes = {};
    for (const cat of categories) {
      if (cat.categoryName.startsWith("mouth") || cat.categoryName.startsWith("jaw") || cat.categoryName.startsWith("lip")) {
        mouthShapes[cat.categoryName] = cat.score;
      }
    }
    mouthShapesText = `Smile L/R: ${mouthShapes['mouthSmileLeft']?.toFixed(2)}/${mouthShapes['mouthSmileRight']?.toFixed(2)}, Pucker: ${mouthShapes['mouthPucker']?.toFixed(2)}, Jaw Open: ${mouthShapes['jawOpen']?.toFixed(2)}`;
  }

  // Update DOM debug metrics

  // --- Weighted Occlusion Decision Logic ---
  // 1. Primary Signal: Nose-to-face-height (nose-chin) ratio.
  // A strong deviation (ratio < NOSE_CHIN_RATIO_PRIMARY) is assigned full score (1.0) to directly flag occlusion.
  // A mild deviation (ratio < NOSE_CHIN_RATIO_SUPPORT) is assigned 0.6.
  let noseRatioScore = 0;
  if (noseChinRatio < NOSE_CHIN_RATIO_PRIMARY) {
    noseRatioScore = NOSE_RATIO_PRIMARY_SCORE;
  } else if (noseChinRatio < NOSE_CHIN_RATIO_SUPPORT) {
    noseRatioScore = NOSE_RATIO_SUPPORT_SCORE;
  }

  // 2. Supporting Signals: Jitter and face availability.
  // High mouth-related landmarker jitter indicates tracking instability due to occlusion.
  const jitterScore = (jitterVal > JITTER_THRESHOLD) ? JITTER_SUPPORT_SCORE : 0;

  // Face detection availability dropping (meaning the landmarker occasionally loses the face completely)
  // indicates occlusion is causing face landmarker to drop tracking.
  const availabilityScore = (detectionAvailability < AVAILABILITY_DROP_THRESHOLD) ? AVAILABILITY_SUPPORT_SCORE : 0;

  // 3. Combine scores. We do not require every signal to agree simultaneously.
  // A strong primary ratio deviation alone is enough (1.0 >= 1.0).
  // A mild ratio deviation (0.6) combined with either high jitter (0.5) or low availability (0.5) reaches 1.1 >= 1.0.
  // Even a normal ratio (0.0) combined with BOTH high jitter (0.5) and low availability (0.5) reaches 1.0 >= 1.0.
  const totalOcclusionScore = noseRatioScore + jitterScore + availabilityScore;
  const isOccluded = totalOcclusionScore >= OCCLUSION_SCORE_THRESHOLD;

  // Apply hysteresis state transitions
  if (isOccluded) {
    if (occlusionState === "NORMAL") {
      occludedEnterFramesCounter++;
      occludedExitFramesCounter = 0;
      if (occludedEnterFramesCounter >= OCCLUDED_ENTER_FRAMES) {
        occlusionState = "OCCLUDED";
      }
    } else {
      // Already OCCLUDED, maintain state and reset counters
      occludedEnterFramesCounter = 0;
      occludedExitFramesCounter = 0;
    }
  } else {
    if (occlusionState === "OCCLUDED") {
      occludedExitFramesCounter++;
      occludedEnterFramesCounter = 0;
      if (occludedExitFramesCounter >= OCCLUDED_EXIT_FRAMES) {
        occlusionState = "NORMAL";
      }
    } else {
      // Already NORMAL, maintain state and reset counters
      occludedEnterFramesCounter = 0;
      occludedExitFramesCounter = 0;
    }
  }

  updateDebugOcclusion();

  // Set visual status and enable/disable capture based on occlusion state
  if (occlusionState === "OCCLUDED") {
    faceStatus.textContent = "Please uncover your face.";
    captureBtn.disabled = true;
  } else {
    // 6. Good position
    faceStatus.textContent = "Good position";
    captureBtn.disabled = false;
  }

  // Draw bounding box
  overlayCtx.strokeStyle = "lime";
  overlayCtx.lineWidth = 4;
  overlayCtx.strokeRect(box.originX, box.originY, box.width, box.height);

  requestAnimationFrame(detectFaces);
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

  await initializeFaceLandmarker();

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
    // console.warn("Camera unavailable, continuing without a live preview:", err.message);
  }

  document.getElementById("captureBtn").addEventListener("click", async () => {
    if (!stream) {
      // console.warn("No camera stream available.");
      return;
    }

    // 1. Capture the current video frame onto the canvas
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 320;

    canvas
      .getContext("2d")
      .drawImage(video, 0, 0, canvas.width, canvas.height);


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

      // console.log(
      //   "Photo uploaded successfully:",
      //   result.photo_url
      // );
      isDetecting = false;
      // 6. Stop the camera
      stream
        .getTracks()
        .forEach((track) => track.stop());

      previewModal.hidden = true;

      // 7. Continue to visitor details
      const mode = new URLSearchParams(window.location.search).get("mode");

window.location.href = mode
    ? `${data.nextPage}?mode=${mode}`
    : data.nextPage;

    } catch (error) {
      // console.error(
      //   "Photo upload error:",
      //   error
      // );
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
