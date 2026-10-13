(() => {
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  let savedTheme = null;

  try {
    savedTheme = window.localStorage.getItem("portal-project-theme");
  } catch (error) {
    console.error("No se pudo leer la preferencia de tema de este navegador.", error);
  }

  const theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : systemTheme;
  document.documentElement.dataset.theme = theme;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.content = theme === "dark" ? "#132432" : "#f5f7f8";
  }
})();
