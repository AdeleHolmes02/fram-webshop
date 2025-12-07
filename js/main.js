// js/main.js

const nav = document.getElementById("site-nav");
const navToggle = document.querySelector(".nav-toggle");
const navClose = document.querySelector(".nav-close");

if (nav && navToggle && navClose) {
  function openNav() {
    nav.hidden = false;
    navToggle.setAttribute("aria-expanded", "true");
  }

  function closeNav() {
    nav.hidden = true;
    navToggle.setAttribute("aria-expanded", "false");
  }

  navToggle.addEventListener("click", openNav);
  navClose.addEventListener("click", closeNav);
}
