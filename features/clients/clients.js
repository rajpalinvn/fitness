/* Clients list (decision #91). Same list-first pattern as Leads. Reads only window.DUMMY.
   Cards count role + top-bar branch only. "Needs attention" = any pending item, same helpers as Today (#61, #67, #82). */
(function () {
  var D = window.DUMMY, esc = App.esc;
  var $ = function (id) { return document.getElementById(id); };
  var CARDS = [["attention", "Needs attention", "pending items"], ["active", "Active", "more than 15 days left"], ["renewal", "Renewal due", "15 days or fewer"],
    ["expired", "Expired", "incl. trial ended"], ["trial", "Paid trial", "running"]];
  var PENDING_TYPES = [["addFf", "FF ID pending"], ["goFob", "Key fob pending"], ["issue", "Pending issue"], ["pay", "Payment due"]];
  var S = { card: "", search: "", rep: "", branch: App.state.branchId, pending: "", from: "", to: "", pt: false, bal: false, mode: "loading" };
  if (/[?&]view=attention\b/.test(location.search)) S.card = "attention";
  var lastList = [];

  // ---------- data helpers ----------
  function noLeadsRole() { return App.state.role === "Trainer" || App.state.role === "MXM"; }
  // Status (#27, #31): Active > 15 days left, Renewal due <= 15, Expired. Paid trial that ended = "Trial ended" (Q26), counted as Expired.
  function status(p) {
    var ms = App.membershipStatus(p.membership), trial = p.membership.saleType === "Trial Paid";
    if (ms.cls === "red") return { key: "expired", text: trial ? "Trial ended" : "Expired", badge: "badge-danger", left: ms.left };
    if (ms.cls === "amber") return { key: "renewal", text: "Renewal due", badge: "badge-warning", left: ms.left };
    return { key: "active", text: "Active", badge: "badge-success", left: ms.left };
  }
  function isTrial(p) { return p.membership.saleType === "Trial Paid" && status(p).key !== "expired"; }
  function balances(p) {
    return [["membership", p.membership], ["pt", p.pt]].filter(function (x) { return x[1] && App.payBalance(x[1].payment); })
      .map(function (x) { return { what: x[0], amount: App.payBalance(x[1].payment), due: x[1].payment.dueDate }; });
  }
  function scope() { return S.mode === "empty" ? [] : App.visibleClients(S.branch).filter(function (p) { return p.membership; }); }
  function base() {
    var q = S.search.trim().toLowerCase(), qd = App.mobileDigits(q);
    return scope().filter(function (p) {
      if (q) {
        var hit = [p.name, p.email, p.clientNo, p.ffId, p.keyFob].some(function (v) { return (v || "").toLowerCase().indexOf(q) > -1; });
        if (!hit && qd.length >= 3) hit = App.mobileDigits(p.cc + p.mobile).indexOf(qd) > -1;   // mobile rule #11
        if (!hit) return false;
      }
      if (S.rep && p.membership.salesRepUserId !== S.rep) return false;
      if (S.pt && !p.pt) return false;
      if (S.bal && !balances(p).length) return false;
      if (S.pending && !App.profilePending(p).some(function (i) { return i.k === S.pending; })) return false;
      if (S.from && new Date(p.joinedAt) < new Date(S.from + "T00:00")) return false;
      if (S.to && new Date(p.joinedAt) > new Date(S.to + "T23:59:59")) return false;
      return true;
    });
  }
  function inCard(p, k) {
    if (k === "attention") return App.clientNeedsAttention(p);
    if (k === "trial") return isTrial(p);
    return status(p).key === k;
  }
  function applyCard(list) {
    return list.filter(function (p) { return S.card ? inCard(p, S.card) : status(p).key !== "expired"; });   // default: Active + Renewal due
  }
  // Sort: needs attention first, then fewest days left.
  function sortList(list) {
    return list.sort(function (a, b) {
      return (App.clientNeedsAttention(b) ? 1 : 0) - (App.clientNeedsAttention(a) ? 1 : 0) || status(a).left - status(b).left;
    });
  }

  // ---------- filters ----------
  function opts(sel, first, items, firstVal) {
    var v = sel.value;
    sel.innerHTML = '<option value="' + (firstVal || "") + '">' + first + "</option>" + items.map(function (i) { return '<option value="' + esc(i[0]) + '">' + esc(i[1]) + "</option>"; }).join("");
    sel.value = v;
  }
  function fillFilters() {
    opts($("fStatus"), "Active + Renewal due", CARDS.map(function (c) { return [c[0], c[1]]; }));
    var reps = D.users.filter(function (u) { return D.people.some(function (p) { return p.membership && p.membership.salesRepUserId === u.id; }); }).map(function (u) { return [u.id, u.name]; });
    ["fRep", "mRep"].forEach(function (id) { opts($(id), "All sales reps", reps); });
    ["fBranch", "mBranch"].forEach(function (id) { opts($(id), "All branches", D.branches.map(function (b) { return [b.id, b.name]; }), "all"); });
    opts($("fPending"), "Any", PENDING_TYPES);
    syncControls();
  }
  function syncControls() {
    $("fStatus").value = S.card; $("fSearch").value = S.search;
    $("fRep").value = $("mRep").value = S.rep; $("fBranch").value = $("mBranch").value = S.branch || "all";
    $("fPending").value = S.pending; $("fFrom").value = S.from; $("fTo").value = S.to; $("fPt").checked = S.pt; $("fBal").checked = S.bal;
    [$("fFrom"), $("fTo")].forEach(function (i) { if (i._syncDate) i._syncDate(); });
    App.syncAllSelects(document.querySelector(".main"));
  }
  function renderPipeline(list) {
    $("pipeline").innerHTML = CARDS.map(function (c) {
      var n = list.filter(function (p) { return inCard(p, c[0]); }).length, sel = S.card === c[0];
      return '<button class="pipe-card' + (c[0] === "attention" ? " attention" : "") + (sel ? " selected" : "") + '" data-card="' + c[0] + '" aria-pressed="' + sel + '">' +
        '<span class="count">' + n + '</span><span class="label">' + c[1] + ' <span class="cell-sub">· ' + c[2] + "</span></span></button>";
    }).join("");
  }
  function renderActiveFilters() {
    var t = [];
    if (S.card) t.push(["card", CARDS.filter(function (c) { return c[0] === S.card; })[0][1]]);
    if (S.search) t.push(["search", 'Search: "' + S.search + '"']);
    if (S.rep) t.push(["rep", "Sales rep: " + App.userName(S.rep)]);
    if (S.pending) t.push(["pending", "Pending: " + PENDING_TYPES.filter(function (x) { return x[0] === S.pending; })[0][1]]);
    if (S.from) t.push(["from", "Joined from " + App.fmtIsoDate(S.from)]);
    if (S.to) t.push(["to", "Joined to " + App.fmtIsoDate(S.to)]);
    if (S.pt) t.push(["pt", "Has PT"]);
    if (S.bal) t.push(["bal", "Balance due"]);
    $("activeFilters").innerHTML = t.length ? '<span class="muted">Filtered by:</span>' + t.map(function (x) {
      return '<button class="filter-tag" data-clear="' + x[0] + '" aria-label="Remove filter ' + esc(x[1]) + '">' + esc(x[1]) + App.icon("x", "ico-sm") + "</button>";
    }).join("") : "";
  }

  // ---------- rows ----------
  function endsCell(p) {
    var st = status(p), left = st.left;
    return '<div class="when">' + esc(App.fmtDate(p.membership.end)) + "</div>" +
      '<span class="badge ' + st.badge + '">' + (left < 0 ? "Expired " + (-left === 1 ? "1 day" : -left + " days") + " ago" : left === 0 ? "Ends today" : left + (left === 1 ? " day" : " days") + " left") + "</span>";
  }
  function ptCell(p) {
    if (!p.pt) return '<span class="muted">—</span>';
    var t = p.pt, un = App.ptUnlocked(t.price, t.discount, t.sessions, t.payment ? t.payment.paid : 0);
    return esc(t.package) + '<div class="cell-sub">' + un + " of " + t.sessions + " unlocked</div>";
  }
  function balCell(p) {
    var b = balances(p); if (!b.length) return '<span class="muted">—</span>';
    return b.map(function (x) {
      return '<div class="bal-line"><strong>' + App.fmtMoney(x.amount) + "</strong>" + (x.due ? ' <span class="cell-sub">by ' + esc(App.fmtIsoDate(x.due)) + "</span>" : "") +
        (x.what === "pt" ? ' <span class="cell-sub">· PT</span>' : "") + "</div>";
    }).join("");
  }
  function pendCell(p) {
    var items = App.profilePending(p); if (!items.length) return '<span class="muted">—</span>';
    return '<div class="stack">' + items.map(function (i) {
      var label = i.k === "pay" ? "Payment due" + (i.itemId === "pt" ? " · PT" : "") : i.t;
      return '<span class="badge badge-warning">' + esc(label) + "</span>";
    }).join("") + "</div>";
  }
  function row(p) {
    var st = status(p), b = balances(p);
    return '<tr data-id="' + p.id + '">' +
      '<td class="sticky-1"><div class="stack"><span class="cell-title">' + esc(p.name) + "</span>" + (p.synced ? '<span class="badge badge-info" title="Synced from Meta">Meta</span>' : "") + "</div>" +
        '<div class="cell-sub">' + esc(p.cc + " " + p.mobile) + " · " + esc(p.clientNo) + "</div></td>" +
      '<td class="sticky-2 col-next">' + endsCell(p) + "</td>" +
      "<td>" + esc(p.membership.package) + '<div><span class="badge ' + st.badge + '">' + esc(st.text) + "</span></div></td>" +
      "<td>" + ptCell(p) + "</td><td>" + balCell(p) + "</td><td>" + pendCell(p) + "</td>" +
      "<td>" + esc(App.userName(p.membership.salesRepUserId)) + "</td>" +
      '<td class="col-branch">' + esc(App.branchName(p.branchId)) + "</td>" +
      '<td><div class="row-actions">' +
        '<button class="btn btn-sm icon-btn" data-act="call" data-id="' + p.id + '" title="Call" aria-label="Call ' + esc(p.name) + '">' + App.icon("phone") + "</button>" +
        '<button class="btn btn-sm icon-btn" data-act="wa" data-id="' + p.id + '" title="WhatsApp" aria-label="WhatsApp ' + esc(p.name) + '">' + App.icon("message") + "</button>" +
        (b.length ? '<button class="btn btn-sm btn-primary" data-act="pay" data-id="' + p.id + '" data-what="' + b[0].what + '">Collect payment</button>'
          : '<button class="btn btn-sm" data-act="follow" data-id="' + p.id + '">' + App.icon("plus") + "Follow-up</button>") +
      "</div></td></tr>";
  }

  function render() {
    $("errorBanner").hidden = S.mode !== "error";
    $("clientTable").classList.toggle("hide-branch", S.branch !== "all");
    var box = $("stateBox"), tbody = $("rows"); box.innerHTML = "";
    if (S.mode === "loading") {
      tbody.innerHTML = [1, 2, 3, 4, 5].map(function () { return '<tr class="loading-row"><td colspan="9"><div class="skeleton"></div></td></tr>'; }).join("");
      $("pipeline").innerHTML = ""; $("clientCount").textContent = "Loading…"; return;
    }
    if (S.mode === "error") { tbody.innerHTML = ""; $("pipeline").innerHTML = ""; $("clientCount").textContent = ""; return; }
    if (noLeadsRole()) {
      tbody.innerHTML = ""; $("pipeline").innerHTML = ""; $("clientCount").textContent = ""; $("activeFilters").innerHTML = "";
      box.innerHTML = '<div class="state"><h3>Clients aren\'t part of your role</h3><p class="muted">Viewing as ' + esc(App.state.role) +
        '. <span class="badge badge-demo">Placeholder</span> until the permission matrix.</p></div>';
      return;
    }
    var sc = scope(), list = sortList(applyCard(base()));
    renderPipeline(sc); renderActiveFilters();
    $("clientCount").textContent = list.length + (list.length === 1 ? " client" : " clients") + " · needs attention first, then fewest days left";
    lastList = list.map(function (p) { return p.id; });
    tbody.innerHTML = list.map(row).join("");
    if (list.length) return;
    box.innerHTML = !sc.length
      ? '<div class="state"><h3>No clients yet</h3><p>Clients appear here when a lead is converted and the first payment is saved.</p></div>'
      : '<div class="state"><h3>No clients match these filters</h3><p>Try fewer filters or a different search.</p><button class="btn" id="btnClear2">Clear filters</button></div>';
  }
  function load() { S.mode = "loading"; render(); setTimeout(function () { if (S.mode === "loading") { S.mode = "normal"; render(); } }, 400); }
  function openProfile(id) { App.openProfile(id, { list: lastList.indexOf(id) > -1 ? lastList : [id], tab: "membership" }); }

  // ---------- events ----------
  $("rows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (b) {
      var p = App.byId(D.people, b.dataset.id);
      if (b.dataset.act === "call") App.toast("Calling " + p.name + " · " + p.cc + " " + p.mobile, "");
      if (b.dataset.act === "wa") App.toast("Opening WhatsApp for " + p.name, "");
      if (b.dataset.act === "follow") App.Followup.openAdd(p.id);
      if (b.dataset.act === "pay") App.collectPayment(p.id, b.dataset.what);
      return;
    }
    var tr = e.target.closest("tr[data-id]"); if (tr) openProfile(tr.dataset.id);
  });
  $("pipeline").addEventListener("click", function (e) {
    var c = e.target.closest("[data-card]"); if (!c) return;
    S.card = S.card === c.dataset.card ? "" : c.dataset.card; syncControls(); render();
  });
  $("activeFilters").addEventListener("click", function (e) {
    var t = e.target.closest("[data-clear]"); if (!t) return;
    var k = t.dataset.clear; S[k] = k === "pt" || k === "bal" ? false : ""; syncControls(); render();
  });
  function bind(id, key, ev) {
    $(id).addEventListener(ev || "change", function () { S[key] = this.type === "checkbox" ? this.checked : this.value; syncControls(); render(); });
  }
  bind("fSearch", "search", "input"); bind("fStatus", "card"); bind("fRep", "rep"); bind("mRep", "rep"); bind("fBranch", "branch"); bind("mBranch", "branch");
  bind("fPending", "pending"); bind("fFrom", "from"); bind("fTo", "to"); bind("fPt", "pt"); bind("fBal", "bal");
  $("btnMore").addEventListener("click", function () { $("moreFilters").classList.toggle("open"); });
  function clearAll() { S.card = ""; S.search = ""; S.rep = ""; S.pending = ""; S.from = ""; S.to = ""; S.pt = false; S.bal = false; S.branch = App.state.branchId; syncControls(); render(); }
  $("btnClear").addEventListener("click", clearAll);
  $("btnRetry").addEventListener("click", load);
  document.addEventListener("click", function (e) { if (e.target.closest("#btnClear2")) clearAll(); });
  document.addEventListener("mock:context", function (e) { S.branch = e.detail.branchId; syncControls(); render(); });
  document.addEventListener("mock:data", function () { if (S.mode === "normal") render(); });
  App.openLead = openProfile;   // command palette + #client-… links

  if (App.isDebug()) {
    $("debugBar").hidden = false;
    $("debugBar").addEventListener("click", function (e) { var b = e.target.closest("[data-state]"); if (b) { S.mode = b.dataset.state; render(); } });
  }
  document.addEventListener("DOMContentLoaded", function () {
    fillFilters();
    ["fStatus", "fRep", "fBranch", "mRep", "mBranch", "fPending"].forEach(function (id) { App.enhanceSelect($(id)); });
    load();
  });
})();
