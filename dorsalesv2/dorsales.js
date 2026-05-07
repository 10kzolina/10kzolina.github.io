import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  runTransaction,
  serverTimestamp,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyEfdhjarJRPKIL4vB6uDOFumWdOJi124",
  authDomain: "dorsales-b3177.firebaseapp.com",
  projectId: "dorsales-b3177",
  storageBucket: "dorsales-b3177.firebasestorage.app",
  messagingSenderId: "775171249677",
  appId: "1:775171249677:web:390c17ec6e7e266c7ba744",
  measurementId: "G-6E53XY30F4"
};

const COLLECTION_NAME = "corredores";
const DEVICE_ID_KEY = "10kzolina_dorsales_device_id";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let unsubscribeFirestore = null;
let currentUser = null;

const state = {
  runners: [],
  search: "",
  status: "todos",
  race: "todas",
  food: "todos",
  order: "dorsal",
  connection: "reconnecting",
  loading: true,
  pendingIds: new Set(),
  dirtyNotes: new Map(),
  expandedDetails: new Set()
};

const elements = {
  authScreen: document.getElementById("auth-screen"),
  app: document.getElementById("dorsales-app"),
  loginForm: document.getElementById("login-form"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  loginError: document.getElementById("login-error"),
  authUserPill: document.getElementById("auth-user-pill"),
  authUserEmail: document.getElementById("auth-user-email"),
  logoutButton: document.getElementById("logout-button"),
  connectionStatus: document.getElementById("connection-status"),
  connectionIcon: document.getElementById("connection-icon"),
  connectionLabel: document.getElementById("connection-label"),
  search: document.getElementById("busqueda-dorsales"),
  status: document.getElementById("estado-dorsales"),
  race: document.getElementById("carrera-dorsales"),
  food: document.getElementById("comida-dorsales"),
  order: document.getElementById("orden-dorsales"),
  tableBody: document.getElementById("tabla-corredores"),
  mobileList: document.getElementById("mobile-corredores"),
  empty: document.getElementById("sin-corredores"),
  loading: document.getElementById("loading-state"),
  visibleCount: document.getElementById("visible-count"),
  statTotalRunners: document.getElementById("stat-total-corredores"),
  statPendingRunners: document.getElementById("stat-corredores-pendientes"),
  statTotalDiners: document.getElementById("stat-total-comensales"),
  statPendingDiners: document.getElementById("stat-comensales-pendientes"),
  raceSummaryPanel: document.getElementById("race-summary-panel"),
  toast: document.getElementById("toast")
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toSafeInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getStoredDeviceId() {
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const generated = `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  } catch (_) {
    return "device-no-localstorage";
  }
}

function getDeviceLabel() {
  const userAgent = navigator.userAgent || "";

  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Macintosh|Mac OS/i.test(userAgent)) return "Mac";
  if (/Linux/i.test(userAgent)) return "Linux";

  return navigator.platform || "Dispositivo desconocido";
}

function getDeviceAuditData() {
  return {
    dispositivo_id: getStoredDeviceId(),
    dispositivo: getDeviceLabel(),
    user_agent: navigator.userAgent || "",
    pantalla: `${window.screen?.width || 0}x${window.screen?.height || 0}`
  };
}

function getUserEmail() {
  return currentUser?.email || "desconocido";
}

function normalizeNoteEntry(entry = {}) {
  if (typeof entry === "string") {
    return {
      texto: entry,
      creado_en_iso: "",
      creado_por: "desconocido",
      dispositivo: ""
    };
  }

  return {
    texto: typeof entry.texto === "string" ? entry.texto : String(entry.texto || ""),
    creado_en_iso: typeof entry.creado_en_iso === "string" ? entry.creado_en_iso : "",
    creado_por: entry.creado_por || "desconocido",
    dispositivo: entry.dispositivo || "",
    dispositivo_id: entry.dispositivo_id || ""
  };
}

function normalizeRunner(documentId, data = {}) {
  const noteHistory = Array.isArray(data.notas_historial)
    ? data.notas_historial.map(normalizeNoteEntry).filter((entry) => entry.texto.trim())
    : [];

  return {
    id: documentId,
    correo: data.correo || "",
    telefono: data.telefono || data.teléfono || data.phone || "",
    dni: data.dni || data.DNI || "",
    nombre: data.nombre || "",
    dorsal: data.dorsal || "",
    carrera: data.carrera || "",
    comida: Number.isFinite(Number(data.comida)) ? Number(data.comida) : 0,
    bolsa_entregada: Boolean(data.bolsa_entregada),
    notas: typeof data.notas === "string" ? data.notas : String(data.notas || ""),
    notas_historial: noteHistory,
    entregado_en: data.entregado_en || null,
    entregado_por: data.entregado_por || "",
    entregado_dispositivo: data.entregado_dispositivo || data.dispositivo_entrega || "",
    entregado_dispositivo_id: data.entregado_dispositivo_id || "",
    reabierto_en: data.reabierto_en || null,
    reabierto_por: data.reabierto_por || "",
    reabierto_dispositivo: data.reabierto_dispositivo || "",
    reabierto_dispositivo_id: data.reabierto_dispositivo_id || ""
  };
}

function mergeRunnerFromFirestore(runnerId, data = {}) {
  const index = state.runners.findIndex((runner) => runner.id === runnerId);
  const normalized = normalizeRunner(runnerId, data);

  if (index === -1) {
    state.runners.push(normalized);
    return;
  }

  state.runners[index] = {
    ...state.runners[index],
    ...normalized
  };
}

function getRunner(runnerId) {
  return state.runners.find((runner) => runner.id === runnerId) || null;
}

function getNoteHistoryText(runner) {
  const history = Array.isArray(runner.notas_historial) ? runner.notas_historial : [];
  return history.map((entry) => entry.texto).join(" ");
}

function getRunnerSearchText(runner) {
  const draftNote = state.dirtyNotes.has(runner.id) ? state.dirtyNotes.get(runner.id) : "";

  return normalizeText(`
    ${runner.nombre}
    ${runner.correo}
    ${runner.telefono}
    ${runner.dni}
    ${runner.dorsal}
    ${runner.carrera}
    ${runner.notas}
    ${getNoteHistoryText(runner)}
    ${draftNote}
  `);
}

function compareByDorsal(a, b) {
  const dorsalA = toSafeInt(a.dorsal);
  const dorsalB = toSafeInt(b.dorsal);

  if (dorsalA !== dorsalB) return dorsalA - dorsalB;
  return normalizeText(a.nombre).localeCompare(normalizeText(b.nombre), "es");
}

function hasFood(runner) {
  return getFoodTickets(runner) > 0;
}

function getFilteredRunners() {
  const query = normalizeText(state.search);

  const filtered = state.runners.filter((runner) => {
    const matchesSearch = !query || getRunnerSearchText(runner).includes(query);
    const matchesStatus =
      state.status === "todos" ||
      (state.status === "pendientes" && !runner.bolsa_entregada) ||
      (state.status === "entregados" && runner.bolsa_entregada);
    const matchesRace =
      state.race === "todas" || normalizeText(runner.carrera || "sin carrera") === state.race;
    const matchesFood =
      state.food === "todos" ||
      (state.food === "con-comida" && hasFood(runner)) ||
      (state.food === "sin-comida" && !hasFood(runner)) ||
      (state.food === "comida-pendiente" && hasFood(runner) && !runner.bolsa_entregada);

    return matchesSearch && matchesStatus && matchesRace && matchesFood;
  });

  return filtered.sort((a, b) => {
    if (state.order === "nombre") {
      return normalizeText(a.nombre).localeCompare(normalizeText(b.nombre), "es");
    }

    if (state.order === "carrera") {
      const byRace = normalizeText(a.carrera).localeCompare(normalizeText(b.carrera), "es");
      if (byRace !== 0) return byRace;
      return compareByDorsal(a, b);
    }

    if (state.order === "estado") {
      if (a.bolsa_entregada !== b.bolsa_entregada) return a.bolsa_entregada ? 1 : -1;
      return compareByDorsal(a, b);
    }

    return compareByDorsal(a, b);
  });
}

function getFoodLabel(comida) {
  const tickets = toSafeInt(comida);
  if (tickets <= 0) return "Sin comida";
  if (tickets === 1) return "1 ticket";
  return `${tickets} tickets`;
}

function getRaceLabel(carrera) {
  const cleanRace = String(carrera || "").trim();
  return cleanRace || "Sin carrera";
}

function getStatusLabel(delivered) {
  return delivered ? "Entregado" : "Pendiente";
}

function getNoteDirtyMarkup(isDirty) {
  return isDirty ? `<span class="note-dirty-label">Sin guardar</span>` : "";
}

function isRealRunner(runner) {
  return normalizeText(runner.carrera) !== "no corredor";
}

function getFoodTickets(runner) {
  return Math.max(0, toSafeInt(runner.comida));
}

function timestampToLabel(value) {
  if (!value) return "";

  let date = null;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (value instanceof Date) {
    date = value;
  }

  if (!date) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function buildRaceStats() {
  const stats = new Map();

  for (const runner of state.runners) {
    const race = getRaceLabel(runner.carrera);

    if (!stats.has(race)) {
      stats.set(race, {
        race,
        total: 0,
        pending: 0,
        foodTotal: 0,
        foodPending: 0
      });
    }

    const current = stats.get(race);
    const tickets = getFoodTickets(runner);

    if (isRealRunner(runner)) {
      current.total += 1;
      if (!runner.bolsa_entregada) current.pending += 1;
    }

    current.foodTotal += tickets;
    if (!runner.bolsa_entregada) current.foodPending += tickets;
  }

  return [...stats.values()].sort((a, b) => normalizeText(a.race).localeCompare(normalizeText(b.race), "es"));
}

function renderRaceSummary() {
  const stats = buildRaceStats();

  if (!stats.length) {
    elements.raceSummaryPanel.innerHTML = "";
    return;
  }

  elements.raceSummaryPanel.innerHTML = stats.map((item) => {
    const race = escapeHtml(item.race);
    const pending = escapeHtml(item.pending);
    const total = escapeHtml(item.total);
    const foodPending = escapeHtml(item.foodPending);
    const foodTotal = escapeHtml(item.foodTotal);

    return `
      <div class="race-summary-chip">
        <strong>${race}</strong>
        <span>${pending}/${total} dorsales pendientes</span>
        <span>${foodPending}/${foodTotal} comidas pendientes</span>
      </div>
    `;
  }).join("");
}

function renderRaceFilterOptions() {
  const races = [...new Set(state.runners.map((runner) => getRaceLabel(runner.carrera)))]
    .sort((a, b) => normalizeText(a).localeCompare(normalizeText(b), "es"));

  const previousValue = state.race;
  const options = [`<option value="todas">Todas</option>`].concat(
    races.map((race) => {
      const value = normalizeText(race || "sin carrera");
      return `<option value="${escapeHtml(value)}">${escapeHtml(race)}</option>`;
    })
  );

  elements.race.innerHTML = options.join("");

  const hasPrevious = [...elements.race.options].some((option) => option.value === previousValue);
  state.race = hasPrevious ? previousValue : "todas";
  elements.race.value = state.race;
}

function renderStats(filteredCount) {
  const realRunners = state.runners.filter(isRealRunner);

  const totalRunners = realRunners.length;
  const pendingRunners = realRunners.filter((runner) => !runner.bolsa_entregada).length;

  const totalDiners = state.runners.reduce((sum, runner) => sum + getFoodTickets(runner), 0);
  const pendingDiners = state.runners.reduce((sum, runner) => {
    if (runner.bolsa_entregada) return sum;
    return sum + getFoodTickets(runner);
  }, 0);

  elements.statTotalRunners.textContent = totalRunners;
  elements.statPendingRunners.textContent = pendingRunners;
  elements.statTotalDiners.textContent = totalDiners;
  elements.statPendingDiners.textContent = pendingDiners;
  elements.visibleCount.textContent = state.loading ? "Cargando..." : `${filteredCount} visibles`;

  renderRaceSummary();
}

function renderNoteHistory(runner) {
  const history = Array.isArray(runner.notas_historial) ? runner.notas_historial : [];

  if (!history.length) {
    if (!runner.notas) return `<div class="note-history-empty">Sin notas previas</div>`;

    return `
      <div class="note-history">
        <article class="note-history-item note-history-item--legacy">
          <div class="note-history-meta">Nota antigua</div>
          <p>${escapeHtml(runner.notas)}</p>
        </article>
      </div>
    `;
  }

  const ordered = [...history].reverse();

  return `
    <div class="note-history">
      ${ordered.map((entry) => {
        const date = timestampToLabel(entry.creado_en_iso) || "Sin fecha";
        const author = entry.creado_por || "desconocido";
        const device = entry.dispositivo ? ` · ${entry.dispositivo}` : "";

        return `
          <article class="note-history-item">
            <div class="note-history-meta">${escapeHtml(date)} · ${escapeHtml(author)}${escapeHtml(device)}</div>
            <p>${escapeHtml(entry.texto)}</p>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderDetails(runner) {
  const deliveredAt = timestampToLabel(runner.entregado_en);
  const reopenedAt = timestampToLabel(runner.reabierto_en);

  return `
    <div class="runner-details">
      <div><span>DNI</span><strong>${escapeHtml(runner.dni || "No indicado")}</strong></div>
      <div><span>Teléfono</span><strong>${escapeHtml(runner.telefono || "No indicado")}</strong></div>
      <div><span>Correo</span><strong>${escapeHtml(runner.correo || "No indicado")}</strong></div>
      <div><span>Entregado</span><strong>${escapeHtml(deliveredAt || "No")}</strong></div>
      <div><span>Entregado por</span><strong>${escapeHtml(runner.entregado_por || "-")}</strong></div>
      <div><span>Dispositivo entrega</span><strong>${escapeHtml(runner.entregado_dispositivo || "-")}</strong></div>
      <div><span>Reabierto</span><strong>${escapeHtml(reopenedAt || "-")}</strong></div>
      <div><span>Reabierto por</span><strong>${escapeHtml(runner.reabierto_por || "-")}</strong></div>
      <div><span>Dispositivo reapertura</span><strong>${escapeHtml(runner.reabierto_dispositivo || "-")}</strong></div>
    </div>
  `;
}

function renderNoteEditor(runner, pending) {
  const isDirty = state.dirtyNotes.has(runner.id);
  const note = isDirty ? state.dirtyNotes.get(runner.id) : "";

  return `
    <div class="note-cell">
      <textarea class="note-input" rows="2" placeholder="Añadir nueva nota al historial..." data-note-input="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>${escapeHtml(note)}</textarea>
      <div class="note-actions-row">
        ${getNoteDirtyMarkup(isDirty)}
      </div>
      ${renderNoteHistory(runner)}
    </div>
  `;
}

function renderTableRow(runner) {
  const delivered = Boolean(runner.bolsa_entregada);
  const pending = state.pendingIds.has(runner.id);
  const expanded = state.expandedDetails.has(runner.id);

  return `
    <tr class="${delivered ? "runner-delivered" : ""}" data-runner-id="${escapeHtml(runner.id)}">
      <td><span class="dorsal-chip">${escapeHtml(runner.dorsal || "--")}</span></td>
      <td>
        <div class="runner-main">
          <span class="runner-name">${escapeHtml(runner.nombre || "Sin nombre")}</span>
          <button class="details-button" type="button" data-action="toggle-details" data-runner-id="${escapeHtml(runner.id)}">
            ${expanded ? "Ocultar detalles" : "Mostrar detalles"}
          </button>
          ${expanded ? renderDetails(runner) : ""}
        </div>
      </td>
      <td><span class="race-chip">${escapeHtml(getRaceLabel(runner.carrera))}</span></td>
      <td><span class="food-chip ${toSafeInt(runner.comida) <= 0 ? "no-food" : ""}">${escapeHtml(getFoodLabel(runner.comida))}</span></td>
      <td><span class="status-chip ${delivered ? "delivered" : "pending"}">${getStatusLabel(delivered)}</span></td>
      <td>${renderNoteEditor(runner, pending)}</td>
      <td>
        <div class="runner-actions">
          <button class="action-button save-note-button" type="button" data-action="save-note" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>Guardar nota</button>
          <button class="action-button ${delivered ? "undo-button" : "deliver-button"}" type="button" data-action="${delivered ? "undo" : "deliver"}" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>
            ${delivered ? "Entregado · reabrir" : "Entregar"}
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderMobileCard(runner) {
  const delivered = Boolean(runner.bolsa_entregada);
  const pending = state.pendingIds.has(runner.id);
  const expanded = state.expandedDetails.has(runner.id);

  return `
    <article class="runner-card ${delivered ? "runner-delivered" : ""}" data-runner-id="${escapeHtml(runner.id)}">
      <div class="runner-card-top">
        <div class="runner-card-info">
          <span class="runner-card-name">${escapeHtml(runner.nombre || "Sin nombre")}</span>
          <span class="runner-card-email">${escapeHtml(getRaceLabel(runner.carrera))}</span>
        </div>
        <span class="dorsal-chip">${escapeHtml(runner.dorsal || "--")}</span>
      </div>

      <div class="runner-card-meta">
        <span class="race-chip">${escapeHtml(getRaceLabel(runner.carrera))}</span>
        <span class="food-chip ${toSafeInt(runner.comida) <= 0 ? "no-food" : ""}">${escapeHtml(getFoodLabel(runner.comida))}</span>
        <span class="status-chip ${delivered ? "delivered" : "pending"}">${getStatusLabel(delivered)}</span>
      </div>

      <button class="details-button details-button--mobile" type="button" data-action="toggle-details" data-runner-id="${escapeHtml(runner.id)}">
        ${expanded ? "Ocultar detalles" : "Mostrar DNI, teléfono y correo"}
      </button>

      ${expanded ? renderDetails(runner) : ""}

      ${renderNoteEditor(runner, pending)}

      <div class="runner-actions">
        <button class="action-button save-note-button" type="button" data-action="save-note" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>Guardar nota</button>
        <button class="action-button ${delivered ? "undo-button" : "deliver-button"}" type="button" data-action="${delivered ? "undo" : "deliver"}" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>
          ${delivered ? "Entregado · reabrir" : "Entregar pack"}
        </button>
      </div>
    </article>
  `;
}

function render() {
  const runners = getFilteredRunners();
  renderStats(runners.length);

  elements.loading.style.display = state.loading ? "block" : "none";
  elements.empty.style.display = !state.loading && runners.length === 0 ? "block" : "none";

  elements.tableBody.innerHTML = runners.map(renderTableRow).join("");
  elements.mobileList.innerHTML = runners.map(renderMobileCard).join("");
}

function setConnectionState(connectionState) {
  state.connection = connectionState;

  const config = {
    connected: { icon: "🟢", label: "Conectado" },
    reconnecting: { icon: "🟡", label: "Reconectando" },
    offline: { icon: "🔴", label: "Sin conexión" }
  }[connectionState] || { icon: "🟡", label: "Reconectando" };

  elements.connectionIcon.textContent = config.icon;
  elements.connectionLabel.textContent = config.label;

  elements.connectionStatus.classList.remove("connection-pill--connected", "connection-pill--reconnecting", "connection-pill--offline");
  elements.connectionStatus.classList.add(`connection-pill--${connectionState}`);
}

function showToast(message, isError = false, options = {}) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.classList.toggle("toast--large", Boolean(options.large));
  elements.toast.classList.add("is-visible");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible", "is-error", "toast--large");
  }, options.duration || (options.large ? 4600 : 3200));
}

function getNoteValue(runnerId, sourceElement) {
  const container = sourceElement.closest(`[data-runner-id="${CSS.escape(runnerId)}"]`);
  const input = container?.querySelector(`[data-note-input="${CSS.escape(runnerId)}"]`);

  if (input) return input.value.trim();
  if (state.dirtyNotes.has(runnerId)) return state.dirtyNotes.get(runnerId).trim();

  return "";
}

function updateLocalRunner(runnerId, updates) {
  const index = state.runners.findIndex((runner) => runner.id === runnerId);
  if (index === -1) return;

  state.runners[index] = {
    ...state.runners[index],
    ...updates
  };
}

function clearNoteInputs(runnerId) {
  state.dirtyNotes.delete(runnerId);

  document.querySelectorAll(`[data-note-input="${CSS.escape(runnerId)}"]`).forEach((input) => {
    input.value = "";
  });
}

async function saveNote(runnerId, note) {
  if (!note.trim()) {
    showToast("Escribe una nota antes de guardarla.", true);
    return false;
  }

  const runner = getRunner(runnerId);
  if (!runner) {
    showToast("No se ha encontrado este corredor.", true);
    return false;
  }

  const device = getDeviceAuditData();
  const noteEntry = {
    texto: note.trim(),
    creado_en_iso: new Date().toISOString(),
    creado_por: getUserEmail(),
    dispositivo: device.dispositivo,
    dispositivo_id: device.dispositivo_id
  };

  state.pendingIds.add(runnerId);
  render();

  try {
    await updateDoc(doc(db, COLLECTION_NAME, runnerId), {
      notas: noteEntry.texto,
      notas_historial: arrayUnion(noteEntry),
      actualizado_en: serverTimestamp(),
      actualizado_por: getUserEmail(),
      actualizado_dispositivo: device.dispositivo,
      actualizado_dispositivo_id: device.dispositivo_id
    });

    clearNoteInputs(runnerId);
    updateLocalRunner(runnerId, {
      notas: noteEntry.texto,
      notas_historial: [...(runner.notas_historial || []), noteEntry]
    });
    render();

    showToast("Nota guardada en el historial");
    return true;
  } catch (error) {
    console.error("Error guardando nota", error);
    showToast("No se ha podido guardar la nota. Revisa permisos de Firestore.", true);
    return false;
  } finally {
    state.pendingIds.delete(runnerId);
    render();
  }
}

async function updateRunner(runnerId, updates, successMessage) {
  const device = getDeviceAuditData();

  state.pendingIds.add(runnerId);
  render();

  try {
    await updateDoc(doc(db, COLLECTION_NAME, runnerId), {
      ...updates,
      actualizado_en: serverTimestamp(),
      actualizado_por: getUserEmail(),
      actualizado_dispositivo: device.dispositivo,
      actualizado_dispositivo_id: device.dispositivo_id
    });

    updateLocalRunner(runnerId, updates);
    render();
    showToast(successMessage, false, { large: true });
  } catch (error) {
    console.error("Error actualizando corredor", error);
    showToast("No se ha podido guardar el cambio. Revisa permisos o conexión.", true);
  } finally {
    state.pendingIds.delete(runnerId);
    render();
  }
}

async function deliverRunnerSafely(runnerId) {
  const runner = getRunner(runnerId);
  const device = getDeviceAuditData();

  state.pendingIds.add(runnerId);
  render();

  try {
    const runnerRef = doc(db, COLLECTION_NAME, runnerId);

    const result = await runTransaction(db, async (transaction) => {
      const runnerSnapshot = await transaction.get(runnerRef);

      if (!runnerSnapshot.exists()) {
        throw new Error("runner-not-found");
      }

      const data = runnerSnapshot.data();

      if (data.bolsa_entregada === true) {
        return {
          alreadyDelivered: true,
          data
        };
      }

      transaction.update(runnerRef, {
        bolsa_entregada: true,
        entregado_en: serverTimestamp(),
        entregado_por: getUserEmail(),
        entregado_dispositivo: device.dispositivo,
        entregado_dispositivo_id: device.dispositivo_id,
        entregado_user_agent: device.user_agent,
        entregado_pantalla: device.pantalla,
        actualizado_en: serverTimestamp(),
        actualizado_por: getUserEmail(),
        actualizado_dispositivo: device.dispositivo,
        actualizado_dispositivo_id: device.dispositivo_id
      });

      return {
        alreadyDelivered: false,
        data: {
          ...data,
          bolsa_entregada: true,
          entregado_por: getUserEmail(),
          entregado_dispositivo: device.dispositivo,
          entregado_dispositivo_id: device.dispositivo_id
        }
      };
    });

    mergeRunnerFromFirestore(runnerId, result.data);
    render();

    if (result.alreadyDelivered) {
      showToast("Este dorsal ya estaba entregado. Tabla actualizada.", true, { large: true });
      return;
    }

    const dorsal = runner?.dorsal || result.data?.dorsal || "--";
    const name = runner?.nombre || result.data?.nombre || "Sin nombre";
    showToast(`Dorsal ${dorsal} · ${name} entregado`, false, { large: true });
  } catch (error) {
    console.error("Error entregando pack", error);
    const message = error.message === "runner-not-found"
      ? "No se ha encontrado este corredor en Firestore."
      : "No se ha podido entregar. Revisa permisos o conexión.";
    showToast(message, true, { large: true });
  } finally {
    state.pendingIds.delete(runnerId);
    render();
  }
}

function handleActionClick(event) {
  const button = event.target.closest("[data-action][data-runner-id]");
  if (!button) return;

  const runnerId = button.dataset.runnerId;
  const action = button.dataset.action;

  if (action === "toggle-details") {
    if (state.expandedDetails.has(runnerId)) {
      state.expandedDetails.delete(runnerId);
    } else {
      state.expandedDetails.add(runnerId);
    }
    render();
    return;
  }

  if (action === "save-note") {
    saveNote(runnerId, getNoteValue(runnerId, button));
    return;
  }

  if (action === "deliver") {
    deliverRunnerSafely(runnerId);
    return;
  }

  if (action === "undo") {
    const runner = getRunner(runnerId);
    const label = runner ? `Dorsal ${runner.dorsal || "--"} · ${runner.nombre || "Sin nombre"}` : "esta entrega";
    const confirmed = window.confirm(`¿Seguro que quieres reabrir ${label}?`);
    if (!confirmed) return;

    const device = getDeviceAuditData();

    updateRunner(
      runnerId,
      {
        bolsa_entregada: false,
        reabierto_en: serverTimestamp(),
        reabierto_por: getUserEmail(),
        reabierto_dispositivo: device.dispositivo,
        reabierto_dispositivo_id: device.dispositivo_id,
        reabierto_user_agent: device.user_agent,
        reabierto_pantalla: device.pantalla
      },
      "Entrega reabierta"
    );
  }
}

function handleNoteInput(event) {
  const input = event.target.closest("[data-note-input]");
  if (!input) return;

  const runnerId = input.dataset.noteInput;
  const value = input.value;

  if (!value.trim()) {
    state.dirtyNotes.delete(runnerId);
  } else {
    state.dirtyNotes.set(runnerId, value);
  }

  document.querySelectorAll(`[data-note-input="${CSS.escape(runnerId)}"]`).forEach((otherInput) => {
    if (otherInput !== input) otherInput.value = value;
  });

  renderNoteDirtyLabels(runnerId);
}

function renderNoteDirtyLabels(runnerId) {
  const isDirty = state.dirtyNotes.has(runnerId);

  document.querySelectorAll(`[data-runner-id="${CSS.escape(runnerId)}"] .note-actions-row`).forEach((container) => {
    container.innerHTML = getNoteDirtyMarkup(isDirty);
  });
}

function showLoginError(message) {
  elements.loginError.textContent = message;
  elements.loginError.hidden = false;
}

function clearLoginError() {
  elements.loginError.textContent = "";
  elements.loginError.hidden = true;
}

function setAppVisible(isVisible) {
  elements.authScreen.hidden = isVisible;
  elements.app.hidden = !isVisible;
  elements.authUserPill.hidden = !isVisible;
  elements.connectionStatus.hidden = !isVisible;
}

function resetLocalState() {
  state.runners = [];
  state.search = "";
  state.status = "todos";
  state.race = "todas";
  state.food = "todos";
  state.order = "dorsal";
  state.loading = true;
  state.pendingIds.clear();
  state.dirtyNotes.clear();
  state.expandedDetails.clear();

  elements.search.value = "";
  elements.status.value = "todos";
  elements.race.value = "todas";
  elements.food.value = "todos";
  elements.order.value = "dorsal";

  render();
}

function getLoginErrorMessage(error) {
  if (error?.code === "auth/invalid-credential" || error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password") {
    return "Correo o contraseña incorrectos.";
  }

  if (error?.code === "auth/too-many-requests") {
    return "Demasiados intentos. Espera un poco antes de volver a probar.";
  }

  if (error?.code === "auth/network-request-failed") {
    return "No hay conexión. Revisa la red e inténtalo de nuevo.";
  }

  return "No se ha podido iniciar sesión.";
}

function bindAuthEvents() {
  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearLoginError();

    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      elements.loginPassword.value = "";
    } catch (error) {
      console.error("Error iniciando sesión", error);
      showLoginError(getLoginErrorMessage(error));
    }
  });

  elements.logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error cerrando sesión", error);
      showToast("No se ha podido cerrar sesión.", true);
    }
  });
}

