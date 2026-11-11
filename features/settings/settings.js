/* Settings: Display preferences (live) + "Coming soon" club setup cards. */
(function () {
  var esc = App.esc;
  var PREFS = [
    { k: "drawer", t: "Drawer width", d: "How wide profiles open over the list. Tablet always uses at least 92%.",
      o: [["60", "60%"], ["70", "70%"], ["80", "80%"], ["92", "92%"]] },
    { k: "density", t: "Density", d: "Padding and spacing between items.",
      o: [["compact", "Compact"], ["comfortable", "Comfortable"], ["spacious", "Spacious"]] },
    { k: "text", t: "Text size", d: "Size of all text in the app.",
      o: [["small", "Small"], ["medium", "Medium"], ["large", "Large"]] },
    { k: "search", t: "Search bar width", d: "Width of the search bar in the top bar.",
      o: [["narrow", "Narrow"], ["medium", "Medium"], ["wide", "Wide"]] },
    { k: "sidebar", t: "Sidebar default", d: "How the sidebar starts on desktop. Tablet always starts collapsed.",
      o: [["expanded", "Expanded"], ["collapsed", "Collapsed"]] }
  ];
  var SOON = [
    ["key", "Key fob stock", "Fob numbers per branch: In stock, Assigned, Lost, Returned."],
    ["leads", "Lead sources", "Walk-in, Referral, Facebook, Instagram and more."],
    ["clock", "Follow-up types", "Call, WhatsApp, Visit planned, Free trial planned, Payment expected."],
    ["flag", "Lost reasons", "Reasons staff pick when a lead is marked as Lost."],
    ["tasks", "Lead stages", "New, Contacted, Trial, Negotiation. Converted and Lost are fixed."]
  ];

  function render() {
    document.getElementById("prefs").innerHTML = PREFS.map(function (p) {
      var cur = App.prefs[p.k], def = App.PREF_DEFAULTS[p.k];
      return '<div class="pref-row"><div><div class="pref-title" id="pt-' + p.k + '">' + p.t + '</div><div class="cell-sub">' + p.d + "</div></div>" +
        '<div class="seg" role="radiogroup" aria-labelledby="pt-' + p.k + '">' + p.o.map(function (o) {
          var on = o[0] === cur;
          return '<button class="seg-btn' + (on ? " active" : "") + '" role="radio" aria-checked="' + on + '" data-pref="' + p.k + '" data-val="' + o[0] + '">' +
            esc(o[1]) + (o[0] === def ? ' <span class="muted">(default)</span>' : "") + "</button>";
        }).join("") + "</div></div>";
    }).join("");
    document.getElementById("soon").innerHTML = SOON.map(function (s) {
      return '<div class="card soon-card"><span class="tl-ico">' + App.icon(s[0]) + '</span><strong>' + s[1] +
        '</strong><span class="cell-sub">' + s[2] + '</span><span class="badge">Coming soon</span></div>';
    }).join("");
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pref]");
    if (b) { App.setPref(b.dataset.pref, b.dataset.val); App.toast(b.closest(".pref-row").querySelector(".pref-title").textContent + ": " + b.textContent.replace(" (default)", ""), ""); return; }
    if (e.target.closest("#btnReset")) { App.resetPrefs(); App.toast("Display reset to default", ""); }
    if (e.target.closest("#btnPreview")) App.openProfile("p1");
  });
  // Arrow keys move within a radio group
  document.addEventListener("keydown", function (e) {
    var b = e.target.closest && e.target.closest("[data-pref]"); if (!b || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    var sibs = Array.prototype.slice.call(b.parentNode.children), i = sibs.indexOf(b) + (e.key === "ArrowRight" ? 1 : -1);
    var n = sibs[(i + sibs.length) % sibs.length]; e.preventDefault(); n.click(); var f = document.querySelector('[data-pref="' + n.dataset.pref + '"][data-val="' + n.dataset.val + '"]'); if (f) f.focus();
  });
  document.addEventListener("mock:prefs", render);
  document.addEventListener("DOMContentLoaded", render);
})();
