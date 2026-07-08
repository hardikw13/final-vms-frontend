// manage-users.js
// Loads manage-users-data.json, renders the staff list, and wires up search, filter,
// Add User, and per-user actions (edit / activate-deactivate / remove).

let allUsers = [];
let activeFilters = { role: new Set(), status: new Set() };
let idCounter = 100;

const ROLES = ['FACULTY', 'RECEPTION', 'SECURITY', 'ADMIN', 'CONTRACTOR'];
const ROLE_PREFIX = { FACULTY: 'FAC', RECEPTION: 'REC', SECURITY: 'SEC', ADMIN: 'ADM', CONTRACTOR: 'CON' };

function initials(name) {
  return name
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}
function roleClass(role) {
  return role.toLowerCase();
}

function renderUsers(users) {
  const el = document.getElementById('userList');
  if (!users.length) {
    el.innerHTML = '<div class="no-results">No users match your search.</div>';
    return;
  }
  el.innerHTML = users.map(u => `
    <div class="user-item" data-id="${u.id}">
      <div class="user-avatar">${initials(u.name)}</div>
      <div class="user-body">
        <div class="user-top">
          <span class="user-name">${u.name}</span>
          <span class="role-pill ${roleClass(u.role)}">${u.role}</span>
        </div>
        <div class="user-meta">${u.id} · ${u.department}</div>
        <div class="user-email">${u.email}</div>
        <div class="user-status"><span class="status-dot" style="${u.status === 'Active' ? '' : 'background:#9399a6;'}"></span>${u.status}</div>
      </div>
      <button class="more-btn" aria-label="More options" data-user-id="${u.id}" data-panel-trigger>⋮</button>
    </div>
  `).join('');

  el.querySelectorAll('.more-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openUserMenu(btn);
    });
  });
}

function getVisibleUsers() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  return allUsers.filter(u => {
    const matchesQuery = !q ||
      u.name.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = !activeFilters.role.size || activeFilters.role.has(u.role);
    const matchesStatus = !activeFilters.status.size || activeFilters.status.has(u.status);
    return matchesQuery && matchesRole && matchesStatus;
  });
}

function refresh() {
  renderUsers(getVisibleUsers());
}

function buildChips(containerId, values, filterKey) {
  const el = document.getElementById(containerId);
  el.innerHTML = values.map(v => `<button type="button" class="filter-chip" data-value="${v}">${v}</button>`).join('');
  el.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.value;
      if (activeFilters[filterKey].has(val)) {
        activeFilters[filterKey].delete(val);
        chip.classList.remove('active');
      } else {
        activeFilters[filterKey].add(val);
        chip.classList.add('active');
      }
    });
  });
}

function openUserMenu(btn) {
  closeAllPanels();
  const user = allUsers.find(u => u.id === btn.dataset.userId);
  if (!user) return;
  const rect = btn.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu open';
  menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  menu.style.right = `${window.innerWidth - rect.right}px`;
  menu.innerHTML = `
    <button class="dropdown-menu-item" data-action="edit">✏️ Edit user</button>
    <button class="dropdown-menu-item" data-action="toggle">${user.status === 'Active' ? '🚫 Deactivate' : '✅ Activate'}</button>
    <div class="dropdown-menu-divider"></div>
    <button class="dropdown-menu-item danger" data-action="remove">🗑️ Remove user</button>
  `;
  document.body.appendChild(menu);

  menu.querySelector('[data-action="edit"]').addEventListener('click', () => {
    menu.remove();
    openUserModal({ mode: 'edit', user });
  });
  menu.querySelector('[data-action="toggle"]').addEventListener('click', () => {
    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    refresh();
    showToast(`${user.name} is now ${user.status}`);
    menu.remove();
  });
  menu.querySelector('[data-action="remove"]').addEventListener('click', () => {
    menu.remove();
    openConfirmModal({
      title: 'Remove user',
      body: `Remove ${user.name} (${user.id}) from the system? This cannot be undone.`,
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: () => {
        allUsers = allUsers.filter(u => u.id !== user.id);
        refresh();
        showToast(`${user.name} removed`);
      }
    });
  });

  // clean up dropdown when the shared panel-closer fires
  const observer = new MutationObserver(() => {
    if (!document.body.contains(menu)) { observer.disconnect(); return; }
  });
  document.addEventListener('click', function handler(e) {
    if (!menu.contains(e.target) && e.target !== btn) {
      menu.remove();
      document.removeEventListener('click', handler);
    }
  });
}

