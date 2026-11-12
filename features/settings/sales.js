/* Settings → Sales rules. Tabs: Discount limits (max % per role) · Payment methods.
   Decisions #77, #80. Edit: SuperAdmin + CEO. View: managers. Others: no access (placeholder access, #56). */
(function () {
  var D = window.DUMMY, esc = App.esc, A = window.Admin;
  var TABS = [["limits", "Discount limits"], ["methods", "Payment methods"]];
  var S = { tab: (/[?&]tab=(\w+)/.exec(location.search) || [])[1] || "limits", adding: false, err: "" };

  function can() { return App.access.salesRules(); }
  function render() {
    if (!TABS.some(function (t) { return t[0] === S.tab; })) S.tab = "limits";
    document.getElementById("srTabs").innerHTML = TABS.map(function (t) {
      var on = t[0] === S.tab; return '<button class="tab' + (on ? " active" : "") + '" role="tab" aria-selected="' + on + '" data-stab="' + t[0] + '">' + t[1] + "</button>";
    }).join("");
    var panel = document.getElementById("panel"), view = App.access.viewMasters();
    A.banner(document.getElementById("banner"), !view ? "none" : can() ? "edit" : "view", S.tab === "limits" ? "discount limits" : "payment methods");
    document.getElementById("headActions").innerHTML = S.tab === "methods" && can() && !S.adding ? '<button class="btn btn-primary" data-sr="add">' + App.icon("plus") + "Payment method</button>" : "";
    if (!view) { panel.innerHTML = A.noAccess("sales rules"); return; }
    var st = A.debugState();
    if (st !== "normal") { panel.innerHTML = '<div class="table-wrap"><table class="table table-admin"><tbody>' + A.stateHtml(st, st === "empty" ? "<h3>Nothing set up yet</h3>" : "", 4) + "</tbody></table></div>"; return; }
    panel.innerHTML = S.tab === "limits" ? limits() : methods();
  }
  function limits() {
    var roles = D.roles;
    var mp = App.minFirstPayPct(), mpd = D.salesRuleDefaults.minFirstPayPct;
    return '<div class="card mb-3 min-pay"><div><div class="pref-title" id="mpT">Minimum first payment on packages</div><div class="cell-sub">At conversion at least this % of the package after discount ' +
        "must be paid, plus accessories and the key fob deposit in full. Later installments (Collect payment) can be any amount up to the balance.</div></div>" +
        '<div class="row row-tight">' + (can() ? '<input class="input input-num input-xs" type="number" min="0" max="100" value="' + mp + '" data-minpay aria-labelledby="mpT"><span>%</span>' : "<strong>" + mp + "%</strong>") +
        ' <span class="cell-sub">default ' + mpd + "%</span>" + (mp !== mpd ? ' <span class="badge badge-info">Changed</span>' : "") + ' <span class="badge badge-demo">Default, can change</span></div></div>' +
      '<p class="muted">Highest discount each role can give on a <strong>package</strong> in Sell mode. Accessories and the key fob deposit are never discounted. ' +
      '<span class="badge badge-demo">Default, can change</span></p>' +
      '<div class="table-wrap"><table class="table table-admin"><thead><tr><th>Role</th><th>Max discount</th><th>Default</th></tr></thead><tbody>' +
      roles.map(function (r) {
        var v = App.discountLimit(r), def = D.discountLimitDefaults[r];
        return "<tr><td>" + esc(r) + "</td><td>" + (can()
          ? '<div class="row row-tight"><input class="input input-num input-xs" type="number" min="0" max="100" value="' + v + '" data-limit="' + esc(r) + '" aria-label="Max discount for ' + esc(r) + '"><span>%</span></div>'
          : v + "%") + '</td><td class="muted">' + def + "%" + (v !== def ? ' <span class="badge badge-info">Changed</span>' : "") + "</td></tr>";
      }).join("") + "</tbody></table></div>" + (S.err ? '<p class="error">' + esc(S.err) + "</p>" : "");
  }
  function methods() {
    var list = D.paymentMethods;
    return '<p class="muted">Methods staff can pick in the Payment step. Online payment (gateway) comes later. <span class="badge badge-demo">Default, can change</span></p>' +
      (S.adding ? '<div class="card mb-3"><div class="form-grid"><div class="field"><label for="pmName">Name <span class="req">*</span></label><input class="input" id="pmName" placeholder="e.g. Cheque">' +
        (S.err ? '<span class="error">' + esc(S.err) + "</span>" : "") + "</div>" +
        '<div class="field"><label>Reference no.</label><label class="switch"><input type="checkbox" id="pmRef" checked><span>Required</span></label></div></div>' +
        '<div class="stack"><button class="btn" data-sr="cancel">Cancel</button><button class="btn btn-primary" data-sr="save">Add method</button></div></div>' : "") +
      '<div class="table-wrap"><table class="table table-admin"><thead><tr><th>Method</th><th>Reference / transaction no.</th><th>Status</th></tr></thead><tbody>' +
      list.map(function (m) {
        return "<tr><td>" + esc(m.name) + (m.isDefault ? ' <span class="cell-sub">default</span>' : "") + "</td><td>" + (m.needsRef ? "Required" : "Not needed") + "</td><td>" +
          (can() ? '<label class="switch"><input type="checkbox" data-pm="' + m.id + '"' + (m.active ? " checked" : "") + '><span>' + (m.active ? "Active" : "Disabled") + "</span></label>"
            : '<span class="badge ' + (m.active ? "badge-success" : "") + '">' + (m.active ? "Active" : "Disabled") + "</span>") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-stab],[data-sr]"); if (!t) return;
    if (t.dataset.stab) { S.tab = t.dataset.stab; S.adding = false; S.err = ""; render(); return; }
    var a = t.dataset.sr;
    if (a === "add") { S.adding = true; S.err = ""; render(); var n = document.getElementById("pmName"); if (n) n.focus(); }
    if (a === "cancel") { S.adding = false; S.err = ""; render(); }
    if (a === "save") {
      var name = document.getElementById("pmName").value.trim();
      if (!name) S.err = "Enter a name.";
      else if (D.paymentMethods.some(function (m) { return m.name.toLowerCase() === name.toLowerCase(); })) S.err = "This method already exists.";
      else { S.err = ""; S.adding = false; D.paymentMethods.push({ id: "pm" + (D.paymentMethods.length + 1), name: name, needsRef: document.getElementById("pmRef").checked, active: true, isDefault: false }); App.toast("Payment method added · " + name, "success"); }
      render();
    }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.limit) {
      var v = Number(t.value);
      if (t.value === "" || !(v >= 0 && v <= 100)) { S.err = "Max discount must be between 0 and 100%."; render(); return; }
      S.err = ""; D.discountLimits[t.dataset.limit] = Math.round(v * 100) / 100; App.toast(t.dataset.limit + ": max discount " + v + "%", "success"); render();
    }
    if (t.hasAttribute("data-minpay")) {
      var x = Number(t.value);
      if (t.value === "" || !(x >= 0 && x <= 100)) { S.err = "Minimum first payment must be between 0 and 100%."; render(); return; }
      S.err = ""; D.salesRules.minFirstPayPct = Math.round(x * 100) / 100; App.toast("Minimum first payment: " + x + "%", "success"); render(); return;
    }
    if (t.dataset.pm) {
      var m = App.byId(D.paymentMethods, t.dataset.pm);
      if (!t.checked && App.activePayMethods().length === 1) { App.toast("At least one method must stay active", "error"); render(); return; }
      m.active = t.checked; App.toast(m.name + (m.active ? " enabled" : " disabled"), ""); render();
    }
  });
  document.addEventListener("mock:context", render);
  document.addEventListener("mock:data", render);
  A.initDebug(render);
  document.addEventListener("DOMContentLoaded", render);
})();
