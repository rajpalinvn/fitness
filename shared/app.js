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
    // PT trials (#94 changed by #112): CM / MXM assessments. No limit by default (Settings "PT trials per person", 0 = no limit), no approval.
    if (type === "PT") {
      var lim = Number(App.setting("ptTrialsPerPerson")) || 0, cnt = Trial.countOfType(p, "PT");
      if (lim && cnt >= lim) return { disabled: true, why: cnt + " of " + lim + " PT trials used" };
      return { disabled: false, count: cnt, pt: true, limit: lim };
    }
    if (price > 0) return { disabled: false, count: Trial.countOfType(p, type) };
    var used = Trial.freeUsed(p, type), atBranch = Trial.freeUsed(p, type, p.branchId);
    if (used >= perPerson) return { disabled: true, why: used + " of " + perPerson + " free " + App.Trial.label(type) + " trials used" };
    if (atBranch >= perBranch) return { disabled: true, why: atBranch + " free " + App.Trial.label(type) + " trial" + (atBranch === 1 ? "" : "s") + " already at " + App.branchName(p.branchId) };
    return { disabled: false, used: used, perPerson: perPerson, count: Trial.countOfType(p, type) };
  };
  // Who may book: trials.book scope + the person's state (#94). Returns { show, disabled, why }.
  // PT trials only by pt.quote users (#112); membership trials by trials.book.
  Trial.canBookPT = function (p) { return !!p && App.scopeAllows("pt.quote", p, { strictOwn: true }); };
  Trial.canBook = function (p) {
    if (!p || !(App.scopeAllows("trials.book", p) || Trial.canBookPT(p))) return { show: false };
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
  // #104: staff of the person's branch whose role has trials.approve at BRANCH scope. All-scope (e.g. CEO) is never listed (can approve any).
  Trial.approvers = function (p) {
    return DUMMY.users.filter(function (u) {
      var r = App.Perm.roleByName(u.role);
      return r && !u.platform && u.branchIds.indexOf(p.branchId) > -1 && App.Perm.get(r.short, "trials.approve") === "Branch";
    });
  };
  Trial.byId = function (id) { for (var i = 0; i < DUMMY.people.length; i++) { var t = App.byId(Trial.list(DUMMY.people[i]), id); if (t) return { p: DUMMY.people[i], t: t }; } return null; };
  // Pending approvals for the View-as user: asked from me, or every pending one for the CEO (incl. "No approver available").
  Trial.pendingApprovals = function () {
    var me = App.demoUser(), ceo = App.can("trials.approve") === "All", out = [];   // c9: All scope sees every pending one (no role name)
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
    if (a === "Not needed") return "";   // PT trial: the CM / MXM booker decides (#112)
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
  // Value = { pct, cap } (#103, Q22): the LOWER of (pct % of the line) and the ₹ cap applies; cap 0 = no ₹ cap; pct 0 = no discount.
  App.discountRule = function (role) {
    var r = App.Perm.roleByName(role || App.state.role), l = r ? App.Perm.get(r.short, "sales.discountMax") : null;
    return l && typeof l === "object" ? l : { pct: typeof l === "number" ? l : 0, cap: 0 };
  };
  App.discountLimit = function (role) { return App.discountRule(role).pct; };   // the % part (kept for older callers)
  // Highest ₹ discount on a line of this amount for the role.
  App.discountMaxAmount = function (base, role) {
    var r = App.discountRule(role), byPct = Math.floor(base * r.pct / 100);
    return r.cap > 0 ? Math.min(byPct, r.cap) : byPct;
  };
  App.discountRuleText = function (role) { var r = App.discountRule(role); return "Max " + r.pct + "%" + (r.cap ? " · " + App.fmtMoney(r.cap) : "") + " for your role"; };
  App.minFirstPayPct = function () { var v = DUMMY.salesRules && DUMMY.salesRules.minFirstPayPct; return typeof v === "number" ? v : 0; };
  App.payBalance = function (pay) { return pay ? Math.max(0, Math.round((pay.total - pay.paid) * 100) / 100) : 0; };
  App.activePayMethods = function () { return DUMMY.paymentMethods.filter(function (m) { return m.active; }); };
  // Duplicate payment reference (#116): same method + same reference anywhere in the company (cheque: same bank + number).
  // Not a block: a warning with where it was used; staff confirm with a reason; the row is flagged for Finance / CEO.
  App.payRefKey = function (ref) { return String(ref || "").replace(/\s+/g, "").toUpperCase(); };
  App.payRefDup = function (method, ref, bank) {
    var k = App.payRefKey(ref), bk = App.payRefKey(bank), hit = null; if (!k || method === "Cash") return null;
    DUMMY.people.forEach(function (p) { [p.membership, p.pt].forEach(function (line) {
      var pay = line && line.payment; if (!pay || hit) return;
      pay.receipts.forEach(function (rc) { rc.rows.forEach(function (r) {
        if (!hit && r.method === method && App.payRefKey(r.ref) === k && (method !== "Cheque" || App.payRefKey(r.bank) === bk)) hit = { no: rc.no, at: rc.at, personId: p.id, personName: p.name };
      }); });
    }); });
    return hit;
  };
  App.payDupText = function (h) { return "Used on " + App.fmtDay(h.at) + " in " + h.personName + "'s payment (" + h.no + ")"; };
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
    if (short === "CEO") return d.type === "scope" ? "All" : d.type === "tick" ? true : d.type === "pctcap" ? pc(d.defaults.CEO || { pct: 100, cap: 0 }) : (d.defaults.CEO != null ? d.defaults.CEO : 100);
    var v = d.defaults[short];
    if (v !== undefined) return d.type === "pctcap" ? pc(v) : v;
    return d.type === "scope" ? "None" : d.type === "tick" ? false : d.type === "pctcap" ? { pct: 0, cap: 0 } : 0;
  };
  // "% · max ₹" value (#103): { pct, cap }; an old plain number = that % with no cap.
  function pc(v) { return typeof v === "number" ? { pct: v, cap: 0 } : { pct: Number(v && v.pct) || 0, cap: Number(v && v.cap) || 0 }; }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  Perm.same = same;
  Perm.overrides = function () { return jget("perms", {}); };
  Perm.get = function (short, key) {
    var d = pdef(key); if (!d) return null;
    var o = Perm.overrides(); if (o[short] && o[short][key] !== undefined) return d.type === "pctcap" ? pc(o[short][key]) : o[short][key];
    return Perm.defaultOf(short, d);
  };
  Perm.isDefault = function (short, key) { return same(Perm.get(short, key), Perm.defaultOf(short, pdef(key))); };
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
      if (!d || same(old, c.value)) return;
      o[c.short] = o[c.short] || {}; o[c.short][c.key] = c.value;
      log.push({ tab: tab || "Permissions", what: Perm.roleByShort(c.short).name + " · " + d.label, from: Perm.text(old, d), to: Perm.text(c.value, d) });
    });
    jset("perms", o); Perm.audit(log); return log;
  };
  Perm.resetAll = function () {
    var o = Perm.overrides(), log = [];
    Object.keys(o).forEach(function (s) { Object.keys(o[s]).forEach(function (k) {
      var d = pdef(k); if (d && !same(o[s][k], Perm.defaultOf(s, d))) log.push({ tab: "Permissions", what: Perm.roleByShort(s).name + " · " + d.label, from: Perm.text(o[s][k], d), to: Perm.text(Perm.defaultOf(s, d), d) + " (default)" });
    }); });
    jset("perms", {}); Perm.audit(log); return log;
  };
  Perm.text = function (v, d) {
    if (d.type === "pctcap") { v = pc(v); return v.pct + "% · " + (v.cap ? "max " + App.fmtMoney(v.cap) : "no cap"); }
    return d.type === "tick" ? (v ? "Yes" : "No") : d.type === "number" ? v + "%" : String(v);
  };
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
  // Scope meaning: None = nothing · Own = I own the person OR I have an OPEN follow-up on it (#97, L9)
  // · Branch = the person's branch is one of my branchIds (+ the Own cases: a follow-up assignee from another branch)
  // · All = everyone in the tenant. opts.strictOwn: "Own" = only leads I own (used by leads.assignFollowUp, #97).
  App.fuAssignee = function (f) { return f ? (f.assignedToUserId || f.ownerUserId || null) : null; };
  App.openFollowUpFor = function (p, uid) {
    if (!p || !uid) return null;
    return DUMMY.followUps.filter(function (f) { return f.personId === p.id && f.status === "Open" && App.fuAssignee(f) === uid; })[0] || null;
  };
  // "Follow-up from <owner>" (#97, L11): I see this lead only because I have an open follow-up on it.
  App.isAssigneeOnly = function (p, uid) { uid = uid || (App.demoUser() || {}).id; return !!p && !!uid && p.ownerUserId !== uid && !!App.openFollowUpFor(p, uid); };
  App.scopeAllows = function (key, p, opts) {
    var s = App.can(key), u = App.demoUser();
    if (s === true) return true;
    if (!s || s === false || s === "None" || !u) return false;
    if (s === "All") return true;
    var own = !!p && !!p.ownerUserId && p.ownerUserId === u.id, assignee = !(opts && opts.strictOwn) && !!p && !!App.openFollowUpFor(p, u.id);
    if (s === "Branch") return !p || u.branchIds.indexOf(p.branchId) > -1 || assignee;
    if (s === "Own") return own || assignee;
    return false;
  };
  // Branch ids a scope covers: All = every branch, Branch / Own = my branches, None = [].
  App.scopeBranches = function (key) {
    var s = App.can(key), u = App.demoUser();
    if (s === "All") return DUMMY.branches.map(function (b) { return b.id; });
    if ((s === "Branch" || s === "Own") && u) return u.branchIds.slice();
    return [];
  };
  // Lead sources that apply to a branch (#115): all-branch sources + the ones assigned to this branch.
  App.sourcesFor = function (branchId) {
    var L = DUMMY.lists, m = L.leadSourceBranches || {};
    return L.sources.filter(function (s) { return !m[s] || !branchId || m[s].indexOf(branchId) > -1; });
  };
  App.access = {
    // Sales rules edit has no row of its own → settings.packages (accepted mapping). View-only = one View row per master (#114).
    salesRules: function () { return App.can("settings.packages") === true; },
    editMasters: function () { return App.can("settings.packages") === true; },
    // One View row per master (#114): view(key) where key = packages | items | tax | salesRules.
    viewMaster: function (k) { var r = { packages: "settings.viewPackages", items: "settings.viewItems", tax: "settings.viewTax", salesRules: "settings.viewSalesRules" }[k];
      var v = App.can(r); return App.can("settings.packages") === true || v === true || (typeof v === "string" && v !== "None"); },
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
  // Client status by the LAST package end (later of membership end and PT end; add-ons ignored, #103 Q25):
  // Active > 15 days left, Renewal due <= 15, Expired (counts in renewals) for N days, then Ex-client (Settings "Ex-client after").
  App.lastPackageEnd = function (p) {
    var e = null; [p && p.membership, p && p.pt].forEach(function (x) { if (x && x.end && (!e || new Date(x.end) > new Date(e))) e = x.end; });
    return e;
  };
  App.clientStatus = function (p) {
    var end = App.lastPackageEnd(p); if (!end) return null;
    var left = App.daysFromToday(end), n = App.setting("exClientAfterDays");
    if (left < 0 && -left >= n) return { key: "ex", cls: "grey", badge: "", text: "Ex-client", left: left, end: end };
    if (left < 0) return { key: "expired", cls: "red", badge: "badge-danger", text: "Expired", left: left, end: end };
    if (left <= 15) return { key: "renewal", cls: "amber", badge: "badge-warning", text: "Renewal due soon", left: left, end: end };
    return { key: "active", cls: "green", badge: "badge-success", text: "Active", left: left, end: end };
  };
  // Package level (#27 per package, c6): each package on its own. Renewal due <= 15 days left, Expired after its end.
  App.packageStatus = function (line) {
    if (!line || !line.end) return null;
    var left = App.daysFromToday(line.end);
    if (left < 0) return { key: "expired", cls: "red", badge: "badge-danger", text: "Expired", left: left };
    if (left <= 15) return { key: "renewal", cls: "amber", badge: "badge-warning", text: "Renewal due", left: left };
    return { key: "active", cls: "green", badge: "badge-success", text: "Active", left: left };
  };
  // Packages of a client with their own status: [{ what: "Membership" | "PT", line, st }].
  App.packageStatuses = function (p) {
    var out = [];
    if (p && p.membership) out.push({ what: "Membership", line: p.membership, st: App.packageStatus(p.membership) });
    if (p && p.pt) out.push({ what: "PT", line: p.pt, st: App.packageStatus(p.pt) });
    return out.filter(function (x) { return x.st; });
  };
  App.renewalsDue = function (p) { return App.packageStatuses(p).filter(function (x) { return x.st.key === "renewal"; }); };
  // Packages needing renewal (Clients "Renewal due"): a client that is not Expired / Ex-client at client level, with ANY package
  // <= 15 days left OR already expired (e.g. membership expired while PT runs). x.label = badge text.
  App.packagesNeedingRenewal = function (p) {
    var cs = App.clientStatus(p); if (!cs || cs.key === "ex" || cs.key === "expired") return [];
    return App.packageStatuses(p).filter(function (x) { return x.st.key === "renewal" || x.st.key === "expired"; }).map(function (x) {
      var l = x.st.left;
      x.label = x.st.key === "expired" ? (x.what === "Membership" && App.ptOnHold(p) ? "Membership expired · PT on hold" : x.what + " expired")
        : x.what + " renewal due · " + (l === 0 ? "today" : l + (l === 1 ? " day" : " days"));
      return x;
    });
  };
  // PT needs an active membership (#83 + c6): UNLOCKED = by payment (unchanged); USABLE now = unlocked AND the membership is
  // active today. Membership ended while PT still runs -> "PT on hold" (the PT end date keeps running; freeze is parked).
  App.ptUnlockedOf = function (p) { var t = p && p.pt; return t ? App.ptUnlocked(t.price, t.discount, t.sessions, t.payment ? t.payment.paid : 0) : 0; };
  App.ptOnHold = function (p) {
    if (!p || !p.pt) return false;
    var pt = App.packageStatus(p.pt), ms = App.packageStatus(p.membership);
    return pt && pt.key !== "expired" && (!ms || ms.key === "expired");
  };
  App.ptUsable = function (p) { return App.ptOnHold(p) || (p && p.pt && App.packageStatus(p.pt).key === "expired") ? 0 : App.ptUnlockedOf(p); };
  App.ptHoldText = function (p) { return "PT on hold · membership expired · " + App.ptUnlockedOf(p) + " of " + p.pt.sessions + " unlocked"; };
  // #42 warning text (PT longer than the membership), used wherever PT is sold.
  App.ptLongerWarning = function (memEndIso) { return "After the membership ends on " + App.fmtDate(memEndIso) + ", PT sessions can't be used until the membership is renewed."; };
  // Sale start date (#41 changed by #103, Q1): today by default; never in the future; back date only within the CURRENT month and
  // only with the grid row sales.backDate. Returns { min, max, canBack, hint }. The running paid trial adjust start is system-set (exempt).
  App.saleStartRange = function () {
    var t = App.todayIso(), first = t.slice(0, 8) + "01", can = App.can("sales.backDate") === true;
    var hint = !can ? "Today. Back dates need the permission \"Back-date a sale start\"." : first === t ? "Back date only within this month (none today)." : "Today, or back to " + App.fmtIsoDate(first) + " (this month only). No future dates.";
    return { min: can ? first : t, max: t, canBack: can, first: first, hint: hint };
  };
  App.saleStartError = function (iso) {
    var r = App.saleStartRange();
    if (!iso) return "Pick a start date.";
    if (iso > r.max) return "Start can't be in the future.";
    if (iso < r.first) return "Back date only within this month.";
    if (iso < r.max && !r.canBack) return "You can't back-date a sale (needs \"Back-date a sale start\").";
    return "";
  };
  App.clientNeedsAttention = function (p) { return !!(App.profilePending && App.profilePending(p).length); };
  App.nextFollowUp = function (personId) {
    var open = DUMMY.followUps.filter(function (f) { return f.personId === personId && f.status === "Open"; });
    open.sort(function (a, b) { return new Date(App.dueIso(a)) - new Date(App.dueIso(b)); });
    return open[0] || null;
  };
  // Lead visibility from the grid: leads.view; a lost lead needs leads.viewLost; an unassigned lead needs leads.viewUnassigned.
  // Quote access (#110): an open request (asked person) or an Open quote (creator) opens the person even with leads.view = None,
  // but ONLY view + quote actions (App.Quote.viewOnly). canSeeGrid = the grid alone.
  App.canSee = function (p) {
    if (App.canSeeGrid(p)) return true;
    var me = App.demoUser(); return !!(App.Quote && me && p && p.kind === "Lead" && App.Quote.access(p, me.id));
  };
  App.canSeeGrid = function (p) {
    if (p.stage === "Lost") return App.scopeAllows("leads.viewLost", p);
    if (App.isAssigneeOnly(p)) return App.can("leads.view") !== "None";
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
      unread: (App.Notify ? App.Notify.mine() : DUMMY.notifications).filter(function (n) { return n.unread; }).length
    };
  };

  // ---------- Ownership clock + inactivity release (decision #100, notes L18–L19) ----------
  // The date the CURRENT owner got the lead: assigned / taken / owner changed (ownerHistory) or re-opened; else created.
  App.ownedSince = function (p) {
    var at = p.createdAt;
    (p.ownerHistory || []).forEach(function (h) { if (h.to === p.ownerUserId && h.at && new Date(h.at) > new Date(at)) at = h.at; });
    if (p.reopenedAt && new Date(p.reopenedAt) > new Date(at)) at = p.reopenedAt;
    return at;
  };
  // Last follow-up activity on the person (created, logged, cancelled) by anyone working it: owner or assignee.
  App.lastFollowUpActivity = function (p) {
    var at = null;
    DUMMY.followUps.forEach(function (f) {
      if (f.personId !== p.id) return;
      [f.createdAt, f.doneAt, f.cancelledAt].forEach(function (x) { if (x && (!at || new Date(x) > new Date(at))) at = x; });
    });
    return at;
  };
  var Release = {};
  // Excluded: clients, lost leads, unassigned leads, any running trial.
  Release.applies = function (p) { return !!p && p.kind === "Lead" && p.stage !== "Lost" && p.stage !== "Converted" && !!p.ownerUserId && !Trial.anyRunning(p); };
  // { inactive, since, days, left, warn, release }. Clock = days since the overdue due date, or (no open follow-up) since the
  // last follow-up activity, else created. It never starts before the current owner got the lead; any follow-up activity resets it.
  Release.info = function (p) {
    if (!Release.applies(p)) return null;
    var f = App.nextFollowUp(p.id), base;
    if (f) { if (App.followUpStatus(App.dueIso(f)).text !== "Overdue") return { inactive: false }; base = f.dueDate ? f.dueDate + "T00:00" : App.dueIso(f); }
    else base = App.lastFollowUpActivity(p) || p.createdAt;
    var since = base;
    [App.ownedSince(p), App.lastFollowUpActivity(p)].forEach(function (x) { if (x && new Date(x) > new Date(since)) since = x; });
    var n = App.setting("inactivityReleaseDays"), warnBefore = App.setting("releaseWarnDaysBefore"), days = Math.max(0, -App.daysFromToday(since)), left = n - days;
    return { inactive: true, since: since, days: days, left: left, n: n, release: days >= n, warn: left > 0 && left <= warnBefore };
  };
  Release.badgeText = function (i) { return i && i.warn ? (i.left === 1 ? "Releases tomorrow" : "Releases in " + i.left + " days") : ""; };
  // MOCKUP: runs on page load (the real app runs it as a daily job). Warn = one notification per lead per day to the owner.
  Release.run = function () {
    var today = App.todayIso(), out = { warned: [], released: [] };
    DUMMY.people.forEach(function (p) {
      var i = Release.info(p); if (!i || !i.inactive) return;
      if (i.release) {
        var old = p.ownerUserId, now = new Date().toISOString(), reason = "Released (inactive)";
        DUMMY.followUps.forEach(function (f) { if (f.personId === p.id && f.status === "Open") { f.status = "Closed by system"; f.closedAt = now; f.closeReason = reason; } });
        DUMMY.workTasks.forEach(function (t) { if (t.personId === p.id && t.status === "Open") { t.status = "Closed by system"; t.closedAt = now; t.closeReason = reason; } });
        p.ownerHistory = p.ownerHistory || []; p.ownerHistory.push({ from: old, to: null, at: now, by: null, how: "Released" });
        p.ownerUserId = null; p.unassignedReason = "Released"; p.releasedAt = now; p.releaseWarnedAt = null;
        DUMMY.timeline.push({ personId: p.id, at: now, kind: "milestone", text: "Released to Unassigned · no follow-up for " + i.n + " days (was " + App.userName(old) + ")", by: null });
        DUMMY.notifications.unshift({ id: "nrel" + p.id, text: p.name + " was released to Unassigned · no follow-up for " + i.n + " days", at: now, unread: true, forUserId: old });
        if (App.Event) {
          App.Event.log(p.id, { type: "OwnerChanged", from: old, to: null, reason: "Released", byUserId: null });
          // Notification rules (#108): roles ticked for "Lead released" in the lead's branch (the old owner already got the line above).
          var rcp = App.Notify.recipients("released", p.branchId, []).filter(function (id) { return id !== old; });
          if (rcp.length) DUMMY.notifications.unshift({ id: "nrelr" + p.id, event: "released", text: p.name + " was released to Unassigned · " + App.branchName(p.branchId) + " (was " + App.userName(old) + ")", at: now, unread: true, toUserIds: rcp });
        }
        out.released.push(p.id);
      } else if (i.warn) {
        if (p.releaseWarnedAt !== today) {
          p.releaseWarnedAt = today;
          DUMMY.notifications.unshift({ id: "nwarn" + p.id + today, text: p.name + " " + Release.badgeText(i).toLowerCase() + " to Unassigned · add a follow-up to keep it", at: new Date().toISOString(), unread: true, forUserId: p.ownerUserId });
        }
        out.warned.push(p.id);
      }
    });
    return out;
  };
  App.Release = Release;

  // ---------- Users by grid row (#104: logic never checks a role name) ----------
  // Users whose role has `key` = Yes (tick) or any scope but None. Optional branchId: only staff of that branch.
  App.usersWith = function (key, branchId) {
    return DUMMY.users.filter(function (u) {
      if (u.platform) return false;
      var r = App.Perm.roleByName(u.role); if (!r) return false;
      var v = App.Perm.get(r.short, key);
      return (v === true || (typeof v === "string" && v !== "None")) && (!branchId || u.branchIds.indexOf(branchId) > -1);
    });
  };
  App.isTrainer = function (u) { return !!(u && u.trainerTypeId); };   // trainer = has a trainer type (#104)

  // ---------- Events (#104, docs/lead-lifecycle.md) ----------
  // Every state change = { type, from, to, reason, remark, byUserId, at, branchId }; the timeline line is built from it.
  // Old dummy timelines stay as text; only new actions write events.
  var Event = {};
  Event.log = function (personId, e) {
    var p = App.byId(DUMMY.people, personId), me = App.demoUser();
    var ev = { id: "ev" + Date.now() + Math.floor(Math.random() * 100000), personId: personId, type: e.type, from: e.from == null ? null : e.from, to: e.to == null ? null : e.to,
      reason: e.reason || null, remark: e.remark || null, byUserId: e.byUserId !== undefined ? e.byUserId : (me ? me.id : null), at: new Date().toISOString(), branchId: e.branchId || (p ? p.branchId : null) };
    DUMMY.events.push(ev);
    if (e.text) App.addTimeline(personId, "milestone", e.text, { eventId: ev.id });
    return ev;
  };
  Event.of = function (personId, type) { return DUMMY.events.filter(function (x) { return x.personId === personId && (!type || x.type === type); }); };
  App.Event = Event;

  // ---------- Notification rules (#108) ----------
  var Notify = {};
  Notify.rules = function () {
    var o = jget("notifyRules", null), d = DUMMY.notifyDefaults, out = {};
    DUMMY.notifyEvents.forEach(function (e) { out[e[0]] = Object.assign({}, d[e[0]] || {}, (o && o[e[0]]) || {}); });
    return out;
  };
  Notify.save = function (eventKey, short, on) {
    var cur = Notify.rules(), o = jget("notifyRules", {}) || {}, label = DUMMY.notifyEvents.filter(function (e) { return e[0] === eventKey; })[0][1];
    if (!!cur[eventKey][short] === !!on) return;
    o[eventKey] = Object.assign({}, o[eventKey] || {}); o[eventKey][short] = !!on; jset("notifyRules", o);
    Perm.audit([{ tab: "Notification rules", what: label + " · " + Perm.roleByShort(short).name, from: cur[eventKey][short] ? "On" : "Off", to: on ? "On" : "Off" }]);
  };
  // Recipients: roles ticked for the event whose branches include the lead's branch + the directly involved people (always).
  Notify.recipients = function (eventKey, branchId, involved) {
    var r = Notify.rules()[eventKey] || {}, ids = {};
    DUMMY.users.forEach(function (u) {
      var role = Perm.roleByName(u.role);
      if (role && r[role.short] && u.branchIds.indexOf(branchId) > -1) ids[u.id] = true;
    });
    (involved || []).forEach(function (id) { if (id) ids[id] = true; });
    return Object.keys(ids);
  };
  Notify.send = function (eventKey, branchId, text, involved) {
    var to = Notify.recipients(eventKey, branchId, involved);
    if (!to.length) return null;
    var n = { id: "nt" + Date.now() + Math.floor(Math.random() * 100000), event: eventKey, text: text, at: new Date().toISOString(), unread: true, toUserIds: to };
    DUMMY.notifications.unshift(n);
    return n;
  };
  // What the View-as user sees in the bell: everything without toUserIds (older demo items) + items addressed to them.
  Notify.mine = function () {
    var me = App.demoUser();
    return DUMMY.notifications.filter(function (n) { return !n.toUserIds || (me && n.toUserIds.indexOf(me.id) > -1); });
  };
  App.Notify = Notify;

  // ---------- Cross-branch work (#105, #106) ----------
  // Find by the FULL mobile number across all branches (like the duplicate check). Normal lists never show other branches' leads.
  App.findByFullMobile = function (q) {
    var d = App.mobileDigits(q); if (d.length !== 10) return [];
    return DUMMY.people.filter(function (p) { return App.mobileDigits(p.cc + p.mobile) === d; });
  };
  var Cross = {};
  // Read-only = a lead the user can't see by the grid (another branch's lead found by full mobile). Shows everything, no actions.
  Cross.readOnly = function (p) { return !!p && p.kind === "Lead" && !App.canSee(p); };
  Cross.isOpenLead = function (p) { return !!p && p.kind === "Lead" && p.stage !== "Lost" && p.stage !== "Converted"; };
  Cross.canFollowUp = function (p) { return Cross.readOnly(p) && Cross.isOpenLead(p) && App.can("leads.crossBranchFollowUp") === true; };
  Cross.canSellHere = function (p) { return Cross.canFollowUp(p) && App.can("sales.sellCrossBranch") === true; };
  // Working on a lead of a branch I'm not in (I got it through my own follow-up).
  Cross.isCrossWorker = function (p, uid) {
    var u = App.byId(DUMMY.users, uid || (App.demoUser() || {}).id);
    return !!u && !!p && u.branchIds.indexOf(p.branchId) < 0 && p.ownerUserId !== u.id;
  };
  Cross.myBranch = function () {
    var u = App.demoUser(); if (!u) return null;
    return u.branchIds.indexOf(App.state.branchId) > -1 ? App.state.branchId : u.branchIds[0];
  };
  App.Cross = Cross;

  // ---------- PT quotes (#110–#113) ----------
  // Request (SE) -> quote (CM / MXM: package, trainer, price, discount within the CREATOR's limit, valid till) -> the SE bills it LOCKED.
  var Quote = {};
  Quote.list = function (pid) { return DUMMY.ptQuotes.filter(function (q) { return q.personId === pid; }); };
  Quote.byId = function (id) { return App.byId(DUMMY.ptQuotes, id); };
  Quote.openRequest = function (pid) { return DUMMY.quoteRequests.filter(function (r) { return r.personId === pid && r.status === "Open"; })[0] || null; };
  Quote.isOpenLead = function (p) { return !!p && p.kind === "Lead" && p.stage !== "Lost" && p.stage !== "Converted"; };
  // Ask list: staff of the person's branch with pt.quote at BRANCH scope (CM / MXM / RM); All-scope (CEO) never listed.
  Quote.askable = function (p) {
    return DUMMY.users.filter(function (u) { var r = Perm.roleByName(u.role); return r && !u.platform && u.branchIds.indexOf(p.branchId) > -1 && Perm.get(r.short, "pt.quote") === "Branch"; });
  };
  // Trainers: users with an ACTIVE trainer type that can take PT, of the person's branch (PT at the home branch, A8).
  Quote.trainers = function (p) {
    var tts = Perm.trainerTypes();
    return DUMMY.users.filter(function (u) {
      var tt = u.trainerTypeId && tts.filter(function (t) { return t.id === u.trainerTypeId; })[0];
      return tt && tt.active && tt.canTakePT && u.branchIds.indexOf(p.branchId) > -1;
    });
  };
  Quote.access = function (p, uid) {
    if (!p || !uid) return false;
    var r = Quote.openRequest(p.id);
    return !!(r && r.askedUserId === uid) || Quote.list(p.id).some(function (q) { return q.status === "Open" && q.createdByUserId === uid; });
  };
  Quote.viewOnly = function (p) { var me = App.demoUser(); return !!p && p.kind === "Lead" && !App.canSeeGrid(p) && !!me && Quote.access(p, me.id); };
  Quote.canCreate = function (p) { return Quote.isOpenLead(p) && App.scopeAllows("pt.quote", p, { strictOwn: true }); };
  Quote.canRequest = function (p) {
    return Quote.isOpenLead(p) && App.can("sales.sellFromQuote") === true && !Quote.canCreate(p) && !Quote.openRequest(p.id) && App.canSeeGrid(p);
  };
  Quote.canCancel = function (q) {
    var me = App.demoUser(), p = App.byId(DUMMY.people, q.personId), s = App.can("pt.quote");
    return q.status === "Open" && !!me && (q.createdByUserId === me.id || ((s === "Branch" || s === "All") && App.scopeAllows("pt.quote", p, { strictOwn: true })));
  };
  // Money of a quote: price + reference (Premium PT) + discount on the PT part only (#103).
  Quote.money = function (q) {
    var base = q.price - (q.refPrice || 0), disc = q.discount || 0;
    return { price: q.price, ref: q.refPrice || 0, base: base, disc: disc, final: q.price - disc };
  };
  Quote.validTillDefault = function () { var d = new Date(); d.setDate(d.getDate() + Number(App.setting("ptQuoteValidDays") || 7)); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  Quote.statusBadge = function (q) {
    var c = { Open: "badge-success", Used: "badge-info", Expired: "badge-danger", Cancelled: "" }[q.status];
    return '<span class="badge ' + c + '" data-quote-status="' + q.status + '">' + q.status + (q.status === "Open" ? " · valid till " + App.esc(App.fmtIsoDate(q.validTill)) : q.status === "Expired" ? " · " + App.esc(App.fmtIsoDate(q.validTill)) : "") + "</span>";
  };
  // MOCKUP: page-load job (the real app: daily). Open quotes past their valid-till date -> Expired + event (system).
  Quote.expireRun = function () {
    var t = App.todayIso(), n = 0;
    DUMMY.ptQuotes.forEach(function (q) {
      if (q.status === "Open" && q.validTill < t) { q.status = "Expired"; q.expiredAt = new Date().toISOString(); n++; App.Event.log(q.personId, { type: "QuoteExpired", from: "Open", to: "Expired", byUserId: null, text: "PT quote expired · " + q.package }); }
    });
    return n;
  };
  App.Quote = Quote;
  Quote.expireRun();
  // Ownership badges, ONE place for the Leads list, Today and the profile (#97, #98, #100, L23):
  // "Follow-up from <owner>", "Releases tomorrow", "Transferred in", "Unassigned · New / Released".
  App.ownershipBadges = function (p, o) {
    if (!p || p.kind !== "Lead") return "";
    var h = "", me = App.demoUser(), ri = Release.info(p);
    if (me && App.isAssigneeOnly(p, me.id)) h += '<span class="badge badge-info" data-badge="fu-from">Follow-up from ' + App.esc(App.firstName(App.byId(DUMMY.users, p.ownerUserId))) + "</span>";
    if (ri && ri.warn) h += '<span class="badge badge-warning" data-badge="release">' + App.esc(Release.badgeText(ri)) + "</span>";
    if (p.transferredIn) h += '<span class="badge badge-warning" data-badge="transfer">Transferred in</span>';
    if (!p.ownerUserId && p.stage !== "Lost" && !(o && o.noUnassigned)) h += '<span class="badge badge-warning" data-badge="unassigned">Unassigned · ' + App.esc(p.unassignedReason || "New") + "</span>";
    return h;
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
  // Data normalisation + the inactivity job (mockup: on page load, before any page renders).
  (DUMMY.followUps || []).forEach(function (f) { if (!f.assignedToUserId) f.assignedToUserId = f.ownerUserId || null; });
  (DUMMY.people || []).forEach(function (p) { if (p.kind === "Lead" && !p.ownerUserId && p.stage !== "Lost" && !p.unassignedReason) p.unassignedReason = "New"; });
  App.releaseResult = Release.run();
})();