function openUserModal({ mode, user }) {
  const root = document.getElementById('modalRoot') || (() => {
    const r = document.createElement('div');
    r.id = 'modalRoot';
    document.body.appendChild(r);
    return r;
  })();

  const isEdit = mode === 'edit';
  root.innerHTML = `
    <div class="modal-overlay open" id="userOverlay">
      <div class="modal-box">
        <div class="modal-head">
          <h3 class="modal-title">${isEdit ? 'Edit User' : 'Add User'}</h3>
          <button class="modal-close" id="userModalClose" type="button" aria-label="Close">&times;</button>
        </div>
        <form id="userForm">
          <div class="form-field">
            <label for="fName">Full name</label>
            <input id="fName" type="text" value="${isEdit ? user.name : ''}" placeholder="e.g. Dr. Meera Iyer" required />
          </div>
          <div class="form-field">
            <label for="fRole">Role</label>
            <select id="fRole">
              ${ROLES.map(r => `<option value="${r}" ${isEdit && user.role === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label for="fDept">Department</label>
            <input id="fDept" type="text" value="${isEdit ? user.department : ''}" placeholder="e.g. Administration" required />
          </div>
          <div class="form-field">
            <label for="fEmail">Email</label>
            <input id="fEmail" type="email" value="${isEdit ? user.email : ''}" placeholder="name@uni.edu" required />
            <div class="form-error" id="emailError">Enter a valid, unique email address.</div>
          </div>
          <div class="modal-actions">
            <button type="button" class="modal-cancel" id="userModalCancel">Cancel</button>
            <button type="submit" class="modal-submit">${isEdit ? 'Save Changes' : 'Add User'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const overlay = document.getElementById('userOverlay');
  const close = () => { overlay.classList.remove('open'); root.innerHTML = ''; };
  document.getElementById('userModalClose').addEventListener('click', close);
  document.getElementById('userModalCancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  document.getElementById('userForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('fName').value.trim();
    const role = document.getElementById('fRole').value;
    const department = document.getElementById('fDept').value.trim();
    const email = document.getElementById('fEmail').value.trim();
    const emailError = document.getElementById('emailError');

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const duplicate = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase() && (!isEdit || u.id !== user.id));
    if (!validEmail || duplicate) {
      emailError.textContent = duplicate ? 'That email is already in use.' : 'Enter a valid email address.';
      emailError.classList.add('show');
      return;
    }
    emailError.classList.remove('show');

    if (isEdit) {
      Object.assign(user, { name, role, department, email });
      showToast('User updated');
    } else {
      idCounter += 1;
      const newUser = {
        id: `U-${ROLE_PREFIX[role]}-${idCounter}`,
        name, role, department, email,
        status: 'Active'
      };
      allUsers.unshift(newUser);
      showToast('User added');
    }
    refresh();
    close();
  });
}

async function loadUsers() {
  try {
    const res = await fetch('manage-users-data.json');
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    const data = await res.json();

    allUsers = data.users || [];
    buildChips('roleChips', ROLES, 'role');
    buildChips('statusChips', ['Active', 'Inactive'], 'status');
    refresh();

    document.getElementById('searchInput').addEventListener('input', refresh);

    document.getElementById('addUserBtn').addEventListener('click', () => {
      openUserModal({ mode: 'add' });
    });

    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    filterBtn.setAttribute('data-panel-trigger', '');
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !filterPanel.classList.contains('open');
      closeAllPanels();
      if (willOpen) filterPanel.classList.add('open');
    });
    document.getElementById('filterApplyBtn').addEventListener('click', () => {
      refresh();
      filterPanel.classList.remove('open');
      showToast('Filters applied');
    });
    document.getElementById('filterClearBtn').addEventListener('click', () => {
      activeFilters.role.clear();
      activeFilters.status.clear();
      filterPanel.querySelectorAll('.filter-chip.active').forEach(c => c.classList.remove('active'));
      refresh();
    });
  } catch (err) {
    console.error('Error loading users:', err);
    document.getElementById('userList').innerHTML =
      '<div class="no-results" style="color:#e0413e;">Couldn\'t load users. Please try again.</div>';
  }
}

document.addEventListener('DOMContentLoaded', loadUsers);
