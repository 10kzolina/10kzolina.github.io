# Recogida de dorsales - versión con login

Archivos incluidos:

- `index.html`: página principal para publicar dentro de `/dorsales/`.
- `dorsales.css`: estilos de la página, login, tarjetas, historial de notas y formulario de alta.
- `dorsales.js`: app con Firebase Auth + Firestore.
- `firestore.rules`: reglas de seguridad para Firestore.

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
3. Publica las reglas de `firestore.rules` en Firestore Database > Rules.

## Alta manual de registros

El botón `Añadir` permite crear documentos nuevos en la colección `corredores`.

Campos obligatorios:

- `nombre`
- `carrera`: `10k carrera`, `5k carrera`, `5k marcha`, `txiki` o `no corredor`
- `comida`: número entero mayor o igual que 0

Campos opcionales:

- `dorsal`
- `genero`: `M` o `F`
- `correo`
- `telefono`
- `dni`
- `edad`

Los registros se crean como pendientes (`bolsa_entregada: false`) y con trazabilidad:

- `creado_en`
- `creado_por`
- `actualizado_en`
- `actualizado_por`

## Exportación CSV

El botón `csv` descarga `corredores.csv` con los registros cuya `carrera` sea `10k carrera` o `5k carrera`, ordenados por dorsal.

Sin reglas restrictivas, el login visual no basta para proteger los datos. Las reglas incluidas permiten leer, crear y actualizar solo a usuarios autenticados con Firebase Auth.
