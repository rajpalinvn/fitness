/* Helpers shared by the Settings admin pages (Packages, Items).
     Admin.formDrawer(id)      -> { el, title, body, foot }  side drawer for a form
     Admin.banner(el, mode)    access banner: "edit" | "view" | "none"
     Admin.debugState()        "normal" | "loading" | "empty" | "error" (only with ?debug)
     Admin.money(n), Admin.chipSeg(name, options, value, disabled)
   Load after shell.js. */
(function () {
  var esc = App.esc, Admin = {};

  Admin.formDrawer = function (id) {
    var d = document.getElementById(id);
    if (!d) {
      d = document.createElement("aside"); d.id = id; d.className = "drawer drawer-form";
      d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", id + "-t");
      d.innerHTML = '<div class="drawer-head"><h2 id="' + id + '-t" data-d-title></h2>' +
        '<button class="btn btn-ghost icon-btn" data-close aria-label="Close">' + App.icon("x") + "</button></div>" +
        '<div class="drawer-body" data-d-body></div><div class="drawer-foot" data-d-foot></div>';
      document.body.appendChild(d);
    }
    return { el: d, title: d.querySelector("[data-d-title]"), body: d.querySelector("[data-d-body]"), foot: d.querySelector("[data-d-foot]") };
  };

  // Placeholder access (decision #56) — shown as words, never colour alone.
  Admin.banner = function (el, mode, what) {
    el.hidden = mode === "edit";
    if (mode === "view") el.innerHTML = '<div class="callout">' + App.icon("eye") + "<span><strong>View only.</strong> Only SuperAdmin and CEO can create or edit " + esc(what) +
      '. <span class="badge badge-demo">Placeholder</span> until the permission matrix.</span></div>';
  };
  Admin.noAccess = function (what) {
    return '<div class="state">' + App.icon("eye") + "<h3>You don't have access to " + esc(what) + '</h3><p class="muted">Ask a manager. ' +
      '<span class="badge badge-demo">Placeholder</span> access until the permission matrix. Switch "View as" in the avatar menu to try another role.</p></div>';
  };

  Admin.debugState = function () {
    if (!App.isDebug()) return "normal";
    return Admin._state || "normal";
  };
  Admin.initDebug = function (render) {
    var bar = document.getElementById("debugBar"); if (!bar) return;
    bar.hidden = !App.isDebug();
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-state]"); if (!b) return;
      Admin._state = b.dataset.state; render();
      if (Admin._state === "loading") setTimeout(function () { if (Admin._state === "loading") { Admin._state = "normal"; render(); } }, 900);
    });
  };
  Admin.stateHtml = function (st, emptyText, cols) {
    if (st === "loading") { var r = ""; for (var i = 0; i < 5; i++) r += '<tr class="skel-row"><td colspan="' + cols + '"><div class="skeleton"></div></td></tr>'; return r; }
    if (st === "error") return '<tr><td colspan="' + cols + '"><div class="state">' + App.icon("alert") + "<h3>Couldn't load this list</h3>" +
      '<button class="btn" data-state-retry>Retry</button></div></td></tr>';
    return '<tr><td colspan="' + cols + '"><div class="state">' + emptyText + "</div></td></tr>";
  };
  document.addEventListener("click", function (e) { if (e.target.closest("[data-state-retry]")) { Admin._state = "normal"; document.dispatchEvent(new CustomEvent("mock:data")); } });

  Admin.money = function (n) { return n == null || n === "" || isNaN(n) ? "—" : App.fmtMoney(Math.round(Number(n) * 100) / 100); };
  Admin.chipSeg = function (name, options, value, disabled) {
    return '<div class="seg" role="radiogroup">' + options.map(function (o) {
      var v = typeof o === "string" ? o : o[0], t = typeof o === "string" ? o : o[1], on = String(v) === String(value);
      return '<button type="button" class="seg-btn' + (on ? " active" : "") + '" role="radio" aria-checked="' + on + '" data-seg="' + name + '" data-val="' + esc(v) + '"' +
        (disabled ? " disabled" : "") + ">" + esc(t) + "</button>";
    }).join("") + "</div>";
  };
  Admin.branchNames = function (ids) {
    if (ids.length === DUMMY.branches.length) return "All branches";
    return ids.map(App.branchName).join(", ");
  };
  Admin.err = function (errors, k) { return errors[k] ? '<span class="error">' + errors[k] + "</span>" : ""; };

  window.Admin = Admin;
})();
