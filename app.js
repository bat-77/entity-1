/* ================= ENTITY-1 ================= */

const ADMINS = [
  { username:"ahnaf", password:"bat" },
  { username:"chris", password:"warmachine" },
  { username:"bhav", password:"ironman" }
];

const CURRENCIES = ["USD","EUR","CHF","SGD","CAD","GBP","JPY"];
const FALLBACK_RATES_USD = { USD:1, EUR:0.92, CHF:0.88, SGD:1.34, CAD:1.36, GBP:0.79, JPY:149 };

let RATES = { ...FALLBACK_RATES_USD };
let displayCurrency = "USD";
let currentTab = "looking";
let currentUser = null; // {username}
let entries = [];
let viewMode = "cards"; // "cards" | "boxes"
let lastKnownSha = null; // GitHub blob sha for data/entries.json, needed to commit updates
let pollTimer = null;

/* ---------- storage: GitHub itself is the backend ---------- */
// Data lives as a plain JSON file (data/entries.json) in this repo. Reads
// use GitHub's raw CDN (no login needed — works for any visitor). Writes
// use the GitHub API to commit the updated file, which needs an admin's
// personal access token (pasted once into the login screen, stored only
// in that browser's localStorage — never committed to the repo).
//
// If config.js hasn't been filled in yet (still says
// "YOUR-GITHUB-USERNAME"), the app falls back to local-only mode: each
// browser keeps its own copy in localStorage, exactly like before.
const STORAGE_KEY = "entity1_entries_v1";
const TOKEN_KEY = "entity1_gh_token";
const POLL_MS = 20000;

function githubConfigured(){
  return typeof GITHUB_CONFIG !== "undefined" && GITHUB_CONFIG &&
    GITHUB_CONFIG.owner && GITHUB_CONFIG.owner !== "YOUR-GITHUB-USERNAME" &&
    GITHUB_CONFIG.repo && GITHUB_CONFIG.repo !== "YOUR-REPO-NAME";
}
function getToken(){ return localStorage.getItem(TOKEN_KEY) || ""; }
function setToken(t){ if(t) localStorage.setItem(TOKEN_KEY, t); }

function rawDataUrl(){
  const { owner, repo, branch, dataPath } = GITHUB_CONFIG;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${dataPath}?t=${Date.now()}`;
}
function apiContentsUrl(){
  const { owner, repo, dataPath } = GITHUB_CONFIG;
  return `https://api.github.com/repos/${owner}/${repo}/contents/${dataPath}`;
}

function renderSyncStatus(){
  const el = document.getElementById("syncStatus");
  if(!el) return;
  if(githubConfigured()){
    el.textContent = "SYNCED — GITHUB";
    el.title = "Reading/writing data/entries.json in your GitHub repo.";
  } else {
    el.textContent = "LOCAL ONLY";
    el.title = "config.js isn't set up yet — see README.md to enable syncing via GitHub.";
  }
}

/* ---- GitHub mode: read ---- */
async function fetchEntriesFromGitHub(){
  const res = await fetch(rawDataUrl(), { cache:"no-store" });
  if(!res.ok) throw new Error("Could not fetch data/entries.json (HTTP " + res.status + ")");
  const data = await res.json();
  entries = data;
  render();
}
function startPolling(){
  if(pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    fetchEntriesFromGitHub().catch(err => console.warn("Poll failed:", err));
  }, POLL_MS);
}

