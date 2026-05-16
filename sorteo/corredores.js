import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const content = document.querySelector("#content");
const authStatus = document.querySelector("#authStatus");
const userLabel = document.querySelector("#userLabel");
const logoutButton = document.querySelector("#logoutButton");
const statusText = document.querySelector("#statusText");
const runnersTable = document.querySelector("#runnersTable");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");

const state = {
  runners: [],
};

logoutButton.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "./index.html";
});

searchInput.addEventListener("input", () => {
  renderRunners(filterRunners(searchInput.value));
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  userLabel.textContent = user.email || "Sesión iniciada";
  authStatus.classList.add("is-hidden");
  content.classList.remove("is-hidden");
  await loadRunners();
});

async function loadRunners() {
  try {
    const response = await fetch(CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${CSV_URL}`);
    }

    const csvText = await response.text();
    state.runners = parseCsv(csvText).sort(compareByBib);
    renderRunners(state.runners);
  } catch (error) {
    statusText.textContent = "No se pudo cargar corredores.csv.";
    statusText.classList.add("error");
    emptyState.textContent = "Comprueba que la web se está abriendo desde XAMPP o un servidor local.";
    emptyState.classList.remove("is-hidden");
    console.error(error);
  }
}

function renderRunners(runners) {
  runnersTable.innerHTML = "";
  const query = searchInput.value.trim();
  statusText.textContent = query
    ? `${runners.length} de ${state.runners.length} corredores`
    : `${runners.length} corredores cargados`;
  statusText.classList.remove("error");

  emptyState.classList.toggle("is-hidden", runners.length > 0);
  emptyState.textContent = runners.length
    ? ""
    : query
      ? "No hay corredores que coincidan con la búsqueda."
      : "No hay corredores cargados.";

  for (const runner of runners) {
    const row = document.createElement("tr");

    const bib = document.createElement("td");
    bib.className = "bib";
    bib.textContent = runner.bib || "-";

    const name = document.createElement("td");
    name.className = "name";
    name.textContent = runner.name;

    row.append(bib, name);
    runnersTable.append(row);
  }
}

function filterRunners(query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return state.runners;
  }

  return state.runners.filter((runner) => {
    const searchableText = normalize(`${runner.bib} ${runner.name}`);
    return searchableText.includes(normalizedQuery);
  });
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

function compareByBib(firstRunner, secondRunner) {
  const firstBib = Number.parseInt(firstRunner.bib, 10);
  const secondBib = Number.parseInt(secondRunner.bib, 10);

  if (Number.isNaN(firstBib) && Number.isNaN(secondBib)) {
    return firstRunner.name.localeCompare(secondRunner.name, "es");
  }

  if (Number.isNaN(firstBib)) return 1;
  if (Number.isNaN(secondBib)) return -1;

  return firstBib - secondBib;
}

function normalize(value) {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
