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
  search: document.getElementById("busqueda-dorsales"),
  status: document.getElementById("estado-dorsales"),
  order: document.getElementById("orden-dorsales"),
  tableBody: document.getElementById("tabla-corredores"),
  mobileList: document.getElementById("mobile-corredores"),
  empty: document.getElementById("sin-corredores"),
  loading: document.getElementById("loading-state"),
  visibleCount: document.getElementById("visible-count"),
  statTotal: document.getElementById("stat-total"),
  statPending: document.getElementById("stat-pendientes"),
  statDelivered: document.getElementById("stat-entregados"),
  statFood: document.getElementById("stat-comida"),
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

function normalizeRunner(documentId, data = {}) {
  return {
    id: documentId,
    correo: data.correo || "",
    nombre: data.nombre || "",
    dorsal: data.dorsal || "",
    carrera: data.carrera || "",
    comida: Number.isFinite(Number(data.comida)) ? Number(data.comida) : 0,
    bolsa_entregada: Boolean(data.bolsa_entregada),
    notas: typeof data.notas === "string" ? data.notas : String(data.notas || "")
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

function getRunnerSearchText(runner) {
  const visibleNote = state.dirtyNotes.has(runner.id) ? state.dirtyNotes.get(runner.id) : runner.notas;
  return normalizeText(`${runner.nombre} ${runner.correo} ${runner.dorsal} ${runner.carrera} ${visibleNote}`);
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

function getCurrentNote(runner) {
  if (state.dirtyNotes.has(runner.id)) {
    return state.dirtyNotes.get(runner.id);
  }

  return runner.notas || "";
}

function getNoteDirtyMarkup(isDirty) {
  return isDirty ? `<span class="note-dirty-label">Sin guardar</span>` : "";
}

function renderStats(filteredCount) {
  const total = state.runners.length;
  const delivered = state.runners.filter((runner) => runner.bolsa_entregada).length;
  const pending = total - delivered;
  const foodTickets = state.runners.reduce((sum, runner) => sum + toSafeInt(runner.comida), 0);

  elements.statTotal.textContent = total;
  elements.statPending.textContent = pending;
  elements.statDelivered.textContent = delivered;
  elements.statFood.textContent = foodTickets;
  elements.visibleCount.textContent = state.loading ? "Cargando..." : `${filteredCount} visibles`;
}

function renderTableRow(runner) {
  const delivered = Boolean(runner.bolsa_entregada);
  const pending = state.pendingIds.has(runner.id);
  const isDirty = state.dirtyNotes.has(runner.id);
  const note = getCurrentNote(runner);

  return `
    <tr class="${delivered ? "runner-delivered" : ""}" data-runner-id="${escapeHtml(runner.id)}">
      <td><span class="dorsal-chip">${escapeHtml(runner.dorsal || "--")}</span></td>
      <td>
        <div class="runner-main">
          <span class="runner-name">${escapeHtml(runner.nombre || "Sin nombre")}</span>
        </div>
      </td>
      <td><span class="runner-subtle">${escapeHtml(runner.correo || "Sin correo")}</span></td>
      <td><span class="race-chip">${escapeHtml(getRaceLabel(runner.carrera))}</span></td>
      <td><span class="food-chip ${toSafeInt(runner.comida) <= 0 ? "no-food" : ""}">${escapeHtml(getFoodLabel(runner.comida))}</span></td>
      <td><span class="status-chip ${delivered ? "delivered" : "pending"}">${getStatusLabel(delivered)}</span></td>
      <td>
        <div class="note-cell">
          <textarea class="note-input" rows="2" placeholder="Añadir nota..." data-note-input="${escapeHtml(runner.id)}">${escapeHtml(note)}</textarea>
          ${getNoteDirtyMarkup(isDirty)}
        </div>
      </td>
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
  const isDirty = state.dirtyNotes.has(runner.id);
  const note = getCurrentNote(runner);

  return `
    <article class="runner-card ${delivered ? "runner-delivered" : ""}" data-runner-id="${escapeHtml(runner.id)}">
      <div class="runner-card-top">
        <div class="runner-card-info">
          <span class="runner-card-name">${escapeHtml(runner.nombre || "Sin nombre")}</span>
          <span class="runner-card-email">${escapeHtml(runner.correo || "Sin correo")}</span>
        </div>
        <span class="dorsal-chip">${escapeHtml(runner.dorsal || "--")}</span>
      </div>

      <div class="runner-card-meta">
        <span class="race-chip">${escapeHtml(getRaceLabel(runner.carrera))}</span>
        <span class="food-chip ${toSafeInt(runner.comida) <= 0 ? "no-food" : ""}">${escapeHtml(getFoodLabel(runner.comida))}</span>
        <span class="status-chip ${delivered ? "delivered" : "pending"}">${getStatusLabel(delivered)}</span>
      </div>

      <div class="note-cell">
        <textarea class="note-input" rows="2" placeholder="Añadir nota..." data-note-input="${escapeHtml(runner.id)}">${escapeHtml(note)}</textarea>
        ${getNoteDirtyMarkup(isDirty)}
      </div>

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

  const runner = getRunner(runnerId);
  return runner ? String(runner.notas || "").trim() : "";
}

function updateLocalRunner(runnerId, updates) {
  const index = state.runners.findIndex((runner) => runner.id === runnerId);
  if (index === -1) return;

  state.runners[index] = {
    ...state.runners[index],
    ...updates
  };
}

async function saveNote(runnerId, note, options = {}) {
  const { showSuccess = true } = options;

  state.pendingIds.add(runnerId);
  render();

  try {
    await updateDoc(doc(db, COLLECTION_NAME, runnerId), {
      notas: note,
      actualizado_en: serverTimestamp()
    });

    state.dirtyNotes.delete(runnerId);
    updateLocalRunner(runnerId, { notas: note });
    render();

    if (showSuccess) showToast("Nota guardada");
    return true;
  } catch (error) {
    console.error("Error guardando nota", error);
    showToast("No se ha podido guardar la nota. Revisa que las reglas permitan actualizar el campo 'notas'.", true);
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
      actualizado_en: serverTimestamp()
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

async function deliverRunnerSafely(runnerId, note) {
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
        notas: note,
        bolsa_entregada: true,
        entregado_en: serverTimestamp(),
        actualizado_en: serverTimestamp()
      });

      return {
        alreadyDelivered: false,
        data: {
          ...data,
          notas: note,
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
  const note = getNoteValue(runnerId, button);

  if (action === "save-note") {
    saveNote(runnerId, note);
    return;
  }

  if (action === "deliver") {
    deliverRunnerSafely(runnerId, note);
    return;
  }

  if (action === "undo") {
    updateRunner(
      runnerId,
      {
        notas: note,
        bolsa_entregada: false,
        reabierto_en: serverTimestamp()
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
  const runner = getRunner(runnerId);

  if (runner && value === String(runner.notas || "")) {
    state.dirtyNotes.delete(runnerId);
  } else {
    state.dirtyNotes.set(runnerId, value);
  }

  // Sincroniza el textarea duplicado de la tabla/card para que móvil y escritorio no se pisen.
  document.querySelectorAll(`[data-note-input="${CSS.escape(runnerId)}"]`).forEach((otherInput) => {
    if (otherInput !== input) otherInput.value = value;
  });
}

function handleNoteBlur(event) {
  const input = event.target.closest("[data-note-input]");
  if (!input) return;

  const runnerId = input.dataset.noteInput;
  if (!state.dirtyNotes.has(runnerId)) return;

  saveNote(runnerId, input.value.trim(), { showSuccess: false });
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
  document.addEventListener("blur", handleNoteBlur, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const input = event.target.closest(".note-input");
    if (!input) return;

    event.preventDefault();
    input.blur();
  });
}

function subscribeToFirestore() {
  const corredoresRef = collection(db, COLLECTION_NAME);

  onSnapshot(
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
render();
subscribeToFirestore();
