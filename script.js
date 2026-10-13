const menuToggle = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector(".site-nav");
const themeToggle = document.querySelector(".theme-toggle");
const themeLabel = themeToggle?.querySelector("[data-theme-label]");
const themeStorageKey = "portal-project-theme";

function updateThemeControl() {
  if (!themeToggle || !themeLabel) {
    return;
  }

  const isDark = document.documentElement.dataset.theme === "dark";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeLabel.textContent = `Cambiar a tema ${isDark ? "claro" : "oscuro"}`;
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#132432" : "#f5f7f8";
}

if (themeToggle) {
  updateThemeControl();

  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    updateThemeControl();

    try {
      window.localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
      console.error("No se pudo guardar la preferencia de tema en este navegador.", error);
    }
  });
}

if (menuToggle && siteNavigation) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    siteNavigation.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNavigation.classList.toggle("is-open", !isOpen);
  });

  siteNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a") || event.target.closest(".theme-toggle")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuToggle.focus();
    }
  });

  window.matchMedia("(min-width: 761px)").addEventListener("change", closeMenu);
}
