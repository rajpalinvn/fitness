/* Settings → Packages: list (tabs All / Membership / PT / Add-on) + form drawer.
   Decisions #20, #45–#47, #50–#52, #56. Prices incl. GST; GST worked out backwards from the tax master. */
(function () {
  var D = window.DUMMY, esc = App.esc, A = window.Admin;
  var CATS = ["Membership", "PT", "Add-on"];
  var LOCKED = ["category", "isTrial", "people", "days", "sessions"];
  var S = { cat: "all", q: "", branch: "", status: "" };
  var F = null, errors = {}, dr = null;

  function canEdit() { return App.access.editMasters(); }
  function subTypes(cat) { return cat === "Membership" ? D.membershipSubTypes : cat === "PT" ? D.ptSubTypes : D.addOnKinds; }
  function lengthText(p) {
    if (p.category === "Add-on") return "—";
    return (p.sessions ? p.sessions + " sessions · " : "") + p.days + (p.days === 1 ? " day" : " days");
  }

  // ---------- list ----------
  function filtered() {
    return D.packages.filter(function (p) {
      return (S.cat === "all" || p.category === S.cat) &&
        (!S.q || p.name.toLowerCase().indexOf(S.q.toLowerCase()) > -1) &&
        (!S.branch || p.branchIds.indexOf(S.branch) > -1) &&
        (!S.status || (S.status === "active") === p.active);
    });
  }
  function tags(p) {
    var t = [];
    if (p.isTrial) t.push('<span class="badge badge-info">Trial</span>');
    if (p.people === 2) t.push('<span class="badge badge-info">Couple</span>');
    if (p.freeItems.length) t.push('<span class="badge">' + p.freeItems.length + " free item" + (p.freeItems.length > 1 ? "s" : "") + "</span>");
    if (p.audience !== "Both") t.push('<span class="badge">' + (p.audience === "New" ? "New clients only" : "Renewals only") + "</span>");
    if (p.requiresMembership && p.category !== "Membership") t.push('<span class="badge">Needs membership</span>');
    return t.join(" ") || '<span class="muted">—</span>';
  }
  function row(p) {
    var info = App.priceInfo(p), split = App.gstSplit(info.price, p.taxCategoryId), tx = App.tax(p.taxCategoryId);
    return '<tr data-id="' + p.id + '"' + (p.active ? "" : ' class="row-muted"') + ">" +
      "<td><strong>" + esc(p.name) + '</strong><div class="cell-sub">' + esc(p.subType || "No sub-type") + "</div></td>" +
      "<td>" + esc(p.category) + "</td><td>" + esc(lengthText(p)) + "</td>" +
      "<td><strong>" + (info.price ? App.fmtMoney(info.price) : "Free") + '</strong><div class="cell-sub">' + esc(tx ? tx.name + " · GST " + A.money(split.gst) : "No tax category") + "</div>" +
        (info.next ? '<div class="cell-sub"><span class="badge badge-warning">' + App.fmtMoney(info.next.price) + " from " + esc(App.fmtDate(info.next.from + "T00:00")) + "</span></div>" : "") + "</td>" +
      '<td><div class="stack">' + tags(p) + "</div></td>" +
      "<td>" + esc(A.branchNames(p.branchIds)) + "</td>" +
      '<td><span class="badge ' + (p.active ? "badge-success" : "") + '">' + (p.active ? "Active" : "Inactive") + '</span><div class="cell-sub">' +
        (p.soldCount ? "Sold " + p.soldCount + (p.soldCount === 1 ? " time" : " times") : "Not sold yet") + "</div></td>" +
      '<td><div class="row-actions">' +
        '<button class="btn btn-sm" data-act="open" data-id="' + p.id + '">' + App.icon(canEdit() ? "edit" : "eye") + (canEdit() ? "Edit" : "View") + "</button>" +
        (canEdit() ? '<button class="btn btn-sm btn-ghost" data-act="copy" data-id="' + p.id + '" title="Copy as new" aria-label="Copy as new">' + App.icon("copy") + "</button>" : "") +
      "</div></td></tr>";
  }
  function render() {
    var content = document.getElementById("content"), view = App.access.viewMasters();
    document.getElementById("btnNew").hidden = !canEdit();
    A.banner(document.getElementById("banner"), !view ? "none" : canEdit() ? "edit" : "view", "packages");
    if (!view) { content.dataset.noaccess = "1"; content.innerHTML = A.noAccess("packages"); return; }
    if (content.dataset.noaccess) { location.reload(); return; }
    var counts = { all: D.packages.length }; CATS.forEach(function (c) { counts[c] = D.packages.filter(function (p) { return p.category === c; }).length; });
    document.getElementById("catTabs").innerHTML = [["all", "All"]].concat(CATS.map(function (c) { return [c, c]; })).map(function (t) {
      var on = S.cat === t[0];
      return '<button class="tab' + (on ? " active" : "") + '" role="tab" aria-selected="' + on + '" data-cat="' + t[0] + '">' + t[1] + ' <span class="tab-count">' + counts[t[0]] + "</span></button>";
    }).join("");
    var st = A.debugState(), list = filtered(), body = document.getElementById("rows");
    if (st !== "normal" && st !== "empty") body.innerHTML = A.stateHtml(st, "", 8);
    else if (st === "empty") body.innerHTML = A.stateHtml("empty", "<h3>No packages yet</h3>" + (canEdit() ? '<button class="btn btn-primary" data-act="new">' + App.icon("plus") + "Package</button>" : ""), 8);
    else if (!list.length) body.innerHTML = A.stateHtml("empty", '<h3>No packages match these filters</h3><button class="btn" data-act="clear">Clear filters</button>', 8);
    else body.innerHTML = list.map(row).join("");
  }

  // ---------- form ----------
  function blank(cat) {
    return { id: null, name: "", category: cat || "Membership", subType: "", isTrial: false, people: 1, days: "", sessions: "", price: "", taxCategoryId: "tx1",
      priceFrom: App.todayIso(), requiresMembership: cat === "PT", branchIds: D.branches.map(function (b) { return b.id; }), audience: "Both",
      freeItems: [], active: true, soldCount: 0, priceHistory: [] };
  }
  function draftFrom(p, copy) {
    var f = JSON.parse(JSON.stringify(p));
    f.price = App.priceInfo(p).price; f.priceFrom = App.todayIso(); f.subType = f.subType || "";
    if (copy) { f.id = null; f.name = p.name + " (copy)"; f.soldCount = 0; f.priceHistory = []; f.copiedFrom = p.name; }
    return f;
  }
  function locked(k) { return F.soldCount > 0 && LOCKED.indexOf(k) > -1; }
  function dis(k) { return !canEdit() || locked(k) ? " disabled" : ""; }
  function lockHint(k) { return locked(k) ? '<span class="hint">' + App.icon("key", "ico-xs") + " Locked: sold</span>" : ""; }

  function resultBox() {
    var r = App.saleResult({ category: F.category, isTrial: F.isTrial, price: Number(F.price) || 0 });
    if (F.price === "" || F.price == null) return '<div class="next-step grey" data-result><div class="ns-label">Result</div>Enter a price to see the result.</div>';
    if (r.error) return '<div class="next-step red" data-result role="alert"><div class="ns-label">Result</div><strong>Not allowed</strong> · ' + esc(r.error) + "</div>";
    var cls = r.saleType === "Trial" ? "amber" : "green";
    return '<div class="next-step ' + cls + '" data-result><div class="ns-label">Result</div><strong>' + esc(r.text.split(" · ")[0]) + "</strong>" +
      (r.text.indexOf(" · ") > -1 ? " · " + esc(r.text.split(" · ")[1]) : "") + "</div>";
  }
  function gstLine() {
    var pr = Number(F.price) || 0, s = App.gstSplit(pr, F.taxCategoryId);
    return pr ? "Includes GST " + A.money(s.gst) + " (" + s.rate + "%) · base " + A.money(s.base) : "No GST on a free package.";
  }
  function historyTable() {
    if (!F.id) return "";
    var orig = App.byId(D.packages, F.id), t = App.todayIso(), cur = App.priceInfo(orig);
    var h = orig.priceHistory.slice().sort(function (a, b) { return a.from < b.from ? 1 : -1; });
    return '<div class="field"><label>Price history</label><table class="mini-table"><thead><tr><th>From</th><th>Price</th><th></th></tr></thead><tbody>' + h.map(function (x) {
      var st = x.from > t ? '<span class="badge badge-warning">Upcoming</span>' : x.price === cur.price && x === h.filter(function (y) { return y.from <= t; })[0] ? '<span class="badge badge-success">Current</span>' : '<span class="muted">Past</span>';
      return "<tr><td>" + esc(App.fmtDate(x.from + "T00:00")) + "</td><td>" + (x.price ? App.fmtMoney(x.price) : "Free") + "</td><td>" + st + "</td></tr>";
    }).join("") + "</tbody></table></div>";
  }
  function freeItemsHtml() {
    if (F.category === "Add-on") return "";
    var acc = D.items.filter(function (i) { return i.kind === "Accessory" && i.active; });
    return '<div class="field"><label>Free items</label>' + (F.freeItems.length ? F.freeItems.map(function (f, i) {
      return '<div class="free-row" data-fi="' + i + '">' +
        '<select class="input" data-fi-k="itemId" data-fi-i="' + i + '" aria-label="Free item"' + dis("") + ">" + acc.map(function (it) {
          return '<option value="' + it.id + '"' + (it.id === f.itemId ? " selected" : "") + ">" + esc(it.name) + "</option>"; }).join("") + "</select>" +
        '<input class="input input-num" type="number" min="1" value="' + esc(f.qty) + '" data-fi-k="qty" data-fi-i="' + i + '" aria-label="Quantity"' + dis("") + ">" +
        '<select class="input" data-fi-k="rule" data-fi-i="' + i + '" aria-label="Rule"' + dis("") + ">" + ["Once per client", "Every sale"].map(function (r) {
          return "<option" + (r === f.rule ? " selected" : "") + ">" + r + "</option>"; }).join("") + "</select>" +
        (canEdit() ? '<button type="button" class="btn btn-ghost icon-btn" data-fi-del="' + i + '" aria-label="Remove free item">' + App.icon("x") + "</button>" : "") + "</div>";
    }).join("") : '<span class="muted">None</span>') +
      (canEdit() ? '<button type="button" class="btn btn-sm mt-2" data-fi-add>' + App.icon("plus") + "Add free item</button>" : "") +
      '<span class="hint">"Once per client" is skipped if the client ever got this item free. Out of stock: the sale continues and the line is "Pending issue"; a manager can Waive it with a reason. <span class="badge badge-demo">Default, can change</span></span>' +
      A.err(errors, "freeItems") + "</div>";
  }
  function formHtml() {
    var c = F.category, isAdd = c === "Add-on", isPT = c === "PT", taxes = D.taxCategories.filter(function (t) { return t.active || t.id === F.taxCategoryId; });
    return (F.soldCount ? '<div class="callout callout-warn">' + App.icon("key") + "<span><strong>Sold " + F.soldCount + (F.soldCount === 1 ? " time" : " times") +
        ".</strong> Category, trial, people, days and sessions are locked. " + (canEdit() ? '<button type="button" class="link-btn" data-act="copy" data-id="' + F.id + '">Copy as new</button> to change them.' : "") + "</span></div>" : "") +
      (F.copiedFrom ? '<div class="callout">' + App.icon("copy") + "<span>Copy of " + esc(F.copiedFrom) + ". Nothing is saved until you click Save.</span></div>" : "") +
      resultBox() +
      '<div class="form-grid mt-3">' +
        '<div class="field span-2"><label>Category <span class="req">*</span></label>' + A.chipSeg("category", CATS, c, !canEdit() || locked("category")) + lockHint("category") + "</div>" +
        '<div class="field"><label for="pkName">Name <span class="req">*</span></label><input class="input' + (errors.name ? " invalid" : "") + '" id="pkName" data-f="name" value="' + esc(F.name) + '"' + dis("") + ">" + A.err(errors, "name") + "</div>" +
        '<div class="field"><label for="pkSub">' + (isAdd ? "Add-on kind" : "Sub-type") + (isAdd ? ' <span class="req">*</span>' : "") + '</label><select class="input" id="pkSub" data-f="subType"' + dis("") + ">" +
          (isAdd ? "" : '<option value="">Not set</option>') + subTypes(c).map(function (s) { return "<option" + (s === F.subType ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") + "</select>" +
          '<span class="hint">' + (isAdd ? "Add-on kinds are fixed in the app. First kind: Transfer." : "Optional. List managed by admin.") + "</span>" + A.err(errors, "subType") + "</div>" +
        (isAdd ? "" : '<div class="field"><label>Trial <span class="req">*</span></label>' + A.chipSeg("isTrial", [["false", "No"], ["true", "Yes"]], String(F.isTrial), !canEdit() || locked("isTrial")) + lockHint("isTrial") + "</div>") +
        (isPT ? '<div class="field"><label>People <span class="req">*</span></label>' + A.chipSeg("people", [["1", "Single"], ["2", "Couple"]], String(F.people), !canEdit() || locked("people")) +
          '<span class="hint">Couple is PT only. Both people must be clients with an active membership.</span></div>' : "") +
        (isAdd ? "" : '<div class="field"><label for="pkDays">Days <span class="req">*</span></label><input class="input input-num' + (errors.days ? " invalid" : "") + '" id="pkDays" type="number" min="1" data-f="days" value="' + esc(F.days) + '"' + dis("days") + ">" + lockHint("days") + A.err(errors, "days") + "</div>") +
        (isPT ? '<div class="field"><label for="pkSess">Sessions <span class="req">*</span></label><input class="input input-num' + (errors.sessions ? " invalid" : "") + '" id="pkSess" type="number" min="1" data-f="sessions" value="' + esc(F.sessions) + '"' + dis("sessions") + ">" + lockHint("sessions") + A.err(errors, "sessions") + "</div>" : "") +
        '<div class="field"><label for="pkPrice">Price incl. GST <span class="req">*</span></label><input class="input input-num' + (errors.price ? " invalid" : "") + '" id="pkPrice" type="number" min="0" data-f="price" value="' + esc(F.price) + '"' + dis("") + ">" +
          '<span class="hint" data-gst>' + esc(gstLine()) + "</span>" + A.err(errors, "price") + "</div>" +
        '<div class="field"><label for="pkTax">GST category <span class="req">*</span></label><select class="input" id="pkTax" data-f="taxCategoryId"' + dis("") + ">" + taxes.map(function (t) {
          return '<option value="' + t.id + '"' + (t.id === F.taxCategoryId ? " selected" : "") + ">" + esc(t.name) + " · " + t.rate + "%</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="pkFrom">Price effective from <span class="req">*</span></label><input class="input' + (errors.priceFrom ? " invalid" : "") + '" id="pkFrom" type="date" data-f="priceFrom" min="' + (F.id ? App.todayIso() : "") + '" value="' + esc(F.priceFrom) + '"' + dis("") + ">" +
          '<span class="hint">' + (F.id ? "A new price applies from this date. Earlier sales keep their price." : "First price of this package.") + "</span>" + A.err(errors, "priceFrom") + "</div>" +
        '<div class="field"><label>Audience <span class="req">*</span></label>' + A.chipSeg("audience", [["New", "New clients"], ["Renewal", "Renewals"], ["Both", "Both"]], F.audience, !canEdit()) +
          '<span class="hint"><span class="badge badge-demo">Default, can change</span> Both.</span></div>' +
        '<div class="field span-2"><label>Branches <span class="req">*</span></label><div class="chips">' + D.branches.map(function (b) {
          var on = F.branchIds.indexOf(b.id) > -1;
          return '<button type="button" class="chip' + (on ? " selected" : "") + '" aria-pressed="' + on + '" data-pkbranch="' + b.id + '"' + dis("") + ">" + (on ? App.icon("check", "ico-xs") : "") + esc(b.name) + "</button>";
        }).join("") + "</div>" + A.err(errors, "branchIds") + "</div>" +
        '<div class="field span-2"><label class="check"><input type="checkbox" data-f="requiresMembership"' + (F.requiresMembership ? " checked" : "") + dis("") + "> Requires an active membership</label>" +
          '<span class="hint">' + (isPT ? "PT always needs an active paid membership." : "The client must have an active membership to buy this.") + "</span></div>" +
        '<div class="field span-2">' + freeItemsHtml() + "</div>" +
        '<div class="field span-2"><label class="check"><input type="checkbox" data-f="active"' + (F.active ? " checked" : "") + dis("") + "> Active (can be sold)</label></div>" +
        '<div class="field span-2">' + historyTable() + "</div>" +
      "</div>";
  }
  function renderForm() {
    dr.title.textContent = !F.id ? (F.copiedFrom ? "Copy as new package" : "New package") : canEdit() ? "Edit package" : "Package";
    dr.body.innerHTML = formHtml();
    App.$all("select", dr.body).forEach(App.enhanceSelect);
    dr.foot.innerHTML = canEdit() ? '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Save package</button>' : '<button class="btn" data-close>Close</button>';
    var sv = dr.foot.querySelector("[data-save]"); if (sv) sv.onclick = save;
  }
  function openForm(f) {
    F = f; errors = {}; dr = A.formDrawer("pkgDrawer"); renderForm();
    if (!dr.el.classList.contains("open")) App.openDrawer("pkgDrawer");
  }

  function validate() {
    var e = {}, name = F.name.trim().toLowerCase(), r = App.saleResult({ category: F.category, isTrial: F.isTrial, price: Number(F.price) || 0 });
    if (!name) e.name = "Enter a name.";
    else if (D.packages.some(function (p) { return p.id !== F.id && p.name.toLowerCase() === name; })) e.name = "A package with this name already exists.";
    if (F.category === "Add-on" && !F.subType) e.subType = "Choose the Add-on kind.";
    if (F.category !== "Add-on" && !(Number(F.days) >= 1)) e.days = "Enter the number of days (1 or more).";
    if (F.category === "PT" && !(Number(F.sessions) >= 1)) e.sessions = "Enter the number of sessions.";
    if (F.price === "" || Number(F.price) < 0) e.price = "Enter a price (0 or more).";
    else if (r.error) e.price = r.error;
    if (!F.priceFrom) e.priceFrom = "Pick the date the price applies from.";
    else if (F.id && F.priceFrom < App.todayIso() && Number(F.price) !== App.priceInfo(App.byId(D.packages, F.id)).price) e.priceFrom = "A new price can't start in the past.";
    if (!F.branchIds.length) e.branchIds = "Choose at least one branch.";
    var ids = F.freeItems.map(function (f) { return f.itemId; });
    if (ids.some(function (x, i) { return ids.indexOf(x) !== i; })) e.freeItems = "Each free item can be added once.";
    if (F.freeItems.some(function (f) { return !(Number(f.qty) >= 1); })) e.freeItems = "Quantity must be 1 or more.";
    return e;
  }
  function save() {
    errors = validate();
    if (Object.keys(errors).length) { renderForm(); var first = dr.body.querySelector(".invalid") || dr.body.querySelector(".error"); if (first) first.scrollIntoView({ block: "center" }); return; }
    var price = Number(F.price), isNew = !F.id, p = isNew ? { id: "pk" + (Date.now() % 100000), soldCount: 0, priceHistory: [] } : App.byId(D.packages, F.id);
    var oldPrice = isNew ? null : App.priceInfo(p).price, changed = [];
    ["name", "subType", "taxCategoryId", "audience", "requiresMembership", "active"].forEach(function (k) { if (!isNew && String(p[k] || "") !== String(F[k] || "")) changed.push(k); });
    Object.assign(p, { name: F.name.trim(), category: F.category, subType: F.subType || null, isTrial: F.category !== "Add-on" && F.isTrial,
      people: F.category === "PT" ? Number(F.people) : (p.people || 1), days: F.category === "Add-on" ? null : Number(F.days),
      sessions: F.category === "PT" ? Number(F.sessions) : null, taxCategoryId: F.taxCategoryId, requiresMembership: F.category === "PT" ? true : F.requiresMembership,
      branchIds: F.branchIds.slice(), audience: F.audience, active: F.active,
      freeItems: F.category === "Add-on" ? [] : F.freeItems.map(function (f) { return { itemId: f.itemId, qty: Number(f.qty), rule: f.rule }; }) });
    if (isNew || price !== oldPrice) {
      p.priceHistory = p.priceHistory.filter(function (x) { return x.from !== F.priceFrom; });
      p.priceHistory.push({ price: price, from: F.priceFrom });
    }
    App.derivePackage(p);
    if (isNew) D.packages.push(p);
    App.close(dr.el);
    var msg = isNew ? p.name + " created" : price !== oldPrice && F.priceFrom > App.todayIso() ? p.name + " · new price " + App.fmtMoney(price) + " from " + App.fmtDate(F.priceFrom + "T00:00") : p.name + " saved";
    App.toast(msg, "success"); App.dataChanged(); render();
  }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-cat]"))) { S.cat = t.dataset.cat; render(); return; }
    if ((t = e.target.closest("[data-act]"))) {
      var a = t.dataset.act, p = t.dataset.id && App.byId(D.packages, t.dataset.id);
      if (a === "open") openForm(draftFrom(p));
      if (a === "copy") openForm(draftFrom(p, true));
      if (a === "new") openForm(blank(S.cat === "all" ? "Membership" : S.cat));
      if (a === "clear") { S.q = ""; S.branch = ""; S.status = ""; S.cat = "all"; document.getElementById("fSearch").value = ""; App.syncAllSelects && App.syncAllSelects(); ["fBranch", "fStatus"].forEach(function (i) { var s = document.getElementById(i); s.value = ""; s.dispatchEvent(new Event("change")); }); render(); }
      return;
    }
    if (e.target.closest("#btnNew")) { openForm(blank(S.cat === "all" ? "Membership" : S.cat)); return; }
    var tr = e.target.closest("#rows tr[data-id]"); if (tr && !e.target.closest("button")) { openForm(draftFrom(App.byId(D.packages, tr.dataset.id))); return; }
    if (!dr || !dr.el.contains(e.target) || !canEdit()) return;
    if ((t = e.target.closest("[data-seg]")) && !t.disabled) {
      var k = t.dataset.seg, v = t.dataset.val;
      F[k] = k === "isTrial" ? v === "true" : k === "people" ? Number(v) : v;
      if (k === "category") { F.subType = v === "Add-on" ? D.addOnKinds[0] : ""; if (v === "PT") F.requiresMembership = true; if (v !== "PT" && F.people === 2) F.people = 1; if (v === "Add-on") F.isTrial = false; }
      renderForm(); return;
    }
    if ((t = e.target.closest("[data-pkbranch]"))) { var i = F.branchIds.indexOf(t.dataset.pkbranch); if (i > -1) F.branchIds.splice(i, 1); else F.branchIds.push(t.dataset.pkbranch); renderForm(); return; }
    if (e.target.closest("[data-fi-add]")) {
      var used = F.freeItems.map(function (f) { return f.itemId; }), acc = D.items.filter(function (x) { return x.kind === "Accessory" && x.active && used.indexOf(x.id) < 0; });
      if (!acc.length) { App.toast("All active accessories are already added", ""); return; }
      F.freeItems.push({ itemId: acc[0].id, qty: 1, rule: "Once per client" }); renderForm(); return;
    }
    if ((t = e.target.closest("[data-fi-del]"))) { F.freeItems.splice(Number(t.dataset.fiDel), 1); renderForm(); }
  });
  function onField(e) {
    if (!dr || !dr.el.contains(e.target)) return;
    var t = e.target;
    if (t.dataset.fiK) { F.freeItems[Number(t.dataset.fiI)][t.dataset.fiK] = t.value; return; }
    var k = t.dataset.f; if (!k) return;
    F[k] = t.type === "checkbox" ? t.checked : t.value;
    if (k === "price" || k === "taxCategoryId") {
      var g = dr.body.querySelector("[data-gst]"); if (g) g.textContent = gstLine();
      var r = dr.body.querySelector("[data-result]"); if (r) r.outerHTML = resultBox();
    }
  }
  document.addEventListener("input", onField);
  document.addEventListener("change", onField);

  document.addEventListener("DOMContentLoaded", function () {
    var fb = document.getElementById("fBranch");
    fb.innerHTML = '<option value="">All branches</option>' + D.branches.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + "</option>"; }).join("");
    App.enhanceSelect(fb); App.enhanceSelect(document.getElementById("fStatus"));
    document.getElementById("fSearch").addEventListener("input", function () { S.q = this.value; render(); });
    fb.addEventListener("change", function () { S.branch = this.value; render(); });
    document.getElementById("fStatus").addEventListener("change", function () { S.status = this.value; render(); });
    A.initDebug(render);
    render();
  });
  document.addEventListener("mock:context", render);
  document.addEventListener("mock:data", render);
})();
