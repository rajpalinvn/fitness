/* Today: the first screen staff see every day (decisions #22, #24, #61–#63).
   Sections: Overdue or not set · Due today · My open tasks · Unassigned leads (New / Released) ·
   Transferred in · needs follow-up person · Trial approvals pending · Clients with pending items.
   Each: count, up to 5 rows, ONE main action per row, "View all". Uses the shared flows only. */
(function () {
  var D = window.DUMMY, esc = App.esc, icon = App.icon;
  var MAX = 5, PRI = { Critical: 0, High: 1, Medium: 2, Low: 3 }, PRI_BADGE = { Critical: "badge-danger", High: "badge-warning", Medium: "badge-info", Low: "" };
  var state = "normal";

  function role() { return App.state.role; }
  function me() { return App.demoUser(); }
  // Access = the Roles & permissions grid (#96): leads.view, leads.assign + leads.viewUnassigned, clients.view.
  function leadsRole() { return App.can("leads.view") !== "None"; }
  function managerView() { return App.can("leads.view") !== "Own"; }   // owner shown when the user sees other people's leads
  function inTopBranch(p) { var b = App.state.branchId; return !b || b === "all" || p.branchId === b; }
  function daysAgo(iso) { var d = -App.daysFromToday(iso); return d === 1 ? "1 day" : d + " days"; }

  // ---------- data per section (same helpers as the sidebar badges, so numbers always match) ----------
  function releasing() {
    if (!leadsRole()) return [];
    return App.visibleLeads(App.state.branchId).filter(function (p) { var i = App.Release.info(p); return i && i.inactive && i.warn; });   // one rule with the Leads filter (#122)
  }
  function attention() {
    if (!leadsRole()) return [];
    return App.visibleLeads(App.state.branchId).filter(App.needsAttention).map(function (p) { return { p: p, f: App.nextFollowUp(p.id) }; })
      .sort(function (a, b) {
        if (a.f && b.f) return new Date(App.dueIso(a.f)) - new Date(App.dueIso(b.f));
        if (a.f || b.f) return a.f ? -1 : 1;
        return new Date(a.p.createdAt) - new Date(b.p.createdAt);
      });
  }
  function dueToday() {
    if (!leadsRole()) return [];
    var ids = App.visibleLeads(App.state.branchId).map(function (p) { return p.id; });
    return D.followUps.filter(function (f) { return f.status === "Open" && ids.indexOf(f.personId) > -1 && App.followUpStatus(App.dueIso(f)).cls === "amber"; })
      .sort(function (a, b) { return (a.dueTime ? 0 : 1) - (b.dueTime ? 0 : 1) || new Date(App.dueIso(a)) - new Date(App.dueIso(b)); })
      .map(function (f) { return { f: f, p: App.byId(D.people, f.personId) }; });
  }
  function myTasks() {
    var u = me(); if (!u) return [];
    return D.workTasks.filter(function (t) { return t.status === "Open" && t.assignedUserId === u.id; })
      .sort(function (a, b) {
        var oa = App.daysFromToday(a.dueAt) < 0 ? 0 : 1, ob = App.daysFromToday(b.dueAt) < 0 ? 0 : 1;
        return oa - ob || PRI[a.priority] - PRI[b.priority] || new Date(a.dueAt) - new Date(b.dueAt);
      });
  }
  // Unassigned (#100): visibility = grid row leads.viewUnassigned; reason New / Released; action Take (leads.take) or Assign (leads.assign).
  function unassignedRole() { return App.can("leads.viewUnassigned") !== "None"; }
  function unassigned() {
    if (!unassignedRole()) return [];
    return App.visibleLeads(App.state.branchId).filter(function (p) { return !p.ownerUserId && p.stage !== "Lost"; })
      .sort(function (a, b) { return new Date(b.releasedAt || b.createdAt) - new Date(a.releasedAt || a.createdAt); });
  }
  // Transferred in (#98, L13): the new branch's CM (leads.assign at Branch or higher; RM / CEO by scope) picks the follow-up person.
  function transferRole() { var s = App.can("leads.assign"); return s === "Branch" || s === "All"; }
  function transferred() {
    if (!transferRole()) return [];
    return App.visibleLeads(App.state.branchId).filter(function (p) { return p.transferredIn && App.Lead.canPick(p); })
      .sort(function (a, b) { return new Date(a.transferredIn.at) - new Date(b.transferredIn.at); });
  }
  function pendingRole() { return App.can("clients.view") !== "None"; }
  // PT quote requests (#111): for pt.quote users, the open requests asked from ME.
  function quoteRole() { return App.can("pt.quote") !== "None"; }
  function quoteReqs() { var u = me(); return quoteRole() && u ? D.quoteRequests.filter(function (r) { return r.status === "Open" && r.askedUserId === u.id; }) : []; }
  function approvalsRole() { return App.can("trials.approve") !== "None"; }
  function approvals() { return approvalsRole() ? App.Trial.pendingApprovals().filter(function (x) { return inTopBranch(x.p); }) : []; }
  function pending() {
    if (!pendingRole()) return [];
    return App.visibleClients(App.state.branchId).filter(function (p) { return App.profilePending(p).length; })
      .sort(function (a, b) { return new Date(a.joinedAt) - new Date(b.joinedAt); })
      .map(function (p) { return { p: p, items: App.profilePending(p) }; });
  }

  // ---------- rows ----------
  function row(opts) {
    return '<li class="today-row' + (opts.open ? " clickable" : "") + '"' + (opts.open ? ' data-open="' + opts.open + '"' + (opts.tab ? ' data-tab="' + opts.tab + '"' : "") : "") + ">" +
      '<div class="tr-main"><div class="tr-title">' + opts.title + '</div><div class="cell-sub">' + opts.sub + "</div></div>" +
      '<div class="tr-status">' + (opts.status || "") + "</div>" +
      '<div class="tr-action">' + opts.action + "</div></li>";
  }
  function btn(act, label, data, primary) {
    return '<button class="btn btn-sm' + (primary === false ? "" : " btn-primary") + '" data-act="' + act + '"' +
      Object.keys(data).map(function (k) { return " data-" + k + '="' + esc(data[k]) + '"'; }).join("") + ">" + esc(label) + "</button>";
  }
  function ownerBit(p) { return managerView() ? " · " + esc(p.ownerUserId ? App.firstName(App.byId(D.users, p.ownerUserId)) : "Unassigned") : ""; }

  var SECTIONS = [
    { k: "attention", area: "a", t: "Overdue or not set", ic: "flag", tone: "red", get: attention, words: "need a follow-up",
      empty: "All caught up · every lead has a follow-up on time", all: "../leads/index.html?view=attention",
      row: function (x) {
        var p = x.p, f = x.f;
        return row({ open: p.id, title: esc(p.name) + (p.synced ? ' <span class="badge badge-info">Meta</span>' : "") + " " + App.ownershipBadges(p, { noUnassigned: true }),
          sub: (f ? esc(f.type) + " · due " + esc(App.fmtDue(f)) : "Lead from " + esc(p.source) + " · " + esc(App.branchName(p.branchId))) + ownerBit(p),
          status: f ? '<span class="badge badge-danger">Overdue · ' + daysAgo(App.dueIso(f)) + "</span>" : '<span class="badge badge-danger">No follow-up set</span>',
          action: f ? btn("outcome", "Log outcome", { f: f.id }) : !p.ownerUserId && p.kind === "Lead"
            ? (App.scopeAllows("leads.assign", p, { strictOwn: true }) ? btn("assign", "Assign", { p: p.id }) : App.Lead.canTake(p) ? btn("take", "Take this lead", { p: p.id }) : "")   // #120: as the Unassigned section
            : btn("addfu", "Add follow-up", { p: p.id }) });
      } },
    { k: "today", area: "t", t: "Due today", ic: "clock", tone: "amber", get: dueToday, words: "follow-ups to do",
      empty: "Nothing due today", all: "../leads/index.html?follow=Due%20today",
      row: function (x) {
        return row({ open: x.p.id, title: esc(x.p.name), sub: esc(x.f.type) + (x.f.note ? " · " + esc(x.f.note) : "") + ownerBit(x.p),
          status: '<span class="badge badge-warning">' + (x.f.dueTime ? esc(App.fmtTime(App.dueIso(x.f))) : "Any time") + "</span>",
          action: btn("outcome", "Log outcome", { f: x.f.id }) });
      } },
    { k: "tasks", area: "k", t: "My open tasks", ic: "tasks", tone: "neutral", get: myTasks, words: "assigned to you",
      empty: "No open tasks", allToast: "The Tasks screen comes next (see roadmap)",
      row: function (t) {
        var p = t.personId && App.byId(D.people, t.personId), over = App.daysFromToday(t.dueAt) < 0;
        return row({ open: p ? p.id : null, tab: "tasks", title: esc(t.title),
          sub: (p ? esc(p.name) + " · " : "") + "due " + esc(App.fmtShortWhen(t.dueAt)) + ", " + esc(App.fmtTime(t.dueAt)),
          status: (over ? '<span class="badge badge-danger">Overdue</span> ' : "") + '<span class="badge ' + PRI_BADGE[t.priority] + '">' + esc(t.priority) + "</span>",
          action: btn("done", "Mark done", { t: t.id }, false) });
      } },
    { k: "unassigned", area: "u", t: "Unassigned leads", ic: "user", tone: "amber", get: unassigned, words: "without an owner (New / Released)",
      empty: "Every lead has an owner", all: "../leads/index.html?owner=none", show: unassignedRole,
      row: function (p) {
        // Q36 (#103): "Assign" for users with leads.assign; "Take this lead" only for users with leads.take but not leads.assign.
        var rel = p.unassignedReason === "Released", act = App.scopeAllows("leads.assign", p, { strictOwn: true }) ? btn("assign", "Assign", { p: p.id })
          : App.Lead.canTake(p) ? btn("take", "Take this lead", { p: p.id }) : "";
        return row({ open: p.id, title: esc(p.name) + (p.synced ? ' <span class="badge badge-info">Meta</span>' : ""),
          sub: esc(p.source) + " · " + esc(App.branchName(p.branchId)) + (rel ? " · released " + esc(App.fmtShortWhen(p.releasedAt)) : " · received " + esc(App.fmtShortWhen(p.createdAt)) + ", " + esc(App.fmtTime(p.createdAt))),
          status: '<span class="badge badge-warning">Unassigned · ' + esc(p.unassignedReason || "New") + "</span>", action: act });
      } },
    // Releasing soon (#121, #122): my visible leads inside the release-warning window (same rule as the Leads "Releasing" filter). Add follow-up resets the clock.
    { k: "releasing", area: "r", t: "Releasing soon", ic: "clock", tone: "amber", get: releasing, words: "add a follow-up to keep them",
      empty: "No lead is releasing soon", all: "../leads/index.html?view=releasing", show: leadsRole,
      row: function (p) {
        var f = App.nextFollowUp(p.id);
        return row({ open: p.id, title: esc(p.name), sub: (f ? esc(f.type) + " · due " + esc(App.fmtDue(f)) : "No follow-up set") + ownerBit(p),
          status: '<span class="badge badge-warning">' + esc(App.Release.badgeText(App.Release.info(p))) + "</span>", action: btn("addfu", "Add follow-up", { p: p.id }) });
      } },
    { k: "transferred", area: "x", t: "Transferred in · needs follow-up person", ic: "swap", tone: "amber", get: transferred, words: "moved to your branch",
      empty: "No transferred leads waiting", all: "../leads/index.html?view=transferred", show: transferRole,
      row: function (p) {
        var t = p.transferredIn;
        return row({ open: p.id, title: esc(p.name),
          sub: "From " + esc(App.branchName(t.from)) + " → " + esc(App.branchName(p.branchId)) + " · by " + esc(App.firstName(App.byId(D.users, t.by))) + " · owner " + esc(App.firstName(App.byId(D.users, p.ownerUserId))),
          status: '<span class="badge badge-warning">Transferred in</span>', action: btn("pick", "Pick person", { p: p.id }) });
      } },
    { k: "quotes", area: "q", t: "PT quote requests", ic: "note", tone: "amber", get: quoteReqs, words: "asked from you", show: quoteRole,
      empty: "No PT quote requests", allToast: "All requests asked from you are listed here",
      row: function (r) {
        var p = App.byId(D.people, r.personId);
        return row({ open: p.id, title: esc(p.name) + ' <span class="muted">· ' + esc(p.stage) + "</span>",
          sub: "From " + esc(App.firstName(App.byId(D.users, r.byUserId))) + " · " + esc(App.fmtShortWhen(r.at)) + " · " + esc(App.branchName(p.branchId)) + '<div class="cell-sub">“' + esc(r.note) + "”</div>",
          status: '<span class="badge badge-warning">Quote requested</span>', action: App.Quote.canCreate(p) ? btn("quote", "Create quote", { p: p.id }) : "" });
      } },
    // Flagged payments (#117): duplicate payment references, for the people the "Duplicate payment reference" rule notifies.
    { k: "flagged", area: "f", t: "Flagged payments", ic: "alert", tone: "red", get: function () { return App.PayRef.flaggedForMe(); }, words: "duplicate references", show: function () { return ruleOn(); },
      empty: "No flagged payments", allToast: "All flagged payments are listed here",
      row: function (x) {
        var d = x.r.dup, other = App.byId(D.people, d.personId);
        return row({ open: x.p.id, tab: "membership", title: esc(x.p.name) + ' <span class="muted">· ' + App.fmtMoney(x.r.amount) + "</span>",
          sub: esc(x.r.method) + " " + esc(x.r.ref) + " · receipt " + esc(x.no) + '<div class="cell-sub">Used before: ' + esc(d.usedAt ? App.fmtDay(d.usedAt) + " in " : "") + esc(other ? other.name : "—") + "'s payment (" + esc(d.usedOn) + ")</div>" +
            '<div class="cell-sub">' + esc(App.userName(d.by)) + " · reason: “" + esc(d.reason) + "”</div>",
          status: '<span class="badge badge-danger">Duplicate reference</span>', action: btn("payrev", "Mark reviewed", { p: x.p.id, no: x.no }) });
      } },
    { k: "approvals", area: "v", t: "Trial approvals pending", ic: "clock", tone: "amber", get: approvals, words: "trials asked from you", show: approvalsRole,
      empty: "No trial approvals waiting", allToast: "All pending approvals are listed here",
      row: function (x) {
        var t = x.t, p = x.p;
        return row({ open: p.id, title: esc(p.name) + ' <span class="muted">· ' + esc(t.package) + "</span>",
          sub: esc(t.type) + (t.kind === "paid" ? " · " + App.fmtMoney(t.paid) + " paid" : " · free") + " · " + esc(App.fmtDate(t.from)) + " · " + esc(App.branchName(p.branchId)) + " · booked by " + esc(App.firstName(App.byId(D.users, t.bookedByUserId))) +
            (t.comment ? '<div class="cell-sub">“' + esc(t.comment) + "”</div>" : ""),
          status: App.Trial.approvalBadge(t) + (t.approverUserId ? '<div class="cell-sub">asked from ' + esc(App.firstName(App.byId(D.users, t.approverUserId))) + "</div>" : ""),
          action: btn("review", "Review", { tr: t.id }) });
      } },
    { k: "pending", area: "p", t: "Clients with pending items", ic: "key", tone: "amber", get: pending, words: "FF ID, key fob, free item or payment",
      empty: "No pending items", all: "../clients/index.html?view=attention", show: pendingRole,
      row: function (x) {
        var first = x.items.filter(function (it) { return App.access.pendingActions(x.p, it.k); })[0] || x.items[0];
        var allowed = App.access.pendingActions(x.p, first.k), act = { addFf: "ff", goFob: "fob", issue: "issue", pay: "pay" }[first.k];
        return row({ open: x.p.id, tab: "membership", title: esc(x.p.name) + ' <span class="muted">· ' + esc(x.p.clientNo) + "</span>",
          sub: esc(x.p.membership.package) + " · " + esc(App.branchName(x.p.branchId)) + " · joined " + esc(App.fmtShortWhen(x.p.joinedAt)) +
            '<div class="stack mt-1">' + pendBadges(x.items) + "</div>",
          status: "",
          action: allowed ? btn(act, first.a, { p: x.p.id, item: first.itemId || "" }) : "" });
      } }
  ];
  // Same grouping as the profile: "Corporate entry: FF ID & key fob" first, then free items.
  function pendBadges(items) {
    function b(i) { return '<span class="badge badge-warning">' + esc(i.t) + "</span>"; }
    var corp = items.filter(function (i) { return i.k === "addFf" || i.k === "goFob"; }), rest = items.filter(function (i) { return i.k !== "addFf" && i.k !== "goFob"; });
    return (corp.length ? '<span class="corp-label">' + esc(App.CORP_LABEL) + "</span>" + corp.map(b).join("") : "") + rest.map(b).join("");
  }
  function ruleOn() { var u = me(), r = u && App.Perm.roleByName(u.role); return !!(r && (App.Notify.rules().dupRef || {})[r.short]); }
  function visible() { return SECTIONS.filter(function (s) { return (s.show ? s.show() : true) && (leadsRole() || s.k === "tasks" || s.k === "quotes" || s.k === "flagged"); }); }

  // ---------- render ----------
  function greeting() {
    var h = new Date().getHours(), u = me();
    return (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening") + ", " + esc(u ? App.firstName(u) : "there") +
      ' <span class="muted today-date">· ' + esc(App.fmtDay(new Date().toISOString())) + "</span>";
  }
  function render() {
    var secs = visible(), data = {};
    secs.forEach(function (s) { data[s.k] = state === "empty" ? [] : s.get(); });
    var total = secs.reduce(function (n, s) { return n + data[s.k].length; }, 0);
    document.getElementById("greet").innerHTML = greeting();
    var strip = document.getElementById("strip"), box = document.getElementById("sections"), sum = document.getElementById("summary");
    if (state === "loading") {
      sum.textContent = "Loading your day…";
      strip.innerHTML = secs.map(function () { return '<div class="today-card"><div class="skeleton"></div><div class="skeleton"></div></div>'; }).join("");
      box.innerHTML = '<div class="today-grid">' + secs.map(function (s) { return '<section class="card today-sec" data-area="' + s.area + '"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></section>'; }).join("") + "</div>";
      return;
    }
    if (state === "error") {
      sum.textContent = ""; strip.innerHTML = "";
      box.innerHTML = '<div class="card state">' + icon("alert") + "<h3>Couldn't load Today</h3><p class=\"muted\">Please check your connection and try again.</p>" +
        '<button class="btn btn-primary" data-act="retry">Retry</button></div>';
      return;
    }
    sum.textContent = total ? total + (total === 1 ? " thing needs" : " things need") + " you today." : "All caught up. Nothing needs you right now.";
    strip.innerHTML = secs.map(function (s) {
      var n = data[s.k].length;
      return '<button class="today-card' + (n ? " tone-" + s.tone : " tone-clear") + '" data-jump="' + s.k + '"><span class="count">' + n + '</span><span class="label">' + esc(s.t) + "</span>" +
        '<span class="cell-sub">' + (n ? esc(s.words) : icon("check", "ico-xs") + " All clear") + "</span></button>";
    }).join("");
    // No leads role: name the work this user does have here (PT quote requests); the old line only when nothing else shows.
    var extra = secs.filter(function (s) { return s.k === "quotes" || s.k === "flagged"; });
    var note = leadsRole() ? "" : '<div class="callout" data-role-note>' + icon("info") + "<span>" +
      (extra.length ? "Your work here: " + extra.map(function (s) { return s.t; }).join(", ") + " and your tasks." : "Leads and follow-ups aren't part of your role. Your tasks are below.") + "</span></div>";
    if (!total) {
      box.innerHTML = note + '<div class="card today-clear">' + icon("check") + "<h2>All caught up</h2><p class=\"muted\">Nothing needs you right now. New leads and follow-ups will show up here.</p></div>";
      return;
    }
    box.innerHTML = note + '<div class="today-grid' + (secs.some(function (s) { return s.area === "u"; }) ? "" : " no-unassigned") + (secs.some(function (s) { return s.area === "x"; }) ? "" : " no-transfer") + '">' + secs.map(function (s) {
      var list = data[s.k], n = list.length;
      return '<section class="card today-sec" id="sec-' + s.k + '" data-area="' + s.area + '" aria-labelledby="h-' + s.k + '">' +
        '<header class="today-sec-head"><span class="tl-ico ' + (n ? s.tone : "green") + '">' + icon(s.ic, "ico-sm") + '</span><h2 id="h-' + s.k + '">' + esc(s.t) + "</h2>" +
          '<span class="tab-count">' + n + "</span>" +
          (n ? (s.all ? '<a class="link-btn today-all" href="' + s.all + '">View all (' + n + ")</a>" : '<button class="link-btn today-all" data-toast="' + esc(s.allToast) + '" data-toast-kind="">View all (' + n + ")</button>") : "") +
        "</header>" +
        (n ? '<ul class="today-list">' + list.slice(0, MAX).map(s.row).join("") + "</ul>" + (n > MAX ? '<p class="cell-sub today-more">+' + (n - MAX) + " more</p>" : "")
          : '<div class="today-empty">' + icon("check") + "<span>" + esc(s.empty) + "</span></div>") +
        "</section>";
    }).join("") + "</div>";
    App.fillIcons && App.fillIcons(box);
  }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]");
    if (a && document.getElementById("sections").contains(a) || a && a.dataset.act === "retry") {
      var d = a.dataset;
      if (d.act === "outcome") App.Followup.openOutcome(d.f);
      if (d.act === "addfu") App.Followup.openAdd(d.p);
      if (d.act === "assign") App.Lead.assign(d.p);
      if (d.act === "take") App.Lead.take(d.p);
      if (d.act === "pick") App.Lead.pickPerson(d.p);
      if (d.act === "quote") App.QuoteUI.create(d.p);
      if (d.act === "ff") App.addFfId(d.p);
      if (d.act === "fob") App.assignFob(d.p);
      if (d.act === "issue") App.issueItem(d.p, d.item);
      if (d.act === "pay") App.collectPayment(d.p, d.item);
      if (d.act === "payrev") App.PayRef.review(d.p, d.no);
      if (d.act === "review") App.Trial.review(d.tr);
      if (d.act === "done") {
        var t = App.byId(D.workTasks, d.t); t.status = "Done"; t.doneAt = new Date().toISOString();
        if (t.personId) App.addTimeline(t.personId, "milestone", App.firstName(App.me()) + " finished task · " + t.title);
        App.toast("Task done · " + t.title, "success"); App.dataChanged();
      }
      if (d.act === "retry") { state = "normal"; render(); }
      return;
    }
    var j = e.target.closest("[data-jump]");
    if (j) { var sec = document.getElementById("sec-" + j.dataset.jump); if (sec) { sec.scrollIntoView({ behavior: "smooth", block: "start" }); var h = sec.querySelector("h2"); h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } return; }
    var r = e.target.closest(".today-row[data-open]");
    if (r && !e.target.closest("button, a")) {
      var ids = Array.prototype.map.call(r.parentNode.querySelectorAll("[data-open]"), function (x) { return x.dataset.open; });
      App.openProfile(r.dataset.open, { list: ids, tab: r.dataset.tab || undefined });
    }
  });
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("debugBar"); b.hidden = !App.isDebug();
    b.addEventListener("click", function (e) {
      var s = e.target.closest("[data-state]"); if (!s) return;
      state = s.dataset.state; render();
      if (state === "loading") setTimeout(function () { if (state === "loading") { state = "normal"; render(); } }, 900);
    });
    render();
  });
  document.addEventListener("mock:data", render);
  document.addEventListener("mock:context", render);
})();
