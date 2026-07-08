const API_URL = "http://localhost:5000/api";


document.addEventListener("DOMContentLoaded", () => {


    const form = document.getElementById("addUserForm");

    const departmentSelect = document.getElementById("department");

    const message = document.getElementById("message");



    function getToken() {

        return localStorage.getItem("token");

    }




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


                option.value =
                dep.department_name;


                option.textContent =
                dep.department_name;



                departmentSelect.appendChild(
                    option
                );


            });



        }

        catch(error) {


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
    async(e)=>{


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



            department:
            departmentSelect.value,



            role_id:
            document
            .getElementById("role")
            .value.trim()


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

                    method:"POST",


                    headers:{


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





            if(!response.ok){


                throw new Error(
                    result.message ||
                    "Failed to create user"
                );


            }




            message.style.color =
            "green";


            message.textContent =
            "User created successfully";





            setTimeout(()=>{


                window.location.href =
                "manage-users.html";


            },1500);





        }

        catch(error){


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