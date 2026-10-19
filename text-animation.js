import { animate, splitText, stagger } from "https://cdn.jsdelivr.net/npm/animejs@4.2.0/+esm";

const headings = [...document.querySelectorAll("[data-split-text]")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (headings.length) {
  const visibleHeadings = new Set();

  const phraseRotators = headings.map((heading) => {
    const phrases = [
      heading.textContent.trim(),
      ...heading.dataset.phrases.split("|").map((phrase) => phrase.trim())
    ];
    let phraseIndex = 0;
    let split;
    let animation;
    let advanceTimer;
    let cycleId = 0;

    const updatePlayback = () => {
      if (!animation) {
        return;
      }

      if (document.hidden || reduceMotion.matches || !visibleHeadings.has(heading)) {
        animation.pause();
      } else {
        animation.play();
      }
    };

    const showPhrase = (index) => {
      cycleId += 1;
      window.clearTimeout(advanceTimer);
      animation?.pause();
      split?.revert();
      split = null;
      animation = null;
      phraseIndex = index % phrases.length;
      heading.textContent = phrases[phraseIndex];

      if (reduceMotion.matches) {
        heading.removeAttribute("aria-label");
        return;
      }

      heading.setAttribute("aria-label", phrases[phraseIndex]);
      split = splitText(heading, {
        words: { wrap: "clip", class: "split-word" }
      });

      const currentCycleId = cycleId;
      let currentAnimation;
      currentAnimation = animate(split.words, {
        y: [
          { to: ["100%", "0%"] },
          { to: "-100%", delay: 1800, duration: 350, ease: "in(3)" }
        ],
        duration: 650,
        ease: "out(3)",
        delay: stagger(90),
        autoplay: false,
        loop: true,
        onLoop: () => {
          if (currentCycleId !== cycleId) {
            return;
          }

          currentAnimation.pause();
          advanceTimer = window.setTimeout(() => {
            if (currentCycleId === cycleId) {
              showPhrase(phraseIndex + 1);
            }
          }, 180);
        }
      });
      animation = currentAnimation;
      updatePlayback();
    };

    showPhrase(phraseIndex);
    return {
      heading,
      updatePlayback,
      showPhrase: () => showPhrase(phraseIndex),
      stopForReducedMotion: () => {
        cycleId += 1;
        window.clearTimeout(advanceTimer);
        animation?.pause();
        split?.revert();
        animation = null;
        split = null;
        heading.textContent = phrases[phraseIndex];
        heading.removeAttribute("aria-label");
      }
    };
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        visibleHeadings.add(target);
      } else {
        visibleHeadings.delete(target);
      }
    });
    phraseRotators.forEach(({ updatePlayback }) => updatePlayback());
  }, { threshold: 0.2 });

  headings.forEach((heading) => observer.observe(heading));

  document.addEventListener("visibilitychange", () => {
    phraseRotators.forEach(({ updatePlayback }) => updatePlayback());
  });
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      phraseRotators.forEach(({ stopForReducedMotion }) => stopForReducedMotion());
      return;
    }

    phraseRotators.forEach(({ showPhrase }) => showPhrase());
  });
}
