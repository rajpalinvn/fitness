/* Convert to Client stepper (decisions #3, #4, #13, #14, #20, #36–#41).
     App.Convert.open(personId)
   Steps: 1 Details · 2 Package · 3 Sale & start · 4 Key fob (Paid membership only) · 5 Summary.
   MOCKUP: the person is converted when "Proceed to Payment" is clicked.
   REAL APP: convert only after payment succeeds ("money taken = client").
   Load after profile.js. */
(function () {
  var D = window.DUMMY, esc = App.esc, icon = App.icon;
  var REP_ROLES = ["Sales Executive", "Sales Manager", "Club Manager"];
  var STEPS = [{ k: 1, t: "Details" }, { k: 2, t: "Package" }, { k: 3, t: "Sale & start" }, { k: 4, t: "Key fob" }, { k: 5, t: "Summary" }];
  var C = null, m = null;

  function person() { return App.byId(D.people, C.pid); }
  function pkg() { return C.pkgId ? App.byId(D.packages, C.pkgId) : null; }
  function needsFob() { var k = pkg(); return !!k && k.saleType === "Paid" && k.type === "Membership"; }
  function isoDay(d) { var x = new Date(d); return x.getFullYear() + "-" + ("0" + (x.getMonth() + 1)).slice(-2) + "-" + ("0" + x.getDate()).slice(-2); }
  function plus(iso, n) { var d = new Date(iso + "T00:00"); d.setDate(d.getDate() + n); return d; }
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function limitPct() { var l = D.discountLimits[App.state.role]; return l == null ? null : l; }
  function stock(p) { return D.keyFobs.filter(function (k) { return k.branchId === p.branchId && k.status === "In stock"; }); }
  function reps(p) { return D.users.filter(function (u) { return u.branches.indexOf(p.branchId) > -1 && REP_ROLES.indexOf(u.role) > -1; }); }

  // Packages a lead can buy: active, sold at the lead's branch, audience New or Both, not an Add-on (decisions #47, #50).
  function sellable(p) {
    return D.packages.filter(function (x) { return x.active && x.category !== "Add-on" && x.branchIds.indexOf(p.branchId) > -1 && x.audience !== "Renewal"; });
  }
  // Free items: "Once per client" is skipped if the person ever got it free; out of stock -> "Pending issue" (decision #46).
  function freeLines(p, k) {
    return (k.freeItems || []).map(function (f) {
      var it = App.byId(D.items, f.itemId), got = (p.freeItemsReceived || []).indexOf(f.itemId) > -1;
      if (f.rule === "Once per client" && got) return { itemId: f.itemId, name: it.name, qty: f.qty, status: "Skipped", why: "already received free once" };
      var st = D.itemStock.filter(function (x) { return x.itemId === f.itemId && x.branchId === p.branchId; })[0];
      return { itemId: f.itemId, name: it.name, qty: f.qty, status: st && st.qty >= f.qty ? "Issued" : "Pending issue", why: st && st.qty >= f.qty ? "" : "out of stock" };
    });
  }
  function depositDue() { return needsFob() && C.fob ? App.fobDeposit() : 0; }
  // Discount money + percent from what was typed.
  function money() {
    var k = pkg(); if (!k) return { price: 0, disc: 0, pct: 0, final: 0 };
    var v = Number(C.disc) || 0, disc = C.mode === "%" ? Math.round(k.price * v / 100) : Math.round(v);
    return { price: k.price, disc: disc, pct: k.price ? disc / k.price * 100 : 0, final: k.price - disc };
  }
  function endDate() { var k = pkg(); return k ? plus(C.start, k.days - 1) : null; }   // start day included (decision #39)

  // ---------- open ----------
  function open(pid) {
    var p = App.byId(D.people, pid); if (!App.Followup.isOpenLead(p)) return;
    C = { pid: pid, step: 1, done: false, email: p.email || "", gender: p.gender || "", birthDate: p.birthDate || "", ffId: p.ffId || "",
      pkgId: null, mode: "%", disc: "", reason: "", repId: p.ownerUserId || App.me().id, start: isoDay(new Date()), fob: "", errors: {} };
    m = App.makeModal("convertModal", "lg");
    m.el.onCloseHook = function () { if (C && !C.done) App.toast("Conversion not saved", ""); C = C && C.done ? null : C; };
    m.body.onclick = onClick; m.body.oninput = onInput; m.body.onchange = onInput;
    render();
    App.openModal("convertModal");
  }

  // ---------- render ----------
  function visibleSteps() { return STEPS.filter(function (s) { return s.k !== 4 || !pkg() || needsFob(); }); }
  function header() {
    var vs = visibleSteps();
    return '<ol class="stepper" aria-label="Steps">' + vs.map(function (s, i) {
      var st = s.k < C.step ? "done" : s.k === C.step ? "current" : "";
      return '<li class="step ' + st + '"' + (st === "current" ? ' aria-current="step"' : "") + '><span class="step-no">' +
        (st === "done" ? icon("check", "ico-sm") : i + 1) + "</span>" + s.t + "</li>";
    }).join("") + "</ol>";
  }
  function render() {
    var p = person();
    m.title.textContent = C.done ? "Done" : "Convert " + p.name + " to Client";
    if (C.done) { m.body.innerHTML = C.doneHtml; m.foot.innerHTML = '<button class="btn btn-primary" data-close>Done</button>'; return; }
    m.body.innerHTML = header() + '<div class="cv-body">' + [null, s1, s2, s3, s4, s5][C.step](p) + "</div>";
    var back = C.step > 1 ? '<button class="btn" data-cv="back">Back</button>' : '<button class="btn" data-close>Cancel</button>';
    var k = pkg(), last = C.step === 5;
    var nextLabel = !last ? "Next" : k && k.saleType === "Trial" ? "Book free trial" : "Proceed to Payment";
    m.foot.innerHTML = back + '<button class="btn btn-primary" data-cv="' + (last ? "finish" : "next") + '">' + nextLabel + "</button>";
    m.foot.querySelector("[data-cv=back]") && (m.foot.querySelector("[data-cv=back]").onclick = function () { go(-1); });
    m.foot.querySelector("[data-cv=next], [data-cv=finish]").onclick = last ? finish : function () { go(1); };
    App.$all("select", m.body).forEach(App.enhanceSelect);
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
        '<div class="field"><label for="cvFf">FF ID</label><input class="input' + inv("ffId") + '" id="cvFf" data-k="ffId" value="' + esc(C.ffId) + '" placeholder="e.g. FF-20500">' +
          (C.errors.ffId ? err("ffId") : '<span class="hint">From the corporate software. Usually added after the client is entered there; shows as pending until then.</span>') + "</div>" +
      "</div>";
  }
  function dupMsg(o) {
    return o.branchId === person().branchId ? "Already used by <strong>" + esc(o.name) + "</strong>."
      : "Already exists in " + esc(App.branchName(o.branchId)) + " · Owner: " + esc(App.firstName(App.byId(D.users, o.ownerUserId))) +
        ' <button type="button" class="link-btn" data-toast="Access request sent (mockup)">Request access</button>';
  }
  function check1() {
    var e = {}, p = person(), em = C.email.trim().toLowerCase(), ff = C.ffId.trim().toLowerCase();
    if (!C.gender) e.gender = "Choose a gender.";
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) e.email = "Check the email format.";
    else if (em) { var d1 = D.people.filter(function (o) { return o.id !== p.id && (o.email || "").toLowerCase() === em; })[0]; if (d1) e.email = dupMsg(d1); }
    if (ff) { var d2 = D.people.filter(function (o) { return o.id !== p.id && (o.ffId || "").toLowerCase() === ff; })[0]; if (d2) e.ffId = dupMsg(d2); }
    return e;
  }

  // Step 2 — package, discount, sales rep
  var GROUPS = [["Trial", "Free trial"], ["Trial Paid", "Paid trial"], ["Membership", "Membership"], ["PT", "Personal training"]];
  function s2(p) {
    var k = pkg(), mo = money(), lim = limitPct();
    var html = GROUPS.map(function (g) {
      return '<div class="tl-group-label">' + g[1] + '</div><div class="pkg-grid">' + sellable(p).filter(function (x) { return x.type === g[0]; }).map(function (x) {
        var pt = x.type === "PT", sel = x.id === C.pkgId;
        return '<button type="button" class="pkg-card' + (sel ? " selected" : "") + '" data-pkg="' + x.id + '"' + (pt ? ' disabled title="PT needs an active membership"' : "") +
          ' aria-pressed="' + sel + '"><strong>' + esc(x.name) + '</strong><span class="cell-sub">' + x.days + (x.days === 1 ? " day" : " days") + (x.sessions ? " · " + x.sessions + " sessions" : "") +
          (x.people === 2 ? " · couple" : "") + '</span><span class="pkg-price">' + (x.price ? App.fmtMoney(x.price) : "Free") + "</span>" +
          (pt ? '<span class="hint">PT needs an active membership</span>' : "") + "</button>";
      }).join("") + "</div>";
    }).join("") + err("pkg");
    if (k && k.type === "Trial" && p.freeTrialCount > 0)
      html += '<div class="callout callout-warn">' + icon("alert") + "<span>This is their " + ordinal(p.freeTrialCount + 1) + " free trial.</span></div>";
    if (k && k.people === 2) html += '<p class="hint">Converts this person only. Adding the partner comes later.</p>';
    if (k && k.price > 0) {
      html += '<div class="form-grid mt-3">' +
        '<div class="field"><label>Price</label><div class="input input-static">' + App.fmtMoney(k.price) + ' <span class="muted">· locked</span></div></div>' +
        '<div class="field"><label for="cvDisc">Discount</label><div class="row">' +
          '<div class="chips"><button type="button" class="chip' + (C.mode === "%" ? " selected" : "") + '" data-mode="%">%</button>' +
          '<button type="button" class="chip' + (C.mode === "₹" ? " selected" : "") + '" data-mode="₹">₹</button></div>' +
          '<input class="input input-num' + inv("disc") + '" id="cvDisc" data-k="disc" type="number" min="0" value="' + esc(C.disc) + '" placeholder="0"></div>' + err("disc") +
          '<span class="hint">Your limit: ' + (lim == null ? "no limit" : lim + "%") + ' <span class="badge badge-demo">Placeholder</span> · admin settings later</span></div>' +
        (mo.disc > 0 ? '<div class="field"><label for="cvReason">Discount reason <span class="req">*</span></label><input class="input' + inv("reason") + '" id="cvReason" data-k="reason" value="' + esc(C.reason) + '" placeholder="e.g. Diwali offer">' + err("reason") + "</div>" : "") +
        '<div class="field"><label for="cvRep">Sales rep <span class="req">*</span></label><select class="input" id="cvRep" data-k="repId">' + reps(p).map(function (u) {
          return '<option value="' + u.id + '"' + (u.id === C.repId ? " selected" : "") + ">" + esc(u.name) + "</option>"; }).join("") +
          '</select><span class="hint">Gets the credit for this sale line. Defaults to the lead owner.</span></div>' +
        "</div>" +
        '<div class="cv-total">Final price <strong data-final>' + App.fmtMoney(mo.final) + "</strong>" + (mo.disc ? ' <span class="muted" data-saved>(' + App.fmtMoney(mo.disc) + " off)</span>" : "") + "</div>";
    }
    return html;
  }
  function check2() {
    var e = {}, k = pkg(), mo = money(), lim = limitPct();
    if (!k) { e.pkg = "Choose a package."; return e; }
    if (k.price > 0) {
      if (Number(C.disc) < 0) e.disc = "Discount can't be negative.";
      else if (mo.disc > k.price) e.disc = "Discount can't be more than the price.";
      else if (lim != null && mo.pct > lim + 1e-9) e.disc = "Your limit is " + lim + "%.";
      if (mo.disc > 0 && !C.reason.trim()) e.reason = "A reason is needed for a discount.";
    }
    return e;
  }

  // Step 3 — sale type (automatic) + start date
  function saleBox(k) {
    if (k.saleType === "Trial") return '<div class="next-step amber"><div class="ns-label">Sale type · automatic</div><strong>Free trial</strong> · stays a Lead<div class="cell-sub">No payment, no key fob, no FF ID. Next follow-up is asked right after.</div></div>';
    if (k.saleType === "Trial Paid") return '<div class="next-step green"><div class="ns-label">Sale type · automatic</div><strong>Paid trial</strong> · becomes a Client<div class="cell-sub">No key fob (trial). FF ID per admin rule (later).</div></div>';
    return '<div class="next-step green"><div class="ns-label">Sale type · automatic</div><strong>Paid</strong> · becomes a Client<div class="cell-sub">FF ID and key fob are required; each shows as pending until filled.</div></div>';
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

  // Step 4 — key fob (Paid membership only)
  function s4(p) {
    var st = stock(p);
    if (!st.length) return '<div class="callout callout-warn">' + icon("alert") + "<span>No key fobs in stock at " + esc(App.branchName(p.branchId)) +
      ". You can finish now; <strong>Key fob pending</strong> shows on the profile until one is assigned.</span></div>";
    return '<p class="muted">' + esc(App.branchName(p.branchId)) + " stock: " + st.length + " in stock</p>" +
      '<div class="chips" role="radiogroup" aria-label="Key fob">' + st.map(function (f) {
        return '<button type="button" class="chip' + (C.fob === f.no ? " selected" : "") + '" role="radio" aria-checked="' + (C.fob === f.no) + '" data-fob="' + f.no + '">' + icon("key", "ico-sm") + esc(f.no) + "</button>";
      }).join("") + '<button type="button" class="chip' + (C.fob === "" ? " selected" : "") + '" role="radio" aria-checked="' + (C.fob === "") + '" data-fob="">Add later</button></div>' +
      '<p class="hint">Usually given after the client is entered in the corporate software. "Add later" shows <strong>Key fob pending</strong>.</p>';
  }

  // Step 5 — summary
  function s5(p) {
    var k = pkg(), mo = money(), e = endDate(), trial = k.saleType === "Trial";
    var rows = [["Person", p.name + " · " + p.cc + " " + p.mobile], ["Package", k.name], ["Sale type", trial ? "Free trial (stays a Lead)" : k.saleType],
      ["Start – end", App.fmtDate(new Date(C.start + "T00:00").toISOString()) + " – " + App.fmtDate(e.toISOString())]];
    if (!trial) {
      rows.push(["Price", App.fmtMoney(mo.price)]);
      if (mo.disc) rows.push(["Discount", App.fmtMoney(mo.disc) + " · " + C.reason.trim()]);
      rows.push(["Final price", App.fmtMoney(mo.final)], ["Sales rep", App.userName(C.repId)]);
      if (k.saleType === "Paid") rows.push(["FF ID", C.ffId.trim() || "Pending"], ["Key fob", C.fob || "Pending"]);
      if (depositDue()) rows.push(["Key fob deposit", App.fmtMoney(depositDue()) + " (refundable, separate line)"], ["Total to pay", App.fmtMoney(mo.final + depositDue())]);
      freeLines(p, k).forEach(function (f) { rows.push(["Free item", f.name + " × " + f.qty + " · " + f.status + (f.why ? " (" + f.why + ")" : "")]); });
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
      var e = [null, check1, check2, check3, function () { return {}; }][C.step]();
      C.errors = e; if (Object.keys(e).length) { render(); var f = m.body.querySelector(".invalid, .error"); if (f && f.focus) f.focus(); return; }
    } else C.errors = {};
    var vs = visibleSteps().map(function (s) { return s.k; }), i = vs.indexOf(C.step) + dir;
    C.step = vs[Math.max(0, Math.min(vs.length - 1, i))];
    render();
  }
  function onClick(e) {
    var t = e.target.closest("[data-pkg],[data-mode],[data-fob]"); if (!t) return;
    if (t.dataset.pkg) { C.pkgId = t.dataset.pkg; delete C.errors.pkg; if (pkg().price === 0) { C.disc = ""; C.reason = ""; } }
    if (t.dataset.mode) { C.mode = t.dataset.mode; }
    if (t.hasAttribute("data-fob")) C.fob = t.dataset.fob;
    render();
  }
  function onInput(e) {
    var k = e.target.dataset && e.target.dataset.k; if (!k) return;
    C[k] = e.target.value;
    if (k === "disc") {   // live total without re-rendering the input
      var mo = money(), f = m.body.querySelector("[data-final]");
      if (f) f.textContent = App.fmtMoney(mo.final);
      if ((mo.disc > 0) !== !!m.body.querySelector("#cvReason")) { render(); m.body.querySelector("#cvDisc").focus(); }
    }
    if (k === "start") { var en = m.body.querySelector("[data-end]"), ed = endDate(); if (en && ed) en.innerHTML = esc(App.fmtDate(ed.toISOString())) + ' <span class="muted">· ' + pkg().days + " days, start day included</span>"; }
    if (k === "email" && e.type === "change") render();
  }

  // ---------- finish ----------
  function finish() {
    var p = person(), k = pkg(), mo = money(), now = new Date().toISOString(), me = App.me();
    p.email = C.email.trim() || null; p.gender = C.gender; p.birthDate = C.birthDate || null; p.ffId = C.ffId.trim() || null;
    if (!p.ownerUserId) { p.ownerHistory.push({ from: null, to: me.id, at: now, by: me.id }); p.ownerUserId = me.id; App.Followup.openFollowUps(p.id).forEach(function (f) { f.ownerUserId = me.id; }); }
    var startIso = new Date(C.start + "T00:00").toISOString(), endIso = endDate().toISOString();

    if (k.saleType === "Trial") {   // decision #3: free trial stays a Lead; many allowed (warning only)
      p.freeTrialCount = (p.freeTrialCount || 0) + 1;
      p.stage = "Trial"; p.freeTrial = { from: startIso, to: endIso };
      App.addTimeline(p.id, "milestone", "Free trial booked · " + k.days + (k.days === 1 ? " day" : " days") + " from " + App.fmtShortWhen(startIso) +
        (p.freeTrialCount > 1 ? " · " + ordinal(p.freeTrialCount) + " free trial" : ""));
      C.done = true; App.close(m.el); C = null;
      App.toast("Free trial booked for " + p.name, "success"); App.dataChanged();
      App.openProfile(p.id, { state: "normal" });
      if (!App.Followup.openFollowUps(p.id).length)
        App.Followup.openAdd(p.id, { title: "Set next follow-up", type: "Visit planned", intro: "Free trial booked. When will you follow up?", cancelText: "Later" });
      return;
    }

    var clientNo = "CL-" + D.nextClientNo++;
    p.kind = "Client"; p.stage = "Converted"; p.clientNo = clientNo; p.homeBranchId = p.branchId; p.joinedAt = now; p.photo = null;
    p.membership = { packageId: k.id, package: k.name, saleType: k.saleType, start: startIso, end: endIso, price: k.price,
      discount: mo.disc, discountReason: mo.disc ? C.reason.trim() : null, finalPrice: mo.final, salesRepUserId: C.repId,
      freeItems: freeLines(p, k) };
    p.membership.freeItems.forEach(function (f) {
      if (f.status !== "Issued") return;
      var st = D.itemStock.filter(function (x) { return x.itemId === f.itemId && x.branchId === p.branchId; })[0];
      st.qty -= f.qty; D.stockMoves.push({ itemId: f.itemId, branchId: p.branchId, qty: -f.qty, at: now, by: me.id, note: "Free with " + k.name + " · " + p.name });
      p.freeItemsReceived = (p.freeItemsReceived || []).concat(f.itemId);
    });
    p.keyFob = null;
    if (needsFob() && C.fob) {
      var fob = D.keyFobs.filter(function (f) { return f.no === C.fob; })[0];
      fob.status = "Assigned"; fob.personId = p.id; p.keyFob = fob.no;
      fob.deposit = { amount: App.fobDeposit(), refunded: 0 };   // deposit = a line in the same sale (decision #55)
      fob.history.push({ at: now, text: "Assigned to " + p.name + " · deposit " + App.fmtMoney(App.fobDeposit()) + " collected", by: me.id });
    }
    var closed = App.Followup.closeBySystem(p.id, "Client converted");
    App.addTimeline(p.id, "milestone", "Converted to Client · " + k.name + " · " + App.fmtMoney(mo.final) +
      (mo.disc ? " (" + App.fmtMoney(mo.disc) + " off: " + C.reason.trim() + ")" : "") + (p.keyFob ? " · key fob " + p.keyFob : "") +
      " · sales rep " + App.firstName(App.byId(D.users, C.repId)));
    var pend = App.profilePending ? App.profilePending(p) : [];
    C.done = true;
    C.doneHtml = '<div class="state">' + icon("check") + "<h3>" + esc(p.name) + " is now a client (" + esc(clientNo) + ")</h3>" +
      '<p class="muted">Payment comes with the Payment module. In the real app this happens only after payment succeeds.</p>' +
      (closed ? '<p class="hint">' + closed + " open follow-up" + (closed > 1 ? "s" : "") + " closed by system · client converted.</p>" : "") +
      (pend.length ? '<div class="stack">' + pend.map(function (x) { return '<span class="badge badge-warning">' + esc(x.t) + "</span>"; }).join("") + "</div>" : "") + "</div>";
    render();
    App.toast(p.name + " is now a client (" + clientNo + ")", "success");
    App.dataChanged();
    App.openProfile(p.id, { state: "normal", tab: "membership" });
  }

  App.Convert = { open: open };
})();
