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
    // A drawer in a work mode (e.g. Sell mode) goes back to its normal view first (Esc / outside click).
    if (el.beforeClose && el.beforeClose() === false) return;
    el.classList.remove("open"); syncOverlay();
    if (el.onCloseHook) el.onCloseHook();
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

  // ---------- Date + text helpers (human language) ----------
  App.startOfDay = function (d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  App.daysFromToday = function (iso) { return Math.round((App.startOfDay(iso) - App.startOfDay(new Date())) / 86400000); };
  App.fmtDay = function (iso) { return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); };
  App.fmtTime = function (iso) { return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); };
  App.fmtDate = function (iso) { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); };
  App.fmtWhen = function (iso) { return App.fmtDay(iso) + ", " + App.fmtTime(iso); };
  // Follow-ups store dueDate ("YYYY-MM-DD") + optional dueTime ("HH:MM"). Work tasks still use dueAt.
  App.dueIso = function (x) {
    if (!x) return null;
    if (x.dueDate) return new Date(x.dueDate + "T" + (x.dueTime || "00:00")).toISOString();
    return x.dueAt || null;
  };
  App.fmtDue = function (x) {
    if (x && x.dueDate) return App.fmtDay(App.dueIso(x)) + (x.dueTime ? ", " + App.fmtTime(App.dueIso(x)) : "");
    return App.fmtWhen(App.dueIso(x));
  };
  App.dueTimeText = function (x) { return x && x.dueDate && !x.dueTime ? "any time" : App.fmtTime(App.dueIso(x)); };
  // "today", "tomorrow", "Fri", "12 Nov"
  App.fmtShortWhen = function (iso) {
    var d = App.daysFromToday(iso);
    if (d === 0) return "today"; if (d === 1) return "tomorrow"; if (d === -1) return "yesterday";
    if (d > 1 && d < 7) return new Date(iso).toLocaleDateString("en-IN", { weekday: "short" });
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };
  App.fmtMoney = function (n) { return n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN"); };
  // Money with exactly 2 decimals, used for GST (decision #78): ₹1,196.10
  App.fmtMoney2 = function (n) { return n == null || isNaN(n) ? "—" : "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  App.firstName = function (u) { return u ? u.name.split(" ")[0] : "Someone"; };
  App.userName = function (id) { var u = App.byId(DUMMY.users, id); return u ? u.name : "Not set yet"; };
  App.me = function () { return App.demoUser() || DUMMY.users[0]; };
  App.addTimeline = function (personId, kind, text, extra) {
    DUMMY.timeline.push(Object.assign({ personId: personId, at: new Date().toISOString(), kind: kind, text: text, by: App.me().id }, extra || {}));
    var p = App.byId(DUMMY.people, personId); if (p) p.lastActivityAt = new Date().toISOString();
  };
  // Mobile digits without country code / leading 0 (decision #11).
  App.mobileDigits = function (s) {
    var d = String(s || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    return d;
  };
  // Client membership status: green > 15 days left, amber <= 15 ("Renewal due soon"), red expired (decision #27).
  App.membershipStatus = function (m) {
    if (!m) return null;
    var left = App.daysFromToday(m.end);
    if (left < 0) return { cls: "red", badge: "badge-danger", text: "Expired", left: left };
    if (left <= 15) return { cls: "amber", badge: "badge-warning", text: "Renewal due soon", left: left };
    return { cls: "green", badge: "badge-success", text: "Active", left: left };
  };

  // ---------- Shared business helpers (single source for list + shell badges) ----------
  App.demoUser = function () { return App.byId(DUMMY.users, DUMMY.roleDemoUser[App.state.role]); };

  // ---------- Masters: packages, tax, items (decisions #49–#56) ----------
  App.todayIso = function () { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  // Current price = latest priceHistory entry on or before today. Next = first future entry (if any).
  App.priceInfo = function (pk) {
    var t = App.todayIso(), h = (pk.priceHistory || []).slice().sort(function (a, b) { return a.from < b.from ? -1 : 1; });
    var cur = null, next = null;
    h.forEach(function (x) { if (x.from <= t) cur = x; else if (!next) next = x; });
    return { price: cur ? cur.price : (h[0] ? h[0].price : 0), next: next };
  };
  // Result of a package: Free trial (stays lead) / Paid trial / Paid. Derived, never typed.
  App.saleResult = function (pk) {
    var price = pk.priceHistory ? App.priceInfo(pk).price : pk.price;
    if (pk.category === "Add-on") return { saleType: "Paid", type: "Add-on", text: price ? "Add-on" : "Add-on · free" };
    if (pk.isTrial) return price ? { saleType: "Trial Paid", type: "Trial Paid", text: "Paid trial · becomes a Client" } : { saleType: "Trial", type: "Trial", text: "Free trial · stays a Lead" };
    if (!price) return { error: "A price of 0 is only allowed for a trial." };
    return { saleType: "Paid", type: pk.category, text: "Paid · becomes a Client" };
  };
  App.derivePackage = function (pk) {
    var r = App.saleResult(pk);
    pk.price = App.priceInfo(pk).price; pk.saleType = r.saleType || "Paid"; pk.type = r.type || pk.category;
    return pk;
  };
  (DUMMY.packages || []).forEach(App.derivePackage);
  App.tax = function (id) { return App.byId(DUMMY.taxCategories, id); };
  // Price is incl. GST: GST = price × rate / (100 + rate).
  App.gstSplit = function (price, taxId) {
    var t = App.tax(taxId), rate = t ? t.rate : 0, gst = Math.round(price * rate / (100 + rate) * 100) / 100;
    return { rate: rate, gst: gst, base: Math.round((price - gst) * 100) / 100 };
  };
  // ---------- Sales rules + payments (decisions #77–#84) ----------
  App.discountLimit = function (role) { var l = DUMMY.discountLimits[role || App.state.role]; return typeof l === "number" ? l : 0; };
  App.minFirstPayPct = function () { var v = DUMMY.salesRules && DUMMY.salesRules.minFirstPayPct; return typeof v === "number" ? v : 0; };
  App.payBalance = function (pay) { return pay ? Math.max(0, Math.round((pay.total - pay.paid) * 100) / 100) : 0; };
  App.activePayMethods = function () { return DUMMY.paymentMethods.filter(function (m) { return m.active; }); };
  App.payMethod = function (name) { return DUMMY.paymentMethods.filter(function (m) { return m.name === name; })[0] || null; };
  // Receipt no. per branch, e.g. S31-000124. take=true uses the number.
  App.nextReceiptNo = function (branchId, take) {
    var n = (DUMMY.receiptSeq[branchId] || 0) + 1; if (take) DUMMY.receiptSeq[branchId] = n;
    return (DUMMY.receiptPrefix[branchId] || "RC") + "-" + ("00000" + n).slice(-6);
  };
  // PT: per-session price = (price − discount) / sessions; unlocked = floor(paid towards PT / per-session price) (decision #83).
  App.ptUnlocked = function (price, discount, sessions, paid) {
    var per = (price - (discount || 0)) / sessions;
    return per > 0 ? Math.min(sessions, Math.floor(paid / per + 1e-9)) : sessions;
  };
  App.fobDeposit = function () { var k = DUMMY.items.filter(function (i) { return i.kind === "Key fob"; })[0]; return k ? k.sellingPrice : 0; };
  // PLACEHOLDER access until the permission matrix (decision #56).
  App.access = {
    salesRules: function () { return ["SuperAdmin", "CEO"].indexOf(App.state.role) > -1; },
    editMasters: function () { return ["SuperAdmin", "CEO"].indexOf(App.state.role) > -1; },
    viewMasters: function () { return ["SuperAdmin", "CEO", "Regional Manager", "Club Manager", "Sales Manager"].indexOf(App.state.role) > -1; },
    stock: function () { return ["SuperAdmin", "CEO", "Regional Manager", "Club Manager"].indexOf(App.state.role) > -1; },
    // Add FF ID / Assign fob / Issue item (decision #62): the client's sales rep, Sales Executives and
    // Sales Managers of that branch (front desk), and managers above. Not Trainer, not MXM.
    pendingActions: function (p) {
      var r = App.state.role, u = App.demoUser();
      if (["SuperAdmin", "CEO"].indexOf(r) > -1) return true;
      if (!u || ["Regional Manager", "Club Manager", "Sales Manager", "Sales Executive"].indexOf(r) < 0) return false;
      return (p.membership && p.membership.salesRepUserId === u.id) || u.branches.indexOf(p.branchId) > -1;
    },
    // Only managers assign leads (decision #63).
    assignLeads: function () { return ["SuperAdmin", "CEO", "Regional Manager", "Club Manager", "Sales Manager"].indexOf(App.state.role) > -1; },
    stockBranches: function () {
      var u = App.demoUser(); if (!App.access.stock() || !u) return [];
      return ["SuperAdmin", "CEO"].indexOf(App.state.role) > -1 ? DUMMY.branches.map(function (b) { return b.id; }) : u.branches.slice();
    }
  };
  // Clients (decision #91, placeholder Q8): same rule as Today's "Clients with pending items" (#61, #62) so numbers match.
  // SuperAdmin / CEO: all (top-bar branch). Managers: their branches. Sales Executive: their branch (or their own sale).
  // Trainer / MXM: none.
  App.visibleClients = function (branchId) {
    return DUMMY.people.filter(function (p) {
      return p.kind === "Client" && App.access.pendingActions(p) && (!branchId || branchId === "all" || p.branchId === branchId);
    });
  };
  App.clientNeedsAttention = function (p) { return !!(App.profilePending && App.profilePending(p).length); };
  App.nextFollowUp = function (personId) {
    var open = DUMMY.followUps.filter(function (f) { return f.personId === personId && f.status === "Open"; });
    open.sort(function (a, b) { return new Date(App.dueIso(a)) - new Date(App.dueIso(b)); });
    return open[0] || null;
  };
  // Placeholder visibility (decision #15) until the permission matrix arrives.
  App.canSee = function (p) {
    var role = App.state.role, u = App.demoUser();
    if (role === "Trainer" || role === "MXM") return false;
    if (role === "Sales Executive") return p.ownerUserId === u.id;
    if (role === "SuperAdmin" || role === "CEO") return true;
    return u.branches.indexOf(p.branchId) > -1;
  };
  App.visibleLeads = function (branchId) {
    return DUMMY.people.filter(function (p) {
      return p.kind === "Lead" && App.canSee(p) && (!branchId || branchId === "all" || p.branchId === branchId);
    });
  };
  // "Needs attention" = open lead with follow-up overdue or not set (decision #5).
  App.needsAttention = function (p) {
    if (p.stage === "Lost") return false;
    var f = App.nextFollowUp(p.id);
    return App.followUpStatus(f && App.dueIso(f)).cls === "red";
  };
  App.counts = function () {
    var leads = App.visibleLeads(App.state.branchId), ids = leads.map(function (p) { return p.id; });
    var today = new Date().toDateString(), me = App.demoUser();
    return {
      attention: leads.filter(App.needsAttention).length,
      dueToday: DUMMY.followUps.filter(function (f) {
        return f.status === "Open" && ids.indexOf(f.personId) > -1 && App.followUpStatus(App.dueIso(f)).cls === "amber";
      }).length,
      openTasks: DUMMY.workTasks.filter(function (t) { return t.status === "Open" && me && t.assignedUserId === me.id; }).length,
      unread: DUMMY.notifications.filter(function (n) { return n.unread; }).length
    };
  };

  // ---------- Date fields: always show "12 Nov 2026", never mm/dd/yyyy (decision #86) ----------
  // Every <input type="date"> is wrapped: the visible text is formatted; the real input (ISO value) sits on top,
  // transparent, so clicking / typing / the native picker still work. Applied automatically to new inputs.
  App.fmtIsoDate = function (v) { return v ? new Date(v + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""; };
  App.enhanceDate = function (inp) {
    if (inp._df || !inp.parentNode) return; inp._df = true;
    var w = document.createElement("span"); w.className = "date-field"; inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    var t = document.createElement("span"); t.className = "date-text"; t.setAttribute("aria-hidden", "true"); w.insertBefore(t, inp);
    if (App.icon) { var ic = document.createElement("span"); ic.className = "date-ico"; ic.setAttribute("aria-hidden", "true"); ic.innerHTML = App.icon("calendar", "ico-sm"); w.insertBefore(ic, inp); }
    function sync() { t.textContent = inp.value ? App.fmtIsoDate(inp.value) : (inp.getAttribute("placeholder") || "Pick a date"); t.classList.toggle("is-empty", !inp.value); }
    inp.addEventListener("input", sync); inp.addEventListener("change", sync);
    inp.addEventListener("click", function () { try { if (inp.showPicker) inp.showPicker(); } catch (e) {} });
    inp._syncDate = sync; sync();
  };
  function enhanceDates(root) { if (root.querySelectorAll) $all('input[type="date"]', root).forEach(App.enhanceDate); if (root.matches && root.matches('input[type="date"]')) App.enhanceDate(root); }
  document.addEventListener("DOMContentLoaded", function () {
    enhanceDates(document);
    new MutationObserver(function (list) { list.forEach(function (r) { r.addedNodes.forEach(function (n) { if (n.nodeType === 1) enhanceDates(n); }); }); })
      .observe(document.body, { childList: true, subtree: true });
  });

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
