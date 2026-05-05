import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
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
  pendingIds: new Set()
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

function getRunnerSearchText(runner) {
  return normalizeText(`${runner.nombre} ${runner.correo} ${runner.dorsal}`);
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

    if (state.order === "estado") {
      if (a.bolsa_entregada !== b.bolsa_entregada) return a.bolsa_entregada ? 1 : -1;
    }

    const dorsalA = toSafeInt(a.dorsal);
    const dorsalB = toSafeInt(b.dorsal);
    if (dorsalA !== dorsalB) return dorsalA - dorsalB;

    return normalizeText(a.nombre).localeCompare(normalizeText(b.nombre), "es");
  });
}

function getFoodLabel(comida) {
  const tickets = toSafeInt(comida);
  if (tickets <= 0) return "Sin comida";
  if (tickets === 1) return "1 ticket";
  return `${tickets} tickets`;
}

function getStatusLabel(delivered) {
  return delivered ? "Entregado" : "Pendiente";
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
  const note = runner.notas || "";

  return `
    <tr class="${delivered ? "runner-delivered" : ""}" data-runner-id="${escapeHtml(runner.id)}">
      <td><span class="dorsal-chip">${escapeHtml(runner.dorsal || "--")}</span></td>
      <td>
        <div class="runner-main">
          <span class="runner-name">${escapeHtml(runner.nombre || "Sin nombre")}</span>
        </div>
      </td>
      <td><span class="runner-subtle">${escapeHtml(runner.correo || "Sin correo")}</span></td>
      <td><span class="food-chip ${toSafeInt(runner.comida) <= 0 ? "no-food" : ""}">${escapeHtml(getFoodLabel(runner.comida))}</span></td>
      <td><span class="status-chip ${delivered ? "delivered" : "pending"}">${getStatusLabel(delivered)}</span></td>
      <td>
        <input class="note-input" type="text" value="${escapeHtml(note)}" placeholder="Añadir nota..." data-note-input="${escapeHtml(runner.id)}" />
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
  const note = runner.notas || "";

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
        <span class="food-chip ${toSafeInt(runner.comida) <= 0 ? "no-food" : ""}">${escapeHtml(getFoodLabel(runner.comida))}</span>
        <span class="status-chip ${delivered ? "delivered" : "pending"}">${getStatusLabel(delivered)}</span>
      </div>

      <input class="note-input" type="text" value="${escapeHtml(note)}" placeholder="Añadir nota..." data-note-input="${escapeHtml(runner.id)}" />

      <div class="runner-actions">
        <button class="action-button save-note-button" type="button" data-action="save-note" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>Guardar nota</button>
        <button class="action-button ${delivered ? "undo-button" : "deliver-button"}" type="button" data-action="${delivered ? "undo" : "deliver"}" data-runner-id="${escapeHtml(runner.id)}" ${pending ? "disabled" : ""}>
          ${delivered ? "Reabrir" : "Entregar pack"}
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

function getNoteValue(runnerId, sourceElement) {
  const container = sourceElement.closest(`[data-runner-id="${CSS.escape(runnerId)}"]`);
  const input = container?.querySelector(`[data-note-input="${CSS.escape(runnerId)}"]`);
  return input ? input.value.trim() : "";
}

async function updateRunner(runnerId, updates, successMessage) {
  state.pendingIds.add(runnerId);
  render();

  try {
    await updateDoc(doc(db, COLLECTION_NAME, runnerId), {
      ...updates,
      actualizado_en: serverTimestamp()
    });

    showToast(successMessage);
  } catch (error) {
    console.error(error);
    showToast("No se ha podido guardar el cambio. Revisa permisos de Firestore.", true);
  } finally {
    state.pendingIds.delete(runnerId);
    render();
  }
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.classList.add("is-visible");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible", "is-error");
  }, 2400);
}

function handleActionClick(event) {
  const button = event.target.closest("[data-action][data-runner-id]");
  if (!button) return;

  const runnerId = button.dataset.runnerId;
  const action = button.dataset.action;
  const note = getNoteValue(runnerId, button);

  if (action === "save-note") {
    updateRunner(runnerId, { notas: note }, "Nota guardada");
    return;
  }

  if (action === "deliver") {
    updateRunner(
      runnerId,
      {
        notas: note,
        bolsa_entregada: true,
        entregado_en: serverTimestamp()
      },
      "Pack marcado como entregado"
    );
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
        const data = documentSnapshot.data();

        return {
          id: documentSnapshot.id,
          correo: data.correo || "",
          nombre: data.nombre || "",
          dorsal: data.dorsal || "",
          comida: Number.isFinite(Number(data.comida)) ? Number(data.comida) : 0,
          bolsa_entregada: Boolean(data.bolsa_entregada),
          notas: data.notas || ""
        };
      });

      state.loading = false;
      render();
    },
    (error) => {
      console.error(error);
      state.loading = false;
      render();
      showToast("No se han podido cargar los corredores. Revisa reglas de Firestore.", true);
    }
  );
}

bindEvents();
render();
subscribeToFirestore();
