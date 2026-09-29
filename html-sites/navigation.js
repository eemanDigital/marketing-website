const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteHeader && siteNav) {
  const setMenuOpen = (isOpen) => {
    siteHeader.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuToggle.getAttribute("aria-expanded") === "true"
    ) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !siteHeader.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  window
    .matchMedia("(min-width: 821px)")
    .addEventListener("change", (event) => {
      if (event.matches) {
        setMenuOpen(false);
      }
    });
}
