/* Convert to Client stepper (decisions #3, #4, #13, #14, #20, #36–#41, #64–#67, #70–#74).
   Opens IN the profile drawer as "Sell mode" (App.DrawerMode), not as a modal.
     App.Convert.open(personId)
   Steps: 1 Details · 2 Package · 3 Sale & start · 4 Corporate entry (Paid membership / Paid trial) · 5 Summary.
   Right column: live Bill summary (free items Issue now / Later, + Add item, deposit, GST, total).
   MOCKUP: the person is converted when "Proceed to Payment" is clicked.
   REAL APP: convert only after payment succeeds ("money taken = client").
   Load after profile.js. */
(function () {
  var D = window.DUMMY, esc = App.esc, icon = App.icon;
  var REP_ROLES = ["Sales Executive", "Sales Manager", "Club Manager"];
  var STEPS = [{ k: 1, t: "Details" }, { k: 2, t: "Package" }, { k: 3, t: "Sale & start" }, { k: 4, t: "Corporate entry" }, { k: 5, t: "Summary" }];
  var CORP = "Corporate entry: FF ID & key fob";
  var GROUPS = [["Trial", "Free trial"], ["Trial Paid", "Paid trial"], ["Membership", "Membership"], ["PT", "Personal training"]];
  var C = null, m = null;

  function person() { return App.byId(D.people, C.pid); }
  function pkg() { return C.pkgId ? App.byId(D.packages, C.pkgId) : null; }
  function needsFob() { var k = pkg(); return !!k && k.saleType === "Paid" && k.type === "Membership"; }
  // Corporate entry step: Paid membership (FF ID + fob, pending if empty) and Paid trial (FF ID only, optional, never pending) — decision #72.
  function showCorp() { var k = pkg(); return needsFob() || (!!k && k.saleType === "Trial Paid"); }
  function isoDay(d) { var x = new Date(d); return x.getFullYear() + "-" + ("0" + (x.getMonth() + 1)).slice(-2) + "-" + ("0" + x.getDate()).slice(-2); }
  function plus(iso, n) { var d = new Date(iso + "T00:00"); d.setDate(d.getDate() + n); return d; }
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function limitPct() { var l = D.discountLimits[App.state.role]; return l == null ? null : l; }
  function stock(p) { return D.keyFobs.filter(function (k) { return k.branchId === p.branchId && k.status === "In stock"; }); }
  function reps(p) { return D.users.filter(function (u) { return u.branches.indexOf(p.branchId) > -1 && REP_ROLES.indexOf(u.role) > -1; }); }
  function itemQty(itemId, branchId) { var s = D.itemStock.filter(function (x) { return x.itemId === itemId && x.branchId === branchId; })[0]; return s ? s.qty : 0; }
  function accessories() { return D.items.filter(function (i) { return i.kind === "Accessory" && i.active; }); }
  function reasonText() { return C.reason === "Other" ? C.reasonOther.trim() : C.reason; }

  // Packages a lead can buy: active, sold at the lead's branch, audience New or Both, not an Add-on (decisions #47, #50).
  function sellable(p) {
    return D.packages.filter(function (x) { return x.active && x.category !== "Add-on" && x.branchIds.indexOf(p.branchId) > -1 && x.audience !== "Renewal"; });
  }
  // Free items: "Once per client" is skipped if the person ever got it free; out of stock -> "Pending issue" (decision #46).
  // In stock: staff choose Issue now (default) or Later (-> Pending issue) — decision #70.
  function freeLines(p, k) {
    return (k.freeItems || []).map(function (f) {
      var it = App.byId(D.items, f.itemId), got = (p.freeItemsReceived || []).indexOf(f.itemId) > -1;
      if (f.rule === "Once per client" && got) return { itemId: f.itemId, name: it.name, qty: f.qty, status: "Skipped", why: "already received free once" };
      var inStock = itemQty(f.itemId, p.branchId) >= f.qty;
      if (!inStock) return { itemId: f.itemId, name: it.name, qty: f.qty, status: "Pending issue", why: "out of stock", forced: true };
      var later = C && C.issue[f.itemId] === "later";
      return { itemId: f.itemId, name: it.name, qty: f.qty, status: later ? "Pending issue" : "Issued", why: later ? "issue later" : "", choice: true };
    });
  }
  function depositDue() { return needsFob() && C.fob && !C.fobFree ? App.fobDeposit() : 0; }
  // Discount money + percent from what was typed.
  function money() {
    var k = pkg(); if (!k) return { price: 0, disc: 0, pct: 0, final: 0 };
    var v = Number(C.disc) || 0, disc = C.mode === "%" ? Math.round(k.price * v / 100) : Math.round(v);
    return { price: k.price, disc: disc, pct: k.price ? disc / k.price * 100 : 0, final: k.price - disc };
  }
  // Extra accessories added in the bill (decision #71): price locked from the item master; "Free" = complimentary with a reason.
  function extraLine(x) { var it = App.byId(D.items, x.itemId); return { it: it, amount: x.free ? 0 : it.sellingPrice * x.qty }; }
  function extrasPaid() { return C.extras.reduce(function (s, x) { return s + extraLine(x).amount; }, 0); }
  function endDate() { var k = pkg(); return k ? plus(C.start, k.days - 1) : null; }   // start day included (decision #39)

  // ---------- open ----------
  function open(pid) {
    var p = App.byId(D.people, pid); if (!App.Followup.isOpenLead(p)) return;
    C = { pid: pid, step: 1, done: false, email: p.email || "", gender: p.gender || "", birthDate: p.birthDate || "", ffId: p.ffId || "",
      pkgId: null, mode: "%", disc: "", reason: "", reasonOther: "", repId: p.ownerUserId || App.me().id, start: isoDay(new Date()),
      fob: "", fobFree: false, fobFreeWhy: "", issue: {}, extras: [], picker: false, pickQ: "", errors: {}, pkgQ: "", open: {} };
    // Membership open by default; others collapsed (decision #74). Fallback: first group with packages.
    var groups = GROUPS.filter(function (g) { return sellable(p).some(function (x) { return x.type === g[0]; }); });
    var def = groups.filter(function (g) { return g[0] === "Membership"; })[0] || groups[0];
    if (def) C.open[def[0]] = true;
    m = App.DrawerMode.open(pid, { key: "convert", title: "Convert to client", onExit: function () {
      if (C && !C.done) App.toast("Conversion not saved", "");
      var done = C && C.done && C.clientId; C = null;
      if (done) App.openProfile(done, { state: "normal", tab: "membership" });
    } });
    m.body.onclick = onClick; m.body.oninput = onInput; m.body.onchange = onInput;
    render();
  }

  // ---------- render ----------
  function visibleSteps() { return STEPS.filter(function (s) { return s.k !== 4 || !pkg() || showCorp(); }); }
  function header() {
    var vs = visibleSteps();
    return '<ol class="stepper" aria-label="Steps">' + vs.map(function (s, i) {
      var st = s.k < C.step ? "done" : s.k === C.step ? "current" : "";
      return '<li class="step ' + st + '"' + (st === "current" ? ' aria-current="step"' : "") + (s.k === 4 ? ' title="' + esc(CORP) + '"' : "") + '><span class="step-no">' +
        (st === "done" ? icon("check", "ico-sm") : i + 1) + "</span>" + s.t + "</li>";
    }).join("") + "</ol>";
  }
  function render() {
    var p = person();
    m.title.textContent = C.done ? "Converted" : "Convert to client";
    if (C.done) {
      m.body.innerHTML = C.doneHtml; m.foot.innerHTML = '<button class="btn btn-primary" data-cv="done">Done · back to profile</button>';
      m.foot.querySelector("[data-cv=done]").onclick = function () { m.exit(); };
      return;
    }
    // Stepper across the full width (one line on desktop), then steps left + sticky bill right (bill below on tablet).
    m.body.innerHTML = header() + '<div class="cv-layout"><div class="cv-main"><div class="cv-body">' + [null, s1, s2, s3, s4, s5][C.step](p) + "</div></div>" +
      '<aside class="cv-bill" aria-label="Bill summary" data-bill>' + bill(p) + "</aside></div>";
    var back = C.step > 1 ? '<button class="btn" data-cv="back">Previous</button>' : '<button class="btn" data-dm-back>Cancel</button>';
    var k = pkg(), last = C.step === 5;
    var nextLabel = !last ? "Next" : k && k.saleType === "Trial" ? "Book free trial" : "Proceed to Payment";
    m.foot.innerHTML = back + '<button class="btn btn-primary" data-cv="' + (last ? "finish" : "next") + '">' + nextLabel + "</button>";
    m.foot.querySelector("[data-cv=back]") && (m.foot.querySelector("[data-cv=back]").onclick = function () { go(-1); });
    m.foot.querySelector("[data-dm-back]") && (m.foot.querySelector("[data-dm-back]").onclick = function () { m.exit(); });
    m.foot.querySelector("[data-cv=next], [data-cv=finish]").onclick = last ? finish : function () { go(1); };
    App.$all("select", m.body).forEach(App.enhanceSelect);
  }

  // ---------- Bill summary (updates live on every step) ----------
  function bline(label, amt, sub, badge, attrs) {
    return '<div class="bill-line"' + (attrs || "") + '><div class="bill-what"><div>' + label + (badge || "") + "</div>" + (sub ? '<div class="cell-sub">' + sub + "</div>" : "") +
      '</div><div class="bill-amt">' + amt + "</div></div>";
  }
  function badgeFor(st) { return ' <span class="badge ' + (st === "Issued" ? "badge-success" : st === "Pending issue" ? "badge-warning" : "") + '">' + esc(st) + "</span>"; }
  function freeLineHtml(f) {
    var ctl = "";
    if (f.choice) ctl = '<div class="seg seg-sm" role="radiogroup" aria-label="' + esc(f.name) + ': when to issue">' + [["now", "Issue now"], ["later", "Later"]].map(function (o) {
      var on = (C.issue[f.itemId] || "now") === o[0];
      return '<button type="button" class="seg-btn' + (on ? " active" : "") + '" role="radio" aria-checked="' + on + '" data-issue="' + f.itemId + '" data-v="' + o[0] + '">' + o[1] + "</button>";
    }).join("") + "</div>";
    else if (f.forced) ctl = '<div class="cell-sub">Out of stock · Later (forced)</div>';
    return '<div class="bill-line bill-free"><div class="bill-what"><div>' + esc(f.name) + " × " + f.qty + badgeFor(f.status === "Skipped" ? "Skipped (already received)" : f.status) + "</div>" + ctl +
      '</div><div class="bill-amt">Free</div></div>';
  }
  function extraHtml(x, i, p) {
    var l = extraLine(x), max = itemQty(x.itemId, p.branchId);
    return '<div class="bill-line bill-extra"><div class="bill-what"><div class="bill-xrow"><span>' + esc(l.it.name) + "</span>" +
        '<label class="sr-only" for="xq' + i + '">Quantity</label><input class="input input-num input-xs" id="xq' + i + '" type="number" min="1" max="' + max + '" value="' + x.qty + '" data-x-qty="' + i + '">' +
        '<button type="button" class="btn btn-ghost icon-btn btn-xs" data-x-del="' + i + '" aria-label="Remove ' + esc(l.it.name) + '">' + icon("x", "ico-sm") + "</button></div>" +
        '<div class="cell-sub">' + App.fmtMoney(l.it.sellingPrice) + " each · locked · " + esc(App.branchName(p.branchId)) + " stock " + max + "</div>" +
        '<label class="switch"><input type="checkbox" data-x-free="' + i + '"' + (x.free ? " checked" : "") + '><span>Free (complimentary)</span></label>' +
        (x.free ? '<input class="input input-sm' + (C.errors["x" + i] ? " invalid" : "") + '" data-x-why="' + i + '" value="' + esc(x.why) + '" placeholder="Reason, e.g. Manager approval" aria-label="Reason for free ' + esc(l.it.name) + '">' : "") +
        (C.errors["x" + i] ? '<span class="error">' + C.errors["x" + i] + "</span>" : "") +
      '</div><div class="bill-amt" data-x-amt="' + i + '">' + (x.free ? "Free" : App.fmtMoney(l.amount)) + "</div></div>";
  }
  function pickList(p) {
    var q = C.pickQ.trim().toLowerCase(), list = accessories().filter(function (i) { return !q || i.name.toLowerCase().indexOf(q) > -1; });
    if (!list.length) return '<div class="muted bill-empty">No items match.</div>';
    return list.map(function (i) {
      var n = itemQty(i.id, p.branchId);
      return '<button type="button" class="pick-item" data-x-pick="' + i.id + '"' + (n ? "" : " disabled") + '><span>' + esc(i.name) + '</span><span class="cell-sub">' +
        App.fmtMoney(i.sellingPrice) + " · " + (n ? esc(App.branchName(p.branchId)) + " stock " + n : "Out of stock") + "</span></button>";
    }).join("");
  }
  function totalsHtml() {
    var k = pkg(), p = person(), mo = money(), dep = depositDue(), acc = extrasPaid();
    var fobItem = D.items.filter(function (i) { return i.kind === "Key fob"; })[0];
    var gst = App.gstSplit(mo.final, k.taxCategoryId).gst + (dep ? App.gstSplit(dep, fobItem && fobItem.taxCategoryId).gst : 0);
    C.extras.forEach(function (x) { var l = extraLine(x); if (l.amount) gst += App.gstSplit(l.amount, l.it.taxCategoryId).gst; });
    var h = bline("Package after discount", App.fmtMoney(mo.final));
    if (acc) h += bline("Accessories", App.fmtMoney(acc));
    if (dep) h += bline("Key fob deposit", App.fmtMoney(dep), "Refundable");
    h += '<div class="bill-gst">' + bline("GST included", App.fmtMoney(Math.round(gst * 100) / 100), "Prices include GST") + "</div>";
    return h + '<div class="bill-total"><span>Total to pay</span><strong data-total>' + App.fmtMoney(mo.final + acc + dep) + "</strong></div>";
  }
  function bill(p) {
    var k = pkg(), mo = money();
    var html = '<h3 class="bill-title">Bill summary</h3><div class="bill-person"><strong>' + esc(p.name) + '</strong><div class="cell-sub">' +
      esc(p.cc + " " + p.mobile) + " · " + esc(App.branchName(p.branchId)) + "</div></div>";
    if (!k) return html + '<p class="muted bill-empty">Choose a package to see the bill.</p>';
    html += bline(esc(k.name), k.price ? App.fmtMoney(k.price) : "Free", k.days + (k.days === 1 ? " day" : " days") + (k.sessions ? " · " + k.sessions + " sessions" : ""));
    if (mo.disc) html += bline("Discount", "− " + App.fmtMoney(mo.disc), reasonText() ? esc(reasonText()) : '<span class="warn-text">Reason needed</span>');
    html += freeLines(p, k).map(freeLineHtml).join("");
    html += C.extras.map(function (x, i) { return extraHtml(x, i, p); }).join("");
    if (k.saleType !== "Trial") {
      html += C.picker
        ? '<div class="bill-pick"><label class="sr-only" for="xPickQ">Search items</label><input class="input input-sm" id="xPickQ" type="search" data-x-q value="' + esc(C.pickQ) + '" placeholder="Search accessories…" autocomplete="off">' +
          '<div class="pick-list" data-x-list>' + pickList(p) + '</div><button type="button" class="link-btn" data-x-cancel>Cancel</button></div>'
        : '<button type="button" class="link-btn bill-add" data-x-add>' + icon("plus", "ico-sm") + "Add item</button>";
    }
    if (needsFob()) html += !C.fob ? bline("Key fob", "—", "Deposit " + App.fmtMoney(App.fobDeposit()) + " when assigned", ' <span class="badge badge-warning">Pending</span>')
      : C.fobFree ? bline("Key fob · " + esc(C.fob), "₹0", "Complimentary · " + (C.fobFreeWhy.trim() ? esc(C.fobFreeWhy.trim()) : '<span class="warn-text">Reason needed</span>'), ' <span class="badge badge-info">Complimentary</span>')
      : bline("Key fob deposit · " + esc(C.fob), App.fmtMoney(App.fobDeposit()), "Refundable · its own sale line");
    html += '<div data-bill-totals>' + totalsHtml() + "</div>";
    if (k.saleType === "Trial") html += '<p class="hint">Free trial · no payment.</p>';
    return html;
  }
  function updateBill() { var b = m && m.body.querySelector("[data-bill]"); if (b) b.innerHTML = bill(person()); }
  function updateTotals() { var t = m && m.body.querySelector("[data-bill-totals]"); if (t) t.innerHTML = totalsHtml(); }
  function checkExtras() {
    var e = {}, p = person();
    C.extras.forEach(function (x, i) {
      if (x.qty > itemQty(x.itemId, p.branchId)) e["x" + i] = "Only " + itemQty(x.itemId, p.branchId) + " in stock.";
      else if (x.free && !x.why.trim()) e["x" + i] = "A reason is needed for a free item.";
    });
    return e;
  }

  function err(k) { return C.errors[k] ? '<span class="error">' + C.errors[k] + "</span>" : ""; }
  function inv(k) { return C.errors[k] ? " invalid" : ""; }

  // Step 1 — confirm details
  function s1(p) {
    return '<p class="muted">Check the details. Name and mobile can be changed in the Details tab.</p>' +
      '<dl class="kv"><dt>Name</dt><dd>' + esc(p.name) + "</dd><dt>Mobile</dt><dd>" + esc(p.cc + " " + p.mobile) + "</dd>" +
      "<dt>Branch</dt><dd>" + esc(App.branchName(p.branchId)) + "</dd></dl>" +
      '<div class="form-grid">' +
        '<div class="field"><label for="cvEmail">Email</label><input class="input' + inv("email") + '" id="cvEmail" data-k="email" type="email" value="' + esc(C.email) + '" placeholder="name@example.com">' +
          (C.errors.email ? err("email") : C.email ? "" : '<span class="hint">No email: receipts go by WhatsApp only.</span>') + "</div>" +
        '<div class="field"><label for="cvGender">Gender <span class="req">*</span></label><select class="input' + inv("gender") + '" id="cvGender" data-k="gender">' +
          '<option value="">Choose…</option>' + D.lists.genders.map(function (g) { return "<option" + (g === C.gender ? " selected" : "") + ">" + g + "</option>"; }).join("") +
          "</select>" + err("gender") + "</div>" +
        '<div class="field"><label for="cvBirth">Birth date</label><input class="input" id="cvBirth" data-k="birthDate" type="date" value="' + esc(C.birthDate) + '" max="' + isoDay(new Date()) + '"></div>' +
      "</div>";
  }
  function dupMsg(o) {
    return o.branchId === person().branchId ? "Already used by <strong>" + esc(o.name) + "</strong>."
      : "Already exists in " + esc(App.branchName(o.branchId)) + " · Owner: " + esc(App.firstName(App.byId(D.users, o.ownerUserId))) +
        ' <button type="button" class="link-btn" data-toast="Access request sent (mockup)">Request access</button>';
  }
  function check1() {
    var e = {}, p = person(), em = C.email.trim().toLowerCase();
    if (!C.gender) e.gender = "Choose a gender.";
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) e.email = "Check the email format.";
    else if (em) { var d1 = D.people.filter(function (o) { return o.id !== p.id && (o.email || "").toLowerCase() === em; })[0]; if (d1) e.email = dupMsg(d1); }
    return e;
  }

  // Step 2 — package, discount, sales rep
  function discLine() {
    var mo = money();
    return mo.disc > 0 ? "Discount " + App.fmtMoney(mo.disc) + " · Final " + App.fmtMoney(mo.final) : "No discount · Final " + App.fmtMoney(mo.final);
  }
  function discError() {
    var k = pkg(), mo = money(), lim = limitPct();
    if (!k || !k.price) return "";
    if (Number(C.disc) < 0) return "Discount can't be negative.";
    if (mo.disc > k.price) return "Discount can't be more than the price.";
    if (lim != null && mo.pct > lim + 1e-9) return "Your limit is " + lim + "%.";
    return "";
  }
  function s2(p) {
    var k = pkg(), mo = money(), lim = limitPct(), de = C.errors.disc || discError();
    var html = '<div class="field pkg-search"><label for="cvPkgQ" class="sr-only">Search packages</label>' +
      '<input class="input" id="cvPkgQ" type="search" data-k="pkgQ" autocomplete="off" placeholder="Search packages by name…" value="' + esc(C.pkgQ) + '"></div>' +
      '<div data-pkglist>' + pkgList(p) + "</div>" + err("pkg");
    if (k && k.type === "Trial" && p.freeTrialCount > 0)
      html += '<div class="callout callout-warn">' + icon("alert") + "<span>This is their " + ordinal(p.freeTrialCount + 1) + " free trial.</span></div>";
    if (k && k.people === 2) html += '<p class="hint">Converts this person only. Adding the partner comes later.</p>';
    if (k && k.price > 0) {
      html += '<div class="form-grid mt-3">' +
        '<div class="field"><label>Price</label><div class="input input-static">' + App.fmtMoney(k.price) + ' <span class="muted">· locked</span></div></div>' +
        // Discount (decision #73): [% | ₹] + amount in one row, live line under it, limit note small.
        '<div class="field"><label for="cvDisc">Discount</label><div class="disc-row"><div class="seg seg-join" role="radiogroup" aria-label="Discount type">' +
          ["%", "₹"].map(function (x) { return '<button type="button" class="seg-btn' + (C.mode === x ? " active" : "") + '" role="radio" aria-checked="' + (C.mode === x) + '" data-disc="' + x + '">' + x + "</button>"; }).join("") +
          '</div><input class="input input-num' + (de ? " invalid" : "") + '" id="cvDisc" data-k="disc" type="number" min="0" value="' + esc(C.disc) + '" placeholder="0"></div>' +
          '<div class="disc-live" data-disc-line>' + discLine() + "</div>" +
          '<span class="error" data-disc-err' + (de ? "" : " hidden") + ">" + de + "</span>" +
          '<span class="hint">Your limit: ' + (lim == null ? "no limit" : lim + "%") + ' <span class="badge badge-demo">Placeholder</span></span></div>' +
        (mo.disc > 0 ? '<div class="field"><label for="cvReason">Discount reason <span class="req">*</span></label><select class="input' + inv("reason") + '" id="cvReason" data-k="reason">' +
            '<option value="">Choose…</option>' + D.lists.discountReasons.map(function (r) { return "<option" + (r === C.reason ? " selected" : "") + ">" + esc(r) + "</option>"; }).join("") + "</select>" + err("reason") +
            (C.reason === "Other" ? '<input class="input mt-1' + inv("reasonOther") + '" id="cvReasonOther" data-k="reasonOther" value="' + esc(C.reasonOther) + '" placeholder="Write the reason" aria-label="Other reason">' + err("reasonOther") : "") + "</div>" : "") +
        '<div class="field"><label for="cvRep">Sales rep <span class="req">*</span></label><select class="input" id="cvRep" data-k="repId">' + reps(p).map(function (u) {
          return '<option value="' + u.id + '"' + (u.id === C.repId ? " selected" : "") + ">" + esc(u.name) + "</option>"; }).join("") +
          '</select><span class="hint">Gets the credit for this sale line. Defaults to the lead owner.</span></div>' +
        "</div>";
    }
    return html;
  }
  // Accordions per category (+ / −) with a count; search filters across all groups and opens the ones with matches.
  function card(p, x) {
    var pt = x.type === "PT", sel = x.id === C.pkgId, fl = freeLines(p, x);
    return '<button type="button" class="pkg-card' + (sel ? " selected" : "") + '" data-pkg="' + x.id + '"' + (pt ? ' disabled title="PT needs an active membership"' : "") +
      ' aria-pressed="' + sel + '"><strong>' + esc(x.name) + '</strong><span class="cell-sub">' + x.days + (x.days === 1 ? " day" : " days") + (x.sessions ? " · " + x.sessions + " sessions" : "") +
      (x.people === 2 ? " · couple" : "") + '</span><span class="pkg-price">' + (x.price ? App.fmtMoney(x.price) : "Free") + "</span>" +
      (fl.length ? '<span class="pkg-free">Free: ' + fl.map(function (f) { return esc(f.name) + (f.status === "Skipped" ? " (already received)" : ""); }).join(", ") + "</span>" : "") +
      (pt ? '<span class="hint">PT needs an active membership</span>' : "") + "</button>";
  }
  function pkgList(p) {
    var q = C.pkgQ.trim().toLowerCase(), all = sellable(p), any = false;
    var html = GROUPS.map(function (g) {
      var list = all.filter(function (x) { return x.type === g[0]; });
      var shown = q ? list.filter(function (x) { return x.name.toLowerCase().indexOf(q) > -1; }) : list;
      if (!shown.length && (q || !list.length)) return "";
      any = true;
      var open = !!q || !!C.open[g[0]];
      return '<div class="acc' + (open ? " open" : "") + '"><button type="button" class="acc-head" data-acc="' + g[0] + '" aria-expanded="' + open + '">' +
        icon(open ? "minus" : "plus", "ico-sm") + '<span class="acc-title">' + g[1] + '</span><span class="badge">' + (q ? shown.length + " of " + list.length : list.length) + "</span></button>" +
        (open ? '<div class="pkg-grid acc-body">' + shown.map(function (x) { return card(p, x); }).join("") + "</div>" : "") + "</div>";
    }).join("");
    return any ? html : '<div class="state">No packages match "' + esc(C.pkgQ.trim()) + '".</div>';
  }
  function check2() {
    var e = {}, k = pkg(), mo = money();
    if (!k) { e.pkg = "Choose a package."; return e; }
    if (k.price > 0) {
      var de = discError(); if (de) e.disc = de;
      if (mo.disc > 0 && !C.reason) e.reason = "A reason is needed for a discount.";
      else if (mo.disc > 0 && C.reason === "Other" && !C.reasonOther.trim()) e.reasonOther = "Write the reason.";
    }
    return e;
  }

  // Step 3 — sale type (automatic) + start date
  function saleBox(k) {
    if (k.saleType === "Trial") return '<div class="next-step amber"><div class="ns-label">Sale type · automatic</div><strong>Free trial</strong> · stays a Lead<div class="cell-sub">No payment, no key fob, no FF ID. Next follow-up is asked right after.</div></div>';
    if (k.saleType === "Trial Paid") return '<div class="next-step green"><div class="ns-label">Sale type · automatic</div><strong>Paid trial</strong> · becomes a Client<div class="cell-sub">No key fob (trial). Next: Corporate entry, FF ID optional; nothing shows as pending if left empty.</div></div>';
    return '<div class="next-step green"><div class="ns-label">Sale type · automatic</div><strong>Paid</strong> · becomes a Client<div class="cell-sub">Next: Corporate entry (FF ID &amp; key fob). Both optional now; each shows as pending until filled.</div></div>';
  }
  function s3(p) {
    var k = pkg(), today = isoDay(new Date()), max = isoDay(plus(today, 30)), e = endDate();
    return saleBox(k) +
      '<div class="form-grid mt-3"><div class="field"><label for="cvStart">Start date <span class="req">*</span></label>' +
        '<input class="input' + inv("start") + '" id="cvStart" data-k="start" type="date" min="' + today + '" max="' + max + '" value="' + esc(C.start) + '">' +
        (C.errors.start ? err("start") : '<span class="hint">Today up to 30 days ahead. No back dates.</span>') + "</div>" +
      '<div class="field"><label>Ends</label><div class="input input-static" data-end>' + (e ? esc(App.fmtDate(e.toISOString())) + ' <span class="muted">· ' + k.days + (k.days === 1 ? " day" : " days") + ", start day included</span>" : "—") + "</div></div></div>";
  }
  function check3() {
    var e = {}, today = isoDay(new Date()), max = isoDay(plus(today, 30));
    if (!C.start) e.start = "Pick a start date.";
    else if (C.start < today) e.start = "Back dates are not allowed.";
    else if (C.start > max) e.start = "Start can be at most 30 days ahead.";
    return e;
  }

  // Step 4 — Corporate entry: FF ID & key fob (decisions #67, #72, #75)
  function s4(p) {
    var st = stock(p), fobOk = needsFob();
    var head = '<h3 class="cv-sec-title">' + esc(CORP) + '</h3><p class="muted">' + (fobOk ? "Both are optional now. Each shows as pending on the profile until filled."
        : "Optional for a paid trial. If left empty nothing shows as pending.") + "</p>" +
      '<div class="field"><label for="cvFf">FF ID</label><input class="input' + inv("ffId") + '" id="cvFf" data-k="ffId" value="' + esc(C.ffId) + '" placeholder="e.g. FF-20500">' +
        (C.errors.ffId ? err("ffId") : '<span class="hint">From the corporate software. Usually added after the client is entered there.</span>') + "</div>";
    if (!fobOk) return head + '<div class="field"><label>Key fob</label><p class="muted">No key fob for trial memberships.</p></div>';
    head += '<div class="field"><label>Key fob</label>';
    if (!st.length) return head + '<div class="callout callout-warn">' + icon("alert") + "<span>No key fobs in stock at " + esc(App.branchName(p.branchId)) +
      ". You can finish now; <strong>Key fob pending</strong> shows on the profile until one is assigned.</span></div></div>";
    return head + '<p class="muted">' + esc(App.branchName(p.branchId)) + " stock: " + st.length + " in stock</p>" +
      '<div class="fob-pick"><div class="chips" role="radiogroup" aria-label="Key fob">' + st.map(function (f) {
        return '<button type="button" class="chip' + (C.fob === f.no ? " selected" : "") + '" role="radio" aria-checked="' + (C.fob === f.no) + '" data-fob="' + f.no + '">' + icon("key", "ico-sm") + esc(f.no) + "</button>";
      }).join("") + '<button type="button" class="chip' + (C.fob === "" ? " selected" : "") + '" role="radio" aria-checked="' + (C.fob === "") + '" data-fob="">Add later</button></div>' +
      (C.fob ? '<label class="switch"><input type="checkbox" id="cvFobFree" data-fobfree' + (C.fobFree ? " checked" : "") + "><span>Free (no deposit)</span></label>" : "") + "</div>" +
      (C.fob && C.fobFree ? '<div class="field mt-1"><label for="cvFobWhy">Reason for a free fob <span class="req">*</span></label><input class="input' + inv("fobFreeWhy") + '" id="cvFobWhy" data-k="fobFreeWhy" value="' + esc(C.fobFreeWhy) + '" placeholder="e.g. Corporate tie-up">' + err("fobFreeWhy") + "</div>" : "") +
      '<p class="hint">Usually given after the client is entered in the corporate software. "Add later" shows <strong>Key fob pending</strong>. The deposit is added to the bill.</p></div>';
  }
  function check4() {
    var e = {}, p = person(), ff = C.ffId.trim().toLowerCase();
    if (ff) { var d2 = D.people.filter(function (o) { return o.id !== p.id && (o.ffId || "").toLowerCase() === ff; })[0]; if (d2) e.ffId = dupMsg(d2); }
    if (needsFob() && C.fob && C.fobFree && !C.fobFreeWhy.trim()) e.fobFreeWhy = "A reason is needed for a free fob.";
    return e;
  }

  // Step 5 — summary
  function s5(p) {
    var k = pkg(), mo = money(), e = endDate(), trial = k.saleType === "Trial";
    var rows = [["Person", p.name + " · " + p.cc + " " + p.mobile], ["Package", k.name], ["Sale type", trial ? "Free trial (stays a Lead)" : k.saleType],
      ["Start – end", App.fmtDate(new Date(C.start + "T00:00").toISOString()) + " – " + App.fmtDate(e.toISOString())]];
    // Money lines (price, discount, free items, accessories, deposit, GST, total) are in the bill summary on the right.
    if (!trial) {
      rows.push(["Sales rep", App.userName(C.repId)]);
      if (mo.disc) rows.push(["Discount reason", reasonText()]);
      if (needsFob()) rows.push([CORP, "FF ID: " + (C.ffId.trim() || "Pending") + " · Key fob: " + (C.fob ? C.fob + (C.fobFree ? " (free)" : "") : "Pending")]);
      else if (showCorp()) rows.push([CORP, "FF ID: " + (C.ffId.trim() || "Not set (optional)")]);
    }
    if (!p.ownerUserId) rows.push(["Owner", App.me().name + " (you, lead was unassigned)"]);
    var open = App.Followup.openFollowUps(p.id).length;
    return '<dl class="kv kv-wide">' + rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
      (!trial && open ? '<p class="hint">' + open + " open follow-up" + (open > 1 ? "s" : "") + " will be closed by system · client converted.</p>" : "") +
      (trial ? "" : '<div class="callout">' + icon("info") + "<span>Payment comes with the Payment module. In the real app the person becomes a client only after payment succeeds.</span></div>");
  }

  // ---------- navigation ----------
  function go(dir) {
    if (dir > 0) {
      var e = Object.assign([null, check1, check2, check3, check4][C.step](), C.step >= 2 ? checkExtras() : {});
      C.errors = e; if (Object.keys(e).length) { render(); var f = m.body.querySelector(".invalid, .error"); if (f && f.focus) f.focus(); return; }
    } else C.errors = {};
    var vs = visibleSteps().map(function (s) { return s.k; }), i = vs.indexOf(C.step) + dir;
    C.step = vs[Math.max(0, Math.min(vs.length - 1, i))];
    render();
  }
  function onClick(e) {
    var t = e.target.closest("[data-pkg],[data-disc],[data-fob],[data-acc],[data-issue],[data-x-add],[data-x-cancel],[data-x-pick],[data-x-del]"); if (!t || t.disabled) return;
    var p = person();
    if (t.dataset.acc) {
      C.open[t.dataset.acc] = !C.open[t.dataset.acc];
      m.body.querySelector("[data-pkglist]").innerHTML = pkgList(p);
      var h = m.body.querySelector('[data-acc="' + t.dataset.acc + '"]'); if (h) h.focus();
      return;
    }
    if (t.dataset.issue) { C.issue[t.dataset.issue] = t.dataset.v; updateBill(); return; }
    if (t.hasAttribute("data-x-add")) { C.picker = true; C.pickQ = ""; updateBill(); var s = m.body.querySelector("#xPickQ"); if (s) s.focus(); return; }
    if (t.hasAttribute("data-x-cancel")) { C.picker = false; updateBill(); return; }
    if (t.dataset.xPick) {
      var ex = C.extras.filter(function (x) { return x.itemId === t.dataset.xPick && !x.free; })[0];
      if (ex) ex.qty = Math.min(ex.qty + 1, itemQty(ex.itemId, p.branchId)); else C.extras.push({ itemId: t.dataset.xPick, qty: 1, free: false, why: "" });
      C.picker = false; updateBill(); return;
    }
    if (t.dataset.xDel) { C.extras.splice(+t.dataset.xDel, 1); C.errors = {}; updateBill(); return; }
    if (t.dataset.pkg) { C.pkgId = t.dataset.pkg; delete C.errors.pkg; if (pkg().price === 0) { C.disc = ""; C.reason = ""; C.reasonOther = ""; } }
    if (t.dataset.disc) { C.mode = t.dataset.disc; }
    if (t.hasAttribute("data-fob")) { C.fob = t.dataset.fob; if (!C.fob) { C.fobFree = false; C.fobFreeWhy = ""; } }
    render();
  }
  function onInput(e) {
    var d = e.target.dataset || {};
    if (d.xQ != null) { C.pickQ = e.target.value; m.body.querySelector("[data-x-list]").innerHTML = pickList(person()); return; }
    if (d.xQty != null) {
      var x = C.extras[+d.xQty], v = Math.max(1, Math.round(Number(e.target.value) || 1));
      x.qty = v; var a = m.body.querySelector('[data-x-amt="' + d.xQty + '"]'); if (a) a.textContent = x.free ? "Free" : App.fmtMoney(extraLine(x).amount);
      updateTotals(); return;
    }
    if (d.xWhy != null) { C.extras[+d.xWhy].why = e.target.value; return; }
    if (d.xFree != null) { var y = C.extras[+d.xFree]; y.free = e.target.checked; if (!y.free) y.why = ""; updateBill(); var w = m.body.querySelector('[data-x-why="' + d.xFree + '"]'); if (w) w.focus(); return; }
    if (e.target.hasAttribute("data-fobfree")) { C.fobFree = e.target.checked; if (!C.fobFree) C.fobFreeWhy = ""; render(); var fw = m.body.querySelector("#cvFobWhy"); if (fw) fw.focus(); return; }
    var k = d.k; if (!k) return;
    C[k] = e.target.value;
    if (k === "pkgQ") { m.body.querySelector("[data-pkglist]").innerHTML = pkgList(person()); return; }
    if (k === "disc") {   // live line + inline limit error without re-rendering the input
      var mo = money();
      if ((mo.disc > 0) !== !!m.body.querySelector("#cvReason")) { render(); m.body.querySelector("#cvDisc").focus(); }
      else {
        var de = discError(), el = m.body.querySelector("[data-disc-err]");
        m.body.querySelector("[data-disc-line]").textContent = discLine();
        el.textContent = de; el.hidden = !de; m.body.querySelector("#cvDisc").classList.toggle("invalid", !!de);
      }
    }
    if (k === "reason" && e.type === "change") { render(); var o = m.body.querySelector("#cvReasonOther"); if (o) o.focus(); return; }
    if (k === "fobFreeWhy" || k === "reasonOther") { var b = m.body.querySelector("[data-bill]"); if (b) b.innerHTML = bill(person()); return; }
    updateBill();
    if (k === "start") { var en = m.body.querySelector("[data-end]"), ed = endDate(); if (en && ed) en.innerHTML = esc(App.fmtDate(ed.toISOString())) + ' <span class="muted">· ' + pkg().days + " days, start day included</span>"; }
    if (k === "email" && e.type === "change") render();
  }

  // ---------- finish ----------
  function finish() {
    var xe = checkExtras(); if (Object.keys(xe).length) { C.errors = xe; render(); return; }
    var p = person(), k = pkg(), mo = money(), now = new Date().toISOString(), me = App.me();
    p.email = C.email.trim() || null; p.gender = C.gender; p.birthDate = C.birthDate || null; p.ffId = C.ffId.trim() || null;
    if (!p.ownerUserId) { p.ownerHistory.push({ from: null, to: me.id, at: now, by: me.id }); p.ownerUserId = me.id; App.Followup.openFollowUps(p.id).forEach(function (f) { f.ownerUserId = me.id; }); }
    var startIso = new Date(C.start + "T00:00").toISOString(), endIso = endDate().toISOString();

    if (k.saleType === "Trial") {   // decision #3: free trial stays a Lead; many allowed (warning only)
      p.freeTrialCount = (p.freeTrialCount || 0) + 1;
      p.stage = "Trial"; p.freeTrial = { from: startIso, to: endIso };
      App.addTimeline(p.id, "milestone", "Free trial booked · " + k.days + (k.days === 1 ? " day" : " days") + " from " + App.fmtShortWhen(startIso) +
        (p.freeTrialCount > 1 ? " · " + ordinal(p.freeTrialCount) + " free trial" : ""));
      C.done = true; m.exit(true); C = null;
      App.toast("Free trial booked for " + p.name, "success"); App.dataChanged();
      if (!App.Followup.openFollowUps(p.id).length)
        App.Followup.openAdd(p.id, { title: "Set next follow-up", type: "Visit planned", intro: "Free trial booked. When will you follow up?", cancelText: "Later" });
      return;
    }

    var clientNo = "CL-" + D.nextClientNo++, why = reasonText();
    function takeStock(itemId, qty, note) {
      var st = D.itemStock.filter(function (x) { return x.itemId === itemId && x.branchId === p.branchId; })[0];
      st.qty -= qty; D.stockMoves.push({ itemId: itemId, branchId: p.branchId, qty: -qty, at: now, by: me.id, note: note });
    }
    p.kind = "Client"; p.stage = "Converted"; p.clientNo = clientNo; p.homeBranchId = p.branchId; p.joinedAt = now; p.photo = null;
    p.membership = { packageId: k.id, package: k.name, saleType: k.saleType, start: startIso, end: endIso, price: k.price,
      discount: mo.disc, discountReason: mo.disc ? why : null, finalPrice: mo.final, salesRepUserId: C.repId,
      freeItems: freeLines(p, k).map(function (f) { return { itemId: f.itemId, name: f.name, qty: f.qty, status: f.status }; }),
      items: C.extras.map(function (x) { var l = extraLine(x); return { itemId: x.itemId, name: l.it.name, qty: x.qty, price: l.amount, free: x.free, reason: x.free ? x.why.trim() : null }; }) };
    p.membership.freeItems.forEach(function (f) {
      if (f.status !== "Issued") return;
      takeStock(f.itemId, f.qty, "Free with " + k.name + " · " + p.name);
      p.freeItemsReceived = (p.freeItemsReceived || []).concat(f.itemId);
    });
    p.membership.items.forEach(function (x) { takeStock(x.itemId, x.qty, (x.free ? "Complimentary (" + x.reason + ")" : "Sold") + " · " + p.name); });
    p.keyFob = null;
    if (needsFob() && C.fob) {
      var fob = D.keyFobs.filter(function (f) { return f.no === C.fob; })[0];
      fob.status = "Assigned"; fob.personId = p.id; p.keyFob = fob.no;
      // Deposit = a line in the same sale (decision #55). Free fob = complimentary, no deposit, reason kept (decision #75).
      fob.deposit = C.fobFree ? { amount: 0, refunded: 0, complimentary: true, reason: C.fobFreeWhy.trim() } : { amount: App.fobDeposit(), refunded: 0 };
      fob.history.push({ at: now, text: "Assigned to " + p.name + (C.fobFree ? " · free, no deposit (" + C.fobFreeWhy.trim() + ")" : " · deposit " + App.fmtMoney(App.fobDeposit()) + " collected"), by: me.id });
    }
    var closed = App.Followup.closeBySystem(p.id, "Client converted");
    App.addTimeline(p.id, "milestone", "Converted to Client · " + k.name + " · " + App.fmtMoney(mo.final) +
      (mo.disc ? " (" + App.fmtMoney(mo.disc) + " off: " + why + ")" : "") + (p.keyFob ? " · key fob " + p.keyFob + (C.fobFree ? " (free)" : "") : "") +
      (p.membership.items.length ? " · " + p.membership.items.map(function (x) { return x.name + " × " + x.qty + (x.free ? " (free)" : ""); }).join(", ") : "") +
      " · sales rep " + App.firstName(App.byId(D.users, C.repId)));
    var pend = App.profilePending ? App.profilePending(p) : [];
    C.done = true;
    C.doneHtml = '<div class="state">' + icon("check") + "<h3>" + esc(p.name) + " is now a client (" + esc(clientNo) + ")</h3>" +
      '<p class="muted">Payment comes with the Payment module. In the real app this happens only after payment succeeds.</p>' +
      (closed ? '<p class="hint">' + closed + " open follow-up" + (closed > 1 ? "s" : "") + " closed by system · client converted.</p>" : "") +
      (pend.length ? '<div class="stack">' + pend.map(function (x) { return '<span class="badge badge-warning">' + esc(x.t) + "</span>"; }).join("") + "</div>" : "") + "</div>";
    render();
    App.toast(p.name + " is now a client (" + clientNo + ")", "success");
    C.clientId = p.id;
    App.dataChanged();
    App.openProfile(p.id, { state: "normal", tab: "membership" });   // updates the link to #client-…; shows when the mode exits
  }

  App.Convert = { open: open };
})();
