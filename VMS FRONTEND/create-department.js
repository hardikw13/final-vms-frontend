// create-department.js

const API_URL = "https://edugate-9yl5.onrender.com/api/departments";

function getToken() {
    return localStorage.getItem("token");
}

const form = document.getElementById("departmentForm");

const typeSelect = document.getElementById("type");

const startGroup = document.getElementById("startDateGroup");
const endGroup = document.getElementById("endDateGroup");

const startDate = document.getElementById("start_date");
const endDate = document.getElementById("end_date");


// -----------------------------
// Show/Hide Event Dates
// -----------------------------

typeSelect.addEventListener("change", () => {

    if (typeSelect.value === "event") {

        startGroup.style.display = "block";
        endGroup.style.display = "block";

        startDate.required = true;
        endDate.required = true;

    } else {

        startGroup.style.display = "none";
        endGroup.style.display = "none";

        startDate.required = false;
        endDate.required = false;

        startDate.value = "";
        endDate.value = "";

    }

});


// -----------------------------
// Create Department
// -----------------------------

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const token = getToken();

    if (!token) {

        alert("Please login first.");

        window.location.href = "member-login.html";

        return;

    }

    const body = {

        department_name: document
            .getElementById("department_name")
            .value
            .trim(),

        description: document
            .getElementById("description")
            .value
            .trim(),

        type: typeSelect.value

    };


    if (typeSelect.value === "event") {

        body.start_date = startDate.value;

        body.end_date = endDate.value;

    }

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {

                "Authorization": `Bearer ${token}`,

                "Content-Type": "application/json"

            },

            body: JSON.stringify(body)

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to create department"
            );

        }

        alert("Department created successfully!");

        window.location.href = "departments.html";

    }

    catch (err) {

        console.error(err);

        alert(err.message);

    }

});