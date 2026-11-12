/* Today: the first screen staff see every day (decisions #22, #24, #61–#63).
   Sections: Overdue or not set · Due today · My open tasks · Unassigned new leads · Clients with pending items.
   Each: count, up to 5 rows, ONE main action per row, "View all". Uses the shared flows only. */
(function () {
  var D = window.DUMMY, esc = App.esc, icon = App.icon;
  var MAX = 5, PRI = { Critical: 0, High: 1, Medium: 2, Low: 3 }, PRI_BADGE = { Critical: "badge-danger", High: "badge-warning", Medium: "badge-info", Low: "" };
  var state = "normal";

  function role() { return App.state.role; }
  function me() { return App.demoUser(); }
  function leadsRole() { return ["Trainer", "MXM"].indexOf(role()) < 0; }
  function managerView() { return role() !== "Sales Executive"; }
  function inTopBranch(p) { var b = App.state.branchId; return !b || b === "all" || p.branchId === b; }
  function daysAgo(iso) { var d = -App.daysFromToday(iso); return d === 1 ? "1 day" : d + " days"; }

  // ---------- data per section (same helpers as the sidebar badges, so numbers always match) ----------
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
  function unassigned() {
    if (!App.access.assignLeads()) return [];
    return App.visibleLeads(App.state.branchId).filter(function (p) { return !p.ownerUserId && p.stage !== "Lost"; })
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  }
  function pendingRole() { return ["SuperAdmin", "CEO", "Regional Manager", "Club Manager", "Sales Manager", "Sales Executive"].indexOf(role()) > -1; }
  function pending() {
    if (!pendingRole()) return [];
    return D.people.filter(function (p) { return p.kind === "Client" && inTopBranch(p) && App.access.pendingActions(p) && App.profilePending(p).length; })
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
        return row({ open: p.id, title: esc(p.name) + (p.synced ? ' <span class="badge badge-info">Meta</span>' : ""),
          sub: (f ? esc(f.type) + " · due " + esc(App.fmtDue(f)) : "Lead from " + esc(p.source) + " · " + esc(App.branchName(p.branchId))) + ownerBit(p),
          status: f ? '<span class="badge badge-danger">Overdue · ' + daysAgo(App.dueIso(f)) + "</span>" : '<span class="badge badge-danger">No follow-up set</span>',
          action: f ? btn("outcome", "Log outcome", { f: f.id }) : btn("addfu", "Add follow-up", { p: p.id }) });
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
    { k: "unassigned", area: "u", t: "Unassigned new leads", ic: "user", tone: "amber", get: unassigned, words: "without an owner",
      empty: "Every new lead has an owner", all: "../leads/index.html?owner=none", show: function () { return App.access.assignLeads(); },
      row: function (p) {
        return row({ open: p.id, title: esc(p.name) + (p.synced ? ' <span class="badge badge-info">Meta</span>' : ""),
          sub: esc(p.source) + " · " + esc(App.branchName(p.branchId)) + " · received " + esc(App.fmtShortWhen(p.createdAt)) + ", " + esc(App.fmtTime(p.createdAt)),
          status: '<span class="badge badge-warning">Unassigned</span>', action: btn("assign", "Assign", { p: p.id }) });
      } },
    { k: "pending", area: "p", t: "Clients with pending items", ic: "key", tone: "amber", get: pending, words: "FF ID, key fob, free item or payment",
      empty: "No pending items", all: "../clients/index.html?view=attention", show: pendingRole,
      row: function (x) {
        var first = x.items[0], act = { addFf: "ff", goFob: "fob", issue: "issue", pay: "pay" }[first.k];
        return row({ open: x.p.id, tab: "membership", title: esc(x.p.name) + ' <span class="muted">· ' + esc(x.p.clientNo) + "</span>",
          sub: esc(x.p.membership.package) + " · " + esc(App.branchName(x.p.branchId)) + " · joined " + esc(App.fmtShortWhen(x.p.joinedAt)) +
            '<div class="stack mt-1">' + pendBadges(x.items) + "</div>",
          status: "",
          action: btn(act, first.a, { p: x.p.id, item: first.itemId || "" }) });
      } }
  ];
  // Same grouping as the profile: "Corporate entry: FF ID & key fob" first, then free items.
  function pendBadges(items) {
    function b(i) { return '<span class="badge badge-warning">' + esc(i.t) + "</span>"; }
    var corp = items.filter(function (i) { return i.k === "addFf" || i.k === "goFob"; }), rest = items.filter(function (i) { return i.k !== "addFf" && i.k !== "goFob"; });
    return (corp.length ? '<span class="corp-label">' + esc(App.CORP_LABEL) + "</span>" + corp.map(b).join("") : "") + rest.map(b).join("");
  }
  function visible() { return SECTIONS.filter(function (s) { return (s.show ? s.show() : true) && (leadsRole() || s.k === "tasks"); }); }

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
    var note = leadsRole() ? "" : '<div class="callout">' + icon("info") + "<span>Leads and follow-ups aren't part of your role. Your tasks are below.</span></div>";
    if (!total) {
      box.innerHTML = note + '<div class="card today-clear">' + icon("check") + "<h2>All caught up</h2><p class=\"muted\">Nothing needs you right now. New leads and follow-ups will show up here.</p></div>";
      return;
    }
    box.innerHTML = note + '<div class="today-grid' + (secs.some(function (s) { return s.area === "u"; }) ? "" : " no-unassigned") + '">' + secs.map(function (s) {
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
      if (d.act === "ff") App.addFfId(d.p);
      if (d.act === "fob") App.assignFob(d.p);
      if (d.act === "issue") App.issueItem(d.p, d.item);
      if (d.act === "pay") App.collectPayment(d.p, d.item);
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
