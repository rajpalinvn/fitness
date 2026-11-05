/* Leads list mockup. Reads only window.DUMMY; changes stay in memory (reset on reload). */
(function () {
  var D = window.DUMMY, L = D.lists;
  var $ = function (id) { return document.getElementById(id); };
  var esc = App.esc;

  // Role visibility, next follow-up and "needs attention" come from app.js,
  // so the sidebar badges and this list always use the same rule.
  var nextFollowUp = App.nextFollowUp, needsAttention = App.needsAttention;
  var ASSIGNABLE_ROLES = ["Sales Executive", "Sales Manager", "Club Manager"];

  var S = { stage: "", attention: false, search: "", owner: "", source: "", branch: App.state.branchId,
    temp: "", follow: "", from: "", to: "", synced: false, mode: "loading" };
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
      if (S.owner === "none" && p.ownerId) return false;
      if (S.owner && S.owner !== "none" && p.ownerId !== S.owner) return false;
      if (S.source && p.source !== S.source) return false;
      if (S.temp && p.temperature !== S.temp) return false;
      if (S.synced && !p.synced) return false;
      if (S.from && new Date(p.createdAt) < new Date(S.from)) return false;
      if (S.to && new Date(p.createdAt) > new Date(S.to + "T23:59:59")) return false;
      if (S.follow) {
        var f = nextFollowUp(p.id), st = App.followUpStatus(f && f.dueAt).text;
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
    var c = App.followUpStatus(f.dueAt).cls;
    return [c === "red" ? 0 : c === "amber" ? 2 : 3, new Date(f.dueAt).getTime()];
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
    var owners = D.users.filter(function (u) { return D.people.some(function (p) { return p.ownerId === u.id && p.type === "Lead"; }); })
      .map(function (u) { return { v: u.id, t: u.name }; }).concat([{ v: "none", t: "Unassigned" }]);
    ["fOwner", "mOwner"].forEach(function (id) { opts($(id), "All owners", owners); });
    ["fSource", "mSource"].forEach(function (id) { opts($(id), "All sources", L.sources); });
    ["fBranch", "mBranch"].forEach(function (id) {
      var sel = $(id);
      sel.innerHTML = '<option value="all">All branches</option>' + D.branches.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + "</option>"; }).join("");
    });
    opts($("fTemp"), "Any", L.temperatures);
    opts($("fFollow"), "Any", ["Overdue", "Due today", "Scheduled", "No follow-up set"]);
    syncControls();
  }
  function syncControls() {
    $("fStage").value = S.stage; $("fSearch").value = S.search;
    $("fOwner").value = $("mOwner").value = S.owner;
    $("fSource").value = $("mSource").value = S.source;
    $("fBranch").value = $("mBranch").value = S.branch;
    $("fTemp").value = S.temp; $("fFollow").value = S.follow;
    $("fFrom").value = S.from; $("fTo").value = S.to; $("fSynced").checked = S.synced;
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
    $("activeFilters").innerHTML = tags.length ? '<span class="muted">Filtered by:</span>' + tags.map(function (t) {
      return '<button class="filter-tag" data-clear="' + t[0] + '" aria-label="Remove filter ' + esc(t[1]) + '">' + esc(t[1]) + App.icon("x", "ico-sm") + "</button>";
    }).join("") : "";
  }

  // ---------- render: rows ----------
  function followCell(p) {
    if (p.stage === "Lost") return '<span class="muted">— (lost lead)</span>';
    var f = nextFollowUp(p.id), st = App.followUpStatus(f && f.dueAt);
    if (!f) return '<span class="badge badge-danger">Not set yet</span><div class="cell-sub">Add a follow-up</div>';
    var label;
    if (st.cls === "red") { var d = -daysBetween(new Date(), f.dueAt); label = "Overdue · " + (d === 1 ? "1 day" : d + " days"); }
    else if (st.cls === "amber") label = "Due today · " + time(f.dueAt);
    else {
      var ahead = daysBetween(new Date(), f.dueAt);
      label = "Scheduled · " + (ahead === 1 ? "Tomorrow" : ahead < 7 ? new Date(f.dueAt).toLocaleDateString("en-IN", { weekday: "short" }) : shortDate(f.dueAt));
    }
    return '<div class="when">' + esc(shortDate(f.dueAt)) + ", " + esc(time(f.dueAt)) + "</div>" +
      '<div class="stack"><span class="badge ' + st.badge + '">' + esc(label) + '</span><span class="cell-sub">' + esc(f.type) + "</span></div>";
  }
  function stageCell(p) {
    var cls = p.stage === "Lost" ? "badge-danger" : p.stage === "Trial" ? "badge-info" : "";
    var html = '<div class="stack"><span class="badge ' + cls + '">' + esc(p.stage) + '</span><span class="badge badge-' +
      p.temperature.toLowerCase() + '">' + esc(p.temperature) + "</span>";
    if (p.reopenedAt) html += '<span class="badge badge-info">Re-opened</span>';
    html += "</div>";
    if (p.stage === "Lost") html += '<div class="cell-sub">Reason: ' + esc(App.empty(p.lostReason)) + "</div>";
    if (p.freeTrial) {
      var left = daysBetween(new Date(), p.freeTrial.to);
      html += '<div class="cell-sub">Free trial · ' + (left > 0 ? "ends in " + left + (left === 1 ? " day" : " days") : "ended") + "</div>";
    }
    return html;
  }
  function ownerCell(p) {
    if (p.ownerId) return esc(user(p.ownerId).name);
    return '<div class="stack"><span class="badge badge-warning">Unassigned</span>' +
      '<button class="btn btn-sm" data-act="assign" data-id="' + p.id + '">Assign</button></div>';
  }
  function row(p) {
    return '<tr data-id="' + p.id + '">' +
      '<td class="sticky-1"><div class="stack"><span class="cell-title">' + esc(p.name) + "</span>" +
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
        '<button class="btn btn-sm" data-act="follow" data-id="' + p.id + '">' + App.icon("plus") + "Follow-up</button>" +
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
    tbody.innerHTML = list.map(row).join("");
    if (list.length) return;

    var anyVisible = S.mode !== "empty" && App.visibleLeads("all").length > 0;
    if (S.mode === "empty" || (!anyVisible && App.state.role !== "Trainer" && App.state.role !== "MXM")) {
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

  // ---------- drawer (placeholder) ----------
  function nextStepBox(p) {
    if (p.stage === "Lost") return '<div class="next-step grey"><strong>Lost</strong> · ' + esc(App.empty(p.lostReason)) + '<div class="cell-sub">Re-open from the full profile.</div></div>';
    var f = nextFollowUp(p.id), st = App.followUpStatus(f && f.dueAt);
    var text = !f ? "<strong>No follow-up set</strong><div class=\"cell-sub\">Add one so this lead isn't forgotten.</div>"
      : st.cls === "red" ? "<strong>Overdue</strong> · " + esc(f.type) + " was due " + esc(shortDate(f.dueAt)) + ", " + esc(time(f.dueAt))
      : st.cls === "amber" ? "<strong>Due today</strong> · " + esc(f.type) + " at " + esc(time(f.dueAt))
      : "<strong>Next:</strong> " + esc(f.type) + " on " + esc(shortDate(f.dueAt)) + ", " + esc(time(f.dueAt));
    return '<div class="next-step ' + st.cls + '">' + text + "</div>";
  }
  function openDrawer(id) {
    var p = App.byId(D.people, id); current.personId = id;
    $("dName").textContent = p.name;
    $("dBody").innerHTML =
      '<div class="drawer-cols"><div>' +
        '<div class="cell-sub">' + esc(p.cc + " " + p.mobile) + " · " + esc(branch(p.branchId)) + "</div>" +
        '<div class="stack drawer-badges"><span class="badge badge-info">Lead</span>' +
          '<span class="badge">' + esc(p.stage) + '</span><span class="badge badge-' + p.temperature.toLowerCase() + '">' + esc(p.temperature) + "</span>" +
          (p.synced ? '<span class="badge badge-info">Meta</span>' : "") + "</div>" +
        nextStepBox(p) +
        '<dl class="kv mt-4"><dt>Owner</dt><dd>' + (p.ownerId ? esc(user(p.ownerId).name) : "Not set yet") + "</dd>" +
          "<dt>Source</dt><dd>" + esc(p.source) + "</dd><dt>Email</dt><dd>" + esc(App.empty(p.email, "Not set yet")) + "</dd>" +
          "<dt>Created</dt><dd>" + esc(App.formatDate(p.createdAt)) + "</dd></dl>" +
      '</div><div class="state"><h3>Full profile coming next</h3><p>Tabs, timeline and actions are built in the Profile drawer screen.</p></div></div>';
    App.openDrawer("profileDrawer");
  }

  // ---------- assign modal ----------
  function openAssign(id) {
    var p = App.byId(D.people, id); current.personId = id;
    $("assignFor").textContent = p.name + " · " + branch(p.branchId);
    var staff = D.users.filter(function (u) { return u.branches.indexOf(p.branchId) > -1 && ASSIGNABLE_ROLES.indexOf(u.role) > -1; });
    $("assignUser").innerHTML = '<option value="">Choose…</option>' + staff.map(function (u) {
      return '<option value="' + u.id + '">' + esc(u.name) + " · " + esc(u.role) + "</option>";
    }).join("");
    App.openModal("assignModal");
  }
  $("assignSave").addEventListener("click", function () {
    var uid = $("assignUser").value;
    if (!uid) { $("assignUser").classList.add("invalid"); return; }
    $("assignUser").classList.remove("invalid");
    var p = App.byId(D.people, current.personId); p.ownerId = uid;
    D.followUps.forEach(function (f) { if (f.personId === p.id && f.status === "Open") f.ownerId = uid; });
    App.close($("assignModal")); render(); App.dataChanged();
    App.toast(p.name + " assigned to " + user(uid).name, "success");
  });

  // ---------- follow-up modal (placeholder) ----------
  var chosenType = "";
  function openFollow(id) {
    var p = App.byId(D.people, id); current.personId = id; chosenType = "";
    $("followFor").textContent = p.name + " · owner " + (p.ownerId ? user(p.ownerId).name : "not set yet");
    $("followTypes").innerHTML = L.followUpTypes.map(function (t) { return '<button class="chip" data-type="' + esc(t) + '">' + esc(t) + "</button>"; }).join("");
    var t = new Date(); t.setDate(t.getDate() + 1);
    $("followDate").value = t.toISOString().slice(0, 10); $("followTime").value = "11:00"; $("followNote").value = "";
    App.openModal("followModal");
  }
  $("followTypes").addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    chosenType = c.dataset.type;
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle("selected", x === c); });
  });
  $("followSave").addEventListener("click", function () {
    if (!chosenType || !$("followDate").value) { App.toast("Choose a type and a date", "error"); return; }
    var p = App.byId(D.people, current.personId);
    var due = new Date($("followDate").value + "T" + ($("followTime").value || "11:00"));
    D.followUps.push({ id: "f" + Date.now(), personId: p.id, type: chosenType, dueAt: due.toISOString(),
      ownerId: p.ownerId, status: "Open", outcome: null, note: $("followNote").value || null });
    App.close($("followModal")); render(); App.dataChanged();
    App.toast("Follow-up added for " + p.name + " · " + shortDate(due) + ", " + time(due), "success");
  });

  // ---------- events ----------
  $("rows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (b) {
      var p = App.byId(D.people, b.dataset.id);
      if (b.dataset.act === "call") App.toast("Calling " + p.name + " · " + p.cc + " " + p.mobile, "");
      if (b.dataset.act === "wa") App.toast("Opening WhatsApp for " + p.name, "");
      if (b.dataset.act === "follow") openFollow(p.id);
      if (b.dataset.act === "assign") openAssign(p.id);
      return;
    }
    var tr = e.target.closest("tr[data-id]"); if (tr) openDrawer(tr.dataset.id);
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
    if (k === "attention" || k === "synced") S[k] = false; else S[k] = "";
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
  bind("fTemp", "temp"); bind("fFollow", "follow"); bind("fFrom", "from"); bind("fTo", "to"); bind("fSynced", "synced");
  $("btnMore").addEventListener("click", function () { $("moreFilters").classList.toggle("open"); });
  function clearAll() {
    S.stage = ""; S.attention = false; S.search = ""; S.owner = ""; S.source = ""; S.temp = ""; S.follow = "";
    S.from = ""; S.to = ""; S.synced = false; S.branch = App.state.branchId; syncControls(); render();
  }
  $("btnClear").addEventListener("click", clearAll);
  $("btnRetry").addEventListener("click", load);
  document.addEventListener("click", function (e) {
    if (e.target.closest("#btnClear2")) clearAll();
    if (e.target.closest("[data-create-number]")) App.toast("Quick lead form will open with " + S.search.trim() + " prefilled (later screen)", "");
  });
  document.addEventListener("mock:context", function (e) { S.branch = e.detail.branchId; syncControls(); render(); });
  App.openLead = openDrawer; // used by the command palette

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

  document.addEventListener("DOMContentLoaded", function () { fillFilters(); load(); });
})();
