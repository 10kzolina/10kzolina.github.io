(function () {
  "use strict";

  const SHEET = {
    id: "1sb-6U1vdkLhYuXA5oIiC8RiZHUQu2xwaJMZJo65mOj4",
    gid: "0",
    timeoutMs: 16000
  };

  const ROUTES = [
    { key: "txiki", label: "Txiki" },
    { key: "marcha5k", label: "5K Marcha" },
    { key: "carrera5k", label: "5K Carrera" },
    { key: "carrera10k", label: "10K Carrera" }
  ];

  const numberFormatter = new Intl.NumberFormat("es-ES");
  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function classifyRoute(value) {
    const text = normalizeText(value);

    if (!text) return null;
    if (text.includes("txiki")) return "txiki";
    if (text.includes("10k")) return "carrera10k";
    if (text.includes("marcha")) return "marcha5k";
    if (text.includes("5k") && text.includes("carrera")) return "carrera5k";
    if (text.includes("5k")) return "carrera5k";

    return "unknown";
  }

  function isDistanceHeader(label) {
    return normalizeText(label).includes("distancia a recorrer");
  }

  function getCellText(cell) {
    if (!cell) return "";
    const value = cell.v ?? cell.f ?? "";
    return String(value).trim();
  }

  function hasAnyValue(row) {
    return Boolean(row.c && row.c.some((cell) => getCellText(cell)));
  }

  function getTableParts(table) {
    const rows = table.rows || [];
    let headers = (table.cols || []).map((column) => String(column.label || column.id || "").trim());
    let dataRows = rows;

    if (!headers.some(isDistanceHeader) && rows.length) {
      const firstRowHeaders = rows[0].c ? rows[0].c.map(getCellText) : [];
      if (firstRowHeaders.some(isDistanceHeader)) {
        headers = firstRowHeaders;
        dataRows = rows.slice(1);
      }
    }

    return { headers, rows: dataRows };
  }

  function buildStats(response) {
    const table = response.table || {};
    const { headers, rows } = getTableParts(table);
    const distanceIndexes = headers
      .map((label, index) => isDistanceHeader(label) ? index : -1)
      .filter((index) => index >= 0);

    if (!distanceIndexes.length) {
      throw new Error("No se han encontrado columnas de recorrido en la hoja.");
    }

    const counts = ROUTES.reduce((accumulator, route) => {
      accumulator[route.key] = 0;
      return accumulator;
    }, {});
    const unknownValues = new Map();
    let total = 0;

    rows.forEach((row) => {
      distanceIndexes.forEach((index) => {
        const rawValue = getCellText(row.c && row.c[index]);
        const routeKey = classifyRoute(rawValue);

        if (!routeKey) return;

        total += 1;

        if (routeKey === "unknown") {
          unknownValues.set(rawValue, (unknownValues.get(rawValue) || 0) + 1);
          return;
        }

        counts[routeKey] += 1;
      });
    });

    return {
      counts,
      total,
      registrations: rows.filter(hasAnyValue).length,
      unknownValues: Array.from(unknownValues.entries()).map(([label, count]) => ({ label, count }))
    };
  }

  function createGoogleSheetsUrl(callbackName) {
    const url = new URL(`https://docs.google.com/spreadsheets/d/${SHEET.id}/gviz/tq`);
    url.searchParams.set("gid", SHEET.gid);
    url.searchParams.set("headers", "1");
    url.searchParams.set("tq", "select *");
    url.searchParams.set("tqx", `out:json;responseHandler:${callbackName}`);
    return url.toString();
  }

  function loadSheetData() {
    return new Promise((resolve, reject) => {
      const callbackName = `__zolinaInscripciones${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("La hoja ha tardado demasiado en responder."));
      }, SHEET.timeoutMs);

      function cleanup() {
        window.clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      }

      window[callbackName] = (response) => {
        cleanup();

        if (!response || response.status === "error") {
          const message = response && response.errors && response.errors[0] && response.errors[0].detailed_message;
          reject(new Error(message || "Google Sheets no ha devuelto datos válidos."));
          return;
        }

        resolve(response);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error("No se ha podido conectar con Google Sheets."));
      };

      script.async = true;
      script.src = createGoogleSheetsUrl(callbackName);
      document.head.appendChild(script);
    });
  }

  function animateNumber(element, value) {
    if (!element) return;

    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (shouldReduceMotion) {
      element.textContent = numberFormatter.format(value);
      return;
    }

    const duration = 650;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = numberFormatter.format(Math.round(value * eased));

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    window.requestAnimationFrame(tick);
  }

  function setStatus(elements, type, message) {
    elements.status.textContent = message;
    elements.statusDot.classList.toggle("is-ready", type === "ready");
    elements.statusDot.classList.toggle("is-error", type === "error");
  }

  function renderStats(elements, stats) {
    animateNumber(elements.totalCount, stats.total);
    elements.totalCaption.textContent = `${numberFormatter.format(stats.registrations)} inscripciones recibidas`;
    elements.registrationCount.textContent = `${numberFormatter.format(stats.registrations)} inscripciones`;
    elements.lastUpdated.textContent = `Datos cargados: ${dateFormatter.format(new Date())}`;

    ROUTES.forEach((route) => {
      const count = stats.counts[route.key] || 0;
      const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
      const width = stats.total > 0 ? Math.max(percent, count > 0 ? 3 : 0) : 0;

      animateNumber(elements.routeCounts[route.key], count);
      elements.routePercents[route.key].textContent = `${percent}%`;
      elements.routeBars[route.key].style.width = `${width}%`;
      elements.routeListCounts[route.key].textContent = numberFormatter.format(count);
    });

    if (stats.unknownValues.length) {
      const unknownTotal = stats.unknownValues.reduce((sum, item) => sum + item.count, 0);
      elements.warning.hidden = false;
      elements.warning.textContent = `${numberFormatter.format(unknownTotal)} corredores tienen un recorrido no reconocido en la hoja.`;
    } else {
      elements.warning.hidden = true;
      elements.warning.textContent = "";
    }
  }

  function collectElements(root) {
    const routeCounts = {};
    const routePercents = {};
    const routeBars = {};
    const routeListCounts = {};

    ROUTES.forEach((route) => {
      routeCounts[route.key] = root.querySelector(`[data-route-count="${route.key}"]`);
      routePercents[route.key] = root.querySelector(`[data-route-percent="${route.key}"]`);
      routeBars[route.key] = root.querySelector(`[data-route-bar="${route.key}"]`);
      routeListCounts[route.key] = root.querySelector(`[data-route-list-count="${route.key}"]`);
    });

    return {
      status: root.querySelector("#inscripciones-status"),
      statusDot: root.querySelector("[data-status-dot]"),
      totalCount: root.querySelector("[data-total-count]"),
      totalCaption: root.querySelector("[data-total-caption]"),
      registrationCount: root.querySelector("[data-registration-count]"),
      lastUpdated: root.querySelector("[data-last-updated]"),
      refreshButton: root.querySelector("[data-refresh-inscripciones]"),
      warning: root.querySelector("[data-warning]"),
      routeCounts,
      routePercents,
      routeBars,
      routeListCounts
    };
  }

  function initInscripcionesPage() {
    const page = document.querySelector("[data-inscripciones-page]");
    if (!page) return;

    const elements = collectElements(page);
    let isLoading = false;

    async function refresh() {
      if (isLoading) return;

      isLoading = true;
      elements.refreshButton.disabled = true;
      setStatus(elements, "loading", "Cargando datos de la hoja...");

      try {
        const response = await loadSheetData();
        const stats = buildStats(response);
        renderStats(elements, stats);
        setStatus(elements, "ready", "Datos actualizados desde Google Sheets");
      } catch (error) {
        console.warn(error);
        setStatus(elements, "error", "No se han podido cargar las inscripciones");
        elements.lastUpdated.textContent = "Revisa que la hoja siga siendo pública y vuelve a intentarlo.";
      } finally {
        isLoading = false;
        elements.refreshButton.disabled = false;
      }
    }

    elements.refreshButton.addEventListener("click", refresh);
    refresh();
  }

  onReady(initInscripcionesPage);
})();
