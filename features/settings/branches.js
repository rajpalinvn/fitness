/* Settings → Branches & staff (#124). Tabs: Branches (Region, City, Club Manager, Region filter; add / edit form) · Staff (role + branches).
   Access = grid rows (#125): admin.viewBranches / editBranches / viewStaff / editStaff (scope), admin.regions (tick).
   CEO all; RM + CM view / edit their own branches; Regions tab + a branch's Region field: admin.regions only.
   Multi-branch roles: Regional Manager, Finance, HR, Marketing (CEO = all branches); every other role exactly one branch. */
(function () {
  var D = window.DUMMY, esc = App.esc, A = window.Admin;
  var ALL_TABS = [["branches", "Branches", "admin.viewBranches"], ["staff", "Staff", "admin.viewStaff"], ["regions", "Regions", "admin.regions"]];
  function TABS_() { return ALL_TABS.filter(function (t) { var s = App.can(t[2]); return !!s && s !== "None"; }); }
  var S = { tab: (/[?&]tab=(\w+)/.exec(location.search) || [])[1] || "branches", region: "", editing: null, F: null, errors: {} };
  var PIN_RE = /^[1-9][0-9]{5}$/, EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  function has(k) { return App.scopeBranches(k); }
  function canRegions() { return App.can("admin.regions") === true; }
  function canEditBranch(id) { return id ? has("admin.editBranches").indexOf(id) > -1 : App.can("admin.editBranches") === "All"; }
  function roleOf(u) { return D.roles.filter(function (r) { return r.key === u.roleKey; })[0] || {}; }
  function canEditStaff(u) {
    if (!u) return false;
    if (App.can("admin.editStaff") === "All") return true;
    var mine = has("admin.editStaff");
    return u.branchIds.length > 0 && u.branchIds.every(function (b) { return mine.indexOf(b) > -1; }) && !App.isTopShort(roleOf(u).short);
  }
  App.Branches = { canEditBranch: canEditBranch, canEditStaff: canEditStaff };
  function render() {
    var TABS = TABS_();
    if (!TABS.length) {
      document.getElementById("bsTabs").innerHTML = ""; document.getElementById("banner").hidden = true; document.getElementById("headActions").innerHTML = "";
      document.getElementById("panel").innerHTML = '<div data-bs-noaccess>' + A.noAccess("branches and staff") + "</div>"; return;
    }
    if (!TABS.some(function (t) { return t[0] === S.tab; })) S.tab = TABS[0][0];
    document.getElementById("bsTabs").innerHTML = TABS.map(function (t) {
      var on = t[0] === S.tab; return '<button class="tab' + (on ? " active" : "") + '" role="tab" aria-selected="' + on + '" data-btab="' + t[0] + '">' + t[1] + "</button>";
    }).join("");
    var ban = document.getElementById("banner"), edits = S.tab === "branches" ? has("admin.editBranches").length > 0 : S.tab === "staff" ? has("admin.editStaff").length > 0 : canRegions();
    ban.hidden = edits;
    if (!edits) ban.innerHTML = '<div class="callout">' + App.icon("eye") + "<span><strong>View only.</strong> Editing comes from Settings → Roles &amp; permissions (Admin rows).</span></div>";
    document.getElementById("headActions").innerHTML = S.tab === "branches" && canEditBranch(null) ? '<button class="btn btn-primary" data-bs="add">' + App.icon("plus") + "Branch</button>"
      : S.tab === "regions" && canRegions() ? '<button class="btn btn-primary" data-bs="addRegion">' + App.icon("plus") + "Region</button>" : "";
    var panel = document.getElementById("panel"), st = A.debugState(), cols = S.tab === "branches" ? 6 : 4;
    if (st !== "normal") { panel.innerHTML = '<div class="table-wrap"><table class="table table-admin"><tbody>' + A.stateHtml(st, "<h3>No branches yet</h3>", cols) + "</tbody></table></div>"; return; }
    panel.innerHTML = S.tab === "branches" ? branches() : S.tab === "staff" ? staff() : regions();
    var rf = document.getElementById("fRegion"); if (rf) App.enhanceSelect(rf);
  }

  function branches() {
    var vis = has("admin.viewBranches");
    var list = D.branches.filter(function (b) { return vis.indexOf(b.id) > -1 && (!S.region || b.regionId === S.region); });
    return '<div class="row mb-3"><div class="field"><label for="fRegion">Region</label><select class="input" id="fRegion" data-bs-filter>' +
        '<option value="">All regions</option>' + D.regions.map(function (r) { return '<option value="' + r.id + '"' + (S.region === r.id ? " selected" : "") + ">" + esc(r.name) + "</option>"; }).join("") + "</select></div></div>" +
      '<div class="table-wrap"><table class="table table-admin"><thead><tr><th>Branch</th><th>Region</th><th>City</th><th>Club Manager</th><th>GSTIN</th><th></th></tr></thead><tbody id="rows">' +
      (list.length ? list.map(function (b) {
        var cm = App.branchCM(b.id);
        return '<tr data-id="' + b.id + '"><td><strong>' + esc(b.name) + '</strong><div class="cell-sub">' + esc(App.stateName(b.stateCode)) + (b.pin ? " · " + esc(b.pin) : "") + "</div></td>" +
          "<td>" + esc(App.regionName(b.regionId)) + "</td><td>" + esc(App.empty(b.city)) + "</td>" +
          "<td>" + (cm.length ? esc(cm.map(function (u) { return u.name; }).join(", ")) : '<span class="muted">Not set yet</span>') + "</td>" +
          "<td>" + esc(App.empty(b.gstin, "Not set yet")) + "</td>" +
          '<td><button class="btn btn-sm" data-bs="edit" data-id="' + b.id + '">' + (canEditBranch(b.id) ? "Edit" : "View") + "</button></td></tr>";
      }).join("") : '<tr><td colspan="6"><div class="state"><h3>No branches in this region</h3><button class="btn" data-bs="clear">Clear filter</button></div></td></tr>') +
      "</tbody></table></div>";
  }

  function staff() {
    var vis = has("admin.viewStaff"), all = App.can("admin.viewStaff") === "All";
    var list = D.users.filter(function (u) { return !u.platform && (all || u.branchIds.some(function (b) { return vis.indexOf(b) > -1; })); });
    return '<p class="muted">Multi-branch roles: Regional Manager, Finance, HR, Marketing. The ' + esc(App.topRole().name) + ' has all branches. Every other role has exactly one branch.</p>' +
      '<div class="table-wrap"><table class="table table-admin"><thead><tr><th>Name</th><th>Role</th><th>Branches</th><th></th></tr></thead><tbody id="rows">' +
      list.map(function (u) {
        var mode = App.roleBranchMode(u.roleKey);
        return '<tr data-id="' + u.id + '"><td><span class="avatar avatar-sm">' + esc(App.initials(u.name)) + "</span> " + esc(u.name) + "</td><td>" + esc(u.role) +
          '<div class="cell-sub">' + (mode === "multi" ? "Multi-branch" : mode === "all" ? "All branches" : "One branch") + "</div></td>" +
          "<td>" + esc(mode === "all" ? "All branches" : A.branchNames(u.branchIds)) + "</td>" +
          '<td><button class="btn btn-sm" data-bs="staff" data-id="' + u.id + '">' + (canEditStaff(u) ? "Edit" : "View") + "</button></td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  // ---------- Branch form ----------
  function openBranch(b) {
    S.editing = b ? b.id : null; S.errors = {};
    S.F = b ? JSON.parse(JSON.stringify(b)) : { name: "", regionId: "", city: "", stateCode: "", pin: "", gstin: "", email: "" };
    branchForm(); App.openDrawer("branchDrawer");
  }
  function opt(v, t, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur || "") ? " selected" : "") + ">" + esc(t) + "</option>"; }
  function branchForm() {
    var ok = canEditBranch(S.editing), d = A.formDrawer("branchDrawer"), F = S.F, E = S.errors, dis = ok ? "" : " disabled", rdis = dis || (canRegions() ? "" : " disabled");
    d.title.textContent = S.editing ? (ok ? "Edit branch" : "Branch") : "New branch";
    d.body.innerHTML = '<div class="form-grid">' +
      '<div class="field"><label for="brName">Branch name <span class="req">*</span></label><input class="input" id="brName" data-bf="name" value="' + esc(F.name || "") + '"' + dis + ">" + A.err(E, "name") + "</div>" +
      '<div class="field"><label for="brRegion">Region <span class="req">*</span></label><select class="input" id="brRegion" data-bf="regionId"' + rdis + ">" + opt("", "Pick a region", F.regionId) +
        D.regions.filter(function (r) { return r.active !== false || r.id === F.regionId; }).map(function (r) { return opt(r.id, r.name + (r.active === false ? " (switched off)" : ""), F.regionId); }).join("") +
        '</select><span class="hint">' + (canRegions() ? "Switched-off regions can't be picked." : "Only the " + esc(App.topRole().name) + " sets a branch's region.") + "</span>" + A.err(E, "regionId") + "</div>" +
      '<div class="field"><label for="brCity">City <span class="req">*</span></label><input class="input" id="brCity" data-bf="city" value="' + esc(F.city || "") + '"' + dis + ">" + A.err(E, "city") + "</div>" +
      '<div class="field"><label for="brState">State <span class="req">*</span></label><select class="input" id="brState" data-bf="stateCode"' + dis + ">" + opt("", "Pick a state", F.stateCode) +
        D.states.map(function (s) { return opt(s.code, s.name, F.stateCode); }).join("") + "</select>" + A.err(E, "stateCode") + "</div>" +
      '<div class="field"><label for="brPin">PIN code <span class="req">*</span></label><input class="input" id="brPin" data-bf="pin" inputmode="numeric" maxlength="6" value="' + esc(F.pin || "") + '"' + dis + '><span class="hint">6 digits.</span>' + A.err(E, "pin") + "</div>" +
      '<div class="field"><label for="brGstin">GSTIN</label><input class="input" id="brGstin" data-bf="gstin" maxlength="15" value="' + esc(F.gstin || "") + '"' + dis + '><span class="hint">Optional. 15 characters; starts with the state\'s GST code' +
        (F.stateCode ? " (" + esc(F.stateCode) + ")" : "") + ".</span>" + A.err(E, "gstin") + "</div>" +
      '<div class="field"><label for="brEmail">Email</label><input class="input" id="brEmail" data-bf="email" type="email" value="' + esc(F.email || "") + '"' + dis + ">" + A.err(E, "email") + "</div>" +
      "</div>";
    d.foot.innerHTML = '<button class="btn" data-close>' + (ok ? "Cancel" : "Close") + "</button>" + (ok ? '<button class="btn btn-primary" data-bs="saveBranch">' + (S.editing ? "Save" : "Add branch") + "</button>" : "");
    Array.prototype.forEach.call(d.body.querySelectorAll("select"), App.enhanceSelect);
  }
  function readBranch() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-bf]"), function (i) { S.F[i.dataset.bf] = i.value.trim(); });
    S.F.gstin = (S.F.gstin || "").toUpperCase();
  }
  App.validateBranch = function (F, id) {
    var E = {};
    if (!F.name) E.name = "Enter the branch name.";
    else if (D.branches.some(function (b) { return b.id !== id && b.name.toLowerCase() === F.name.toLowerCase(); })) E.name = "A branch with this name already exists.";
    if (!F.regionId) E.regionId = "Pick a region.";
    if (!F.city) E.city = "Enter the city.";
    if (!F.stateCode) E.stateCode = "Pick a state.";
    if (!F.pin) E.pin = "Enter the PIN code.";
    else if (!PIN_RE.test(F.pin)) E.pin = "PIN code must be 6 digits.";
    if (F.gstin) {
      if (!GSTIN_RE.test(F.gstin)) E.gstin = "GSTIN must be 15 characters, e.g. 06AAAAA0000A1Z5.";
      else if (F.stateCode && F.gstin.slice(0, 2) !== F.stateCode) E.gstin = "GSTIN must start with " + F.stateCode + " (" + App.stateName(F.stateCode) + ").";
    }
    if (F.email && !EMAIL_RE.test(F.email)) E.email = "Enter a valid email.";
    return E;
  };
  function saveBranch() {
    readBranch(); S.errors = App.validateBranch(S.F, S.editing);
    if (Object.keys(S.errors).length) { branchForm(); return; }
    if (S.editing && !canRegions()) S.F.regionId = App.byId(D.branches, S.editing).regionId;   // region: admin.regions only
    var rec = { name: S.F.name, regionId: S.F.regionId, city: S.F.city, stateCode: S.F.stateCode, pin: S.F.pin, gstin: S.F.gstin || null, email: S.F.email || null };
    if (S.editing) { var b = App.byId(D.branches, S.editing); Object.keys(rec).forEach(function (k) { b[k] = rec[k]; }); App.toast("Branch saved · " + rec.name, "success"); }
    else { rec.id = "bn" + Date.now(); rec.tenantId = "t1"; D.branches.push(rec); App.toast("Branch added · " + rec.name, "success"); }
    App.close(document.getElementById("branchDrawer")); App.dataChanged();
  }

  // ---------- Staff form (role + branches) ----------
  function openStaff(u) { S.editing = u.id; S.errors = {}; S.F = { roleKey: u.roleKey, branchIds: u.branchIds.slice() }; staffForm(); App.openDrawer("staffDrawer"); }
  function staffForm() {
    var d = A.formDrawer("staffDrawer"), u = App.byId(D.users, S.editing), F = S.F, mode = App.roleBranchMode(F.roleKey), ok = canEditStaff(u), dis = ok ? "" : " disabled", br;
    // Branch scope: picks only my branches; nobody but the top role can give the top role.
    var pick = App.can("admin.editStaff") === "All" || !ok ? D.branches : D.branches.filter(function (b) { return has("admin.editStaff").indexOf(b.id) > -1; });
    var roles = D.roles.filter(function (r) { return App.isTopRole() || !App.isTopShort(r.short) || r.key === F.roleKey; });
    d.title.textContent = u.name;
    if (mode === "all") br = '<div class="field"><label>Branches</label><div><strong>All branches</strong> <span class="cell-sub">The ' + esc(App.topRole().name) + " has every branch.</span></div></div>";
    else if (mode === "multi") br = '<div class="field span-2"><label>Branches <span class="req">*</span></label><div class="check-list">' + pick.map(function (b) {
        return '<label class="check"><input type="checkbox" data-sf-branch="' + b.id + '"' + (F.branchIds.indexOf(b.id) > -1 ? " checked" : "") + dis + "> " + esc(b.name) + ' <span class="cell-sub">' + esc(App.regionName(b.regionId)) + "</span></label>";
      }).join("") + '</div><span class="hint">Multi-branch role: pick one or more branches.</span>' + A.err(S.errors, "branchIds") + "</div>";
    else br = '<div class="field"><label for="sfBranch">Branch <span class="req">*</span></label><select class="input" id="sfBranch" data-sf="branch"' + dis + ">" + opt("", "Pick a branch", F.branchIds[0]) +
        pick.map(function (b) { return opt(b.id, b.name, F.branchIds[0]); }).join("") + '</select><span class="hint">This role works at exactly one branch.</span>' + A.err(S.errors, "branchIds") + "</div>";
    d.body.innerHTML = '<div class="form-grid"><div class="field"><label for="sfRole">Role <span class="req">*</span></label><select class="input" id="sfRole" data-sf="role"' + dis + ">" +
      roles.map(function (r) { return opt(r.key, r.name, F.roleKey); }).join("") + "</select></div>" + br + "</div>";
    d.foot.innerHTML = '<button class="btn" data-close>' + (ok ? "Cancel" : "Close") + "</button>" + (ok ? '<button class="btn btn-primary" data-bs="saveStaff">Save</button>' : "");
    Array.prototype.forEach.call(d.body.querySelectorAll("select"), App.enhanceSelect);
  }
  App.validateStaffBranches = function (roleKey, ids) {
    var mode = App.roleBranchMode(roleKey);
    if (mode === "single" && ids.length !== 1) return "Pick one branch.";
    if (mode === "multi" && ids.length < 1) return "Pick at least one branch.";
    return "";
  };
  function saveStaff() {
    var u = App.byId(D.users, S.editing), mode = App.roleBranchMode(S.F.roleKey);
    var ids = mode === "all" ? D.branches.map(function (b) { return b.id; }) : S.F.branchIds;
    var e = App.validateStaffBranches(S.F.roleKey, ids);
    if (e) { S.errors = { branchIds: e }; staffForm(); return; }
    var r = D.roles.filter(function (x) { return x.key === S.F.roleKey; })[0];
    u.roleKey = r.key; u.role = r.name; u.branchIds = ids.slice(); u.branches = ids.slice();
    App.toast("Saved · " + u.name, "success"); App.close(document.getElementById("staffDrawer")); App.dataChanged();
  }

  // ---------- Regions (#125): admin.regions only. Add / rename / switch off. Switched-off regions can't be picked for a branch. ----------
  function regions() {
    var ok = canRegions();
    return '<p class="muted">Regions group branches (branch switcher, Branches filter). They are not a permission scope.</p>' +
      (S.regionEdit ? '<div class="card mb-3"><div class="form-grid"><div class="field"><label for="rgName">Region name <span class="req">*</span></label><input class="input" id="rgName" value="' + esc(S.regionEdit.name) + '">' +
        A.err(S.errors, "rname") + '</div></div><div class="stack"><button class="btn" data-bs="cancelRegion">Cancel</button><button class="btn btn-primary" data-bs="saveRegion">' + (S.regionEdit.id ? "Save" : "Add region") + "</button></div></div>" : "") +
      '<div class="table-wrap"><table class="table table-admin"><thead><tr><th>Region</th><th>Branches</th><th>Status</th><th></th></tr></thead><tbody id="rows">' +
      D.regions.map(function (r) {
        var n = D.branches.filter(function (b) { return b.regionId === r.id; }).length, on = r.active !== false;
        return '<tr data-id="' + r.id + '"><td><strong>' + esc(r.name) + "</strong></td><td>" + n + "</td><td>" +
          '<label class="switch"><input type="checkbox" data-region-on="' + r.id + '"' + (on ? " checked" : "") + (ok ? "" : " disabled") + "><span>" + (on ? "Active" : "Switched off") + "</span></label></td>" +
          "<td>" + (ok ? '<button class="btn btn-sm" data-bs="renameRegion" data-id="' + r.id + '">Rename</button>' : "") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  App.validateRegion = function (name, id) {
    if (!name) return "Enter the region name.";
    if (D.regions.some(function (r) { return r.id !== id && r.name.toLowerCase() === name.toLowerCase(); })) return "A region with this name already exists.";
    return "";
  };
  function saveRegion() {
    var name = document.getElementById("rgName").value.trim(), e = App.validateRegion(name, S.regionEdit.id);
    if (e) { S.regionEdit.name = name; S.errors = { rname: e }; render(); return; }
    if (S.regionEdit.id) { App.byId(D.regions, S.regionEdit.id).name = name; App.toast("Region renamed · " + name, "success"); }
    else { D.regions.push({ id: "rn" + Date.now(), name: name, tenantId: "t1", active: true }); App.toast("Region added · " + name, "success"); }
    S.regionEdit = null; S.errors = {}; App.dataChanged();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-btab],[data-bs]"); if (!t) return;
    if (t.dataset.btab) { S.tab = t.dataset.btab; S.regionEdit = null; render(); return; }
    var a = t.dataset.bs;
    if (a === "add" && canEditBranch(null)) openBranch(null);
    if (a === "addRegion" && canRegions()) { S.regionEdit = { name: "" }; S.errors = {}; render(); document.getElementById("rgName").focus(); }
    if (a === "renameRegion" && canRegions()) { var r = App.byId(D.regions, t.dataset.id); S.regionEdit = { id: r.id, name: r.name }; S.errors = {}; render(); }
    if (a === "cancelRegion") { S.regionEdit = null; S.errors = {}; render(); }
    if (a === "saveRegion" && canRegions()) saveRegion();
    if (a === "edit") openBranch(App.byId(D.branches, t.dataset.id));
    if (a === "clear") { S.region = ""; render(); }
    if (a === "saveBranch" && canEditBranch(S.editing)) saveBranch();
    if (a === "staff") openStaff(App.byId(D.users, t.dataset.id));
    if (a === "saveStaff" && canEditStaff(App.byId(D.users, S.editing))) saveStaff();
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.hasAttribute("data-bs-filter")) { S.region = t.value; render(); return; }
    if (t.dataset.regionOn && canRegions()) { var rg = App.byId(D.regions, t.dataset.regionOn); rg.active = t.checked; App.toast(rg.name + (t.checked ? " switched on" : " switched off"), ""); App.dataChanged(); return; }
    if (t.dataset.bf === "stateCode") { readBranch(); branchForm(); return; }   // hint shows the state's GST code
    if (t.dataset.sf === "role") {
      S.F.roleKey = t.value;
      if (App.roleBranchMode(t.value) === "single") S.F.branchIds = S.F.branchIds.slice(0, 1);
      S.errors = {}; staffForm(); return;
    }
    if (t.dataset.sf === "branch") { S.F.branchIds = t.value ? [t.value] : []; return; }
    if (t.dataset.sfBranch) {
      var id = t.dataset.sfBranch, i = S.F.branchIds.indexOf(id);
      if (t.checked && i < 0) S.F.branchIds.push(id);
      if (!t.checked && i > -1) S.F.branchIds.splice(i, 1);
    }
  });
  document.addEventListener("mock:context", render);
  document.addEventListener("mock:data", render);
  A.initDebug(render);
  document.addEventListener("DOMContentLoaded", render);
})();
