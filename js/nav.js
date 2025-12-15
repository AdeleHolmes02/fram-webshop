document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector("#site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const closeBtn = document.querySelector(".nav-close");
  const backdrop = document.querySelector(".site-nav-backdrop");

  // Hvis noe ikke finnes, logg det (så du ser feilen i Console)
  if (!nav || !toggle || !closeBtn || !backdrop) {
    console.warn("Nav elements missing:", { nav, toggle, closeBtn, backdrop });
    return;
  }

  function openNav() {
    nav.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeNav() {
    nav.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeNav() : openNav();
  });

  closeBtn.addEventListener("click", closeNav);
  backdrop.addEventListener("click", closeNav);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !nav.hidden) closeNav();
  });
});
