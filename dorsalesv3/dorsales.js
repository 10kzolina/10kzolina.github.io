import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  runTransaction,
  serverTimestamp
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let unsubscribeFirestore = null;
let currentUser = null;

const state = {
  runners: [],
  search: "",
  status: "todos",
  order: "dorsal",
  loading: true,
  pendingIds: new Set(),
  dirtyNotes: new Map()
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
  search: document.getElementById("busqueda-dorsales"),
  status: document.getElementById("estado-dorsales"),
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

function getFirstTextField(data, keys) {
  for (const key of keys) {
    const value = data?.[key];
    if (value === undefined || value === null) continue;

    const text = String(value).trim();
    if (text) return text;
  }

  return "";
}

function getUnavailableLabel(value, fallback = "Sin datos") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeStoredNoteEntry(entry, index = 0) {
  if (typeof entry === "string") {
    return {
      id: `legacy-array-${index}`,
      texto: entry.trim(),
      autor: "Sistema anterior",
      creado_en: ""
    };
  }

  if (!entry || typeof entry !== "object") return null;

  const texto = getFirstTextField(entry, ["texto", "nota", "text", "message", "contenido"]);
  if (!texto) return null;

  return {
    id: getFirstTextField(entry, ["id"]) || `note-${index}`,
    texto,
    autor: getFirstTextField(entry, ["autor", "correo", "email", "usuario", "created_by", "creado_por"]) || "Sin usuario",
    creado_en: entry.creado_en || entry.created_at || entry.fecha || entry.hora || ""
  };
}

function normalizeNoteHistory(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => normalizeStoredNoteEntry(entry, index))
    .filter(Boolean);
}

function getRawNoteHistoryFromData(data = {}) {
  if (Array.isArray(data.notas_historial)) return data.notas_historial;
  if (Array.isArray(data.historial_notas)) return data.historial_notas;
  if (Array.isArray(data.notas)) return data.notas;
  return [];
}

function getLegacyNoteText(data = {}) {
  if (typeof data.notas === "string") return data.notas.trim();
  if (data.notas === undefined || data.notas === null || Array.isArray(data.notas)) return "";
  return String(data.notas).trim();
}

