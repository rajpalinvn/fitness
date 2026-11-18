/* Settings → Roles & permissions (decisions #95, #96; notes v3 §2, §2a).
   Tabs: Permissions (grid) · Settings values · Roles (read-only) · Trainer types · Audit log.
   Edit: only CEO (grid row "Roles & permissions", locked; #102); everyone else: "You don't have access".
   Changes are kept in session storage through App.Perm (shared/app.js). */
(function () {
  var D = window.DUMMY, esc = App.esc, A = window.Admin, P = App.Perm;
  var TABS = [["permissions", "Permissions"], ["values", "Settings values"], ["notify", "Notification rules"], ["roles", "Roles"], ["trainers", "Trainer types"], ["audit", "Audit log"]];
  var MODULES = ["Leads", "Trials", "Sales", "Clients", "Payments", "Settings"];
  var SCOPES = ["None", "Own", "Branch", "All"];
  var SCOPE_HINT = { None: "No access", Own: "Own leads + leads with my open follow-up", Branch: "The staff's branch (all their branches for multi-branch roles)", All: "Every branch" };
  var S = {
    tab: (/[?&]tab=(\w+)/.exec(location.search) || [])[1] || "permissions",
    pending: {},            // "SHORT|key" -> value (Permissions tab)
    pendingSet: {},         // settingKey -> value (Settings values tab)
    collapsed: {}, search: "", saving: false, auditTab: "All", ttEditId: null, ttErr: {}
  };

  function can() { return App.can("settings.rolesPermissions") === true; }
  function pdef(key) { return D.permissionDefs.filter(function (d) { return d.key === key; })[0]; }
  function val(short, key) { var k = short + "|" + key; return k in S.pending ? S.pending[k] : P.get(short, key); }
  function cellText(d, v) {
    if (d.type === "tick") return v ? App.icon("check", "ico-sm") + "Yes" : "—";
    if (d.type === "number") return v + "%";
    if (d.type === "pctcap") return esc(P.text(v, d));
    return v === "None" ? "—" : esc(v);
  }
  function pendingList() {
    return Object.keys(S.pending).map(function (k) {
      var p = k.split("|"), d = pdef(p[1]);
      return { short: p[0], key: p[1], value: S.pending[k], role: P.roleByShort(p[0]).name, label: d.label, from: P.text(P.get(p[0], p[1]), d), to: P.text(S.pending[k], d) };
    });
  }
  // Validation: at least one role besides CEO keeps Assign / reassign (locked rule, #96; CEO is locked to All, #102).
  function assignError() {
    var ok = D.roles.some(function (r) { return r.short !== "CEO" && val(r.short, "leads.assign") !== "None"; });
    return ok ? "" : "At least one role (besides CEO) must keep \"Assign / reassign\".";
  }

  // ---------- render ----------
  function render() {
    if (!TABS.some(function (t) { return t[0] === S.tab; })) S.tab = "permissions";
    closePop();
    document.getElementById("rpTabs").innerHTML = TABS.map(function (t) {
      var on = t[0] === S.tab; return '<button class="tab' + (on ? " active" : "") + '" role="tab" aria-selected="' + on + '" data-rtab="' + t[0] + '">' + t[1] + "</button>";
    }).join("");
    var panel = document.getElementById("panel"), head = document.getElementById("headActions");
    head.innerHTML = "";
    if (!can()) {
      panel.innerHTML = '<div class="state">' + App.icon("lock") + "<h3>You don't have access to Roles &amp; permissions</h3>" +
        '<p class="muted">Only the CEO can open this page. Switch "View as" in the avatar menu to try another role.</p></div>';
      saveBar(); return;
    }
    var st = A.debugState();
    if (st !== "normal") {
      panel.innerHTML = '<div class="table-wrap"><table class="table table-admin"><tbody>' + A.stateHtml(st, "", 10) + "</tbody></table></div>";
      saveBar(); return;
    }
    if (S.tab === "permissions") { head.innerHTML = '<button class="btn btn-ghost" data-rp="reset">' + App.icon("refresh") + "Reset all to defaults</button>"; panel.innerHTML = grid(); }
    else if (S.tab === "values") { head.innerHTML = '<button class="btn btn-ghost" data-rp="resetSet">' + App.icon("refresh") + "Reset to defaults</button>"; panel.innerHTML = values(); }
    else if (S.tab === "notify") panel.innerHTML = notifyTab();
    else if (S.tab === "roles") panel.innerHTML = rolesTab();
    else if (S.tab === "trainers") { head.innerHTML = '<button class="btn btn-primary" data-rp="ttAdd">' + App.icon("plus") + "Trainer type</button>"; panel.innerHTML = trainers(); }
    else { panel.innerHTML = audit(); }
    App.fillIcons(panel);
    var sel = document.getElementById("auditFilter"); if (sel) App.enhanceSelect(sel);
    var sb = document.getElementById("rpSearch"); if (sb) { sb.value = S.search; }
    saveBar();
  }

  // ----- Permissions grid -----
  function grid() {
    var q = S.search.trim().toLowerCase();
    var h = '<div class="callout">' + App.icon("info") + "<span><strong>Scopes:</strong> None = no access · Own = leads I own + leads with my open follow-up · " +
      "Branch = the staff's branch (all their branches for RM) · All = every branch. CEO has everything (locked) and is the only editor; every saved change goes to the Audit log. " +
      '<span class="badge badge-demo">Default, can change</span></span></div>' +
      '<div class="filter-bar"><input class="input grow" type="search" id="rpSearch" placeholder="Filter actions, e.g. assign, trial, discount" aria-label="Filter actions"></div>' +
      '<div class="table-wrap perm-wrap"><table class="table perm-table" id="permTable"><thead><tr><th class="perm-action">Action</th>' +
      D.roles.map(function (r) { return '<th class="perm-col" title="' + esc(r.name) + '"><abbr title="' + esc(r.name) + '">' + esc(r.short) + "</abbr></th>"; }).join("") + "</tr></thead><tbody>";
    var shown = 0;
    MODULES.forEach(function (m) {
      var rows = D.permissionDefs.filter(function (d) { return d.module === m && (!q || (d.label + " " + d.key).toLowerCase().indexOf(q) > -1); });
      if (!rows.length) return;
      var col = !!S.collapsed[m] && !q;
      h += '<tr class="perm-group"><td colspan="' + (D.roles.length + 1) + '"><button type="button" class="perm-toggle" data-module="' + m + '" aria-expanded="' + !col + '">' +
        App.icon(col ? "chevron-right" : "chevron-down", "ico-sm") + "<strong>" + m + '</strong><span class="muted">' + rows.length + " actions</span></button></td></tr>";
      if (col) return;
      rows.forEach(function (d) {
        shown++;
        h += '<tr data-perm="' + d.key + '"><td class="perm-action"><div>' + esc(d.label) + '</div><div class="cell-sub">' + d.key +
          (d.atLeastOne ? " · at least one role keeps this" : "") + (d.minOwn ? ' · "Own" is the floor for lead-owning roles' : "") + "</div></td>" +
          D.roles.map(function (r) { return '<td class="perm-cell" data-cellbox="' + r.short + "|" + d.key + '">' + cell(d, r.short) + "</td>"; }).join("") + "</tr>";
      });
    });
    if (!shown) h += '<tr><td colspan="' + (D.roles.length + 1) + '"><div class="state">No actions match "' + esc(S.search) + '". <button class="btn btn-sm" data-rp="clearSearch">Clear</button></div></td></tr>';
    return h + "</tbody></table></div>";
  }
  function cell(d, short) {
    var v = val(short, d.key), lock = P.lockReason(short, d.key), k = short + "|" + d.key, changed = k in S.pending;
    var txt = cellText(d, v), role = P.roleByShort(short).name, none = v === "None" || v === false;
    if (lock) return '<span class="perm-chip locked' + (none ? " none" : "") + '" tabindex="0" data-tip="' + esc(lock) + '" aria-label="' + esc(role + " · " + d.label + ": " + P.text(v, d) + ". Locked: " + lock) + '">' + App.icon("lock", "ico-sm") + txt + "</span>";
    return '<button type="button" class="perm-chip' + (changed ? " changed" : "") + (none ? " none" : "") + '" data-cell="' + k + '" aria-haspopup="dialog" aria-label="' + esc(role + " · " + d.label + ": " + P.text(v, d) + (changed ? " (unsaved)" : "")) + '">' + txt + "</button>";
  }
  function refreshCell(k) {
    var box = document.querySelector('[data-cellbox="' + k + '"]'); if (!box) return;
    var p = k.split("|"); box.innerHTML = cell(pdef(p[1]), p[0]); App.fillIcons(box);
  }

  // Cell popover: opened on click / Enter / Space; Esc or outside click closes.
  var pop = null, popCell = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } if (popCell && document.contains(popCell)) { popCell.focus(); } popCell = null; }
  function openPop(btn) {
    closePop();
    var p = btn.dataset.cell.split("|"), short = p[0], d = pdef(p[1]), v = val(short, d.key), role = P.roleByShort(short).name;
    pop = document.createElement("div"); pop.className = "perm-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", role + " · " + d.label);
    var inner = '<div class="perm-pop-title">' + esc(role) + '<span class="cell-sub">' + esc(d.label) + "</span></div>";
    if (d.type === "scope") {
      inner += SCOPES.map(function (s) {
        var dis = s === "None" && P.minOwn(short, d.key);
        return '<button type="button" class="dd-item" role="menuitemradio" aria-checked="' + (s === v) + '" data-pick="' + s + '"' + (dis ? ' disabled title="An owner can always see and log follow-ups on their own leads."' : "") + '>' +
          '<span class="dd-check">' + (s === v ? App.icon("check") : "") + "</span><span>" + s + '<span class="cell-sub">' + SCOPE_HINT[s] + (dis ? " · locked: owner always sees own leads" : "") + "</span></span></button>";
      }).join("");
    } else if (d.type === "tick") {
      inner += [["true", "Yes"], ["false", "No"]].map(function (o) {
        var on = String(v) === o[0];
        return '<button type="button" class="dd-item" role="menuitemradio" aria-checked="' + on + '" data-pick="' + o[0] + '"><span class="dd-check">' + (on ? App.icon("check") : "") + "</span><span>" + o[1] + "</span></button>";
      }).join("");
    } else if (d.type === "pctcap") {
      var dv = P.defaultOf(short, d);
      inner += '<div class="field"><label for="popNum">Max discount %</label><div class="row row-tight"><input class="input input-num input-xs" id="popNum" type="number" min="0" max="100" step="1" value="' + v.pct + '"><span>%</span></div></div>' +
        '<div class="field"><label for="popCap">Max ₹ per package line</label><div class="row row-tight"><span>₹</span><input class="input input-num input-xs" id="popCap" type="number" min="0" step="1" value="' + v.cap + '">' +
        '<button type="button" class="btn btn-primary btn-sm" data-pick="pctcap">OK</button></div><span class="error" id="popErr"></span>' +
        '<span class="hint">The lower of the two applies. ₹ 0 = no cap (only the %). 0% = no discount. Default ' + esc(P.text(dv, d)) + ".</span></div>";
    } else {
      inner += '<div class="field"><label for="popNum">Max discount %</label><div class="row row-tight"><input class="input input-num input-xs" id="popNum" type="number" min="0" max="100" step="1" value="' + v + '"><span>%</span>' +
        '<button type="button" class="btn btn-primary btn-sm" data-pick="num">OK</button></div><span class="error" id="popErr"></span><span class="hint">Whole number 0–100. Default ' + P.defaultOf(short, d) + "%.</span></div>";
    }
    pop.innerHTML = inner; document.body.appendChild(pop);
    var r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8), top = r.bottom + 4;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
    pop.style.left = left + "px"; pop.style.top = top + "px";
    popCell = btn;
    var f = pop.querySelector('[aria-checked="true"], input'); (f || pop.querySelector("button")).focus();
  }
  function pick(short, key, value) {
    var d = pdef(key), stored = P.get(short, key), k = short + "|" + key;
    if (P.same(value, stored)) delete S.pending[k]; else S.pending[k] = value;
    closePop(); refreshCell(k); saveBar();
  }

  // ----- Settings values -----
  function setVal(k) { return k in S.pendingSet ? S.pendingSet[k] : P.settings()[k]; }
  function setErrors() {
    var e = {}, v = {}; D.settingDefs.forEach(function (d) { v[d.key] = setVal(d.key); });
    D.settingDefs.forEach(function (d) {
      if (d.options) return;
      var x = v[d.key];
      if (x === "" || x === null || isNaN(x) || Math.floor(Number(x)) !== Number(x)) e[d.key] = "Enter a whole number.";
      else if (Number(x) < d.min || Number(x) > d.max) e[d.key] = "Must be between " + d.min + " and " + d.max + ".";
    });
    if (!e.freeTrialsPerBranch && !e.freeTrialsPerPerson && Number(v.freeTrialsPerBranch) > Number(v.freeTrialsPerPerson)) e.freeTrialsPerBranch = "Per branch can't be more than per person (" + v.freeTrialsPerPerson + ").";
    if (!e.releaseWarnDaysBefore && !e.inactivityReleaseDays && Number(v.releaseWarnDaysBefore) >= Number(v.inactivityReleaseDays)) e.releaseWarnDaysBefore = "Must be less than the inactivity days (" + v.inactivityReleaseDays + ").";
    return e;
  }
  function values() {
    var errs = setErrors(), cur = P.settings();
    return '<div class="callout">' + App.icon("info") + "<span>Numbers, not per role. Who can change each value comes from the grid row named under it; " +
      'values with no grid row are changed by CEO. <span class="badge badge-demo">Default, can change</span></span></div>' +
      '<div class="card set-card">' + D.settingDefs.map(function (d) {
        var v = setVal(d.key), changed = d.key in S.pendingSet && S.pendingSet[d.key] !== cur[d.key], eds = P.settingEditors(d);
        var byTxt = "Changed by: " + (eds.length ? eds.join(", ") : "nobody yet") + (d.by === "CEO" ? "" : ' <span class="cell-sub">(grid row "' + esc(pdef(d.by).label) + '")</span>');
        var input = d.options
          ? '<div class="seg" role="radiogroup" aria-label="' + esc(d.label) + '">' + d.options.map(function (o) {
              var later = o.indexOf("Round-robin") === 0, on = v === o;
              return '<button type="button" class="seg-btn' + (on ? " active" : "") + '" role="radio" aria-checked="' + on + '" data-setopt="' + d.key + '" data-val="' + o + '"' + (later ? ' disabled title="Comes later (needs shift data for on-shift)"' : "") + ">" + o + (later ? ' <span class="muted">Later</span>' : "") + "</button>";
            }).join("") + "</div>"
          : '<div class="row row-tight"><input class="input input-num input-xs' + (errs[d.key] ? " invalid" : "") + '" type="number" id="set-' + d.key + '" data-set="' + d.key + '" min="' + d.min + '" max="' + d.max + '" step="1" value="' + esc(v) + '" aria-describedby="seth-' + d.key + '"><span>' + d.unit + "</span>" +
            (changed ? ' <span class="badge badge-info">Unsaved</span>' : cur[d.key] !== d.def ? ' <span class="badge badge-info">Changed</span>' : "") + "</div>";
        return '<div class="pref-row set-row"><div><label class="pref-title" for="set-' + d.key + '">' + esc(d.label) + '</label><div class="cell-sub" id="seth-' + d.key + '">' + esc(d.hint) + "</div>" +
          '<div class="cell-sub">Default ' + esc(d.def) + (d.unit ? " " + d.unit : "") + " · " + byTxt + "</div></div><div>" + input + (errs[d.key] ? '<div class="error">' + esc(errs[d.key]) + "</div>" : "") + "</div></div>";
      }).join("") + "</div>";
  }

  // ----- Notification rules (#108) -----
  function notifyTab() {
    var rules = App.Notify.rules(), ed = App.state.role === "CEO";   // CEO edits (same as the CEO-only settings values)
    return '<div class="callout">' + App.icon("info") + "<span>Who gets a notification in the bell, per event and role. Each role gets it only for <strong>its own branch(es)</strong>. " +
      (ed ? "Changes save at once and are logged in the Audit log." : "Only CEO can change these.") + "</span></div>" +
      '<div class="table-wrap"><table class="table table-admin" id="notifyTable"><thead><tr><th>Event</th>' + D.notifyRoles.map(function (s) { return "<th>" + esc(P.roleByShort(s).name) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      D.notifyEvents.map(function (e) {
        return "<tr><td>" + esc(e[1]) + "</td>" + D.notifyRoles.map(function (s) {
          return '<td><input type="checkbox" data-notify="' + e[0] + "|" + s + '"' + (rules[e[0]][s] ? " checked" : "") + (ed ? "" : " disabled") + ' aria-label="' + esc(e[1] + " · " + P.roleByShort(s).name) + '"></td>';
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>" +
      '<div class="callout mt-1" data-notify-locked>' + App.icon("lock") + "<span><strong>Always notified (locked):</strong> the people directly involved: the owner, the old owner and the approver. " +
      "More events come later (PT quote requested, Client assigned to you).</span></div>";
  }
  document.addEventListener("change", function (e) {
    var t = e.target.closest && e.target.closest("[data-notify]"); if (!t) return;
    var k = t.dataset.notify.split("|"); App.Notify.save(k[0], k[1], t.checked);
    App.toast("Saved · " + (t.checked ? "on" : "off"), "success"); render();
  });

  // ----- Roles (read-only) -----
  function rolesTab() {
    return '<div class="callout">' + App.icon("lock") + "<span><strong>Roles are fixed</strong>: seeded and locked, no add / delete / rename. One staff = exactly one role. " +
      "Trainer type is not a role (see the Trainer types tab). Region is a grouping of branches, not a permission scope. " +
      "SuperAdmin is a platform role (creates tenants and their first CEO account): not a tenant role, not in this list.</span></div>" +
      '<div class="table-wrap"><table class="table table-admin" id="rolesTable"><thead><tr><th>Role</th><th>Short</th><th>Key</th><th>Reports to</th><th>Branches</th><th>Staff</th></tr></thead><tbody>' +
      D.roles.map(function (r) {
        var staff = D.users.filter(function (u) { return u.roleKey === r.key; });
        var rep = r.reportsTo ? P.roleByKey(r.reportsTo) : null;
        return '<tr data-role-row="' + r.key + '"><td><strong>' + esc(r.name) + "</strong></td><td>" + esc(r.short) + '</td><td><code class="cell-sub">' + esc(r.key) + "</code></td><td>" + (rep ? esc(rep.name) : "—") +
          "</td><td>" + (r.multiBranch ? "Multi" : "Single") + "</td><td>" + staff.length + (staff.length ? ' <span class="cell-sub">' + esc(staff.map(App.firstName).join(", ")) + "</span>" : "") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  // ----- Trainer types -----
  function ttInUse(id) { return D.users.filter(function (u) { return u.trainerTypeId === id; }).length; }
  function trainers() {
    var list = P.trainerTypes();
    return '<div class="callout">' + App.icon("info") + "<span>Admin master list. Any type can take PT sessions; the type only changes the payout (incentive scheme). " +
      "A type in use can't be deleted, only deactivated. Each PT session / sale line stores the type at that time.</span></div>" +
      '<div class="table-wrap"><table class="table table-admin" id="ttTable"><thead><tr><th>Trainer type</th><th>Short</th><th>Can take PT sessions</th><th>Status</th><th>In use</th><th>Actions</th></tr></thead><tbody>' +
      (list.length ? list.map(function (t) {
        var n = ttInUse(t.id);
        return '<tr data-tt="' + t.id + '"><td><strong>' + esc(t.name) + "</strong></td><td>" + esc(t.short) + "</td><td>" + (t.canTakePT ? "Yes" : "No") + '</td><td><span class="badge ' + (t.active ? "badge-success" : "") + '">' + (t.active ? "Active" : "Inactive") + "</span></td>" +
          "<td>" + (n ? n + " trainer" + (n > 1 ? "s" : "") : "—") + '</td><td><div class="row-actions">' +
          '<button class="btn btn-sm" data-tt-act="edit" data-id="' + t.id + '">' + App.icon("edit", "ico-sm") + "Edit</button>" +
          '<button class="btn btn-sm" data-tt-act="toggle" data-id="' + t.id + '">' + (t.active ? "Deactivate" : "Activate") + "</button>" +
          (n ? "" : '<button class="btn btn-sm btn-ghost" data-tt-act="delete" data-id="' + t.id + '">Delete</button>') + "</div></td></tr>";
      }).join("") : '<tr><td colspan="6"><div class="state"><h3>No trainer types yet</h3><p class="muted">Add one with “+ Trainer type”.</p></div></td></tr>') + "</tbody></table></div>";
  }
  function ttForm() {
    var dr = A.formDrawer("ttDrawer"), list = P.trainerTypes(), t = S.ttEditId ? list.filter(function (x) { return x.id === S.ttEditId; })[0] : null, e = S.ttErr;
    dr.title.textContent = t ? "Edit trainer type" : "New trainer type";
    dr.body.innerHTML = '<div class="field"><label for="ttName">Name <span class="req">*</span></label><input class="input' + (e.name ? " invalid" : "") + '" id="ttName" value="' + esc(t ? t.name : "") + '" placeholder="e.g. Yoga Trainer">' + A.err(e, "name") + "</div>" +
      '<div class="field"><label for="ttShort">Short code <span class="req">*</span></label><input class="input' + (e.short ? " invalid" : "") + '" id="ttShort" maxlength="8" value="' + esc(t ? t.short : "") + '" placeholder="e.g. YT">' + A.err(e, "short") + '<span class="hint">Shown on sessions and payouts.</span></div>' +
      '<div class="field"><label class="switch"><input type="checkbox" id="ttPt"' + (!t || t.canTakePT ? " checked" : "") + "><span>Can take PT sessions</span></label></div>" +
      '<div class="field"><label class="switch"><input type="checkbox" id="ttActive"' + (!t || t.active ? " checked" : "") + "><span>Active</span></label></div>" +
      (t && ttInUse(t.id) ? '<p class="cell-sub">In use by ' + ttInUse(t.id) + " trainer(s): it can be deactivated, not deleted.</p>" : "");
    dr.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-rp="ttSave">' + (t ? "Save changes" : "Add trainer type") + "</button>";
    App.openDrawer("ttDrawer");
  }
  function ttSave() {
    var list = P.trainerTypes(), name = document.getElementById("ttName").value.trim(), short = document.getElementById("ttShort").value.trim().toUpperCase();
    var e = {};
    if (!name) e.name = "Enter a name."; else if (list.some(function (x) { return x.id !== S.ttEditId && x.name.toLowerCase() === name.toLowerCase(); })) e.name = "This name already exists.";
    if (!short) e.short = "Enter a short code."; else if (list.some(function (x) { return x.id !== S.ttEditId && x.short.toUpperCase() === short; })) e.short = "This short code already exists.";
    S.ttErr = e; if (Object.keys(e).length) { ttForm(); return; }
    var pt = document.getElementById("ttPt").checked, act = document.getElementById("ttActive").checked, entry;
    if (S.ttEditId) {
      var t = list.filter(function (x) { return x.id === S.ttEditId; })[0], from = t.name + " · " + t.short + " · PT " + (t.canTakePT ? "Yes" : "No") + " · " + (t.active ? "Active" : "Inactive");
      t.name = name; t.short = short; t.canTakePT = pt; t.active = act;
      entry = { what: "Trainer type edited · " + name, from: from, to: name + " · " + short + " · PT " + (pt ? "Yes" : "No") + " · " + (act ? "Active" : "Inactive") };
    } else {
      list.push({ id: "tt" + Date.now(), name: name, short: short, canTakePT: pt, active: act });
      entry = { what: "Trainer type added · " + name, from: "—", to: name + " · " + short + " · PT " + (pt ? "Yes" : "No") };
    }
    P.saveTrainerTypes(list, entry); App.close(document.getElementById("ttDrawer")); S.ttErr = {}; S.ttEditId = null;
    App.toast("Trainer type saved · " + name, "success"); render();
  }

  // ----- Audit log -----
  function audit() {
    var log = P.auditLog().filter(function (x) { return S.auditTab === "All" || x.tab === S.auditTab; });
    return '<div class="filter-bar"><label class="cell-sub" for="auditFilter">Show</label><select class="input" id="auditFilter" aria-label="Filter by tab">' +
      ["All", "Permissions", "Settings values", "Notification rules", "Trainer types"].map(function (t) { return '<option' + (t === S.auditTab ? " selected" : "") + ">" + t + "</option>"; }).join("") + '</select><span class="muted">' + log.length + " change" + (log.length === 1 ? "" : "s") + "</span></div>" +
      '<div class="table-wrap"><table class="table table-admin" id="auditTable"><thead><tr><th>When</th><th>Who</th><th>Tab</th><th>What</th><th>Old → New</th></tr></thead><tbody>' +
      (log.length ? log.map(function (x) {
        return "<tr><td>" + esc(App.fmtWhen(x.at)) + "</td><td>" + esc(x.by) + "</td><td>" + esc(x.tab) + "</td><td>" + esc(x.what) + '</td><td><span class="muted">' + esc(x.from) + "</span> → <strong>" + esc(x.to) + "</strong></td></tr>";
      }).join("") : '<tr><td colspan="5"><div class="state"><h3>No changes yet</h3><p class="muted">Every saved change on the other tabs is listed here: who, when, what, old → new.</p></div></td></tr>') + "</tbody></table></div>";
  }

  // ----- Save bar + confirm -----
  function saveBar() {
    var bar = document.getElementById("saveBar"), n = 0, err = "";
    if (can() && A.debugState() === "normal") {
      if (S.tab === "permissions") { n = Object.keys(S.pending).length; err = assignError(); }
      if (S.tab === "values") { var cur = P.settings(); n = Object.keys(S.pendingSet).filter(function (k) { return S.pendingSet[k] !== cur[k]; }).length; var e = setErrors(); var ks = Object.keys(e); err = ks.length ? ks.length + " field" + (ks.length > 1 ? "s" : "") + " to fix" : ""; }
    }
    bar.hidden = !(n || err);
    document.getElementById("saveCount").textContent = n + " change" + (n === 1 ? "" : "s");
    document.getElementById("saveErr").textContent = err;
    var b = bar.querySelector('[data-rp="save"]'); b.disabled = !!err || !n || S.saving; b.innerHTML = S.saving ? "Saving…" : "Save";
    bar.querySelector('[data-rp="discard"]').disabled = S.saving;
  }
  function confirmSave() {
    var m = App.makeModal("rpConfirm"), list, rowsHtml;
    if (S.tab === "permissions") {
      list = pendingList();
      rowsHtml = list.map(function (c) { return "<tr><td>" + esc(c.role) + "</td><td>" + esc(c.label) + '</td><td><span class="muted">' + esc(c.from) + "</span> → <strong>" + esc(c.to) + "</strong></td></tr>"; }).join("");
      m.title.textContent = "Save " + list.length + " permission change" + (list.length === 1 ? "" : "s") + "?";
      m.body.innerHTML = '<p class="muted">Takes effect for everyone with these roles. Logged in the Audit log.</p><div class="table-wrap"><table class="table table-admin"><thead><tr><th>Role</th><th>Action</th><th>Old → New</th></tr></thead><tbody>' + rowsHtml + "</tbody></table></div>";
    } else {
      var cur = P.settings();
      list = D.settingDefs.filter(function (d) { return d.key in S.pendingSet && S.pendingSet[d.key] !== cur[d.key]; });
      rowsHtml = list.map(function (d) { return "<tr><td>" + esc(d.label) + '</td><td><span class="muted">' + esc(cur[d.key]) + "</span> → <strong>" + esc(S.pendingSet[d.key]) + "</strong></td></tr>"; }).join("");
      m.title.textContent = "Save " + list.length + " setting" + (list.length === 1 ? "" : "s") + "?";
      m.body.innerHTML = '<div class="table-wrap"><table class="table table-admin"><thead><tr><th>Setting</th><th>Old → New</th></tr></thead><tbody>' + rowsHtml + "</tbody></table></div>";
    }
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-rp="confirmSave">Save</button>';
    App.openModal("rpConfirm");
  }
  function doSave() {
    App.close(document.getElementById("rpConfirm")); S.saving = true; saveBar();
    setTimeout(function () {
      var log;
      if (S.tab === "permissions") { log = P.save(pendingList(), "Permissions"); S.pending = {}; }
      else { var v = {}; Object.keys(S.pendingSet).forEach(function (k) { v[k] = S.pendingSet[k]; }); log = P.saveSettings(v); S.pendingSet = {}; }
      S.saving = false; App.toast("Saved · " + log.length + " change" + (log.length === 1 ? "" : "s"), "success"); App.dataChanged(); render();
    }, 600);
  }
  function confirmReset(kind) {
    var m = App.makeModal("rpConfirm");
    m.title.textContent = kind === "perms" ? "Reset all permissions to defaults?" : "Reset settings values to defaults?";
    m.body.innerHTML = '<p>Every ' + (kind === "perms" ? "cell goes back to the default grid (notes v3 §2)" : "value goes back to its default") + ". Unsaved changes are dropped. This is logged in the Audit log.</p>";
    m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-danger" data-rp="' + (kind === "perms" ? "confirmReset" : "confirmResetSet") + '">Reset</button>';
    App.openModal("rpConfirm");
  }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    if (pop && !pop.contains(e.target) && !(e.target.closest && e.target.closest("[data-cell]") === popCell)) closePop();
    var t = e.target.closest("[data-rtab],[data-rp],[data-cell],[data-pick],[data-module],[data-setopt],[data-tt-act]"); if (!t) return;
    if (t.dataset.rtab) { S.tab = t.dataset.rtab; render(); return; }
    if (t.dataset.module) { S.collapsed[t.dataset.module] = !S.collapsed[t.dataset.module]; render(); return; }
    if (t.dataset.cell) { if (popCell === t) closePop(); else openPop(t); return; }
    if (t.dataset.pick) {
      var p = popCell.dataset.cell.split("|"), d = pdef(p[1]), v;
      if (d.type === "scope") v = t.dataset.pick;
      else if (d.type === "tick") v = t.dataset.pick === "true";
      else if (d.type === "pctcap") {
        var ip = document.getElementById("popNum"), ic = document.getElementById("popCap"), xp = Number(ip.value), xc = Number(ic.value);
        if (ip.value === "" || !(xp >= 0 && xp <= 100) || Math.floor(xp) !== xp) { document.getElementById("popErr").textContent = "Enter a whole % between 0 and 100."; ip.classList.add("invalid"); ip.focus(); return; }
        if (ic.value === "" || !(xc >= 0) || Math.floor(xc) !== xc) { document.getElementById("popErr").textContent = "Enter a whole ₹ amount (0 = no cap)."; ic.classList.add("invalid"); ic.focus(); return; }
        v = { pct: xp, cap: xc };
      }
      else {
        var inp = document.getElementById("popNum"), x = Number(inp.value);
        if (inp.value === "" || !(x >= 0 && x <= 100) || Math.floor(x) !== x) { document.getElementById("popErr").textContent = "Enter a whole number between 0 and 100."; inp.classList.add("invalid"); inp.focus(); return; }
        v = x;
      }
      pick(p[0], p[1], v); return;
    }
    if (t.dataset.setopt) { S.pendingSet[t.dataset.setopt] = t.dataset.val; render(); return; }
    if (t.dataset.ttAct) {
      var id = t.dataset.id, list = P.trainerTypes(), tt = list.filter(function (x) { return x.id === id; })[0];
      if (t.dataset.ttAct === "edit") { S.ttEditId = id; S.ttErr = {}; ttForm(); }
      if (t.dataset.ttAct === "toggle") { tt.active = !tt.active; P.saveTrainerTypes(list, { what: "Trainer type " + (tt.active ? "activated" : "deactivated") + " · " + tt.name, from: tt.active ? "Inactive" : "Active", to: tt.active ? "Active" : "Inactive" }); App.toast(tt.name + (tt.active ? " activated" : " deactivated"), ""); render(); }
      if (t.dataset.ttAct === "delete") {
        if (ttInUse(id)) { App.toast("In use: deactivate it instead", "error"); return; }
        var m = App.makeModal("rpConfirm"); m.title.textContent = "Delete " + tt.name + "?"; m.body.innerHTML = "<p>No trainer uses this type. It is removed from the list.</p>";
        m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-danger" data-rp="ttDelete" data-id="' + id + '">Delete</button>'; App.openModal("rpConfirm");
      }
      return;
    }
    var a = t.dataset.rp;
    if (a === "save") confirmSave();
    if (a === "confirmSave") doSave();
    if (a === "discard") { S.pending = {}; S.pendingSet = {}; App.toast("Changes discarded", ""); render(); }
    if (a === "reset") confirmReset("perms");
    if (a === "resetSet") confirmReset("set");
    if (a === "confirmReset") { App.close(document.getElementById("rpConfirm")); var l1 = P.resetAll(); S.pending = {}; App.toast("Permissions reset to defaults" + (l1.length ? " · " + l1.length + " change" + (l1.length === 1 ? "" : "s") : ""), "success"); render(); }
    if (a === "confirmResetSet") { App.close(document.getElementById("rpConfirm")); var l2 = P.resetSettings(); S.pendingSet = {}; App.toast("Settings reset to defaults" + (l2.length ? " · " + l2.length + " change" + (l2.length === 1 ? "" : "s") : ""), "success"); render(); }
    if (a === "clearSearch") { S.search = ""; render(); }
    if (a === "ttAdd") { S.ttEditId = null; S.ttErr = {}; ttForm(); }
    if (a === "ttSave") ttSave();
    if (a === "ttDelete") { var lst = P.trainerTypes(), del = lst.filter(function (x) { return x.id === t.dataset.id; })[0]; lst = lst.filter(function (x) { return x.id !== t.dataset.id; }); P.saveTrainerTypes(lst, { what: "Trainer type deleted · " + del.name, from: del.name + " · " + del.short, to: "—" }); App.close(document.getElementById("rpConfirm")); App.toast("Deleted · " + del.name, ""); render(); }
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "rpSearch") { S.search = t.value; var wrap = document.querySelector(".perm-wrap"); var sc = wrap ? wrap.scrollTop : 0; render(); var sb = document.getElementById("rpSearch"); sb.focus(); sb.setSelectionRange(sb.value.length, sb.value.length); var w2 = document.querySelector(".perm-wrap"); if (w2) w2.scrollTop = sc; }
    if (t.dataset.set) { S.pendingSet[t.dataset.set] = t.value === "" ? "" : Number(t.value); saveBar(); }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.set) render();
    if (t.id === "auditFilter") { S.auditTab = t.value; render(); }
  });
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.cell && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); if (popCell === t) closePop(); else openPop(t); return; }
    if (e.key === "Escape" && pop) { e.stopPropagation(); closePop(); return; }
    if (e.key === "Enter" && t.id === "popNum") { e.preventDefault(); pop.querySelector('[data-pick="num"]').click(); }
  }, true);
  window.addEventListener("resize", closePop);
  document.addEventListener("mock:context", function () { S.pending = {}; S.pendingSet = {}; render(); });
  document.addEventListener("mock:data", render);
  A.initDebug(render);
  document.addEventListener("DOMContentLoaded", render);
})();
