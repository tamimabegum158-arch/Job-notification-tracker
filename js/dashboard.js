/**
 * Job Notification Tracker — dashboard, saved views, preferences, match scoring.
 */

(function () {
  var STORAGE_KEY = "job-notification-tracker-saved";
  var PREFERENCES_KEY = "jobTrackerPreferences";

  function defaultPreferences() {
    return {
      roleKeywords: [],
      preferredLocations: [],
      preferredMode: [],
      experienceLevel: "",
      skills: [],
      minMatchScore: 40
    };
  }

  function getPreferences() {
    try {
      var raw = localStorage.getItem(PREFERENCES_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (!p || typeof p !== "object") return null;
      return {
        roleKeywords: Array.isArray(p.roleKeywords) ? p.roleKeywords : [],
        preferredLocations: Array.isArray(p.preferredLocations) ? p.preferredLocations : [],
        preferredMode: Array.isArray(p.preferredMode) ? p.preferredMode : [],
        experienceLevel: p.experienceLevel || "",
        skills: Array.isArray(p.skills) ? p.skills : [],
        minMatchScore: typeof p.minMatchScore === "number" ? Math.max(0, Math.min(100, p.minMatchScore)) : 40
      };
    } catch (e) {
      return null;
    }
  }

  function setPreferences(prefs) {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (e) {}
  }

  var DIGEST_KEY_PREFIX = "jobTrackerDigest_";

  function getTodayKey() {
    var d = new Date();
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function getDigest(dateKey) {
    try {
      var raw = localStorage.getItem(DIGEST_KEY_PREFIX + dateKey);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.jobs)) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function setDigest(dateKey, data) {
    try {
      localStorage.setItem(DIGEST_KEY_PREFIX + dateKey, JSON.stringify(data));
    } catch (e) {}
  }

  function formatDigestDate(dateKey) {
    var parts = dateKey.split("-");
    if (parts.length !== 3) return dateKey;
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var mi = parseInt(parts[1], 10) - 1;
    var month = months[mi] || parts[1];
    return month + " " + parseInt(parts[2], 10) + ", " + parts[0];
  }

  /**
   * Top 10 jobs by matchScore desc, then postedDaysAgo asc. Returns snapshot for storage.
   */
  function generateDigest() {
    var prefs = getPreferences();
    if (!prefs) return null;
    var jobs = getJobs();
    var withScore = jobs.slice().map(function (j) {
      return { job: j, score: computeMatchScore(j, prefs) };
    });
    var minScore = prefs.minMatchScore != null ? prefs.minMatchScore : 40;
    withScore = withScore.filter(function (x) { return x.score >= minScore; });
    withScore.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var da = a.job.postedDaysAgo != null ? a.job.postedDaysAgo : 99;
      var db = b.job.postedDaysAgo != null ? b.job.postedDaysAgo : 99;
      return da - db;
    });
    var top10 = withScore.slice(0, 10).map(function (x) {
      var j = x.job;
      return {
        id: j.id,
        title: j.title || "",
        company: j.company || "",
        location: j.location || "",
        experience: j.experience || "",
        matchScore: x.score,
        applyUrl: j.applyUrl || ""
      };
    });
    var todayKey = getTodayKey();
    var data = { date: todayKey, dateLabel: formatDigestDate(todayKey), jobs: top10 };
    setDigest(todayKey, data);
    return data;
  }

  /**
   * Match score (cap 100): +25 title keyword, +15 desc keyword, +15 location, +10 mode, +10 experience,
   * +15 skills overlap, +5 postedDaysAgo<=2, +5 source LinkedIn.
   */
  function computeMatchScore(job, prefs) {
    if (!prefs) return 0;
    var score = 0;
    var title = (job.title || "").toLowerCase();
    var desc = (job.description || "").toLowerCase();
    var roleKeywords = prefs.roleKeywords || [];
    for (var i = 0; i < roleKeywords.length; i++) {
      var kw = (roleKeywords[i] || "").trim().toLowerCase();
      if (!kw) continue;
      if (title.indexOf(kw) !== -1) { score += 25; break; }
    }
    for (var j = 0; j < roleKeywords.length; j++) {
      var kw2 = (roleKeywords[j] || "").trim().toLowerCase();
      if (!kw2) continue;
      if (desc.indexOf(kw2) !== -1) { score += 15; break; }
    }
    var locs = prefs.preferredLocations || [];
    if (locs.length && job.location && locs.indexOf(job.location) !== -1) score += 15;
    var modes = prefs.preferredMode || [];
    if (modes.length && job.mode && modes.indexOf(job.mode) !== -1) score += 10;
    if (prefs.experienceLevel && job.experience === prefs.experienceLevel) score += 10;
    var userSkills = prefs.skills || [];
    var jobSkills = job.skills || [];
    var skillMatch = false;
    for (var s = 0; s < userSkills.length && !skillMatch; s++) {
      var us = (userSkills[s] || "").trim().toLowerCase();
      if (!us) continue;
      for (var js = 0; js < jobSkills.length; js++) {
        if ((jobSkills[js] || "").toLowerCase().indexOf(us) !== -1 || us.indexOf((jobSkills[js] || "").toLowerCase()) !== -1) {
          skillMatch = true;
          break;
        }
      }
    }
    if (skillMatch) score += 15;
    if (job.postedDaysAgo != null && job.postedDaysAgo <= 2) score += 5;
    if (job.source === "LinkedIn") score += 5;
    return Math.min(100, score);
  }

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

  function filterAndSortJobs(jobs, filters, prefs) {
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
    prefs = prefs || getPreferences();
    list.forEach(function (j) {
      j._matchScore = computeMatchScore(j, prefs);
    });
    if (filters.onlyAboveThreshold && prefs) {
      var minScore = prefs.minMatchScore != null ? prefs.minMatchScore : 40;
      list = list.filter(function (j) { return j._matchScore >= minScore; });
    }
    var sort = filters.sort || "latest";
    list.sort(function (a, b) {
      if (sort === "match") return (b._matchScore || 0) - (a._matchScore || 0);
      if (sort === "salary") {
        var sa = extractSalaryNumber(a.salaryRange);
        var sb = extractSalaryNumber(b.salaryRange);
        return sb - sa;
      }
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
    var thresholdEl = document.getElementById("filter-only-above-threshold");
    return {
      keyword: keywordEl ? keywordEl.value : "",
      location: locationEl ? locationEl.value : "",
      mode: modeEl ? modeEl.value : "",
      experience: experienceEl ? experienceEl.value : "",
      source: sourceEl ? sourceEl.value : "",
      sort: sortEl ? sortEl.value : "latest",
      onlyAboveThreshold: thresholdEl ? thresholdEl.checked : false
    };
  }

  function extractSalaryNumber(salaryRange) {
    if (!salaryRange || typeof salaryRange !== "string") return 0;
    var s = salaryRange.trim();
    var match = s.match(/(\d+)\s*[–\-]\s*(\d+)/);
    if (match) {
      var a = parseInt(match[1], 10);
      var b = parseInt(match[2], 10);
      if (s.indexOf("LPA") !== -1) return (a + b) / 2;
      if (s.indexOf("k") !== -1 || s.indexOf("₹") !== -1) return (a + b) / 2;
      return (a + b) / 2;
    }
    var single = s.match(/(\d+)/);
    return single ? parseInt(single[1], 10) : 0;
  }

  function matchScoreBadgeClass(score) {
    if (score >= 80) return "badge badge--match-high";
    if (score >= 60) return "badge badge--match-mid";
    if (score >= 40) return "badge badge--match-neutral";
    return "badge badge--match-low";
  }

  function renderJobCard(job, options) {
    options = options || {};
    var savedIds = getSavedIds();
    var isSaved = savedIds.indexOf(job.id) !== -1;
    var saveLabel = isSaved ? "Saved" : "Save";
    var saveDisabled = isSaved ? " disabled" : "";
    var meta = [job.location, job.mode, job.experience].filter(Boolean).join(" · ") || "—";
    var score = job._matchScore != null ? job._matchScore : 0;
    var scoreBadge = options.hideMatchScore ? "" : ('<span class="' + matchScoreBadgeClass(score) + '">' + score + "% match</span>");
    return (
      '<div class="job-card" data-job-id="' + escapeHtml(job.id) + '">' +
      '<p class="job-card__title">' + escapeHtml(job.title) + "</p>" +
      '<p class="job-card__company">' + escapeHtml(job.company) + "</p>" +
      '<p class="job-card__meta">' + escapeHtml(meta) + "</p>" +
      '<p class="job-card__salary">' + escapeHtml(job.salaryRange || "—") + "</p>" +
      '<div class="job-card__footer">' +
      scoreBadge +
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
    var banner = document.getElementById("preferences-banner");
    if (!container) return;
    var prefs = getPreferences();
    if (banner) {
      banner.style.display = prefs ? "none" : "block";
    }
    var jobs = getJobs();
    var filters = getFilters();
    var list = filterAndSortJobs(jobs, filters, prefs);
    if (list.length === 0) {
      container.classList.remove("job-cards-grid");
      container.innerHTML = '<div class="empty-state empty-state--premium">' +
        '<p class="empty-state__title">No roles match your criteria.</p>' +
        '<p class="empty-state__body">Adjust filters or lower your threshold in Settings to see more jobs.</p>' +
        "</div>";
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
    var thresholdEl = document.getElementById("filter-only-above-threshold");
    if (thresholdEl) thresholdEl.addEventListener("change", onFilterChange);

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
      savedJobs.map(function (j) { return renderJobCard(j, { savedPage: true, hideMatchScore: true }); }).join("") +
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

  function parsePreferencesForm() {
    var roleEl = document.getElementById("pref-roleKeywords");
    var locEl = document.getElementById("pref-preferredLocations");
    var modeChecks = document.querySelectorAll('input[name="pref-preferredMode"]:checked');
    var expEl = document.getElementById("pref-experienceLevel");
    var skillsEl = document.getElementById("pref-skills");
    var minEl = document.getElementById("pref-minMatchScore");
    var roleStr = roleEl ? roleEl.value.trim() : "";
    var roleKeywords = roleStr ? roleStr.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
    var preferredLocations = [];
    if (locEl && locEl.options) {
      for (var i = 0; i < locEl.options.length; i++) {
        if (locEl.options[i].selected) preferredLocations.push(locEl.options[i].value);
      }
    }
    var preferredMode = [];
    for (var m = 0; m < modeChecks.length; m++) preferredMode.push(modeChecks[m].value);
    var skillsStr = skillsEl ? skillsEl.value.trim() : "";
    var skills = skillsStr ? skillsStr.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
    var minMatchScore = 40;
    if (minEl) {
      var v = parseInt(minEl.value, 10);
      if (!isNaN(v)) minMatchScore = Math.max(0, Math.min(100, v));
    }
    return {
      roleKeywords: roleKeywords,
      preferredLocations: preferredLocations,
      preferredMode: preferredMode,
      experienceLevel: expEl ? expEl.value : "",
      skills: skills,
      minMatchScore: minMatchScore
    };
  }

  function initSettings() {
    var locSelect = document.getElementById("pref-preferredLocations");
    if (locSelect) {
      var locs = getUniqueLocations();
      locs.forEach(function (loc) {
        var opt = document.createElement("option");
        opt.value = loc;
        opt.textContent = loc;
        locSelect.appendChild(opt);
      });
    }
    var prefs = getPreferences();
    if (prefs) {
      var roleEl = document.getElementById("pref-roleKeywords");
      if (roleEl) roleEl.value = (prefs.roleKeywords || []).join(", ");
      var locEl = document.getElementById("pref-preferredLocations");
      if (locEl) {
        for (var i = 0; i < locEl.options.length; i++) {
          locEl.options[i].selected = (prefs.preferredLocations || []).indexOf(locEl.options[i].value) !== -1;
        }
      }
      var modeNames = prefs.preferredMode || [];
      var modeChecks = document.querySelectorAll('input[name="pref-preferredMode"]');
      for (var j = 0; j < modeChecks.length; j++) {
        modeChecks[j].checked = modeNames.indexOf(modeChecks[j].value) !== -1;
      }
      var expEl = document.getElementById("pref-experienceLevel");
      if (expEl) expEl.value = prefs.experienceLevel || "";
      var skillsEl = document.getElementById("pref-skills");
      if (skillsEl) skillsEl.value = (prefs.skills || []).join(", ");
      var minEl = document.getElementById("pref-minMatchScore");
      var minValEl = document.getElementById("pref-minMatchScore-value");
      if (minEl) {
        minEl.value = prefs.minMatchScore != null ? prefs.minMatchScore : 40;
        if (minValEl) minValEl.textContent = minEl.value;
      }
    } else {
      var minValEl = document.getElementById("pref-minMatchScore-value");
      if (minValEl) minValEl.textContent = "40";
    }
    var minSlider = document.getElementById("pref-minMatchScore");
    var minValDisplay = document.getElementById("pref-minMatchScore-value");
    if (minSlider && minValDisplay) {
      minSlider.addEventListener("input", function () {
        minValDisplay.textContent = minSlider.value;
      });
    }
    var saveBtn = document.getElementById("pref-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var prefsToSave = parsePreferencesForm();
        setPreferences(prefsToSave);
        saveBtn.textContent = "Saved";
        setTimeout(function () { saveBtn.textContent = "Save preferences"; }, 1500);
      });
    }
  }

  function buildDigestPlainText(data) {
    if (!data || !data.jobs || !data.jobs.length) return "";
    var lines = ["Top 10 Jobs For You — 9AM Digest", data.dateLabel || data.date, ""];
    data.jobs.forEach(function (j, idx) {
      lines.push((idx + 1) + ". " + (j.title || "") + " — " + (j.company || ""));
      lines.push("   " + (j.location || "") + " · " + (j.experience || "") + " · Match: " + (j.matchScore != null ? j.matchScore : 0) + "%");
      lines.push("");
    });
    lines.push("This digest was generated based on your preferences.");
    return lines.join("\n");
  }

  function renderDigestContent(digestData) {
    if (!digestData || !digestData.jobs || !digestData.jobs.length) return "";
    var dateLabel = digestData.dateLabel || digestData.date || "";
    var jobsHtml = digestData.jobs.map(function (j) {
      var meta = [j.location, j.experience].filter(Boolean).join(" · ") || "—";
      return (
        '<div class="digest-job">' +
        '<p class="digest-job__title">' + escapeHtml(j.title) + "</p>" +
        '<p class="digest-job__meta">' + escapeHtml(j.company) + " · " + escapeHtml(meta) + "</p>" +
        '<p class="digest-job__score">Match: ' + (j.matchScore != null ? j.matchScore : 0) + "%</p>" +
        (j.applyUrl ? '<a href="' + escapeHtml(j.applyUrl) + '" target="_blank" rel="noopener" class="btn btn--primary btn--small">Apply</a>' : "") +
        "</div>"
      );
    }).join("");
    return (
      '<div class="digest-card">' +
      '<div class="digest-card__header">' +
      '<h2 class="digest-card__title">Top 10 Jobs For You — 9AM Digest</h2>' +
      '<p class="digest-card__date">' + escapeHtml(dateLabel) + "</p>" +
      "</div>" +
      jobsHtml +
      '<div class="digest-card__footer">This digest was generated based on your preferences.</div>' +
      "</div>" +
      '<div class="digest-actions">' +
      '<button type="button" class="btn btn--secondary" id="digest-copy">Copy Digest to Clipboard</button>' +
      '<a href="mailto:?subject=My%209AM%20Job%20Digest" id="digest-mailto" class="btn btn--secondary">Create Email Draft</a>' +
      "</div>"
    );
  }

  function initDigest() {
    var root = document.getElementById("digest-root");
    if (!root) return;
    var prefs = getPreferences();
    if (!prefs) {
      root.innerHTML = '<div class="empty-state empty-state--premium digest-block">' +
        '<p class="empty-state__title">Set preferences to generate a personalized digest.</p>' +
        '<p class="empty-state__body">Go to Settings to add your role keywords, locations, and skills. Then return here to generate your daily digest.</p>' +
        "</div>";
      return;
    }
    var todayKey = getTodayKey();
    var existing = getDigest(todayKey);
    var digestData = null;

    function updateUI() {
      if (digestData && digestData.jobs && digestData.jobs.length > 0) {
        root.innerHTML = '<div class="digest-block">' +
          '<button type="button" class="btn btn--primary" id="digest-generate">Generate Today\'s 9AM Digest (Simulated)</button>' +
          '<div id="digest-content">' + renderDigestContent(digestData) + "</div>" +
          "</div>";
        var copyBtn = document.getElementById("digest-copy");
        var mailtoLink = document.getElementById("digest-mailto");
        if (copyBtn) {
          copyBtn.addEventListener("click", function () {
            var text = buildDigestPlainText(digestData);
            if (text && navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).then(function () { copyBtn.textContent = "Copied"; setTimeout(function () { copyBtn.textContent = "Copy Digest to Clipboard"; }, 2000); }).catch(function () {});
            }
          });
        }
        if (mailtoLink) {
          var body = buildDigestPlainText(digestData);
          mailtoLink.href = "mailto:?subject=" + encodeURIComponent("My 9AM Job Digest") + "&body=" + encodeURIComponent(body);
        }
        var genBtn = document.getElementById("digest-generate");
        if (genBtn) genBtn.addEventListener("click", onGenerate);
        return;
      }
      if (digestData && digestData.jobs && digestData.jobs.length === 0) {
        root.innerHTML = '<div class="digest-block">' +
          '<button type="button" class="btn btn--primary" id="digest-generate">Generate Today\'s 9AM Digest (Simulated)</button>' +
          '<div class="empty-state empty-state--premium" style="margin-top: var(--space-3);">' +
          '<p class="empty-state__title">No matching roles today.</p>' +
          '<p class="empty-state__body">Check again tomorrow.</p>' +
          "</div></div>";
      } else {
        root.innerHTML = '<div class="digest-block">' +
          '<button type="button" class="btn btn--primary" id="digest-generate">Generate Today\'s 9AM Digest (Simulated)</button>' +
          '<div id="digest-content"></div></div>';
      }
      var genBtn = document.getElementById("digest-generate");
      if (genBtn) genBtn.addEventListener("click", onGenerate);
    }

    function onGenerate() {
      existing = getDigest(todayKey);
      if (existing && existing.jobs && existing.jobs.length > 0) {
        digestData = existing;
        updateUI();
        return;
      }
      digestData = generateDigest();
      if (digestData && digestData.jobs && digestData.jobs.length === 0) {
        setDigest(todayKey, digestData);
      }
      updateUI();
    }

    if (existing && existing.jobs && existing.jobs.length > 0) {
      digestData = existing;
    }
    updateUI();
  }

  window.initDashboard = initDashboard;
  window.initSaved = initSaved;
  window.initSettings = initSettings;
  window.initDigest = initDigest;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindModalClose);
  } else {
    bindModalClose();
  }
})();
