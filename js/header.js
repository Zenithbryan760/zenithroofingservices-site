/* Shared premium header, mobile drawer, active navigation and quick-action dock. */
(() => {
  "use strict";

  const boundOpeners = new WeakSet();
  const boundClosers = new WeakSet();
  const boundDrawers = new WeakSet();
  let globalBound = false;

  const elements = () => ({
    drawer: document.querySelector(".mobile-drawer"),
    backdrop: document.querySelector(".drawer-backdrop"),
    openers: document.querySelectorAll(".menu-button, .mobile-dock__menu"),
    closers: document.querySelectorAll(".mobile-drawer__close"),
  });

  const syncExpanded = (expanded) => {
    document.querySelectorAll(".menu-button, .mobile-dock__menu").forEach((button) => {
      button.setAttribute("aria-expanded", String(expanded));
      if (button.classList.contains("menu-button")) {
        button.setAttribute("aria-label", expanded ? "Close navigation" : "Open navigation");
      }
    });
  };

  const setMenu = (open) => {
    const { drawer, backdrop } = elements();
    if (!drawer || !backdrop) return;

    drawer.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    syncExpanded(open);
  };

  const setActiveNavigation = () => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const matches = (href) => {
      const target = new URL(href, window.location.origin).pathname.replace(/\/+$/, "") || "/";
      return target === "/" ? path === "/" : path === target || path.startsWith(`${target}/`);
    };

    document.querySelectorAll(".desktop-nav > a").forEach((link) => {
      const href = link.getAttribute("href");
      const resourceLink = href === "/blog/";
      const active = resourceLink
        ? ["/blog", "/glossary", "/youtube"].some((section) => path === section || path.startsWith(`${section}/`))
        : matches(href);
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    const services = document.querySelector(".nav-mega");
    if (services) services.classList.toggle("is-active", path === "/services" || path.startsWith("/services/"));

    const mobileHome = document.querySelector(".mobile-dock__home");
    if (mobileHome) {
      const active = path === "/";
      mobileHome.classList.toggle("is-active", active);
      if (active) mobileHome.setAttribute("aria-current", "page");
      else mobileHome.removeAttribute("aria-current");
    }
  };

  function init() {
    const { drawer, backdrop, openers, closers } = elements();
    if (!drawer || !backdrop) return;

    setActiveNavigation();

    openers.forEach((button) => {
      if (boundOpeners.has(button)) return;
      button.addEventListener("click", () => setMenu(!drawer.classList.contains("is-open")));
      boundOpeners.add(button);
    });

    closers.forEach((button) => {
      if (boundClosers.has(button)) return;
      button.addEventListener("click", () => setMenu(false));
      boundClosers.add(button);
    });

    if (!boundDrawers.has(drawer)) {
      drawer.addEventListener("click", (event) => {
        if (event.target.closest("a[href]")) setMenu(false);
      });
      backdrop.addEventListener("click", () => setMenu(false));
      boundDrawers.add(drawer);
    }

    if (!globalBound) {
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenu(false);
      });
      window.addEventListener("resize", () => {
        if (window.innerWidth > 960) setMenu(false);
      });
      globalBound = true;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.ZenithHeader = { init };
  window.initMobileMenu = init;
})();
