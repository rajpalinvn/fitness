/* Settings → Items & stock. Tabs: Items (one master for accessories, free items, key fob) ·
   Accessory stock · Key fobs · Tax categories. Decisions #49, #53–#56.
   Branch scope = top-bar branch, limited to the branches the role may manage (placeholder access). */
(function () {
  var D = window.DUMMY, esc = App.esc, A = window.Admin;
  var TABS = [["items", "Items"], ["stock", "Accessory stock"], ["fobs", "Key fobs"], ["tax", "Tax categories"]];
  var FOB_ST = ["In stock", "Assigned", "Lost", "Returned"];
  var FOB_BADGE = { "In stock": "badge-success", "Assigned": "badge-info", "Lost": "badge-danger", "Returned": "" };
  var MAX_RANGE = 500;
  var S = { tab: (/[?&]tab=(\w+)/.exec(location.search) || [])[1] || "items", fobStatus: "", fobQ: "" };
  var F = null, errors = {}, dr = null;

  function admin() { return App.access.editMasters(); }
  function branches() {   // branches in scope for stock + fobs
    var allowed = App.access.stockBranches(), b = App.state.branchId;
    return b && b !== "all" ? allowed.filter(function (x) { return x === b; }) : allowed;
  }
  function multi() { return branches().length > 1; }
  function taxName(id) { var t = App.tax(id); return t ? t.name + " · " + t.rate + "%" : "Not set yet"; }
  function who(id) { return App.userName(id); }

  // ---------- frame ----------
  function render() {
    if (!TABS.some(function (t) { return t[0] === S.tab; })) S.tab = "items";
    document.getElementById("itTabs").innerHTML = TABS.map(function (t) {
      var on = t[0] === S.tab; return '<button class="tab' + (on ? " active" : "") + '" role="tab" aria-selected="' + on + '" data-itab="' + t[0] + '">' + t[1] + "</button>";
    }).join("");
    var masters = S.tab === "items" || S.tab === "tax", panel = document.getElementById("panel"), head = document.getElementById("headActions");
    var can = masters ? App.access.viewMasters() : App.access.stock();
    A.banner(document.getElementById("banner"), !can ? "none" : masters ? (admin() ? "edit" : "view") : "edit", S.tab === "tax" ? "tax categories" : "items");
    head.innerHTML = "";
    if (!can) { panel.innerHTML = A.noAccess(masters ? "this master" : "stock and key fobs (Club Manager and above, own branches)"); return; }
    if (!masters && !branches().length) { panel.innerHTML = '<div class="state"><h3>None of your branches is selected</h3><p class="muted">Pick one of your branches in the top bar.</p></div>'; return; }
    ({ items: itemsTab, stock: stockTab, fobs: fobsTab, tax: taxTab })[S.tab](panel, head);
  }
  function table(cols, rowsHtml) {
    return '<div class="table-wrap"><table class="table table-admin"><thead><tr>' + cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") +
      "</tr></thead><tbody>" + rowsHtml + "</tbody></table></div>";
  }
  function stateRows(cols, emptyHtml, list) {
    var st = A.debugState();
    if (st === "loading" || st === "error") return A.stateHtml(st, "", cols);
    if (st === "empty" || !list.length) return A.stateHtml("empty", emptyHtml, cols);
    return null;
  }

  // ---------- Items ----------
  function itemsTab(panel, head) {
    if (admin()) head.innerHTML = '<button class="btn btn-primary" data-act="newItem">' + App.icon("plus") + "Item</button>";
    var list = D.items, cols = ["Item", "Kind", "Cost price", "Selling price incl. GST", "GST category", "Status", '<span class="sr-only">Actions</span>'];
    var rows = stateRows(cols.length, "<h3>No items yet</h3>", list) || list.map(function (it) {
      var fob = it.kind === "Key fob";
      return '<tr data-item="' + it.id + '"' + (it.active ? "" : ' class="row-muted"') + "><td><strong>" + esc(it.name) + "</strong>" +
        (fob ? '<div class="cell-sub">Selling price = refundable deposit</div>' : "") + "</td><td>" + esc(it.kind) + "</td>" +
        "<td>" + A.money(it.costPrice) + "</td><td>" + (admin() ? A.money(it.sellingPrice) : '<span class="muted">Admin only</span>') + "</td>" +
        "<td>" + esc(taxName(it.taxCategoryId)) + '</td><td><span class="badge ' + (it.active ? "badge-success" : "") + '">' + (it.active ? "Active" : "Inactive") + "</span></td>" +
        '<td><div class="row-actions"><button class="btn btn-sm" data-act="item" data-id="' + it.id + '">' + App.icon(admin() ? "edit" : "eye") + (admin() ? "Edit" : "View") + "</button></div></td></tr>";
    }).join("");
    panel.innerHTML = '<p class="muted">One list for accessories, free items in packages and the key fob. Prices include GST.</p>' + table(cols, rows);
  }
  function itemForm(it) {
    F = it ? JSON.parse(JSON.stringify(it)) : { id: null, name: "", kind: "Accessory", costPrice: "", sellingPrice: "", taxCategoryId: "tx2", active: true };
    errors = {}; dr = A.formDrawer("itemDrawer"); renderItemForm();
    if (!dr.el.classList.contains("open")) App.openDrawer("itemDrawer");
  }
  function renderItemForm() {
    var ro = admin() ? "" : " disabled", fob = F.kind === "Key fob";
    var taxes = D.taxCategories.filter(function (t) { return t.active || t.id === F.taxCategoryId; });
    var below = F.costPrice !== "" && F.sellingPrice !== "" && Number(F.sellingPrice) < Number(F.costPrice);
    dr.title.textContent = !F.id ? "New item" : admin() ? "Edit item" : "Item";
    dr.body.innerHTML = '<div class="form-grid">' +
      '<div class="field"><label for="itName">Name <span class="req">*</span></label><input class="input' + (errors.name ? " invalid" : "") + '" id="itName" data-f="name" value="' + esc(F.name) + '"' + ro + ">" + A.err(errors, "name") + "</div>" +
      '<div class="field"><label>Kind</label><div class="input input-static">' + esc(F.kind) + '</div><span class="hint">' + (fob ? "There is one Key fob item. Fob numbers are managed in the Key fobs tab." : "New items are accessories.") + "</span></div>" +
      '<div class="field"><label for="itCost">Cost price <span class="req">*</span></label><input class="input input-num' + (errors.costPrice ? " invalid" : "") + '" id="itCost" type="number" min="0" data-f="costPrice" value="' + esc(F.costPrice) + '"' + ro + ">" + A.err(errors, "costPrice") + "</div>" +
      (admin() ? '<div class="field"><label for="itSell">' + (fob ? "Refundable deposit" : "Selling price incl. GST") + ' <span class="req">*</span></label><input class="input input-num' + (errors.sellingPrice ? " invalid" : "") + '" id="itSell" type="number" min="0" data-f="sellingPrice" value="' + esc(F.sellingPrice) + '">' +
        '<span class="hint">' + (fob ? "Collected as its own line in the same sale. Refund full or partial with a reason." : "Admin only.") + "</span>" +
        (below ? '<span class="hint warn-text">' + App.icon("alert", "ico-xs") + " Selling below cost.</span>" : "") + A.err(errors, "sellingPrice") + "</div>"
        : '<div class="field"><label>Selling price</label><div class="input input-static muted">Admin only</div></div>') +
      '<div class="field"><label for="itTax">GST category <span class="req">*</span></label><select class="input" id="itTax" data-f="taxCategoryId"' + ro + ">" + taxes.map(function (t) {
        return '<option value="' + t.id + '"' + (t.id === F.taxCategoryId ? " selected" : "") + ">" + esc(t.name) + " · " + t.rate + "%</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label class="check"><input type="checkbox" data-f="active"' + (F.active ? " checked" : "") + ro + "> Active</label></div>" +
      "</div>" +
      '<fieldset class="reserved" disabled><legend>Return / refund policy <span class="badge badge-demo">Reserved · not used yet</span></legend>' +
        '<div class="form-grid"><div class="field"><label>Returnable</label><div class="input input-static">Not set yet</div></div>' +
        '<div class="field"><label>Return window (days)</label><div class="input input-static">Not set yet</div></div>' +
        '<div class="field"><label>Refund type</label><div class="input input-static">Not set yet</div></div></div></fieldset>';
    App.$all("select", dr.body).forEach(App.enhanceSelect);
    dr.foot.innerHTML = admin() ? '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Save item</button>' : '<button class="btn" data-close>Close</button>';
    var sv = dr.foot.querySelector("[data-save]"); if (sv) sv.onclick = saveItem;
  }
  function saveItem() {
    var e = {}, n = F.name.trim().toLowerCase();
    if (!n) e.name = "Enter a name."; else if (D.items.some(function (x) { return x.id !== F.id && x.name.toLowerCase() === n; })) e.name = "An item with this name already exists.";
    if (F.costPrice === "" || Number(F.costPrice) < 0) e.costPrice = "Enter the cost price.";
    if (F.sellingPrice === "" || !(Number(F.sellingPrice) > 0)) e.sellingPrice = F.kind === "Key fob" ? "Enter the deposit amount." : "Enter the selling price.";
    errors = e; if (Object.keys(e).length) { renderItemForm(); return; }
    var it = F.id ? App.byId(D.items, F.id) : { id: "it" + (Date.now() % 100000), kind: "Accessory" };
    Object.assign(it, { name: F.name.trim(), costPrice: Number(F.costPrice), sellingPrice: Number(F.sellingPrice), taxCategoryId: F.taxCategoryId, active: F.active });
    if (!F.id) D.items.push(it);
    App.close(dr.el); App.toast(it.name + " saved", "success"); App.dataChanged();
  }

  // ---------- Accessory stock ----------
  function stockRow(itemId, branchId) {
    var r = D.itemStock.filter(function (x) { return x.itemId === itemId && x.branchId === branchId; })[0];
    if (!r) { r = { itemId: itemId, branchId: branchId, qty: 0 }; D.itemStock.push(r); }
    return r;
  }
  function moves(itemId, branchId) {
    return D.stockMoves.filter(function (m) { return m.itemId === itemId && m.branchId === branchId; }).sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  }
  function stockTab(panel, head) {
    head.innerHTML = '<button class="btn btn-primary" data-act="stockIn">' + App.icon("plus") + "Stock in</button>";
    var acc = D.items.filter(function (i) { return i.kind === "Accessory" && i.active; }), list = [];
    branches().forEach(function (b) { acc.forEach(function (i) { list.push(stockRow(i.id, b)); }); });
    var cols = ["Item"].concat(multi() ? ["Branch"] : []).concat(["Current quantity", "Last movement", '<span class="sr-only">Actions</span>']);
    var rows = stateRows(cols.length, "<h3>No accessories yet</h3><p class=\"muted\">Add accessories in the Items tab.</p>", list) || list.map(function (r) {
      var it = App.byId(D.items, r.itemId), last = moves(r.itemId, r.branchId)[0];
      return "<tr><td><strong>" + esc(it.name) + "</strong></td>" + (multi() ? "<td>" + esc(App.branchName(r.branchId)) + "</td>" : "") +
        "<td><strong>" + r.qty + "</strong> " + (r.qty === 0 ? '<span class="badge badge-danger">Out of stock</span>' : '<span class="badge badge-success">In stock</span>') + "</td>" +
        "<td>" + (last ? esc((last.qty > 0 ? "+" : "") + last.qty + " · " + last.note) + '<div class="cell-sub">' + esc(App.fmtShortWhen(last.at)) + " · " + esc(who(last.by)) + "</div>" : '<span class="muted">No movements yet</span>') + "</td>" +
        '<td><div class="row-actions"><button class="btn btn-sm" data-act="stockIn" data-id="' + r.itemId + '" data-b="' + r.branchId + '">' + App.icon("plus") + "Stock in</button>" +
        '<button class="btn btn-sm btn-ghost" data-act="stockHist" data-id="' + r.itemId + '" data-b="' + r.branchId + '">' + App.icon("clock") + "History</button></div></td></tr>";
    }).join("");
    panel.innerHTML = '<p class="muted">' + esc(scopeText()) + " Key fobs are counted one by one in the Key fobs tab.</p>" + table(cols, rows);
  }
  function scopeText() { return "Showing " + branches().map(App.branchName).join(", ") + "."; }
  function branchSelect(id, sel) {
    return '<select class="input" id="' + id + '">' + branches().map(function (b) { return '<option value="' + b + '"' + (b === sel ? " selected" : "") + ">" + esc(App.branchName(b)) + "</option>"; }).join("") + "</select>";
  }
  function stockIn(itemId, branchId) {
    var m = App.makeModal("stockInModal"), acc = D.items.filter(function (i) { return i.kind === "Accessory" && i.active; });
    m.title.textContent = "Stock in";
    m.body.innerHTML = '<div class="field"><label for="siItem">Item <span class="req">*</span></label><select class="input" id="siItem">' + acc.map(function (i) {
        return '<option value="' + i.id + '"' + (i.id === itemId ? " selected" : "") + ">" + esc(i.name) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="siBranch">Branch <span class="req">*</span></label>' + branchSelect("siBranch", branchId) + "</div>" +
      '<div class="field"><label for="siQty">Quantity received <span class="req">*</span></label><input class="input input-num" id="siQty" type="number" min="1" step="1"><span class="error" data-sierr hidden>Enter a whole number, 1 or more.</span></div>' +
      '<div class="field"><label for="siNote">Note</label><input class="input" id="siNote" placeholder="e.g. Supplier delivery (optional)"></div>';
    App.$all("select", m.body).forEach(App.enhanceSelect);
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Add to stock</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var q = Number(m.body.querySelector("#siQty").value), it = m.body.querySelector("#siItem").value, b = m.body.querySelector("#siBranch").value;
      if (!(q >= 1) || Math.floor(q) !== q) { m.body.querySelector("[data-sierr]").hidden = false; m.body.querySelector("#siQty").classList.add("invalid"); return; }
      var r = stockRow(it, b); r.qty += q;
      D.stockMoves.push({ itemId: it, branchId: b, qty: q, at: new Date().toISOString(), by: App.me().id, note: m.body.querySelector("#siNote").value.trim() || "Stock in" });
      App.close(m.el); App.toast(App.byId(D.items, it).name + ": +" + q + " at " + App.branchName(b) + " · now " + r.qty, "success"); App.dataChanged();
    };
    App.openModal("stockInModal");
  }
  function historyModal(title, list) {
    var m = App.makeModal("histModal");
    m.title.textContent = title;
    m.body.innerHTML = list.length ? '<ul class="hist">' + list.map(function (h) {
      return "<li><div>" + h.text + '</div><div class="cell-sub">' + esc(App.fmtWhen(h.at)) + " · " + esc(h.by ? who(h.by) : "System") + "</div></li>"; }).join("") + "</ul>"
      : '<div class="state">No history yet.</div>';
    m.foot.innerHTML = '<button class="btn" data-close>Close</button>';
    App.openModal("histModal");
  }

  // ---------- Key fobs ----------
  function depositText(k) {
    if (!k.deposit) return '<span class="muted">—</span>';
    var d = k.deposit, left = d.amount - d.refunded;
    if (!d.refunded) return A.money(d.amount) + ' <span class="cell-sub">held</span>';
    if (!left) return '<span class="muted">Refunded ' + A.money(d.refunded) + "</span>";
    return A.money(left) + ' <span class="cell-sub">held · ' + A.money(d.refunded) + " refunded</span>";
  }
  function fobList() {
    return D.keyFobs.filter(function (k) { return branches().indexOf(k.branchId) > -1; });
  }
  function fobsTab(panel, head) {
    head.innerHTML = '<button class="btn btn-primary" data-act="addFobs">' + App.icon("plus") + "Add fobs</button>";
    var all = fobList(), counts = {}; FOB_ST.forEach(function (s) { counts[s] = all.filter(function (k) { return k.status === s; }).length; });
    var list = all.filter(function (k) { return (!S.fobStatus || k.status === S.fobStatus) && (!S.fobQ || k.no.toLowerCase().indexOf(S.fobQ.toLowerCase()) > -1); })
      .sort(function (a, b) { return a.no < b.no ? -1 : 1; });
    var cols = ["Fob number"].concat(multi() ? ["Branch"] : []).concat(["Status", "Client", "Deposit", '<span class="sr-only">Actions</span>']);
    var empty = all.length ? '<h3>No fobs match</h3><button class="btn" data-act="clearFobs">Clear filters</button>' : "<h3>No fobs at this branch</h3><p class=\"muted\">Add one number or a range.</p>";
    var rows = stateRows(cols.length, empty, list) || list.map(function (k) {
      var p = k.personId && App.byId(D.people, k.personId), left = k.deposit ? k.deposit.amount - k.deposit.refunded : 0;
      return '<tr><td><strong class="mono">' + esc(k.no) + "</strong></td>" + (multi() ? "<td>" + esc(App.branchName(k.branchId)) + "</td>" : "") +
        '<td><span class="badge ' + FOB_BADGE[k.status] + '">' + esc(k.status) + "</span></td>" +
        "<td>" + (p ? '<button class="link-btn link-strong" data-act="person" data-id="' + p.id + '">' + esc(p.name) + "</button>" : '<span class="muted">—</span>') + "</td>" +
        "<td>" + depositText(k) + "</td>" +
        '<td><div class="row-actions"><button class="btn btn-sm btn-ghost" data-act="fobHist" data-id="' + esc(k.no) + '">' + App.icon("clock") + "History</button>" +
        (k.status === "Returned" && left > 0 ? '<button class="btn btn-sm" data-act="refund" data-id="' + esc(k.no) + '">Refund deposit</button>' : "") + "</div></td></tr>";
    }).join("");
    panel.innerHTML = '<p class="muted">' + esc(scopeText()) + " Deposit per fob: " + A.money(App.fobDeposit()) + " (from the Key fob item).</p>" +
      '<div class="filter-bar"><input class="input grow" type="search" id="fobQ" placeholder="Filter: fob number" aria-label="Filter fobs" value="' + esc(S.fobQ) + '">' +
      A.chipSeg("fobStatus", [["", "All · " + all.length]].concat(FOB_ST.map(function (s) { return [s, s + " · " + counts[s]]; })), S.fobStatus) + "</div>" + table(cols, rows);
    var q = panel.querySelector("#fobQ"); q.oninput = function () { S.fobQ = this.value; var pos = this.selectionStart; render(); var n = document.getElementById("fobQ"); n.focus(); n.setSelectionRange(pos, pos); };
  }
  function parseNo(s) { var m = /^(.*?)(\d+)$/.exec(String(s || "").trim().toUpperCase()); return m ? { prefix: m[1], n: Number(m[2]), w: m[2].length } : null; }
  function rangeNumbers(from, to) {
    var a = parseNo(from), b = to ? parseNo(to) : a;
    if (!a) return { error: "Enter a fob number ending in digits, e.g. KF-GC-0203." };
    if (!b) return { error: "The last number must end in digits." };
    if (a.prefix !== b.prefix) return { error: "Both numbers need the same start (" + a.prefix + "…)." };
    if (b.n < a.n) return { error: "The last number must be after the first." };
    if (b.n - a.n + 1 > MAX_RANGE) return { error: "Up to " + MAX_RANGE + " fobs at a time." };
    var out = []; for (var i = a.n; i <= b.n; i++) { var d = String(i); while (d.length < a.w) d = "0" + d; out.push(a.prefix + d); }
    return { list: out };
  }
  function addFobs() {
    var m = App.makeModal("addFobModal"), mode = "range";
    m.title.textContent = "Add key fobs";
    function body() {
      m.body.innerHTML = '<div class="field"><label for="afBranch">Branch <span class="req">*</span></label>' + branchSelect("afBranch", branches()[0]) + "</div>" +
        '<div class="field"><label>Add</label>' + A.chipSeg("afMode", [["single", "One number"], ["range", "A range"]], mode) + "</div>" +
        '<div class="form-grid"><div class="field"><label for="afFrom">' + (mode === "range" ? "From" : "Fob number") + ' <span class="req">*</span></label><input class="input mono" id="afFrom" placeholder="KF-0001"></div>' +
        (mode === "range" ? '<div class="field"><label for="afTo">To <span class="req">*</span></label><input class="input mono" id="afTo" placeholder="KF-0050"></div>' : "") + "</div>" +
        '<div class="af-preview" data-afprev role="status"></div>';
      App.$all("select", m.body).forEach(App.enhanceSelect);
    }
    function calc() {
      var f = m.body.querySelector("#afFrom").value, t = mode === "range" ? m.body.querySelector("#afTo").value : "";
      if (!f || (mode === "range" && !t)) return null;
      var r = rangeNumbers(f, t); if (r.error) return r;
      var exist = r.list.filter(function (n) { return D.keyFobs.some(function (k) { return k.no === n; }); });
      return { list: r.list, exist: exist, add: r.list.filter(function (n) { return exist.indexOf(n) < 0; }) };
    }
    function preview() {
      var c = calc(), el = m.body.querySelector("[data-afprev]");
      if (!c) { el.innerHTML = '<span class="muted">Enter ' + (mode === "range" ? "the first and last number" : "a number") + ".</span>"; return; }
      if (c.error) { el.innerHTML = '<span class="error">' + esc(c.error) + "</span>"; return; }
      el.innerHTML = "<strong>" + c.add.length + " fob" + (c.add.length === 1 ? "" : "s") + " will be added</strong> as In stock." +
        (c.exist.length ? '<div class="callout callout-warn mt-2">' + App.icon("alert") + "<span>" + c.exist.length + " already exist" + (c.exist.length === 1 ? "s" : "") +
          " and will be skipped: " + esc(c.exist.slice(0, 6).join(", ")) + (c.exist.length > 6 ? " and " + (c.exist.length - 6) + " more" : "") + "</span></div>" : "");
    }
    body(); preview();
    m.body.oninput = preview;
    m.body.onclick = function (e) { var s = e.target.closest('[data-seg="afMode"]'); if (s) { mode = s.dataset.val; body(); preview(); } };
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Add fobs</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var c = calc(), b = m.body.querySelector("#afBranch").value;
      if (!c || c.error || !c.add.length) { preview(); if (c && !c.error && !c.add.length) m.body.querySelector("[data-afprev]").innerHTML = '<span class="error">All these numbers already exist. Nothing to add.</span>'; else if (!c) m.body.querySelector("[data-afprev]").innerHTML = '<span class="error">Enter the fob number' + (mode === "range" ? "s" : "") + ".</span>"; return; }
      var now = new Date().toISOString();
      c.add.forEach(function (n) { D.keyFobs.push({ no: n, branchId: b, status: "In stock", personId: null, deposit: null, history: [{ at: now, text: "Added to stock", by: App.me().id }] }); });
      App.close(m.el); App.toast(c.add.length + " fob" + (c.add.length === 1 ? "" : "s") + " added to " + App.branchName(b) + (c.exist.length ? " · " + c.exist.length + " skipped" : ""), "success"); App.dataChanged();
    };
    App.openModal("addFobModal");
  }
  function refund(no) {
    var k = D.keyFobs.filter(function (x) { return x.no === no; })[0], d = k.deposit, left = d.amount - d.refunded, m = App.makeModal("refundModal"), kind = "full";
    m.title.textContent = "Refund deposit · " + no;
    function body() {
      m.body.innerHTML = '<dl class="kv kv-wide"><dt>Deposit</dt><dd>' + A.money(d.amount) + "</dd><dt>Already refunded</dt><dd>" + A.money(d.refunded) + "</dd><dt>Can refund</dt><dd><strong>" + A.money(left) + "</strong></dd></dl>" +
        '<div class="field mt-3"><label>Refund</label>' + A.chipSeg("rfKind", [["full", "Full · " + A.money(left)], ["partial", "Partial"]], kind) + "</div>" +
        (kind === "partial" ? '<div class="field"><label for="rfAmt">Amount <span class="req">*</span></label><input class="input input-num" id="rfAmt" type="number" min="1" max="' + left + '"></div>' : "") +
        '<div class="field"><label for="rfReason">Reason <span class="req">*</span></label><input class="input" id="rfReason" placeholder="e.g. Fob returned in good condition"></div>' +
        '<span class="error" data-rferr hidden></span>';
    }
    body();
    m.body.onclick = function (e) { var s = e.target.closest('[data-seg="rfKind"]'); if (s) { kind = s.dataset.val; body(); } };
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Refund</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var amt = kind === "full" ? left : Number((m.body.querySelector("#rfAmt") || {}).value), reason = m.body.querySelector("#rfReason").value.trim(), er = m.body.querySelector("[data-rferr]");
      var bad = !(amt > 0) ? "Enter the amount to refund." : amt > left ? "You can refund at most " + A.money(left) + "." : !reason ? "A reason is needed." : "";
      if (bad) { er.textContent = bad; er.hidden = false; return; }
      d.refunded += amt; d.refundReason = reason;
      k.history.push({ at: new Date().toISOString(), text: "Deposit refunded " + A.money(amt) + " of " + A.money(d.amount) + " · " + reason, by: App.me().id });
      App.close(m.el); App.toast("Refunded " + A.money(amt) + " · " + no, "success"); App.dataChanged();
    };
    App.openModal("refundModal");
  }

  // ---------- Tax categories ----------
  function usage(id) {
    return D.packages.filter(function (p) { return p.taxCategoryId === id; }).length + D.items.filter(function (i) { return i.taxCategoryId === id; }).length;
  }
  function taxTab(panel, head) {
    if (admin()) head.innerHTML = '<button class="btn btn-primary" data-act="tax">' + App.icon("plus") + "Tax category</button>";
    var cols = ["Name", "GST rate", "Used by", "Status", '<span class="sr-only">Actions</span>'];
    var rows = stateRows(cols.length, "<h3>No tax categories yet</h3>", D.taxCategories) || D.taxCategories.map(function (t) {
      var u = usage(t.id);
      return "<tr><td><strong>" + esc(t.name) + "</strong></td><td>" + t.rate + "%</td><td>" + (u ? u + " package" + (u === 1 ? "" : "s") + " / item" + (u === 1 ? "" : "s") : '<span class="muted">Not used</span>') + "</td>" +
        '<td><span class="badge ' + (t.active ? "badge-success" : "") + '">' + (t.active ? "Active" : "Inactive") + "</span></td>" +
        '<td><div class="row-actions">' + (admin() ? '<button class="btn btn-sm" data-act="tax" data-id="' + t.id + '">' + App.icon("edit") + "Edit</button>" : "") + "</div></td></tr>";
    }).join("");
    panel.innerHTML = '<p class="muted">Prices are stored including GST. GST is worked out backwards: GST = price × rate ÷ (100 + rate).</p>' + table(cols, rows);
  }
  function taxForm(id) {
    var t = id ? App.byId(D.taxCategories, id) : null, m = App.makeModal("taxModal"), u = t ? usage(t.id) : 0;
    m.title.textContent = t ? "Edit tax category" : "New tax category";
    m.body.innerHTML = '<div class="field"><label for="txName">Name <span class="req">*</span></label><input class="input" id="txName" value="' + esc(t ? t.name : "") + '" placeholder="e.g. Goods 5%"></div>' +
      '<div class="field"><label for="txRate">GST rate (%) <span class="req">*</span></label><input class="input input-num" id="txRate" type="number" min="0" max="100" step="0.01" value="' + (t ? t.rate : "") + '">' +
      (u ? '<span class="hint">Used by ' + u + ". Prices incl. GST stay the same; only the GST split changes.</span>" : "") + "</div>" +
      '<div class="field"><label class="check"><input type="checkbox" id="txActive"' + (!t || t.active ? " checked" : "") + "> Active</label>" +
      (u ? '<span class="hint">Inactive categories stay on packages and items that use them, but can\'t be picked for new ones.</span>' : "") + "</div>" +
      '<span class="error" data-txerr hidden></span>';
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Save</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var name = m.body.querySelector("#txName").value.trim(), rv = m.body.querySelector("#txRate").value, rate = Number(rv), er = m.body.querySelector("[data-txerr]");
      var bad = !name ? "Enter a name." : D.taxCategories.some(function (x) { return x !== t && x.name.toLowerCase() === name.toLowerCase(); }) ? "This name already exists."
        : rv === "" || isNaN(rate) || rate < 0 || rate > 100 ? "Enter a rate between 0 and 100." : "";
      if (bad) { er.textContent = bad; er.hidden = false; return; }
      if (!t) { t = { id: "tx" + (Date.now() % 100000) }; D.taxCategories.push(t); }
      Object.assign(t, { name: name, rate: rate, active: m.body.querySelector("#txActive").checked });
      App.close(m.el); App.toast(name + " saved", "success"); App.dataChanged();
    };
    App.openModal("taxModal");
  }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-itab]"))) { S.tab = t.dataset.itab; history.replaceState(null, "", "?tab=" + S.tab + (App.isDebug() ? "&debug" : "")); render(); return; }
    if ((t = e.target.closest('[data-seg="fobStatus"]'))) { S.fobStatus = t.dataset.val; render(); return; }
    if ((t = e.target.closest("[data-act]"))) {
      var a = t.dataset.act, id = t.dataset.id;
      if (a === "item") itemForm(App.byId(D.items, id));
      if (a === "newItem") itemForm(null);
      if (a === "stockIn") stockIn(id, t.dataset.b || branches()[0]);
      if (a === "stockHist") historyModal(App.byId(D.items, id).name + " · " + App.branchName(t.dataset.b), moves(id, t.dataset.b).map(function (m) {
        return { at: m.at, by: m.by, text: "<strong>" + (m.qty > 0 ? "+" : "") + m.qty + "</strong> · " + esc(m.note) }; }));
      if (a === "addFobs") addFobs();
      if (a === "fobHist") { var k = D.keyFobs.filter(function (x) { return x.no === id; })[0];
        historyModal("Key fob " + id, k.history.slice().reverse().map(function (h) { return { at: h.at, by: h.by, text: esc(h.text) }; })); }
      if (a === "refund") refund(id);
      if (a === "clearFobs") { S.fobStatus = ""; S.fobQ = ""; render(); }
      if (a === "tax") taxForm(id);
      if (a === "person") App.openProfile(id);
      return;
    }
    if (dr && dr.el.contains(e.target) && admin()) { /* item form has no click-only fields */ }
  });
  function onField(e) {
    if (!dr || !dr.el.contains(e.target)) return;
    var k = e.target.dataset.f; if (!k) return;
    F[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if ((k === "sellingPrice" || k === "costPrice") && e.type === "change") renderItemForm();
  }
  document.addEventListener("input", onField);
  document.addEventListener("change", onField);
  document.addEventListener("DOMContentLoaded", function () { A.initDebug(render); render(); });
  document.addEventListener("mock:context", render);
  document.addEventListener("mock:data", render);
})();
