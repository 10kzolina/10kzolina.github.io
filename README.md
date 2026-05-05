# 10K Zolina

Web estatica de la carrera solidaria 10K Zolina.

## Estructura

- `index.html`: portada, inscripcion, Kiloreto y reto Strava.
- `carreras.html`: recorridos Txiki, 5K y 10K con GPX y mapa.
- `kiloreto.html`: pagina del reto de recogida de alimentos.
- `challenge.html`: informacion del KOM Challenge.
- `resultados.html`: pagina publica de resultados en modo "proximamente".
- `resultados_aux.html`: version dinamica de resultados para el dia de la carrera; carga `resultados.csv` y esta preparada para sustituir a `resultados.html`.
- `colaboradores.html`: listado filtrable de colaboradores.
- `contacto.html`: canales de contacto.
- `app.js`: logica compartida del footer, Kiloreto, colaboradores y recorridos.
- `styles.css`: estilos globales.
- `img/`: imagenes y logos.
- `recorrido_*.gpx`: tracks de los recorridos.
- `sitemap.xml`, `robots.txt`, `site.webmanifest`: SEO y metadatos.

## Mantenimiento rapido

- Para actualizar el marcador solidario, cambia `FOOD_CHALLENGE.currentKg` en `app.js`.
- Para anadir o corregir colaboradores, edita `COLLABORATORS` en `app.js`.
- Para actualizar logos del footer, edita `SPONSOR_LOGOS` en `app.js`.
- Para cambiar recorridos, sustituye los GPX y revisa las URLs `routeUrl` de `RACES` en `app.js`.
- Para publicar resultados, actualiza `resultados.csv` y sustituye `resultados.html` por el contenido de `resultados_aux.html`.
- Tras cambios de paginas publicas, actualiza `lastmod` en `sitemap.xml`.

## Publicacion

La web no necesita build. Sirve los archivos desde la raiz del proyecto.
