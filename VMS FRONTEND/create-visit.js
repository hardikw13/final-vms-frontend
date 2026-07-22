// create-visit.js

document.addEventListener("DOMContentLoaded", () => {

    const inviteBtn = document.getElementById("inviteBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const backBtn = document.getElementById("backBtn");

    // ---------- Flatpickr: Visit Date (blocks past dates) ----------

    const datePicker = flatpickr("#visitDate", {
        minDate: "today",
        dateFormat: "d-m-Y",
        altInput: true,
        altFormat: "d-m-Y",
        disableMobile: true,
        onReady: function(selectedDates, dateStr, instance) {
            instance.altInput.placeholder = "📅 Choose visit date";
        },
        onChange: function(selectedDates, dateStr, instance) {
            instance.altInput.style.color = "#13254B";
        }
    });

    // ---------- Helper: check if selected date is in the past ----------

    function isVisitInPast(dateValue) {

        if (!dateValue) return false;

        const visitDate = new Date(dateValue);
        visitDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return visitDate < today;

    }

    // ---------- Helper: basic empty-field check ----------

    function getFormData() {

        return {
            fullName: document.getElementById("fullName").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            organization: document.getElementById("organization").value.trim(),
            purpose: document.getElementById("purpose").value.trim(),
            visitDate: datePicker.selectedDates.length > 0
                ? datePicker.formatDate(datePicker.selectedDates[0], "Y-m-d")
                : ""
        };

    }

    function validateForm(data) {

        if (!data.fullName || !data.email || !data.phone || !data.purpose || !data.visitDate) {

            alert("Please fill in all required fields.");

            return false;

        }

        if (isVisitInPast(data.visitDate)) {

            alert("Visit date cannot be in the past. Please choose a future date.");

            return false;

        }

        return true;

    }

   inviteBtn.addEventListener("click", async () => {

    const formData = getFormData();

    if (!validateForm(formData)) {
        return;
    }

    try {

        const token = localStorage.getItem("token");

        const response = await fetch("https://edugate-9yl5.onrender.com/api/visits/invite", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                purpose: formData.purpose,
                visit_date: formData.visitDate
            })

        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Failed to invite visitor. Please try again.");
            return;
        }

        const visitId = result.data.visit.visit_id;

        window.location.href = `visitor-pass.html?visit_id=${visitId}`;

    } catch (err) {

        console.error("Error inviting visitor:", err);

        alert("Something went wrong. Please try again.");

    }

});
    // ---------- Cancel button ----------

    cancelBtn.addEventListener("click", () => {

        window.location.href = "host-dashboard.html";

    });

    // ---------- Back button ----------

    backBtn.addEventListener("click", () => {

        window.history.back();

    });

});