# Recogida de dorsales - versión con login

Archivos incluidos:

- `index.html`: página principal para publicar dentro de `/dorsales/`.
- `dorsales.css`: estilos de la página y pantalla de login.
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

## Pasos obligatorios en Firebase

1. En Firebase Console, activa Authentication > Sign-in method > Email/Password.
2. Crea usuarios para las mesas/voluntarios.
3. Actualiza `firestore.rules` con los emails reales autorizados.
4. Publica las reglas en Firestore.

Sin reglas restrictivas, el login visual no basta para proteger los datos.
