// manage-users.js

const API_URL = "http://localhost:5000/api";

let allUsers = [];


// -------------------------
// Helper Functions
// -------------------------

function initials(name) {

  return name
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(x => x[0].toUpperCase())
    .join("");

}



function roleClass(role) {

  return role ? role.toLowerCase() : "";

}



// -------------------------
// Render Users
// -------------------------

function renderUsers(users) {

  const el = document.getElementById("userList");


  if (!users.length) {

    el.innerHTML = `
      <div class="no-results">
        No users found
      </div>
    `;

    return;

  }



  el.innerHTML = users.map(user => `

    <div class="user-item">

      <div class="user-avatar">
        ${initials(user.name)}
      </div>


      <div class="user-body">

        <div class="user-top">

          <span class="user-name">
            ${user.name}
          </span>


          <span class="role-pill ${roleClass(user.role)}">
            ${user.role}
          </span>

        </div>


        <div class="user-meta">
          ${user.department || "No Department"}
        </div>


        <div class="user-email">
          ${user.email}
        </div>


        <div class="user-status">

          <span class="status-dot"
          style="${user.status === "Active" ? "" : "background:#999"}">
          </span>

          ${user.status}

        </div>


      </div>


    </div>

  `).join("");

}



// -------------------------
// Load Users From Database
// -------------------------

async function loadUsers() {

  try {


    const response =
      await fetch(`${API_URL}/users`);



    if (!response.ok) {

      throw new Error(
        "Failed to load users"
      );

    }



    allUsers =
      await response.json();



    renderUsers(allUsers);



  } catch(error) {


    console.error(
      "Load users error:",
      error
    );


    document.getElementById("userList").innerHTML =
      `
      <div class="no-results">
      Unable to load users
      </div>
      `;

  }

}




// -------------------------
// Search
// -------------------------

function searchUsers() {


  const value =
    document
    .getElementById("searchInput")
    .value
    .toLowerCase();



  const filtered =
    allUsers.filter(user => {


      return (

        user.name
        .toLowerCase()
        .includes(value)


        ||

        user.email
        .toLowerCase()
        .includes(value)


        ||

        user.role
        .toLowerCase()
        .includes(value)


        ||

        user.department
        .toLowerCase()
        .includes(value)

      );


    });



  renderUsers(filtered);


}




// -------------------------
// Page Load
// -------------------------

document.addEventListener(
"DOMContentLoaded",
()=>{


  // Load users

  loadUsers();



  // Search

  const search =
    document.getElementById(
      "searchInput"
    );


  if(search){

    search.addEventListener(
      "input",
      searchUsers
    );

  }




  // Add User Page

  const addBtn =
    document.getElementById(
      "addUserBtn"
    );



  if(addBtn){

    addBtn.addEventListener(
      "click",
      ()=>{

        window.location.href =
        "add-user.html";

      }
    );

  }



});