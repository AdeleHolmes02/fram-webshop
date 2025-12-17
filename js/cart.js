document.addEventListener("DOMContentLoaded", () => {
  const countEl = document.querySelector(".cart-count");
  if (!countEl) return;

  const STORAGE_KEY = "fram_cart_count";

  // 1) Tøm KUN hvis siden ble reloaded
  const nav = performance.getEntriesByType("navigation")[0];
  if (nav && nav.type === "reload") {
    localStorage.removeItem(STORAGE_KEY);
  }

  const getCount = () => {
    const n = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const setCount = (n) => {
    localStorage.setItem(STORAGE_KEY, String(n));
    countEl.textContent = String(n);
  };

  // Init
  setCount(getCount());

  // 2) Legg til fra både landing (product-add) og products (produce-add)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-add, .produce-add");
    if (!btn) return;

    setCount(getCount() + 1);
  });

  // 3) Tøm-funksjon (hvis du vil bruke en knapp senere)
  window.resetCart = () => setCount(0);
});
