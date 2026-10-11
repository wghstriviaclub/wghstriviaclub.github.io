const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const categoryDisplay = document.querySelector("[data-category]");
const shuffleButton = document.querySelector("[data-shuffle]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileNavigation = window.matchMedia("(max-width: 900px)");
const supportsCrossDocumentTransitions = document.documentElement.classList.contains(
  "view-transition-capable",
);

const setMenuState = (isOpen) => {
  if (!navigation || !menuButton) return;
  navigation.classList.toggle("open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.querySelector(".sr-only").textContent = isOpen
    ? "Close navigation"
    : "Open navigation";
  document.body.classList.toggle("menu-open", isOpen);
  navigation.inert = mobileNavigation.matches && !isOpen;
};

if (menuButton) {
  menuButton.addEventListener("click", () => {
    setMenuState(menuButton.getAttribute("aria-expanded") !== "true");
  });
}

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

const updateHeader = () => {
  header?.classList.toggle("scrolled", window.scrollY > 12 || !categoryDisplay);
};

window.addEventListener(
  "scroll",
  updateHeader,
  { passive: true },
);
updateHeader();

const syncNavigationMode = () => setMenuState(false);
mobileNavigation.addEventListener("change", syncNavigationMode);
syncNavigationMode();

const categories = ["Pop culture", "History", "Science", "Sports"];
let currentCategory = 0;

if (shuffleButton && categoryDisplay) {
  shuffleButton.addEventListener("click", () => {
    currentCategory = (currentCategory + 1 + Math.floor(Math.random() * 3)) % categories.length;

    if (reduceMotion.matches) {
      categoryDisplay.textContent = categories[currentCategory];
      return;
    }

    categoryDisplay.classList.remove("switching");
    void categoryDisplay.offsetWidth;
    categoryDisplay.classList.add("switching");

    window.setTimeout(() => {
      categoryDisplay.textContent = categories[currentCategory];
    }, 100);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
    setMenuState(false);
    menuButton.focus();
  }
});

document.addEventListener("click", (event) => {
  if (
    menuButton?.getAttribute("aria-expanded") === "true" &&
    !navigation?.contains(event.target) &&
    !menuButton.contains(event.target)
  ) {
    setMenuState(false);
  }
});

document.addEventListener("click", (event) => {
  if (reduceMotion.matches || supportsCrossDocumentTransitions || event.defaultPrevented) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!link || link.target || link.hasAttribute("download")) return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin) return;
  if (
    destination.pathname === window.location.pathname &&
    destination.search === window.location.search &&
    destination.hash
  ) {
    return;
  }

  event.preventDefault();
  if (document.body.classList.contains("page-leaving")) return;
  document.body.classList.add("page-leaving");

  let didNavigate = false;
  const navigate = () => {
    if (didNavigate) return;
    didNavigate = true;
    window.location.assign(destination.href);
  };
  document.body.addEventListener("animationend", navigate, { once: true });
  window.setTimeout(navigate, 260);
});

window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-leaving");
});

const loadRevealSelectors = [
  ".site-header",
  ".hero-copy > *",
  ".quiz-card",
  ".page-hero h1",
  ".page-hero p",
  ".page-mark",
];

const scrollRevealGroups = [
  ".section-heading > *",
  ".values-grid > *",
  ".section-action",
  ".story-panel",
  ".content-grid > *",
  ".event-card",
  ".meeting-note",
  ".join-intro > *",
  ".join-summary",
  ".join-page h2",
  ".steps-list li",
  ".contact-grid > *",
  ".contact-page-grid > *",
  ".action-card",
  ".footer-grid > *",
];

const finishReveal = (item) => {
  const handleTransitionEnd = (event) => {
    if (event.propertyName !== "transform") return;
    item.classList.remove(
      "reveal",
      "reveal-on-load",
      "reveal-scale",
      "reveal-from-left",
      "reveal-from-right",
      "is-visible",
      "will-animate",
    );
    item.style.removeProperty("--reveal-delay");
    item.removeEventListener("transitionend", handleTransitionEnd);
  };

  item.addEventListener("transitionend", handleTransitionEnd);
};

if (!reduceMotion.matches) {
  document.documentElement.classList.add("motion-ready");

  const loadItems = document.querySelectorAll(loadRevealSelectors.join(","));
  loadItems.forEach((item, index) => {
    item.classList.add("reveal-on-load");
    item.style.setProperty("--reveal-delay", `${Math.min(index * 60, 240)}ms`);
  });

  const revealItems = new Set();
  scrollRevealGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((item, index) => {
      if (revealItems.has(item)) return;
      revealItems.add(item);
      item.classList.add("reveal");
      item.style.setProperty("--reveal-delay", `${Math.min(index * 80, 280)}ms`);

      if (
        item.matches(
          ".value-card, .story-panel, .content-grid article, .event-card, .join-summary, .action-card",
        )
      ) {
        item.classList.add("reveal-scale");
      } else if (selector.includes("grid > *") && !selector.includes("footer")) {
        item.classList.add(index % 2 === 0 ? "reveal-from-left" : "reveal-from-right");
      }
    });
  });

  requestAnimationFrame(() => {
    window.setTimeout(() => {
      loadItems.forEach((item) => {
        item.classList.add("will-animate");
        finishReveal(item);
        requestAnimationFrame(() => item.classList.add("is-visible"));
      });
    }, 40);
  });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("will-animate");
        finishReveal(entry.target);
        requestAnimationFrame(() => entry.target.classList.add("is-visible"));
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}
