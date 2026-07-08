// notifications.js — renders the full notification list (uses the shared NOTIFICATIONS
// array from common.js) and lets the user mark items as read individually or all at once.

function renderNotificationsPage() {
  const el = document.getElementById('notifListPage');
  const unread = NOTIFICATIONS.filter(n => n.unread).length;
  document.getElementById('notifSummary').textContent =
    unread ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'You\'re all caught up';

  if (!NOTIFICATIONS.length) {
    el.innerHTML = '<div class="empty-state">No notifications yet.</div>';
    return;
  }

  el.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-list-item ${n.unread ? 'unread' : 'read'}" data-id="${n.id}">
      <span class="dot"></span>
      <div class="notif-list-body">
        <div class="notif-list-title">${n.title}</div>
        <div class="notif-list-desc">${n.desc}</div>
        <div class="notif-list-time">${n.time}</div>
      </div>
      ${n.unread ? `<button class="mark-read-btn" data-id="${n.id}">Mark read</button>` : ''}
    </div>
  `).join('');

  el.querySelectorAll('.mark-read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = NOTIFICATIONS.find(x => x.id === btn.dataset.id);
      if (n) n.unread = false;
      renderNotificationsPage();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderNotificationsPage();
  document.getElementById('markAllBtn').addEventListener('click', () => {
    NOTIFICATIONS.forEach(n => (n.unread = false));
    renderNotificationsPage();
    showToast('All notifications marked as read');
  });
});