function getTimestampAsDate(value) {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value?.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function formatNoteDate(value) {
  const date = getTimestampAsDate(value);
  if (!date) return "Sin fecha";

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function createNoteId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createNoteEntry(text) {
  return {
    id: createNoteId(),
    creado_en: new Date().toISOString(),
    autor: currentUser?.email || "desconocido",
    texto: text.trim()
  };
}

function escapeHtmlWithLineBreaks(value) {
  return escapeHtml(value)
    .replaceAll("\r\n", "<br>")
    .replaceAll("\n", "<br>")
    .replaceAll("\r", "<br>");
}

function normalizeRunner(documentId, data = {}) {
  return {
    id: documentId,
    correo: getFirstTextField(data, ["correo", "email", "mail"]),
    telefono: getFirstTextField(data, ["telefono", "teléfono", "movil", "móvil", "phone", "tel"]),
    dni: getFirstTextField(data, ["dni", "DNI", "nif", "NIF", "documento", "documento_identidad"]),
    nombre: getFirstTextField(data, ["nombre", "name"]),
    dorsal: getFirstTextField(data, ["dorsal"]),
    carrera: getFirstTextField(data, ["carrera"]),
    comida: Number.isFinite(Number(data.comida)) ? Number(data.comida) : 0,
    bolsa_entregada: Boolean(data.bolsa_entregada),
    notas: getLegacyNoteText(data),
    notas_historial: normalizeNoteHistory(getRawNoteHistoryFromData(data))
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
  return getDisplayNoteHistory(runner)
    .map((note) => `${note.texto} ${note.autor} ${formatNoteDate(note.creado_en)}`)
    .join(" ");
}

function getRunnerSearchText(runner) {
  const draftNote = state.dirtyNotes.get(runner.id) || "";

  // Aunque correo, teléfono y DNI no se muestren por defecto, siguen entrando en la búsqueda.
  return normalizeText(`
    ${runner.nombre}
    ${runner.correo}
    ${runner.telefono}
    ${runner.dni}
    ${runner.dorsal}
    ${runner.carrera}
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

function getFilteredRunners() {
  const query = normalizeText(state.search);

  const filtered = state.runners.filter((runner) => {
    const matchesSearch = !query || getRunnerSearchText(runner).includes(query);
    const matchesStatus =
      state.status === "todos" ||
      (state.status === "pendientes" && !runner.bolsa_entregada) ||
      (state.status === "entregados" && runner.bolsa_entregada);

    return matchesSearch && matchesStatus;
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

function getCurrentNoteDraft(runner) {
  return state.dirtyNotes.get(runner.id) || "";
}

function getDisplayNoteHistory(runner) {
  const history = Array.isArray(runner.notas_historial) ? runner.notas_historial : [];
  const legacyNotes = runner.notas
    ? [{
        id: `legacy-${runner.id}`,
        texto: runner.notas,
        autor: "Sistema anterior",
        creado_en: ""
      }]
    : [];

  return [...legacyNotes, ...history];
}

function getNoteDirtyMarkup(isDirty) {
  return isDirty ? `<span class="note-dirty-label">Sin guardar</span>` : "";
}

function getSavedNotesMarkup(runner) {
  const notes = getDisplayNoteHistory(runner).slice().reverse();

  if (notes.length === 0) {
    return `
      <div class="note-history note-history-empty">
        <span>Sin notas guardadas</span>
      </div>
    `;
  }

  return `
    <div class="note-history" aria-label="Historial de notas guardadas">
      ${notes.map((note) => `
        <article class="note-history-entry">
          <div class="note-history-meta">
            <span>${escapeHtml(formatNoteDate(note.creado_en))}</span>
            <span>${escapeHtml(note.autor || "Sin usuario")}</span>
          </div>
          <p>${escapeHtmlWithLineBreaks(note.texto || "")}</p>
        </article>
      `).join("")}
    </div>
  `;
}


function getRunnerDetailsMarkup(runner) {
  return `
    <details class="runner-details">
      <summary>
        <span>Mostrar detalles</span>
      </summary>
      <div class="runner-details-grid">
        <div class="runner-detail-item">
          <span class="runner-detail-label">Correo</span>
          <span class="runner-detail-value">${escapeHtml(getUnavailableLabel(runner.correo))}</span>
        </div>
        <div class="runner-detail-item">
          <span class="runner-detail-label">Teléfono</span>
          <span class="runner-detail-value">${escapeHtml(getUnavailableLabel(runner.telefono))}</span>
        </div>
        <div class="runner-detail-item">
          <span class="runner-detail-label">DNI</span>
          <span class="runner-detail-value">${escapeHtml(getUnavailableLabel(runner.dni))}</span>
        </div>
      </div>
    </details>
  `;
}


function isRealRunner(runner) {
  // Los registros con carrera "No corredor" son solo comensales, no corredores.
  return normalizeText(runner.carrera) !== "no corredor";
}

function getFoodTickets(runner) {
  // Comensales = suma de tickets del campo comida. Los 0 no suman.
  return Math.max(0, toSafeInt(runner.comida));
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
}

function renderTableRow(runner) {
  const delivered = Boolean(runner.bolsa_entregada);
  const pending = state.pendingIds.has(runner.id);
  const isDirty = state.dirtyNotes.has(runner.id);
  const noteDraft = getCurrentNoteDraft(runner);

  return `
    <tr class="${delivered ? "runner-delivered" : ""}" data-runner-id="${escapeHtml(runner.id)}">
      <td><span class="dorsal-chip">${escapeHtml(runner.dorsal || "--")}</span></td>
      <td>
        <div class="runner-main">
          <span class="runner-name">${escapeHtml(runner.nombre || "Sin nombre")}</span>
        </div>
      </td>
      <td>${getRunnerDetailsMarkup(runner)}</td>
      <td><span class="race-chip">${escapeHtml(getRaceLabel(runner.carrera))}</span></td>
      <td><span class="food-chip ${toSafeInt(runner.comida) <= 0 ? "no-food" : ""}">${escapeHtml(getFoodLabel(runner.comida))}</span></td>
      <td><span class="status-chip ${delivered ? "delivered" : "pending"}">${getStatusLabel(delivered)}</span></td>
      <td>
        <div class="note-cell">
          ${getSavedNotesMarkup(runner)}
          <textarea class="note-input" rows="2" placeholder="Escribir nueva nota..." data-note-input="${escapeHtml(runner.id)}">${escapeHtml(noteDraft)}</textarea>
          ${getNoteDirtyMarkup(isDirty)}
        </div>
      </td>
      <td>
        <div class="runner-actions">
          <button class="action-button save-note-button" type="button" data-action="save-note" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>Guardar nota</button>
          <button class="action-button ${delivered ? "undo-button" : "deliver-button"}" type="button" data-action="${delivered ? "undo" : "deliver"}" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>
            ${delivered ? "Reabrir" : "Entregar"}
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderMobileCard(runner) {
  const delivered = Boolean(runner.bolsa_entregada);
  const pending = state.pendingIds.has(runner.id);
  const isDirty = state.dirtyNotes.has(runner.id);
  const noteDraft = getCurrentNoteDraft(runner);

  return `
    <article class="runner-card ${delivered ? "runner-delivered" : ""}" data-runner-id="${escapeHtml(runner.id)}">
      <div class="runner-card-top">
        <div class="runner-card-info">
          <span class="runner-card-name">${escapeHtml(runner.nombre || "Sin nombre")}</span>
        </div>
        <span class="dorsal-chip">${escapeHtml(runner.dorsal || "--")}</span>
      </div>

      <div class="runner-card-meta">
        <span class="race-chip">${escapeHtml(getRaceLabel(runner.carrera))}</span>
        <span class="food-chip ${toSafeInt(runner.comida) <= 0 ? "no-food" : ""}">${escapeHtml(getFoodLabel(runner.comida))}</span>
        <span class="status-chip ${delivered ? "delivered" : "pending"}">${getStatusLabel(delivered)}</span>
      </div>

      ${getRunnerDetailsMarkup(runner)}

      <div class="note-cell">
        ${getSavedNotesMarkup(runner)}
        <textarea class="note-input" rows="2" placeholder="Escribir nueva nota..." data-note-input="${escapeHtml(runner.id)}">${escapeHtml(noteDraft)}</textarea>
        ${getNoteDirtyMarkup(isDirty)}
      </div>

      <div class="runner-actions">
        <button class="action-button save-note-button" type="button" data-action="save-note" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>Guardar nota</button>
        <button class="action-button ${delivered ? "undo-button" : "deliver-button"}" type="button" data-action="${delivered ? "undo" : "deliver"}" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>
          ${delivered ? "Reabrir" : "Entregar"}
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

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.classList.add("is-visible");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible", "is-error");
  }, 3200);
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

async function saveNote(runnerId, note) {
  const cleanNote = String(note || "").trim();

  if (!cleanNote) {
    showToast("Escribe una nota antes de guardar.", true);
    return false;
  }

  state.pendingIds.add(runnerId);
  render();

  try {
    const runnerRef = doc(db, COLLECTION_NAME, runnerId);
    const newEntry = createNoteEntry(cleanNote);

    const updatedHistory = await runTransaction(db, async (transaction) => {
      const runnerSnapshot = await transaction.get(runnerRef);

      if (!runnerSnapshot.exists()) {
        throw new Error("runner-not-found");
      }

      const data = runnerSnapshot.data();
      const currentHistory = normalizeNoteHistory(getRawNoteHistoryFromData(data));
      const nextHistory = [...currentHistory, newEntry];

      transaction.update(runnerRef, {
        notas_historial: nextHistory,
        actualizado_en: serverTimestamp(),
        actualizado_por: currentUser?.email || "desconocido"
      });

      return nextHistory;
    });

    state.dirtyNotes.delete(runnerId);
    updateLocalRunner(runnerId, { notas_historial: updatedHistory });
    render();

    showToast("Nota añadida al historial");
    return true;
  } catch (error) {
    console.error("Error guardando nota", error);
    const message = error.message === "runner-not-found"
      ? "No se ha encontrado este corredor en Firestore."
      : "No se ha podido guardar la nota. Revisa permisos de Firestore.";
    showToast(message, true);
    return false;
  } finally {
    state.pendingIds.delete(runnerId);
    render();
  }
}

async function updateRunner(runnerId, updates, successMessage) {
  state.pendingIds.add(runnerId);
  render();

  try {
    await updateDoc(doc(db, COLLECTION_NAME, runnerId), {
      ...updates,
      actualizado_en: serverTimestamp(),
      actualizado_por: currentUser?.email || "desconocido"
    });

    if (Object.prototype.hasOwnProperty.call(updates, "notas")) {
      state.dirtyNotes.delete(runnerId);
    }

    updateLocalRunner(runnerId, updates);
    render();
    showToast(successMessage);
  } catch (error) {
    console.error("Error actualizando corredor", error);
    showToast("No se ha podido guardar el cambio. Revisa permisos de Firestore.", true);
  } finally {
    state.pendingIds.delete(runnerId);
    render();
  }
}

async function deliverRunnerSafely(runnerId) {
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
        entregado_por: currentUser?.email || "desconocido",
        actualizado_en: serverTimestamp(),
        actualizado_por: currentUser?.email || "desconocido"
      });

      return {
        alreadyDelivered: false,
        data: {
          ...data,
          bolsa_entregada: true
        }
      };
    });

    state.dirtyNotes.delete(runnerId);
    mergeRunnerFromFirestore(runnerId, result.data);
    render();

    if (result.alreadyDelivered) {
      showToast("Este dorsal ya estaba entregado. Tabla actualizada.", true);
      return;
    }

    showToast("Pack marcado como entregado");
  } catch (error) {
    console.error("Error entregando pack", error);
    const message = error.message === "runner-not-found"
      ? "No se ha encontrado este corredor en Firestore."
      : "No se ha podido entregar. Revisa permisos o conexión.";
    showToast(message, true);
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

  if (action === "save-note") {
    saveNote(runnerId, getNoteValue(runnerId, button));
    return;
  }

  if (action === "deliver") {
    deliverRunnerSafely(runnerId);
    return;
  }

  if (action === "undo") {
    const confirmed = window.confirm("¿Seguro que quieres reabrir esta entrega?");
    if (!confirmed) return;

    updateRunner(
      runnerId,
      {
        bolsa_entregada: false,
        reabierto_en: serverTimestamp(),
        reabierto_por: currentUser?.email || "desconocido"
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

  if (value.trim()) {
    state.dirtyNotes.set(runnerId, value);
  } else {
    state.dirtyNotes.delete(runnerId);
  }

  // Sincroniza el textarea duplicado de la tabla/card para que móvil y escritorio no se pisen.
  document.querySelectorAll(`[data-note-input="${CSS.escape(runnerId)}"]`).forEach((otherInput) => {
    if (otherInput !== input) otherInput.value = value;
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
}

function resetLocalState() {
  state.runners = [];
  state.search = "";
  state.status = "todos";
  state.order = "dorsal";
  state.loading = true;
  state.pendingIds.clear();
  state.dirtyNotes.clear();

  elements.search.value = "";
  elements.status.value = "todos";
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

  elements.order.addEventListener("change", (event) => {
    state.order = event.target.value;
    render();
  });

  document.addEventListener("click", handleActionClick);
  document.addEventListener("input", handleNoteInput);

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
      render();
    },
    (error) => {
      console.error("Error cargando corredores", error);
      state.loading = false;
      render();
      showToast("No se han podido cargar los corredores. Revisa reglas de Firestore.", true);
    }
  );
}

bindEvents();
bindAuthEvents();
render();
watchAuthState();
