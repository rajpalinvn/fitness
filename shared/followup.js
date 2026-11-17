/* Shared follow-up + lead-status flows. ONE implementation used by the list,
   the profile drawer composer and the NEXT STEP box (decision #7).
     App.Followup.mountForm(container, personId) -> { value(), reset() }
     App.Followup.openAdd(personId, opts)        add follow-up modal
     App.Followup.openOutcome(followUpId)        log outcome -> (lost?) -> next follow-up
     App.Followup.cancel(followUpId)             cancel (never delete)
     App.Lead.markLost(personId, opts)           reason modal ("Other" needs text)
     App.Lead.reopen(personId)                   clears reason, timeline "Re-opened", asks next follow-up
     App.Lead.assign(personId)                   pick owner from the lead's branch -> App.Owner.change
     App.Lead.move(personId)                     move to another branch (#98)
     App.Lead.pickPerson(personId)               transferred in: new-branch CM picks the follow-up SE (#98)
     App.Lead.take(personId)                     "Take this lead" (#100)
     App.Owner.change(ids, newOwnerId, opts)     THE owner-change dialog (#99): single, bulk, client, re-open
     App.Owner.apply(ids, newOwnerId, choice, o) the same without UI (choice: move | close | keep)
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
        assignField(p) +
      "</div>";
    var root = container.querySelector(".ff");
    var asel = root.querySelector(".ff-assign"); if (asel) App.enhanceSelect(asel);
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
        var as = root.querySelector(".ff-assign");
        return { assignedToUserId: as ? as.value : (p && p.ownerUserId) || null, type: chipValue(root, "ftype"), dueDate: isoDate(d), dueTime: d.noTime ? null : ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2), note: root.querySelector(".ff-note").value.trim() || null };
      },
      reset: function () { mountForm(container, personId, opts); }
    };
  }

  // "Assigned to" (#97): only with the grid row leads.assignFollowUp (Own = leads I own, Branch, All). Default = owner.
  // Staff from ANY branch whose role works leads (leads.view not None).
  function followUpStaff() {
    return D.users.filter(function (u) {
      var r = !u.platform && App.Perm.roleByName(u.role); return r && App.Perm.get(r.short, "leads.view") !== "None";
    });
  }
  function canAssignFollowUp(p) { return !!p && !!p.ownerUserId && App.scopeAllows("leads.assignFollowUp", p, { strictOwn: true }); }
  function assignField(p) {
    if (!canAssignFollowUp(p)) return '<p class="hint">Assigned to ' + esc(p && p.ownerUserId ? App.userName(p.ownerUserId) + " (lead owner)" : "the lead owner (not set yet)") + ".</p>";
    return '<div class="field"><label for="ffAssign' + p.id + '">Assigned to</label><select class="input ff-assign" id="ffAssign' + p.id + '">' +
      followUpStaff().map(function (u) {
        return '<option value="' + u.id + '"' + (u.id === p.ownerUserId ? " selected" : "") + ">" + esc(u.name) + (u.id === p.ownerUserId ? " (lead owner)" : "") +
          " · " + esc(u.role) + " · " + esc(u.branchIds.map(App.branchName).join(", ")) + "</option>";
      }).join("") + '</select><span class="hint">Any branch. They see this lead while the follow-up is open; the owner stays the same.</span></div>';
  }
  function create(personId, v) {
    var p = person(personId), to = v.assignedToUserId || p.ownerUserId || null;
    var f = { id: "f" + Date.now() + Math.floor(Math.random() * 1000), personId: personId, type: v.type, dueDate: v.dueDate, dueTime: v.dueTime,
      ownerUserId: p.ownerUserId, assignedToUserId: to, status: "Open", outcome: null, note: v.note, createdAt: new Date().toISOString(),
      createdByUserId: (App.me() || {}).id || null };
    D.followUps.push(f);
    if (to && to !== p.ownerUserId) App.addTimeline(personId, "milestone", App.firstName(App.me()) + " set a follow-up for " + App.userName(to) + " · " + v.type);
    p.lastActivityAt = f.createdAt;
    return f;
  }

  // Decision #37: the system never marks a follow-up Done. When a lead is lost, converted or
  // transferred its open follow-ups become "Closed by system" and each owner gets a notification.
  function closeBySystem(personId, reason) {
    var p = person(personId), now = new Date().toISOString(), closed = openFollowUps(personId);
    closed.forEach(function (f) {
      f.status = "Closed by system"; f.closedAt = now; f.closeReason = reason;
      D.notifications.unshift({ id: "n" + Date.now() + f.id, text: f.type + " with " + p.name + " was closed by system · " + reason.toLowerCase(),
        at: now, unread: true, userId: App.fuAssignee(f) });
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
      f.status = "Cancelled"; f.cancelledAt = new Date().toISOString(); f.cancelledByUserId = App.me().id; f.cancelReason = m.body.querySelector("#fuCReason").value.trim() || null;
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
    // L24: back to the stage before Lost; Trial with no running trial -> Negotiation.
    var backTo = p.stageBeforeLost || "Contacted"; if (backTo === "Trial" && !App.Trial.anyRunning(p)) backTo = "Negotiation";
    m.body.innerHTML = "<p>The lead goes back to <strong>" + esc(backTo) + "</strong>. The old lost reason (" +
      esc(App.empty(p.lostReason)) + ") will be cleared.</p><p class=\"muted\">Next, you will set a follow-up so the lead is not forgotten.</p>";
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Re-open lead</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      p.stage = backTo; p.lostReason = null; p.lostAt = null; p.reopenedAt = new Date().toISOString();
      App.addTimeline(p.id, "milestone", "Re-opened by " + App.me().name);
      App.close(m.el); App.dataChanged();
      function askFollowUp() { openAdd(p.id, { title: "Set next follow-up", intro: p.name + " is open again. Set the next follow-up.", cancelText: "Later" }); }
      // L22 / #100: re-opening someone else's lost lead makes you the owner; the owner-change dialog shows only if anything is open.
      var me = App.me();
      if (me && p.ownerUserId !== me.id) Owner.change([p.id], me.id, { reason: "reopen", silentIfNone: true, onDone: askFollowUp });
      else askFollowUp();
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
      }).join("") + '</select><span class="hint">Staff from this lead\'s branch. Next you choose what happens to the old owner\'s open follow-ups and tasks.</span>' +
      '<span class="error" data-aerr hidden>Choose a staff member.</span></div>';
    App.enhanceSelect(m.body.querySelector("#assignUser"));
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>' + (p.ownerUserId ? "Save" : "Assign") + "</button>";
    m.foot.querySelector("[data-save]").onclick = function () {
      var uid = m.body.querySelector("#assignUser").value;
      if (!uid) { m.body.querySelector("[data-aerr]").hidden = false; return; }
      if (uid === p.ownerUserId) { App.close(m.el); return; }
      App.close(m.el);
      Owner.change([p.id], uid, { noConfirm: true });
    };
    App.openModal("assignModal");
  }
  // Bulk assign (#99): one staff for all selected leads, then the same owner-change dialog (one choice for all).
  function assignMany(ids) {
    var people = ids.map(person).filter(Boolean), m = App.makeModal("assignManyModal"), branches = {};
    people.forEach(function (p) { branches[p.branchId] = true; });
    var staff = D.users.filter(function (u) { return ASSIGNABLE_ROLES.indexOf(u.role) > -1 && u.branches.some(function (b) { return branches[b]; }); });
    m.title.textContent = "Change owner of " + people.length + (people.length === 1 ? " lead" : " leads");
    m.body.innerHTML = '<p class="muted">' + esc(people.map(function (p) { return p.name; }).join(", ")) + "</p>" +
      '<div class="field"><label for="assignManyUser">New owner <span class="req">*</span></label>' +
      '<select class="input" id="assignManyUser"><option value="">Choose…</option>' + staff.map(function (u) {
        return '<option value="' + u.id + '">' + esc(u.name) + " · " + esc(u.role) + " · " + esc(App.branchName(u.branchIds[0])) + "</option>";
      }).join("") + '</select><span class="hint">Staff from the branches of the selected leads. The lead\'s branch does not change.</span>' +
      '<span class="error" data-aerr hidden>Choose a staff member.</span></div>';
    App.enhanceSelect(m.body.querySelector("#assignManyUser"));
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Next</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var uid = m.body.querySelector("#assignManyUser").value;
      if (!uid) { m.body.querySelector("[data-aerr]").hidden = false; return; }
      App.close(m.el); Owner.change(ids, uid, {});
    };
    App.openModal("assignManyModal");
  }

  // ---------- Owner change (#99, notes L16–L17) ----------
  // Acts ONLY on open follow-ups / tasks assigned to the OLD owner. Follow-ups assigned to other staff stay with them
  // and are not counted. History, notes, timeline and trial approvals never move.
  var Owner = {};
  Owner.itemsOf = function (p) {
    var old = p.ownerUserId; if (!old) return { fus: [], tasks: [] };
    return {
      fus: D.followUps.filter(function (f) { return f.personId === p.id && f.status === "Open" && App.fuAssignee(f) === old; }),
      tasks: D.workTasks.filter(function (t) { return t.personId === p.id && t.status === "Open" && t.assignedUserId === old; })
    };
  };
  Owner.count = function (ids) {
    return ids.reduce(function (n, id) { var p = person(id); if (!p) return n; var it = Owner.itemsOf(p); return n + it.fus.length + it.tasks.length; }, 0);
  };
  // Earliest open due date (follow-ups dueDate, tasks dueAt) among the old owner's items, "YYYY-MM-DD".
  // Q32 (#103): if that date is already past, the new follow-up is due TODAY (bulk too).
  Owner.earliestDue = function (p) {
    var it = Owner.itemsOf(p), d = null;
    it.fus.forEach(function (f) { if (!d || f.dueDate < d) d = f.dueDate; });
    it.tasks.forEach(function (t) { var x = isoDate(t.dueAt); if (!d || x < d) d = x; });
    return d && d < App.todayIso() ? App.todayIso() : d;
  };
  // choice: "move" (default) | "close" (closed by system + ONE new follow-up for the new owner) | "keep" (old owner keeps them).
  Owner.apply = function (ids, newOwnerId, choice, o) {
    o = o || {}; choice = choice || "move";
    var me = App.me(), now = new Date().toISOString(), done = [];
    ids.forEach(function (id) {
      var p = person(id); if (!p || p.ownerUserId === newOwnerId) return;
      var old = p.ownerUserId, it = Owner.itemsOf(p), n = it.fus.length + it.tasks.length, earliest = Owner.earliestDue(p);
      if (choice === "move") {
        it.fus.forEach(function (f) { f.assignedToUserId = newOwnerId; f.ownerUserId = newOwnerId; });
        it.tasks.forEach(function (t) { t.assignedUserId = newOwnerId; });
      } else if (choice === "close") {
        it.fus.forEach(function (f) { f.status = "Closed by system"; f.closedAt = now; f.closeReason = "Owner changed"; });
        it.tasks.forEach(function (t) { t.status = "Closed by system"; t.closedAt = now; t.closeReason = "Owner changed"; });
      }
      p.ownerHistory = p.ownerHistory || [];
      p.ownerHistory.push({ from: old || null, to: newOwnerId, at: now, by: me ? me.id : null, how: o.reason === "reopen" ? "Re-opened" : o.reason === "take" ? "Taken" : "Changed" });
      p.ownerUserId = newOwnerId; p.unassignedReason = null; p.releaseWarnedAt = null;
      if (choice === "close" && n) {
        var due = (ids.length === 1 && o.due) || earliest || App.todayIso();
        D.followUps.push({ id: "f" + Date.now() + Math.floor(Math.random() * 100000), personId: p.id, type: "Call", dueDate: due, dueTime: null, ownerUserId: newOwnerId,
          assignedToUserId: newOwnerId, status: "Open", outcome: null, note: "Owner changed · pick up from " + App.firstName(App.byId(D.users, old)), createdAt: now, bySystem: true });
      }
      var what = { move: n + " open item" + (n === 1 ? "" : "s") + " moved", close: n + " closed · 1 new follow-up", keep: n + " kept with " + App.firstName(App.byId(D.users, old)) }[choice];
      App.addTimeline(p.id, "milestone", (old ? "Owner changed from " + App.firstName(App.byId(D.users, old)) + " to " + App.firstName(App.byId(D.users, newOwnerId)) : "Owner set to " + App.firstName(App.byId(D.users, newOwnerId))) +
        " by " + App.firstName(me) + (n ? " · " + what : ""));
      done.push(p.id);
    });
    App.dataChanged();
    return done;
  };
  Owner.change = function (ids, newOwnerId, opts) {
    opts = opts || {};
    ids = ids.filter(function (id) { var p = person(id); return p && p.ownerUserId !== newOwnerId; });
    if (!ids.length) { if (opts.onDone) opts.onDone(); return; }
    var n = Owner.count(ids), many = ids.length > 1, nu = App.userName(newOwnerId);
    function finish(choice, due) {
      Owner.apply(ids, newOwnerId, choice, { due: due, reason: opts.reason });
      App.toast((many ? ids.length + " leads" : person(ids[0]).name) + " · owner " + nu, "success");
      if (opts.onDone) opts.onDone();
    }
    var allUnassigned = ids.every(function (id) { return !person(id).ownerUserId; });
    if (!n && (opts.silentIfNone || allUnassigned)) { finish("move"); return; }   // nothing to hand over from an unassigned lead
    var m = App.makeModal("ownerModal"), p0 = person(ids[0]);
    m.title.textContent = opts.reason === "reopen" ? "You are the new owner" : "Change owner";
    var head = '<p>' + (many ? "<strong>" + ids.length + " leads</strong>" : "<strong>" + esc(p0.name) + "</strong>" + (p0.ownerUserId ? " · now " + esc(App.userName(p0.ownerUserId)) : " · Unassigned")) +
      " → <strong>" + esc(nu) + "</strong></p>";
    if (!n) {
      m.body.innerHTML = head + '<p class="muted">No open follow-ups or tasks to hand over. History, notes and the timeline stay as they are.</p>';
      m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Change owner</button>';
      m.foot.querySelector("[data-save]").onclick = function () { App.close(m.el); finish("move"); };
      App.openModal("ownerModal"); return;
    }
    var earliest = many ? null : Owner.earliestDue(p0), oldName = many ? "the old owner" : App.firstName(App.byId(D.users, p0.ownerUserId));
    function opt(v, title, sub, checked) {
      return '<label class="radio-card"><input type="radio" name="ownerChoice" value="' + v + '"' + (checked ? " checked" : "") + '><span><strong>' + esc(title) + '</strong><span class="cell-sub">' + esc(sub) + "</span></span></label>";
    }
    m.body.innerHTML = head +
      '<div class="field"><label>Open follow-ups and tasks (' + n + ") <span class=\"req\">*</span></label>" +
        '<div class="radio-list" role="radiogroup">' +
          opt("move", "Move to the new owner", "They become " + App.firstName(App.byId(D.users, newOwnerId)) + "'s, with the same dates.", true) +
          opt("close", "Close them and create one new follow-up", "Closed by system · Owner changed. One new follow-up for " + App.firstName(App.byId(D.users, newOwnerId)) + (many ? " per lead (due = that lead's earliest open due date, or today if it has passed)." : "."), false) +
          opt("keep", "Keep with the old owner", oldName + " keeps them and still sees the lead while they stay open.", false) +
        "</div>" +
        (many ? '<span class="hint">One choice applies to all ' + ids.length + " leads.</span>" : "") +
      "</div>" +
      (many ? "" : '<div class="field" data-due hidden><label for="ownerDue">New follow-up due</label><input class="input" type="date" id="ownerDue" value="' + esc(earliest || App.todayIso()) + '"><span class="hint">Earliest open due date (today if that date has passed). You can change it.</span></div>') +
      '<p class="hint">Only items assigned to the old owner are counted. Follow-ups other staff hold stay with them. History, notes, timeline and trial approvals never move.</p>';
    m.body.onchange = function () { var d = m.body.querySelector("[data-due]"); if (d) d.hidden = m.body.querySelector('input[name="ownerChoice"]:checked').value !== "close"; };
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Change owner</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var c = m.body.querySelector('input[name="ownerChoice"]:checked').value, d = m.body.querySelector("#ownerDue");
      App.close(m.el); finish(c, d ? d.value : null);
    };
    App.openModal("ownerModal");
  };

  // ---------- Move to another branch (#98, notes L12–L15) ----------
  function sesOf(branchId) { return D.users.filter(function (u) { return u.role === "Sales Executive" && u.branchIds.indexOf(branchId) > -1; }); }
  function canMove(p) { return isOpenLead(p) && App.scopeAllows("leads.move", p); }
  function canPickOnMove(p) { return !!p.ownerUserId && App.scopeAllows("leads.movePickPerson", p); }
  function seField(id, branchId) {
    var list = sesOf(branchId);
    return '<select class="input" id="' + id + '"><option value="">Choose…</option>' + list.map(function (u) { return '<option value="' + u.id + '">' + esc(u.name) + "</option>"; }).join("") + "</select>";
  }
  function move(personId) {
    var p = person(personId); if (!canMove(p)) return;
    var m = App.makeModal("moveModal"), others = D.branches.filter(function (b) { return b.id !== p.branchId; }), pick = canPickOnMove(p);
    m.title.textContent = "Move to another branch";
    m.body.innerHTML = '<p class="muted">' + esc(p.name) + " · now " + esc(App.branchName(p.branchId)) + (p.ownerUserId ? " · owner " + esc(App.userName(p.ownerUserId)) : " · Unassigned") + "</p>" +
      '<div class="field"><label for="moveBranch">New branch <span class="req">*</span></label><select class="input" id="moveBranch"><option value="">Choose…</option>' +
        others.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="moveRemark">Remark <span class="req">*</span></label><textarea class="input" id="moveRemark" rows="2" placeholder="Why is the lead moving? e.g. lives near Golf Course now"></textarea></div>' +
      (pick ? '<div data-pick hidden><div class="field"><label for="movePerson">Follow-up person <span class="req">*</span></label><span data-pick-sel></span><span class="hint">A Sales Executive of the new branch. They get a follow-up now.</span></div>' +
        '<div class="field"><label for="moveDue">Follow-up due <span class="req">*</span></label><input class="input" type="date" id="moveDue" value="' + isoDate(plusDays(1)) + '" min="' + isoDate(new Date()) + '"></div></div>' : "") +
      '<p class="hint">' + (p.ownerUserId ? "The owner stays " + esc(App.firstName(App.byId(D.users, p.ownerUserId))) + " and keeps their open follow-ups." +
        (pick ? "" : " The new branch's Club Manager picks the follow-up person (\"Transferred in\").") : "The lead stays Unassigned; only the branch changes.") + "</p>" +
      '<span class="error" data-merr hidden></span>';
    var bsel = m.body.querySelector("#moveBranch"); App.enhanceSelect(bsel);
    bsel.onchange = function () {
      var box = m.body.querySelector("[data-pick]"); if (!box) return;
      box.hidden = !bsel.value; box.querySelector("[data-pick-sel]").innerHTML = bsel.value ? seField("movePerson", bsel.value) : "";
      var s2 = box.querySelector("#movePerson"); if (s2) App.enhanceSelect(s2);
    };
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Move lead</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var to = bsel.value, remark = m.body.querySelector("#moveRemark").value.trim(), err = m.body.querySelector("[data-merr]");
      var ps = m.body.querySelector("#movePerson"), due = m.body.querySelector("#moveDue");
      var bad = !to ? "Choose the new branch." : !remark ? "Add a remark: why is the lead moving?" : (pick && ps && !ps.value) ? "Choose the follow-up person." : (pick && due && !due.value) ? "Pick the follow-up date." : "";
      m.body.querySelector("#moveRemark").classList.toggle("invalid", !!to && !remark);
      if (bad) { err.textContent = bad; err.hidden = false; return; }
      Lead.applyMove(p.id, to, remark, pick && ps ? { seId: ps.value, due: due.value } : null);
      App.close(m.el); App.toast(p.name + " moved to " + App.branchName(to), "success");
    };
    App.openModal("moveModal");
  }
  // No UI: move + (optional) follow-up person. Without one, an owned lead is flagged transferredIn for the new branch's CM.
  function applyMove(personId, toBranchId, remark, pickOpt) {
    var p = person(personId), from = p.branchId, me = App.me();
    p.branchId = toBranchId;
    App.addTimeline(p.id, "milestone", "Moved " + App.branchName(from) + " → " + App.branchName(toBranchId) + " by " + App.firstName(me) + " · " + remark);
    if (!p.ownerUserId) { p.transferredIn = null; App.dataChanged(); return; }       // unassigned stays unassigned, only the branch changes
    if (pickOpt && pickOpt.seId) { p.transferredIn = null; givePerson(p, pickOpt.seId, pickOpt.due); }
    else p.transferredIn = { from: from, by: me ? me.id : null, at: new Date().toISOString() };
    App.dataChanged();
  }
  function givePerson(p, seId, due) {
    D.followUps.push({ id: "f" + Date.now() + Math.floor(Math.random() * 1000), personId: p.id, type: "Call", dueDate: due || isoDate(plusDays(1)), dueTime: null,
      ownerUserId: p.ownerUserId, assignedToUserId: seId, status: "Open", outcome: null, note: "Transferred in · first call from " + App.branchName(p.branchId), createdAt: new Date().toISOString() });
    App.addTimeline(p.id, "milestone", "Follow-up person: " + App.firstName(App.byId(D.users, seId)) + " (" + App.branchName(p.branchId) + ") · picked by " + App.firstName(App.me()));
  }
  // Transferred in (#98, L13): picking needs leads.assign at Branch or higher on the lead (new branch).
  function canPick(p) { var s = App.can("leads.assign"); return !!p && !!p.transferredIn && (s === "Branch" || s === "All") && App.scopeAllows("leads.assign", p, { strictOwn: true }); }
  function pickPerson(personId) {
    var p = person(personId); if (!canPick(p)) return;
    var m = App.makeModal("pickModal"), t = p.transferredIn;
    m.title.textContent = "Pick the follow-up person";
    m.body.innerHTML = '<p class="muted">' + esc(p.name) + " · moved from " + esc(App.branchName(t.from)) + " by " + esc(App.firstName(App.byId(D.users, t.by))) + " · owner stays " + esc(App.userName(p.ownerUserId)) + "</p>" +
      '<div class="field"><label for="pickSe">Sales Executive (' + esc(App.branchName(p.branchId)) + ') <span class="req">*</span></label>' + seField("pickSe", p.branchId) + "</div>" +
      '<div class="field"><label for="pickDue">Follow-up due <span class="req">*</span></label><input class="input" type="date" id="pickDue" value="' + isoDate(plusDays(1)) + '" min="' + isoDate(new Date()) + '"></div>' +
      '<span class="error" data-perr hidden></span>';
    App.enhanceSelect(m.body.querySelector("#pickSe"));
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Give follow-up</button>';
    m.foot.querySelector("[data-save]").onclick = function () {
      var se = m.body.querySelector("#pickSe").value, due = m.body.querySelector("#pickDue").value, err = m.body.querySelector("[data-perr]");
      if (!se || !due) { err.textContent = !se ? "Choose a Sales Executive." : "Pick the follow-up date."; err.hidden = false; return; }
      p.transferredIn = null; givePerson(p, se, due);
      App.close(m.el); App.toast(App.userName(se) + " will follow up " + p.name, "success"); App.dataChanged();
    };
    App.openModal("pickModal");
  }
  // Take this lead (#100, L21): unassigned only, grid row leads.take; branch does not change.
  function canTake(p) { return !!p && p.kind === "Lead" && !p.ownerUserId && p.stage !== "Lost" && App.scopeAllows("leads.take", p); }
  function take(personId) {
    var p = person(personId), me = App.me(); if (!canTake(p) || !me) return;
    p.ownerHistory = p.ownerHistory || []; p.ownerHistory.push({ from: null, to: me.id, at: new Date().toISOString(), by: me.id, how: "Taken" });
    p.ownerUserId = me.id; p.unassignedReason = null;
    App.addTimeline(p.id, "milestone", "Taken by " + App.firstName(me));
    App.toast("You own " + p.name + " now", "success"); App.dataChanged();
  }

  // Human sentence for a finished follow-up: "Priya called · Interested · next call Fri"
  function describeDone(f) {
    var who = App.firstName(App.byId(D.users, App.fuAssignee(f)));
    var s = who + " " + (VERB[f.type] || "followed up") + " · " + f.outcome;
    var n = f.nextId && App.byId(D.followUps, f.nextId);
    if (n) s += " · next " + (NEXT_WORD[n.type] || "follow-up") + " " + App.fmtShortWhen(App.dueIso(n));
    return s;
  }

  App.Followup = { mountForm: mountForm, openAdd: openAdd, openOutcome: openOutcome, cancel: cancel, create: create,
    describeDone: describeDone, isOpenLead: isOpenLead, closeBySystem: closeBySystem, openFollowUps: openFollowUps };
  var Lead = { markLost: markLost, reopen: reopen, assign: assign, assignMany: assignMany, move: move, applyMove: applyMove, pickPerson: pickPerson, take: take,
    canMove: canMove, canPick: canPick, canTake: canTake, canAssignFollowUp: canAssignFollowUp };
  App.Lead = Lead; App.Owner = Owner;
})();
