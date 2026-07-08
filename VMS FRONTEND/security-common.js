/* ============================================================
   security-common.js
   Shared localStorage-backed data store + helpers for every
   page in the Security module. Include this BEFORE the
   page-specific <page>.js file.

   Data shape (persisted under STORAGE_KEY):
   {
     guard: { name, phone, role },
     pending:   [{ id, name, phone, purpose, hostName, requestedAt, type }],
     inside:    [{ id, name, phone, purpose, hostName, checkInTime, type }],
     expected:  [{ id, name, phone, purpose, hostName, expectedTime }],
     checkedOut:[{ id, name, phone, purpose, hostName, checkInTime, checkOutTime }]
   }
   ============================================================ */

const VMS_SECURITY = (function () {
  const STORAGE_KEY = "vms_security_state";
  const SEED_URL = "./security-dashboard-data.json";

  const AVATAR_COLORS = ["#3654F6", "#FF9635", "#8B6CF7", "#2ECC71", "#FF5C72", "#17A2B8"];

  function colorFor(id) {
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  function initials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function readRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("VMS_SECURITY: failed to read state", e);
      return null;
    }
  }

  function write(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("VMS_SECURITY: failed to save state", e);
    }
    return state;
  }

  function defaultState() {
    return {
      guard: { name: "Rajat Kumar", phone: "9990069090", role: "Security Guard" },
      pending: [],
      inside: [],
      expected: [],
      checkedOut: []
    };
  }

  // Loads state: localStorage if present, else fetch the seed JSON (works when
  // served over http/https). Falls back to a small built-in seed if fetch
  // fails (e.g. opened directly via file://).
  async function load() {
    const existing = readRaw();
    if (existing) return existing;

    let seed = null;
    try {
      const res = await fetch(SEED_URL, { cache: "no-store" });
      if (res.ok) seed = await res.json();
    } catch (e) {
      // fetch not available (file:// protocol) — fall back below
    }

    const state = seed && seed.pending ? seed : defaultState();
    write(state);
    return state;
  }

  function getState() {
    return readRaw() || defaultState();
  }

  function saveState(state) {
    return write(state);
  }

  // ---------------- Actions ----------------

  function addPendingApproval({ name, phone, purpose, hostName, type }) {
    const state = getState();
    const entry = {
      id: uid("pnd"),
      name, phone, purpose,
      hostName: hostName || "—",
      type: type || "visitor",
      requestedAt: nowTime()
    };
    state.pending.unshift(entry);
    saveState(state);
    return entry;
  }

  function approvePending(id) {
    const state = getState();
    const idx = state.pending.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const [p] = state.pending.splice(idx, 1);
    const entry = {
      id: p.id,
      name: p.name,
      phone: p.phone,
      purpose: p.purpose,
      hostName: p.hostName,
      type: p.type,
      checkInTime: nowTime()
    };
    state.inside.unshift(entry);
    saveState(state);
    return entry;
  }

  function denyPending(id) {
    const state = getState();
    const idx = state.pending.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const [p] = state.pending.splice(idx, 1);
    saveState(state);
    return p;
  }

  function checkInDirect({ name, phone, purpose, hostName, type }) {
    const state = getState();
    const entry = {
      id: uid("in"),
      name, phone, purpose,
      hostName: hostName || "—",
      type: type || "walk-in",
      checkInTime: nowTime()
    };
    state.inside.unshift(entry);
    saveState(state);
    return entry;
  }

  function checkInFromExpected(id) {
    const state = getState();
    const idx = state.expected.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const [e] = state.expected.splice(idx, 1);
    const entry = {
      id: e.id,
      name: e.name,
      phone: e.phone,
      purpose: e.purpose,
      hostName: e.hostName,
      type: "pre-registered",
      checkInTime: nowTime()
    };
    state.inside.unshift(entry);
    saveState(state);
    return entry;
  }

  function checkOut(id) {
    const state = getState();
    const idx = state.inside.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    const [v] = state.inside.splice(idx, 1);
    const entry = { ...v, checkOutTime: nowTime() };
    state.checkedOut.unshift(entry);
    saveState(state);
    return entry;
  }

  function addExpected({ name, phone, purpose, hostName, expectedTime }) {
    const state = getState();
    const entry = {
      id: uid("exp"),
      name, phone, purpose,
      hostName: hostName || "—",
      expectedTime: expectedTime || "Today"
    };
    state.expected.unshift(entry);
    saveState(state);
    return entry;
  }

  function findAnyById(id) {
    const state = getState();
    return (
      state.pending.find((x) => x.id === id) ||
      state.inside.find((x) => x.id === id) ||
      state.expected.find((x) => x.id === id) ||
      state.checkedOut.find((x) => x.id === id) ||
      null
    );
  }

  function resetDemoData() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ---------------- UI helpers ----------------

  function toast(message, variant) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.className = "toast" + (variant ? " toast-" + variant : "");
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function goTo(url) {
    window.location.href = url;
  }

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  return {
    load, getState, saveState,
    addPendingApproval, approvePending, denyPending,
    checkInDirect, checkInFromExpected, checkOut, addExpected,
    findAnyById, resetDemoData,
    colorFor, initials, uid, nowTime,
    toast, goTo, qs
  };
})();
