/* Profile drawer preview: a card per dummy person (edge cases) + ?debug states. */
(function () {
  var D = window.DUMMY, esc = App.esc;
  var ids = D.people.map(function (p) { return p.id; });

  function card(p) {
    var f = App.nextFollowUp(p.id), st = p.kind === "Client" ? App.membershipStatus(p.membership) : p.stage === "Lost" ? null : App.followUpStatus(f && App.dueIso(f));
    return '<div class="card preview-card">' +
      '<div class="stack"><span class="avatar">' + esc(App.initials(p.name)) + '</span><strong>' + esc(p.name) + "</strong></div>" +
      '<div class="stack mt-2">' + (p.kind === "Client" ? '<span class="badge badge-success">Client</span>' : '<span class="badge badge-info">Lead</span>') +
        '<span class="badge' + (p.stage === "Lost" ? " badge-danger" : "") + '">' + esc(p.stage) + "</span>" +
        (st ? '<span class="badge ' + st.badge + '">' + esc(st.text) + "</span>" : "") + "</div>" +
      '<p class="cell-sub">' + esc((p.note || "").replace(/^EDGE:\s*/, "")) + "</p>" +
      '<button class="btn btn-sm" data-open="' + p.id + '">Open profile</button></div>';
  }
  function render() { document.getElementById("people").innerHTML = D.people.map(card).join(""); }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open]"); if (b) App.openProfile(b.dataset.open, { list: ids });
    var s = e.target.closest("[data-open-state]"); if (s) App.openProfile("p1", { list: ids, state: s.dataset.openState });
  });
  App.openLead = function (id) { App.openProfile(id, { list: ids }); };
  document.addEventListener("mock:data", render);
  document.addEventListener("DOMContentLoaded", function () {
    if (App.isDebug()) document.getElementById("debugBar").hidden = false;
    render();
  });
})();
