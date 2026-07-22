// manage-users.js

const API_URL = "https://edugate-9yl5.onrender.com/api";

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

function getDepartmentName(user) {
  // Only Hosts have a department, via their host_profile relation.
  return user.host_profile?.department?.department_name || null;
}


// -------------------------
// Render Users
// -------------------------

function renderUsers(users) {
  const el = document.getElementById("userList");

  if (!users.length) {
    el.innerHTML = `<div class="no-results">No users found</div>`;
    return;
  }

  el.innerHTML = users.map(user => {
    const roleName = user.role?.role_name || "";
    const department = getDepartmentName(user);

    return `
    <div class="user-item">
      <div class="user-avatar">${initials(user.name)}</div>
      <div class="user-body">
        <div class="user-top">
          <span class="user-name">${user.name}</span>
          <span class="role-pill ${roleClass(roleName)}">${roleName}</span>
        </div>
        <div class="user-meta">${department || "No Department"}</div>
        <div class="user-email">${user.email}</div>
        <div class="user-status">
          <span class="status-dot" style="${user.status === "active" ? "" : "background:#999"}"></span>
          ${user.status}
        </div>
      </div>
    </div>
    `;
  }).join("");
}


// -------------------------
// Load Users From Database
// -------------------------

async function loadUsers() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication token missing. Please log in again.");
    }

    const response = await fetch(`${API_URL}/users`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to load users");
    }

    allUsers = result.data; // unwrap the {success, message, data} envelope

    renderUsers(allUsers);

  } catch (error) {
    console.error("Load users error:", error);
    document.getElementById("userList").innerHTML =
      `<div class="no-results">${error.message || "Unable to load users"}</div>`;
  }
}


// -------------------------
// Search
// -------------------------

function searchUsers() {
  const value = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allUsers.filter(user => {
    const roleName = user.role?.role_name || "";
    const department = getDepartmentName(user) || "";

    return (
      user.name.toLowerCase().includes(value) ||
      user.email.toLowerCase().includes(value) ||
      roleName.toLowerCase().includes(value) ||
      department.toLowerCase().includes(value)
    );
  });

  renderUsers(filtered);
}


// -------------------------
// Page Load
// -------------------------

document.addEventListener("DOMContentLoaded", () => {
  loadUsers();

  const search = document.getElementById("searchInput");
  if (search) {
    search.addEventListener("input", searchUsers);
  }

  const addBtn = document.getElementById("addUserBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      window.location.href = "add-user.html";
    });
  }
});