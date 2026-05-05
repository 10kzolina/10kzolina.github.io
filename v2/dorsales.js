import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const state = {
  corredores: [],
  query: "",
  filtroEstado: "todos"
};

const els = {
  search: document.getElementById("busqueda-dorsales"),
  estado: document.getElementById("estado-entrega"),
  total: document.getElementById("stat-total-corredores"),
  entregados: document.getElementById("stat-entregados"),
  pendientes: document.getElementById("stat-pendientes"),
  tickets: document.getElementById("stat-tickets"),
  tbody: document.getElementById("tabla-dorsales"),
  mobile: document.getElementById("mobile-dorsales"),
  empty: document.getElementById("sin-dorsales"),
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

function showToast(message) {
  if (!els.toast) return;

  els.toast.textContent = message;
  els.toast.classList.add("show");

  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2200);
}

function getFilteredCorredores() {
  const q = normalizeText(state.query);

  return state.corredores.filter((corredor) => {
    const matchesSearch =
      !q ||
      normalizeText(corredor.nombre).includes(q) ||
      normalizeText(corredor.correo).includes(q) ||
      normalizeText(corredor.dorsal).includes(q);

    const matchesEstado =
      state.filtroEstado === "todos" ||
      (state.filtroEstado === "entregados" && corredor.bolsa_entregada) ||
      (state.filtroEstado === "pendientes" && !corredor.bolsa_entregada);

    return matchesSearch && matchesEstado;
  });
}

function renderStats() {
  const total = state.corredores.length;
  const entregados = state.corredores.filter((c) => c.bolsa_entregada).length;
  const pendientes = total - entregados;
  const tickets = state.corredores.reduce((acc, c) => acc + Number(c.comida || 0), 0);

  els.total.textContent = total;
  els.entregados.textContent = entregados;
  els.pendientes.textContent = pendientes;
  els.tickets.textContent = tickets;
}

function getEstadoBadge(corredor) {
  if (corredor.bolsa_entregada) {
    return `<span class="delivery-badge delivery-badge--done">Entregado</span>`;
  }

  return `<span class="delivery-badge delivery-badge--pending">Pendiente</span>`;
}

function getComidaLabel(comida) {
  const tickets = Number(comida || 0);

  if (tickets === 0) return "Sin comida";
  if (tickets === 1) return "1 ticket";
  return `${tickets} tickets`;
}

