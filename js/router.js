/**
 * Job Notification Tracker — client-side router.
 * No full page reloads. Active link click = no-op. In-app links use SPA navigation.
 */

(function () {
  var ROUTES = {
    "/": { title: "Home" },
    "/dashboard": { title: "Dashboard" },
    "/settings": { title: "Settings" },
    "/saved": { title: "Saved" },
    "/digest": { title: "Digest" },
    "/proof": { title: "Proof" }
  };

  function getPath() {
    return window.location.pathname.replace(/\/$/, "") || "/";
  }

  function getRoute(path) {
    return ROUTES[path] || null;
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function renderLanding() {
    return (
      '<section class="route-content landing">' +
      '<p class="landing__problem">The problem</p>' +
      '<h1 class="heading-1">Job boards are noisy. The right role gets buried.</h1>' +
      '<p class="subtext">You waste time scrolling and still miss matches that fit.</p>' +
      '<p class="landing__benefit">We surface precision-matched roles and deliver a short list to you every morning at 9AM—so you see the right jobs first, without the clutter.</p>' +
      '<p class="landing__cta">' +
      '<a href="/settings" class="btn btn--primary">Start Tracking</a>' +
      "</p>" +
      "</section>"
    );
  }

  function renderSettings() {
    return (
      '<section class="route-content">' +
      '<h1 class="heading-1">What are you looking for?</h1>' +
      '<p class="subtext">Tell us your preferences so we can match you to the right roles. Your answers are used only to personalize your feed.</p>' +
      '<div class="card settings-card" style="margin-top: var(--space-4); max-width: 560px;">' +
      '<div class="form-group">' +
      '<label class="form-group__label" for="role-keywords">Role keywords</label>' +
      '<input type="text" id="role-keywords" class="input" placeholder="e.g. Frontend, React, Product Manager" />' +
      "</div>" +
      '<div class="form-group">' +
      '<label class="form-group__label" for="locations">Preferred locations</label>' +
      '<input type="text" id="locations" class="input" placeholder="e.g. New York, London, Remote" />' +
      "</div>" +
      '<div class="form-group">' +
      '<label class="form-group__label" for="mode">Mode</label>' +
      '<select id="mode" class="input select">' +
      '<option value="">Select</option>' +
      '<option value="remote">Remote</option>' +
      '<option value="hybrid">Hybrid</option>' +
      '<option value="onsite">Onsite</option>' +
      "</select>" +
      "</div>" +
      '<div class="form-group">' +
      '<label class="form-group__label" for="experience">Experience level</label>' +
      '<select id="experience" class="input select">' +
      '<option value="">Select</option>' +
      '<option value="entry">Entry</option>' +
      '<option value="mid">Mid</option>' +
      '<option value="senior">Senior</option>' +
      '<option value="lead">Lead</option>' +
      "</select>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function renderDashboard() {
    return (
      '<section class="route-content">' +
      '<h1 class="heading-1">Dashboard</h1>' +
      '<p class="subtext">Your matched jobs in one place.</p>' +
      '<div class="filter-bar">' +
      '<div class="form-group form-group--search">' +
      '<label class="form-group__label" for="filter-keyword">Keyword</label>' +
      '<input type="text" id="filter-keyword" class="input" placeholder="Title or company" />' +
      "</div>" +
      '<div class="form-group">' +
      '<label class="form-group__label" for="filter-location">Location</label>' +
      '<select id="filter-location" class="input select"><option value="">All</option></select>' +
      "</div>" +
      '<div class="form-group">' +
      '<label class="form-group__label" for="filter-mode">Mode</label>' +
      '<select id="filter-mode" class="input select">' +
      '<option value="">All</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="Onsite">Onsite</option>' +
      "</select>" +
      "</div>" +
      '<div class="form-group">' +
      '<label class="form-group__label" for="filter-experience">Experience</label>' +
      '<select id="filter-experience" class="input select">' +
      '<option value="">All</option><option value="Fresher">Fresher</option><option value="0-1">0-1</option><option value="1-3">1-3</option><option value="3-5">3-5</option>' +
      "</select>" +
      "</div>" +
      '<div class="form-group">' +
      '<label class="form-group__label" for="filter-source">Source</label>' +
      '<select id="filter-source" class="input select">' +
      '<option value="">All</option><option value="LinkedIn">LinkedIn</option><option value="Naukri">Naukri</option><option value="Indeed">Indeed</option>' +
      "</select>" +
      "</div>" +
      '<div class="form-group">' +
      '<label class="form-group__label" for="filter-sort">Sort</label>' +
      '<select id="filter-sort" class="input select">' +
      '<option value="latest">Latest</option><option value="oldest">Oldest</option>' +
      "</select>" +
      "</div>" +
      "</div>" +
      '<div id="job-cards-container" class="job-cards-grid"></div>' +
      "</section>"
    );
  }

  function renderSaved() {
    return (
      '<section class="route-content">' +
      '<h1 class="heading-1">Saved</h1>' +
      '<p class="subtext">Jobs you want to revisit later.</p>' +
      '<div id="saved-jobs-container"></div>' +
      "</section>"
    );
  }

  function renderDigest() {
    return (
      '<section class="route-content">' +
      '<h1 class="heading-1">Digest</h1>' +
      '<p class="subtext">Your daily summary, delivered at 9AM.</p>' +
      '<div class="empty-state empty-state--premium" style="margin-top: var(--space-4);">' +
      '<p class="empty-state__title">Daily digest coming soon</p>' +
      '<p class="empty-state__body">We will send you a short, curated list of new matches every morning—so you see the right jobs first without opening multiple tabs.</p>' +
      "</div>" +
      "</section>"
    );
  }

  function renderProof() {
    return (
      '<section class="route-content">' +
      '<h1 class="heading-1">Proof</h1>' +
      '<p class="subtext">Artifact collection and delivery proof. This section will be built in the next step.</p>' +
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

  var RENDER = {
    "/": renderLanding,
    "/dashboard": renderDashboard,
    "/settings": renderSettings,
    "/saved": renderSaved,
    "/digest": renderDigest,
    "/proof": renderProof
  };

  function updatePage(path) {
    var pathNorm = path === "" ? "/" : path;
    var route = getRoute(pathNorm);
    var outlet = document.getElementById("route-outlet");
    if (!outlet) return;

    if (route) {
      document.title = route.title + " — Job Notification Tracker";
      var render = RENDER[pathNorm];
      outlet.innerHTML = render ? render() : "";
      if (pathNorm === "/dashboard" && window.initDashboard) window.initDashboard();
      if (pathNorm === "/saved" && window.initSaved) window.initSaved();
    } else {
      document.title = "Page Not Found — Job Notification Tracker";
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

  function navigateTo(path, e) {
    if (e) e.preventDefault();
    var pathNorm = path === "" ? "/" : path;
    var href = pathNorm === "/" ? "/" : pathNorm;
    window.history.pushState({ path: pathNorm }, "", href);
    setActiveLink(pathNorm);
    updatePage(pathNorm);
    closeMobileMenu();
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
    navigateTo(path, null);
  }

  function handleInAppLink(e) {
    var link = e.target.closest('a[href^="/"]');
    if (!link || link.closest(".top-bar__nav") || link.closest(".nav-dropdown")) return;

    var href = link.getAttribute("href");
    if (href === "#" || href.indexOf("//") !== -1) return;

    var path = href.replace(/\/$/, "") || "/";
    e.preventDefault();
    navigateTo(path, null);
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
      } else {
        handleInAppLink(e);
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
