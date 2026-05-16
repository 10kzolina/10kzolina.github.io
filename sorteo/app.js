import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyEfdhjarJRPKIL4vB6uDOFumWdOJi124",
  authDomain: "dorsales-b3177.firebaseapp.com",
  projectId: "dorsales-b3177",
  storageBucket: "dorsales-b3177.firebasestorage.app",
  messagingSenderId: "775171249677",
  appId: "1:775171249677:web:390c17ec6e7e266c7ba744",
  measurementId: "G-6E53XY30F4",
};

const CSV_URL = "./corredores.csv";
const DRAWS_COLLECTION = "sorteos";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const state = {
  csvLoaded: false,
  currentUser: null,
  history: [],
  runners: [],
};

const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const loginButton = document.querySelector("#loginButton");
const loginMessage = document.querySelector("#loginMessage");
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const logoutButton = document.querySelector("#logoutButton");
const userLabel = document.querySelector("#userLabel");
const drawForm = document.querySelector("#drawForm");
const drawButton = document.querySelector("#drawButton");
const prizeInput = document.querySelector("#prizeInput");
const runnerCount = document.querySelector("#runnerCount");
const appMessage = document.querySelector("#appMessage");
const winnerCard = document.querySelector("#winnerCard");
const winnerName = document.querySelector("#winnerName");
const winnerBib = document.querySelector("#winnerBib");
const winnerPrize = document.querySelector("#winnerPrize");
const historyList = document.querySelector("#historyList");
const historyCount = document.querySelector("#historyCount");
const emptyHistory = document.querySelector("#emptyHistory");
const refreshHistoryButton = document.querySelector("#refreshHistoryButton");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  setLoginLoading(true);

  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value,
    );
    loginForm.reset();
  } catch (error) {
    loginMessage.textContent = getAuthMessage(error);
  } finally {
    setLoginLoading(false);
  }
});

logoutButton.addEventListener("click", async () => {
  await signOut(auth);
});

drawForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const prize = prizeInput.value.trim();
  if (!prize) {
    setAppMessage("Escribe qué se sortea.", "error");
    prizeInput.focus();
    return;
  }

  if (!state.runners.length) {
    setAppMessage("No hay corredores cargados.", "error");
    return;
  }

  drawButton.disabled = true;
  setAppMessage("Sorteando...", "neutral");

  try {
    await delay(650);
    const winner = state.runners[getRandomIndex(state.runners.length)];
    const entry = await saveDraw(prize, winner);

    state.history.unshift(entry);
    renderWinner(entry);
    renderHistory();
    setAppMessage("Sorteo completado y guardado en Firebase.", "success");
    prizeInput.value = "";
    prizeInput.focus();
  } catch (error) {
    setAppMessage("No se pudo guardar el sorteo en Firebase.", "error");
    console.error(error);
  } finally {
    drawButton.disabled = false;
  }
});

refreshHistoryButton.addEventListener("click", async () => {
  if (!state.currentUser) return;
  await loadHistory();
});

historyList.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete-draw]");
  if (!deleteButton) return;

  const drawId = deleteButton.dataset.deleteDraw;
  const entry = state.history.find((item) => item.id === drawId);
  if (!entry) return;

  const shouldDelete = window.confirm(
    `¿Eliminar del historial el sorteo "${entry.prize}"?`,
  );
  if (!shouldDelete) return;

  deleteButton.disabled = true;
  const wasDeleted = await deleteDraw(drawId);
  if (!wasDeleted) {
    deleteButton.disabled = false;
  }
});

onAuthStateChanged(auth, async (user) => {
  state.currentUser = user;

  if (!user) {
    showAuthView();
    return;
  }

  showAppView(user);
  if (!state.csvLoaded) {
    await loadRunners();
  }
  await loadHistory();
});

async function loadHistory() {
  refreshHistoryButton.disabled = true;
  emptyHistory.textContent = "Cargando historial...";
  emptyHistory.classList.remove("is-hidden");
  historyList.innerHTML = "";

  try {
    const drawsQuery = query(
      collection(db, DRAWS_COLLECTION),
      orderBy("fecha", "desc"),
    );
    const snapshot = await getDocs(drawsQuery);
    state.history = snapshot.docs.map(mapDrawDocument);
    renderHistory();
  } catch (error) {
    state.history = [];
    renderHistory();
    emptyHistory.textContent = "No se pudo cargar el historial.";
    setAppMessage("No se pudo cargar el historial de Firebase.", "error");
    console.error(error);
  } finally {
    refreshHistoryButton.disabled = false;
  }
}

async function saveDraw(prize, winner) {
  const createdAt = new Date();
  const payload = {
    premio: prize,
    nombreGanador: winner.name,
    dorsalGanador: winner.bib,
    fecha: serverTimestamp(),
    usuario: state.currentUser?.email || "",
  };

  const docRef = await addDoc(collection(db, DRAWS_COLLECTION), payload);

  return {
    id: docRef.id,
    prize,
    runnerName: winner.name,
    runnerBib: winner.bib,
    createdAt: createdAt.toISOString(),
    createdBy: payload.usuario,
  };
}

