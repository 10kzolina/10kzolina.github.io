const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1sb-6U1vdkLhYuXA5oIiC8RiZHUQu2xwaJMZJo65mOj4/edit?usp=sharing";
const SHEET_NAME = "Inscripción Carrera Solidaria 10K Zolina (respuestas)";

let allRunners = [];

document.addEventListener("DOMContentLoaded", initRegistrations);

async function initRegistrations() {
  const status = document.getElementById("registrations-status");
  const content = document.getElementById("registrations-content");

  try {
    const { summary, runners } = await loadRaceRegistrations();

    allRunners = runners;

    renderSummary(summary);
    renderRunnersTable(runners);
    setupSearch();

    status.hidden = true;
    content.hidden = false;
  } catch (error) {
    console.error(error);

    status.textContent = "No se han podido cargar las inscripciones.";
  }
}

function renderSummary(summary) {
  document.getElementById("total-runners").textContent = summary.total;
  document.getElementById("count-10k").textContent = summary.porCarrera["10k carrera"] || 0;
  document.getElementById("count-5k-carrera").textContent = summary.porCarrera["5k carrera"] || 0;
  document.getElementById("count-5k-marcha").textContent = summary.porCarrera["5k marcha"] || 0;
  document.getElementById("count-txiki").textContent = summary.porCarrera["txiki"] || 0;
}

function renderRunnersTable(runners) {
  const tbody = document.getElementById("runners-table-body");

  tbody.innerHTML = runners.map(runner => `
    <tr>
      <td>${runner.contador}</td>
      <td>
        <span class="runner-name">${escapeHTML(runner.nombreCompleto)}</span>
      </td>
      <td>
        <span class="runner-race">${formatRaceLabel(runner.carrera)}</span>
      </td>
      <td>${escapeHTML(runner.edad)}</td>
      <td>${escapeHTML(runner.telefono)}</td>
      <td>${escapeHTML(runner.correoInscripcion)}</td>
    </tr>
  `).join("");
}

function setupSearch() {
  const input = document.getElementById("runner-search");

  input.addEventListener("input", () => {
    const query = normalizeText(input.value);

    const filtered = allRunners.filter(runner => {
      const searchableText = normalizeText([
        runner.nombreCompleto,
        runner.carrera,
        runner.edad,
        runner.telefono,
        runner.correoInscripcion
      ].join(" "));

      return searchableText.includes(query);
    });

    renderRunnersTable(filtered);
  });
}

function formatRaceLabel(race) {
  const labels = {
    "txiki": "Txiki",
    "10k carrera": "10K carrera",
    "5k marcha": "5K marcha",
    "5k carrera": "5K carrera",
    "sin clasificar": "Sin clasificar"
  };

  return labels[race] || race;
}

function getGoogleSheetCsvUrl(sheetUrl, sheetName = "") {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

  if (!match) {
    throw new Error("No se ha podido extraer el ID del Google Sheet desde la URL.");
  }

  const sheetId = match[1];

  let url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  if (sheetName) {
    url += `&sheet=${encodeURIComponent(sheetName)}`;
  }

  return url;
}

async function loadRaceRegistrations() {
  const csvUrl = getGoogleSheetCsvUrl(GOOGLE_SHEET_URL, SHEET_NAME);

  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`Error descargando el Google Sheet: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const csvRows = parseCSV(csvText);
  const rows = csvRowsToObjects(csvRows);

  const runners = extractRunners(rows);
  const summary = calculateSummary(runners);

  return {
    summary,
    runners
  };
}

function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }

      row.push(cell);

      if (row.some(value => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);

    if (row.some(value => value.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function csvRowsToObjects(rows) {
  const headers = rows[0].map(header => header.trim());

  return rows.slice(1).map(row => {
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = row[index] ? row[index].trim() : "";
    });

    return obj;
  });
}

function extractRunners(rows) {
  if (rows.length === 0) {
    return [];
  }

  const headers = Object.keys(rows[0]);
  const runnerIndexes = getRunnerIndexes(headers);
  const runners = [];

  rows.forEach((registrationRow, registrationIndex) => {
    const registrationEmail = registrationRow["Dirección de correo electrónico"] || "";
    const timestamp = registrationRow["Marca temporal"] || "";

    runnerIndexes.forEach(runnerIndex => {
      const nameColumn = getColumnName("Nombre y Apellidos", runnerIndex);
      const ageColumn = getColumnName("Edad", runnerIndex);
      const dniColumn = getColumnName("Dni", runnerIndex);
      const phoneColumn = getColumnName("Teléfono", runnerIndex);
      const raceColumn = getColumnName("¿Distancia a recorrer?", runnerIndex);

      const fullName = registrationRow[nameColumn];

      if (!fullName || !fullName.trim()) {
        return;
      }

      const raceRaw = registrationRow[raceColumn] || "";

      runners.push({
        contador: runners.length + 1,
        inscripcionNumero: registrationIndex + 1,
        corredorNumeroEnInscripcion: runnerIndex,

        nombreCompleto: fullName.trim(),
        edad: registrationRow[ageColumn] || "",
        dni: registrationRow[dniColumn] || "",
        telefono: registrationRow[phoneColumn] || "",

        carreraOriginal: raceRaw,
        carrera: normalizeRace(raceRaw),

        correoInscripcion: registrationEmail,
        fechaInscripcion: timestamp
      });
    });
  });

  return runners;
}

function getRunnerIndexes(headers) {
  const indexes = [];

  headers.forEach(header => {
    const cleanHeader = header.trim();

    if (cleanHeader === "Nombre y Apellidos") {
      indexes.push(1);
      return;
    }

    const match = cleanHeader.match(/^Nombre y Apellidos\s+(\d+)$/i);

    if (match) {
      indexes.push(Number(match[1]));
    }
  });

  return indexes.sort((a, b) => a - b);
}

function getColumnName(baseName, index) {
  return index === 1 ? baseName : `${baseName} ${index}`;
}

function calculateSummary(runners) {
  const summary = {
    total: runners.length,
    porCarrera: {
      "txiki": 0,
      "10k carrera": 0,
      "5k marcha": 0,
      "5k carrera": 0,
      "sin clasificar": 0
    }
  };

  runners.forEach(runner => {
    if (!summary.porCarrera[runner.carrera]) {
      summary.porCarrera[runner.carrera] = 0;
    }

    summary.porCarrera[runner.carrera]++;
  });

  return summary;
}

function normalizeRace(rawRace) {
  const value = normalizeText(rawRace);

  if (value.includes("txiki")) {
    return "txiki";
  }

  if (value.includes("10k")) {
    return "10k carrera";
  }

  if (value.includes("5k") && value.includes("marcha")) {
    return "5k marcha";
  }

  if (value.includes("5k") && value.includes("carrera")) {
    return "5k carrera";
  }

  return "sin clasificar";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}