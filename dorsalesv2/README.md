# Recogida de dorsales - versión mejorada

Archivos incluidos:

- `index.html`: página principal para publicar dentro de `/dorsales/`.
- `dorsales.css`: estilos de la página, login, interfaz móvil, filtros, detalles y notas.
- `dorsales.js`: app con Firebase Auth + Firestore.
- `firestore.rules`: ejemplo de reglas de seguridad para Firestore.

## Cómo publicarlo en GitHub Pages

Crea o sustituye la carpeta `dorsales` en tu repositorio y deja dentro estos archivos:

```txt
dorsales/
  index.html
  dorsales.css
  dorsales.js
  firestore.rules
```

Así la URL será:

```txt
https://10kzolina.github.io/dorsales/
```

## Cambios incluidos

- Auditoría de entrega: guarda `entregado_en`, `entregado_por`, `entregado_dispositivo`, `entregado_dispositivo_id`, `entregado_user_agent` y `entregado_pantalla`.
- Auditoría de reapertura: guarda `reabierto_en`, `reabierto_por`, `reabierto_dispositivo`, `reabierto_dispositivo_id`, `reabierto_user_agent` y `reabierto_pantalla`.
- Confirmación antes de reabrir una entrega.
- Filtro por carrera y filtro por comida.
- Toast grande al entregar: `Dorsal 143 · Nombre Apellido entregado`.
- Estado visible de conexión: 🟢 Conectado, 🟡 Reconectando, 🔴 Sin conexión.
- Notas sin autoguardado: solo se guardan al pulsar `Guardar nota`.
- Historial de notas en `notas_historial` con texto, fecha ISO, correo y dispositivo.
- Botón de detalles para mostrar DNI, teléfono, correo y auditoría.
- La búsqueda también incluye DNI, teléfono y correo aunque no estén visibles por defecto.
- Resumen superior por carrera con dorsales pendientes y comidas pendientes.

## Pasos obligatorios en Firebase

1. En Firebase Console, activa Authentication > Sign-in method > Email/Password.
2. Crea usuarios para las mesas/voluntarios.
3. Actualiza `firestore.rules` con los emails reales autorizados.
4. Publica las reglas en Firestore.

Sin reglas restrictivas, el login visual no basta para proteger los datos.
