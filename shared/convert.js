/* Convert to Client stepper (decisions #4, #13, #14, #36–#41, #64–#67, #70–#74, #92, #93).
   Opens IN the profile drawer as "Sell mode" (App.DrawerMode), not as a modal.
     App.Convert.open(personId)
   Steps: 1 Details · 2 Package · 3 Sale & start · 4 Corporate entry (FF ID required, key fob may be Pending) · 5 Summary · 6 Payment.
   Offers Membership and Premium PT only (#93); trials are booked with "Book trial" (c3), never here. PT stays disabled (#89).
   Premium PT (#92, #93 changed by #103) = a PT product; the membership inside it is an add-on (free or charged). 2 lines at sale:
   "Membership (included)" = reference price (may be ₹0, never discounted), "PT" = the rest; the discount applies to the PT line ONLY.
   ONE sales rep for the whole package; the membership line stores it as a reference ("incentive by scheme").
   Discount limit (#103 Q22): the LOWER of (% of the package line) and the role's ₹ cap.
   Start date (#103 Q1): today; no future; back date only this month with sales.backDate. Allocation: accessories → fob deposit → membership line → PT line.
   The person becomes a client when the first payment is saved (#79).
   Load after profile.js. */
(function () {
  var D = window.DUMMY, esc = App.esc, icon = App.icon;
  var STEPS = [{ k: 1, t: "Details" }, { k: 2, t: "Package" }, { k: 3, t: "Sale & start" }, { k: 4, t: "Corporate entry" }, { k: 5, t: "Summary" }, { k: 6, t: "Payment" }];
  var CORP = "Corporate entry: FF ID & key fob";
  var GROUPS = [["Membership", "Membership"], ["Premium PT", "Premium PT (membership + PT)"], ["PT", "Personal training"]];
  var C = null, m = null;

  function person() { return App.byId(D.people, C.pid); }
  function pkg() { return C.pkgId ? App.byId(D.packages, C.pkgId) : null; }
  function isPrem() { var k = pkg(); return !!k && k.type === "Premium PT"; }
  function needsFob() { var k = pkg(); return !!k && k.saleType === "Paid" && (k.type === "Membership" || k.type === "Premium PT"); }
  // Corporate entry step (decision #93): FF ID mandatory, key fob can stay Pending. Shown for every package sold here.
  function showCorp() { return needsFob(); }
  function isoDay(d) { var x = new Date(d); return x.getFullYear() + "-" + ("0" + (x.getMonth() + 1)).slice(-2) + "-" + ("0" + x.getDate()).slice(-2); }
  function plus(iso, n) { var d = new Date(iso + "T00:00"); d.setDate(d.getDate() + n); return d; }
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function limitPct() { return App.discountLimit(); }   // the % part of the role's limit (#77, #103)
  function sec(title, body, attrs) { return '<section class="cv-card"' + (attrs || "") + '><h3 class="cv-card-title">' + title + "</h3>" + body + "</section>"; }
  function stock(p) { return D.keyFobs.filter(function (k) { return k.branchId === p.branchId && k.status === "In stock"; }); }
  // #107: users with sales.rep in ANY branch (cross-branch sellers); the creator first.
  function reps(p) { var me = App.me(), l = App.usersWith("sales.rep"); return l.sort(function (a, b) { return (b.id === me.id) - (a.id === me.id); }); }
  function itemQty(itemId, branchId) { var s = D.itemStock.filter(function (x) { return x.itemId === itemId && x.branchId === branchId; })[0]; return s ? s.qty : 0; }
  function accessories() { return D.items.filter(function (i) { return i.kind === "Accessory" && i.active; }); }
  function reasonText() { return C.reason === "Other" ? C.reasonOther.trim() : C.reason; }

  // Packages a lead can buy here (decisions #47, #50, #93): active, sold at the lead's branch, audience New or Both,
  // not an Add-on and NEVER a trial (trials go through Book trial). PT is listed but disabled (#89).
  // #110: PT / Premium PT directly only with sales.sellPTDirect (CEO); membership only with sales.sellMembership. Others bill a PT quote.
  function sellable(p) {
    var direct = App.can("sales.sellPTDirect") === true, mem = App.can("sales.sellMembership") === true;
    return D.packages.filter(function (x) {
      if (!(x.active && x.category !== "Add-on" && !x.isTrial && x.branchIds.indexOf(p.branchId) > -1 && x.audience !== "Renewal")) return false;
      return x.category === "Membership" ? mem : direct;
    });
  }
  // PT quotes of this person (#113): Open = can be billed; Expired = shown disabled with the date.
  function quote() { return C && C.quoteId ? App.Quote.byId(C.quoteId) : null; }
  function quotesFor(p) { return App.can("sales.sellFromQuote") === true || App.can("sales.sellPTDirect") === true ? App.Quote.list(p.id).filter(function (q) { return q.status === "Open" || q.status === "Expired"; }) : []; }
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
  // Discount money + percent from what was typed. The discount base = the package line the user sees; Premium PT: the PT part
  // only (price − reference). The membership line of a Premium PT always stays at the reference price (#103).
  function money() {
    var k = pkg(); if (!k) return { price: 0, base: 0, disc: 0, pct: 0, final: 0, mem: 0, pt: 0, memDisc: 0, ptDisc: 0, memFinal: 0, ptFinal: 0 };
    var qq = quote(), price = qq ? qq.price : k.price;   // a quote LOCKS price + discount (#113)
    var prem = k.type === "Premium PT", mem = prem ? (qq ? qq.refPrice : (k.referenceMembershipPrice || 0)) : price, base = prem ? price - mem : price;
    var v = Number(C.disc) || 0, disc = qq ? (qq.discount || 0) : C.mode === "%" ? Math.round(base * v / 100) : Math.round(v);
    var o = { price: price, base: base, disc: disc, pct: base ? disc / base * 100 : 0, final: price - disc };
    if (prem) { o.mem = mem; o.pt = base; o.memDisc = 0; o.ptDisc = disc; o.memFinal = mem; o.ptFinal = base - disc; }
    else { o.mem = k.price; o.pt = 0; o.memDisc = disc; o.ptDisc = 0; o.memFinal = o.final; o.ptFinal = 0; }
    return o;
  }
  // Extra accessories added in the bill (decision #71): price locked from the item master; "Free" = complimentary with a reason.
  function extraLine(x) { var it = App.byId(D.items, x.itemId); return { it: it, amount: x.free ? 0 : it.sellingPrice * x.qty }; }
  function extrasPaid() { return C.extras.reduce(function (s, x) { return s + extraLine(x).amount; }, 0); }
  function endDate() { var k = pkg(); return k ? plus(C.start, k.days - 1) : null; }   // start day included (decision #39)
  // Paid trial adjust (#94): membership paid trial for any package; PT paid trial only when buying Premium PT.
  //   running  -> ticked + LOCKED, membership start = trial start (set by system)
  //   ended within the buffer (Settings value) + grid row trials.adjustAfterEnd -> optional, start = today
  //   else -> no adjust, one info line. Free trials never.
  function adjustInfo(type) {
    var p = person(), k = pkg(); if (!k || (type === "PT" && !isPrem())) return null;
    var st = App.paidTrialStatus(p, type); if (!st) return null;
    if (!st.ended) return { type: type, t: st.t, locked: true, on: true, amount: st.t.paid, why: "Running paid " + App.Trial.label(type) + " trial · adjusted (locked) · membership start = trial start, set by system" };
    var days = -st.left, buffer = App.setting("paidTrialAdjustBufferDays"), allowed = App.scopeAllows("trials.adjustAfterEnd", p);
    if (days <= buffer && allowed) return { type: type, t: st.t, locked: false, on: type === "PT" ? !!C.adjustPt : !!C.adjustMem, amount: st.t.paid, why: "Paid " + App.Trial.label(type) + " trial ended " + days + (days === 1 ? " day" : " days") + " ago · within the " + buffer + "-day buffer · start = today if adjusted" };
    return { type: type, t: st.t, none: true, why: days > buffer ? "Paid " + App.Trial.label(type) + " trial ended " + days + " days ago · past the " + buffer + "-day buffer, no adjust" : "Paid " + App.Trial.label(type) + " trial ended " + days + (days === 1 ? " day" : " days") + " ago · only roles with \"Paid trial adjust after it ended\" (" + App.state.role + ": no) can adjust" };
  }
  function adjusts() { return [adjustInfo("Membership"), adjustInfo("PT")].filter(function (a) { return a && !a.none && a.on; }); }
  function adjAmount(type) { return adjusts().filter(function (a) { return a.type === type; }).reduce(function (s, a) { return s + a.amount; }, 0); }
  function startLocked() { var a = adjustInfo("Membership"); return !!(a && a.locked); }
  function syncAdjustDefaults() {
    var a = adjustInfo("Membership"), b = adjustInfo("PT");
    if (a && a.locked) { C.adjustMem = true; C.start = isoDay(a.t.from); } else if (a && a.none) C.adjustMem = false;
    if (b && b.locked) C.adjustPt = true; else if (!b || b.none) C.adjustPt = false;
    if (!(a && a.locked) && C.start < isoDay(new Date())) C.start = isoDay(new Date());
  }

  // Sales rep default (#107, replaces #103 "lead owner"): the person creating the sale, everywhere (incl. Premium PT).
  // A creator without sales.rep -> the first user with it. Every change from the default = SalesRepChanged event.
  function defaultRep(p) { var me = App.me(); if (me && App.usersWith("sales.rep").some(function (u) { return u.id === me.id; })) return me.id; var l = App.usersWith("sales.rep", p && p.branchId); return l[0] ? l[0].id : (me && me.id); }
  // exposed below as App.Convert.defaultRep

  // ---------- open ----------
  function open(pid, o) {
    o = o || {};
    var p = App.byId(D.people, pid); if (!App.Followup.isOpenLead(p)) return;
    C = { pid: pid, step: 1, done: false, email: p.email || "", gender: p.gender || "", birthDate: p.birthDate || "", ffId: p.ffId || "",
      pkgId: null, mode: "%", disc: "", reason: "", reasonOther: "", repId: defaultRep(p), start: isoDay(new Date()), adjustMem: false, adjustPt: false,
      fob: "", fobFree: false, fobFreeWhy: "", issue: {}, extras: [], picker: false, pickQ: "", errors: {}, pkgQ: "", open: {},
      pay: { rows: [{ method: (App.activePayMethods()[0] || {}).name || "", amount: "", ref: "", slip: "" }] }, payDue: "", sellHere: !!o.sellHere };
    // Membership open by default; others collapsed (decision #74). Fallback: first group with packages.
    var groups = GROUPS.filter(function (g) { return sellable(p).some(function (x) { return x.type === g[0]; }); });
    var def = groups.filter(function (g) { return g[0] === "Membership"; })[0] || groups[0];
    if (def) C.open[def[0]] = true;
    m = App.DrawerMode.open(pid, { key: "convert", title: "Convert to client", onExit: function () {
      if (C && !C.done) App.toast("Conversion not saved", "");
      // Cancel of Sell here changes nothing except the event (#106).
      if (C && !C.done && C.sellHere) App.Event.log(C.pid, { type: "SellHereCancelled", text: "Sell here cancelled by " + App.firstName(App.me()) + " · nothing changed" });
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
    m.body.innerHTML = '<div class="cv-wrap">' + header() + '<div class="cv-layout"><div class="cv-main"><div class="cv-body">' + [null, s1, s2, s3, s4, s5, s6][C.step](p) + "</div></div>" +
      '<aside class="cv-bill" aria-label="Bill summary" data-bill>' + bill(p) + "</aside></div></div>";
    var back = C.step > 1 ? '<button class="btn" data-cv="back">Previous</button>' : '<button class="btn" data-dm-back>Cancel</button>';
    var vs = visibleSteps(), last = C.step === vs[vs.length - 1].k;
    var nextLabel = !last ? "Next" : "Save payment";
    // Footer aligned with the steps column, not the far edge.
    m.foot.classList.add("cv-foot");
    m.foot.innerHTML = '<div class="cv-foot-inner"><div class="cv-foot-btns">' + back + '<button class="btn btn-primary" data-cv="' + (last ? "finish" : "next") + '">' + nextLabel + "</button></div></div>";
    m.foot.querySelector("[data-cv=back]") && (m.foot.querySelector("[data-cv=back]").onclick = function () { go(-1); });
    m.foot.querySelector("[data-dm-back]") && (m.foot.querySelector("[data-dm-back]").onclick = function () { m.exit(); });
    m.foot.querySelector("[data-cv=next], [data-cv=finish]").onclick = last ? finish : function () { go(1); };
    App.$all("select", m.body).forEach(App.enhanceSelect);
    App.$all('input[type="date"]', m.body).forEach(App.enhanceDate);
    syncPay();
  }
  // Save payment is disabled below the minimum; the message turns red (decision #85).
  function syncPay() {
    if (!C || C.step !== 6) return;
    var b = m.foot.querySelector("[data-cv=finish]"), low = belowMin(), msg = m.body.querySelector("[data-min-msg]");
    if (b) { b.disabled = low; b.title = low ? minMsg() : ""; }
    if (msg) { msg.textContent = minMsg(); msg.className = low ? "error" : "hint"; }
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
  // GST per line at its own tax category (decision #78); shown by rate with 2 decimals.
  function gstByRate() {
    var k = pkg(), mo = money(), dep = depositDue(), by = {};
    var fobItem = D.items.filter(function (i) { return i.kind === "Key fob"; })[0];
    function add(amount, taxId) { if (!amount) return; var g = App.gstSplit(amount, taxId); if (g.gst) by[g.rate] = Math.round(((by[g.rate] || 0) + g.gst) * 100) / 100; }
    // GST on the NET amount after the paid trial adjust (#103 Q27): e.g. ₹20,000 − ₹800 = ₹19,200 incl. GST. A ₹0 line has no GST.
    if (k.type === "Premium PT") { add(mo.memFinal - adjAmount("Membership"), k.taxCategoryId); add(mo.ptFinal - adjAmount("PT"), k.taxCategoryId); }
    else add(mo.final - adjAmount("Membership"), k.taxCategoryId);
    C.extras.forEach(function (x) { var l = extraLine(x); add(l.amount, l.it.taxCategoryId); });
    add(dep, fobItem && fobItem.taxCategoryId);
    return Object.keys(by).map(Number).sort(function (a, b) { return a - b; }).map(function (r) { return { rate: r, gst: by[r] }; });
  }
  function payTotals() {
    var mo = money(), acc = extrasPaid(), dep = depositDue(), total = mo.final - adjAmount("Membership") - adjAmount("PT") + acc + dep;
    var paid = Math.round(C.pay.rows.reduce(function (s, r) { return s + (Number(r.amount) || 0); }, 0) * 100) / 100;
    return { total: total, must: acc + dep, paid: paid, balance: Math.max(0, Math.round((total - paid) * 100) / 100), towardsPkg: Math.max(0, paid - acc - dep) };
  }
  // Minimum first payment (decision #85): accessories + key fob deposit in full + X% of the package after discount.
  function minPay() {
    var t = payTotals(), pct = App.minFirstPayPct();
    if (!partialOk()) return { amount: t.total, full: true };
    return { amount: Math.round((t.must + Math.ceil((money().final - adjAmount("Membership") - adjAmount("PT")) * pct / 100)) * 100) / 100, pct: pct };
  }
  function minMsg() {
    var mi = minPay(), acc = extrasPaid(), dep = depositDue(), parts = [];
    if (mi.full) return "Pay the full amount " + App.fmtMoney(mi.amount) + " (partial payment is only allowed on Membership and PT packages)";
    if (acc) parts.push("accessories " + App.fmtMoney(acc));
    if (dep) parts.push("key fob deposit " + App.fmtMoney(dep));
    parts.push(mi.pct + "% of package");
    return "Minimum " + App.fmtMoney(mi.amount) + " (" + parts.join(" + ") + ")";
  }
  function belowMin() { return payTotals().paid + 1e-9 < minPay().amount; }
  // Real allocation of what is paid now (#85, #93): accessories → key fob deposit → membership line → PT line.
  function alloc() {
    var t = payTotals(), acc = extrasPaid(), dep = depositDue(), mo = money(), left = t.paid;
    var a = Math.min(left, acc); left -= a; var d = Math.min(left, dep); left -= d;
    var memDue = mo.memFinal - adjAmount("Membership"), ptDue = mo.ptFinal - adjAmount("PT");
    var mem = Math.min(left, memDue); left -= mem; var pt = Math.min(left, ptDue);
    return { acc: a, dep: d, pkg: mem + pt, mem: mem, pt: pt, memDue: memDue, ptDue: ptDue };
  }
  function paidSub(paid, due, prefix) {
    return (prefix || "") + (paid + 1e-9 >= due ? "Paid in full" : "Paid " + App.fmtMoney(paid) + " · Balance " + App.fmtMoney(Math.round((due - paid) * 100) / 100));
  }
  // PT sessions unlock with what is paid towards the PT line (#83). Premium PT: the PT line is paid after the membership line.
  function ptLine(t) {
    var k = pkg(); if (!k || k.type !== "Premium PT" || !k.sessions) return "";
    var mo = money(), paidPt = C.step === 6 ? alloc().pt : mo.ptFinal;
    var un = App.ptUnlocked(mo.pt - adjAmount("PT"), mo.ptDisc, k.sessions, paidPt);
    return "PT sessions unlocked " + un + " of " + k.sessions;
  }
  function totalsHtml() {
    var mo = money(), dep = depositDue(), acc = extrasPaid(), rates = gstByRate(), t = payTotals();
    var gst = Math.round(rates.reduce(function (s, r) { return s + r.gst; }, 0) * 100) / 100;
    var pay6 = C.step === 6, al = pay6 ? alloc() : null;
    var h = '<div class="bill-group">', am = adjAmount("Membership"), ap = adjAmount("PT");
    if (isPrem()) h += bline("Membership (included) after discount" + (am ? " · trial adjusted" : ""), App.fmtMoney(mo.memFinal - am), pay6 && mo.memFinal - am ? paidSub(al.mem, mo.memFinal - am) : "", "", ' data-bl="mem"') +
      bline("PT after discount" + (ap ? " · trial adjusted" : ""), App.fmtMoney(mo.ptFinal - ap), pay6 && mo.ptFinal - ap ? paidSub(al.pt, mo.ptFinal - ap) : "Paid after the membership line", "", ' data-bl="ptl"');
    else h += bline("Package after discount" + (am ? " · trial adjusted" : ""), App.fmtMoney(mo.final - am), pay6 && mo.final - am ? paidSub(al.pkg, mo.final - am) : "", "", ' data-bl="pkg"');
    if (acc) h += bline("Accessories", App.fmtMoney(acc), pay6 ? paidSub(al.acc, acc) : "Paid first, in full", "", ' data-bl="acc"');
    if (dep) h += bline("Key fob deposit", App.fmtMoney(dep), pay6 ? paidSub(al.dep, dep, "Refundable · ") : "Refundable · paid first, in full", "", ' data-bl="dep"');
    h += "</div>";
    h += '<div class="bill-gst" data-gst><div class="bill-line"><div class="bill-what">GST included</div><div class="bill-amt">' + App.fmtMoney2(gst) + "</div></div>" +
      rates.map(function (r) { return '<div class="bill-subline"><span>GST ' + r.rate + "%</span><span>" + App.fmtMoney2(r.gst) + "</span></div>"; }).join("") + "</div>";
    h += '<div class="bill-total"><span>Total to pay</span><strong data-total>' + App.fmtMoney(t.total) + "</strong></div>";
    if (C.step === 6) h += '<div class="bill-paid" data-bill-paid>' + bline("Paid now", App.fmtMoney(t.paid)) + bline("Balance due", App.fmtMoney(t.balance),
      t.balance && C.payDue ? "by " + esc(App.fmtIsoDate(C.payDue)) : "") + "</div>";
    var pl = ptLine(t); if (pl) h += '<p class="bill-pt" data-bill-pt>' + pl + "</p>";
    return h;
  }
  function bill(p) {
    var k = pkg(), mo = money();
    var html = '<h3 class="bill-title">Bill summary</h3><div class="bill-person"><strong>' + esc(p.name) + '</strong><div class="cell-sub">' +
      esc(p.cc + " " + p.mobile) + " · " + esc(App.branchName(p.branchId)) + "</div></div>";
    if (!k) return html + '<p class="muted bill-empty">Choose a package to see the bill.</p>';
    if (isPrem()) {
      html += '<div class="bill-group"><div class="bill-group-label">' + esc(k.name) + ' · 2 lines</div>' +
        bline("Membership (included)", App.fmtMoney(mo.mem), k.days + " days · reference membership price" + (mo.mem ? "" : " · free, no GST") + " · incentive by scheme", "", ' data-line="mem"') +
        bline("PT", App.fmtMoney(mo.pt), k.sessions + " sessions · price − reference · rep " + esc(App.firstName(App.byId(D.users, C.repId))), "", ' data-line="pt"');
      if (mo.disc) html += bline("Discount on PT", "− " + App.fmtMoney(mo.disc), (reasonText() ? esc(reasonText()) : '<span class="warn-text">Reason needed</span>') + " · PT line only", "", ' data-line="disc"');
      html += "</div>";
    } else {
      html += '<div class="bill-group">' + bline(esc(k.name), k.price ? App.fmtMoney(k.price) : "Free", k.days + (k.days === 1 ? " day" : " days") + (k.sessions ? " · " + k.sessions + " sessions" : ""));
      if (mo.disc) html += bline("Discount", "− " + App.fmtMoney(mo.disc), reasonText() ? esc(reasonText()) : '<span class="warn-text">Reason needed</span>');
      html += "</div>";
    }
    var adj = adjusts();
    if (adj.length) html += '<div class="bill-group"><div class="bill-group-label">Paid trial adjusted (#94)</div>' + adj.map(function (a) {
      return bline("Paid " + App.Trial.label(a.type) + " trial · " + esc(a.t.package), "− " + App.fmtMoney(a.amount), (a.locked ? "Running · adjusted, locked" : "Ended · adjusted by " + esc(App.state.role)) + " · full trial price", "", ' data-adj="' + a.type + '"');
    }).join("") + "</div>";
    var fl = freeLines(p, k);
    if (fl.length) html += '<div class="bill-group"><div class="bill-group-label">Free with the package</div>' + fl.map(freeLineHtml).join("") + "</div>";
    html += '<div class="bill-group"><div class="bill-group-label">Accessories</div>' + C.extras.map(function (x, i) { return extraHtml(x, i, p); }).join("");
    {
      html += C.picker
        ? '<div class="bill-pick"><label class="sr-only" for="xPickQ">Search items</label><input class="input input-sm" id="xPickQ" type="search" data-x-q value="' + esc(C.pickQ) + '" placeholder="Search accessories…" autocomplete="off">' +
          '<div class="pick-list" data-x-list>' + pickList(p) + '</div><button type="button" class="link-btn" data-x-cancel>Cancel</button></div>'
        : '<button type="button" class="link-btn bill-add" data-x-add>' + icon("plus", "ico-sm") + "Add item</button>";
    }
    html += "</div>";
    if (needsFob()) html += '<div class="bill-group">' + (!C.fob ? bline("Key fob", "—", "Deposit " + App.fmtMoney(App.fobDeposit()) + " when assigned", ' <span class="badge badge-warning">Pending</span>')
      : C.fobFree ? bline("Key fob · " + esc(C.fob), "₹0", "Complimentary · " + (C.fobFreeWhy.trim() ? esc(C.fobFreeWhy.trim()) : '<span class="warn-text">Reason needed</span>'), ' <span class="badge badge-info">Complimentary</span>')
      : bline("Key fob deposit · " + esc(C.fob), App.fmtMoney(App.fobDeposit()), "Refundable · its own sale line")) + "</div>";
    html += '<div data-bill-totals>' + totalsHtml() + "</div>";
    return html;
  }
  function updateBill() { var b = m && m.body.querySelector("[data-bill]"); if (b) b.innerHTML = bill(person()); refreshPay(); }
  function updateTotals() { var t = m && m.body.querySelector("[data-bill-totals]"); if (t) t.innerHTML = totalsHtml(); refreshPay(); }
  // Payment step: when the bill changes (item added / removed / made free, qty, Issue later …) the payment box,
  // minimum and due date follow. A prefilled amount (not typed by staff) follows the new total.
  function refreshPay() {
    if (!C || C.step !== 6 || C.done) return;
    var t = payTotals();
    if (C.pay.auto && C.pay.rows.length === 1 && Number(C.pay.rows[0].amount) !== t.total) {
      C.pay.rows[0].amount = String(t.total);
      var a0 = m.body.querySelector("#payA0"); if (a0) a0.value = C.pay.rows[0].amount;
      t = payTotals(); var tt = m.body.querySelector("[data-bill-totals]"); if (tt) tt.innerHTML = totalsHtml();
    }
    if ((partialOk() && t.balance > 0) !== !!m.body.querySelector("#payDue")) { render(); return; }
    var ps = m.body.querySelector("[data-pay-sum]"); if (ps) ps.innerHTML = paySum();
    syncPay();
  }
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
    return sec("Contact details", '<p class="muted">Check the details. Name and mobile can be changed in the Details tab.</p>' +
      '<dl class="kv"><dt>Name</dt><dd>' + esc(p.name) + "</dd><dt>Mobile</dt><dd>" + esc(p.cc + " " + p.mobile) + "</dd>" +
      "<dt>Branch</dt><dd>" + esc(App.branchName(p.branchId)) + "</dd></dl>" +
      '<div class="form-grid">' +
        '<div class="field"><label for="cvEmail">Email</label><input class="input' + inv("email") + '" id="cvEmail" data-k="email" type="email" value="' + esc(C.email) + '" placeholder="name@example.com">' +
          (C.errors.email ? err("email") : C.email ? "" : '<span class="hint">No email: receipts go by WhatsApp only.</span>') + "</div>" +
        '<div class="field"><label for="cvGender">Gender <span class="req">*</span></label><select class="input' + inv("gender") + '" id="cvGender" data-k="gender">' +
          '<option value="">Choose…</option>' + D.lists.genders.map(function (g) { return "<option" + (g === C.gender ? " selected" : "") + ">" + g + "</option>"; }).join("") +
          "</select>" + err("gender") + "</div>" +
        '<div class="field"><label for="cvBirth">Birth date</label><input class="input" id="cvBirth" data-k="birthDate" type="date" value="' + esc(C.birthDate) + '" max="' + isoDay(new Date()) + '"></div>' +
      "</div>");
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
  // Limit (#103 Q22): the LOWER of (pct % of the line) and the ₹ cap; % 0 = no discount; never above the line (PT part for Premium PT).
  function discError() {
    var k = pkg(), mo = money(), r = App.discountRule();
    if (!k || !k.price || quote()) return "";   // a quote was checked against its CREATOR's limit (#111)
    if (Number(C.disc) < 0) return "Discount can't be negative.";
    if (mo.disc > mo.base) return isPrem() ? "Discount can't be more than the PT part (" + App.fmtMoney(mo.base) + ")." : "Discount can't be more than the price.";
    if (mo.disc > 0 && !r.pct) return "No discount for your role.";
    if (mo.disc > App.discountMaxAmount(mo.base)) return App.discountRuleText() + " (here up to " + App.fmtMoney(App.discountMaxAmount(mo.base)) + ").";
    return "";
  }
  function quoteCard(q) {
    var mo = App.Quote.money(q), exp = q.status !== "Open", sel = C.quoteId === q.id;
    return '<button type="button" class="pkg-card' + (sel ? " selected" : "") + '" data-quote="' + q.id + '"' + (exp ? ' disabled title="Expired on ' + esc(App.fmtIsoDate(q.validTill)) + '"' : "") + ' aria-pressed="' + sel + '">' +
      "<strong>" + esc(q.package) + '</strong><span class="cell-sub">Trainer ' + esc(App.userName(q.trainerUserId)) + " · by " + esc(App.firstName(App.byId(D.users, q.createdByUserId))) + "</span>" +
      '<span class="pkg-price">' + App.fmtMoney(mo.final) + "</span>" + (mo.disc ? '<span class="cell-sub">' + App.fmtMoney(mo.disc) + " off the PT part</span>" : "") +
      '<span class="hint">' + (exp ? "Expired on " + esc(App.fmtIsoDate(q.validTill)) : "Valid till " + esc(App.fmtIsoDate(q.validTill))) + "</span></button>";
  }
  function repField(p, k) {
    return '<div class="field"><label for="cvRep">Sales rep <span class="req">*</span></label><select class="input" id="cvRep" data-k="repId">' + reps(p).map(function (u) {
          return '<option value="' + u.id + '"' + (u.id === C.repId ? " selected" : "") + ">" + esc(u.name) + " · " + esc(App.branchName(u.branchIds[0])) + (u.id === App.me().id ? " (me)" : "") + "</option>"; }).join("") +
          '</select><span class="hint">You, the person creating the sale (#107). The trainer is separate: the quote\'s trainer goes on the PT line.</span></div>';
  }
  function s2(p) {
    var k = pkg(), mo = money(), lim = limitPct(), de = C.errors.disc || discError(), qs = quotesFor(p), qq = quote();
    if (qq) {
      // Locked bill from the quote (#113): package, trainer, price, discount. Only payment (+ FF ID / key fob) is entered.
      var qm = App.Quote.money(qq);
      return '<section class="cv-card" data-quote-locked><h3 class="cv-card-title">PT quote · locked</h3><dl class="kv">' +
        "<dt>Package</dt><dd>" + esc(qq.package) + "</dd><dt>Trainer (PT line)</dt><dd data-quote-trainer>" + esc(App.userName(qq.trainerUserId)) + "</dd>" +
        "<dt>Price</dt><dd>" + App.fmtMoney(qm.price) + ' <span class="cell-sub">membership ' + App.fmtMoney(qm.ref) + " + PT " + App.fmtMoney(qm.base) + "</span></dd>" +
        "<dt>Discount</dt><dd>" + (qm.disc ? App.fmtMoney(qm.disc) + " off the PT part · " + esc(qq.discountReason === "Other" ? qq.discountReasonOther : qq.discountReason) : "None") + "</dd>" +
        "<dt>Final</dt><dd><strong>" + App.fmtMoney(qm.final) + "</strong></dd><dt>Quote</dt><dd>by " + esc(App.userName(qq.createdByUserId)) + " · valid till " + esc(App.fmtIsoDate(qq.validTill)) + "</dd></dl>" +
        '<p class="hint">Made by the CM / MXM; nothing here can be changed. <button type="button" class="link-btn" data-unquote>Choose another</button></p>' +
        '<div class="form-grid">' + repField(p, k) + "</div></section>";
    }
    var html = '<section class="cv-card"><h3 class="cv-card-title">Package</h3><div class="field pkg-search"><label for="cvPkgQ" class="sr-only">Search packages</label>' +
      '<input class="input" id="cvPkgQ" type="search" data-k="pkgQ" autocomplete="off" placeholder="Search packages by name…" value="' + esc(C.pkgQ) + '"></div>' +
      '<div data-pkglist>' + pkgList(p) + "</div>" + err("pkg");
    if (qs.length) html += '<div class="acc open" data-quotes><div class="acc-head"><span class="acc-title">PT quotes</span><span class="badge">' + qs.length + '</span></div><div class="pkg-grid acc-body">' + qs.map(quoteCard).join("") + "</div></div>";
    else if (App.can("sales.sellPTDirect") !== true) html += '<p class="hint" data-no-quotes>PT / Premium PT: ask the CM / MXM for a PT quote ("Request PT quote" on the profile); you then bill it here.</p>';
    html += '<p class="hint">Trials are booked with "Book trial", never here. Membership and Premium PT only (#93).</p>';
    if (k && k.people === 2) html += '<p class="hint">Converts this person only. Adding the partner comes later.</p>';
    html += "</section>";
    if (k && k.price > 0) {
      html += '<section class="cv-card"><h3 class="cv-card-title">Price &amp; discount</h3><div class="form-grid">' +
        '<div class="field"><label>Price</label><div class="input input-static">' + App.fmtMoney(k.price) + ' <span class="muted">· locked</span></div></div>' +
        // Discount (decision #73): [% | ₹] + amount in one row, live line under it, limit note small.
        '<div class="field"><label for="cvDisc">Discount</label><div class="disc-row"><div class="seg seg-join" role="radiogroup" aria-label="Discount type">' +
          ["%", "₹"].map(function (x) { return '<button type="button" class="seg-btn' + (C.mode === x ? " active" : "") + '" role="radio" aria-checked="' + (C.mode === x) + '" data-disc="' + x + '">' + x + "</button>"; }).join("") +
          '</div><input class="input input-num' + (de ? " invalid" : "") + '" id="cvDisc" data-k="disc" type="number" min="0" value="' + esc(C.disc) + '" placeholder="0"' + (App.discountRule().pct ? "" : " disabled") + "></div>" +
          '<div class="disc-live" data-disc-line>' + discLine() + "</div>" +
          '<span class="error" data-disc-err' + (de ? "" : " hidden") + ">" + de + "</span>" +
          '<span class="hint">' + (k.type === "Premium PT" ? "Discount on the PT part only (" + App.fmtMoney(mo.base) + "); the membership stays at " + App.fmtMoney(mo.mem) + "." : "Discount applies to the package only, not accessories or the key fob deposit.") + "</span>" +
          '<span class="hint" data-disc-limit>Your limit (' + esc(App.state.role) + "): " + (App.discountRule().pct ? esc(App.Perm.text(App.discountRule(), { type: "pctcap" })) + " · here up to " + App.fmtMoney(App.discountMaxAmount(mo.base)) : "no discount for your role") + "</span></div>" +
        (mo.disc > 0 ? '<div class="field"><label for="cvReason">Discount reason <span class="req">*</span></label><select class="input' + inv("reason") + '" id="cvReason" data-k="reason">' +
            '<option value="">Choose…</option>' + D.lists.discountReasons.map(function (r) { return "<option" + (r === C.reason ? " selected" : "") + ">" + esc(r) + "</option>"; }).join("") + "</select>" + err("reason") +
            (C.reason === "Other" ? '<input class="input mt-1' + inv("reasonOther") + '" id="cvReasonOther" data-k="reasonOther" value="' + esc(C.reasonOther) + '" placeholder="Write the reason" aria-label="Other reason">' + err("reasonOther") : "") + "</div>" : "") +
        '<div class="field"><label for="cvRep">Sales rep <span class="req">*</span></label><select class="input" id="cvRep" data-k="repId">' + reps(p).map(function (u) {
          return '<option value="' + u.id + '"' + (u.id === C.repId ? " selected" : "") + ">" + esc(u.name) + " · " + esc(App.branchName(u.branchIds[0])) + (u.id === App.me().id ? " (me)" : "") + "</option>"; }).join("") +
          '</select><span class="hint">' + (k.type === "Premium PT" ? "One sales rep for the whole Premium PT package. Whether the membership part pays any incentive, and to whom, is set by the incentive scheme." : "Gets the credit for this sale line. Defaults to you (the person creating the sale); any staff who can be sales rep, any branch.") + "</span></div>" +
        "</div></section>";
    }
    return html;
  }
  // Accordions per category (+ / −) with a count; search filters across all groups and opens the ones with matches.
  function card(p, x) {
    var pt = x.type === "PT", prem = x.type === "Premium PT", sel = x.id === C.pkgId, fl = freeLines(p, x);
    return '<button type="button" class="pkg-card' + (sel ? " selected" : "") + '" data-pkg="' + x.id + '"' + (pt ? ' disabled title="PT needs an active membership · sell it after joining"' : "") +
      ' aria-pressed="' + sel + '"><strong>' + esc(x.name) + '</strong><span class="cell-sub">' + x.days + (x.days === 1 ? " day" : " days") + (x.sessions ? " · " + x.sessions + " sessions" : "") +
      (x.people === 2 ? " · couple" : "") + '</span><span class="pkg-price">' + (x.price ? App.fmtMoney(x.price) : "Free") + "</span>" +
      (prem ? '<span class="cell-sub">incl. membership ' + App.fmtMoney(x.referenceMembershipPrice || 0) + " · PT " + App.fmtMoney(x.price - (x.referenceMembershipPrice || 0)) + "</span>" : "") +
      (fl.length ? '<span class="pkg-free">Free: ' + fl.map(function (f) { return esc(f.name) + (f.status === "Skipped" ? " (already received)" : ""); }).join(", ") + "</span>" : "") +
      (pt ? '<span class="hint">PT needs an active membership · sell it after joining</span>' : "") + "</button>";
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
    if (k.price > 0 && !quote()) {
      var de = discError(); if (de) e.disc = de;
      if (mo.disc > 0 && !C.reason) e.reason = "A reason is needed for a discount.";
      else if (mo.disc > 0 && C.reason === "Other" && !C.reasonOther.trim()) e.reasonOther = "Write the reason.";
    }
    return e;
  }

  // Step 3 — sale type (automatic) + start date
  function saleBox(k) {
    if (k.type === "Premium PT") return '<div class="next-step green"><div class="ns-label">Sale type · automatic</div><strong>Paid</strong> · becomes a Client with membership + PT<div class="cell-sub">Two lines at sale (membership = reference price, PT = the rest). Next: Corporate entry (FF ID required, key fob can be pending).</div></div>';
    return '<div class="next-step green"><div class="ns-label">Sale type · automatic</div><strong>Paid</strong> · becomes a Client<div class="cell-sub">Next: Corporate entry. FF ID is required; the key fob can stay pending.</div></div>';
  }
  function adjustBox() {
    var infos = [adjustInfo("Membership"), adjustInfo("PT")].filter(Boolean); if (!infos.length) return "";
    return sec("Paid trial adjust", infos.map(function (a) {
      var key = a.type === "PT" ? "adjustPt" : "adjustMem";
      if (a.none) return '<p class="cell-sub" data-adj-info="' + a.type + '">' + icon("info", "ico-sm") + " " + esc(a.why) + "</p>";
      return '<label class="switch" data-adj-row="' + a.type + '"><input type="checkbox" data-adjust="' + key + '"' + (a.on ? " checked" : "") + (a.locked ? " disabled" : "") + "><span>Paid " + App.Trial.label(a.type) + " trial " + App.fmtMoney(a.amount) + " adjusted" +
        (a.locked ? ' <span class="badge badge-info">Locked</span>' : "") + '</span></label><div class="cell-sub">' + esc(a.why) + (a.locked ? " · the trial ends at conversion" : "") + "</div>";
    }).join(""));
  }
  function s3(p) {
    var k = pkg(), r = App.saleStartRange(), e = endDate(), locked = startLocked();
    return sec("Sale type", saleBox(k)) + adjustBox() + sec("Dates",
      '<div class="form-grid"><div class="field"><label for="cvStart">Start date <span class="req">*</span></label>' +
        '<input class="input' + inv("start") + '" id="cvStart" data-k="start" type="date" min="' + (locked ? C.start : r.min) + '" max="' + (locked ? C.start : r.max) + '" value="' + esc(C.start) + '"' + (locked ? " disabled" : "") + ">" +
        (C.errors.start ? err("start") : locked ? '<span class="hint" data-start-locked>Set by system = the paid trial\'s start date (' + esc(App.fmtIsoDate(C.start)) + "). Exempt from the back-date rule (#94, #103).</span>" : '<span class="hint" data-start-hint>' + esc(r.hint) + "</span>") + "</div>" +
      '<div class="field"><label>Ends</label><div class="input input-static" data-end>' + (e ? esc(App.fmtDate(e.toISOString())) + ' <span class="muted">· ' + k.days + (k.days === 1 ? " day" : " days") + ", start day included</span>" : "—") + "</div></div></div>");
  }
  function check3() {
    var e = {}, msg = startLocked() ? "" : App.saleStartError(C.start);
    if (msg) e.start = msg;
    return e;
  }

  // Step 4 — Corporate entry: FF ID & key fob (decisions #67, #72, #75)
  function s4(p) {
    var st = stock(p), fobOk = needsFob();
    var head = '<section class="cv-card"><h3 class="cv-card-title">' + esc(CORP) + '</h3><p class="muted">FF ID is required to convert (decision #93). The key fob can be assigned later and shows as pending until then.</p>' +
      '<div class="field"><label for="cvFf">FF ID <span class="req">*</span></label><input class="input' + inv("ffId") + '" id="cvFf" data-k="ffId" value="' + esc(C.ffId) + '" placeholder="e.g. FF-20500" required>' +
        (C.errors.ffId ? err("ffId") : '<span class="hint">From the corporate software. Enter the client there first, then the FF ID here.</span>') + "</div>";
    head += '<div class="field"><label>Key fob</label>';
    if (!st.length) return head + '<div class="callout callout-warn">' + icon("alert") + "<span>No key fobs in stock at " + esc(App.branchName(p.branchId)) +
      ". You can finish now; <strong>Key fob pending</strong> shows on the profile until one is assigned.</span></div></div></section>";
    return head + '<p class="muted">' + esc(App.branchName(p.branchId)) + " stock: " + st.length + " in stock</p>" +
      '<div class="fob-pick"><div class="chips" role="radiogroup" aria-label="Key fob">' + st.map(function (f) {
        return '<button type="button" class="chip' + (C.fob === f.no ? " selected" : "") + '" role="radio" aria-checked="' + (C.fob === f.no) + '" data-fob="' + f.no + '">' + icon("key", "ico-sm") + esc(f.no) + "</button>";
      }).join("") + '<button type="button" class="chip' + (C.fob === "" ? " selected" : "") + '" role="radio" aria-checked="' + (C.fob === "") + '" data-fob="">Add later</button></div>' +
      (C.fob ? '<label class="switch"><input type="checkbox" id="cvFobFree" data-fobfree' + (C.fobFree ? " checked" : "") + "><span>Free (no deposit)</span></label>" : "") + "</div>" +
      (C.fob && C.fobFree ? '<div class="field mt-1"><label for="cvFobWhy">Reason for a free fob <span class="req">*</span></label><input class="input' + inv("fobFreeWhy") + '" id="cvFobWhy" data-k="fobFreeWhy" value="' + esc(C.fobFreeWhy) + '" placeholder="e.g. Corporate tie-up">' + err("fobFreeWhy") + "</div>" : "") +
      '<p class="hint">Usually given after the client is entered in the corporate software. "Add later" shows <strong>Key fob pending</strong>. The deposit is added to the bill.</p></div></section>';
  }
  function check4() {
    var e = {}, p = person(), ff = C.ffId.trim().toLowerCase();
    if (!ff) e.ffId = "FF ID is required to convert (enter the client in the corporate software first).";
    else { var d2 = D.people.filter(function (o) { return o.id !== p.id && (o.ffId || "").toLowerCase() === ff; })[0]; if (d2) e.ffId = dupMsg(d2); }
    if (needsFob() && C.fob && C.fobFree && !C.fobFreeWhy.trim()) e.fobFreeWhy = "A reason is needed for a free fob.";
    return e;
  }

  // Step 5 — summary
  function s5(p) {
    var k = pkg(), mo = money(), e = endDate(), prem = k.type === "Premium PT";
    var rows = [["Person", p.name + " · " + p.cc + " " + p.mobile], ["Package", k.name + (prem ? " · 2 lines: Membership (included) " + App.fmtMoney(mo.mem) + " + PT " + App.fmtMoney(mo.pt) : "")], ["Sale type", k.saleType + (prem ? " · membership + PT" : "")],
      ["Start – end", App.fmtDate(new Date(C.start + "T00:00").toISOString()) + " – " + App.fmtDate(e.toISOString())]];
    // Money lines (price, discount, free items, accessories, deposit, GST, total) are in the bill summary on the right.
    if (quote()) rows.push(["Trainer (PT line)", App.userName(quote().trainerUserId) + " · from the PT quote by " + App.userName(quote().createdByUserId)]);
    rows.push(["Sales rep", App.userName(C.repId) + (prem ? " · whole package (membership part: incentive by scheme)" : "")]);
    if (mo.disc) rows.push(["Discount reason", reasonText()]);
    adjusts().forEach(function (a) { rows.push(["Paid " + App.Trial.label(a.type) + " trial adjusted", "− " + App.fmtMoney(a.amount) + " · " + a.t.package + (a.locked ? " · start = trial start (set by system)" : " · start = today")]); });
    rows.push([CORP, "FF ID: " + C.ffId.trim() + " · Key fob: " + (C.fob ? C.fob + (C.fobFree ? " (free)" : "") : "Pending")]);
    if (!p.ownerUserId) rows.push(["Owner", App.me().name + " (you, lead was unassigned)"]);
    var open = App.Followup.openFollowUps(p.id).length;
    return sec("Summary", '<dl class="kv kv-wide">' + rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
      (open ? '<p class="hint">' + open + " open follow-up" + (open > 1 ? "s" : "") + " will be closed by system · client converted.</p>" : "") +
      '<div class="callout">' + icon("info") + "<span>Next: Payment. " + esc(p.name.split(" ")[0]) + " becomes a client when the first payment is saved.</span></div>");
  }

  // Step 6 — Payment (decisions #79–#83). Money taken = client.
  function partialOk() { var k = pkg(); return !!k && k.saleType === "Paid" && (k.type === "Membership" || k.type === "PT" || k.type === "Premium PT"); }
  function paySum() {
    var t = payTotals(), pl = ptLine(t);
    return '<div class="pay-sum-row"><span>Total</span><strong>' + App.fmtMoney(t.total) + '</strong></div><div class="pay-sum-row"><span>Paid now</span><strong>' + App.fmtMoney(t.paid) +
      '</strong></div><div class="pay-sum-row' + (t.balance ? " is-due" : "") + '"><span>Balance due</span><strong>' + App.fmtMoney(t.balance) + "</strong></div>" + (pl ? '<div class="cell-sub">' + pl + "</div>" : "");
  }
  function s6(p) {
    var t = payTotals(), methods = App.activePayMethods(), tomorrow = isoDay(plus(isoDay(new Date()), 1));
    var rows = C.pay.rows.map(function (r, i) {
      var pm = App.payMethod(r.method), needs = !pm || pm.needsRef;
      return '<div class="pay-row" data-pay-row="' + i + '">' +
        '<div class="field"><label for="payM' + i + '">Method <span class="req">*</span></label><select class="input" id="payM' + i + '" data-pay="method" data-i="' + i + '">' +
          methods.map(function (x) { return "<option" + (x.name === r.method ? " selected" : "") + ">" + esc(x.name) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="payA' + i + '">Amount <span class="req">*</span></label><input class="input' + inv("pa" + i) + '" id="payA' + i + '" type="number" min="1" step="0.01" data-pay="amount" data-i="' + i + '" value="' + esc(r.amount) + '">' + err("pa" + i) + "</div>" +
        '<div class="field"><label for="payR' + i + '">Reference / transaction no.' + (needs ? ' <span class="req">*</span>' : "") + '</label><input class="input' + inv("pr" + i) + '" id="payR' + i + '" data-pay="ref" data-i="' + i + '" value="' + esc(r.ref) + '" placeholder="' + (needs ? "e.g. UPI-55821934" : "Not needed for cash") + '">' + err("pr" + i) + "</div>" +
        '<div class="pay-row-actions"><button type="button" class="btn btn-sm" data-pay-slip="' + i + '">' + icon("upload", "ico-sm") + (r.slip ? "Slip attached" : "Slip (optional)") + "</button>" +
          (C.pay.rows.length > 1 ? '<button type="button" class="btn btn-ghost icon-btn btn-sm" data-pay-del="' + i + '" aria-label="Remove payment row ' + (i + 1) + '">' + icon("x", "ico-sm") + "</button>" : "") + "</div></div>";
    }).join("");
    return sec("Payment",
      '<dl class="kv"><dt>Receipt no.</dt><dd><span class="mono" data-receipt>' + esc(App.nextReceiptNo(p.branchId)) + '</span> <span class="cell-sub">auto, per branch · read-only</span></dd></dl>' +
      rows + '<button type="button" class="link-btn bill-add" data-pay-add>' + icon("plus", "ico-sm") + "Add payment row (split payment)</button>" +
      '<div class="pay-sum" data-pay-sum>' + paySum() + "</div>" + (C.errors.pay ? '<p class="error" data-pay-err>' + C.errors.pay + "</p>" : "") +
      '<p class="' + (belowMin() ? "error" : "hint") + '" data-min-msg>' + esc(minMsg()) + "</p>" +
      (t.must ? '<p class="hint">Accessories and the key fob deposit (' + App.fmtMoney(t.must) + ") are settled first and must be paid in full.</p>" : "") +
      // Due date only when there is a balance (decision #87).
      (partialOk() && t.balance > 0
        ? '<div class="field"><label for="payDue">Balance due date</label><input class="input' + inv("payDue") + '" id="payDue" type="date" data-k="payDue" min="' + tomorrow + '" value="' + esc(C.payDue) + '">' +
          (C.errors.payDue ? err("payDue") : '<span class="hint">Creates "Payment due" on the profile and in Today, and a Payment expected follow-up on that date.</span>') + "</div>"
        : ""),
      ' data-pay-card');
  }
  function check6() {
    var e = {}, t = payTotals(), today = isoDay(new Date());
    C.pay.rows.forEach(function (r, i) {
      if (!(Number(r.amount) > 0)) e["pa" + i] = "Enter an amount.";
      var pm = App.payMethod(r.method); if (pm && pm.needsRef && !r.ref.trim()) e["pr" + i] = "Reference no. is needed for " + esc(r.method) + ".";
    });
    if (t.paid > t.total + 1e-9) e.pay = "Paid now is more than the total (" + App.fmtMoney(t.total) + ").";
    else if (belowMin()) e.pay = esc(minMsg()) + ".";
    else if (t.balance && !C.payDue) e.payDue = "Pick a due date for the balance.";
    else if (t.balance && C.payDue <= today) e.payDue = "The due date must be after today.";
    return e;
  }

  // ---------- navigation ----------
  function go(dir) {
    if (dir > 0) {
      var e = Object.assign([null, check1, check2, check3, check4, function () { return {}; }][C.step](), C.step >= 2 ? checkExtras() : {});
      C.errors = e; if (Object.keys(e).length) { render(); var f = m.body.querySelector(".invalid, .error"); if (f && f.focus) f.focus(); return; }
    } else C.errors = {};
    var vs = visibleSteps().map(function (s) { return s.k; }), i = vs.indexOf(C.step) + dir;
    C.step = vs[Math.max(0, Math.min(vs.length - 1, i))];
    // Payment step: prefill the first row with the total (staff lower it for a partial payment).
    if (C.step === 6 && C.pay.rows.length === 1 && (C.pay.rows[0].amount === "" || C.pay.auto)) { C.pay.rows[0].amount = String(payTotals().total); C.pay.auto = true; }
    render();
  }
  function onClick(e) {
    var t = e.target.closest("[data-quote],[data-unquote],[data-pkg],[data-disc],[data-fob],[data-acc],[data-issue],[data-x-add],[data-x-cancel],[data-x-pick],[data-x-del],[data-pay-add],[data-pay-del],[data-pay-slip]"); if (!t || t.disabled) return;
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
    if (t.hasAttribute("data-pay-add")) { C.pay.rows.push({ method: (App.activePayMethods()[0] || {}).name || "", amount: "", ref: "", slip: "" }); render(); var na = m.body.querySelector("#payA" + (C.pay.rows.length - 1)); if (na) na.focus(); return; }
    if (t.dataset.payDel) { C.pay.rows.splice(+t.dataset.payDel, 1); C.errors = {}; render(); return; }
    if (t.dataset.paySlip) { var r = C.pay.rows[+t.dataset.paySlip]; r.slip = r.slip ? "" : "payment-slip-" + (+t.dataset.paySlip + 1) + ".jpg (placeholder)"; render(); return; }
    if (t.dataset.xDel) { C.extras.splice(+t.dataset.xDel, 1); C.errors = {}; updateBill(); return; }
    if (t.dataset.quote) { var q0 = App.Quote.byId(t.dataset.quote); if (q0 && q0.status === "Open") { C.quoteId = q0.id; C.pkgId = q0.packageId; C.mode = "₹"; C.disc = String(q0.discount || ""); C.reason = q0.discountReason || ""; C.reasonOther = q0.discountReasonOther || ""; delete C.errors.pkg; syncAdjustDefaults(); } }
    if (t.hasAttribute("data-unquote")) { C.quoteId = null; C.pkgId = null; C.disc = ""; C.reason = ""; C.reasonOther = ""; }
    if (t.dataset.pkg) { C.quoteId = null; C.pkgId = t.dataset.pkg; delete C.errors.pkg; if (pkg().price === 0) { C.disc = ""; C.reason = ""; C.reasonOther = ""; } syncAdjustDefaults(); }
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
    if (d.pay) {   // payment rows: update totals live without re-rendering the input
      C.pay.rows[+d.i][d.pay] = e.target.value;
      if (d.pay === "amount") C.pay.auto = false;   // staff typed an amount: stop following the total
      if (d.pay === "method" && e.type === "change") { render(); return; }
      var needDue = partialOk() && payTotals().balance > 0;
      if (needDue !== !!m.body.querySelector("#payDue")) {   // due date appears / disappears with the balance
        var id = e.target.id; render(); var back = m.body.querySelector("#" + id); if (back) back.focus(); return;
      }
      updateTotals(); return;
    }
    if (e.target.dataset.adjust) { C[e.target.dataset.adjust] = e.target.checked; render(); return; }
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
    if (k === "payDue") { updateTotals(); return; }
    if (k === "fobFreeWhy" || k === "reasonOther") { var b = m.body.querySelector("[data-bill]"); if (b) b.innerHTML = bill(person()); return; }
    updateBill();
    if (k === "start") { var en = m.body.querySelector("[data-end]"), ed = endDate(); if (en && ed) en.innerHTML = esc(App.fmtDate(ed.toISOString())) + ' <span class="muted">· ' + pkg().days + " days, start day included</span>"; }
    if (k === "email" && e.type === "change") render();
  }

  // ---------- finish ----------
  function finish() {
    var xe = Object.assign(checkExtras(), check4(), check6());
    if (Object.keys(xe).length) { C.errors = xe; if (xe.ffId) { C.step = 4; } render(); var f0 = m.body.querySelector(".invalid, .error"); if (f0 && f0.focus) f0.focus(); return; }
    var T = payTotals();
    var p = person(), k = pkg(), mo = money(), now = new Date().toISOString(), me = App.me();
    // Cross-branch sale (#106): setting "On sale" -> the seller takes over first (lead moves to their branch, owner = seller).
    if (App.Cross.isCrossWorker(p, me.id) && App.Lead.crossSetting() === "On sale") App.Lead.crossTakeOver(p, me.id);
    var defRep = defaultRep(p);
    if (C.repId !== defRep) App.Event.log(p.id, { type: "SalesRepChanged", from: defRep, to: C.repId, text: "Sales rep changed from " + App.firstName(App.byId(D.users, defRep)) + " to " + App.firstName(App.byId(D.users, C.repId)) + " by " + App.firstName(me) });
    p.email = C.email.trim() || null; p.gender = C.gender; p.birthDate = C.birthDate || null; p.ffId = C.ffId.trim() || null;
    if (!p.ownerUserId) { p.ownerHistory.push({ from: null, to: me.id, at: now, by: me.id }); p.ownerUserId = me.id; App.Followup.openFollowUps(p.id).forEach(function (f) { f.ownerUserId = me.id; }); }
    var startIso = new Date(C.start + "T00:00").toISOString(), endIso = endDate().toISOString();

    var prem = k.type === "Premium PT", clientNo = "CL-" + D.nextClientNo++, why = reasonText();
    function takeStock(itemId, qty, note) {
      var st = D.itemStock.filter(function (x) { return x.itemId === itemId && x.branchId === p.branchId; })[0];
      st.qty -= qty; D.stockMoves.push({ itemId: itemId, branchId: p.branchId, qty: -qty, at: now, by: me.id, note: note });
    }
    p.kind = "Client"; p.stage = "Converted"; p.clientNo = clientNo; p.homeBranchId = p.branchId; p.joinedAt = now; p.photo = null;
    // Premium PT (#92, #93): membership line = reference price, PT line = the rest; discount split proportionally; one rep per line.
    var adjM = adjAmount("Membership"), adjP = adjAmount("PT"), adjList = adjusts();
    p.membership = { packageId: k.id, package: prem ? k.name + " · Membership (included)" : k.name, saleType: k.saleType, start: startIso, end: endIso, price: mo.mem,
      discount: mo.memDisc, discountReason: mo.memDisc ? why : null, finalPrice: mo.memFinal - adjM, salesRepUserId: C.repId, premium: prem || undefined,
      incentiveByScheme: prem || undefined,   // Premium PT membership line: rep stored only as a reference (#103)
      trialAdjust: adjM ? { trialId: adjustInfo("Membership").t.id, amount: adjM } : undefined,
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
    // Payment (decisions #79–#83): one receipt for this payment, split rows allowed. Balance -> due date + Payment expected follow-up.
    var receiptNo = App.nextReceiptNo(p.branchId, true), al = alloc();
    var rows = C.pay.rows.map(function (r) { return { method: r.method, amount: Math.round(Number(r.amount) * 100) / 100, ref: r.ref.trim() || null, slip: r.slip || null }; });
    var receipt = { no: receiptNo, at: now, by: me.id, rows: rows };
    // Allocation: accessories → fob deposit → membership line → PT line (#93). The membership line carries accessories + deposit.
    p.membership.payment = { total: T.total - al.ptDue, paid: T.paid - al.pt, dueDate: T.balance && (T.total - al.ptDue) > (T.paid - al.pt) ? C.payDue : null, receipts: [receipt] };
    if (prem) {
      p.pt = { packageId: k.id, package: k.name + " · PT (included)", premium: true, price: mo.pt, discount: mo.ptDisc, finalPrice: mo.ptFinal - adjP, sessions: k.sessions,
        start: startIso, end: endIso, salesRepUserId: C.repId, discountReason: mo.ptDisc ? why : null, trialAdjust: adjP ? { trialId: adjustInfo("PT").t.id, amount: adjP } : undefined,
        payment: { total: al.ptDue, paid: al.pt, dueDate: al.ptDue > al.pt ? C.payDue : null, receipts: [receipt] } };
    }
    // The adjusted trial ends at conversion (#94); other running trials keep running until their end date.
    adjList.forEach(function (a) { a.t.adjustedAt = now; a.t.adjustedInto = a.type === "PT" ? "pt" : "membership"; App.addTimeline(p.id, "milestone", "Paid " + App.Trial.label(a.type) + " trial " + App.fmtMoney(a.amount) + " adjusted into " + k.name + (a.locked ? " · trial ended at conversion" : "")); });
    var closed = App.Followup.closeBySystem(p.id, "Client converted");
    App.addTimeline(p.id, "milestone", "Payment " + App.fmtMoney(T.paid) + " received · " + rows.map(function (r) { return r.method + " " + App.fmtMoney(r.amount); }).join(" + ") +
      " · receipt " + receiptNo + (T.balance ? " · balance " + App.fmtMoney(T.balance) + " due " + App.fmtIsoDate(C.payDue) : " · paid in full"));
    if (T.balance) App.Followup.create(p.id, { type: "Payment expected", dueDate: C.payDue, dueTime: null, note: "Balance " + App.fmtMoney(T.balance) + " · receipt " + receiptNo });
    App.addTimeline(p.id, "milestone", "Converted to Client · " + k.name + (prem ? " (membership " + App.fmtMoney(mo.memFinal - adjM) + " + PT " + App.fmtMoney(mo.ptFinal - adjP) + ", " + k.sessions + " sessions)" : "") + " · " + App.fmtMoney(mo.final - adjM - adjP) +
      (mo.disc ? " (" + App.fmtMoney(mo.disc) + " off: " + why + ")" : "") + (p.keyFob ? " · key fob " + p.keyFob + (C.fobFree ? " (free)" : "") : "") +
      (p.membership.items.length ? " · " + p.membership.items.map(function (x) { return x.name + " × " + x.qty + (x.free ? " (free)" : ""); }).join(", ") : "") +
      " · sales rep " + App.firstName(App.byId(D.users, C.repId)));
    var pend = App.profilePending ? App.profilePending(p) : [];
    C.done = true;
    C.doneHtml = '<div class="state">' + icon("check") + "<h3>" + esc(p.name) + " is now a client (" + esc(clientNo) + ")</h3>" +
      '<p class="muted">Receipt <span class="mono">' + esc(receiptNo) + "</span> · paid " + App.fmtMoney(T.paid) + (T.balance ? " · balance " + App.fmtMoney(T.balance) + " due " + esc(App.fmtIsoDate(C.payDue)) : " · paid in full") + "</p>" +
      (closed ? '<p class="hint">' + closed + " open follow-up" + (closed > 1 ? "s" : "") + " closed by system · client converted.</p>" : "") +
      (pend.length ? '<div class="stack">' + pend.map(function (x) { return '<span class="badge badge-warning">' + esc(x.t) + "</span>"; }).join("") + "</div>" : "") + "</div>";
    render();
    // PT quote (#113): the quote's trainer goes on the PT line (PT incentive; session trainer until a trainer change); the quote becomes Used.
    var qq = quote();
    if (qq) {
      if (p.pt) { p.pt.trainerUserId = qq.trainerUserId; p.pt.quoteId = qq.id; }
      p.membership.quoteId = qq.id; qq.status = "Used"; qq.usedAt = now; qq.usedByUserId = me.id;
      App.Event.log(p.id, { type: "QuoteUsed", from: "Open", to: "Used", text: "PT quote billed by " + App.firstName(me) + " · trainer " + App.firstName(App.byId(D.users, qq.trainerUserId)) + " on the PT line" });
    }
    App.Event.log(p.id, { type: "Converted", to: "Client", remark: k.name });
    App.toast(p.name + " is now a client (" + clientNo + ")", "success");
    C.clientId = p.id;
    App.dataChanged();
    App.openProfile(p.id, { state: "normal", tab: "membership" });   // updates the link to #client-…; shows when the mode exits
  }

  App.Convert = { open: open, defaultRep: defaultRep };
})();
