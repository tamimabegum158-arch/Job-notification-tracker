/**
 * Job Notification Tracker — dashboard and saved views.
 * Filtering, job cards, modal, localStorage for saved jobs.
 */

(function () {
  var STORAGE_KEY = "job-notification-tracker-saved";

  function getSavedIds() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedIds(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {}
  }

  function escapeHtml(s) {
    if (s == null) return "";
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function postedLabel(days) {
    if (days == null || typeof days !== "number") return "Recently";
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return days + " days ago";
  }

  function getJobs() {
    return window.JOBS_DATA || [];
  }

  function getUniqueLocations() {
    var jobs = getJobs();
    var set = {};
    jobs.forEach(function (j) {
      if (j.location) set[j.location] = true;
    });
    return Object.keys(set).sort();
  }

  function filterAndSortJobs(jobs, filters) {
    var keyword = (filters.keyword || "").trim().toLowerCase();
    var list = jobs.filter(function (j) {
      if (keyword) {
        var title = (j.title || "").toLowerCase();
        var company = (j.company || "").toLowerCase();
        if (title.indexOf(keyword) === -1 && company.indexOf(keyword) === -1) return false;
      }
      if (filters.location && j.location !== filters.location) return false;
      if (filters.mode && j.mode !== filters.mode) return false;
      if (filters.experience && j.experience !== filters.experience) return false;
      if (filters.source && j.source !== filters.source) return false;
      return true;
    });
    var sort = filters.sort || "latest";
    list.sort(function (a, b) {
      var da = a.postedDaysAgo != null ? a.postedDaysAgo : 99;
      var db = b.postedDaysAgo != null ? b.postedDaysAgo : 99;
      return sort === "oldest" ? db - da : da - db;
    });
    return list;
  }

  function getFilters() {
    var keywordEl = document.getElementById("filter-keyword");
    var locationEl = document.getElementById("filter-location");
    var modeEl = document.getElementById("filter-mode");
    var experienceEl = document.getElementById("filter-experience");
    var sourceEl = document.getElementById("filter-source");
    var sortEl = document.getElementById("filter-sort");
    return {
      keyword: keywordEl ? keywordEl.value : "",
      location: locationEl ? locationEl.value : "",
      mode: modeEl ? modeEl.value : "",
      experience: experienceEl ? experienceEl.value : "",
      source: sourceEl ? sourceEl.value : "",
      sort: sortEl ? sortEl.value : "latest"
    };
  }

  function renderJobCard(job, options) {
    options = options || {};
    var savedIds = getSavedIds();
    var isSaved = savedIds.indexOf(job.id) !== -1;
    var saveLabel = isSaved ? "Saved" : "Save";
    var saveDisabled = isSaved ? " disabled" : "";
    var meta = [job.location, job.mode, job.experience].filter(Boolean).join(" · ") || "—";
    var badgeClass = "badge";
    return (
      '<div class="job-card" data-job-id="' + escapeHtml(job.id) + '">' +
      '<p class="job-card__title">' + escapeHtml(job.title) + "</p>" +
      '<p class="job-card__company">' + escapeHtml(job.company) + "</p>" +
      '<p class="job-card__meta">' + escapeHtml(meta) + "</p>" +
      '<p class="job-card__salary">' + escapeHtml(job.salaryRange || "—") + "</p>" +
      '<div class="job-card__footer">' +
      '<span class="badge">' + escapeHtml(job.source || "—") + "</span>" +
      '<span class="job-card__posted">' + escapeHtml(postedLabel(job.postedDaysAgo)) + "</span>" +
      '<button type="button" class="btn btn--secondary btn--small" data-action="view">View</button>' +
      (options.hideSave ? "" : '<button type="button" class="btn btn--secondary btn--small" data-action="save"' + saveDisabled + ">" + saveLabel + "</button>") +
      (options.savedPage ? '<button type="button" class="btn btn--secondary btn--small" data-action="remove">Remove</button>' : '<button type="button" class="btn btn--primary btn--small" data-action="apply">Apply</button>') +
      "</div>" +
      "</div>"
    );
  }

  function openModal(job) {
    var overlay = document.getElementById("job-modal-overlay");
    var titleEl = document.getElementById("job-modal-title");
    var companyEl = document.getElementById("job-modal-company");
    var descEl = document.getElementById("job-modal-desc");
    var skillsEl = document.getElementById("job-modal-skills");
    var applyBtn = document.getElementById("job-modal-apply");
    if (!overlay || !job) return;
    if (titleEl) titleEl.textContent = job.title || "—";
    if (companyEl) companyEl.textContent = job.company || "—";
    if (descEl) descEl.textContent = job.description || "No description provided.";
    if (skillsEl) {
      skillsEl.innerHTML = (job.skills || []).map(function (s) {
        return '<span class="modal__skill">' + escapeHtml(s) + "</span>";
      }).join("");
    }
    if (applyBtn) {
      applyBtn.onclick = function () {
        if (job.applyUrl) window.open(job.applyUrl, "_blank", "noopener");
      };
    }
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    var overlay = document.getElementById("job-modal-overlay");
    if (overlay) {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
    }
  }

  function refreshDashboardCards() {
    var container = document.getElementById("job-cards-container");
    if (!container) return;
    var jobs = getJobs();
    var filters = getFilters();
    var list = filterAndSortJobs(jobs, filters);
    if (list.length === 0) {
      container.innerHTML = '<p class="no-results">No jobs match your search.</p>';
      container.classList.remove("job-cards-grid");
      return;
    }
    container.classList.add("job-cards-grid");
    container.innerHTML = list.map(function (j) { return renderJobCard(j, {}); }).join("");
  }

  function bindDashboardEvents() {
    var container = document.getElementById("job-cards-container");
    var overlay = document.getElementById("job-modal-overlay");
    var closeBtn = document.getElementById("job-modal-close");
    var filterIds = ["filter-keyword", "filter-location", "filter-mode", "filter-experience", "filter-source", "filter-sort"];

    function onFilterChange() {
      refreshDashboardCards();
    }

    filterIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("change", onFilterChange);
    });
    var keywordEl = document.getElementById("filter-keyword");
    if (keywordEl) keywordEl.addEventListener("input", onFilterChange);

    if (container) {
      container.addEventListener("click", function (e) {
        var card = e.target.closest(".job-card");
        var btn = e.target.closest("button[data-action]");
        if (!card || !btn) return;
        var jobId = card.getAttribute("data-job-id");
        var action = btn.getAttribute("data-action");
        var jobs = getJobs();
        var job = jobs.filter(function (j) { return j.id === jobId; })[0];
        if (!job) return;
        if (action === "view") {
          openModal(job);
        } else if (action === "save") {
          var ids = getSavedIds();
          if (ids.indexOf(jobId) === -1) {
            ids.push(jobId);
            setSavedIds(ids);
            refreshDashboardCards();
          }
        } else if (action === "apply") {
          if (job.applyUrl) window.open(job.applyUrl, "_blank", "noopener");
        }
      });
    }
  }

  function initDashboard() {
    var locationSelect = document.getElementById("filter-location");
    if (locationSelect) {
      var locs = getUniqueLocations();
      var options = locationSelect.innerHTML;
      locs.forEach(function (loc) {
        locationSelect.appendChild(document.createElement("option")).value = loc;
        locationSelect.lastChild.textContent = loc;
      });
    }
    refreshDashboardCards();
    bindDashboardEvents();
  }

  function renderSavedContent() {
    var container = document.getElementById("saved-jobs-container");
    if (!container) return;
    var ids = getSavedIds();
    var jobs = getJobs();
    var savedJobs = ids.map(function (id) {
      return jobs.filter(function (j) { return j.id === id; })[0];
    }).filter(Boolean);
    if (savedJobs.length === 0) {
      container.innerHTML =
        '<div class="empty-state empty-state--premium">' +
        '<p class="empty-state__title">No saved jobs yet</p>' +
        '<p class="empty-state__body">Save any job from your dashboard to find it here. Useful when you want to compare a few roles or apply later.</p>' +
        "</div>";
      return;
    }
    container.innerHTML = '<div class="job-cards-grid">' +
      savedJobs.map(function (j) { return renderJobCard(j, { savedPage: true }); }).join("") +
      "</div>";
  }

  function bindSavedEvents() {
    var container = document.getElementById("saved-jobs-container");
    if (!container) return;
    container.addEventListener("click", function (e) {
      var card = e.target.closest(".job-card");
      var btn = e.target.closest("button[data-action]");
      if (!card || !btn) return;
      var jobId = card.getAttribute("data-job-id");
      var action = btn.getAttribute("data-action");
      var jobs = getJobs();
      var job = jobs.filter(function (j) { return j.id === jobId; })[0];
      if (!job) return;
      if (action === "view") {
        openModal(job);
      } else if (action === "remove") {
        var ids = getSavedIds().filter(function (id) { return id !== jobId; });
        setSavedIds(ids);
        renderSavedContent();
      } else if (action === "apply") {
        if (job.applyUrl) window.open(job.applyUrl, "_blank", "noopener");
      }
    });
  }

  function initSaved() {
    renderSavedContent();
    bindSavedEvents();
  }

  function bindModalClose() {
    var overlay = document.getElementById("job-modal-overlay");
    var closeBtn = document.getElementById("job-modal-close");
    if (overlay) overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
  }

  window.initDashboard = initDashboard;
  window.initSaved = initSaved;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindModalClose);
  } else {
    bindModalClose();
  }
})();
