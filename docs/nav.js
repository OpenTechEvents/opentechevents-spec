/**
 * Mobile nav toggle — shared by every page, since none of them share a JS bundle.
 * Below the responsive breakpoint (see styles.css), .nav becomes a dropdown panel that
 * this script opens/closes; above it, .nav-toggle is hidden and .nav sits inline as usual.
 */
(function () {
  "use strict";

  document.querySelectorAll(".nav-toggle").forEach(function (toggle) {
    var nav = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!nav) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    // A link was just followed (same-page anchor or a new page) — either way, don't
    // leave the panel open behind it.
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        close();
        toggle.focus();
      }
    });

    // Resizing past the breakpoint with the panel open would otherwise leave it
    // "open" in a layout that no longer has a collapsed state to close it from.
    // Keep this number in sync with the media query in styles.css.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1000) close();
    });
  });

  /* The Docs group inside the nav. Its links are in the HTML either way — this only toggles
     their visibility — so a page with JS disabled loses a dropdown, not five pages. */
  document.querySelectorAll("[data-nav-group]").forEach(function (group) {
    var toggle = group.querySelector(".nav-group-toggle");
    if (!toggle) return;

    function setOpen(open) {
      group.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      setOpen(!group.classList.contains("is-open"));
    });

    // A click anywhere else closes it — but not a click inside the panel, which would
    // cancel the navigation the link was there for.
    document.addEventListener("click", function (event) {
      if (!group.contains(event.target)) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && group.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Tabbing out of the group is a dismissal too: the panel is positioned over the page,
    // so leaving it open behind a focus ring three links away just obscures content.
    group.addEventListener("focusout", function (event) {
      if (!group.contains(event.relatedTarget)) setOpen(false);
    });
  });
})();