function renderDesktopRows(corredores) {
  els.tbody.innerHTML = corredores.map((corredor) => `
    <tr class="${corredor.bolsa_entregada ? "row-delivered" : ""}">
      <td>
        <strong class="bib-number">${escapeHtml(corredor.dorsal || "—")}</strong>
      </td>
      <td>
        <strong>${escapeHtml(corredor.nombre || "Sin nombre")}</strong>
        <small>${escapeHtml(corredor.correo || "Sin correo")}</small>
      </td>
      <td>${escapeHtml(getComidaLabel(corredor.comida))}</td>
      <td>${getEstadoBadge(corredor)}</td>
      <td>
        <input
          class="notes-input"
          type="text"
          value="${escapeHtml(corredor.notas || "")}"
          placeholder="Añadir nota..."
          data-action="nota"
          data-id="${escapeHtml(corredor.id)}"
        />
      </td>
      <td>
        <div class="delivery-actions">
          <button
            class="secondary-button compact-delivery-button"
            type="button"
            data-action="guardar-nota"
            data-id="${escapeHtml(corredor.id)}">
            Guardar
          </button>

          <button
            class="${corredor.bolsa_entregada ? "secondary-button" : "primary-button"} compact-delivery-button"
            type="button"
            data-action="${corredor.bolsa_entregada ? "reabrir" : "entregar"}"
            data-id="${escapeHtml(corredor.id)}">
            ${corredor.bolsa_entregada ? "Reabrir" : "Entregar"}
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderMobileCards(corredores) {
  els.mobile.innerHTML = corredores.map((corredor) => `
    <article class="delivery-card ${corredor.bolsa_entregada ? "delivery-card--done" : ""}">
      <div class="delivery-card-header">
        <div>
          <span class="bib-number">Dorsal ${escapeHtml(corredor.dorsal || "—")}</span>
          <h3>${escapeHtml(corredor.nombre || "Sin nombre")}</h3>
          <p>${escapeHtml(corredor.correo || "Sin correo")}</p>
        </div>
        ${getEstadoBadge(corredor)}
      </div>

      <div class="delivery-card-meta">
        <span>${escapeHtml(getComidaLabel(corredor.comida))}</span>
      </div>

      <label for="nota-mobile-${escapeHtml(corredor.id)}">Notas</label>
      <input
        id="nota-mobile-${escapeHtml(corredor.id)}"
        class="notes-input"
        type="text"
        value="${escapeHtml(corredor.notas || "")}"
        placeholder="Añadir nota..."
        data-action="nota"
        data-id="${escapeHtml(corredor.id)}"
      />

      <div class="delivery-card-actions">
        <button
          class="secondary-button compact-delivery-button"
          type="button"
          data-action="guardar-nota"
          data-id="${escapeHtml(corredor.id)}">
          Guardar nota
        </button>

        <button
          class="${corredor.bolsa_entregada ? "secondary-button" : "primary-button"} compact-delivery-button"
          type="button"
          data-action="${corredor.bolsa_entregada ? "reabrir" : "entregar"}"
          data-id="${escapeHtml(corredor.id)}">
          ${corredor.bolsa_entregada ? "Reabrir entrega" : "Marcar entregado"}
        </button>
      </div>
    </article>
  `).join("");
}

function render() {
  const corredores = getFilteredCorredores();

  renderStats();
  renderDesktopRows(corredores);
  renderMobileCards(corredores);

  const hasResults = corredores.length > 0;
  els.empty.style.display = hasResults ? "none" : "block";
}

function getCorredorRef(id) {
  return doc(db, "corredores", id);
}

function getNotaValue(id) {
  const input = document.querySelector(`.notes-input[data-id="${CSS.escape(id)}"]`);
  return input ? input.value.trim() : "";
}

async function guardarNota(id) {
  const nota = getNotaValue(id);

  await updateDoc(getCorredorRef(id), {
    notas: nota,
    actualizado_en: serverTimestamp()
  });

  showToast("Nota guardada");
}

async function entregarPack(id) {
  const nota = getNotaValue(id);

  await updateDoc(getCorredorRef(id), {
    bolsa_entregada: true,
    notas: nota,
    entregado_en: serverTimestamp(),
    actualizado_en: serverTimestamp()
  });

  showToast("Pack marcado como entregado");
}

async function reabrirEntrega(id) {
  const nota = getNotaValue(id);

  await updateDoc(getCorredorRef(id), {
    bolsa_entregada: false,
    notas: nota,
    reabierto_en: serverTimestamp(),
    actualizado_en: serverTimestamp()
  });

  showToast("Entrega reabierta");
}

async function handleAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (!id || action === "nota") return;

  button.disabled = true;

  try {
    if (action === "guardar-nota") await guardarNota(id);
    if (action === "entregar") await entregarPack(id);
    if (action === "reabrir") await reabrirEntrega(id);
  } catch (error) {
    console.error(error);
    showToast("Error al guardar. Revisa conexión o permisos.");
  } finally {
    button.disabled = false;
  }
}

function bindEvents() {
  els.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });

  els.estado.addEventListener("change", (event) => {
    state.filtroEstado = event.target.value;
    render();
  });

  document.addEventListener("click", handleAction);
}

function subscribeCorredores() {
  onSnapshot(collection(db, "corredores"), (snapshot) => {
    state.corredores = snapshot.docs
      .map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data()
      }))
      .sort((a, b) => {
        const dorsalA = Number(a.dorsal);
        const dorsalB = Number(b.dorsal);

        if (!Number.isNaN(dorsalA) && !Number.isNaN(dorsalB)) {
          return dorsalA - dorsalB;
        }

        return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
      });

    render();
  }, (error) => {
    console.error(error);
    showToast("No se han podido cargar los corredores.");
  });
}

bindEvents();
subscribeCorredores();