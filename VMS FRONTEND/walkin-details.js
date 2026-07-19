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
    firstName: "First Name",
    lastName: "Last Name",
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


  document.getElementById("firstNameLabel").innerHTML =
    `${data.labels.firstName} <span class="required">*</span>`;

  document.getElementById("lastNameLabel").innerHTML =
    `${data.labels.lastName} <span class="required">*</span>`;

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


  // Show photo captured on the previous screen
  const storedPhoto =
    localStorage.getItem("eduGateWalkinPhoto");

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


  /*
    Department data will later come from the backend.

    Example future flow:

    fetch departments
        ↓
    add department options
        ↓
    visitor selects department
        ↓
    fetch department head
        ↓
    fill personToMeet
  */


  document.getElementById("detailsForm")
    .addEventListener("submit", async (e) => {

      e.preventDefault();

      const submitBtn = document.getElementById("submitBtn");
      const originalText = submitBtn.textContent;

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending OTP...";

      const firstName =
        document.getElementById("firstName").value;

      const lastName =
        document.getElementById("lastName").value;

      const email =
        document.getElementById("email").value;

      const phone =
        document.getElementById("phone").value;

      const purpose =
        document.getElementById("purpose").value;

      const department =
        document.getElementById("department").value;

      const personToMeet =
        document.getElementById("personToMeet").value;

      const payload = {
        organization_id: 1,
        firstName,
        lastName,
        email,
        phone,
        purpose,
        department,
        personToMeet
      };

      try {

        const res = await fetch(
          "http://localhost:5000/api/visitors/walkin/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          }
        );

        const result = await res.json();

        if (!res.ok) {
          alert(result.message || "Request failed.");
          return;
        }

        localStorage.setItem(
          "eduGateWalkinDetails",
          JSON.stringify(payload)
        );

        localStorage.setItem("visitId", result.data.visitId);
        localStorage.setItem("visitorId", result.data.visitorId);

        window.location.href = data.nextPage;

      } catch (err) {
        alert("Unable to connect to the server. Please check your connection and try again.");
        console.error(err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }

    });

})();