/* ---- GitHub mode: write ---- */
async function commitEntries(newEntries, message){
  const token = getToken();
  if(!token){
    alert("No GitHub token saved in this browser. Log in again and paste a personal access token (see README.md for how to create one) — it's needed to save changes.");
    throw new Error("missing token");
  }
  // Get the current file sha (required by GitHub to update a file)
  const getRes = await fetch(apiContentsUrl() + `?ref=${GITHUB_CONFIG.branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
  });
  if(!getRes.ok) throw new Error("Could not read current file from GitHub (HTTP " + getRes.status + ")");
  const getData = await getRes.json();
  const sha = getData.sha;

  const jsonStr = JSON.stringify(newEntries, null, 2);
  const contentB64 = btoa(unescape(encodeURIComponent(jsonStr)));

  const putRes = await fetch(apiContentsUrl(), {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    body: JSON.stringify({
      message: message || `ENTITY-1 update by ${currentUser ? currentUser.username : "unknown"}`,
      content: contentB64,
      sha,
      branch: GITHUB_CONFIG.branch
    })
  });
  if(putRes.status === 409){
    throw new Error("Someone else just saved a change. Refreshing latest data — please retry your edit.");
  }
  if(!putRes.ok){
    const errBody = await putRes.json().catch(() => ({}));
    throw new Error("GitHub commit failed (HTTP " + putRes.status + "): " + (errBody.message || "unknown error"));
  }
  entries = newEntries;
  render();
}

/* ---- localStorage fallback mode ---- */
function loadEntriesLocal(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{ entries = JSON.parse(raw); return; }catch(e){}
  }
  entries = (typeof SEED_ENTRIES !== "undefined" ? SEED_ENTRIES : []).map(e =>
    ({ ...e, id: crypto.randomUUID(), createdAt: Date.now(), tags: e.tags || [], log: [] }));
  saveEntriesLocal();
}
function saveEntriesLocal(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/* ---- unified write API used by the rest of the app ---- */
async function createEntry(data){
  const newEntry = {
    ...data,
    id: (crypto.randomUUID ? crypto.randomUUID() : "e-" + Date.now()),
    createdAt: Date.now(),
    log: [{ text:"Entry created", user: currentUser ? currentUser.username : "system", time: Date.now() }]
  };
  const next = [newEntry, ...entries];
  if(githubConfigured()){
    await commitEntries(next, `Add ${data.make} ${data.model}`);
  } else {
    entries = next; saveEntriesLocal(); render();
  }
}
async function updateEntry(id, data){
  const next = entries.map(en => en.id === id ? { ...en, ...data } : en);
  if(githubConfigured()){
    await commitEntries(next, `Update ${data.make} ${data.model}`);
  } else {
    entries = next; saveEntriesLocal(); render();
  }
}
async function deleteEntryById(id){
  const target = entries.find(en => en.id === id);
  const next = entries.filter(en => en.id !== id);
  if(githubConfigured()){
    await commitEntries(next, `Delete ${target ? target.make + " " + target.model : id}`);
  } else {
    entries = next; saveEntriesLocal(); render();
  }
}
async function appendLog(entry, text){
  const newLog = [{ text, user: currentUser ? currentUser.username : "system", time: Date.now() }, ...(entry.log || [])];
  const next = entries.map(en => en.id === entry.id ? { ...en, log: newLog } : en);
  if(githubConfigured()){
    await commitEntries(next, `Log update on ${entry.make} ${entry.model}: ${text}`);
  } else {
    entries = next; saveEntriesLocal(); render();
  }
  return newLog;
}

/* ---------- image compression (keeps commits small & fast) ---------- */
function compressImage(dataUrl, maxWidth = 900, quality = 0.72){
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/* ---------- theming ---------- */
const THEME_KEY = "entity1_theme";
function themesForCurrentUser(){
  return (currentUser && currentUser.username === "ahnaf") ? ["dark","light","bat"] : ["dark","light"];
}
function applyTheme(theme){
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  document.getElementById("themeIconSun").classList.toggle("hidden", theme !== "light");
  document.getElementById("themeIconMoon").classList.toggle("hidden", theme === "light");
  const favMap = { dark:"favicon-dark.png", light:"favicon-light.png", bat:"favicon-bat.png" };
  document.getElementById("faviconLink").setAttribute("href", favMap[theme] || favMap.dark);
}
function cycleTheme(){
  const list = themesForCurrentUser();
  const current = document.body.getAttribute("data-theme");
  let idx = list.indexOf(current);
  if(idx === -1) idx = 0;
  const next = list[(idx + 1) % list.length];
  applyTheme(next);
}
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  const allowed = themesForCurrentUser();
  applyTheme(saved && allowed.includes(saved) ? saved : "dark");
}

/* ---------- currency ---------- */
async function loadRates(){
  try{
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if(!res.ok) throw new Error("bad response");
    const data = await res.json();
    if(data && data.rates){
      const r = { USD:1 };
      CURRENCIES.forEach(c => { if(data.rates[c]) r[c] = data.rates[c]; });
      RATES = { ...FALLBACK_RATES_USD, ...r };
    }
  }catch(e){
    console.warn("Live FX rates unavailable, using fallback rates.", e);
  }
}
function convert(amount, fromCur, toCur){
  if(!amount) return 0;
  const usd = amount / (RATES[fromCur] || 1);
  return usd * (RATES[toCur] || 1);
}
function fmtMoney(amount, cur){
  if(!amount) return "POA";
  const symbols = { USD:"$", EUR:"€", CHF:"CHF ", SGD:"S$", CAD:"C$", GBP:"£", JPY:"¥" };
  const val = Math.round(amount).toLocaleString();
  return (symbols[cur] || cur+" ") + val;
}

/* ---------- auth ---------- */
function isAdmin(){ return !!currentUser; }

function renderAuthArea(){
  const el = document.getElementById("authArea");
  if(currentUser){
    el.innerHTML = `<span class="user-tag">${currentUser.username}</span>
      <button class="btn" id="logoutBtn">Log Out</button>`;
    document.getElementById("logoutBtn").onclick = () => {
      currentUser = null;
      sessionStorage.removeItem("entity1_user");
      renderAuthArea(); refreshAdminUI(); initTheme();
    };
  } else {
    el.innerHTML = `<button class="btn" id="loginBtn">Admin Login</button>`;
    document.getElementById("loginBtn").onclick = openLogin;
  }
}
function refreshAdminUI(){
  document.querySelectorAll(".admin-only").forEach(elm => {
    elm.classList.toggle("hidden", !isAdmin());
  });
  render();
}
function openLogin(){
  document.getElementById("loginError").textContent = "";
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("loginToken").value = "";
  document.getElementById("loginModal").classList.remove("hidden");
}
function closeLogin(){ document.getElementById("loginModal").classList.add("hidden"); }

function attemptLogin(){
  const u = document.getElementById("loginUser").value.trim().toLowerCase();
  const p = document.getElementById("loginPass").value;
  const t = document.getElementById("loginToken").value.trim();
  const match = ADMINS.find(a => a.username === u && a.password === p);
  if(match){
    currentUser = { username: match.username };
    sessionStorage.setItem("entity1_user", JSON.stringify(currentUser));
    if(t) setToken(t);
    closeLogin();
    renderAuthArea();
    refreshAdminUI();
    if(match.username === "ahnaf"){ applyTheme("bat"); }
  } else {
    document.getElementById("loginError").textContent = "Invalid username or password.";
  }
}

/* ---------- rendering ---------- */
function populateCurrencySelects(){
  const sel = document.getElementById("currencySelect");
  sel.innerHTML = CURRENCIES.map(c => `<option value="${c}">${c}</option>`).join("");
  sel.value = displayCurrency;
  sel.onchange = () => { displayCurrency = sel.value; render(); };

  const fsel = document.getElementById("f_currency");
  fsel.innerHTML = CURRENCIES.map(c => `<option value="${c}">${c}</option>`).join("");
}

function setViewMode(mode){
  viewMode = mode;
  const grid = document.getElementById("cardGrid");
  grid.classList.toggle("view-cards", mode === "cards");
  grid.classList.toggle("view-boxes", mode === "boxes");
  document.getElementById("viewCardsBtn").classList.toggle("active", mode === "cards");
  document.getElementById("viewBoxesBtn").classList.toggle("active", mode === "boxes");
}

function initials(str){
  return (str || "?").split(/\s+/).filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join("");
}

function render(){
  const grid = document.getElementById("cardGrid");
  const search = document.getElementById("searchBox").value.trim().toLowerCase();
  const list = entries.filter(e => e.type === currentTab).filter(e => {
    if(!search) return true;
    const hay = [e.make,e.model,e.vin,e.location,e.notes,(e.tags||[]).join(" ")].join(" ").toLowerCase();
    return hay.includes(search);
  }).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

  document.getElementById("entryCount").textContent = list.length;

  if(list.length === 0){
    grid.innerHTML = `<div style="color:var(--muted);padding:40px 0;text-align:center;">No entries yet.</div>`;
    return;
  }

  grid.innerHTML = list.map(e => {
    const converted = fmtMoney(convert(e.amount, e.currency, displayCurrency), displayCurrency);
    const img = e.image ? `<img class="card-img" src="${e.image}">` : "";
    const tags = (e.tags && e.tags.length ? e.tags : [e.process, e.priority]).filter(Boolean);
    const tagsHtml = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
    return `
      <div class="card" data-id="${e.id}">
        <div class="card-top">
          <div class="avatar">${initials(e.make + " " + e.model)}</div>
          <div class="card-headline">
            <div class="card-title-row">
              <div>
                <div class="card-title">${escapeHtml(e.make)} ${escapeHtml(e.model)}</div>
                <div class="card-sub">${[e.year, e.location].filter(Boolean).join(" · ") || "&nbsp;"}</div>
              </div>
              <span class="badge ${e.priority}">${e.priority}</span>
            </div>
          </div>
        </div>
        ${img}
        <div class="card-notes">${escapeHtml(e.notes || "")}</div>
        <div class="tag-row">${tagsHtml}</div>
        <div class="card-foot">
          <div class="card-stats"><span>${e.mileage || "—"}</span><span>${e.process || ""}</span></div>
          <div class="card-price">${converted}</div>
        </div>
      </div>`;
  }).join("");

  grid.querySelectorAll(".card").forEach(card => {
    card.onclick = () => openDetail(card.dataset.id);
  });
}

/* ---------- entry form (add/edit) ---------- */
function openEntryForm(type, existing){
  document.getElementById("entryModalTitle").textContent = existing ? "Edit Entry" : "New Entry";
  document.getElementById("entryType").value = type;
  document.getElementById("entryId").value = existing ? existing.id : "";
  const f = id => document.getElementById(id);
  f("f_make").value = existing?.make || "";
  f("f_model").value = existing?.model || "";
  f("f_year").value = existing?.year || "";
  f("f_mileage").value = existing?.mileage || "";
  f("f_vin").value = existing?.vin || "";
  f("f_location").value = existing?.location || "";
  f("f_priority").value = existing?.priority || "Medium";
  f("f_process").value = existing?.process || "";
  f("f_leads").value = existing?.leads || "";
  f("f_amount").value = existing?.amount || "";
  f("f_currency").value = existing?.currency || "USD";
  f("f_tags").value = (existing?.tags || []).join(", ");
  f("f_notes").value = existing?.notes || "";
  const preview = f("f_imagePreview");
  if(existing?.image){ preview.src = existing.image; preview.classList.remove("hidden"); }
  else { preview.src=""; preview.classList.add("hidden"); }
  f("f_image").value = "";
  f("f_image").dataset.current = existing?.image || "";
  document.getElementById("entrySaveBtn").disabled = false;
  document.getElementById("entrySaveBtn").textContent = "Save Entry";
  document.getElementById("entryModal").classList.remove("hidden");
}
function closeEntryForm(){ document.getElementById("entryModal").classList.add("hidden"); }

document.addEventListener("DOMContentLoaded", async () => {
  const savedUser = sessionStorage.getItem("entity1_user");
  if(savedUser){ try{ currentUser = JSON.parse(savedUser); }catch(e){} }

  populateCurrencySelects();
  renderAuthArea();
  initTheme();
  refreshAdminUI();
  renderSyncStatus();
  loadRates().then(render);

  if(githubConfigured()){
    try{
      await fetchEntriesFromGitHub();
    }catch(err){
      console.error("Initial GitHub fetch failed, falling back to local mode for this session.", err);
      loadEntriesLocal();
      render();
    }
    startPolling();
  } else {
    loadEntriesLocal();
    render();
  }

  document.getElementById("themeToggle").onclick = cycleTheme;
  document.getElementById("viewCardsBtn").onclick = () => setViewMode("cards");
  document.getElementById("viewBoxesBtn").onclick = () => setViewMode("boxes");

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;
      render();
    };
  });

  document.getElementById("searchBox").addEventListener("input", render);

  document.getElementById("loginSubmit").onclick = attemptLogin;
  document.getElementById("loginCancel").onclick = closeLogin;
  document.getElementById("loginPass").addEventListener("keydown", e => { if(e.key==="Enter") attemptLogin(); });

  document.getElementById("addEntryBtn").onclick = () => {
    if(!isAdmin()) return;
    openEntryForm(currentTab, null);
  };
  document.getElementById("entryCancel").onclick = closeEntryForm;

  document.getElementById("f_image").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result);
      document.getElementById("f_imagePreview").src = compressed;
      document.getElementById("f_imagePreview").classList.remove("hidden");
      document.getElementById("f_image").dataset.current = compressed;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("entryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if(!isAdmin()) return;
    const id = document.getElementById("entryId").value;
    const type = document.getElementById("entryType").value;
    const tags = document.getElementById("f_tags").value.split(",").map(t => t.trim()).filter(Boolean);
    const data = {
      type,
      make: document.getElementById("f_make").value.trim(),
      model: document.getElementById("f_model").value.trim(),
      year: document.getElementById("f_year").value.trim(),
      mileage: document.getElementById("f_mileage").value.trim(),
      vin: document.getElementById("f_vin").value.trim(),
      location: document.getElementById("f_location").value.trim(),
      priority: document.getElementById("f_priority").value,
      process: document.getElementById("f_process").value.trim(),
      leads: document.getElementById("f_leads").value.trim(),
      amount: parseFloat(document.getElementById("f_amount").value) || 0,
      currency: document.getElementById("f_currency").value,
      tags,
      notes: document.getElementById("f_notes").value.trim(),
      image: document.getElementById("f_image").dataset.current || ""
    };

    const saveBtn = document.getElementById("entrySaveBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = githubConfigured() ? "Committing..." : "Saving...";
    try{
      if(id){
        await updateEntry(id, data);
      } else {
        await createEntry(data);
      }
      closeEntryForm();
    }catch(err){
      console.error("Save failed:", err);
      if(githubConfigured()){
        try{ await fetchEntriesFromGitHub(); }catch(e2){}
      }
      alert(err.message || "Could not save. See README for GitHub token setup.");
    }finally{
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Entry";
    }
  });

  document.getElementById("detailModal").addEventListener("click", (e) => {
    if(e.target.id === "detailModal") closeDetail();
  });
  document.getElementById("entryModal").addEventListener("click", (e) => {
    if(e.target.id === "entryModal") closeEntryForm();
  });
  document.getElementById("loginModal").addEventListener("click", (e) => {
    if(e.target.id === "loginModal") closeLogin();
  });
});

/* ---------- detail / log modal ---------- */
function openDetail(id){
  const e = entries.find(en => en.id === id);
  if(!e) return;
  renderDetail(e);
  document.getElementById("detailModal").classList.remove("hidden");
}
function closeDetail(){ document.getElementById("detailModal").classList.add("hidden"); }

function renderDetail(e){
  const converted = fmtMoney(convert(e.amount, e.currency, displayCurrency), displayCurrency);
  const orig = e.currency !== displayCurrency ? ` (orig. ${fmtMoney(e.amount, e.currency)})` : "";
  const img = e.image ? `<img class="detail-img" src="${e.image}">` : "";
  const tags = (e.tags && e.tags.length ? e.tags : []);
  const tagsHtml = tags.length ? `<div class="tag-row">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : "";
  const logsHtml = (e.log||[]).map(l => `
    <div class="log-entry">
      <div>${escapeHtml(l.text)}</div>
      <div class="log-time"><b>${l.user}</b> — ${new Date(l.time).toLocaleString()}</div>
    </div>`).join("") || `<div style="color:var(--muted);font-size:12px;">No updates logged yet.</div>`;

  const adminControls = isAdmin() ? `
    <div class="modal-actions">
      <button class="btn" id="editEntryBtn">Edit</button>
      <button class="btn danger" id="deleteEntryBtn">Delete</button>
    </div>
    <div class="log-add">
      <input type="text" id="logInput" placeholder="Log an update, e.g. 'found a buyer', 'waiting on LOI'">
      <button class="btn primary" id="logAddBtn">Add</button>
    </div>` : "";

  document.getElementById("detailContent").innerHTML = `
    <div class="dh">
      <h2>${escapeHtml(e.make)} ${escapeHtml(e.model)}</h2>
      <span class="badge ${e.priority}">${e.priority}</span>
    </div>
    ${img}
    <div class="card-price" style="font-size:16px;display:inline-block;">${converted}<span style="color:var(--muted);font-size:11px;">${orig}</span></div>
    ${tagsHtml}
    <div class="spec-grid">
      <div><span>Year</span>${e.year || "—"}</div>
      <div><span>Mileage</span>${e.mileage || "—"}</div>
      <div><span>VIN</span>${e.vin || "—"}</div>
      <div><span>Location</span>${e.location || "—"}</div>
      <div><span>Process</span>${e.process || "—"}</div>
      <div><span>Leads</span>${e.leads || "—"}</div>
    </div>
    <div class="notes">${escapeHtml(e.notes || "")}</div>
    ${adminControls}
    <div class="log-section">
      <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);">Update Log</h3>
      ${logsHtml}
    </div>
  `;

  if(isAdmin()){
    document.getElementById("editEntryBtn").onclick = () => { closeDetail(); openEntryForm(e.type, e); };
    document.getElementById("deleteEntryBtn").onclick = async () => {
      if(confirm("Delete this entry?")){
        try{ await deleteEntryById(e.id); closeDetail(); }
        catch(err){ alert(err.message || "Delete failed."); }
      }
    };
    document.getElementById("logAddBtn").onclick = async () => {
      const input = document.getElementById("logInput");
      const text = input.value.trim();
      if(!text) return;
      input.disabled = true;
      try{
        const newLog = await appendLog(e, text);
        e.log = newLog;
        renderDetail(e);
      }catch(err){
        alert(err.message || "Could not save log entry.");
      }
      input.disabled = false;
    };
    document.getElementById("logInput").addEventListener("keydown", ev => {
      if(ev.key === "Enter") document.getElementById("logAddBtn").click();
    });
  }
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
