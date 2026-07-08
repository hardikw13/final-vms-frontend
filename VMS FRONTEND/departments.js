// departments.js
// Connected to backend API

const API_URL = "http://localhost:5000/api/departments";

let allDepartments = [];

const BUILDING_ICON = `
<svg viewBox="0 0 24 24" width="18" height="18">
    <path d="M3 21V8l9-5 9 5v13h-6v-6h-6v6Z" fill="currentColor"/>
</svg>
`;

function getToken() {
    return localStorage.getItem("token");
}

function renderDepartments(list) {

    const el = document.getElementById("deptList");

    document.getElementById("deptSummary").textContent =
        `${list.length} Departments`;

    if (list.length === 0) {

        el.innerHTML = `
            <div class="empty-state">
                No departments found.
            </div>
        `;

        return;
    }

    el.innerHTML = list.map(d => `

        <div class="dept-item">

            <div class="dept-icon">
                ${BUILDING_ICON}
            </div>

            <div class="dept-body">

                <div class="dept-name">
                    ${d.department_name}
                </div>

                <div class="dept-meta">
                    ${d.description || "No description"}
                </div>

            </div>

            <div class="dept-count">
                ${d._count?.hosts || 0} Staff
            </div>

        </div>

    `).join("");

}

async function loadDepartments() {

    try {

        const token = getToken();

        if (!token) {
            throw new Error("Please login first.");
        }

        const response = await fetch(API_URL, {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to load departments");
        }

        allDepartments = result.data;

        renderDepartments(allDepartments);

        const searchInput = document.getElementById("searchInput");

        if (searchInput) {

            searchInput.addEventListener("input", function () {

                const q = this.value.trim().toLowerCase();

                if (!q) {
                    renderDepartments(allDepartments);
                    return;
                }

                const filtered = allDepartments.filter(dept =>

                    dept.department_name.toLowerCase().includes(q) ||

                    (dept.description || "")
                        .toLowerCase()
                        .includes(q)

                );

                renderDepartments(filtered);

            });

        }

    }
    catch (err) {

        console.error(err);

        document.getElementById("deptList").innerHTML = `

            <div class="empty-state" style="color:red">

                ${err.message}

            </div>

        `;

    }

}

document.addEventListener("DOMContentLoaded", loadDepartments);