async function deleteDraw(drawId) {
  try {
    await deleteDoc(doc(db, DRAWS_COLLECTION, drawId));
    state.history = state.history.filter((entry) => entry.id !== drawId);
    renderHistory();
    setAppMessage("Registro eliminado del historial.", "success");
    return true;
  } catch (error) {
    setAppMessage("No se pudo eliminar el registro en Firebase.", "error");
    console.error(error);
    return false;
  }
}

async function loadRunners() {
  setAppMessage("Cargando CSV...", "neutral");
  drawButton.disabled = true;

  try {
    const response = await fetch(CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${CSV_URL}`);
    }

    const csvText = await response.text();
    state.runners = parseCsv(csvText);
    state.csvLoaded = true;
    runnerCount.textContent = state.runners.length.toString();

    if (!state.runners.length) {
      setAppMessage("El CSV no contiene corredores válidos.", "error");
      return;
    }

    setAppMessage("CSV listo.", "success");
    drawButton.disabled = false;
  } catch (error) {
    setAppMessage(
      "No se pudo cargar corredores.csv. Abre la web desde un servidor local.",
      "error",
    );
    console.error(error);
  }
}

function parseCsv(csvText) {
  return csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine)
    .map((columns) => {
      const bib = (columns.at(-1) || "").trim();
      const name = columns.slice(0, -1).join(",").trim();
      return { name, bib };
    })
    .filter((runner) => runner.name);
}

function parseCsvLine(line) {
  const cells = [];
  let value = "";
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && isQuoted && nextCharacter === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (character === "," && !isQuoted) {
      cells.push(value);
      value = "";
      continue;
    }

    value += character;
  }

  cells.push(value);
  return cells;
}

function renderWinner(entry) {
  winnerName.textContent = entry.runnerName;
  winnerBib.textContent = entry.runnerBib
    ? `Dorsal ${entry.runnerBib}`
    : "Sin dorsal";
  winnerPrize.textContent = entry.prize;
  winnerCard.classList.remove("is-hidden");
}

function renderHistory() {
  historyList.innerHTML = "";
  historyCount.textContent = `${state.history.length} ${
    state.history.length === 1 ? "ganador" : "ganadores"
  }`;
  emptyHistory.textContent = "Todavía no hay ganadores.";

  emptyHistory.classList.toggle("is-hidden", state.history.length > 0);

  for (const entry of state.history) {
    const item = document.createElement("li");
    item.className = "history-item";

    const prize = document.createElement("p");
    prize.className = "history-prize";
    prize.textContent = entry.prize;

    const name = document.createElement("p");
    name.className = "history-name";
    name.textContent = entry.runnerName;

    const meta = document.createElement("div");
    meta.className = "history-meta";

    const bib = document.createElement("span");
    bib.textContent = entry.runnerBib ? `Dorsal ${entry.runnerBib}` : "Sin dorsal";

    const date = document.createElement("span");
    date.textContent = formatDate(entry.createdAt);

    const deleteButton = document.createElement("button");
    deleteButton.className = "history-delete";
    deleteButton.type = "button";
    deleteButton.dataset.deleteDraw = entry.id;
    deleteButton.textContent = "Eliminar";

    meta.append(bib, date);
    item.append(prize, name, meta, deleteButton);
    historyList.append(item);
  }
}

function mapDrawDocument(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    id: documentSnapshot.id,
    prize: data.premio || "",
    runnerName: data.nombreGanador || "",
    runnerBib: data.dorsalGanador || "",
    createdAt: toIsoDate(data.fecha),
    createdBy: data.usuario || "",
  };
}

function showAuthView() {
  appView.classList.add("is-hidden");
  authView.classList.remove("is-hidden");
  userLabel.textContent = "";
  passwordInput.value = "";
}

function showAppView(user) {
  authView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
  userLabel.textContent = user.email || "Sesión iniciada";
}

function setLoginLoading(isLoading) {
  loginButton.disabled = isLoading;
  loginButton.textContent = isLoading ? "Entrando..." : "Iniciar sesión";
}

function setAppMessage(message, tone) {
  appMessage.textContent = message;
  appMessage.classList.remove("is-error", "is-success", "is-neutral");
  appMessage.classList.add(`is-${tone}`);
}

function getAuthMessage(error) {
  const code = error?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password")) {
    return "Email o contraseña incorrectos.";
  }

  if (code.includes("user-not-found")) {
    return "No existe un usuario con ese email.";
  }

  if (code.includes("too-many-requests")) {
    return "Demasiados intentos. Prueba de nuevo más tarde.";
  }

  return "No se pudo iniciar sesión.";
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function toIsoDate(value) {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getRandomIndex(length) {
  const randomValues = new Uint32Array(1);
  window.crypto.getRandomValues(randomValues);
  return randomValues[0] % length;
}
