/* Shared mockup behaviour: drawer, modal, tabs, toasts, role + branch state,
   and data helpers used by every page AND the shell (so numbers always match).
   The shell itself (sidebar, top bar, dropdowns, palette) lives in shell.js. */
(function () {
  var App = {};

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  App.$ = $; App.$all = $all;

  function overlay() {
    var o = $(".overlay");
    if (!o) { o = document.createElement("div"); o.className = "overlay"; document.body.appendChild(o); o.addEventListener("click", App.closeAll); }
    return o;
  }
  function syncOverlay() { overlay().classList.toggle("open", !!$(".drawer.open, .modal.open")); }

  // ---------- Drawer / modal ----------
  var returnFocus = [];
  function open(id) {
    var el = document.getElementById(id); if (!el) return;
    returnFocus.push(document.activeElement);
    el.classList.add("open"); syncOverlay();
    var f = el.querySelector("input, select, textarea, button:not([data-close])"); if (f) setTimeout(function () { f.focus(); }, 50);
  }
  App.openDrawer = open;
  App.openModal = open;
  App.close = function (el) {
    if (!el || !el.classList.contains("open")) return;
    el.classList.remove("open"); syncOverlay();
    var r = returnFocus.pop(); if (r && r.focus && document.contains(r)) r.focus();
  };
  App.closeAll = function () {
    // close the top-most layer first: modal before drawer
    var m = $all(".modal.open"); if (m.length) { App.close(m[m.length - 1]); return; }
    $all(".drawer.open").forEach(function (d) { App.close(d); });
  };

  // ---------- Tabs: <div data-tabs> .tab[data-tab=x] + .tab-panel[data-panel=x] ----------
  App.initTabs = function (root) {
    $all("[data-tabs]", root).forEach(function (group) {
      $all(".tab", group).forEach(function (tab) {
        tab.addEventListener("click", function () {
          $all(".tab", group).forEach(function (t) { t.classList.toggle("active", t === tab); });
          $all(".tab-panel", group).forEach(function (p) { p.classList.toggle("active", p.dataset.panel === tab.dataset.tab); });
        });
      });
    });
  };

  // ---------- Toasts ----------
  App.toast = function (msg, kind) {
    var box = $(".toasts"); if (!box) { box = document.createElement("div"); box.className = "toasts"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    var t = document.createElement("div"); t.className = "toast " + (kind || ""); t.textContent = msg; box.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  };

  // ---------- Role + branch state (remembered for the browser session) ----------
  function sessionGet(k) { try { return sessionStorage.getItem("mock." + k); } catch (e) { return null; } }
  function sessionSet(k, v) { try { sessionStorage.setItem("mock." + k, v); } catch (e) {} }
  App.sessionGet = sessionGet; App.sessionSet = sessionSet;
  App.state = {
    role: sessionGet("role") || (window.DUMMY && DUMMY.currentRole) || "Sales Executive",
    branchId: sessionGet("branch") || (window.DUMMY && DUMMY.currentBranchId) || "all"
  };
  function emit() { document.dispatchEvent(new CustomEvent("mock:context", { detail: App.state })); }
  App.setRole = function (role) { App.state.role = role; sessionSet("role", role); emit(); App.toast("Viewing as " + role, ""); };
  App.setBranch = function (id) {
    App.state.branchId = id; sessionSet("branch", id); emit();
    App.toast("Branch: " + App.branchName(id), "");
  };
  // Pages call this after changing dummy data so the shell badges update.
  App.dataChanged = function () { document.dispatchEvent(new CustomEvent("mock:data")); };

  // ---------- Small helpers for rendering dummy data ----------
  App.empty = function (v, fallback) { return (v === null || v === undefined || v === "") ? (fallback || "—") : v; };
  App.byId = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  App.branchName = function (id) {
    if (!id || id === "all") return "All branches";
    var b = App.byId(DUMMY.branches, id); return b ? b.name : "—";
  };
  App.initials = function (name) { return String(name || "").split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase(); };
  App.formatDate = function (iso) {
    if (!iso) return "Not set yet";
    var d = new Date(iso); if (isNaN(d)) return "Not set yet";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ", " +
      d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  };
  // Follow-up status (decision #24) — THE ONLY place this rule lives; list badge,
  // NEXT STEP box, sidebar badges and "Needs attention" all call it.
  // Compared by calendar DATE, never by time:
  //   due date before today -> red "Overdue"
  //   due today (even if the time has passed) -> amber "Due today"
  //   due after today -> green "Scheduled";  no follow-up -> red "No follow-up set"
  App.followUpStatus = function (iso) {
    if (!iso) return { cls: "red", badge: "badge-danger", text: "No follow-up set" };
    var due = new Date(iso); due.setHours(0, 0, 0, 0);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    if (due < today) return { cls: "red", badge: "badge-danger", text: "Overdue" };
    if (due.getTime() === today.getTime()) return { cls: "amber", badge: "badge-warning", text: "Due today" };
    return { cls: "green", badge: "badge-success", text: "Scheduled" };
  };
  App.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  App.isDebug = function () { return /[?&]debug\b/.test(location.search); };

  // ---------- Shared business helpers (single source for list + shell badges) ----------
  App.demoUser = function () { return App.byId(DUMMY.users, DUMMY.roleDemoUser[App.state.role]); };
  App.nextFollowUp = function (personId) {
    var open = DUMMY.followUps.filter(function (f) { return f.personId === personId && f.status === "Open"; });
    open.sort(function (a, b) { return new Date(a.dueAt) - new Date(b.dueAt); });
    return open[0] || null;
  };
  // Placeholder visibility (decision #15) until the permission matrix arrives.
  App.canSee = function (p) {
    var role = App.state.role, u = App.demoUser();
    if (role === "Trainer" || role === "MXM") return false;
    if (role === "Sales Executive") return p.ownerId === u.id;
    if (role === "SuperAdmin" || role === "CEO") return true;
    return u.branches.indexOf(p.branchId) > -1;
  };
  App.visibleLeads = function (branchId) {
    return DUMMY.people.filter(function (p) {
      return p.type === "Lead" && App.canSee(p) && (!branchId || branchId === "all" || p.branchId === branchId);
    });
  };
  // "Needs attention" = open lead with follow-up overdue or not set (decision #5).
  App.needsAttention = function (p) {
    if (p.stage === "Lost") return false;
    var f = App.nextFollowUp(p.id);
    return App.followUpStatus(f && f.dueAt).cls === "red";
  };
  App.counts = function () {
    var leads = App.visibleLeads(App.state.branchId), ids = leads.map(function (p) { return p.id; });
    var today = new Date().toDateString(), me = App.demoUser();
    return {
      attention: leads.filter(App.needsAttention).length,
      dueToday: DUMMY.followUps.filter(function (f) {
        return f.status === "Open" && ids.indexOf(f.personId) > -1 && App.followUpStatus(f.dueAt).cls === "amber";
      }).length,
      openTasks: DUMMY.tasks.filter(function (t) { return t.status === "Open" && me && t.assignedTo === me.id; }).length,
      unread: DUMMY.notifications.filter(function (n) { return n.unread; }).length
    };
  };

  // ---------- Global wiring ----------
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open-drawer],[data-open-modal],[data-close],[data-toast]");
    if (!t) return;
    if (t.dataset.openDrawer) App.openDrawer(t.dataset.openDrawer);
    if (t.dataset.openModal) App.openModal(t.dataset.openModal);
    if (t.hasAttribute("data-close")) App.close(t.closest(".modal, .drawer"));
    if (t.dataset.toast) { e.preventDefault(); App.toast(t.dataset.toast, t.dataset.toastKind == null ? "success" : t.dataset.toastKind); }
  });
  // Esc closes the top layer: shell layers (palette, dropdown, overlay sidebar) first, then modal, then drawer.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (App.closeShellLayer && App.closeShellLayer()) return;
    App.closeAll();
  });
  document.addEventListener("DOMContentLoaded", function () { App.initTabs(); });

  window.App = App;
})();
