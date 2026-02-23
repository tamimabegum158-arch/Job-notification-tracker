/**
 * Minimal client-side router. No full page reloads. Active link click = no-op.
 */

(function () {
  var PLACEHOLDER_SUBTEXT = "This section will be built in the next step.";
  var ROUTES = {
    "/": { title: "Home", heading: "Home" },
    "/dashboard": { title: "Dashboard", heading: "Dashboard" },
    "/settings": { title: "Settings", heading: "Settings" },
    "/saved": { title: "Saved", heading: "Saved" },
    "/digest": { title: "Digest", heading: "Digest" },
    "/proof": { title: "Proof", heading: "Proof" }
  };

  function getPath() {
    return window.location.pathname.replace(/\/$/, "") || "/";
  }

  function getRoute(path) {
    return ROUTES[path] || null;
  }

  function renderPlaceholder(data) {
    return (
      '<section class="route-content">' +
      '<h1 class="heading-1">' + escapeHtml(data.heading) + "</h1>" +
      '<p class="subtext">' + escapeHtml(data.subtext) + "</p>" +
      "</section>"
    );
  }

  function render404() {
    return (
      '<section class="route-content">' +
      '<h1 class="heading-1">Page Not Found</h1>' +
      '<p class="subtext">The page you are looking for does not exist.</p>' +
      "</section>"
    );
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function updatePage(path) {
    var pathNorm = path === "" ? "/" : path;
    var route = getRoute(pathNorm);
    var outlet = document.getElementById("route-outlet");
    if (!outlet) return;

    if (route) {
      document.title = route.title + " — Job Notification App";
      outlet.innerHTML = renderPlaceholder({
        heading: route.heading,
        subtext: PLACEHOLDER_SUBTEXT
      });
    } else {
      document.title = "Page Not Found — Job Notification App";
      outlet.innerHTML = render404();
    }
  }

  function setActiveLink(path) {
    var pathNorm = path === "" ? "/" : path;
    var links = document.querySelectorAll('.top-bar__link[data-route]');
    links.forEach(function (link) {
      var route = link.getAttribute("data-route");
      if (route === pathNorm) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      }
    });
  }

  function closeMobileMenu() {
    var btn = document.getElementById("nav-menu-btn");
    var panel = document.getElementById("nav-dropdown");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (panel) {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
    }
  }

  function handleNavClick(e) {
    var link = e.target.closest('.top-bar__link[data-route][href]');
    if (!link) return;

    var href = link.getAttribute("href");
    var path = href === "/" ? "/" : href.replace(/\/$/, "");
    var currentPath = getPath();

    if (path === currentPath) {
      e.preventDefault();
      closeMobileMenu();
      return;
    }

    e.preventDefault();
    window.history.pushState({ path: path }, "", href);
    setActiveLink(path);
    updatePage(path);
    closeMobileMenu();
  }

  function handlePopState() {
    var path = getPath();
    setActiveLink(path);
    updatePage(path);
  }

  function initMenuButton() {
    var btn = document.getElementById("nav-menu-btn");
    var panel = document.getElementById("nav-dropdown");
    if (!btn || !panel) return;

    btn.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
    });
  }

  function init() {
    var path = getPath();
    setActiveLink(path);
    updatePage(path);

    document.addEventListener("click", function (e) {
      if (e.target.closest(".top-bar__nav") || e.target.closest(".nav-dropdown")) {
        handleNavClick(e);
      }
    });

    window.addEventListener("popstate", function () {
      var path = getPath();
      setActiveLink(path);
      updatePage(path);
    });

    initMenuButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
