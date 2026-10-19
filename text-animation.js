import { animate, splitText, stagger } from "https://cdn.jsdelivr.net/npm/animejs@4.2.0/+esm";

const headings = [...document.querySelectorAll("[data-split-text]")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (headings.length) {
  const animations = new Map();
  const splits = new Map();
  const visibleHeadings = new Set();

  const setupHeading = (heading) => {
    if (splits.has(heading)) {
      return;
    }

    const text = heading.textContent.trim();
    const split = splitText(heading, {
      words: { wrap: "clip", class: "split-word" }
    });
    splits.set(heading, split);
    heading.setAttribute("aria-label", text);

    split.addEffect(({ words }) => {
      const animation = animate(words, {
        y: [
          { to: ["100%", "0%"] },
          { to: "-100%", delay: 1800, duration: 300, ease: "in(3)" }
        ],
        duration: 750,
        ease: "out(3)",
        delay: stagger(100),
        loop: true
      });

      animations.set(heading, animation);

      if (document.hidden || !visibleHeadings.has(heading)) {
        animation.pause();
      }

      return () => {
        animation.pause();
        if (animations.get(heading) === animation) {
          animations.delete(heading);
        }
      };
    });
  };

  const updatePlayback = () => {
    animations.forEach((animation, heading) => {
      if (document.hidden || reduceMotion.matches || !visibleHeadings.has(heading)) {
        animation.pause();
      } else {
        animation.play();
      }
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        visibleHeadings.add(target);
      } else {
        visibleHeadings.delete(target);
      }
    });
    updatePlayback();
  }, { threshold: 0.2 });

  headings.forEach((heading) => {
    observer.observe(heading);
    if (!reduceMotion.matches) {
      setupHeading(heading);
    }
  });

  document.addEventListener("visibilitychange", updatePlayback);
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      splits.forEach((split, heading) => {
        split.revert();
        heading.removeAttribute("aria-label");
      });
      splits.clear();
      animations.clear();
      return;
    }

    headings.forEach(setupHeading);
    updatePlayback();
  });
}
