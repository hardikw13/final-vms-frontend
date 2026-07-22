const API_URL = "https://edugate-9yl5.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("addUserForm");

    const departmentSelect = document.getElementById("department");

    const message = document.getElementById("message");

    const roleSelect = document.getElementById("role");

    const headHostContainer = document.getElementById("headHostContainer");

    const isHeadCheckbox = document.getElementById("isHead");
    const departmentContainer = document.getElementById("departmentContainer");
    const designationContainer = document.getElementById("designationContainer");
    const designationInput = document.getElementById("designation");



    function getToken() {

        return localStorage.getItem("token");

    }



    // -----------------------------
    // Show Head Host option only for HOST
    // -----------------------------

    roleSelect.addEventListener("change", () => {

    if (roleSelect.value === "3") {

        // HOST
        headHostContainer.style.display = "block";
        departmentContainer.style.display = "block";

    }
    else if (roleSelect.value === "2") {

        // SECURITY
        headHostContainer.style.display = "none";
        isHeadCheckbox.checked = false;

        departmentContainer.style.display = "none";
        departmentSelect.value = "";

    }
    else if (roleSelect.value === "1") {

        // ADMIN
        headHostContainer.style.display = "none";
        isHeadCheckbox.checked = false;

        departmentContainer.style.display = "none";
        departmentSelect.value = "";

    }
    else {

        // No role selected
        headHostContainer.style.display = "none";
        isHeadCheckbox.checked = false;

        departmentContainer.style.display = "block";

    }

});


    // -----------------------------
    // Load Departments
    // -----------------------------

    async function loadDepartments() {

        try {

            const token = getToken();

            if (!token) {

                throw new Error(
                    "Authentication token missing"
                );

            }

            const response = await fetch(
                `${API_URL}/departments`,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                        `Bearer ${token}`

                    }

                }
            );

            const result =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Failed to load departments"
                );

            }

            const departments =
                result.data;

            departmentSelect.innerHTML = `

                <option value="">
                    Select Department
                </option>

            `;

            departments.forEach(dep => {

                const option =
                    document.createElement("option");

                // Send department_id to backend
                option.value =
                    dep.department_id;

                option.textContent =
                    dep.department_name;

                departmentSelect.appendChild(
                    option
                );

            });

        }

        catch (error) {

            console.error(
                error
            );

            message.style.color = "red";

            message.textContent =
                error.message;

        }

    }





    // -----------------------------
    // Create User
    // -----------------------------

    form.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const token =
                getToken();

            const user = {

                name:
                    document
                        .getElementById("name")
                        .value
                        .trim(),

                email:
                    document
                        .getElementById("email")
                        .value
                        .trim(),

                department_id:
    departmentSelect.value
        ? Number(departmentSelect.value)
        : null,
        designation:
        designationInput.value.trim(),

                role_id:
                    Number(
                        document
                            .getElementById("role")
                            .value
                    ),

                is_head:
                    isHeadCheckbox.checked

            };

            console.log(
                "Sending User:",
                user
            );

            try {

                const response =
                    await fetch(
                        `${API_URL}/users`,
                        {

                            method: "POST",

                            headers: {

                                "Authorization":
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(user)

                        }
                    );

                const result =
                    await response.json();

                console.log(
                    "Create Response:",
                    result
                );

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Failed to create user"
                    );

                }

                message.style.color =
                    "green";

                message.textContent =
                    "User created successfully";

                setTimeout(() => {

                    window.location.href =
                        "manage-users.html";

                }, 1500);

            }

            catch (error) {

                console.error(
                    error
                );

                message.style.color =
                    "red";

                message.textContent =
                    error.message;

            }

        });





    loadDepartments();

});