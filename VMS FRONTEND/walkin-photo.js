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

    console.log("✅ Face Landmarker Ready");
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
    debugFaces.textContent = numberOfFaces;

    if (numberOfFaces === 0) {

        faceStatus.textContent = "No face detected";

        captureBtn.disabled = true;
        debugWidth.textContent = "-";
        debugHeight.textContent = "-";
        debugConfidence.textContent = "-";
        debugOffsetX.textContent = "-";
        debugOffsetY.textContent = "-";

        // Clear custom metrics
        document.getElementById("debugNoseToChin").textContent = "-";
        document.getElementById("debugFaceHeight").textContent = "-";
        document.getElementById("debugNoseChinRatio").textContent = "-";
        document.getElementById("debugMouthWidth").textContent = "-";
        document.getElementById("debugMouthHeight").textContent = "-";
        document.getElementById("debugMouthRatio").textContent = "-";
        document.getElementById("debugJitter").textContent = "-";
        document.getElementById("debugBlendshapes").textContent = "-";
        mouthChinHistory.length = 0;

    }

    else if (numberOfFaces > 1) {

        faceStatus.textContent = "Only one person should appear";

        captureBtn.disabled = true;

        // Clear custom metrics
        document.getElementById("debugNoseToChin").textContent = "-";
        document.getElementById("debugFaceHeight").textContent = "-";
        document.getElementById("debugNoseChinRatio").textContent = "-";
        document.getElementById("debugMouthWidth").textContent = "-";
        document.getElementById("debugMouthHeight").textContent = "-";
        document.getElementById("debugMouthRatio").textContent = "-";
        document.getElementById("debugJitter").textContent = "-";
        document.getElementById("debugBlendshapes").textContent = "-";
        mouthChinHistory.length = 0;

    }




    if (faces.length > 0) {

        // Take the first detected face landmarks
        const landmarks = faces[0];

        // 1. Nose-to-chin distance
        const noseToChin = distancePx(landmarks[4], landmarks[152]);

        // 2. Forehead-to-chin distance (Face Height)
        const faceHeight = distancePx(landmarks[10], landmarks[152]);

        // 3. Ratio
        const noseChinRatio = faceHeight > 0 ? (noseToChin / faceHeight) : 0;

        // 4. Mouth width (left corner 61, right corner 291)
        const mouthWidth = distancePx(landmarks[61], landmarks[291]);

        // 5. Mouth height (upper lip center outer 0, lower lip center outer 17)
        const mouthHeight = distancePx(landmarks[0], landmarks[17]);

        // 6. Mouth aspect ratio
        const mouthRatio = mouthHeight > 0 ? (mouthWidth / mouthHeight) : 0;

        // 7. Landmark stability/jitter over recent frames
        const anchor = landmarks[4]; // nose tip as anchor to cancel translation
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

        // 8. Available mouth-related blendshapes
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

        // Update DOM elements
        document.getElementById("debugNoseToChin").textContent = noseToChin.toFixed(1);
        document.getElementById("debugFaceHeight").textContent = faceHeight.toFixed(1);
        document.getElementById("debugNoseChinRatio").textContent = noseChinRatio.toFixed(3);
        document.getElementById("debugMouthWidth").textContent = mouthWidth.toFixed(1);
        document.getElementById("debugMouthHeight").textContent = mouthHeight.toFixed(1);
        document.getElementById("debugMouthRatio").textContent = mouthRatio.toFixed(2);
        document.getElementById("debugJitter").textContent = jitterVal.toFixed(2);
        document.getElementById("debugBlendshapes").textContent = mouthShapesText;

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

        debugConfidence.textContent = "1.00";

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

  const debugPanel = document.getElementById("debugPanel");
  if (debugPanel) {
    const divider = document.createElement("div");
    divider.style.borderTop = "1px solid #d6dbe8";
    divider.style.margin = "10px 0";
    debugPanel.appendChild(divider);

    const metrics = [
      { id: "debugNoseToChin", label: "Nose-Chin" },
      { id: "debugFaceHeight", label: "Face H" },
      { id: "debugNoseChinRatio", label: "N-C/H Ratio" },
      { id: "debugMouthWidth", label: "Mouth W" },
      { id: "debugMouthHeight", label: "Mouth H" },
      { id: "debugMouthRatio", label: "Mouth Ratio" },
      { id: "debugJitter", label: "Mouth Jitter" },
      { id: "debugBlendshapes", label: "Mouth Shapes" }
    ];

    metrics.forEach(m => {
      const div = document.createElement("div");
      div.innerHTML = `${m.label}: <span id="${m.id}">-</span>`;
      debugPanel.appendChild(div);
    });
  }

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
