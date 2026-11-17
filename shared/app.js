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
  // Each price entry: { price, from, referenceMembershipPrice? }. Premium PT carries the reference price per entry (#92, #50 rule).
  App.priceInfo = function (pk) {
    var t = App.todayIso(), h = (pk.priceHistory || []).slice().sort(function (a, b) { return a.from < b.from ? -1 : 1; });
    var cur = null, next = null;
    h.forEach(function (x) { if (x.from <= t) cur = x; else if (!next) next = x; });
    var e = cur || h[0] || null;
    return { price: e ? e.price : 0, refPrice: e && e.referenceMembershipPrice != null ? e.referenceMembershipPrice : null, next: next };
  };
  // Result of a package (decisions #92, #93): Free trial / Paid trial stay a Lead; Membership, PT, Premium PT = Paid, becomes a Client.
  App.saleResult = function (pk) {
    var price = pk.priceHistory ? App.priceInfo(pk).price : pk.price;
    if (pk.category === "Add-on") return { saleType: "Paid", type: "Add-on", text: price ? "Add-on" : "Add-on · free" };
    if (pk.isTrial && pk.category !== "Premium PT") return price ? { saleType: "Trial Paid", type: "Trial Paid", text: "Paid trial · stays a Lead · paid in full" } : { saleType: "Trial", type: "Trial", text: "Free trial · stays a Lead" };
    if (!price) return { error: "A price of 0 is only allowed for a trial." };
    if (pk.category === "Premium PT") return { saleType: "Paid", type: "Premium PT", text: "Paid · becomes a Client (membership + PT, 2 lines at sale)" };
    return { saleType: "Paid", type: pk.category, text: "Paid · becomes a Client" };
  };
  App.derivePackage = function (pk) {
    var r = App.saleResult(pk), info = App.priceInfo(pk);
    pk.price = info.price; pk.referenceMembershipPrice = pk.category === "Premium PT" ? info.refPrice : null;
    pk.saleType = r.saleType || "Paid"; pk.type = r.type || pk.category;
    return pk;
  };
  // ---------- Trials (decision #94): p.trials[] = { id, type: Membership | PT, kind: free | paid, packageId, package, from, to, price, paid,
  // receiptNo, branchId, bookedByUserId, bookedAt, comment, approverUserId, approval: Pending | Approved | Rejected | "No approver available",
  // approvalRemark, approvedAt, endedFollowUpId, adjustedAt }. Limits are counted SEPARATELY per type, by mobile across all branches. ----------
  var Trial = {};
  Trial.label = function (type) { return type === "PT" ? "PT" : "membership"; };
  Trial.typeOf = function (pk) { return pk.category === "PT" ? "PT" : "Membership"; };
  Trial.list = function (p) { return (p && p.trials) || []; };
  Trial.isRunning = function (t) { return App.daysFromToday(t.from) <= 0 && App.daysFromToday(t.to) >= 0 && !t.adjustedAt; };
  Trial.isEnded = function (t) { return !!t.adjustedAt || App.daysFromToday(t.to) < 0; };
  Trial.running = function (p, type) { return Trial.list(p).filter(function (t) { return Trial.isRunning(t) && (!type || t.type === type); }); };
  Trial.anyRunning = function (p) { return Trial.running(p).length > 0; };
  Trial.lastEnded = function (p, type) {
    var l = Trial.list(p).filter(function (t) { return Trial.isEnded(t) && (!type || t.type === type); });
    l.sort(function (a, b) { return new Date(b.to) - new Date(a.to); }); return l[0] || null;
  };
  // Same person = same mobile (#11), across every record and branch.
  Trial.samePerson = function (p) { var d = App.mobileDigits(p.cc + p.mobile); return DUMMY.people.filter(function (o) { return App.mobileDigits(o.cc + o.mobile) === d; }); };
  Trial.freeUsed = function (p, type, branchId) {
    var n = 0; Trial.samePerson(p).forEach(function (o) { Trial.list(o).forEach(function (t) { if (t.kind === "free" && t.type === type && (!branchId || t.branchId === branchId)) n++; }); });
    return n;
  };
  Trial.countOfType = function (p, type) { var n = 0; Trial.samePerson(p).forEach(function (o) { Trial.list(o).forEach(function (t) { if (t.type === type) n++; }); }); return n; };
  // One running trial per type; free limits per type (settings); paid unlimited.
  Trial.cardState = function (p, pk) {
    var type = Trial.typeOf(pk), price = pk.price, perPerson = App.setting("freeTrialsPerPerson"), perBranch = App.setting("freeTrialsPerBranch");
    if (Trial.running(p, type).length) return { disabled: true, why: "A " + App.Trial.label(type) + " trial is already running" };
    if (price > 0) return { disabled: false, count: Trial.countOfType(p, type) };
    var used = Trial.freeUsed(p, type), atBranch = Trial.freeUsed(p, type, p.branchId);
    if (used >= perPerson) return { disabled: true, why: used + " of " + perPerson + " free " + App.Trial.label(type) + " trials used" };
    if (atBranch >= perBranch) return { disabled: true, why: atBranch + " free " + App.Trial.label(type) + " trial" + (atBranch === 1 ? "" : "s") + " already at " + App.branchName(p.branchId) };
    return { disabled: false, used: used, perPerson: perPerson, count: Trial.countOfType(p, type) };
  };
  // Who may book: trials.book scope + the person's state (#94). Returns { show, disabled, why }.
  Trial.canBook = function (p) {
    if (!p || !App.scopeAllows("trials.book", p)) return { show: false };
    if (p.kind === "Client") { var ms = App.membershipStatus(p.membership); return ms && ms.cls !== "red" ? { show: true, disabled: false } : { show: false }; }
    if (p.stage === "Lost") return { show: true, disabled: true, why: "Re-open the lead first" };
    if (p.stage === "Converted") return { show: false };
    return { show: true, disabled: false };
  };
  // Trial packages for this person: lead = Membership trials + PT trials with "Requires an active membership" OFF; active client = PT trials (ON or OFF).
  Trial.packagesFor = function (p) {
    return DUMMY.packages.filter(function (x) {
      if (!x.active || !x.isTrial || x.category === "Add-on" || x.category === "Premium PT" || x.branchIds.indexOf(p.branchId) < 0) return false;
      if (p.kind === "Client") return x.category === "PT";
      return x.audience !== "Renewal" && (x.category === "Membership" || (x.category === "PT" && !x.requiresMembership));
    });
  };
  // Approvers (L1b): SM / CM / RM of the person's branch whose role has trials.approve; never the CEO.
  Trial.approvers = function (p) {
    return DUMMY.users.filter(function (u) {
      var r = App.Perm.roleByName(u.role);
      return r && ["SALES_MANAGER", "CLUB_MANAGER", "REGIONAL_MANAGER"].indexOf(r.key) > -1 && u.branchIds.indexOf(p.branchId) > -1 && App.Perm.get(r.short, "trials.approve") !== "None";
    });
  };
  Trial.byId = function (id) { for (var i = 0; i < DUMMY.people.length; i++) { var t = App.byId(Trial.list(DUMMY.people[i]), id); if (t) return { p: DUMMY.people[i], t: t }; } return null; };
  // Pending approvals for the View-as user: asked from me, or every pending one for the CEO (incl. "No approver available").
  Trial.pendingApprovals = function () {
    var me = App.demoUser(), ceo = App.state.role === "CEO", out = [];
    if (!me || App.can("trials.approve") === "None") return out;
    DUMMY.people.forEach(function (p) { Trial.list(p).forEach(function (t) {
      if (t.approval !== "Pending" && t.approval !== "No approver available") return;
      if (ceo || t.approverUserId === me.id) out.push({ p: p, t: t });
    }); });
    out.sort(function (a, b) { return new Date(b.t.bookedAt) - new Date(a.t.bookedAt); });
    return out;
  };
  // Human lines for badges / NEXT STEP: one per running trial, else the last ended one.
  Trial.lines = function (p) {
    var run = Trial.running(p);
    if (run.length) return run.map(function (t) {
      var left = App.daysFromToday(t.to);
      return { t: t, running: true, text: (t.kind === "free" ? "Free " : "Paid ") + App.Trial.label(t.type) + " trial · " + (left === 0 ? "ends today" : "ends in " + left + (left === 1 ? " day" : " days")) };
    });
    var last = Trial.lastEnded(p);
    return last ? [{ t: last, running: false, text: "Trial ended " + (-App.daysFromToday(last.to)) + (App.daysFromToday(last.to) === -1 ? " day" : " days") + " ago · " + last.package }] : [];
  };
  Trial.approvalBadge = function (t) {
    var a = t.approval;
    return a === "Approved" ? '<span class="badge badge-success">Approved</span>' : a === "Rejected" ? '<span class="badge badge-danger">Rejected</span>'
      : a === "No approver available" ? '<span class="badge badge-warning">No approver available</span>' : '<span class="badge badge-warning">Approval pending</span>';
  };
  // Trial ended (#94): the system creates "Trial ended · discuss plans" for the owner on the end date, once per trial,
  // unless an open follow-up already exists on / after that date. MOCKUP: done on page load (no server).
  Trial.ensureEndedFollowUps = function () {
    var made = 0;
    DUMMY.people.forEach(function (p) { Trial.list(p).forEach(function (t) {
      if (!Trial.isEnded(t) || t.endedFollowUpId || t.adjustedAt) return;
      var endDate = String(t.to).slice(0, 10), open = DUMMY.followUps.filter(function (f) { return f.personId === p.id && f.status === "Open" && f.dueDate >= endDate; })[0];
      if (open) { t.endedFollowUpId = open.id; return; }
      var f = { id: "f" + Date.now() + made, personId: p.id, type: "Call", dueDate: endDate, dueTime: null, ownerUserId: p.ownerUserId, status: "Open", outcome: null, note: "Trial ended · discuss plans", bySystem: true };
      DUMMY.followUps.push(f); t.endedFollowUpId = f.id; made++;
      DUMMY.timeline.push({ personId: p.id, at: t.to, kind: "milestone", text: (t.kind === "free" ? "Free " : "Paid ") + App.Trial.label(t.type) + " trial ended · " + t.package + " · follow-up set for " + App.firstName(App.byId(DUMMY.users, p.ownerUserId)), by: null });
    }); });
    return made;
  };
  App.Trial = Trial;
  // Paid MEMBERSHIP trial for the Convert adjust (#94): running, or ended within the buffer.
  App.paidTrialStatus = function (p, type) {
    var run = Trial.running(p, type || "Membership").filter(function (t) { return t.kind === "paid"; })[0];
    if (run) return { t: run, ended: false, left: App.daysFromToday(run.to), text: "Paid " + App.Trial.label(run.type) + " trial · " + (App.daysFromToday(run.to) === 0 ? "ends today" : "ends in " + App.daysFromToday(run.to) + " days") };
    var last = Trial.lastEnded(p, type || "Membership"); if (!last || last.kind !== "paid" || last.adjustedAt) return null;
    return { t: last, ended: true, left: App.daysFromToday(last.to), text: "Trial ended" };
  };
  document.addEventListener("DOMContentLoaded", function () { if (Trial.ensureEndedFollowUps()) document.dispatchEvent(new CustomEvent("mock:data")); });
  (DUMMY.packages || []).forEach(App.derivePackage);
  App.tax = function (id) { return App.byId(DUMMY.taxCategories, id); };
  // Price is incl. GST: GST = price × rate / (100 + rate).
  App.gstSplit = function (price, taxId) {
    var t = App.tax(taxId), rate = t ? t.rate : 0, gst = Math.round(price * rate / (100 + rate) * 100) / 100;
    return { rate: rate, gst: gst, base: Math.round((price - gst) * 100) / 100 };
  };
  // ---------- Sales rules + payments (decisions #77–#84) ----------
  // ONE discount source: the grid row sales.discountMax (decisions #77, #96). Every role has a number; never "no limit".
  App.discountLimit = function (role) {
    var r = App.Perm.roleByName(role || App.state.role), l = r ? App.Perm.get(r.short, "sales.discountMax") : 0;
    return typeof l === "number" ? l : 0;
  };
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
  // ---------- Roles & permissions (decisions #95, #96) ----------
  // Defaults come from DUMMY.permissionDefs / settingDefs; changes made on Settings → Roles & permissions are
  // kept in session storage (same pattern as Display prefs) so they survive reloads in this browser session.
  // App.can(key) -> the stored value for the "View as" role: "None" | "Own" | "Branch" | "All", true / false, or a number.
  // App.setting(key) -> the current settings value. Existing screens are NOT rewired yet (still App.access / role names).
  var Perm = {};
  function pdef(key) { return DUMMY.permissionDefs.filter(function (d) { return d.key === key; })[0] || null; }
  function sdef(key) { return DUMMY.settingDefs.filter(function (d) { return d.key === key; })[0] || null; }
  function jget(k, fb) { try { return JSON.parse(sessionGet(k) || "null") || fb; } catch (e) { return fb; } }
  function jset(k, v) { sessionSet(k, JSON.stringify(v)); }
  Perm.roleByName = function (name) { return DUMMY.roles.filter(function (r) { return r.name === name; })[0] || null; };
  Perm.roleByShort = function (s) { return DUMMY.roles.filter(function (r) { return r.short === s; })[0] || null; };
  Perm.roleByKey = function (k) { return DUMMY.roles.filter(function (r) { return r.key === k; })[0] || null; };
  // Default for a role (short) × permission def: CEO = everything (top tenant role, #102); others from defs; else None / false / 0.
  Perm.defaultOf = function (short, d) {
    if (short === "CEO") return d.type === "scope" ? "All" : d.type === "tick" ? true : (d.defaults.CEO != null ? d.defaults.CEO : 100);
    var v = d.defaults[short];
    if (v !== undefined) return v;
    return d.type === "scope" ? "None" : d.type === "tick" ? false : 0;
  };
  Perm.overrides = function () { return jget("perms", {}); };
  Perm.get = function (short, key) {
    var d = pdef(key); if (!d) return null;
    var o = Perm.overrides(); if (o[short] && o[short][key] !== undefined) return o[short][key];
    return Perm.defaultOf(short, d);
  };
  Perm.isDefault = function (short, key) { return Perm.get(short, key) === Perm.defaultOf(short, pdef(key)); };
  // Locked cells (#96 "locked" rules). Returns the reason text or "".
  Perm.lockReason = function (short, key) {
    var d = pdef(key); if (!d) return "";
    if (short === "CEO") return "CEO has every permission (top role in the tenant).";
    if (d.lock === "all") return "Only CEO can edit Roles & permissions.";
    return "";
  };
  // "Own" is the floor for roles that own leads: an owner can always see and log follow-ups on their own leads.
  Perm.minOwn = function (short, key) { var d = pdef(key); return !!(d && d.minOwn && d.minOwn.indexOf(short) > -1); };
  // changes: [{ short, key, value }]. Writes overrides + audit entries. Returns the entries written.
  Perm.save = function (changes, tab) {
    var o = Perm.overrides(), log = [];
    changes.forEach(function (c) {
      var d = pdef(c.key), old = Perm.get(c.short, c.key);
      if (!d || old === c.value) return;
      o[c.short] = o[c.short] || {}; o[c.short][c.key] = c.value;
      log.push({ tab: tab || "Permissions", what: Perm.roleByShort(c.short).name + " · " + d.label, from: Perm.text(old, d), to: Perm.text(c.value, d) });
    });
    jset("perms", o); Perm.audit(log); return log;
  };
  Perm.resetAll = function () {
    var o = Perm.overrides(), log = [];
    Object.keys(o).forEach(function (s) { Object.keys(o[s]).forEach(function (k) {
      var d = pdef(k); if (d && o[s][k] !== Perm.defaultOf(s, d)) log.push({ tab: "Permissions", what: Perm.roleByShort(s).name + " · " + d.label, from: Perm.text(o[s][k], d), to: Perm.text(Perm.defaultOf(s, d), d) + " (default)" });
    }); });
    jset("perms", {}); Perm.audit(log); return log;
  };
  Perm.text = function (v, d) { return d.type === "tick" ? (v ? "Yes" : "No") : d.type === "number" ? v + "%" : String(v); };
  // Settings values
  Perm.settings = function () { var s = {}; DUMMY.settingDefs.forEach(function (d) { s[d.key] = d.def; }); return Object.assign(s, jget("settings", {})); };
  Perm.saveSettings = function (values) {
    var cur = Perm.settings(), o = jget("settings", {}), log = [];
    Object.keys(values).forEach(function (k) {
      var d = sdef(k); if (!d || cur[k] === values[k]) return;
      o[k] = values[k]; log.push({ tab: "Settings values", what: d.label, from: String(cur[k]), to: String(values[k]) });
    });
    jset("settings", o); Perm.audit(log); return log;
  };
  Perm.resetSettings = function () {
    var cur = Perm.settings(), log = [];
    DUMMY.settingDefs.forEach(function (d) { if (cur[d.key] !== d.def) log.push({ tab: "Settings values", what: d.label, from: String(cur[d.key]), to: String(d.def) + " (default)" }); });
    jset("settings", {}); Perm.audit(log); return log;
  };
  // Roles (names) that may change a setting: the roles with its grid row, or "CEO" when the notes say so.
  Perm.settingEditors = function (d) {
    if (d.by === "CEO") return ["CEO"];
    return DUMMY.roles.filter(function (r) { var v = Perm.get(r.short, d.by); return v === true || (typeof v === "string" && v !== "None"); }).map(function (r) { return r.name; });
  };
  // Trainer types (session copy so edits survive reloads)
  Perm.trainerTypes = function () { return jget("trainerTypes", null) || DUMMY.trainerTypes.map(function (t) { return Object.assign({}, t); }); };
  Perm.saveTrainerTypes = function (list, entry) { jset("trainerTypes", list); if (entry) Perm.audit([Object.assign({ tab: "Trainer types" }, entry)]); };
  // Audit log: who (View-as demo user), when, tab, what, old -> new. Newest first. Session only (mockup).
  Perm.auditLog = function () { return jget("audit", []); };
  Perm.audit = function (entries) {
    if (!entries || !entries.length) return;
    var log = Perm.auditLog(), me = App.me();
    entries.forEach(function (e) { log.unshift(Object.assign({ at: new Date().toISOString(), byUserId: me.id, by: me.name }, e)); });
    jset("audit", log);
  };
  App.Perm = Perm;
  App.can = function (key) { var r = Perm.roleByName(App.state.role); return r ? Perm.get(r.short, key) : null; };
  App.setting = function (key) { return Perm.settings()[key]; };

  // ---------- Access = the Roles & permissions grid (decisions #96, #102; keys in docs/permissions.md) ----------
  // Scope meaning: None = nothing · Own = the person's owner is me (TODO c4: + leads where I have an open follow-up, #97)
  // · Branch = the person's branch is one of my branchIds · All = everyone in the tenant.
  App.scopeAllows = function (key, p) {
    var s = App.can(key), u = App.demoUser();
    if (s === true) return true;
    if (!s || s === false || s === "None" || !u) return false;
    if (s === "All") return true;
    if (s === "Branch") return !p || u.branchIds.indexOf(p.branchId) > -1;
    if (s === "Own") return !!p && !!p.ownerUserId && p.ownerUserId === u.id;
    return false;
  };
  // Branch ids a scope covers: All = every branch, Branch / Own = my branches, None = [].
  App.scopeBranches = function (key) {
    var s = App.can(key), u = App.demoUser();
    if (s === "All") return DUMMY.branches.map(function (b) { return b.id; });
    if ((s === "Branch" || s === "Own") && u) return u.branchIds.slice();
    return [];
  };
  App.access = {
    // Sales rules edit has no row of its own → settings.packages (accepted mapping). View-only masters = settings.viewMasters.
    salesRules: function () { return App.can("settings.packages") === true; },
    editMasters: function () { return App.can("settings.packages") === true; },
    viewMasters: function () { return App.can("settings.packages") === true || App.can("settings.viewMasters") !== "None"; },
    stock: function () { return App.can("settings.stock") !== "None"; },
    stockBranches: function () { return App.scopeBranches("settings.stock"); },
    // Pending items on a client (#62): Add FF ID / Assign fob / Issue item → clients.issueItems; Collect payment → clients.collectPayment.
    // kind: "pay" or an issue kind ("addFf" / "goFob" / "issue"); no kind = either.
    pendingActions: function (p, kind) {
      var issue = App.scopeAllows("clients.issueItems", p), pay = App.scopeAllows("clients.collectPayment", p);
      return kind === "pay" ? pay : kind ? issue : (issue || pay);
    },
    assignLeads: function () { return App.can("leads.assign") !== "None"; }
  };
  // Clients (decision #91): grid row clients.view. Today's "Clients with pending items" uses the same helper so numbers match.
  App.visibleClients = function (branchId) {
    return DUMMY.people.filter(function (p) {
      return p.kind === "Client" && App.scopeAllows("clients.view", p) && (!branchId || branchId === "all" || p.branchId === branchId);
    });
  };
  App.clientNeedsAttention = function (p) { return !!(App.profilePending && App.profilePending(p).length); };
  App.nextFollowUp = function (personId) {
    var open = DUMMY.followUps.filter(function (f) { return f.personId === personId && f.status === "Open"; });
    open.sort(function (a, b) { return new Date(App.dueIso(a)) - new Date(App.dueIso(b)); });
    return open[0] || null;
  };
  // Lead visibility from the grid: leads.view; a lost lead needs leads.viewLost; an unassigned lead needs leads.viewUnassigned.
  App.canSee = function (p) {
    if (p.stage === "Lost") return App.scopeAllows("leads.viewLost", p);
    if (!p.ownerUserId) return App.scopeAllows("leads.viewUnassigned", p);
    return App.scopeAllows("leads.view", p);
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
