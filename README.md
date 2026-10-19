# Portal del proyecto

Sitio educativo de Desarrollo de Software realizado por **Darwin Fabian Quiroz Tejena**, de 3.º año, paralelo B de Informática, para la Unidad Educativa Albertina Rivas Medina.

## Contenido

- `index.html`: recorrido interactivo por los nueve módulos de la carrera.
- `finanzas.html`: presupuesto, metas de ahorro, consumo responsable y resumen financiero.
- `styles.css`: estilos adaptables y temas claro y oscuro.
- `script.js`, `portfolio.js`, `finanzas.js` y `theme-init.js`: navegación, interacción, cálculos financieros y preferencia de tema.
- `text-animation.js`: animación de texto con Anime.js 4.2.0, cargado desde jsDelivr en las dos páginas.
- `assets/`: tipografía, iconos y sus avisos de licencia.

No requiere instalación de dependencias; la animación Anime.js necesita conexión a internet para cargar desde jsDelivr. Abre `index.html` directamente en un navegador o inicia un servidor estático local, por ejemplo con **Live Server** en Visual Studio Code.

Los importes introducidos en Mi Finanzas solo se mantienen mientras la página está abierta; no se guardan al recargar. La preferencia del tema sí se conserva en el navegador.

## Publicar con GitHub Pages

En el repositorio, abre **Settings → Pages**, elige **Deploy from a branch**, selecciona `main` y la carpeta `/ (root)`, y guarda los cambios. GitHub Pages publicará el sitio desde `index.html`.
