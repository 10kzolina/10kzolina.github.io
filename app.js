(function () {
  "use strict";

  const SITE_NAME = "10K Zolina";

  const FOOD_CHALLENGE = {
    currentKg: 235,
    goalKg: 1000
  };

  const NAV_LINKS = [
    { href: "carreras.html", label: "Recorridos" },
    { href: "kiloreto.html", label: "Kiloreto" },
    { href: "challenge.html", label: "KOM Challenge" },
    { href: "resultados.html", label: "Resultados" },
    { href: "colaboradores.html", label: "Colaboradores" },
    { href: "contacto.html", label: "Contacto" }
  ];

  const SPONSOR_LOGOS = [
    { name: "Masxmenos", logo: "img/masxmenos.PNG" },
    { name: "Caja Rural de Navarra", logo: "img/cajarural.PNG" },
    { name: "E.Leclerc", logo: "img/leclerc.PNG" },
    { name: "Sporty", logo: "img/sporty.png" },
    { name: "100K Mendi Taldea", logo: "img/100k.jpeg" },
    { name: "Rocopolis", logo: "img/rocopolis.png" },
    { name: "Bordaberri", logo: "img/bordaberri.JPG" },
    { name: "Solonuts", logo: "img/solonuts.jpg" },
    { name: "Ipar Kirolak", logo: "img/iparkirolak.png" },
    { name: "Origen Real Food", logo: "img/origen.png" },
    { name: "Saltoka Jump", logo: "img/saltoka.png" },
    { name: "Repostería Juan Miguel", logo: "img/reposteriajuanmiguel.png" },
    { name: "Farmacia Arteche", logo: "img/farmaciaAtreche.png" },
    { name: "Carnicería Deierri", logo: "img/carniceriadeierri.png" },
    { name: "Beep Run Club", logo: "img/beeprun.jpg" },
    { name: "Aske Clothes", logo: "img/askeclothes.jpg" },
    { name: "Lekuona", logo: "img/lekuona.jpg" },
    { name: "Irish Pub Eskiroz", logo: "img/irishpub.PNG" },
    { name: "Hiruda 3D", logo: "img/hiruda3d.jpg" },
    { name: "Aaron Vilchez DJ", logo: "img/aaron.jpg" },
    { name: "Sidrería Auzmendi", logo: "img/auzmendi.png" },
    { name: "N2 Fisioterapia", logo: "img/n2fisio.png" },
    { name: "Kaiku", logo: "img/kaiku.png" },
    { name: "La Perla", logo: "img/laperla.png" },
    { name: "Reyno Gourmet", logo: "img/reyno.png" },
    { name: "Malie Estética Avanzada", logo: "img/malie.PNG" },
    { name: "Heladería Los Jijonencos", logo: "img/losjijonecos.PNG" },
    { name: "Txaranga Turrutxiki", logo: "img/txaranga.PNG" }
  ];

  const COLLABORATORS = [
    {
      name: "Masxmenos",
      type: "Material",
      logo: "img/masxmenos.PNG",
      description: "Tienda especializada en material deportivo y de montaña, con una amplia oferta para actividades al aire libre.",
      contribution: "Arco de meta, banderolas, carpa Masxmenos y productos para sortear entre participantes."
    },
    {
      name: "Caja Rural de Navarra",
      type: "Institucional",
      logo: "img/cajarural.PNG",
      description: "Entidad que impulsa proyectos sociales, educativos y medioambientales en Navarra.",
      contribution: "Arco de meta, bolsas del corredor, dorsales y vallas para el recorrido."
    },
    {
      name: "E.Leclerc",
      type: "Alimentos",
      logo: "img/leclerc.PNG",
      description: "Cadena de supermercados con una amplia variedad de productos y apoyo a iniciativas locales.",
      contribution: "100 kg de naranjas y frutos secos."
    },
    {
      name: "Sporty",
      type: "Material",
      logo: "img/sporty.png",
      description: "Tienda especializada en material deportivo y equipamiento técnico para distintas disciplinas.",
      contribution: "10 pares de crampones y 10 pares de calcetines para sortear."
    },
    {
      name: "100K Mendi Taldea",
      type: "Club",
      logo: "img/100k.jpeg",
      description: "Club de montaña implicado en actividades en entorno natural y en la organización del evento.",
      contribution: "Merchandising para sortear, financiación y organización."
    },
    {
      name: "Rocopolis",
      type: "Deporte",
      logo: "img/rocopolis.png",
      description: "Rocódromo y centro deportivo especializado en escalada.",
      contribution: "Entradas para el rocódromo para sortear entre participantes."
    },
    {
      name: "Bordaberri",
      type: "Hostelería",
      logo: "img/bordaberri.JPG",
      description: "Bar-restaurante de ambiente cercano, con oferta gastronómica y vínculo con la vida local.",
      contribution: "Apoyo para traer a la Txaranga Turrutxiki."
    },
    {
      name: "Solonuts",
      type: "Alimentos",
      logo: "img/solonuts.jpg",
      description: "Marca especializada en frutos secos de calidad y opciones saludables para el día a día.",
      contribution: "Pack de productos para sortear por Instagram."
    },
    {
      name: "Farmacia Mutilva",
      type: "Salud",
      logo: "",
      description: "Farmacia de proximidad con atención personalizada y asesoramiento en salud y bienestar.",
      contribution: "Cesta de productos y tres vales de 20 euros para gastar en farmacia."
    },
    {
      name: "Ipar Kirolak",
      type: "Material",
      logo: "img/iparkirolak.png",
      description: "Tienda especializada en equipamiento para montaña, running y outdoor.",
      contribution: "Material deportivo para sortear y vales para utilizar en tienda."
    },
    {
      name: "Origen Real Food",
      type: "Hostelería",
      logo: "img/origen.png",
      description: "Restaurante centrado en ingredientes naturales y cocina saludable en Pamplona.",
      contribution: "Sorpresa en bolsa del corredor y vales de 30 euros para sortear."
    },
    {
      name: "Saltoka Jump",
      type: "Ocio",
      logo: "img/saltoka.png",
      description: "Centro de ocio activo con camas elásticas y actividades para disfrutar en grupo.",
      contribution: "Tres entradas, tres mochilas y tres pares de calcetines para sortear."
    },
    {
      name: "Repostería Juan Miguel",
      type: "Alimentos",
      logo: "img/reposteriajuanmiguel.png",
      description: "Obrador artesanal especializado en dulces y pastas tradicionales.",
      contribution: "Cajas de pastas para sortear."
    },
    {
      name: "Farmacia Arteche",
      type: "Salud",
      logo: "img/farmaciaAtreche.png",
      description: "Farmacia de proximidad con atención personalizada y asesoramiento en cuidado diario.",
      contribution: "Pack de productos para sortear."
    },
    {
      name: "Carnicería Deierri",
      type: "Alimentos",
      logo: "img/carniceriadeierri.png",
      description: "Carnicería tradicional con productos frescos, elaboración propia y atención cercana.",
      contribution: "Cesta de productos para sortear."
    },
    {
      name: "Beep Run Club",
      type: "Club",
      logo: "img/beeprun.jpg",
      description: "Comunidad de corredores que fomenta el deporte, la motivación y el entrenamiento en grupo.",
      contribution: ""
    },
    {
      name: "Aske Clothes",
      type: "Moda",
      logo: "img/askeclothes.jpg",
      description: "Marca emergente de streetwear ligada a la expresión personal y el diseño artesanal.",
      contribution: "Dos sudaderas, dos camisetas y vales de descuento para su tienda online."
    },
    {
      name: "Lekuona",
      type: "Hostelería",
      logo: "img/lekuona.jpg",
      description: "Restaurante familiar que apuesta por la cocina tradicional con toques innovadores.",
      contribution: "Comida para dos en su restaurante para sortear."
    },
    {
      name: "Irish Pub Eskiroz",
      type: "Hostelería",
      logo: "img/irishpub.PNG",
      description: "Pub de ambiente acogedor con oferta variada de comida y bebida.",
      contribution: "Un vale para dos cenas para sortear."
    },
    {
      name: "Hiruda 3D",
      type: "Servicios",
      logo: "img/hiruda3d.jpg",
      description: "Estudio especializado en diseño e impresión 3D de piezas personalizadas.",
      contribution: "Trofeos de las pruebas."
    },
    {
      name: "Heladería Los Jijonencos",
      type: "Alimentos",
      logo: "img/losjijonecos.PNG",
      description: "Heladería familiar con larga historia en Pamplona y elaboración artesanal.",
      contribution: "Tres bonos de cinco helados para sortear."
    },
    {
      name: "Aaron Vilchez DJ",
      type: "Música",
      logo: "img/aaron.jpg",
      description: "DJ de Pamplona especializado en animación musical para eventos y celebraciones.",
      contribution: "Ambientación musical durante la carrera."
    },
    {
      name: "Auzmendi",
      type: "Hostelería",
      logo: "img/auzmendi.png",
      description: "Sidrería de cocina tradicional vasca en Pamplona.",
      contribution: "Vale para una comida para dos para sortear."
    },
    {
      name: "N2 Fisioterapia",
      type: "Salud",
      logo: "img/n2fisio.png",
      description: "Centro especializado en recuperación y tratamiento físico con atención personalizada.",
      contribution: "Dos sesiones de fisioterapia para sortear."
    },
    {
      name: "Kaiku",
      type: "Alimentos",
      logo: "img/kaiku.png",
      description: "Marca láctea con productos orientados a una alimentación equilibrada.",
      contribution: "Productos para la bolsa del corredor."
    },
    {
      name: "La Perla",
      type: "Bienestar",
      logo: "img/laperla.png",
      description: "Centro de bienestar y restaurante situado en la playa de La Concha, en San Sebastián.",
      contribution: "Dos entradas para circuito de talasoterapia para sortear."
    },
    {
      name: "Reyno Gourmet",
      type: "Alimentos",
      logo: "img/reyno.png",
      description: "Marca de calidad que promociona productos agroalimentarios de Navarra.",
      contribution: "Packs para los ganadores."
    },
    {
      name: "Malie Estética Avanzada",
      type: "Bienestar",
      logo: "img/malie.PNG",
      description: "Centro especializado en tratamientos de belleza y cuidado personal.",
      contribution: "Sesiones para sortear."
    },
    {
      name: "Txaranga Turrutxiki",
      type: "Música",
      logo: "img/txaranga.PNG",
      description: "Txaranga encargada de poner ritmo y ambiente a la jornada.",
      contribution: "Animación musical durante el evento."
    }
  ];

  const RACES = {
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

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function getCurrentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function renderSiteFooter() {
    const footers = Array.from(document.querySelectorAll("[data-site-footer]"));
    if (!footers.length) return;

    const currentPage = getCurrentPage();
    const sponsorMarkup = SPONSOR_LOGOS.map((sponsor) => `
      <div class="sponsor-logo-card">
        <img src="${sponsor.logo}" alt="Logo de ${escapeHtml(sponsor.name)}" loading="lazy" decoding="async" />
      </div>
    `).join("");

    const linksMarkup = NAV_LINKS.map((link) => {
      const active = currentPage === link.href ? ' aria-current="page"' : "";
      return `<a href="${link.href}"${active}>${escapeHtml(link.label)}</a>`;
    }).join("");

    footers.forEach((footer) => {
      footer.setAttribute("aria-labelledby", "footer-sponsors-title");
      footer.innerHTML = `
        <div class="site-footer-inner">
          <div class="site-footer-heading">
            <div>
              <p class="eyebrow">Patrocinadores</p>
              <h2 id="footer-sponsors-title">Gracias por hacerlo posible</h2>
            </div>
            <p>Empresas, clubes y entidades que apoyan la 10K Zolina y su reto solidario.</p>
          </div>

          <div class="sponsor-logo-grid" aria-label="Logos de patrocinadores">
            ${sponsorMarkup}
          </div>

          <div class="site-footer-bottom">
            <span>${SITE_NAME} · Carrera solidaria en Badostáin</span>
            <nav class="site-footer-links" aria-label="Enlaces del pie de página">
              ${linksMarkup}
            </nav>
          </div>
        </div>
      `;
    });
  }

  function animateNumber(element, finalValue, duration = 1200) {
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = Math.round(finalValue * eased);

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function bindFoodProgress(options) {
    const currentElement = document.querySelector(options.currentSelector);
    const percentElement = document.querySelector(options.percentSelector);
    const fillElement = document.querySelector(options.fillSelector);
    const messageElement = document.querySelector(options.messageSelector);
    const goalElement = options.goalSelector ? document.querySelector(options.goalSelector) : null;

    if (!currentElement || !percentElement || !fillElement || !messageElement) return;

    const percentage = Math.min((FOOD_CHALLENGE.currentKg / FOOD_CHALLENGE.goalKg) * 100, 100);
    const remainingKg = Math.max(FOOD_CHALLENGE.goalKg - FOOD_CHALLENGE.currentKg, 0);

    if (goalElement) goalElement.textContent = FOOD_CHALLENGE.goalKg;

    setTimeout(() => {
      animateNumber(currentElement, FOOD_CHALLENGE.currentKg);
      percentElement.textContent = `${Math.round(percentage)}%`;
      fillElement.style.width = `${percentage}%`;
      messageElement.textContent = percentage >= 100
        ? options.completeMessage
        : options.pendingMessage(remainingKg);
    }, 350);
  }

  function initFoodProgress() {
    bindFoodProgress({
      currentSelector: "#kg-actuales",
      goalSelector: "#kg-objetivo",
      percentSelector: "#porcentaje-comida",
      fillSelector: "#thermometer-fill",
      messageSelector: "#impact-message",
      completeMessage: "Objetivo conseguido. Marcador solidario completado.",
      pendingMessage: (remainingKg) => `Faltan ${remainingKg} kg para completar el objetivo.`
    });

    bindFoodProgress({
      currentSelector: "#kg-actuales-kiloreto",
      percentSelector: "#porcentaje-kiloreto",
      fillSelector: "#kiloreto-fill",
      messageSelector: "#kiloreto-message",
      completeMessage: "Objetivo conseguido. Kiloreto completado.",
      pendingMessage: (remainingKg) => `Faltan ${remainingKg} kg para completar el Kiloreto.`
    });
  }

  function getInitials(name) {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");
  }

  function renderCollaboratorLogo(collaborator) {
    if (collaborator.logo) {
      return `<img src="${collaborator.logo}" alt="Logo de ${escapeHtml(collaborator.name)}" loading="lazy" decoding="async" />`;
    }

    return `<span>${escapeHtml(getInitials(collaborator.name))}</span>`;
  }

  function initPartners() {
    const grid = document.getElementById("partners-grid");
    const empty = document.getElementById("sin-colaboradores");
    const count = document.getElementById("partner-count");
    const search = document.getElementById("buscar-colaborador");
    const typeSelect = document.getElementById("tipo-colaborador");

    if (!grid || !empty || !count || !search || !typeSelect) return;

    const types = Array.from(new Set(COLLABORATORS.map((collaborator) => collaborator.type)))
      .sort((a, b) => a.localeCompare(b, "es"));

    typeSelect.innerHTML = [
      '<option value="Todos">Todos</option>',
      ...types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
    ].join("");

    function renderCollaborators() {
      const text = normalizeText(search.value.trim());
      const type = typeSelect.value;

      const filtered = COLLABORATORS.filter((collaborator) => {
        const matchesType = type === "Todos" || collaborator.type === type;
        const content = normalizeText(`${collaborator.name} ${collaborator.type} ${collaborator.description} ${collaborator.contribution}`);
        const matchesText = !text || content.includes(text);
        return matchesType && matchesText;
      });

      count.textContent = COLLABORATORS.length;
      grid.innerHTML = "";

      if (!filtered.length) {
        empty.style.display = "block";
        return;
      }

      empty.style.display = "none";

      filtered.forEach((collaborator, index) => {
        const card = document.createElement("article");
        card.className = "partner-card";
        card.style.animationDelay = `${index * 0.06}s`;
        card.innerHTML = `
          <div class="partner-card-top">
            <div class="partner-logo">${renderCollaboratorLogo(collaborator)}</div>
            <span class="soft-pill">${escapeHtml(collaborator.type)}</span>
          </div>

          <h2>${escapeHtml(collaborator.name)}</h2>
          <p>${escapeHtml(collaborator.description)}</p>

          ${collaborator.contribution ? `
            <div class="donation-box">
              <span>Donación / aportación</span>
              <strong>${escapeHtml(collaborator.contribution)}</strong>
            </div>
          ` : ""}
        `;
        grid.appendChild(card);
      });
    }

    search.addEventListener("input", renderCollaborators);
    typeSelect.addEventListener("change", renderCollaborators);
    renderCollaborators();
  }

  function initResultsTable() {
    const elements = {
      distanceSelect: document.getElementById("distancia"),
      genderSelect: document.getElementById("genero"),
      searchInput: document.getElementById("busqueda"),
      table: document.getElementById("tabla-resultados"),
      mobileResults: document.getElementById("mobile-resultados"),
      empty: document.getElementById("sin-resultados"),
      podium: document.getElementById("podium"),
      podiumLabel: document.getElementById("podium-label"),
      podiumTitle: document.getElementById("podium-title"),
      statTotal: document.getElementById("stat-total"),
      statBest: document.getElementById("stat-best"),
      statDistance: document.getElementById("stat-distance"),
      toast: document.getElementById("toast")
    };

    if (Object.values(elements).some((element) => !element)) return;

    let participants = [];

    function normalizeGender(gender) {
      const normalized = normalizeText(gender).trim();
      if (normalized === "m" || normalized === "masculino") return "Masculino";
      if (normalized === "f" || normalized === "femenino") return "Femenino";
      return gender || "Sin categoría";
    }

    function parseCsvRows(text) {
      const rows = [];
      let row = [];
      let value = "";
      let insideQuotes = false;

      for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        const nextCharacter = text[index + 1];

        if (character === '"' && insideQuotes && nextCharacter === '"') {
          value += '"';
          index += 1;
          continue;
        }

        if (character === '"') {
          insideQuotes = !insideQuotes;
          continue;
        }

        if (character === "," && !insideQuotes) {
          row.push(value.trim());
          value = "";
          continue;
        }

        if ((character === "\n" || character === "\r") && !insideQuotes) {
          if (character === "\r" && nextCharacter === "\n") index += 1;
          row.push(value.trim());
          if (row.some(Boolean)) rows.push(row);
          row = [];
          value = "";
          continue;
        }

        value += character;
      }

      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);

      return rows;
    }

    function parseResultsCsv(text) {
      const rows = parseCsvRows(text);
      const headers = rows.shift() || [];

      return rows.map((row) => {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = row[index] || "";
        });

        return {
          name: item["Nombre y apellido"],
          distance: normalizeText(item.distancia),
          gender: normalizeGender(item.genero),
          time: item.tiempo,
          bib: item.dorsal
        };
      }).filter((participant) => participant.name && participant.distance && participant.time);
    }

    function timeToSeconds(time) {
      const parts = String(time).split(":").map(Number);
      if (parts.some((part) => !Number.isFinite(part))) return Infinity;
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return Infinity;
    }

    function getFilteredResults() {
      const distance = elements.distanceSelect.value;
      const gender = elements.genderSelect.value;
      const search = normalizeText(elements.searchInput.value.trim());

      return participants
        .filter((participant) => participant.distance === distance)
        .filter((participant) => gender === "General" || participant.gender === gender)
        .filter((participant) => {
          if (!search) return true;
          return normalizeText(`${participant.name} ${participant.bib}`).includes(search);
        })
        .sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time));
    }

    function medal(position) {
      if (position === 1) return "🥇";
      if (position === 2) return "🥈";
      if (position === 3) return "🥉";
      return String(position);
    }

    function renderPodium(filtered) {
      elements.podium.replaceChildren();
      const distanceLabel = elements.distanceSelect.value.toUpperCase();
      elements.podiumTitle.textContent = `Podio ${distanceLabel}`;
      elements.podiumLabel.textContent = `${distanceLabel} · ${elements.genderSelect.value}`;

      const topThree = filtered.slice(0, 3);

      if (!topThree.length) {
        elements.podium.innerHTML = '<p class="empty-inline">Sin podio para esta selección.</p>';
        return;
      }

      [2, 1, 3].filter((position) => topThree[position - 1]).forEach((position) => {
        const participant = topThree[position - 1];
        const card = document.createElement("article");
        card.className = `podium-place place-${position}`;
        card.style.animationDelay = `${position === 1 ? 0.05 : position === 2 ? 0.2 : 0.35}s`;
        card.innerHTML = `
          <div class="podium-info">
            <div class="podium-medal">${medal(position)}</div>
            <strong>${escapeHtml(participant.name)}</strong>
            <span>Dorsal ${escapeHtml(participant.bib)} · ${escapeHtml(participant.gender)}</span>
            <b>${escapeHtml(participant.time)}</b>
          </div>

          <div class="podium-block" aria-hidden="true">
            <span>${position}</span>
          </div>
        `;
        elements.podium.appendChild(card);
      });
    }

    function renderResults() {
      const filtered = getFilteredResults();
      elements.table.replaceChildren();
      elements.mobileResults.replaceChildren();

      elements.statTotal.textContent = filtered.length;
      elements.statBest.textContent = filtered[0]?.time || "--:--";
      elements.statDistance.textContent = elements.distanceSelect.value.toUpperCase();

      renderPodium(filtered);

      if (!filtered.length) {
        elements.empty.style.display = "block";
        return;
      }

      elements.empty.style.display = "none";

      filtered.forEach((participant, index) => {
        const position = index + 1;
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><span class="rank-badge">${medal(position)}</span></td>
          <td>${escapeHtml(participant.bib)}</td>
          <td><strong>${escapeHtml(participant.name)}</strong></td>
          <td>${escapeHtml(participant.distance.toUpperCase())}</td>
          <td>${escapeHtml(participant.gender)}</td>
          <td><strong>${escapeHtml(participant.time)}</strong></td>
          <td><button class="share-btn" type="button">Compartir</button></td>
        `;
        row.querySelector("button").addEventListener("click", () => shareResult(participant, position));
        elements.table.appendChild(row);

        const card = document.createElement("article");
        card.className = "result-card";
        card.innerHTML = `
          <div class="result-card-top">
            <span class="rank-badge">${medal(position)}</span>
            <button class="share-btn" type="button">Compartir</button>
          </div>
          <h3>${escapeHtml(participant.name)}</h3>
          <div class="result-meta">
            <span>Dorsal ${escapeHtml(participant.bib)}</span>
            <span>${escapeHtml(participant.distance.toUpperCase())}</span>
            <span>${escapeHtml(participant.gender)}</span>
            <span>${escapeHtml(participant.time)}</span>
          </div>
        `;
        card.querySelector("button").addEventListener("click", () => shareResult(participant, position));
        elements.mobileResults.appendChild(card);
      });
    }

    async function loadResults() {
      try {
        const response = await fetch("resultados.csv", { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar resultados.csv");

        participants = parseResultsCsv(await response.text());
        renderResults();
      } catch (error) {
        elements.table.replaceChildren();
        elements.mobileResults.replaceChildren();
        elements.podium.replaceChildren();
        elements.empty.textContent = "No se ha podido cargar el archivo de resultados.";
        elements.empty.style.display = "block";
        console.warn(error);
      }
    }

    async function shareResult(participant, position) {
      const distanceLabel = participant.distance.toUpperCase();
      const text = `He terminado la ${distanceLabel} Zolina\n\n${participant.name}\n${distanceLabel}\n${participant.time}\nPosición: ${position}\nBadostáin\n24 de mayo`;
      const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || window.location.href;

      if (navigator.share) {
        try {
          await navigator.share({ title: "10K Zolina", text, url: canonicalUrl });
        } catch (error) {
          // El usuario puede cancelar el menú nativo de compartir.
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(`${text}\n${canonicalUrl}`);
        showToast("Resultado copiado al portapapeles");
      } catch (error) {
        showToast("No se pudo copiar el resultado");
      }
    }

    function showToast(message) {
      elements.toast.textContent = message;
      elements.toast.classList.add("show");
      setTimeout(() => elements.toast.classList.remove("show"), 2200);
    }

    elements.distanceSelect.addEventListener("change", renderResults);
    elements.genderSelect.addEventListener("change", renderResults);
    elements.searchInput.addEventListener("input", renderResults);

    loadResults();
  }

  function initRacePage() {
    const racePage = document.querySelector("[data-race-page]");
    if (!racePage) return;

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
      return RACES[key] ? key : "10k";
    }

    function renderBullets(items) {
      elements.bullets.replaceChildren();
      items.forEach((item) => {
        const bullet = document.createElement("li");
        bullet.textContent = item;
        elements.bullets.appendChild(bullet);
      });
    }

    function setActiveRace(key, updateHash) {
      const race = RACES[key] || RACES["10k"];

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
      renderBullets(race.bullets);

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
        const elevationNode = point.getElementsByTagName("ele")[0] || point.getElementsByTagNameNS("*", "ele")[0];
        return {
          lat: Number(point.getAttribute("lat")),
          lon: Number(point.getAttribute("lon")),
          ele: elevationNode ? Number(elevationNode.textContent) : 0
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
  }

  onReady(() => {
    renderSiteFooter();
    initFoodProgress();
    initPartners();
    initResultsTable();
    initRacePage();
  });
})();
