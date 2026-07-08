// common.js — shared behaviour used on every admin page:
// notification bell dropdown, sign-out confirmation, toast messages, avatar initial.

const NOTIFICATIONS = [
  { id: 'n1', title: 'New walk-in visitor', desc: 'Deepa Rao is waiting at Gate 4 for approval.', time: '2m ago', unread: true },
  { id: 'n2', title: 'Visitor checked out', desc: 'Kavita Nair checked out of Guest Lecture Hall.', time: '38m ago', unread: true },
  { id: 'n3', title: 'New staff account created', desc: 'Neha Gupta was added as Admin.', time: '1h ago', unread: true },
  { id: 'n4', title: 'Weekly report ready', desc: 'Your Weekly Visitors report has been generated.', time: '3h ago', unread: false },
  { id: 'n5', title: 'Delivery logged', desc: 'FedEx delivery signed in at the Security Office.', time: 'Yesterday', unread: false }
];

function showToast(message, duration = 2200) {
  let el = document.getElementById('appToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

function closeAllPanels(except) {
  document.querySelectorAll('.notif-panel.open, .dropdown-menu.open, .filter-panel.open').forEach(p => {
    if (p !== except) p.classList.remove('open');
  });
}
document.addEventListener('click', (e) => {
  const isTrigger = e.target.closest('[data-panel-trigger]');
  const isPanel = e.target.closest('.notif-panel, .dropdown-menu, .filter-panel');
  if (!isTrigger && !isPanel) closeAllPanels();
});

function renderNotifPanel() {
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;
  return `
    <div class="notif-panel" id="notifPanel">
      <div class="notif-panel-head">
        <span>Notifications</span>
        <button class="notif-mark-all" id="markAllReadBtn" type="button">Mark all read</button>
      </div>
      <div class="notif-panel-list" id="notifPanelList">
        ${NOTIFICATIONS.map(n => `
          <div class="notif-row ${n.unread ? 'unread' : 'read'}" data-id="${n.id}">
            <span class="notif-dot-ind"></span>
            <div class="notif-row-body">
              <div class="notif-row-title">${n.title}</div>
              <div class="notif-row-desc">${n.desc}</div>
              <div class="notif-row-time">${n.time}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function initNotifications() {
  const btn = document.getElementById('notifBtn');
  if (!btn) return;
  btn.setAttribute('data-panel-trigger', '');
  btn.insertAdjacentHTML('afterend', renderNotifPanel());
  const panel = document.getElementById('notifPanel');
  const dot = btn.querySelector('.notif-dot');

  function refreshDot() {
    const anyUnread = NOTIFICATIONS.some(n => n.unread);
    if (dot) dot.style.display = anyUnread ? 'block' : 'none';
  }
  refreshDot();

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !panel.classList.contains('open');
    closeAllPanels();
    if (willOpen) panel.classList.add('open');
  });

  document.getElementById('markAllReadBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    NOTIFICATIONS.forEach(n => (n.unread = false));
    panel.querySelectorAll('.notif-row').forEach(r => { r.classList.remove('unread'); r.classList.add('read'); });
    refreshDot();
    showToast('All notifications marked as read');
  });

  panel.querySelectorAll('.notif-row').forEach(row => {
    row.addEventListener('click', () => {
      const n = NOTIFICATIONS.find(x => x.id === row.dataset.id);
      if (n) n.unread = false;
      row.classList.remove('unread');
      row.classList.add('read');
      refreshDot();
    });
  });
}

function initSignOut() {
  const link = document.querySelector('.sign-out');
  if (!link) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openConfirmModal({
      title: 'Sign Out',
      body: 'Are you sure you want to sign out of the Admin Dashboard?',
      confirmLabel: 'Sign Out',
      danger: true,
      onConfirm: () => {
        showToast('Signed out successfully');
        setTimeout(() => { window.location.href = 'member-login.html'; }, 500);
      }
    });
  });
}

function ensureModalRoot() {
  let root = document.getElementById('modalRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modalRoot';
    document.body.appendChild(root);
  }
  return root;
}

function openConfirmModal({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm }) {
  const root = ensureModalRoot();
  root.innerHTML = `
    <div class="modal-overlay open" id="confirmOverlay">
      <div class="modal-box">
        <div class="modal-head">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" id="confirmCloseBtn" type="button" aria-label="Close">&times;</button>
        </div>
        <p class="modal-body-text">${body}</p>
        <div class="modal-actions">
          <button class="modal-cancel" id="confirmCancelBtn" type="button">${cancelLabel}</button>
          <button class="modal-submit${danger ? ' danger-submit' : ''}" id="confirmOkBtn" type="button">${confirmLabel}</button>
        </div>
      </div>
    </div>
  `;
  const overlay = document.getElementById('confirmOverlay');
  const close = () => { overlay.classList.remove('open'); root.innerHTML = ''; };
  document.getElementById('confirmCloseBtn').addEventListener('click', close);
  document.getElementById('confirmCancelBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.getElementById('confirmOkBtn').addEventListener('click', () => {
    close();
    if (onConfirm) onConfirm();
  });
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(cell => {
    const v = String(cell ?? '');
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  initNotifications();
  initSignOut();
});