function watchAuthState() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (!user) {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      resetLocalState();
      setAppVisible(false);
      return;
    }

    elements.authUserEmail.textContent = user.email || "Usuario";
    setAppVisible(true);
    setConnectionState(navigator.onLine ? "reconnecting" : "offline");

    if (!unsubscribeFirestore) {
      subscribeToFirestore();
    }
  });
}

function bindEvents() {
  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });

  elements.status.addEventListener("change", (event) => {
    state.status = event.target.value;
    render();
  });

  elements.race.addEventListener("change", (event) => {
    state.race = event.target.value;
    render();
  });

  elements.food.addEventListener("change", (event) => {
    state.food = event.target.value;
    render();
  });

  elements.order.addEventListener("change", (event) => {
    state.order = event.target.value;
    render();
  });

  document.addEventListener("click", handleActionClick);
  document.addEventListener("input", handleNoteInput);

  window.addEventListener("online", () => {
    if (!currentUser) return;
    setConnectionState("reconnecting");
  });

  window.addEventListener("offline", () => {
    if (!currentUser) return;
    setConnectionState("offline");
    showToast("Sin conexión. No marques entregas hasta recuperar conexión.", true, { large: true });
  });
}

function subscribeToFirestore() {
  const corredoresRef = collection(db, COLLECTION_NAME);

  unsubscribeFirestore = onSnapshot(
    corredoresRef,
    (snapshot) => {
      state.runners = snapshot.docs.map((documentSnapshot) => {
        return normalizeRunner(documentSnapshot.id, documentSnapshot.data());
      });

      state.loading = false;
      renderRaceFilterOptions();
      setConnectionState(navigator.onLine ? "connected" : "offline");
      render();
    },
    (error) => {
      console.error("Error cargando corredores", error);
      state.loading = false;
      setConnectionState(navigator.onLine ? "reconnecting" : "offline");
      render();
      showToast("No se han podido cargar los corredores. Revisa reglas de Firestore o conexión.", true, { large: true });
    }
  );
}

bindEvents();
bindAuthEvents();
render();
watchAuthState();
