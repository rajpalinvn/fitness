/* Book trial (decision #94; notes v3 §1 Trial, L1–L7, L1b, L1c). Opens IN the profile drawer as a work mode (App.DrawerMode).
     App.Trial.open(personId)          Book trial: Package → Dates → Approval → Payment (paid trial only) → Done
     App.Trial.review(trialId)         Approver marks Approved / Rejected + remark (modal). Rejected is only recorded.
   Who gets which trial: lead = Membership trials + PT trials whose package has "Requires an active membership" OFF;
   active client = PT trials; expired client = no button; lost lead = "Re-open the lead first".
   Free-trial limits (Settings values) per trial type, by mobile across branches, same for every role, no override.
   Paid trial: full amount at once, no discount, no items, no balance. Approval = a pending reference, never a block.
   Load after convert.js. */
(function () {
  var D = window.DUMMY, esc = App.esc, icon = App.icon, T = App.Trial;
  var STEPS = [{ k: 1, t: "Package" }, { k: 2, t: "Dates" }, { k: 3, t: "Approval" }, { k: 4, t: "Payment" }, { k: 5, t: "Done" }];
  var C = null, m = null;

  function person() { return App.byId(D.people, C.pid); }
  function pkg() { return C.pkgId ? App.byId(D.packages, C.pkgId) : null; }
  function isPaid() { var k = pkg(); return !!k && k.price > 0; }
  function isoDay(d) { var x = new Date(d); return x.getFullYear() + "-" + ("0" + (x.getMonth() + 1)).slice(-2) + "-" + ("0" + x.getDate()).slice(-2); }
  function plus(iso, n) { var d = new Date(iso + "T00:00"); d.setDate(d.getDate() + n); return d; }
  function endDate() { var k = pkg(); return k ? plus(C.start, k.days - 1) : null; }
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function sec(title, body) { return '<section class="cv-card"><h3 class="cv-card-title">' + title + "</h3>" + body + "</section>"; }
  function err(k) { return C.errors[k] ? '<span class="error">' + C.errors[k] + "</span>" : ""; }
  function inv(k) { return C.errors[k] ? " invalid" : ""; }
  function visibleSteps() { return STEPS.filter(function (s) { return s.k !== 4 || !pkg() || isPaid(); }); }

  function open(pid) {
    var p = App.byId(D.people, pid), cb = T.canBook(p);
    if (!cb.show || cb.disabled) { if (cb.why) App.toast(cb.why, "error"); return; }
    var apr = T.approvers(p);
    C = { pid: pid, step: 1, pkgId: null, start: isoDay(new Date()), comment: "", approverId: apr.length === 1 ? apr[0].id : "", errors: {}, done: false,
      pay: { method: (App.activePayMethods()[0] || {}).name || "", ref: "", slip: "" } };
    m = App.DrawerMode.open(pid, { key: "trial", id: "trialMode", title: "Book trial", onExit: function () { if (C && !C.done) App.toast("Trial not booked", ""); C = null; } });
    m.body.onclick = onClick; m.body.oninput = onInput; m.body.onchange = onInput;
    render();
  }

  function header() {
    var vs = visibleSteps();
    return '<ol class="stepper" aria-label="Steps">' + vs.map(function (s, i) {
      var st = s.k < C.step ? "done" : s.k === C.step ? "current" : "";
      return '<li class="step ' + st + '"' + (st === "current" ? ' aria-current="step"' : "") + '><span class="step-no">' + (st === "done" ? icon("check", "ico-sm") : i + 1) + "</span>" + s.t + "</li>";
    }).join("") + "</ol>";
  }
  function render() {
    var p = person();
    if (C.done) {
      m.title.textContent = "Trial booked";
      m.body.innerHTML = C.doneHtml; m.foot.innerHTML = '<button class="btn btn-primary" data-tr="done">Done · back to profile</button>';
      m.foot.querySelector("[data-tr=done]").onclick = function () { m.exit(); };
      return;
    }
    m.body.innerHTML = '<div class="cv-wrap">' + header() + '<div class="cv-layout"><div class="cv-main"><div class="cv-body">' + [null, s1, s2, s3, s4][C.step](p) + "</div></div>" +
      '<aside class="cv-bill" aria-label="Trial summary" data-bill>' + bill(p) + "</aside></div></div>";
    var vs = visibleSteps(), last = C.step === vs[vs.length - 1].k || (C.step === 3 && !isPaid()) || C.step === 4;
    var back = C.step > 1 ? '<button class="btn" data-tr="back">Previous</button>' : '<button class="btn" data-dm-back>Cancel</button>';
    m.foot.classList.add("cv-foot");
    m.foot.innerHTML = '<div class="cv-foot-inner"><div class="cv-foot-btns">' + back + '<button class="btn btn-primary" data-tr="' + (last ? "finish" : "next") + '">' +
      (last ? (isPaid() ? "Save payment & book" : "Book trial") : "Next") + "</button></div></div>";
    var b = m.foot.querySelector("[data-tr=back]"); if (b) b.onclick = function () { go(-1); };
    var c = m.foot.querySelector("[data-dm-back]"); if (c) c.onclick = function () { m.exit(); };
    m.foot.querySelector("[data-tr=next], [data-tr=finish]").onclick = last ? finish : function () { go(1); };
    App.$all("select", m.body).forEach(App.enhanceSelect);
    App.$all('input[type="date"]', m.body).forEach(App.enhanceDate);
  }

  // ---------- right column: what this trial is ----------
  function bill(p) {
    var k = pkg(), h = '<h3 class="bill-title">Trial</h3><div class="bill-person"><strong>' + esc(p.name) + '</strong><div class="cell-sub">' + esc(p.cc + " " + p.mobile) + " · " + esc(App.branchName(p.branchId)) +
      (p.kind === "Client" ? " · Client" : " · Lead") + "</div></div>";
    if (!k) return h + '<p class="muted bill-empty">Choose a trial package.</p>';
    var type = T.typeOf(k), e = endDate();
    h += '<div class="bill-group"><div class="bill-line"><div class="bill-what"><div>' + esc(k.name) + '</div><div class="cell-sub">' + type + " trial · " + k.days + (k.days === 1 ? " day" : " days") + (k.sessions ? " · " + k.sessions + (k.sessions === 1 ? " session" : " sessions") : "") + "</div></div>" +
      '<div class="bill-amt">' + (k.price ? App.fmtMoney(k.price) : "Free") + "</div></div></div>";
    h += '<div class="bill-group"><div class="bill-line"><div class="bill-what">Dates</div><div class="bill-amt">' + esc(App.fmtDate(new Date(C.start + "T00:00").toISOString())) + (e && k.days > 1 ? " – " + esc(App.fmtDate(e.toISOString())) : "") + "</div></div></div>";
    if (k.price) h += '<div class="bill-total"><span>Total to pay · in full</span><strong data-total>' + App.fmtMoney(k.price) + "</strong></div><p class=\"hint\">No discount, no items, no partial payment on a trial (#93).</p>";
    else h += '<p class="hint">Free trial · no payment. Nothing extra: no accessories, free items, FF ID or key fob (#93).</p>';
    h += '<p class="hint">Approval asked from: ' + (C.approverId ? esc(App.userName(C.approverId)) : "—") + " · a pending reference, not a block.</p>";
    return h;
  }

  // ---------- step 1: package ----------
  function card(p, x) {
    var st = T.cardState(p, x), sel = x.id === C.pkgId, type = T.typeOf(x);
    return '<button type="button" class="pkg-card' + (sel ? " selected" : "") + '" data-tpkg="' + x.id + '"' + (st.disabled ? ' disabled title="' + esc(st.why) + '"' : "") + ' aria-pressed="' + sel + '">' +
      "<strong>" + esc(x.name) + '</strong><span class="cell-sub">' + x.days + (x.days === 1 ? " day" : " days") + (x.sessions ? " · " + x.sessions + (x.sessions === 1 ? " session" : " sessions") : "") +
      (type === "PT" && x.requiresMembership ? " · clients only" : "") + '</span><span class="pkg-price">' + (x.price ? App.fmtMoney(x.price) : "Free") + "</span>" +
      (st.disabled ? '<span class="hint">' + esc(st.why) + "</span>" : x.price ? '<span class="hint">Paid trial · unlimited' + (st.count ? " · " + ordinal(st.count + 1) + " " + App.Trial.label(type) + " trial" : "") + "</span>"
        : '<span class="hint">' + st.used + " of " + st.perPerson + " free " + App.Trial.label(type) + " trials used</span>") + "</button>";
  }
  function s1(p) {
    var all = T.packagesFor(p), groups = [["Membership", "Membership trials"], ["PT", "PT trials"]];
    var html = '<section class="cv-card"><h3 class="cv-card-title">Trial package</h3>' +
      '<p class="muted">' + (p.kind === "Client" ? "Clients get PT trials." : "Leads get membership trials and PT trials open to leads.") +
      ' Free-trial limits: ' + App.setting("freeTrialsPerPerson") + " per person and " + App.setting("freeTrialsPerBranch") + " per branch, counted separately for each trial type and the same for every role (L1c). Paid trials are unlimited.</p>" +
      groups.map(function (g) {
        var list = all.filter(function (x) { return T.typeOf(x) === g[0]; }); if (!list.length) return "";
        return '<div class="acc open"><div class="acc-head"><span class="acc-title">' + g[1] + '</span><span class="badge">' + list.length + "</span></div>" +
          '<div class="pkg-grid acc-body">' + list.map(function (x) { return card(p, x); }).join("") + "</div></div>";
      }).join("") + err("pkg");
    if (!all.length) html += '<div class="state">No trial packages are sold at ' + esc(App.branchName(p.branchId)) + " for this person.</div>";
    var k = pkg();
    if (k) {
      var type = T.typeOf(k), n = T.countOfType(p, type), hist = [];
      T.samePerson(p).forEach(function (o) { T.list(o).forEach(function (t) { if (t.type === type) hist.push(t); }); });
      if (n >= 1) html += '<div class="callout callout-warn">' + icon("alert") + "<span><strong>This is their " + ordinal(n + 1) + " " + App.Trial.label(type) + " trial.</strong>" +
        '<ul class="trial-hist">' + hist.map(function (t) { return "<li>" + esc(t.package) + " · " + esc(App.fmtDate(t.from)) + (t.kind === "paid" ? " · " + App.fmtMoney(t.paid) + " paid" : " · free") + " · " + esc(App.branchName(t.branchId)) + " · " + esc(t.approval) + "</li>"; }).join("") + "</ul></span></div>";
    }
    return html + "</section>";
  }
  function check1() { var e = {}; if (!pkg()) e.pkg = "Choose a trial package."; return e; }

  // ---------- step 2: dates ----------
  function s2(p) {
    var k = pkg(), today = isoDay(new Date()), max = isoDay(plus(today, 30)), e = endDate();
    return sec("Dates", '<div class="form-grid"><div class="field"><label for="trStart">Start date <span class="req">*</span></label>' +
      '<input class="input' + inv("start") + '" id="trStart" data-k="start" type="date" min="' + today + '" max="' + max + '" value="' + esc(C.start) + '">' +
      (C.errors.start ? err("start") : '<span class="hint">Today up to 30 days ahead. No back dates (#41).</span>') + "</div>" +
      '<div class="field"><label>Ends</label><div class="input input-static" data-end>' + (e ? esc(App.fmtDate(e.toISOString())) + ' <span class="muted">· ' + k.days + (k.days === 1 ? " day" : " days") + ", start day included</span>" : "—") + "</div></div></div>" +
      '<p class="hint">The stage becomes <strong>Trial</strong> automatically and the Stage dropdown is locked while the trial runs (L5). When it ends, a follow-up "Trial ended · discuss plans" is created for the owner.</p>');
  }
  function check2() {
    var e = {}, today = isoDay(new Date()), max = isoDay(plus(today, 30));
    if (!C.start) e.start = "Pick a start date."; else if (C.start < today) e.start = "Back dates are not allowed."; else if (C.start > max) e.start = "Start can be at most 30 days ahead.";
    return e;
  }

  // ---------- step 3: approval (a pending reference, L1b) ----------
  function s3(p) {
    var apr = T.approvers(p);
    return sec("Approval", '<p class="muted">Every trial booking needs a comment and the person approval is asked from (SM / CM / RM of ' + esc(App.branchName(p.branchId)) + ' with the "trial approver" permission; never the CEO). ' +
        "The trial is booked at once; approval stays <strong>Pending</strong> until they mark it Approved / Rejected. Rejected is only recorded.</p>" +
      '<div class="field"><label for="trComment">Comment <span class="req">*</span></label><textarea class="input' + inv("comment") + '" id="trComment" data-k="comment" rows="2" placeholder="Why this trial, e.g. Wants to try the floor before the Quarterly">' + esc(C.comment) + "</textarea>" + err("comment") + "</div>" +
      (apr.length ? '<div class="field"><label for="trApprover">Approval asked from <span class="req">*</span></label><select class="input' + inv("approverId") + '" id="trApprover" data-k="approverId"><option value="">Choose…</option>' +
          apr.map(function (u) { return '<option value="' + u.id + '"' + (u.id === C.approverId ? " selected" : "") + ">" + esc(u.name) + " · " + esc(u.role) + "</option>"; }).join("") + "</select>" + err("approverId") + "</div>"
        : '<div class="callout callout-warn">' + icon("alert") + "<span><strong>No approver available at " + esc(App.branchName(p.branchId)) + ".</strong> The trial is booked anyway with status \"No approver available\"; the CEO sees it in Trial approvals pending.</span></div>"));
  }
  function check3() {
    var e = {}; if (!C.comment.trim()) e.comment = "A comment is required.";
    if (T.approvers(person()).length && !C.approverId) e.approverId = "Choose who approval is asked from.";
    return e;
  }

  // ---------- step 4: payment (paid trial only: full, at once) ----------
  function s4(p) {
    var k = pkg(), methods = App.activePayMethods(), pm = App.payMethod(C.pay.method), needs = !pm || pm.needsRef;
    return sec("Payment · full amount",
      '<dl class="kv"><dt>Receipt no.</dt><dd><span class="mono">' + esc(App.nextReceiptNo(p.branchId)) + '</span> <span class="cell-sub">auto, per branch</span></dd><dt>Amount</dt><dd><strong>' + App.fmtMoney(k.price) + "</strong> · paid in full, at once (#93)</dd></dl>" +
      '<div class="form-grid"><div class="field"><label for="trMethod">Method <span class="req">*</span></label><select class="input" id="trMethod" data-k="method">' +
        methods.map(function (x) { return "<option" + (x.name === C.pay.method ? " selected" : "") + ">" + esc(x.name) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="trRef">Reference / transaction no.' + (needs ? ' <span class="req">*</span>' : "") + '</label><input class="input' + inv("ref") + '" id="trRef" data-k="ref" value="' + esc(C.pay.ref) + '" placeholder="' + (needs ? "e.g. UPI-55821934" : "Not needed for cash") + '">' + err("ref") + "</div></div>" +
      '<p class="hint">No discount, no accessories, no partial payment or balance on a trial.</p>');
  }
  function check4() { var e = {}, pm = App.payMethod(C.pay.method); if (pm && pm.needsRef && !C.pay.ref.trim()) e.ref = "Reference no. is needed for " + esc(C.pay.method) + "."; return e; }

  // ---------- navigation ----------
  function go(dir) {
    if (dir > 0) { var e = [null, check1, check2, check3, check4][C.step](); C.errors = e; if (Object.keys(e).length) { render(); var f = m.body.querySelector(".invalid, .error"); if (f && f.focus) f.focus(); return; } }
    else C.errors = {};
    var vs = visibleSteps().map(function (s) { return s.k; }), i = vs.indexOf(C.step) + dir;
    C.step = vs[Math.max(0, Math.min(vs.length - 1, i))]; render();
  }
  function onClick(e) {
    var t = e.target.closest("[data-tpkg]"); if (!t || t.disabled) return;
    C.pkgId = t.dataset.tpkg; delete C.errors.pkg; render();
  }
  function onInput(e) {
    var k = e.target.dataset && e.target.dataset.k; if (!k) return;
    if (k === "method" || k === "ref") { C.pay[k] = e.target.value; if (k === "method" && e.type === "change") render(); return; }
    C[k] = e.target.value;
    if (k === "approverId" && e.type === "change") { render(); return; }
    if (k === "start") { var b = m.body.querySelector("[data-bill]"); if (b) b.innerHTML = bill(person()); var en = m.body.querySelector("[data-end]"), ed = endDate(); if (en && ed) en.innerHTML = esc(App.fmtDate(ed.toISOString())) + ' <span class="muted">· ' + pkg().days + " days, start day included</span>"; }
  }

  // ---------- finish: book the trial ----------
  function finish() {
    var e = Object.assign({}, check3(), isPaid() ? check4() : {});
    if (Object.keys(e).length) { C.errors = e; C.step = e.comment || e.approverId ? 3 : 4; render(); return; }
    var p = person(), k = pkg(), type = T.typeOf(k), now = new Date().toISOString(), me = App.me(), apr = T.approvers(p);
    var startIso = new Date(C.start + "T00:00").toISOString(), endIso = endDate().toISOString(), paid = isPaid();
    var t = { id: "tr" + Date.now(), type: type, kind: paid ? "paid" : "free", packageId: k.id, package: k.name, from: startIso, to: endIso, price: k.price, paid: paid ? k.price : 0,
      branchId: p.branchId, bookedByUserId: me.id, bookedAt: now, comment: C.comment.trim(), approverUserId: C.approverId || null,
      approval: apr.length ? "Pending" : "No approver available" };
    if (paid) { t.receiptNo = App.nextReceiptNo(p.branchId, true); t.payment = { method: C.pay.method, ref: C.pay.ref.trim() || null }; }
    p.trials = T.list(p).concat(t);
    k.soldCount = (k.soldCount || 0) + 1;
    if (p.kind === "Lead") p.stage = "Trial";   // automatic (#94)
    var n = T.countOfType(p, type);
    var txt = (paid ? "Paid " : "Free ") + App.Trial.label(type) + " trial booked · " + k.name + " · " + k.days + (k.days === 1 ? " day" : " days") + " from " + App.fmtShortWhen(startIso) +
      (paid ? " · " + App.fmtMoney(k.price) + " paid in full (" + C.pay.method + ", receipt " + t.receiptNo + ")" : "") + (n > 1 ? " · " + ordinal(n) + " " + App.Trial.label(type) + " trial" : "") +
      (t.approverUserId ? " · approval asked from " + App.firstName(App.byId(D.users, t.approverUserId)) : " · no approver available at " + App.branchName(p.branchId));
    App.addTimeline(p.id, "milestone", txt);
    if (t.approverUserId) D.notifications.unshift({ id: "n" + Date.now(), text: "Trial approval asked from you: " + p.name + " · " + k.name + " (" + App.firstName(me) + ")", at: now, unread: true, forUserId: t.approverUserId, trialId: t.id });
    else D.notifications.unshift({ id: "n" + Date.now(), text: "Trial booked with no approver available: " + p.name + " · " + k.name + " · " + App.branchName(p.branchId), at: now, unread: true, forUserId: null, trialId: t.id });
    C.done = true;
    C.doneHtml = '<div class="state">' + icon("check") + "<h3>" + esc(type) + " trial booked for " + esc(p.name) + "</h3><p class=\"muted\">" + esc(k.name) + " · " + esc(App.fmtDate(startIso)) + (k.days > 1 ? " – " + esc(App.fmtDate(endIso)) : "") +
      (paid ? " · " + App.fmtMoney(k.price) + " paid in full · receipt " + esc(t.receiptNo) : " · free") + "</p>" +
      '<div class="stack center">' + T.approvalBadge(t) + (t.approverUserId ? '<span class="cell-sub">asked from ' + esc(App.userName(t.approverUserId)) + "</span>" : "") + "</div>" +
      (p.kind === "Lead" ? '<p class="hint">Stage is now Trial (automatic). Set the next follow-up when you go back.</p>' : "") + "</div>";
    render();
    App.toast(type + " trial booked for " + p.name, "success");
    App.dataChanged();
    if (!App.Followup.openFollowUps(p.id).length) setTimeout(function () {
      App.Followup.openAdd(p.id, { title: "Set next follow-up", type: "Visit planned", intro: "Trial booked. When will you follow up?", cancelText: "Later" });
    }, 50);
  }

  // ---------- approver review (modal) ----------
  function review(trialId) {
    var x = T.byId(trialId); if (!x) return;
    var p = x.p, t = x.t, md = App.makeModal("trialReviewModal");
    md.title.textContent = "Trial approval · " + p.name;
    md.body.innerHTML = '<dl class="kv kv-wide"><dt>Trial</dt><dd>' + esc(t.package) + " · " + esc(t.type) + " · " + esc(App.fmtDate(t.from)) + (App.daysFromToday(t.to) !== App.daysFromToday(t.from) ? " – " + esc(App.fmtDate(t.to)) : "") + (t.kind === "paid" ? " · " + App.fmtMoney(t.paid) + " paid" : " · free") + "</dd>" +
      "<dt>Booked by</dt><dd>" + esc(App.userName(t.bookedByUserId)) + " · " + esc(App.fmtShortWhen(t.bookedAt)) + "</dd><dt>Comment</dt><dd>" + esc(t.comment || "—") + "</dd>" +
      "<dt>Asked from</dt><dd>" + (t.approverUserId ? esc(App.userName(t.approverUserId)) : '<span class="badge badge-warning">No approver available</span>') + "</dd><dt>Status</dt><dd>" + T.approvalBadge(t) + "</dd></dl>" +
      '<div class="field"><label>Decision <span class="req">*</span></label><div class="seg" role="radiogroup">' + [["Approved", "Approve"], ["Rejected", "Reject"]].map(function (o) {
        return '<button type="button" class="seg-btn" role="radio" aria-checked="false" data-decide="' + o[0] + '">' + o[1] + "</button>"; }).join("") + '</div><span class="error" data-derr hidden>Choose Approve or Reject.</span></div>' +
      '<div class="field"><label for="trRemark">Remark <span class="req" data-remark-req hidden>*</span></label><input class="input" id="trRemark" placeholder="Optional for Approve, required for Reject"><span class="error" data-rerr hidden>A remark is required when rejecting.</span></div>' +
      '<p class="hint">Rejected is only recorded: the trial keeps running (L1b).</p>';
    var decision = "";
    md.body.onclick = function (e) {
      var b = e.target.closest("[data-decide]"); if (!b) return;
      decision = b.dataset.decide;
      md.body.querySelectorAll("[data-decide]").forEach(function (x) { x.classList.toggle("active", x === b); x.setAttribute("aria-checked", x === b); });
      md.body.querySelector("[data-remark-req]").hidden = decision !== "Rejected"; md.body.querySelector("[data-derr]").hidden = true;
    };
    md.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Save decision</button>';
    md.foot.querySelector("[data-save]").onclick = function () {
      var remark = md.body.querySelector("#trRemark").value.trim();
      if (!decision) { md.body.querySelector("[data-derr]").hidden = false; return; }
      if (decision === "Rejected" && !remark) { md.body.querySelector("[data-rerr]").hidden = false; return; }
      var me = App.me();
      t.approval = decision; t.approvalRemark = remark || null; t.approvedAt = new Date().toISOString(); t.decidedByUserId = me.id;
      App.addTimeline(p.id, "milestone", "Trial approval · " + decision + " by " + App.firstName(me) + (remark ? " · " + remark : ""));
      D.notifications.forEach(function (n) { if (n.trialId === t.id) n.unread = false; });
      D.notifications.unshift({ id: "n" + Date.now(), text: "Trial " + decision.toLowerCase() + " by " + App.firstName(me) + ": " + p.name + " · " + t.package + (remark ? " · " + remark : ""), at: new Date().toISOString(), unread: true, forUserId: t.bookedByUserId });
      App.close(md.el); App.toast("Trial " + decision.toLowerCase() + " · " + p.name, decision === "Approved" ? "success" : ""); App.dataChanged();
    };
    App.openModal("trialReviewModal");
  }

  T.open = open; T.review = review;
})();
