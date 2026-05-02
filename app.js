(function () {
  const racePage = document.querySelector("[data-race-page]");
  if (!racePage) return;

  const races = {
    "10k": {
      eyebrow: "Carrera principal",
      title: "10K Carrera",
      shortTitle: "10K",
      description: "La distancia reina de la jornada, con salida a las 11:00 h y recorrido por el entorno de Badostáin y Zolina.",
      distance: "10 km",
      time: "11:00 h",
      price: "12€",
      age: "Solo mayores de edad",
      gpx: "recorrido_10k.gpx",
      routeUrl: "https://loc.wiki/t/258942454?h=jpyxxj7xzx&wa=so&la=es",
      bullets: [
        "Recorrido oficial de 10 km.",
        "Prueba reservada para mayores de edad.",
        "Aportación solidaria mínima: 1 kg de comida no perecedera."
      ]
    },
    "5k": {
      eyebrow: "Carrera y marcha popular",
      title: "5K Carrera / 5K Marcha",
      shortTitle: "5K",
      description: "Una opción más corta y accesible: carrera de 5K a las 11:00 h y marcha de 5K a las 11:15 h por el mismo recorrido.",
      distance: "5 km",
      time: "Carrera 11:00 h · Marcha 11:15 h",
      price: "Carrera 8€ · Marcha 5€",
      age: "Carrera con menores de 12 a 17 años · Marcha para todo el mundo",
      gpx: "recorrido_5k.gpx",
      routeUrl: "https://loc.wiki/t/258919706?h=jpyxxj7xzx&wa=so&la=es",
      bullets: [
        "Mismo recorrido para la 5K carrera y la 5K marcha.",
        "La 5K carrera permite la participación de menores de 12 a 17 años.",
        "La 5K marcha está abierta a todo el mundo.",
        "Aportación solidaria mínima: 1 kg de comida no perecedera."
      ]
    },
    txiki: {
      eyebrow: "Para los más pequeños",
      title: "Txiki 600 m",
      shortTitle: "Txiki",
      description: "La prueba infantil de 600 m para que los menores de 12 años también tengan su salida dentro de la 10K Zolina.",
      distance: "600 m",
      time: "10:00 h",
      price: "5€",
      age: "Menores de 12 años",
      gpx: "recorrido_txiki.gpx",
      routeUrl: "https://loc.wiki/t/258913807?h=jpyxxj7xzx&wa=so&la=es",
      bullets: [
        "Recorrido corto de 600 m.",
        "Prueba pensada para menores de 12 años.",
        "Aportación solidaria mínima: 1 kg de comida no perecedera."
      ]
    }
  };

  const elements = {
    tabs: Array.from(document.querySelectorAll("[data-race-tab]")),
    eyebrow: document.getElementById("race-eyebrow"),
    title: document.getElementById("race-title"),
    description: document.getElementById("race-description"),
    distance: document.getElementById("race-distance"),
    time: document.getElementById("race-time"),
    price: document.getElementById("race-price"),
    age: document.getElementById("race-age"),
    bullets: document.getElementById("race-bullets"),
    routeLink: document.getElementById("race-route-link"),
    gpxLink: document.getElementById("race-gpx-link"),
    routeTitle: document.getElementById("route-title"),
    routePill: document.getElementById("route-pill"),
    routeMap: document.getElementById("route-map"),
    routeLoading: document.getElementById("route-loading"),
    routeDistanceMeta: document.getElementById("route-distance-meta"),
    routeElevationMeta: document.getElementById("route-elevation-meta"),
    routeProfileMeta: document.getElementById("route-profile-meta"),
    profileArea: document.getElementById("route-profile-area"),
    profileLine: document.getElementById("route-profile-line")
  };

  const routeCache = new Map();
  const mapState = {
    map: null,
    routeLayer: null,
    startMarker: null,
    finishMarker: null
  };
  let latestRouteRequest = 0;

  function getRaceFromHash() {
    const key = window.location.hash.replace("#", "").toLowerCase();
    return races[key] ? key : "10k";
  }

  function setActiveRace(key, updateHash) {
    const race = races[key] || races["10k"];

    elements.tabs.forEach((tab) => {
      const isActive = tab.dataset.raceTab === key;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-pressed", String(isActive));
    });

    elements.eyebrow.textContent = race.eyebrow;
    elements.title.textContent = race.title;
    elements.description.textContent = race.description;
    elements.distance.textContent = race.distance;
    elements.time.textContent = race.time;
    elements.price.textContent = race.price;
    elements.age.textContent = race.age;
    elements.routeLink.href = race.routeUrl;
    elements.gpxLink.href = race.gpx;
    elements.gpxLink.setAttribute("download", race.gpx);
    elements.routeTitle.textContent = `Mapa satélite ${race.title}`;
    elements.routePill.textContent = race.shortTitle;
    elements.routeMap.setAttribute("aria-label", `Mapa satélite del recorrido ${race.title}`);
    elements.bullets.innerHTML = race.bullets.map((item) => `<li>${item}</li>`).join("");

    if (updateHash) {
      history.replaceState(null, "", `#${key}`);
    }

    loadRoute(race);
  }

  async function loadRoute(race) {
    const requestId = ++latestRouteRequest;
    setRouteLoading(`Cargando ${race.gpx}...`);

    try {
      let route = routeCache.get(race.gpx);
      if (!route) {
        const response = await fetch(race.gpx, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`No se pudo cargar ${race.gpx}`);
        }

        const text = await response.text();
        const points = parseGpx(text);
        route = {
          points,
          stats: getRouteStats(points)
        };
        routeCache.set(race.gpx, route);
      }

      if (requestId !== latestRouteRequest) return;

      drawRoute(route.points, race.title);
      drawProfile(route.points);
      updateRouteStats(route.stats);
      clearRouteLoading();
    } catch (error) {
      if (requestId !== latestRouteRequest) return;
      elements.profileLine.setAttribute("d", "");
      elements.profileArea.setAttribute("d", "");
      elements.routeDistanceMeta.textContent = "GPX no disponible en esta vista";
      elements.routeElevationMeta.textContent = "Abre el recorrido oficial para verlo";
      setRouteLoading("No se pudo cargar el mapa satélite. Puedes abrir el recorrido oficial.");
      console.warn(error);
    }
  }

  function parseGpx(text) {
    const xml = new DOMParser().parseFromString(text, "application/xml");
    const parseError = xml.querySelector("parsererror");
    if (parseError) {
      throw new Error("El archivo GPX no es válido");
    }

    let trackPoints = Array.from(xml.getElementsByTagName("trkpt"));
    if (!trackPoints.length) {
      trackPoints = Array.from(xml.getElementsByTagNameNS("*", "trkpt"));
    }

    const points = trackPoints.map((point) => {
      const eleNode = point.getElementsByTagName("ele")[0] || point.getElementsByTagNameNS("*", "ele")[0];
      return {
        lat: Number(point.getAttribute("lat")),
        lon: Number(point.getAttribute("lon")),
        ele: eleNode ? Number(eleNode.textContent) : 0
      };
    }).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));

    if (points.length < 2) {
      throw new Error("El GPX no contiene suficientes puntos");
    }

    return points;
  }

  function getRouteStats(points) {
    let distance = 0;
    let elevationGain = 0;
    let elevationLoss = 0;
    let minEle = points[0].ele;
    let maxEle = points[0].ele;

    for (let index = 1; index < points.length; index += 1) {
      const current = points[index];
      const previous = points[index - 1];
      distance += getDistance(previous, current);

      const elevationDelta = current.ele - previous.ele;
      if (elevationDelta > 0) elevationGain += elevationDelta;
      if (elevationDelta < 0) elevationLoss += Math.abs(elevationDelta);

      minEle = Math.min(minEle, current.ele);
      maxEle = Math.max(maxEle, current.ele);
    }

    return { distance, elevationGain, elevationLoss, minEle, maxEle };
  }

  function getDistance(a, b) {
    const earthRadius = 6371000;
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);
    const deltaLat = toRadians(b.lat - a.lat);
    const deltaLon = toRadians(b.lon - a.lon);
    const haversine = Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
  }

  function toRadians(value) {
    return value * Math.PI / 180;
  }

  function drawRoute(points, title) {
    if (!window.L) {
      throw new Error("Leaflet no está disponible");
    }

    const latLngs = points.map((point) => [point.lat, point.lon]);

    if (!mapState.map) {
      mapState.map = L.map(elements.routeMap, {
        scrollWheelZoom: false,
        preferCanvas: true,
        attributionControl: true
      });

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri"
      }).addTo(mapState.map);
    }

    mapState.map.invalidateSize();
    const bounds = L.latLngBounds(latLngs);
    mapState.map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: title.includes("Txiki") ? 18 : 15
    });

    if (mapState.routeLayer) mapState.routeLayer.remove();
    if (mapState.startMarker) mapState.startMarker.remove();
    if (mapState.finishMarker) mapState.finishMarker.remove();

    const shadow = L.polyline(latLngs, {
      color: "#073f2a",
      opacity: 0.72,
      weight: 12,
      lineCap: "round",
      lineJoin: "round"
    });

    const route = L.polyline(latLngs, {
      color: "#b7f34a",
      opacity: 0.98,
      weight: 6,
      lineCap: "round",
      lineJoin: "round"
    });

    mapState.routeLayer = L.layerGroup([shadow, route]).addTo(mapState.map);
    mapState.startMarker = createRouteMarker(latLngs[0], "Salida", "#073f2a").addTo(mapState.map);
    mapState.finishMarker = createRouteMarker(latLngs[latLngs.length - 1], "Meta", "#f59e0b").addTo(mapState.map);
    setTimeout(() => mapState.map.invalidateSize(), 50);
  }

  function createRouteMarker(latLng, label, color) {
    return L.circleMarker(latLng, {
      radius: 8,
      color,
      weight: 4,
      fillColor: "#ffffff",
      fillOpacity: 1
    }).bindTooltip(label, {
      permanent: true,
      direction: "top",
      offset: [0, -10],
      className: "route-map-tooltip"
    });
  }

  function drawProfile(points) {
    const width = 720;
    const height = 150;
    const paddingX = 20;
    const paddingY = 18;
    const minEle = Math.min(...points.map((point) => point.ele));
    const maxEle = Math.max(...points.map((point) => point.ele));
    const elevationRange = Math.max(maxEle - minEle, 1);

    const projected = points.map((point, index) => {
      const x = paddingX + (index / Math.max(points.length - 1, 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((point.ele - minEle) / elevationRange) * (height - paddingY * 2);
      return { x, y };
    });

    const line = projected.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
    const first = projected[0];
    const last = projected[projected.length - 1];
    const area = `${line} L ${last.x.toFixed(1)} ${height - paddingY} L ${first.x.toFixed(1)} ${height - paddingY} Z`;

    elements.profileLine.setAttribute("d", line);
    elements.profileArea.setAttribute("d", area);
  }

  function updateRouteStats(stats) {
    const kilometers = stats.distance / 1000;
    elements.routeDistanceMeta.textContent = `GPX aprox.: ${kilometers < 1 ? Math.round(stats.distance) + " m" : kilometers.toFixed(2) + " km"}`;
    elements.routeElevationMeta.textContent = `D+ ${Math.round(stats.elevationGain)} m · D- ${Math.round(stats.elevationLoss)} m`;
    elements.routeProfileMeta.textContent = `${Math.round(stats.minEle)}-${Math.round(stats.maxEle)} m`;
  }

  function setRouteLoading(message) {
    elements.routeLoading.textContent = message;
    elements.routeLoading.classList.add("is-visible");
  }

  function clearRouteLoading() {
    elements.routeLoading.classList.remove("is-visible");
  }

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveRace(tab.dataset.raceTab, true);
    });
  });

  window.addEventListener("hashchange", () => {
    setActiveRace(getRaceFromHash(), false);
  });

  setActiveRace(getRaceFromHash(), false);
})();
