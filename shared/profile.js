/* Profile drawer — one profile per person (Lead or Client).
     App.openProfile(personId, { list: [ids], state: "loading" | "error" })
   Left: identity, badges, quick actions, NEXT STEP, owner/source, Convert / Re-open.
   Right: tabs Timeline · Tasks · Details · Docs (+ Membership for clients).
   Load after followup.js. */
(function () {
  var D = window.DUMMY, L = D.lists, esc = App.esc, icon = App.icon;
  var S = { id: null, list: [], tab: "timeline", filter: "all", mode: "note", editing: false, state: "normal" };
  var drawer, form = null;

  function P() { return App.byId(D.people, S.id); }
  function isClient(p) { return p.kind === "Client"; }
  function isLost(p) { return p.stage === "Lost"; }

  // ---------- skeleton ----------
  function build() {
    drawer = document.createElement("aside");
    drawer.className = "drawer profile-drawer"; drawer.id = "profileDrawer";
    drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-modal", "true"); drawer.setAttribute("aria-labelledby", "pdTitle");
    drawer.innerHTML =
      '<div class="drawer-head">' +
        '<div class="pd-head-title"><span class="pd-kind" id="pdTitle"></span><span class="muted pd-pos"></span></div>' +
        '<div class="pd-head-actions">' +
          '<button class="btn btn-ghost icon-btn" data-pd="prev" aria-label="Previous person" title="Previous">' + icon("chevron-left") + "</button>" +
          '<button class="btn btn-ghost icon-btn" data-pd="next" aria-label="Next person" title="Next">' + icon("chevron-right") + "</button>" +
          '<button class="btn btn-ghost icon-btn" data-close aria-label="Close profile">' + icon("x") + "</button>" +
        "</div></div>" +
      '<div class="pd-body"></div>';
    document.body.appendChild(drawer);
    drawer.addEventListener("click", onClick);
    drawer.addEventListener("change", onChange);
    drawer.onCloseHook = function () { setHash(null); };
  }

  // ---------- open ----------
  App.openProfile = function (id, opts) {
    opts = opts || {};
    if (!drawer) build();
    if (opts.list) S.list = opts.list;
    if (S.list.indexOf(id) < 0) S.list = [id];
    if (S.id !== id) { S.tab = "timeline"; S.filter = "all"; S.mode = "note"; S.editing = false; }
    S.id = id; S.state = opts.state || "loading";
    if (opts.tab) S.tab = opts.tab;
    render();
    if (!drawer.classList.contains("open")) App.openDrawer("profileDrawer");
    setHash(P());
    if (S.state === "loading") setTimeout(function () { if (S.state === "loading") { S.state = "normal"; render(); } }, 300);
  };
  App.closeProfile = function () { if (drawer) App.close(drawer); };

  // ---------- Linkable profiles: #lead-aarav / #client-vivaan (decision #33) ----------
  function slug(p) {
    var first = p.name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    var clash = D.people.filter(function (o) { return o.name.split(" ")[0].toLowerCase() === p.name.split(" ")[0].toLowerCase(); }).length > 1;
    return (p.kind === "Client" ? "client-" : "lead-") + first + (clash ? "-" + p.id : "");
  }
  App.profileSlug = slug;
  function fromHash() {
    var h = decodeURIComponent(location.hash.replace(/^#/, "")).toLowerCase(); if (!h) return null;
    // match even if the person changed type since the link was made (lead-x -> client-x)
    var bare = h.replace(/^(lead|client)-/, "");
    return D.people.filter(function (p) { return slug(p) === h || slug(p).replace(/^(lead|client)-/, "") === bare; })[0] || null;
  }
  function setHash(p) {
    try { history.replaceState(null, "", p ? "#" + slug(p) : location.pathname + location.search); } catch (e) {}
  }
  function openFromHash() {
    var p = fromHash();
    if (p) { if (App.openLead) App.openLead(p.id); else App.openProfile(p.id); }
    else if (drawer && drawer.classList.contains("open") && !location.hash) App.close(drawer);
  }
  window.addEventListener("hashchange", openFromHash);
  document.addEventListener("DOMContentLoaded", function () { setTimeout(openFromHash, 0); });

  function render() {
    var p = P(), body = drawer.querySelector(".pd-body");
    var i = S.list.indexOf(S.id);
    drawer.querySelector("#pdTitle").textContent = p ? (isClient(p) ? "Client profile" : "Lead profile") : "Profile";
    drawer.querySelector(".pd-pos").textContent = S.list.length > 1 ? (i + 1) + " of " + S.list.length : "";
    drawer.querySelector('[data-pd="prev"]').disabled = i <= 0;
    drawer.querySelector('[data-pd="next"]').disabled = i < 0 || i >= S.list.length - 1;
    if (S.state === "loading") {
      body.innerHTML = '<div class="pd-grid"><div class="pd-left">' + skel(8) + '</div><div class="pd-right"><div class="pd-scroll">' + skel(10) + "</div></div></div>";
      return;
    }
    if (S.state === "error" || !p) {
      body.innerHTML = '<div class="state"><h3>Couldn\'t load this profile</h3><p>Please check your connection and try again.</p>' +
        '<button class="btn btn-primary" data-pd="retry">Retry</button></div>';
      return;
    }
    body.innerHTML = '<div class="pd-grid"><div class="pd-left">' + left(p) + '</div><div class="pd-right">' + right(p) + "</div></div>";
    App.fillIcons(body);
    if (S.tab === "timeline") mountComposer(p);
    body.querySelectorAll("select").forEach(function (s) { App.enhanceSelect(s); });
  }
  function skel(n) { var h = ""; for (var k = 0; k < n; k++) h += '<div class="skeleton"></div>'; return h; }

  // ---------- LEFT column ----------
  function left(p) {
    var lost = isLost(p), client = isClient(p), owner = p.ownerUserId ? App.userName(p.ownerUserId) : null;
    var stageCls = lost ? "badge-danger" : p.stage === "Trial" ? "badge-info" : client ? "badge-success" : "";
    return (
      '<div class="pd-id"><span class="avatar avatar-xl">' + esc(App.initials(p.name)) + "</span>" +
        '<h2 class="pd-name">' + esc(p.name) + "</h2>" +
        '<div class="pd-mobile">' + esc(p.cc + " " + p.mobile) +
          '<button class="btn btn-ghost icon-btn btn-xs" data-pd="copy" aria-label="Copy mobile number" title="Copy">' + icon("copy", "ico-sm") + "</button></div>" +
        '<div class="cell-sub">' + esc(App.branchName(p.branchId)) + " · " + (client ? "Client since " + esc(App.fmtDate(p.joinedAt)) : "Created " + esc(App.fmtDay(p.createdAt))) + "</div></div>" +
      '<div class="stack pd-badges">' +
        (client
          // Decision #31: clients show Client + membership status, not stage / temperature
          ? '<span class="badge badge-success">Client</span>' + memberBadge(p)
          : '<span class="badge badge-info">Lead</span><span class="badge ' + stageCls + '">' + esc(p.stage) + "</span>" +
            '<span class="badge badge-' + p.temperature.toLowerCase() + '">' + esc(p.temperature) + "</span>") +
        (p.synced ? '<span class="badge badge-info" title="Synced from Meta">Meta</span>' : '<span class="badge">' + esc(p.source) + "</span>") +
        (p.reopenedAt ? '<span class="badge badge-info">Re-opened</span>' : "") +
      "</div>" +
      '<div class="pd-actions">' +
        qa("call", "phone", "Call", false) + qa("wa", "message", "WhatsApp", false) +
        qa("email", "mail", "Email", !p.email, "No email yet") +
        qa("follow", "plus", "Follow-up", lost, "Re-open the lead first") +
      "</div>" +
      nextStep(p) +
      '<dl class="kv pd-kv">' +
        "<dt>Owner</dt><dd>" + (owner ? esc(owner) + ' <button class="link-btn" data-pd="assign">Change</button>'
          : '<span class="badge badge-warning">Unassigned</span> <button class="btn btn-sm" data-pd="assign">Assign</button>') + "</dd>" +
        "<dt>Source</dt><dd>" + esc(p.source) + (p.synced ? " · synced" : "") + "</dd>" +
        (p.campaign ? "<dt>Campaign</dt><dd>" + esc(p.campaign) + "</dd>" : "") +
        (p.externalId ? "<dt>External ID</dt><dd>" + esc(p.externalId) + "</dd>" : "") +
        "<dt>Last activity</dt><dd>" + esc(App.fmtShortWhen(p.lastActivityAt)) + "</dd>" +
      "</dl>" +
      '<div class="pd-bottom">' + bottomActions(p) + "</div>"
    );
  }
  function memberBadge(p) {
    var ms = App.membershipStatus(p.membership); if (!ms) return "";
    var label = ms.cls === "red" ? "Expired" : ms.cls === "amber" ? "Renewal due" : "Active";
    return '<span class="badge ' + ms.badge + '">' + label + "</span>";
  }
  function qa(act, ic, label, disabled, why) {
    return '<button class="btn qa" data-pd="' + act + '"' + (disabled ? ' disabled title="' + esc(why) + '" aria-label="' + label + " (" + esc(why) + ')"' : ' title="' + label + '"') + ">" +
      icon(ic) + '<span class="qa-label">' + label + "</span></button>";
  }
  function bottomActions(p) {
    if (isClient(p)) return "";
    if (isLost(p)) return '<button class="btn btn-primary btn-block" data-pd="reopen">' + icon("refresh") + "Re-open lead</button>";
    return '<button class="btn btn-primary btn-block" data-pd="convert">Convert to Client</button>' +
      '<div class="dd"><button class="btn btn-block" data-dd="pdmore" aria-haspopup="menu" aria-expanded="false">' + icon("more") + "More</button>" +
      '<div class="dd-menu dd-up" data-dd-menu="pdmore" role="menu" hidden>' +
        '<button class="dd-item" role="menuitem" tabindex="-1" data-pd="lost"><span class="dd-check">' + icon("flag") + "</span><span>Mark as lost</span></button>" +
        '<button class="dd-item" role="menuitem" tabindex="-1" data-pd="assign"><span class="dd-check">' + icon("user") + "</span><span>" + (p.ownerUserId ? "Change owner" : "Assign owner") + "</span></button>" +
      "</div></div>";
  }

  // NEXT STEP box (decision #24 + #27)
  function nextStep(p) {
    var f = App.nextFollowUp(p.id), out = "";
    if (isLost(p)) {
      return '<div class="next-step grey"><div class="ns-label">Next step</div><strong>Lost</strong> · ' + esc(App.empty(p.lostReason)) +
        '<div class="cell-sub">Re-open the lead to follow up again.</div></div>';
    }
    if (isClient(p)) {
      var ms = App.membershipStatus(p.membership);
      if (ms) {
        var txt = ms.cls === "red" ? "<strong>Membership expired</strong> on " + esc(App.fmtDate(p.membership.end))
          : ms.cls === "amber" ? "<strong>Renewal due soon</strong> · " + ms.left + (ms.left === 1 ? " day" : " days") + " left"
          : "<strong>Membership active</strong> · " + ms.left + " days left";
        out = '<div class="next-step ' + ms.cls + '"><div class="ns-label">Next step</div>' + txt +
          '<div class="cell-sub">' + esc(p.membership.package) + " · ends " + esc(App.fmtDate(p.membership.end)) + "</div>" + pendingItems(p) +
          (f ? '<div class="ns-sub">Follow-up: ' + esc(f.type) + " · " + esc(App.fmtDue(f)) + "</div>" +
            '<div class="ns-actions"><button class="btn btn-sm" data-pd="outcome" data-f="' + f.id + '">Log outcome</button></div>' : "") + "</div>";
      }
      return out;
    }
    var st = App.followUpStatus(f && App.dueIso(f)), body;
    if (!f) body = "<strong>No follow-up set</strong><div class=\"cell-sub\">Add one so this lead isn't forgotten.</div>" +
      '<div class="ns-actions"><button class="btn btn-sm btn-primary" data-pd="follow">' + icon("plus") + "Add follow-up</button></div>";
    else {
      var head = st.cls === "red" ? "Overdue since " + App.fmtDay(App.dueIso(f)) : st.cls === "amber" ? "Due today · " + App.dueTimeText(f) : "Next: " + App.fmtDue(f);
      body = "<strong>" + esc(head) + "</strong>" +
        '<div class="cell-sub">' + esc(f.type) + (f.note ? " · " + esc(f.note) : "") + " · " + esc(App.userName(f.ownerUserId)) + "</div>" +
        '<div class="ns-actions"><button class="btn btn-sm btn-primary" data-pd="outcome" data-f="' + f.id + '">Log outcome</button></div>';
    }
    return '<div class="next-step ' + st.cls + '" role="status"><div class="ns-label">Next step</div>' + body + "</div>";
  }

  // Decision #38: Paid membership needs FF ID and key fob; each shows as its own pending item until filled.
  function pendingList(p) {
    var out = [];
    if (!p.membership || p.membership.saleType !== "Paid") return out;
    if (!p.ffId) out.push({ k: "addFf", t: "FF ID pending", a: "Add FF ID" });
    if (!p.keyFob) out.push({ k: "goFob", t: "Key fob pending", a: "Assign fob" });
    return out;
  }
  function pendingItems(p) {
    return pendingList(p).map(function (x) {
      return '<div class="ns-pending"><span class="badge badge-warning">' + esc(x.t) + '</span> <button class="link-btn" data-pd="' + x.k + '">' + esc(x.a) + "</button></div>";
    }).join("");
  }
  App.profilePending = pendingList;

  // ---------- RIGHT: tabs ----------
  function tabsFor(p) {
    var t = [{ k: "timeline", t: "Timeline" }, { k: "tasks", t: "Tasks", n: tasksOf(p).filter(function (x) { return x.status === "Open"; }).length },
      { k: "details", t: "Details" }, { k: "docs", t: "Docs", n: docsOf(p).length }];
    if (isClient(p)) t.push({ k: "membership", t: "Membership" });
    return t;
  }
  function right(p) {
    var tabs = tabsFor(p);
    if (!tabs.some(function (t) { return t.k === S.tab; })) S.tab = "timeline";
    var html = '<div class="tabs pd-tabs" role="tablist">' + tabs.map(function (t) {
      return '<button class="tab' + (t.k === S.tab ? " active" : "") + '" role="tab" aria-selected="' + (t.k === S.tab) + '" data-tab-k="' + t.k + '">' +
        t.t + (t.n ? ' <span class="tab-count">' + t.n + "</span>" : "") + "</button>";
    }).join("") + "</div>";
    var panel = { timeline: timelinePanel, tasks: tasksPanel, details: detailsPanel, docs: docsPanel, membership: membershipPanel }[S.tab](p);
    return html + '<div class="pd-scroll" role="tabpanel">' + panel + "</div>" + (S.tab === "timeline" ? '<div class="composer" data-composer></div>' : "");
  }

  // ---------- Timeline ----------
  var KIND = { followup: { ic: "phone", f: "followups" }, cancelled: { ic: "x-circle", f: "followups" }, note: { ic: "note", f: "notes" },
    whatsapp: { ic: "message", f: "whatsapp" }, milestone: { ic: "flag", f: "milestones" }, call: { ic: "phone", f: "followups" } };
  function events(p) {
    var ev = [];
    if (!p.synced) ev.push({ at: p.createdAt, kind: "milestone", text: "Lead created by " + (p.createdByUserId ? App.userName(p.createdByUserId) : "front desk") + " · " + p.source });
    D.timeline.forEach(function (t) { if (t.personId === p.id) ev.push(t); });
    D.followUps.forEach(function (f) {
      if (f.personId !== p.id) return;
      if (f.status === "Done") ev.push({ at: f.doneAt || App.dueIso(f), kind: "followup", text: App.Followup.describeDone(f), sub: f.note, by: f.ownerUserId });
      if (f.status === "Closed by system") ev.push({ at: f.closedAt || App.dueIso(f), kind: "cancelled", text: f.type + " on " + App.fmtDay(App.dueIso(f)) + " closed by system · " + String(f.closeReason || "").toLowerCase(), struck: true });
      if (f.status === "Cancelled") ev.push({ at: f.cancelledAt || App.dueIso(f), kind: "cancelled", text: f.type + " on " + App.fmtDay(App.dueIso(f)) + " cancelled" + (f.cancelReason ? " · " + f.cancelReason : ""), struck: true });
    });
    return ev.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  }
  function dayLabel(iso) {
    var d = App.daysFromToday(iso);
    return d === 0 ? "Today" : d === -1 ? "Yesterday" : new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  }
  function timelinePanel(p) {
    var upcoming = D.followUps.filter(function (f) { return f.personId === p.id && f.status === "Open"; })
      .sort(function (a, b) { return new Date(App.dueIso(a)) - new Date(App.dueIso(b)); });
    var all = events(p), list = all.filter(function (e) { return S.filter === "all" || KIND[e.kind].f === S.filter; });
    var filters = [["all", "All"], ["followups", "Follow-ups"], ["notes", "Notes"], ["whatsapp", "WhatsApp"], ["milestones", "Milestones"]];
    var html = '<div class="chips tl-filters" role="group" aria-label="Filter timeline">' + filters.map(function (f) {
      return '<button class="chip' + (S.filter === f[0] ? " selected" : "") + '" aria-pressed="' + (S.filter === f[0]) + '" data-tl-filter="' + f[0] + '">' + f[1] + "</button>";
    }).join("") + "</div>";
    if (upcoming.length) {
      html += '<div class="tl-group-label">Open follow-ups</div>' + upcoming.map(function (f) {
        var st = App.followUpStatus(App.dueIso(f));
        return '<div class="tl-item tl-upcoming"><span class="tl-ico ' + st.cls + '">' + icon("clock", "ico-sm") + "</span>" +
          '<div class="tl-main"><div><strong>' + esc(f.type) + "</strong> · " + esc(App.fmtDue(f)) + ' <span class="badge ' + st.badge + '">' + esc(st.text) + "</span></div>" +
          '<div class="cell-sub">' + (f.note ? esc(f.note) + " · " : "") + esc(App.userName(f.ownerUserId)) + "</div></div>" +
          '<div class="tl-actions"><button class="btn btn-sm btn-primary" data-pd="outcome" data-f="' + f.id + '">Log outcome</button>' +
          '<button class="btn btn-sm btn-ghost" data-pd="cancelfu" data-f="' + f.id + '">Cancel</button></div></div>';
      }).join("");
    }
    if (!list.length) return html + '<div class="state">' + (S.filter === "all" ? "No history yet." : "Nothing here yet.") + " Add a note below.</div>";
    var last = "";
    list.forEach(function (e) {
      var lab = dayLabel(e.at);
      if (lab !== last) { html += '<div class="tl-group-label">' + esc(lab) + "</div>"; last = lab; }
      html += '<div class="tl-item"><span class="tl-ico">' + icon(KIND[e.kind].ic, "ico-sm") + "</span>" +
        '<div class="tl-main"><div class="' + (e.struck ? "struck" : "") + '">' + esc(e.text) + "</div>" +
        (e.sub ? '<div class="cell-sub">' + esc(e.sub) + "</div>" : "") +
        '<div class="cell-sub">' + esc(App.fmtTime(e.at)) + (e.by ? " · " + esc(App.userName(e.by)) : "") + "</div></div></div>";
    });
    return html;
  }

  // ---------- Composer (Note / Follow-up / WhatsApp) ----------
  function mountComposer(p) {
    var box = drawer.querySelector("[data-composer]"); if (!box) return;
    var lost = isLost(p);
    if (lost && S.mode === "follow") S.mode = "note";
    var modes = [["note", "Note", "note"], ["follow", "Follow-up", "clock"], ["wa", "WhatsApp", "message"]];
    box.innerHTML = '<div class="seg" role="tablist" aria-label="Add to timeline">' + modes.map(function (m) {
      var dis = m[0] === "follow" && lost;
      return '<button class="seg-btn' + (S.mode === m[0] ? " active" : "") + '" role="tab" aria-selected="' + (S.mode === m[0]) + '" data-mode="' + m[0] + '"' +
        (dis ? ' disabled title="Re-open the lead first"' : "") + ">" + icon(m[2], "ico-sm") + m[1] + "</button>";
    }).join("") + (lost ? '<span class="hint">Follow-ups need the lead re-opened.</span>' : "") + '</div><div class="composer-body"></div>';
    var b = box.querySelector(".composer-body");
    form = null;
    if (S.mode === "follow") {
      b.innerHTML = '<div data-ff></div><div class="composer-foot"><button class="btn btn-primary" data-pd="saveFollow">Save follow-up</button></div>';
      form = App.Followup.mountForm(b.querySelector("[data-ff]"), p.id);
    } else {
      var wa = S.mode === "wa";
      b.innerHTML = '<textarea class="input" rows="2" data-ctext aria-label="' + (wa ? "WhatsApp message" : "Note") + '" placeholder="' +
        (wa ? "Type a WhatsApp message to " + esc(p.name.split(" ")[0]) + "…" : "Add a note for the team…") + '"></textarea>' +
        '<div class="composer-foot"><span class="hint">' + (wa ? "Opens WhatsApp and logs the message here." : "Visible to everyone who can see this profile.") + "</span>" +
        '<button class="btn btn-primary" data-pd="' + (wa ? "sendWa" : "saveNote") + '">' + (wa ? icon("send") + "Send" : "Save note") + "</button></div>";
    }
  }

  // ---------- Tasks ----------
  function tasksOf(p) { return D.workTasks.filter(function (t) { return t.personId === p.id; }); }
  function taskStatus(t) {
    if (t.status === "Open" && App.daysFromToday(t.dueAt) < 0) return { b: "badge-danger", t: "Overdue" };
    return { Open: { b: "badge-info", t: "Open" }, Done: { b: "badge-success", t: "Done" }, Cancelled: { b: "", t: "Cancelled" } }[t.status];
  }
  function tasksPanel(p) {
    var list = tasksOf(p).sort(function (a, b) { return (a.status === "Open" ? 0 : 1) - (b.status === "Open" ? 0 : 1) || new Date(App.dueIso(a)) - new Date(App.dueIso(b)); });
    var html = '<div class="panel-head"><span class="muted">Staff work linked to ' + esc(p.name.split(" ")[0]) + "</span>" +
      '<button class="btn btn-sm" data-pd="task">' + icon("plus") + "Task</button></div>";
    if (!list.length) return html + '<div class="state">No tasks yet.</div>';
    var pri = { Critical: "badge-danger", High: "badge-warning", Medium: "badge-info", Low: "" };
    return html + list.map(function (t) {
      var s = taskStatus(t);
      return '<div class="task-row' + (t.status !== "Open" ? " is-closed" : "") + '"><div class="tl-main"><div class="cell-title' + (t.status === "Cancelled" ? " struck" : "") + '">' + esc(t.title) + "</div>" +
        '<div class="cell-sub">Due ' + esc(App.fmtWhen(t.dueAt)) + " · " + esc(App.userName(t.assignedUserId)) + (t.note ? " · " + esc(t.note) : "") + "</div></div>" +
        '<div class="stack"><span class="badge ' + pri[t.priority] + '">' + esc(t.priority) + '</span><span class="badge ' + s.b + '">' + s.t + "</span></div></div>";
    }).join("");
  }

  // ---------- Details (view + edit) ----------
  function kv(label, val) { return "<dt>" + label + "</dt><dd>" + esc(App.empty(val, "Not set yet")) + "</dd>"; }
  function detailsPanel(p) {
    var client = isClient(p);
    if (!S.editing) {
      return '<div class="panel-head"><span class="muted">' + (client ? "Client" : "Lead") + ' details</span>' +
        '<button class="btn btn-sm" data-pd="edit">' + icon("edit") + "Edit</button></div>" +
        '<h4 class="sec-title">Contact</h4><dl class="kv kv-wide">' +
          kv("Name", p.name) + kv("Mobile", p.cc + " " + p.mobile) + kv("Email", p.email) + kv("Gender", p.gender) +
          kv("Birth date", p.birthDate && new Date(p.birthDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })) + kv("FF ID", p.ffId) + "</dl>" +
        '<h4 class="sec-title">' + (client ? "Lead history" : "Lead info") + '</h4><dl class="kv kv-wide">' +
          kv("Stage", p.stage) + (isLost(p) ? kv("Lost reason", p.lostReason) : "") + kv("Temperature", p.temperature) + kv("Source", p.source) +
          kv("Inquiry type", p.inquiryType) + kv("Campaign", p.campaign) + kv("Owner", p.ownerUserId && App.userName(p.ownerUserId)) +
          kv("Branch", App.branchName(p.branchId)) + kv("Remarks", p.remarks) + kv("External ID", p.externalId) + "</dl>" +
        (client ? '<h4 class="sec-title">Client</h4><dl class="kv kv-wide">' + kv("Client no", p.clientNo) + kv("Home branch", App.branchName(p.homeBranchId)) +
          kv("Joined", p.joinedAt && App.fmtDate(p.joinedAt)) + kv("Key fob", p.keyFob) + kv("Photo", p.photo) + "</dl>" : "") +
        '<h4 class="sec-title">System</h4><dl class="kv kv-wide">' + kv("Created", App.formatDate(p.createdAt)) + kv("Last activity", App.formatDate(p.lastActivityAt)) + "</dl>";
    }
    function opt(list, v, empty) {
      return (empty ? '<option value="">Not set yet</option>' : "") + list.map(function (o) { return "<option" + (o === v ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("");
    }
    var stageEditable = !client && !isLost(p);
    return '<div class="panel-head"><span class="muted">Editing details</span></div>' +
      '<form class="details-form" data-details novalidate>' +
        '<div class="grid grid-2">' +
          fld("Name", '<input class="input" name="name" value="' + esc(p.name) + '">', true) +
          fld("Mobile", '<div class="row row-tight"><select class="input cc" name="cc" data-no-highlight aria-label="Country code">' + opt(L.countryCodes, p.cc) +
            '</select><input class="input" name="mobile" value="' + esc(p.mobile) + '" inputmode="tel"></div>', true, "Unique across all branches.") +
          fld("Email", '<input class="input" name="email" type="email" value="' + esc(p.email || "") + '">', false, "Unique across all branches.") +
          fld("Gender", '<select class="input" name="gender">' + opt(L.genders, p.gender, true) + "</select>") +
          fld("Birth date", '<input class="input" name="birthDate" type="date" value="' + esc(p.birthDate || "") + '">') +
          fld("FF ID", '<input class="input" name="ffId" value="' + esc(p.ffId || "") + '">', false, "ID from the other software. Unique.") +
          fld("Source", '<select class="input" name="source">' + opt(L.sources, p.source) + "</select>", true) +
          fld("Temperature", '<select class="input" name="temperature">' + opt(L.temperatures, p.temperature) + "</select>", true) +
          (stageEditable ? fld("Stage", '<select class="input" name="stage">' + opt(L.stages, p.stage) + "</select>", true, "Converted and Lost are set by their own actions.") : "") +
          fld("Inquiry type", '<select class="input" name="inquiryType">' + opt(L.inquiryTypes, p.inquiryType, true) + "</select>") +
          fld("Campaign", '<input class="input" name="campaign" value="' + esc(p.campaign || "") + '">') +
        "</div>" +
        fld("Remarks", '<textarea class="input" name="remarks" rows="2">' + esc(p.remarks || "") + "</textarea>") +
        '<div class="error form-error" data-derr hidden></div>' +
        '<div class="composer-foot"><button type="button" class="btn" data-pd="cancelEdit">Cancel</button><button type="button" class="btn btn-primary" data-pd="saveEdit">Save changes</button></div>' +
      "</form>";
  }
  function fld(label, ctl, req, hint) {
    return '<div class="field"><label>' + label + (req ? ' <span class="req">*</span>' : "") + "</label>" + ctl +
      (hint ? '<span class="hint">' + hint + "</span>" : "") + "</div>";
  }
  function saveDetails(p) {
    var f = drawer.querySelector("[data-details]"), v = {}, err = drawer.querySelector("[data-derr]");
    Array.prototype.forEach.call(f.elements, function (el) { if (el.name) v[el.name] = el.value.trim(); });
    f.querySelectorAll(".invalid").forEach(function (x) { x.classList.remove("invalid"); });
    function fail(name, msg) { var el = f.elements[name]; if (el) { el.classList.add("invalid"); el.focus(); } err.innerHTML = msg; err.hidden = false; }
    if (!v.name) return fail("name", "Name is required.");
    if (App.mobileDigits(v.mobile).length < 10) return fail("mobile", "Enter a 10-digit mobile number.");
    var dup = D.people.filter(function (o) { return o.id !== p.id && App.mobileDigits(o.cc + o.mobile) === App.mobileDigits(v.mobile); })[0];
    if (dup) {
      // Decision #19: same branch -> name + Open profile; other branch -> branch + owner + Request access
      return fail("mobile", dup.branchId === p.branchId
        ? "Already exists: <strong>" + esc(dup.name) + '</strong> <button type="button" class="link-btn" data-pd="openDup" data-id="' + dup.id + '">Open profile</button>'
        : "Already exists in " + esc(App.branchName(dup.branchId)) + " · Owner: " + esc(App.firstName(App.byId(D.users, dup.ownerUserId))) +
          ' <button type="button" class="link-btn" data-pd="reqAccess">Request access</button>');
    }
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return fail("email", "Enter a valid email.");
    if (v.email && D.people.some(function (o) { return o.id !== p.id && (o.email || "").toLowerCase() === v.email.toLowerCase(); })) return fail("email", "This email is already used by another person.");
    if (v.ffId && D.people.some(function (o) { return o.id !== p.id && o.ffId === v.ffId; })) return fail("ffId", "This FF ID is already used by another person.");
    var labels = { name: "Name", cc: "Mobile", mobile: "Mobile", email: "Email", gender: "Gender", birthDate: "Birth date", ffId: "FF ID", source: "Source",
      temperature: "Temperature", stage: "Stage", inquiryType: "Inquiry type", campaign: "Campaign", remarks: "Remarks" }, changed = [];
    Object.keys(v).forEach(function (k) {
      var nv = v[k] || null; if ((p[k] || null) !== nv) { p[k] = nv; if (changed.indexOf(labels[k]) < 0) changed.push(labels[k]); }
    });
    S.editing = false;
    if (changed.length) { App.addTimeline(p.id, "note", App.firstName(App.me()) + " updated " + changed.join(", ").toLowerCase()); App.toast("Details saved", "success"); App.dataChanged(); }
    else { App.toast("No changes", ""); render(); }
  }

  // ---------- Docs ----------
  function docsOf(p) { return D.docs.filter(function (d) { return d.personId === p.id; }); }
  function docsPanel(p) {
    var list = docsOf(p);
    return '<div class="doc-upload"><div class="field"><label for="docType">Document type</label><select class="input" id="docType">' +
        D.docTypes.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "</select></div>" +
        '<button class="btn" data-pd="upload">' + icon("upload") + "Choose file…</button></div>" +
      '<p class="hint">Upload is a placeholder in the mockup: it adds a sample file to the list.</p>' +
      (list.length ? list.map(function (d) {
        return '<div class="task-row"><span class="tl-ico">' + icon("note", "ico-sm") + '</span><div class="tl-main"><div class="cell-title">' + esc(d.name) + "</div>" +
          '<div class="cell-sub">' + esc(App.fmtDay(d.at)) + " · " + esc(App.userName(d.by)) + '</div></div><span class="badge">' + esc(d.type) + "</span></div>";
      }).join("") : '<div class="state">No documents yet.</div>');
  }

  // ---------- Membership (clients) ----------
  function membershipPanel(p) {
    var m = p.membership, ms = App.membershipStatus(m);
    if (!m) return '<div class="state">No membership yet.</div>';
    var paid = m.saleType === "Paid", fob = p.keyFob && App.byId(D.keyFobs.map(function (k) { return Object.assign({ id: k.no }, k); }), p.keyFob);
    var stock = D.keyFobs.filter(function (k) { return k.branchId === p.homeBranchId && k.status === "In stock"; });
    var fobHtml;
    if (!paid) fobHtml = '<span class="muted">No key fob · trial memberships don\'t get one</span>';
    else if (fob) fobHtml = '<div class="fob">' + icon("key") + "<strong>" + esc(fob.no) + '</strong> <span class="badge badge-success">Assigned</span></div>' +
      '<div class="stack fob-actions"><button class="btn btn-sm" data-pd="fobReturn">Return</button><button class="btn btn-sm" data-pd="fobLost">Lost</button>' +
      '<button class="btn btn-sm" data-pd="fobReplace">' + icon("swap") + "Replace</button></div>";
    else fobHtml = '<span class="badge badge-warning">Key fob pending</span> <button class="btn btn-sm" data-pd="fobAssign"' + (stock.length ? "" : " disabled") + ">Assign from stock</button>";
    return '<div class="next-step ' + ms.cls + ' mb-3"><strong>' + esc(ms.text) + "</strong> · " +
        (ms.left < 0 ? "ended " + esc(App.fmtDate(m.end)) : ms.left + (ms.left === 1 ? " day" : " days") + " left") + "</div>" +
      '<dl class="kv kv-wide">' + kv("Package", m.package) + "<dt>Sale type</dt><dd><span class=\"badge badge-info\">" + esc(m.saleType) + "</span></dd>" +
        kv("Start", App.fmtDate(m.start)) + kv("End", App.fmtDate(m.end)) + kv("Price", App.fmtMoney(m.price)) +
        (m.discount ? kv("Discount", App.fmtMoney(m.discount) + " · " + App.empty(m.discountReason)) : "") +
        kv("Final price", App.fmtMoney(m.finalPrice != null ? m.finalPrice : m.price)) +
        kv("Sales rep", m.salesRepUserId ? App.userName(m.salesRepUserId) : "Not set yet") + kv("Client no", p.clientNo) +
        "<dt>FF ID</dt><dd>" + (p.ffId ? esc(p.ffId) : paid ? '<span class="badge badge-warning">FF ID pending</span> <button class="link-btn" data-pd="addFf">Add</button>' : "Not set yet") + "</dd>" +
        "<dt>Key fob</dt><dd>" + fobHtml + "</dd>" +
        ((m.freeItems || []).length ? "<dt>Free items</dt><dd>" + m.freeItems.map(function (f) {
          var b = f.status === "Issued" ? "badge-success" : f.status === "Pending issue" ? "badge-warning" : "";
          return '<div>' + esc(f.name) + " × " + f.qty + ' <span class="badge ' + b + '">' + esc(f.status) + "</span></div>";
        }).join("") + "</dd>" : "") +
        (paid ? kv("Fob stock", App.branchName(p.homeBranchId) + ": " + stock.length + " in stock") : "") + "</dl>" +
      '<p class="hint">Renewals and payments come with the Payment module.</p>';
  }

  // Key fob actions (decision #13, #29)
  function fobAction(kind) {
    var p = P(), m = App.makeModal("fobModal"), cur = p.keyFob && D.keyFobs.filter(function (k) { return k.no === p.keyFob; })[0];
    var stock = D.keyFobs.filter(function (k) { return k.branchId === p.homeBranchId && k.status === "In stock"; });
    var needPick = kind === "replace" || kind === "assign";
    m.title.textContent = { ret: "Return key fob", lost: "Mark key fob as lost", replace: "Replace key fob", assign: "Assign key fob" }[kind];
    m.body.innerHTML = (cur ? "<p>Current fob: <strong>" + esc(cur.no) + "</strong></p>" : "") +
      (kind === "replace" ? '<div class="field"><label>Why replace? <span class="req">*</span></label><div class="chips">' +
        '<button type="button" class="chip selected" data-why="Lost">Old fob lost</button><button type="button" class="chip" data-why="Returned">Old fob damaged / returned</button></div></div>' : "") +
      (needPick ? '<div class="field"><label for="fobPick">New fob from ' + esc(App.branchName(p.homeBranchId)) + ' stock <span class="req">*</span></label>' +
        (stock.length ? '<select class="input" id="fobPick">' + stock.map(function (k) { return "<option>" + esc(k.no) + "</option>"; }).join("") + "</select>"
          : '<div class="error">No fobs in stock at this branch.</div>') + "</div>" : "") +
      '<p class="hint">' + { ret: "The fob status becomes Returned.", lost: "The fob status becomes Lost.", replace: "Stock goes down by one.", assign: "Stock goes down by one." }[kind] + "</p>";
    m.body.onclick = function (e) { var c = e.target.closest("[data-why]"); if (c) Array.prototype.forEach.call(c.parentNode.children, function (x) { x.classList.toggle("selected", x === c); }); };
    if (needPick && stock.length) App.enhanceSelect(m.body.querySelector("#fobPick"));
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save' + (needPick && !stock.length ? " disabled" : "") + ">Confirm</button>";
    m.foot.querySelector("[data-save]").onclick = function () {
      var text;
      if (kind === "ret" || kind === "lost") {
        cur.status = kind === "ret" ? "Returned" : "Lost"; cur.personId = null; p.keyFob = null;
        cur.history.push({ at: new Date().toISOString(), text: (kind === "ret" ? "Returned by " : "Marked as Lost · ") + p.name + (cur.deposit ? " · deposit held, refund from Items → Key fobs" : ""), by: App.me().id });
        text = "Key fob " + cur.no + (kind === "ret" ? " returned" : " marked as lost");
      } else {
        var no = m.body.querySelector("#fobPick").value, nf = D.keyFobs.filter(function (k) { return k.no === no; })[0];
        var now = new Date().toISOString();
        if (cur) { cur.status = m.body.querySelector("[data-why].selected").dataset.why; cur.personId = null;
          cur.history.push({ at: now, text: (cur.status === "Lost" ? "Marked as Lost" : "Returned") + " · replaced by " + nf.no, by: App.me().id }); }
        nf.status = "Assigned"; nf.personId = p.id; p.keyFob = nf.no;
        // Replace: the client's deposit moves to the new fob. Assign: a new deposit line is collected.
        nf.deposit = cur && cur.deposit ? cur.deposit : { amount: App.fobDeposit(), refunded: 0 }; if (cur) cur.deposit = null;
        nf.history.push({ at: now, text: "Assigned to " + p.name + (cur ? " (replacement)" : " · deposit " + App.fmtMoney(App.fobDeposit()) + " collected"), by: App.me().id });
        text = cur ? "Key fob replaced · " + cur.no + " → " + nf.no : "Key fob " + nf.no + " assigned";
      }
      App.addTimeline(p.id, "milestone", text);
      App.close(m.el); App.toast(text, "success"); App.dataChanged();
    };
    App.openModal("fobModal");
  }

  // ---------- events ----------
  function onClick(e) {
    var t = e.target.closest("[data-pd],[data-tab-k],[data-tl-filter],[data-mode]"); if (!t || t.disabled) return;
    var p = P();
    if (t.dataset.tabK) { S.tab = t.dataset.tabK; S.editing = false; render(); var nt = drawer.querySelector('[data-tab-k="' + S.tab + '"]'); if (nt) nt.focus(); return; }
    if (t.dataset.tlFilter) { S.filter = t.dataset.tlFilter; render(); return; }
    if (t.dataset.mode) { S.mode = t.dataset.mode; mountComposer(p); App.fillIcons(drawer); var c = drawer.querySelector("[data-composer] textarea, [data-composer] .chip"); if (c) c.focus(); return; }
    var a = t.dataset.pd, me = App.firstName(App.me());
    switch (a) {
      case "prev": case "next":
        var i = S.list.indexOf(S.id) + (a === "next" ? 1 : -1); if (S.list[i]) App.openProfile(S.list[i], { state: "normal" }); break;
      case "retry": App.openProfile(S.id); break;
      case "copy": try { navigator.clipboard.writeText(p.cc + " " + p.mobile); } catch (x) {} App.toast("Mobile copied", ""); break;
      case "call": App.toast("Calling " + p.name + " · " + p.cc + " " + p.mobile, ""); App.addTimeline(p.id, "call", me + " called (no outcome logged)"); App.dataChanged(); break;
      case "wa": S.tab = "timeline"; S.mode = "wa"; render(); var ta = drawer.querySelector("[data-ctext]"); if (ta) ta.focus(); break;
      case "email": App.toast("Opening email to " + p.email, ""); break;
      case "follow": App.Followup.openAdd(p.id); break;
      case "outcome": App.Followup.openOutcome(t.dataset.f); break;
      case "cancelfu": App.Followup.cancel(t.dataset.f); break;
      case "assign": App.Lead.assign(p.id); break;
      case "lost": App.Lead.markLost(p.id); break;
      case "reopen": App.Lead.reopen(p.id); break;
      case "convert": App.Convert.open(p.id); break;
      case "addFf": S.tab = "details"; S.editing = true; render(); break;
      case "goFob": S.tab = "membership"; render(); break;
      case "task": App.toast("Task form comes with the Tasks screen", ""); break;
      case "edit": S.editing = true; render(); break;
      case "cancelEdit": S.editing = false; render(); break;
      case "saveEdit": saveDetails(p); break;
      case "openDup": App.openProfile(t.dataset.id, { state: "normal" }); break;
      case "reqAccess": App.toast("Access request sent (mockup)", ""); break;
      case "saveNote": case "sendWa":
        var txt = drawer.querySelector("[data-ctext]").value.trim();
        if (!txt) { drawer.querySelector("[data-ctext]").classList.add("invalid"); drawer.querySelector("[data-ctext]").focus(); return; }
        if (a === "sendWa") { App.toast("Opening WhatsApp for " + p.name, ""); App.addTimeline(p.id, "whatsapp", me + " sent WhatsApp · " + txt); }
        else { App.addTimeline(p.id, "note", me + " noted: " + txt); App.toast("Note saved", "success"); }
        App.dataChanged(); break;
      case "saveFollow":
        var v = form && form.value(); if (!v) return;
        var f = App.Followup.create(p.id, v); App.toast("Follow-up set · " + App.fmtDue(f), "success"); App.dataChanged(); break;
      case "upload":
        var type = drawer.querySelector("#docType").value;
        D.docs.push({ personId: p.id, type: type, name: type + " (placeholder).pdf", at: new Date().toISOString(), by: App.me().id });
        App.addTimeline(p.id, "milestone", type + " uploaded");
        App.toast(type + " added (placeholder)", "success"); App.dataChanged(); break;
      case "fobReturn": fobAction("ret"); break;
      case "fobLost": fobAction("lost"); break;
      case "fobReplace": fobAction("replace"); break;
      case "fobAssign": fobAction("assign"); break;
    }
  }
  function onChange() { /* details form reads values on save */ }

  // Re-render when data changes anywhere (outcome saved, owner changed, …)
  document.addEventListener("mock:data", function () { if (drawer && drawer.classList.contains("open") && !S.editing) render(); });
  document.addEventListener("mock:context", function () { if (drawer && drawer.classList.contains("open")) render(); });
})();
