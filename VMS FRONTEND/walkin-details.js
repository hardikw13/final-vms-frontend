const FALLBACK_DATA = {
  brand: { title: "Walk-in Registration" },
  backLink: "walkin-photo.html",

  steps: [
    { key: "photo", label: "Photo" },
    { key: "details", label: "Details" },
    { key: "otp", label: "OTP" }
  ],

  currentStep: "details",
  pageTitle: "Visitor details",

  photo: {
    capturedText: "Photo Captured",
    note: "Your photo will be used for identity verification",
    retakeText: "Retake Photo"
  },

  personalInfoHeading: "Personal Information",
  visitInfoHeading: "Visit Information",

  labels: {
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    purpose: "Purpose of Visit",
    department: "Department",
    personToMeet: "Person to Meet"
  },

  submitButtonText: "Send OTP to Email",
  nextPage: "walkin-otp.html"
};


async function loadData() {
  try {
    const res = await fetch("walkin-details-data.json");

    if (!res.ok) {
      throw new Error("bad response");
    }

    return await res.json();

  } catch (err) {
    console.warn("Falling back to inline data:", err.message);
    return FALLBACK_DATA;
  }
}


function renderStepIndicator(container, steps, currentKey) {
  container.innerHTML = "";

  const currentIndex = steps.findIndex(
    (step) => step.key === currentKey
  );

  steps.forEach((step, i) => {

    const state =
      i < currentIndex
        ? "completed"
        : i === currentIndex
        ? "active"
        : "upcoming";

    const stepEl = document.createElement("div");

    stepEl.className = `step ${state}`;

    stepEl.innerHTML = `
      <span class="step-circle">
        ${
          state === "completed"
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : i + 1
        }
      </span>

      <span class="step-label">${step.label}</span>
    `;

    container.appendChild(stepEl);


    if (i < steps.length - 1) {

      const line = document.createElement("div");

      line.className =
        `step-line ${i < currentIndex ? "completed" : ""}`;

      container.appendChild(line);
    }

  });
}


(async function init() {

  const data = await loadData();


  document.getElementById("brandTitle").textContent =
    data.brand.title;

  document.getElementById("pageTitle").textContent =
    data.pageTitle;


  renderStepIndicator(
    document.getElementById("stepIndicator"),
    data.steps,
    data.currentStep
  );


  document.getElementById("photoCapturedText").textContent =
    data.photo.capturedText;

  document.getElementById("photoNote").textContent =
    data.photo.note;

  document.getElementById("retakeBtnText").textContent =
    data.photo.retakeText;


  document.getElementById("personalInfoHeading").textContent =
    data.personalInfoHeading;

  document.getElementById("visitInfoHeading").textContent =
    data.visitInfoHeading;


  document.getElementById("fullNameLabel").innerHTML =
    `${data.labels.fullName} <span class="required">*</span>`;

  document.getElementById("emailLabel").innerHTML =
    `${data.labels.email} <span class="required">*</span>`;

  document.getElementById("phoneLabel").innerHTML =
    `${data.labels.phone} <span class="required">*</span>`;

  document.getElementById("purposeLabel").innerHTML =
    `${data.labels.purpose} <span class="required">*</span>`;

  document.getElementById("departmentLabel").innerHTML =
    `${data.labels.department} <span class="required">*</span>`;

  document.getElementById("personToMeetLabel").textContent =
    data.labels.personToMeet;

  document.getElementById("submitBtn").textContent =
    data.submitButtonText;


  const mode = new URLSearchParams(window.location.search).get("mode");

if (mode === "register") {
    document.getElementById("submitBtn").textContent =
        "Register Visitor";
}


  // Show photo captured on the previous screen
  const storedPhoto =
  sessionStorage.getItem("eduGateWalkinPhotoUrl");

  console.log(storedPhoto);

  if (storedPhoto) {

    document.getElementById("photoImg").src =
      storedPhoto;

    document.getElementById("photoImg").hidden =
      false;

    document.getElementById("photoPlaceholder").hidden =
      true;
  }


  document.getElementById("backBtn")
    .addEventListener("click", () => {

      window.location.href =
        data.backLink;

    });


  document.getElementById("retakeBtn")
    .addEventListener("click", () => {

      window.location.href =
        "walkin-photo.html";

    });


  const organizationId = 1;

const departmentSelect =
  document.getElementById("department");

try {

  const response = await fetch(
    `http://localhost:5000/api/registration/departments?org=${organizationId}`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  departmentSelect.innerHTML =
    '<option value="">Select Department</option>';

  result.data.forEach((department) => {

    const option =
      document.createElement("option");

    option.value =
      department.department_id;

    option.textContent =
      department.department_name;

    departmentSelect.appendChild(option);

  });

} catch (err) {

  console.error(
    "Could not load departments:",
    err
  );

}

departmentSelect.addEventListener(
  "change",
  async () => {

    const departmentId =
      departmentSelect.value;

    const personToMeet =
      document.getElementById("personToMeet");


    if (!departmentId) {

      personToMeet.value = "";
      personToMeet.placeholder =
        "Select a department first";

      return;
    }

    try {

      const response = await fetch(
        `http://localhost:5000/api/registration/departments/${departmentId}/head`
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      personToMeet.value =
        result.data.name;

      personToMeet.dataset.hostId =
        result.data.host_id;

    } catch (err) {

      console.error(err);

      personToMeet.value = "";

      personToMeet.placeholder =
        "No department head assigned";

    }

  }
);


  document.getElementById("detailsForm")
  .addEventListener("submit", async (e) => {

      e.preventDefault();


      const formData = {

        fullName:
          document.getElementById("fullName").value,

        email:
          document.getElementById("email").value,

        phone:
          document.getElementById("phone").value,

        purpose:
          document.getElementById("purpose").value,

        departmentId:
          document.getElementById("department").value,

        personToMeet:
          document.getElementById("personToMeet").value,

        hostId:
          document
            .getElementById("personToMeet")
            .dataset.hostId,

        visitType: "walk_in"

      };

      const mode = new URLSearchParams(window.location.search).get("mode");

if (mode === "register") {
  const photoUrl = sessionStorage.getItem("eduGateWalkinPhotoUrl");

// We will verify this key in a minute
const token = localStorage.getItem("token");

const response = await fetch(
    "http://localhost:5000/api/visitors/walkin",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            ...formData,
            photoUrl
        })
    }
);

const result = await response.json();

if (!response.ok) {
    throw new Error(result.message);
}

sessionStorage.setItem(
    "visitorPass",
    JSON.stringify(result.data)
);

window.location.href = "walkin-success.html";

return;

}

      try {

  const response = await fetch(
    "http://localhost:5000/api/registration/send-otp",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formData.email,
        fullName: formData.fullName
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

} catch (err) {

  alert(err.message);
  return;

}


      sessionStorage.setItem(
  "eduGateWalkinDetails",
  JSON.stringify(formData)
);


      window.location.href =
        data.nextPage;

    });

})();