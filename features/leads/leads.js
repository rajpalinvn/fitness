/* Leads list mockup. Reads only window.DUMMY; changes stay in memory (reset on reload). */
(function () {
  var D = window.DUMMY, L = D.lists;
  var $ = function (id) { return document.getElementById(id); };
  var esc = App.esc;

  // Role visibility, next follow-up and "needs attention" come from app.js,
  // so the sidebar badges and this list always use the same rule.
  var nextFollowUp = App.nextFollowUp, needsAttention = App.needsAttention;

  var S = { stage: "", attention: false, search: "", owner: "", source: "", branch: App.state.branchId,
    temp: "", follow: "", from: "", to: "", synced: false, reason: "", transferred: false, sel: {}, mode: "loading" };
  // Links from Today "View all": ?view=attention, ?follow=Due%20today, ?owner=none (unassigned), &reason=Released, ?view=transferred
  (function () {
    var q = location.search;
    if (/[?&]view=attention\b/.test(q)) S.attention = true;
    var f = /[?&]follow=([^&#]+)/.exec(q); if (f) S.follow = decodeURIComponent(f[1]);
    var o = /[?&]owner=([^&#]+)/.exec(q); if (o) S.owner = decodeURIComponent(o[1]);
    var r = /[?&]reason=([^&#]+)/.exec(q); if (r) S.reason = decodeURIComponent(r[1]);
    if (/[?&]view=transferred\b/.test(q)) S.transferred = true;
  })();
  var current = { personId: null };

  // ---------- data helpers ----------
  function user(id) { return App.byId(D.users, id); }
  function branch(id) { var b = App.byId(D.branches, id); return b ? b.name : "—"; }
  function digits(s) {
    var d = String(s || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    return d;
  }
  function isPhoneLike(q) { return /^[+\d\s-]{6,}$/.test(q.trim()); }
  function daysBetween(a, b) {
    var x = new Date(a); x.setHours(0, 0, 0, 0); var y = new Date(b); y.setHours(0, 0, 0, 0);
    return Math.round((y - x) / 86400000);
  }
  function shortDate(iso) { return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
  function time(iso) { return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); }
  function lastActivity(iso) {
    if (!iso) return "—";
    var d = daysBetween(iso, new Date());
    return d <= 0 ? "Today" : d === 1 ? "Yesterday" : d + " days ago";
  }

  // Role + branch only: used for the pipeline card counts, so "Needs attention"
  // always equals the sidebar Today badge (when the list branch = top-bar branch).
  function scopeLeads() { return S.mode === "empty" ? [] : App.visibleLeads(S.branch); }

  // Role + branch + all filters, except the stage / attention cards.
  function baseLeads() {
    var q = S.search.trim().toLowerCase(), qd = digits(q);
    return scopeLeads().filter(function (p) {
      if (q) {
        var hit = p.name.toLowerCase().indexOf(q) > -1 || (p.email || "").toLowerCase().indexOf(q) > -1;
        if (!hit && qd.length >= 3) hit = digits(p.cc + p.mobile).indexOf(qd) > -1;
        if (!hit) return false;
      }
      if (S.owner === "none" && p.ownerUserId) return false;
      if (S.owner && S.owner !== "none" && p.ownerUserId !== S.owner) return false;
      if (S.source && p.source !== S.source) return false;
      if (S.temp && p.temperature !== S.temp) return false;
      if (S.synced && !p.synced) return false;
      if (S.reason && (p.ownerUserId || (p.unassignedReason || "New") !== S.reason)) return false;   // Unassigned reason (#100)
      if (S.transferred && !p.transferredIn) return false;                                           // Transferred in (#98)
      if (S.from && new Date(p.createdAt) < new Date(S.from)) return false;
      if (S.to && new Date(p.createdAt) > new Date(S.to + "T23:59:59")) return false;
      if (S.follow) {
        var f = nextFollowUp(p.id), st = App.followUpStatus(f && App.dueIso(f)).text;
        if (p.stage === "Lost" || st !== S.follow) return false;
      }
      return true;
    });
  }
  function applyCards(list) {
    return list.filter(function (p) {
      if (S.attention) return needsAttention(p);
      if (S.stage === "Lost") return p.stage === "Lost";
      if (p.stage === "Lost") return false;            // default: open leads only
      return !S.stage || p.stage === S.stage;
    });
  }
  function rank(p) {
    if (p.stage === "Lost") return [9, -new Date(p.lastActivityAt)];
    var f = nextFollowUp(p.id); if (!f) return [1, 0];
    var c = App.followUpStatus(App.dueIso(f)).cls;
    return [c === "red" ? 0 : c === "amber" ? 2 : 3, new Date(App.dueIso(f)).getTime()];
  }
  function sortLeads(list) {
    return list.sort(function (a, b) { var x = rank(a), y = rank(b); return x[0] - y[0] || x[1] - y[1]; });
  }

  // ---------- render: filters ----------
  function opts(sel, first, items) {
    var v = sel.value;
    sel.innerHTML = '<option value="">' + first + "</option>" + items.map(function (i) {
      return typeof i === "string" ? "<option>" + esc(i) + "</option>" : '<option value="' + esc(i.v) + '">' + esc(i.t) + "</option>";
    }).join("");
    sel.value = v;
  }
  function fillFilters() {
    opts($("fStage"), "Open leads (all stages)", L.stages.concat(["Lost"]));
    var owners = D.users.filter(function (u) { return D.people.some(function (p) { return p.ownerUserId === u.id && p.kind === "Lead"; }); })
      .map(function (u) { return { v: u.id, t: u.name }; }).concat([{ v: "none", t: "Unassigned" }]);
    ["fOwner", "mOwner"].forEach(function (id) { opts($(id), "All owners", owners); });
    ["fSource", "mSource"].forEach(function (id) { opts($(id), "All sources", L.sources); });
    ["fBranch", "mBranch"].forEach(function (id) {
      var sel = $(id);
      sel.innerHTML = '<option value="all">All branches</option>' + D.branches.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + "</option>"; }).join("");
    });
    opts($("fTemp"), "Any", L.temperatures);
    opts($("fFollow"), "Any", ["Overdue", "Due today", "Scheduled", "No follow-up set"]);
    opts($("fReason"), "Any", [{ v: "New", t: "Unassigned · New" }, { v: "Released", t: "Unassigned · Released" }]);
    $("fReasonWrap").hidden = App.can("leads.viewUnassigned") === "None";
    syncControls();
  }
  function syncControls() {
    $("fStage").value = S.stage; $("fSearch").value = S.search;
    $("fOwner").value = $("mOwner").value = S.owner;
    $("fSource").value = $("mSource").value = S.source;
    $("fBranch").value = $("mBranch").value = S.branch;
    $("fTemp").value = S.temp; $("fFollow").value = S.follow;
    $("fFrom").value = S.from; $("fTo").value = S.to; $("fSynced").checked = S.synced;
    $("fReason").value = S.reason; $("fTransferred").checked = S.transferred;
    App.syncAllSelects(document.querySelector(".main"));
  }

  function renderPipeline(base) {
    var cards = [{ key: "attention", label: "Needs attention", n: base.filter(needsAttention).length }]
      .concat(L.stages.concat(["Lost"]).map(function (s) {
        return { key: s, label: s, n: base.filter(function (p) { return p.stage === s; }).length };
      }));
    $("pipeline").innerHTML = cards.map(function (c) {
      var sel = c.key === "attention" ? S.attention : (!S.attention && S.stage === c.key);
      return '<button class="pipe-card' + (c.key === "attention" ? " attention" : "") + (sel ? " selected" : "") +
        '" data-card="' + esc(c.key) + '" aria-pressed="' + sel + '"><span class="count">' + c.n + '</span><span class="label">' +
        esc(c.label) + (c.key === "attention" ? " · overdue or not set" : "") + "</span></button>";
    }).join("");
  }

  function renderActiveFilters() {
    var tags = [];
    if (S.attention) tags.push(["attention", "Needs attention"]);
    if (S.stage) tags.push(["stage", "Stage: " + S.stage]);
    if (S.search) tags.push(["search", 'Search: "' + S.search + '"']);
    if (S.owner) tags.push(["owner", "Owner: " + (S.owner === "none" ? "Unassigned" : user(S.owner).name)]);
    if (S.source) tags.push(["source", "Source: " + S.source]);
    if (S.temp) tags.push(["temp", "Temperature: " + S.temp]);
    if (S.follow) tags.push(["follow", "Follow-up: " + S.follow]);
    if (S.from) tags.push(["from", "Created from " + S.from]);
    if (S.to) tags.push(["to", "Created to " + S.to]);
    if (S.synced) tags.push(["synced", "Synced only"]);
    if (S.reason) tags.push(["reason", "Unassigned · " + S.reason]);
    if (S.transferred) tags.push(["transferred", "Transferred in · needs follow-up person"]);
    $("activeFilters").innerHTML = tags.length ? '<span class="muted">Filtered by:</span>' + tags.map(function (t) {
      return '<button class="filter-tag" data-clear="' + t[0] + '" aria-label="Remove filter ' + esc(t[1]) + '">' + esc(t[1]) + App.icon("x", "ico-sm") + "</button>";
    }).join("") : "";
  }

  // ---------- render: rows ----------
  function followCell(p) {
    if (p.stage === "Lost") return '<span class="muted">— (lost lead)</span>';
    var f = nextFollowUp(p.id), st = App.followUpStatus(f && App.dueIso(f));
    if (!f) return '<span class="badge badge-danger">Not set yet</span><div class="cell-sub">Add a follow-up</div>';
    var label;
    if (st.cls === "red") { var d = -daysBetween(new Date(), App.dueIso(f)); label = "Overdue · " + (d === 1 ? "1 day" : d + " days"); }
    else if (st.cls === "amber") label = "Due today · " + App.dueTimeText(f);
    else {
      var ahead = daysBetween(new Date(), App.dueIso(f));
      label = "Scheduled · " + (ahead === 1 ? "Tomorrow" : ahead < 7 ? new Date(App.dueIso(f)).toLocaleDateString("en-IN", { weekday: "short" }) : shortDate(App.dueIso(f)));
    }
    return '<div class="when">' + esc(shortDate(App.dueIso(f))) + ", " + esc(App.dueTimeText(f)) + "</div>" +
      '<div class="stack"><span class="badge ' + st.badge + '">' + esc(label) + '</span><span class="cell-sub">' + esc(f.type) + "</span></div>";
  }
  function stageCell(p) {
    var cls = p.stage === "Lost" ? "badge-danger" : p.stage === "Trial" ? "badge-info" : "";
    var html = '<div class="stack"><span class="badge ' + cls + '">' + esc(p.stage) + '</span><span class="badge badge-' +
      p.temperature.toLowerCase() + '">' + esc(p.temperature) + "</span>";
    if (p.reopenedAt) html += '<span class="badge badge-info">Re-opened</span>';
    html += App.ownershipBadges(p, { noUnassigned: true });
    html += "</div>";
    if (p.stage === "Lost") html += '<div class="cell-sub">Reason: ' + esc(App.empty(p.lostReason)) + "</div>";
    App.Trial.lines(p).forEach(function (l) {
      html += '<div class="cell-sub">' + (l.running ? esc(l.text) + (l.t.approval !== "Approved" ? " · " + esc(l.t.approval) : "") : '<span class="badge badge-warning">Trial ended</span>') + "</div>";
    });
    return html;
  }
  // Unassigned (#100): reason + "Take this lead" (leads.take) and / or Assign (leads.assign). Lost leads keep their owner.
  function canAssign(p) { return App.scopeAllows("leads.assign", p, { strictOwn: true }); }
  function ownerCell(p) {
    if (p.ownerUserId) return esc(user(p.ownerUserId).name);
    return '<div class="stack"><span class="badge badge-warning">Unassigned · ' + esc(p.unassignedReason || "New") + "</span>" +
      (App.Lead.canTake(p) ? '<button class="btn btn-sm btn-primary" data-act="take" data-id="' + p.id + '">Take this lead</button>' : "") +
      (canAssign(p) ? '<button class="btn btn-sm" data-act="assign" data-id="' + p.id + '">Assign</button>' : "") + "</div>";
  }
  // Bulk owner change (#99): a tick in the name cell for staff with leads.assign; one dialog, one choice for all.
  function bulkOn() { return App.can("leads.assign") !== "None"; }
  function checkCell(p) {
    if (!bulkOn() || !canAssign(p)) return "";
    return '<input type="checkbox" class="row-check" data-check="' + p.id + '"' + (S.sel[p.id] ? " checked" : "") + ' aria-label="Select ' + esc(p.name) + '">';
  }
  function renderBulk(list) {
    Object.keys(S.sel).forEach(function (id) { if (list.indexOf(id) < 0) delete S.sel[id]; });
    var n = Object.keys(S.sel).length, bar = $("bulkBar");
    bar.hidden = !n;
    bar.innerHTML = n ? "<strong>" + n + " selected</strong>" +
      '<button class="btn btn-sm btn-primary" data-bulk="owner">' + App.icon("user") + "Change owner</button>" +
      '<button class="btn btn-sm btn-ghost" data-bulk="clear">Clear selection</button>' : "";
  }
  function row(p) {
    return '<tr data-id="' + p.id + '">' +
      '<td class="sticky-1"><div class="stack">' + checkCell(p) + '<span class="cell-title">' + esc(p.name) + "</span>" +
        (p.synced ? '<span class="badge badge-info" title="Synced from Meta">Meta</span>' : "") + "</div>" +
        '<div class="cell-sub">' + esc(p.cc + " " + p.mobile) + "</div></td>" +
      '<td class="sticky-2 col-next">' + followCell(p) + "</td>" +
      "<td>" + stageCell(p) + "</td>" +
      "<td>" + esc(p.source) + "</td>" +
      "<td>" + ownerCell(p) + "</td>" +
      '<td class="col-branch">' + esc(branch(p.branchId)) + "</td>" +
      "<td>" + lastActivity(p.lastActivityAt) + "</td>" +
      '<td><div class="row-actions">' +
        '<button class="btn btn-sm icon-btn" data-act="call" data-id="' + p.id + '" title="Call" aria-label="Call ' + esc(p.name) + '">' + App.icon("phone") + "</button>" +
        '<button class="btn btn-sm icon-btn" data-act="wa" data-id="' + p.id + '" title="WhatsApp" aria-label="WhatsApp ' + esc(p.name) + '">' + App.icon("message") + "</button>" +
        (p.stage === "Lost"
          ? '<button class="btn btn-sm" disabled title="Re-open the lead first" aria-label="Follow-up (re-open the lead first)">' + App.icon("plus") + "Follow-up</button>"
          : '<button class="btn btn-sm" data-act="follow" data-id="' + p.id + '">' + App.icon("plus") + "Follow-up</button>") +
      "</div></td></tr>";
  }

  function render() {
    $("errorBanner").hidden = S.mode !== "error";
    document.querySelector(".table").classList.toggle("hide-branch", S.branch !== "all");
    var box = $("stateBox"), tbody = $("rows");
    box.innerHTML = "";

    if (S.mode === "loading") {
      tbody.innerHTML = [1, 2, 3, 4, 5].map(function () {
        return '<tr class="loading-row">' + '<td colspan="8"><div class="skeleton"></div></td></tr>';
      }).join("");
      $("pipeline").innerHTML = ""; $("leadCount").textContent = "Loading…";
      return;
    }
    if (S.mode === "error") { tbody.innerHTML = ""; $("pipeline").innerHTML = ""; $("leadCount").textContent = ""; return; }

    var base = baseLeads(), list = sortLeads(applyCards(base));
    renderPipeline(scopeLeads()); renderActiveFilters();
    $("leadCount").textContent = list.length + (list.length === 1 ? " lead" : " leads") +
      (S.stage === "Lost" ? " · lost" : " · most urgent follow-up first");
    lastList = list.map(function (p) { return p.id; });
    tbody.innerHTML = list.map(row).join("");
    renderBulk(lastList);
    if (list.length) return;

    var anyVisible = S.mode !== "empty" && App.visibleLeads("all").length > 0;
    if (S.mode === "empty" || (!anyVisible && App.can("leads.view") !== "None")) {
      box.innerHTML = '<div class="state"><h3>No leads yet</h3><p>Add your first lead to start following up.</p>' +
        '<button class="btn btn-primary" data-new-lead>' + App.icon("plus") + "Lead</button></div>";
    } else if (!anyVisible) {
      box.innerHTML = '<div class="state"><h3>No leads assigned to you</h3><p>Viewing as ' + esc(App.state.role) + ".</p></div>";
    } else {
      var create = isPhoneLike(S.search) ? '<button class="btn btn-primary" data-create-number>Create lead with this number</button>' : "";
      box.innerHTML = '<div class="state"><h3>No leads match these filters</h3><p>Try fewer filters or a different search.</p>' +
        '<div class="stack center"><button class="btn" id="btnClear2">Clear filters</button>' + create + "</div></div>";
    }
  }

  function load() {
    S.mode = "loading"; render();
    setTimeout(function () { if (S.mode === "loading") { S.mode = "normal"; render(); } }, 400);
  }

  // ---------- profile drawer + follow-up / assign flows come from shared/profile.js + shared/followup.js ----------
  var lastList = [];
  function openProfile(id) { App.openProfile(id, { list: lastList.indexOf(id) > -1 ? lastList : [id] }); }

  // ---------- events ----------
  $("rows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (b) {
      var p = App.byId(D.people, b.dataset.id);
      if (b.dataset.act === "call") App.toast("Calling " + p.name + " · " + p.cc + " " + p.mobile, "");
      if (b.dataset.act === "wa") App.toast("Opening WhatsApp for " + p.name, "");
      if (b.dataset.act === "follow") App.Followup.openAdd(p.id);
      if (b.dataset.act === "assign") App.Lead.assign(p.id);
      if (b.dataset.act === "take") App.Lead.take(p.id);
      return;
    }
    var c = e.target.closest("[data-check]");
    if (c) { if (c.checked) S.sel[c.dataset.check] = true; else delete S.sel[c.dataset.check]; renderBulk(lastList); return; }
    var tr = e.target.closest("tr[data-id]"); if (tr) openProfile(tr.dataset.id);
  });
  $("pipeline").addEventListener("click", function (e) {
    var c = e.target.closest("[data-card]"); if (!c) return;
    var k = c.dataset.card;
    if (k === "attention") { S.attention = !S.attention; S.stage = ""; }
    else { S.attention = false; S.stage = S.stage === k ? "" : k; }
    syncControls(); render();
  });
  $("activeFilters").addEventListener("click", function (e) {
    var t = e.target.closest("[data-clear]"); if (!t) return;
    var k = t.dataset.clear;
    if (k === "attention" || k === "synced" || k === "transferred") S[k] = false; else S[k] = "";
    syncControls(); render();
  });
  function bind(id, key, ev) {
    $(id).addEventListener(ev || "change", function () {
      S[key] = this.type === "checkbox" ? this.checked : this.value;
      if (key === "stage") S.attention = false;
      syncControls(); render();
    });
  }
  bind("fSearch", "search", "input"); bind("fStage", "stage");
  bind("fOwner", "owner"); bind("mOwner", "owner"); bind("fSource", "source"); bind("mSource", "source");
  bind("fBranch", "branch"); bind("mBranch", "branch");
  bind("fReason", "reason"); bind("fTransferred", "transferred");
  $("bulkBar").addEventListener("click", function (e) {
    var b = e.target.closest("[data-bulk]"); if (!b) return;
    if (b.dataset.bulk === "clear") { S.sel = {}; render(); return; }
    var ids = Object.keys(S.sel); S.sel = {};
    App.Lead.assignMany(ids);
  });
  bind("fTemp", "temp"); bind("fFollow", "follow"); bind("fFrom", "from"); bind("fTo", "to"); bind("fSynced", "synced");
  $("btnMore").addEventListener("click", function () { $("moreFilters").classList.toggle("open"); });
  function clearAll() {
    S.stage = ""; S.attention = false; S.search = ""; S.owner = ""; S.source = ""; S.temp = ""; S.follow = "";
    S.from = ""; S.to = ""; S.synced = false; S.reason = ""; S.transferred = false; S.sel = {}; S.branch = App.state.branchId; syncControls(); render();
  }
  $("btnClear").addEventListener("click", clearAll);
  $("btnRetry").addEventListener("click", load);
  document.addEventListener("click", function (e) {
    if (e.target.closest("#btnClear2")) clearAll();
    if (e.target.closest("[data-create-number]")) App.QuickLead.open({ mobile: S.search.trim() });
  });
  document.addEventListener("mock:context", function (e) { S.branch = e.detail.branchId; syncControls(); render(); });
  App.openLead = openProfile; // used by the command palette
  document.addEventListener("mock:data", function () { if (S.mode === "normal") render(); });

  // Debug states: only with ?debug
  if (App.isDebug()) {
    $("debugBar").hidden = false;
    $("debugBar").addEventListener("click", function (e) {
      var b = e.target.closest("[data-state]"); if (!b) return;
      var m = b.dataset.state;
      if (m === "loading") { S.mode = "loading"; render(); }
      else { S.mode = m; render(); }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillFilters();
    ["fStage", "fOwner", "fSource", "fBranch", "mOwner", "mSource", "mBranch", "fTemp", "fFollow", "fReason"].forEach(function (id) { App.enhanceSelect($(id)); });
    load();
  });
})();
