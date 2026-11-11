/* Shared follow-up + lead-status flows. ONE implementation used by the list,
   the profile drawer composer and the NEXT STEP box (decision #7).
     App.Followup.mountForm(container, personId) -> { value(), reset() }
     App.Followup.openAdd(personId, opts)        add follow-up modal
     App.Followup.openOutcome(followUpId)        log outcome -> (lost?) -> next follow-up
     App.Followup.cancel(followUpId)             cancel (never delete)
     App.Lead.markLost(personId, opts)           reason modal ("Other" needs text)
     App.Lead.reopen(personId)                   clears reason, timeline "Re-opened", asks next follow-up
     App.Lead.assign(personId)                   pick owner from the lead's branch
   Load after shell.js. */
(function () {
  var D = window.DUMMY, L = D.lists, esc = App.esc;
  var ASSIGNABLE_ROLES = ["Sales Executive", "Sales Manager", "Club Manager"];
  var PICKS = [{ k: "1", t: "Tomorrow", d: 1 }, { k: "3", t: "In 3 days", d: 3 }, { k: "7", t: "In 1 week", d: 7 }, { k: "c", t: "Custom" }];
  var VERB = { "Call": "called", "WhatsApp": "messaged on WhatsApp", "Visit planned": "had the visit",
    "Free trial planned": "followed up on the free trial", "Payment expected": "followed up on payment" };
  var NEXT_WORD = { "Call": "call", "WhatsApp": "WhatsApp", "Visit planned": "visit", "Free trial planned": "free trial", "Payment expected": "payment follow-up" };

  function person(id) { return App.byId(D.people, id); }
  function isOpenLead(p) { return p && p.kind === "Lead" && p.stage !== "Lost" && p.stage !== "Converted"; }
  function openFollowUps(pid) { return D.followUps.filter(function (f) { return f.personId === pid && f.status === "Open"; }); }
  function chips(name, items, selected) {
    return '<div class="chips" role="radiogroup">' + items.map(function (i) {
      var v = typeof i === "string" ? i : i.k, t = typeof i === "string" ? i : i.t;
      return '<button type="button" class="chip' + (v === selected ? " selected" : "") + '" role="radio" aria-checked="' + (v === selected) +
        '" data-chip="' + name + '" data-v="' + esc(v) + '">' + esc(t) + "</button>";
    }).join("") + "</div>";
  }
  function selectChip(btn) {
    Array.prototype.forEach.call(btn.parentNode.children, function (c) { c.classList.toggle("selected", c === btn); c.setAttribute("aria-checked", c === btn); });
  }
  function chipValue(root, name) { var c = root.querySelector('[data-chip="' + name + '"].selected'); return c ? c.dataset.v : ""; }
  function isoDate(d) { var x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d; }

  // ---------- The ONE follow-up form ----------
  function mountForm(container, personId, opts) {
    opts = opts || {};
    var p = person(personId), defType = opts.type || "Call";
    container.innerHTML =
      '<div class="ff">' +
        '<div class="field"><label>Type <span class="req">*</span></label>' + chips("ftype", L.followUpTypes, defType) + "</div>" +
        '<div class="field"><label>When <span class="req">*</span></label>' + chips("fpick", PICKS, "1") +
          '<div class="row ff-when"><input class="input ff-date" type="date" aria-label="Date" hidden>' +
          '<input class="input ff-time" type="time" value="11:00" aria-label="Time (optional)" title="Time is optional"></div>' +
          '<span class="hint ff-preview"></span><span class="error ff-err" hidden></span></div>' +
        '<div class="field"><label>Note</label><textarea class="input ff-note" rows="2" placeholder="What is this follow-up about? (optional)"></textarea></div>' +
        '<p class="hint">Assigned to ' + esc(p && p.ownerUserId ? App.userName(p.ownerUserId) + " (lead owner)" : "the lead owner (not set yet)") + ".</p>" +
      "</div>";
    var root = container.querySelector(".ff");
    function dueDate() {
      var pick = chipValue(root, "fpick"), t = root.querySelector(".ff-time").value, base;
      if (pick === "c") { var v = root.querySelector(".ff-date").value; if (!v) return null; base = new Date(v + "T00:00"); }
      else base = plusDays(Number(pick));
      var hm = (t || "00:00").split(":"); base.setHours(Number(hm[0]), Number(hm[1]), 0, 0); base.noTime = !t; return base;
    }
    function preview() {
      var d = dueDate();
      root.querySelector(".ff-preview").textContent = d ? "Due " + (d.noTime ? App.fmtDay(d.toISOString()) + " · any time" : App.fmtWhen(d.toISOString())) : "Pick a date";
    }
    root.addEventListener("click", function (e) {
      var c = e.target.closest("[data-chip]"); if (!c) return;
      selectChip(c);
      if (c.dataset.chip === "fpick") {
        var custom = c.dataset.v === "c", di = root.querySelector(".ff-date");
        di.hidden = !custom; if (custom) { di.value = di.value || isoDate(plusDays(2)); di.min = isoDate(new Date()); di.focus(); }
      }
      preview();
    });
    root.addEventListener("input", preview);
    preview();
    return {
      value: function () {
        var err = root.querySelector(".ff-err"), d = dueDate();
        var bad = !d ? "Pick a date." : App.startOfDay(d) < App.startOfDay(new Date()) ? "The date can't be in the past." : "";
        err.hidden = !bad; err.textContent = bad;
        if (bad) return null;
        return { type: chipValue(root, "ftype"), dueDate: isoDate(d), dueTime: d.noTime ? null : ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2), note: root.querySelector(".ff-note").value.trim() || null };
      },
      reset: function () { mountForm(container, personId, opts); }
    };
  }

  function create(personId, v) {
    var p = person(personId);
    var f = { id: "f" + Date.now() + Math.floor(Math.random() * 1000), personId: personId, type: v.type, dueDate: v.dueDate, dueTime: v.dueTime,
      ownerUserId: p.ownerUserId, status: "Open", outcome: null, note: v.note, createdAt: new Date().toISOString() };
    D.followUps.push(f);
    return f;
  }

  // Decision #37: the system never marks a follow-up Done. When a lead is lost, converted or
  // transferred its open follow-ups become "Closed by system" and each owner gets a notification.
  function closeBySystem(personId, reason) {
    var p = person(personId), now = new Date().toISOString(), closed = openFollowUps(personId);
    closed.forEach(function (f) {
      f.status = "Closed by system"; f.closedAt = now; f.closeReason = reason;
      D.notifications.unshift({ id: "n" + Date.now() + f.id, text: f.type + " with " + p.name + " was closed by system · " + reason.toLowerCase(),
        at: now, unread: true, userId: f.ownerUserId });
    });
    return closed.length;
  }

  // ---------- Add follow-up modal ----------
  function openAdd(personId, opts) {
    opts = opts || {};
    var p = person(personId);
    if (!isOpenLead(p) && !(p && p.kind === "Client")) { App.toast("Re-open the lead first to add a follow-up", "error"); return; }
    var m = App.makeModal("fuAddModal");
    m.title.textContent = opts.title || "Add follow-up";
    m.body.innerHTML = '<p class="muted">' + esc(p.name) + " · " + esc(p.cc + " " + p.mobile) + "</p>" +
      (opts.intro ? '<div class="callout">' + esc(opts.intro) + "</div>" : "") + '<div data-ff></div>';
    var form = mountForm(m.body.querySelector("[data-ff]"), personId, { type: opts.type });
    m.foot.innerHTML = '<button class="btn" data-close>' + (opts.cancelText || "Cancel") + '</button><button class="btn btn-primary" data-save>Save follow-up</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var v = form.value(); if (!v) return;
      var f = create(personId, v);
      App.close(m.el);
      App.toast("Follow-up set for " + p.name + " · " + App.fmtDue(f), "success");
      App.dataChanged();
      if (opts.onDone) opts.onDone(f);
    };
    if (!m.el.classList.contains("open")) App.openModal("fuAddModal");
  }

  // ---------- Log outcome (outcome -> lost? -> next follow-up) ----------
  function openOutcome(fid) {
    var f = App.byId(D.followUps, fid); if (!f) return;
    var p = person(f.personId), st = App.followUpStatus(App.dueIso(f));
    var m = App.makeModal("fuOutcomeModal");
    m.title.textContent = "Log outcome";
    m.body.innerHTML =
      '<div class="fu-head"><span class="badge ' + st.badge + '">' + esc(st.text) + "</span> " +
        "<strong>" + esc(f.type) + "</strong> with " + esc(p.name) + ' <span class="muted">· due ' + esc(App.fmtDue(f)) + "</span>" +
        (f.note ? '<div class="cell-sub">' + esc(f.note) + "</div>" : "") + "</div>" +
      '<div class="field"><label>What happened? <span class="req">*</span></label>' + chips("outcome", L.outcomes, "") +
        '<span class="error" data-oerr hidden>Choose an outcome.</span></div>' +
      '<div class="field"><label for="fuONote">Note</label><textarea class="input" id="fuONote" rows="2" placeholder="Anything worth remembering? (optional)"></textarea></div>';
    m.body.onclick = function (e) { var c = e.target.closest("[data-chip]"); if (c) { selectChip(c); m.body.querySelector("[data-oerr]").hidden = true; } };
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Save outcome</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var outcome = chipValue(m.body, "outcome"), note = m.body.querySelector("#fuONote").value.trim();
      if (!outcome) { m.body.querySelector("[data-oerr]").hidden = false; return; }
      if (outcome === "Not interested" && isOpenLead(p)) askLost(m, f, p, note);
      else { finishDone(f, outcome, note); askNext(m, f, p); }
    };
    if (!m.el.classList.contains("open")) App.openModal("fuOutcomeModal");
  }
  function finishDone(f, outcome, note) {
    f.status = "Done"; f.outcome = outcome; f.doneAt = new Date().toISOString();
    if (note) f.note = f.note ? f.note + " · " + note : note;
    var p = person(f.personId); p.lastActivityAt = f.doneAt;
    App.dataChanged();
  }
  function askLost(m, f, p, note) {
    m.body.onclick = null;
    m.title.textContent = "Mark as Lost?";
    m.body.innerHTML = '<div class="callout callout-warn">' + App.icon("alert") + "<span><strong>" + esc(p.name) +
      "</strong> is not interested. Do you want to mark this lead as <strong>Lost</strong>?</span></div>" +
      '<p class="muted">If you keep it as a lead, you will set the next follow-up.</p>';
    m.foot.innerHTML = '<button class="btn" data-keep>No, keep as lead</button><button class="btn btn-danger" data-lost>Yes, mark as Lost</button>';
    m.foot.querySelector("[data-keep]").onclick = function () { finishDone(f, "Not interested", note); askNext(m, f, p); };
    m.foot.querySelector("[data-lost]").onclick = function () {
      lostForm(m, p, "Not interested", function () { finishDone(f, "Not interested", note); });
    };
  }
  function askNext(m, f, p) {
    App.toast("Outcome saved · " + f.outcome, "success");
    if (!isOpenLead(p)) { App.close(m.el); return; } // lost or converted: no next follow-up
    var other = openFollowUps(p.id)[0];
    m.body.onclick = null;
    m.title.textContent = "Next follow-up";
    if (other) {
      m.body.innerHTML = '<div class="callout">' + App.icon("check") + "<span>Next follow-up is already set: <strong>" + esc(other.type) +
        "</strong> · " + esc(App.fmtDue(other)) + "</span></div>";
      m.foot.innerHTML = '<button class="btn btn-primary" data-close>Done</button>';
      return;
    }
    m.body.innerHTML = '<div class="callout">' + esc(p.name) + " stays a lead, so set the next follow-up.</div><div data-ff></div>";
    var form = mountForm(m.body.querySelector("[data-ff]"), p.id, { type: f.type });
    m.foot.innerHTML = '<button class="btn btn-primary" data-save>Save next follow-up</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var v = form.value(); if (!v) return;
      var n = create(p.id, v); f.nextId = n.id;
      App.close(m.el);
      App.toast("Next follow-up · " + App.fmtDue(n), "success");
      App.dataChanged();
    };
  }

  // ---------- Cancel follow-up (never delete) ----------
  function cancel(fid) {
    var f = App.byId(D.followUps, fid), p = person(f.personId), m = App.makeModal("fuCancelModal");
    m.title.textContent = "Cancel follow-up?";
    m.body.innerHTML = "<p><strong>" + esc(f.type) + "</strong> with " + esc(p.name) + " · " + esc(App.fmtDue(f)) + "</p>" +
      '<div class="field"><label for="fuCReason">Reason</label><input class="input" id="fuCReason" placeholder="e.g. Duplicate, lead asked to call later (optional)"></div>' +
      '<p class="hint">Cancelled follow-ups stay in the timeline.' + (openFollowUps(p.id).length === 1 && isOpenLead(p) ? " This lead will have no follow-up set." : "") + "</p>";
    m.foot.innerHTML = '<button class="btn" data-close>Keep it</button><button class="btn btn-danger" data-save>Cancel follow-up</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      f.status = "Cancelled"; f.cancelledAt = new Date().toISOString(); f.cancelReason = m.body.querySelector("#fuCReason").value.trim() || null;
      App.close(m.el); App.toast("Follow-up cancelled", ""); App.dataChanged();
    };
    App.openModal("fuCancelModal");
  }

  // ---------- Lost / Re-open / Assign ----------
  function lostForm(m, p, preset, beforeSave) {
    m.title.textContent = "Mark " + p.name + " as Lost";
    m.body.innerHTML = '<div class="field"><label>Reason <span class="req">*</span></label>' + chips("lreason", L.lostReasons, preset || "") +
      '<span class="error" data-lerr hidden></span></div>' +
      '<div class="field" data-other hidden><label for="lostOther">Describe the reason <span class="req">*</span></label>' +
      '<input class="input" id="lostOther" placeholder="Required when the reason is Other"></div>' +
      '<p class="hint">Open follow-ups will be closed by system and their owners notified. You can re-open the lead later.</p>';
    m.body.onclick = function (e) {
      var c = e.target.closest("[data-chip]"); if (!c) return;
      selectChip(c); m.body.querySelector("[data-other]").hidden = c.dataset.v !== "Other";
      m.body.querySelector("[data-lerr]").hidden = true;
      if (c.dataset.v === "Other") m.body.querySelector("#lostOther").focus();
    };
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-danger" data-save>Mark as Lost</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var r = chipValue(m.body, "lreason"), other = m.body.querySelector("#lostOther").value.trim(), err = m.body.querySelector("[data-lerr]");
      if (!r) { err.textContent = "Choose a reason."; err.hidden = false; return; }
      if (r === "Other" && !other) { err.textContent = "Please describe the reason."; err.hidden = false; m.body.querySelector("#lostOther").classList.add("invalid"); return; }
      if (beforeSave) beforeSave();
      var reason = r === "Other" ? "Other: " + other : r;
      p.stageBeforeLost = p.stage; p.stage = "Lost"; p.lostReason = reason; p.lostAt = new Date().toISOString();
      closeBySystem(p.id, "Lead lost");
      App.addTimeline(p.id, "milestone", "Marked as Lost · " + reason);
      App.close(m.el); App.toast(p.name + " marked as Lost", ""); App.dataChanged();
    };
  }
  function markLost(personId) {
    var p = person(personId); if (!isOpenLead(p)) return;
    var m = App.makeModal("lostModal"); lostForm(m, p, "", null); App.openModal("lostModal");
  }
  function reopen(personId) {
    var p = person(personId); if (!p || p.stage !== "Lost") return;
    var m = App.makeModal("reopenModal");
    m.title.textContent = "Re-open " + p.name + "?";
    m.body.innerHTML = "<p>The lead goes back to <strong>" + esc(p.stageBeforeLost || "Contacted") + "</strong>. The old lost reason (" +
      esc(App.empty(p.lostReason)) + ") will be cleared.</p><p class=\"muted\">Next, you will set a follow-up so the lead is not forgotten.</p>";
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Re-open lead</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      p.stage = p.stageBeforeLost || "Contacted"; p.lostReason = null; p.lostAt = null; p.reopenedAt = new Date().toISOString();
      App.addTimeline(p.id, "milestone", "Re-opened by " + App.me().name);
      App.close(m.el); App.dataChanged();
      openAdd(p.id, { title: "Set next follow-up", intro: p.name + " is open again. Set the next follow-up.", cancelText: "Later" });
    };
    App.openModal("reopenModal");
  }
  function assign(personId) {
    var p = person(personId), m = App.makeModal("assignModal");
    var staff = D.users.filter(function (u) { return u.branches.indexOf(p.branchId) > -1 && ASSIGNABLE_ROLES.indexOf(u.role) > -1; });
    m.title.textContent = p.ownerUserId ? "Change owner" : "Assign owner";
    m.body.innerHTML = '<p class="muted">' + esc(p.name) + " · " + esc(App.branchName(p.branchId)) + "</p>" +
      '<div class="field"><label for="assignUser">Staff member <span class="req">*</span></label>' +
      '<select class="input" id="assignUser"><option value="">Choose…</option>' + staff.map(function (u) {
        return '<option value="' + u.id + '"' + (u.id === p.ownerUserId ? " selected" : "") + ">" + esc(u.name) + " · " + esc(u.role) + "</option>";
      }).join("") + '</select><span class="hint">Staff from this lead\'s branch. Open follow-ups move to the new owner.</span>' +
      '<span class="error" data-aerr hidden>Choose a staff member.</span></div>';
    App.enhanceSelect(m.body.querySelector("#assignUser"));
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>' + (p.ownerUserId ? "Save" : "Assign") + "</button>";
    m.foot.querySelector("[data-save]").onclick = function () {
      var uid = m.body.querySelector("#assignUser").value;
      if (!uid) { m.body.querySelector("[data-aerr]").hidden = false; return; }
      if (p.ownerUserId !== uid) p.ownerHistory.push({ from: p.ownerUserId || null, to: uid, at: new Date().toISOString(), by: App.me().id });
      p.ownerUserId = uid;
      openFollowUps(p.id).forEach(function (f) { f.ownerUserId = uid; });
      App.addTimeline(p.id, "milestone", "Owner set to " + App.userName(uid));
      App.close(m.el); App.toast(p.name + " assigned to " + App.userName(uid), "success"); App.dataChanged();
    };
    App.openModal("assignModal");
  }

  // Human sentence for a finished follow-up: "Priya called · Interested · next call Fri"
  function describeDone(f) {
    var who = App.firstName(App.byId(D.users, f.ownerUserId));
    var s = who + " " + (VERB[f.type] || "followed up") + " · " + f.outcome;
    var n = f.nextId && App.byId(D.followUps, f.nextId);
    if (n) s += " · next " + (NEXT_WORD[n.type] || "follow-up") + " " + App.fmtShortWhen(App.dueIso(n));
    return s;
  }

  App.Followup = { mountForm: mountForm, openAdd: openAdd, openOutcome: openOutcome, cancel: cancel, create: create,
    describeDone: describeDone, isOpenLead: isOpenLead, closeBySystem: closeBySystem, openFollowUps: openFollowUps };
  App.Lead = { markLost: markLost, reopen: reopen, assign: assign };
})();
