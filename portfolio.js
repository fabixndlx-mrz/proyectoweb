const moduleStops = [...document.querySelectorAll(".module-stop")];
const stageLinks = [...document.querySelectorAll("[data-stage-link]")];
const routeLinks = [...document.querySelectorAll(".route-stage a")];

function setCurrentStage(stage) {
  for (const link of stageLinks) {
    const current = link.dataset.stageLink === stage;
    link.classList.toggle("is-current", current);
    if (current) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

for (const link of routeLinks) {
  link.addEventListener("click", () => {
    const target = document.querySelector(link.getAttribute("href"));
    const stage = target?.dataset.stage || (target?.id === "modulo-practico" ? "practica" : null);
    if (stage) {
      setCurrentStage(stage);
    }
  });
}

for (const link of stageLinks) {
  link.addEventListener("click", () => {
    setCurrentStage(link.dataset.stageLink);
  });
}

for (const stop of moduleStops) {
  stop.addEventListener("toggle", () => {
    if (!stop.open) {
      return;
    }

    for (const sibling of moduleStops) {
      if (sibling !== stop) {
        sibling.open = false;
      }
    }

    setCurrentStage(stop.dataset.stage);
  });
}

const hashTarget = window.location.hash
  ? document.querySelector(window.location.hash)
  : null;
const hashStage = hashTarget?.dataset.stage;
if (hashStage) {
  setCurrentStage(hashStage);
}
