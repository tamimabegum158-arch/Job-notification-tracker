/**
 * Job Notification Tracker — Built-in Test Checklist.
 * Stores state in localStorage as jobTrackerTestStatus.
 * Ship route (/jt/08-ship) is locked until all 10 items are checked.
 */

(function () {
  var KEY = "jobTrackerTestStatus";
  var TOTAL = 10;

  var ITEMS = [
    { id: "0", label: "Preferences persist after refresh", tooltip: "Save preferences on Settings, refresh page; values should still be there." },
    { id: "1", label: "Match score calculates correctly", tooltip: "Set preferences, check dashboard cards show match % and badge colors by score." },
    { id: "2", label: '"Show only matches" toggle works', tooltip: "On Dashboard, enable 'Show only jobs above my threshold'; list should filter by min score." },
    { id: "3", label: "Save job persists after refresh", tooltip: "Save a job from Dashboard, go to Saved, refresh; job should still appear." },
    { id: "4", label: "Apply opens in new tab", tooltip: "Click Apply on a job card or in modal; link should open in a new tab." },
    { id: "5", label: "Status update persists after refresh", tooltip: "Change a job status to Applied/Rejected, refresh; status should remain." },
    { id: "6", label: "Status filter works correctly", tooltip: "Set status filter (e.g. Applied); only jobs with that status should show." },
    { id: "7", label: "Digest generates top 10 by score", tooltip: "Generate digest; it should show up to 10 jobs ordered by match score." },
    { id: "8", label: "Digest persists for the day", tooltip: "Generate digest, leave and return to Digest; same digest should load (no regenerate)." },
    { id: "9", label: "No console errors on main pages", tooltip: "Open Dashboard, Saved, Settings, Digest; check DevTools console for errors." }
  ];

  function getStored() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function setStored(obj) {
    try {
      localStorage.setItem(KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  function getTestStatus(id) {
    var stored = getStored();
    return stored[id] === true;
  }

  function setTestStatus(id, checked) {
    var stored = getStored();
    stored[id] = !!checked;
    setStored(stored);
  }

  function passedCount() {
    var stored = getStored();
    var n = 0;
    for (var i = 0; i < TOTAL; i++) {
      if (stored[String(i)] === true) n++;
    }
    return n;
  }

  function clearTestStatus() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function updateSummary() {
    var summaryEl = document.getElementById("test-summary");
    var warningEl = document.getElementById("test-warning");
    if (!summaryEl) return;
    var passed = passedCount();
    summaryEl.textContent = "Tests Passed: " + passed + " / " + TOTAL;
    if (warningEl) {
      warningEl.style.display = passed < TOTAL ? "block" : "none";
    }
  }

  function renderChecklistItems() {
    var list = document.getElementById("test-checklist-list");
    if (!list) return;
    list.innerHTML = "";
    ITEMS.forEach(function (item) {
      var checked = getTestStatus(item.id);
      var li = document.createElement("li");
      li.className = "test-checklist-item";
      var label = document.createElement("label");
      label.className = "test-checklist-item__label";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = "test-cb-" + item.id;
      cb.setAttribute("data-test-id", item.id);
      cb.checked = checked;
      cb.addEventListener("change", function () {
        setTestStatus(item.id, cb.checked);
        updateSummary();
      });
      var span = document.createElement("span");
      span.className = "test-checklist-item__text";
      span.textContent = item.label;
      label.appendChild(cb);
      label.appendChild(span);
      if (item.tooltip) {
        var tip = document.createElement("span");
        tip.className = "test-checklist-item__tooltip";
        tip.setAttribute("title", item.tooltip);
        tip.setAttribute("aria-label", "How to test: " + item.tooltip);
        tip.textContent = " (?)";
        label.appendChild(tip);
      }
      li.appendChild(label);
      list.appendChild(li);
    });
  }

  function initTestChecklist() {
    renderChecklistItems();
    updateSummary();
    var resetBtn = document.getElementById("test-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        clearTestStatus();
        renderChecklistItems();
        updateSummary();
      });
    }
  }

  function initShip() {
    var passed = passedCount();
    var lockedEl = document.getElementById("ship-locked");
    var unlockedEl = document.getElementById("ship-unlocked");
    if (lockedEl) lockedEl.style.display = passed >= TOTAL ? "none" : "block";
    if (unlockedEl) unlockedEl.style.display = passed >= TOTAL ? "block" : "none";
  }

  window.getTestStatus = getTestStatus;
  window.setTestStatus = setTestStatus;
  window.getTestPassedCount = passedCount;
  window.clearTestStatus = clearTestStatus;
  window.TEST_CHECKLIST_TOTAL = TOTAL;
  window.initTestChecklist = initTestChecklist;
  window.initShip = initShip;
})();
