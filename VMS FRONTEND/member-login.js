const API_URL = "http://localhost:5000/api/auth/login";


const ROLE_ICONS = {

  security: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>`,


  host: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="8" r="4"/>
  <path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/>
  </svg>`,


  head_host: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="8" r="4"/>
  <path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/>
  <path d="M12 3v2"/>
  </svg>`,


  admin: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="8" height="8" rx="1.5"/>
  <rect x="13" y="3" width="8" height="8" rx="1.5"/>
  <rect x="3" y="13" width="8" height="8" rx="1.5"/>
  <rect x="13" y="13" width="8" height="8" rx="1.5"/>
  </svg>`

};



// Roles

const ROLES = [

  {
    key: "admin",
    label: "Admin"
  },

  

  {
    key: "host",
    label: "Host"
  },

  {
    key: "security",
    label: "Security"
  }

];



function renderRoleButton(role) {


  const btn = document.createElement("button");


  btn.type = "button";


  btn.className = "role-btn";


  btn.dataset.role = role.key;


  btn.innerHTML =
    `${ROLE_ICONS[role.key] || ""}
     <span>${role.label}</span>`;


  return btn;

}




document.addEventListener("DOMContentLoaded", () => {


  const roleGrid =
    document.getElementById("roleGrid");


  const email =
    document.getElementById("email");


  const password =
    document.getElementById("password");


  const signInBtn =
    document.getElementById("signInBtn");


  const loginForm =
    document.getElementById("loginForm");



  let selectedRole = "";



  // Create role buttons

  ROLES.forEach(role => {

    roleGrid.appendChild(
      renderRoleButton(role)
    );

  });




  function updateButton(){

    signInBtn.disabled = !(
      email.value.trim() &&
      password.value.trim() &&
      selectedRole
    );

  }




  email.addEventListener(
    "input",
    updateButton
  );


  password.addEventListener(
    "input",
    updateButton
  );





  // Role selection

  roleGrid.addEventListener(
    "click",
    (e)=>{


      const btn =
        e.target.closest(".role-btn");


      if(!btn) return;



      document
      .querySelectorAll(".role-btn")
      .forEach(b=>{

        b.classList.remove("active");

      });



      btn.classList.add("active");


      selectedRole =
        btn.dataset.role;


      updateButton();


    }
  );






  // Login

  loginForm.addEventListener(
    "submit",
    async(e)=>{


      e.preventDefault();



      if(!selectedRole){

        alert("Please select role");

        return;

      }




      signInBtn.disabled = true;


      signInBtn.textContent =
        "Signing In...";




      try{


        const response =
          await fetch(
            API_URL,
            {

              method:"POST",


              headers:{
                "Content-Type":
                "application/json"
              },


              body:JSON.stringify({

                email:
                email.value.trim(),


                password:
                password.value.trim(),


                role:
                selectedRole.toUpperCase()

              })

            }
          );




        const result =
          await response.json();




        console.log(
          "LOGIN RESPONSE:",
          result
        );




        if(!response.ok){

          throw new Error(
            result.message ||
            "Login failed"
          );

        }





        const token =
          result.token ||
          result.data?.token;



        const user =
          result.user ||
          result.data?.user;




        if(!token){

          throw new Error(
            "JWT token not received"
          );

        }




        localStorage.setItem(
          "token",
          token
        );




        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );





        const role =
          user?.role ||
          selectedRole.toUpperCase();






        if(role === "ADMIN"){


          window.location.href =
          "admin-dashboard.html";


        }



        



        else if(role === "HOST"){


          window.location.href =
          "host-dashboard.html";


        }



        else if(role === "SECURITY"){


          window.location.href =
          "security-dashboard.html";


        }



        else{


          alert(
            "Unknown role: " + role
          );


        }




      }


      catch(error){


        console.error(
          "LOGIN ERROR:",
          error
        );


        alert(
          error.message
        );


      }



      finally{


        signInBtn.disabled = false;


        signInBtn.textContent =
        "Sign In";


      }



    }
  );


});