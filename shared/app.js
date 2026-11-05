/* Shared mockup behaviour: drawer, modal, tabs, toasts, role + branch switcher.
   Plain vanilla JS. Use data-* attributes in HTML; no per-page wiring needed. */
(function () {
  var App = {};

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function overlay() {
    var o = $(".overlay");
    if (!o) { o = document.createElement("div"); o.className = "overlay"; document.body.appendChild(o); o.addEventListener("click", App.closeAll); }
    return o;
  }
  function syncOverlay() { overlay().classList.toggle("open", !!$(".drawer.open, .modal.open")); }

  // ---------- Drawer / modal ----------
  App.openDrawer = function (id) { var el = document.getElementById(id); if (el) { el.classList.add("open"); syncOverlay(); } };
  App.openModal  = function (id) { var el = document.getElementById(id); if (el) { el.classList.add("open"); syncOverlay(); } };
  App.close = function (el) { if (el) { el.classList.remove("open"); syncOverlay(); } };
  App.closeAll = function () {
    // close the top-most layer first: modal before drawer
    var m = $all(".modal.open"); if (m.length) { App.close(m[m.length - 1]); return; }
    $all(".drawer.open").forEach(function (d) { d.classList.remove("open"); }); syncOverlay();
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
    var box = $(".toasts"); if (!box) { box = document.createElement("div"); box.className = "toasts"; document.body.appendChild(box); }
    var t = document.createElement("div"); t.className = "toast " + (kind || ""); t.textContent = msg; box.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  };

  // ---------- Role + branch switcher ----------
  App.state = {
    role: sessionGet("role") || (window.DUMMY && DUMMY.currentRole) || "Sales Executive",
    branchId: sessionGet("branch") || (window.DUMMY && DUMMY.currentBranchId) || "all"
  };
  function sessionGet(k) { try { return sessionStorage.getItem("mock." + k); } catch (e) { return null; } }
  function sessionSet(k, v) { try { sessionStorage.setItem("mock." + k, v); } catch (e) {} }

  App.initSwitchers = function () {
    var D = window.DUMMY; if (!D) return;
    var rs = $("[data-role-switcher]");
    if (rs) {
      rs.innerHTML = D.roles.map(function (r) { return "<option>" + r + "</option>"; }).join("");
      rs.value = App.state.role;
      rs.addEventListener("change", function () { App.state.role = rs.value; sessionSet("role", rs.value); App.toast("Viewing as " + rs.value); emit(); });
    }
    var bs = $("[data-branch-switcher]");
    if (bs) {
      bs.innerHTML = '<option value="all">All branches</option>' +
        D.branches.map(function (b) { return '<option value="' + b.id + '">' + b.name + "</option>"; }).join("");
      bs.value = App.state.branchId;
      bs.addEventListener("change", function () { App.state.branchId = bs.value; sessionSet("branch", bs.value); emit(); });
    }
  };
  function emit() { document.dispatchEvent(new CustomEvent("mock:context", { detail: App.state })); }

  // ---------- Small helpers for rendering dummy data ----------
  App.empty = function (v, fallback) { return (v === null || v === undefined || v === "") ? (fallback || "—") : v; };
  App.byId = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  App.formatDate = function (iso) {
    if (!iso) return "Not set yet";
    var d = new Date(iso); if (isNaN(d)) return "Not set yet";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ", " +
      d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  };
  // Follow-up status: green scheduled, amber due today, red overdue / not set.
  App.followUpStatus = function (iso) {
    if (!iso) return { cls: "red", badge: "badge-danger", text: "No follow-up set" };
    var d = new Date(iso), now = new Date();
    if (d.toDateString() === now.toDateString()) return { cls: "amber", badge: "badge-warning", text: "Due today" };
    if (d < now) return { cls: "red", badge: "badge-danger", text: "Overdue" };
    return { cls: "green", badge: "badge-success", text: "Scheduled" };
  };

  App.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  App.isDebug = function () { return /[?&]debug\b/.test(location.search); };

  // ---------- App shell: <div class="app" data-shell="leads" data-root="../../"> ----------
  var NAV = [
    { key: "today", label: "Today", icon: "☀", path: "features/today/index.html" },
    { key: "leads", label: "Leads", icon: "◎", path: "features/leads/index.html" },
    { key: "clients", label: "Clients", icon: "★", path: null },
    { key: "followups", label: "Follow-ups", icon: "↻", path: "features/followups/index.html" },
    { key: "tasks", label: "Tasks", icon: "✓", path: "features/tasks/index.html" },
    { key: "settings", label: "Settings", icon: "⚙", path: "features/settings/index.html" }
  ];
  App.built = ["leads"]; // screens that exist; others show a toast instead of a broken link
  App.renderShell = function () {
    var app = $("[data-shell]"); if (!app) return;
    var active = app.dataset.shell, root = app.dataset.root || "";
    var top = document.createElement("header"); top.className = "topbar";
    top.innerHTML =
      '<div class="brand">Fitness Labs</div>' +
      '<input class="input search" type="search" placeholder="Search name, mobile, email, FF ID, key fob…" aria-label="Global search" data-global-search>' +
      '<button class="btn btn-primary" data-new-lead>+ Lead</button>' +
      '<div class="spacer"></div>' +
      '<label class="topbar-field"><span class="muted">Branch</span><select class="input" data-branch-switcher aria-label="Branch"></select></label>' +
      '<label class="topbar-field"><span class="muted">View as</span><select class="input" data-role-switcher aria-label="View as role"></select></label>' +
      '<button class="btn btn-ghost" title="Notifications" aria-label="Notifications" data-toast="No new notifications" data-toast-kind="">🔔</button>';
    var side = document.createElement("nav"); side.className = "sidebar";
    side.innerHTML = NAV.map(function (n) {
      var built = App.built.indexOf(n.key) > -1 && n.path;
      var href = built ? root + n.path : "#";
      var extra = built ? "" : ' data-toast="' + n.label + ' screen is not built yet" data-toast-kind=""';
      return '<a href="' + href + '" class="' + (n.key === active ? "active" : "") + '" title="' + n.label + '"' + extra + '>' +
        '<span class="icon">' + n.icon + '</span><span class="label">' + n.label + "</span></a>";
    }).join("");
    app.insertBefore(side, app.firstChild);
    app.insertBefore(top, app.firstChild);
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
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") App.closeAll(); });
  document.addEventListener("DOMContentLoaded", function () { App.renderShell(); App.initTabs(); App.initSwitchers(); });

  window.App = App;
})();
