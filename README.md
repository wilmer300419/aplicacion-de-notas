# Control de notas estudiantiles

Aplicación web para **registrar, editar y eliminar notas** de estudiantes por materia y curso, y consultar **todas las notas de un estudiante** con su promedio.

## Funciones
- Registro: estudiante, materia, curso y nota (0,0 a 5,0). Se aprueba con 3,0 o más.
- Tabla con todas las notas, búsqueda, edición y eliminación con confirmación.
- Pestaña «Notas por estudiante»: promedio, total, aprobadas, reprobadas y detalle por materia.
- Los datos se guardan en el navegador (`localStorage`); no requiere servidor.

## Archivos
- `index.html`, `styles.css`, `app.js`: la aplicación.
- `PSEUDOCODIGO.md`: pseudocódigo y diagrama de flujo.

## Paleta
`#B9CFE6` · `#91BFEE` · `#64A6E3` · `#418FDB` · `#0B5CAD`, más `#0A2540` para el texto.

## Usar en local
Abre `index.html` en el navegador.

## Desplegar en GitHub Pages
1. Sube estos archivos a la raíz de un repositorio.
2. **Settings → Pages → Build and deployment → Deploy from a branch**, rama `main`, carpeta `/ (root)`, **Save**.
3. Quedará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
