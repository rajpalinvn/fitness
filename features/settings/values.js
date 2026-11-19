/* Settings values page (#120): Settings › General settings card. Opens for anyone who can edit at least one key;
   they see ALL values but edit only theirs (grid row named under each value; values with no row = CEO).
   "Reset to defaults" resets only the keys this user may edit. Same store + audit as the CEO's Roles & permissions tab. */
(function () {
  var D = DUMMY, P = App.Perm, A = App.Admin || window.Admin, esc = App.esc;
  var S = { pending: {}, state: "normal" };
  function pdef(k) { return D.permissionDefs.filter(function (d) { return d.key === k; })[0]; }
  function cur() { return P.settings(); }
  function val(k) { return k in S.pending ? S.pending[k] : cur()[k]; }
  function mine() { return P.editableSettings().map(function (d) { return d.key; }); }
  function errors() {
    var e = {}, v = {}; D.settingDefs.forEach(function (d) { v[d.key] = val(d.key); });
    D.settingDefs.forEach(function (d) {
      if (d.options || !(d.key in S.pending)) return;
      var x = S.pending[d.key];
      if (x === "" || isNaN(x) || Math.round(x) !== x || x < d.min || x > d.max) e[d.key] = "Enter a whole number " + d.min + "–" + d.max + ".";
    });
    if (!e.freeTrialsPerBranch && Number(v.freeTrialsPerBranch) > Number(v.freeTrialsPerPerson)) e.freeTrialsPerBranch = "Per branch can't be more than per person (" + v.freeTrialsPerPerson + ").";
    if (!e.releaseWarnDaysBefore && Number(v.releaseWarnDaysBefore) >= Number(v.inactivityReleaseDays)) e.releaseWarnDaysBefore = "Must be less than the inactivity days (" + v.inactivityReleaseDays + ").";
    return e;
  }
  function changed() { var c = cur(); return Object.keys(S.pending).filter(function (k) { return S.pending[k] !== c[k]; }); }
  function render() {
    var panel = document.getElementById("panel"), head = document.getElementById("headActions"), bar = document.getElementById("svBar");
    var st = (window.Admin && Admin.debugState) ? Admin.debugState() : "normal";
    head.innerHTML = ""; bar.hidden = true;
    if (st === "loading") { panel.innerHTML = '<div class="card"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>'; return; }
    if (st === "error") { panel.innerHTML = '<div class="card state">' + App.icon("alert") + "<h3>Couldn't load settings values</h3><p class=\"muted\">Please try again.</p></div>"; return; }
    var my = mine();
    if (!my.length) {
      panel.innerHTML = '<div class="state" data-sv-noaccess>' + App.icon("eye") + "<h3>You don't have access to settings values</h3><p class=\"muted\">This page opens for staff who can change at least one value (Settings → Roles &amp; permissions).</p></div>";
      return;
    }
    head.innerHTML = '<button class="btn btn-ghost" data-sv="reset">' + App.icon("refresh") + "Reset my values to defaults</button>";
    var errs = errors(), c = cur();
    panel.innerHTML = '<div class="callout">' + App.icon("info") + "<span>Numbers, not per role. You can change " + my.length + " of " + D.settingDefs.length +
      ' values (marked <strong>You can edit</strong>); the rest are shown read-only with who changes them. <span class="badge badge-demo">Default, can change</span></span></div>' +
      '<div class="card set-card">' + D.settingDefs.map(function (d) {
        var can = my.indexOf(d.key) > -1, v = val(d.key), eds = P.settingEditors(d), isCh = d.key in S.pending && S.pending[d.key] !== c[d.key];
        var who = "Changed by: " + (eds.length ? eds.join(", ") : "nobody yet") + (d.by === "CEO" ? "" : ' <span class="cell-sub">(grid row "' + esc(pdef(d.by).label) + '")</span>');
        var input = !can ? '<strong data-sv-ro="' + d.key + '">' + esc(v) + (d.unit && !d.options ? " " + esc(d.unit) : "") + '</strong> <span class="badge">Read-only</span>'
          : d.options ? '<div class="seg" role="radiogroup" aria-label="' + esc(d.label) + '">' + d.options.map(function (o) {
              var later = o.indexOf("Round-robin") === 0, on = v === o;
              return '<button type="button" class="seg-btn' + (on ? " active" : "") + '" role="radio" aria-checked="' + on + '" data-svopt="' + d.key + '" data-val="' + esc(o) + '"' + (later ? ' disabled title="Comes later (needs shift data for on-shift)"' : "") + ">" + esc(o) + "</button>"; }).join("") + "</div>"
          : '<div class="row row-tight"><input class="input input-num input-xs' + (errs[d.key] ? " invalid" : "") + '" type="number" id="sv-' + d.key + '" data-sv-key="' + d.key + '" min="' + d.min + '" max="' + d.max + '" step="1" value="' + esc(v) + '"><span>' + esc(d.unit) + "</span></div>";
        return '<div class="pref-row set-row" data-sv-row="' + d.key + '"><div><label class="pref-title" for="sv-' + d.key + '">' + esc(d.label) + "</label>" + (can ? ' <span class="badge badge-info">You can edit</span>' : "") +
          (isCh ? ' <span class="badge badge-info">Unsaved</span>' : c[d.key] !== d.def ? ' <span class="badge">Changed</span>' : "") +
          '<div class="cell-sub">' + esc(d.hint) + '</div><div class="cell-sub">Default ' + esc(d.def) + (d.unit && !d.options ? " " + esc(d.unit) : "") + " · " + who + "</div></div><div>" + input +
          (errs[d.key] ? '<div class="error">' + esc(errs[d.key]) + "</div>" : "") + "</div></div>";
      }).join("") + "</div>";
    var n = changed().length;
    if (n) {
      bar.hidden = false;
      bar.innerHTML = "<span>" + n + " unsaved change" + (n > 1 ? "s" : "") + (Object.keys(errs).length ? " · fix the fields in red" : "") + '</span><span class="stack"><button class="btn" data-sv="discard">Discard</button><button class="btn btn-primary" data-sv="save"' + (Object.keys(errs).length ? " disabled" : "") + ">Save</button></span>";
    }
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-sv],[data-svopt]"); if (!t) return;
    if (t.dataset.svopt) { if (mine().indexOf(t.dataset.svopt) > -1) S.pending[t.dataset.svopt] = t.dataset.val; render(); return; }
    var a = t.dataset.sv;
    if (a === "discard") { S.pending = {}; render(); }
    if (a === "save") {
      if (Object.keys(errors()).length) return;
      var my = mine(), v = {}; changed().forEach(function (k) { if (my.indexOf(k) > -1) v[k] = S.pending[k]; });   // only my keys
      var log = P.saveSettings(v); S.pending = {}; App.toast("Settings saved · " + log.length + " change" + (log.length === 1 ? "" : "s"), "success"); render();
    }
    if (a === "reset") {
      var m = App.makeModal("svConfirm"); m.title.textContent = "Reset your values to defaults?";
      var keys = mine();
      m.body.innerHTML = "<p>Only the values you can edit go back to their default (" + keys.length + "): " + esc(D.settingDefs.filter(function (d) { return keys.indexOf(d.key) > -1; }).map(function (d) { return d.label; }).join(", ")) + ". Other values stay as they are. Logged in the Audit log.</p>";
      m.foot.innerHTML = '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-save>Reset</button>';
      m.foot.querySelector("[data-save]").onclick = function () { var l = P.resetSettings(mine()); S.pending = {}; App.close(m.el); App.toast("Reset to defaults · " + l.length + " change" + (l.length === 1 ? "" : "s"), "success"); render(); };
      App.openModal("svConfirm");
    }
  });
  document.addEventListener("input", function (e) {
    var k = e.target.dataset && e.target.dataset.svKey; if (!k || mine().indexOf(k) < 0) return;
    S.pending[k] = e.target.value === "" ? "" : Number(e.target.value);
  });
  document.addEventListener("change", function (e) { var k = e.target.dataset && e.target.dataset.svKey; if (k) render(); });   // re-check + save bar when the field is left
  document.addEventListener("mock:context", function () { S.pending = {}; render(); });
  document.addEventListener("DOMContentLoaded", render);
  if (document.readyState !== "loading") render();
})();
