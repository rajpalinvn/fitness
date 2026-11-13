/* Meeting page: lock Lead & Client rules.
   CONTENT below is copied word for word from docs/meeting/lead-client-flow-questions.md.
   Do not edit rules here; edit the doc and mirror it. */
(function () {
  "use strict";

  var STORE_KEY = "gymos-meeting-rules-v1";

  /* ---------------- Content (from the source doc) ---------------- */
  var CONTENT = {
    commit: "1de65cf",
    repo: "https://github.com/rajpalinvn/fitness",
    part1: [
      { key: "1.1", title: "1.1 Lead vs Client", rules: [
        { id: "R1", title: "Client definition", text: "**Client = a person who bought a Membership.** Everyone before that is a Lead, including people on a free trial or a **paid trial**. (Replaces old #3 \"money taken = client\".)" },
        { id: "R2", title: "Trials give nothing extra", text: "Trial (free or paid) gives **no accessories, no free items, no FF ID, no key fob**. The \"Add items\" section is hidden for trial packages." },
        { id: "R3", title: "Paid trial payment", text: "Paid trial is paid **in full, at once**. No partial payment, no balance due on a lead." },
        { id: "R4", title: "Two buttons on a lead", text: "**Book trial** shows only trial packages (free + paid). **Convert to Client** shows only Membership packages (never trial packages; PT stays disabled, #89)." },
        { id: "R5", title: "Membership and PT sold separately", text: "PT is sold later in Sell mode, only to a client with an active membership (#89)." },
        { id: "R6", title: "Convert to Client", text: "FF ID and key fob are given at conversion. If out of stock, they can be \"Pending\" (as today). Free items follow #67 (out of stock = \"Pending issue\", manager can Waive)." }
      ] },
      { key: "1.2", title: "1.2 Trial", rules: [
        { id: "T-R1", title: "Trial stage is automatic", text: "Sales staff never set \"Trial\" by hand. The Stage dropdown shows only **New, Contacted, Negotiation**. Booking a trial sets stage = Trial." },
        { id: "T-R2", title: "Trial ends", text: "Stage stays **Trial**, shown as \"Trial · ended\", and a follow-up is created for the lead owner." },
        { id: "T-R3", title: "Convert during a trial", text: "Allowed. The trial ends at that moment." },
        { id: "T-R4", title: "Repeat-trial warning", text: "Show the warning from the **2nd** trial (free and paid both). Old #39 said 3rd." },
        { id: "T-R5", title: "Paid trial adjust on conversion", text: "When a lead with a **running** paid trial clicks Convert to Client, the bill shows \"Paid trial ₹X adjust? ☐\". Ticked: trial price is subtracted, and the membership **start date = the trial's start date** (system-set; staff cannot edit it). The trial line stays in history; the new membership line is tagged \"Paid trial adjusted\". It is **not** an \"Upgrade\" (#44 is for client-to-bigger-package only). Trial already ended: no adjust, full price." },
        { id: "T-R6", title: "Who sees Book trial", text: "Uses the package checkbox **\"Requires an active membership\"** (already in package settings). **Lead** sees trial packages with the checkbox OFF (membership trials). **Active client** sees trial packages with the checkbox ON (PT trials). **Expired client** sees none, so the button is hidden. **Lost lead**: disabled, \"Re-open the lead first\" (#26)." },
        { id: "T-R7", title: "Trial approval (approval after booking)", text: "Booking a trial needs a **mandatory comment** and an **approver** picked from a dropdown of that branch's higher roles (MXM, Sales Manager, Club Manager, Regional Manager, CEO). The trial is booked immediately; approval stays **Pending**. The approver gets a notification and marks **Approved / Rejected + remark**." }
      ] },
      { key: "1.3", title: "1.3 Ownership, pool, branches", rules: [
        { id: "O-R1", title: "One owner", text: "Every lead has exactly one owner, or it is **Unassigned (in the Pool)**." },
        { id: "O-R2", title: "Visibility", text: "Sales Executive sees: own leads + the **Pool of their region**. Managers see all leads of their branches." },
        { id: "O-R3", title: "Assign", text: "Only managers assign / reassign, **single or bulk**." },
        { id: "O-R4", title: "Region", text: "Each branch gets a **Region** (e.g. Jaipur = 3 branches). Used for filters and for the Pool." },
        { id: "O-R5", title: "New leads from Meta / Excel import", text: "Land Unassigned in the Pool. Per-branch setting: **Manual (manager assigns)** or **Round-robin**." },
        { id: "O-R6", title: "Lost leads", text: "Go to the Pool, visible to everyone in the region. Anyone can re-open one and take it. Manager can re-open and assign (single or bulk). Notes are allowed on lost leads; nothing else until re-opened (#26)." },
        { id: "O-R7", title: "Inactivity release", text: "If the owner is inactive for N days (default 7), the lead goes back to the Pool, with a timeline entry. Managers can assign it again, or someone can take it." },
        { id: "O-R8", title: "Branch transfer of a lead", text: "The **owner or a manager** can move a lead to another branch, with a mandatory remark. It lands **Unassigned in the new branch's Pool**, with a filter \"Transferred in\". Whoever takes it first, or whoever the manager assigns, becomes the owner. Old open follow-ups are \"Closed by system\"." }
      ] }
    ],
    part14: [
      { old: "#3", change: "\"Money taken = client\" becomes \"Membership bought = client\". Paid trial stays a Lead." },
      { old: "#15, #63", change: "Sales Executive now sees the regional Pool (was: SE never sees unassigned leads)." },
      { old: "#39", change: "Repeat-trial warning from the 2nd trial (was 3rd)." },
      { old: "#66", change: "Convert to Client Package step: Membership only (Free trial / Paid trial accordions move to Book trial)." },
      { old: "#72", change: "Paid trial no longer goes through Convert; no FF ID on any trial." },
      { old: "#76", change: "Branch transfer of a lead is allowed for the owner too (reassign stays managers only)." },
      { old: "Q5, Q26", change: "Closed (paid trial is a lead; no \"trial ended client\")." },
      { old: "Q10", change: "Solved by the per-branch Manual / Round-robin setting." },
      { old: "Clients list (`1de65cf`)", change: "The \"Paid trial\" card and the paid-trial dummy client (Ananya) must move to leads." }
    ],
    part2: [
      { key: "A", title: "A. Trial", items: [
        { id: "T1", q: "When is trial **approval** needed?", options: [["A", "Every trial"], ["B", "Only from the 2nd trial (when the warning shows)"], ["C", "Only paid trials"]], def: "B", defText: "**B**" },
        { id: "T2", q: "Approver marks **Rejected** while the trial is running. What happens?", options: [["A", "Trial keeps running; \"Rejected\" is recorded and shown in reports"], ["B", "Trial is cancelled immediately (paid trial would need a refund flow)"]], def: "A", defText: "**A**" },
        { id: "T3", q: "One approver list for all trials (MXM, SM, CM, RM, CEO)? Or MXM only for PT trials?", options: [["A", "One list for all"], ["B", "PT trials: MXM first; membership trials: SM / CM first"]], def: "A", defText: "**A**" },
        { id: "T4", q: "Approval still Pending when the trial ends. Anything automatic?", options: [["A", "Nothing, it stays Pending"], ["B", "Reminder notification to the approver"], ["C", "Auto-approved"]], def: "B", defText: "**B**" },
        { id: "T5", q: "After a trial ends, can staff move the stage from Trial to Negotiation / Contacted with the dropdown? (While the trial runs, the dropdown is locked.)", options: [["Yes", "Yes"], ["No", "No"]], def: "Yes", defText: "**Yes**" },
        { id: "T6", q: "Paid trial adjust: is the **full** trial price subtracted?", options: [["A", "Full price"], ["B", "Only for the unused days"]], def: "A", defText: "**A**" }
      ] },
      { key: "B", title: "B. Pool and taking a lead", items: [
        { id: "P1", q: "How does someone take a Pool lead?", options: [["A", "Explicit **\"Take this lead\"** button"], ["B", "Automatically, on the first follow-up / activity"]], def: "A", defText: "**A** (fewer accidents)" },
        { id: "P2", q: "A Sales Executive takes a Pool lead that belongs to **another branch in the same region**. Does the lead move to the taker's branch?", options: [["A", "Yes, auto branch change + timeline entry"], ["B", "No, it stays in its branch (taker works across branches)"], ["C", "Not allowed, own branch only"]], def: "A", defText: "**A**" },
        { id: "P3", q: "Is the **Unassigned new-lead** Pool (Meta / Excel) region-wide like lost leads, or branch-only?", options: [["A", "Region-wide"], ["B", "Branch-only (lost leads region-wide)"]], def: "B", defText: "**B**" },
        { id: "P4", q: "Can a Sales Executive **re-open** a lost lead from the Pool by themselves?", options: [["Yes", "Yes"], ["No", "No (managers only)"]], def: "Yes", defText: "**Yes** (O-R6)" },
        { id: "P5", q: "Limit on how many Pool leads one SE can hold?", options: [["A", "No limit"], ["B", "Limit set by admin"]], def: "A", defText: "**A**, ASK CLIENT" }
      ] },
      { key: "C", title: "C. Inactivity release", items: [
        { id: "I1", q: "What counts as \"inactive\"?", options: [["A", "Next follow-up **overdue or not set** for N days"], ["B", "No follow-up logged for N days"], ["C", "Not converted within N days"]], def: "A", defText: "**A**" },
        { id: "I2", q: "Does release apply to **all** leads, or only leads taken from the Pool / re-opened?", options: [["A", "All leads"], ["B", "Only taken / re-opened leads"]], def: "A", defText: "**A** (one rule)" },
        { id: "I3", q: "Never release while a trial is running?", options: [["Yes", "Yes"], ["No", "No"]], def: "Yes", defText: "**Yes**" },
        { id: "I4", q: "Warn the owner before release (e.g. 1 day before)?", options: [["Yes", "Yes"], ["No", "No"]], def: "Yes", defText: "**Yes**" },
        { id: "I5", q: "Number of days N", number: true, options: [], def: "7", defText: "**7**, ASK CLIENT" },
        { id: "I6", q: "On release, open follow-ups become \"Closed by system (Released to pool)\"?", options: [["Yes", "Yes"], ["No", "No"]], def: "Yes", defText: "**Yes**" }
      ] },
      { key: "D", title: "D. Branch transfer and region", items: [
        { id: "B1", q: "Lead transfer to **any** branch, or only the same region?", options: [["A", "Any branch"], ["B", "Same region only"]], def: "A", defText: "**A**" },
        { id: "B2", q: "Can a branch belong to only one region?", options: [["Yes", "Yes"], ["No", "No"]], def: "Yes", defText: "**Yes**" },
        { id: "B3", q: "Is \"Region\" also a top-bar filter (like the branch switcher), for Regional Manager and above?", options: [["Yes", "Yes"], ["No", "No"]], def: "Yes", defText: "**Yes**" },
        { id: "B4", q: "Round-robin: which users are in the rotation?", options: [["A", "All active Sales Executives of the branch"], ["B", "A list the manager picks"]], def: "A", defText: "**A**" }
      ] },
      { key: "E", title: "E. Data model (for the build agent)", tag: "For the build team", collapsed: true, items: [
        { id: "D1", q: "Trial approval: new fields on the trial sale line (`approvalStatus`, `approverUserId`, `approvalRemark`, `approvedAt`) or a separate Approval table?", options: [["A", "Fields on the sale line"], ["B", "Separate table"]], def: "A", defText: "**A**" },
        { id: "D2", q: "Pool: store as `ownerUserId = null` (Unassigned) plus a `pooledAt` / `poolReason` (New, Lost, Released, Transferred in)?", options: [["Yes", "Yes"]], otherLabel: "suggest other", def: "Yes", defText: "**Yes**" },
        { id: "D3", q: "Paid trial adjust: store as a negative \"Adjustment\" line on the conversion bill, linked to the trial sale line?", options: [["Yes", "Yes"]], otherLabel: "suggest other", def: "Yes", defText: "**Yes**" },
        { id: "D4", q: "Is a start date in the past (system-set, paid trial adjust only) OK for the API?", options: [["Yes", "Yes"], ["No", "No"]], def: "Yes", defText: "**Yes**" }
      ] }
    ],
    part3: [
      { id: "1", title: "Inactivity days", text: "\"Rahul's lead has had an overdue follow-up for 7 days. Should it go back to the pool?\" How many days?" },
      { id: "2", title: "Round-robin", text: "Which branches use it? Skip people on leave? (Leave data does not exist in the system yet.)" },
      { id: "3", title: "Paid trial adjust and GST", text: "Does the accountant treat the adjusted amount as a discount or as an adjustment / credit?" },
      { id: "4", title: "Pool limit", text: "Max leads one Sales Executive can take from the pool?" },
      { id: "5", title: "Sales credit", text: "Priya owned the lead, it was released for inactivity, Aman converted it. Is the credit only Aman's? (Today #36: credit goes to the sales rep of the sale.)" },
      { id: "6", title: "Expired client and trial", text: "Confirm that an expired client never gets a trial (only renewal offers)." }
    ],
    /* Answer template rows, as in the source doc */
    templateRows: [["T1", "T2", "T3", "T4", "T5", "T6"], ["P1", "P2", "P3", "P4", "P5"], ["I1", "I2", "I3", "I4", "I5", "I6"], ["B1", "B2", "B3", "B4"], ["D1", "D2", "D3", "D4"]]
  };

  /* ---------------- State ---------------- */
  var state = load();
  function blank() { return { name: "", date: "", part1: {}, part2: {}, part3: {}, filter: "all", openE: false }; }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return blank();
      var s = JSON.parse(raw);
      var b = blank();
      for (var k in b) if (s[k] === undefined) s[k] = b[k];
      return s;
    } catch (e) { return blank(); }
  }
  var saveTimer;
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: page still works */ }
    clearTimeout(saveTimer);
    var el = $("#saved-at");
    if (el) { el.textContent = "Saved " + fmtTime(new Date()); }
    updateProgress();
  }
  function p1(id) { return state.part1[id] || (state.part1[id] = { status: "", text: "" }); }
  function p2(id) { return state.part2[id] || (state.part2[id] = { value: "", other: "", note: "", locked: false }); }
  function p3(id) { return state.part3[id] || (state.part3[id] = { text: "", locked: false }); }

  /* ---------------- Helpers ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>"); }
  function plain(s) { return String(s).replace(/\*\*/g, "").replace(/`/g, ""); }
  function fmtDate(iso) { return iso ? new Date(iso + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""; }
  function fmtTime(d) { return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); }
  function fmtStamp(d) { return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + ", " + fmtTime(d); }
  function icon(name) {
    var p = {
      check: "<polyline points='20 6 9 17 4 12'/>",
      lock: "<rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/>",
      unlock: "<rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 9.9-1'/>",
      edit: "<path d='M12 20h9'/><path d='M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'/>",
      skip: "<polygon points='5 4 15 12 5 20 5 4'/><line x1='19' y1='5' x2='19' y2='19'/>",
      chev: "<polyline points='6 9 12 15 18 9'/>",
      download: "<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/>",
      copy: "<rect x='9' y='9' width='13' height='13' rx='2'/><path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/>",
      reset: "<polyline points='1 4 1 10 7 10'/><path d='M3.51 15a9 9 0 1 0 2.13-9.36L1 10'/>",
      print: "<polyline points='6 9 6 2 18 2 18 9'/><path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'/><rect x='6' y='14' width='12' height='8'/>"
    }[name] || "";
    return "<svg class='ico' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + p + "</svg>";
  }

  /* ---------------- Totals ---------------- */
  function allP2() { var a = []; CONTENT.part2.forEach(function (s) { a = a.concat(s.items); }); return a; }
  function allP1() { var a = []; CONTENT.part1.forEach(function (s) { a = a.concat(s.rules); }); return a; }
  var TOTAL = allP1().length + allP2().length + CONTENT.part3.length;
  function lockedCount() {
    var n = 0;
    allP1().forEach(function (r) { if (p1(r.id).status === "locked") n++; });
    allP2().forEach(function (q) { if (p2(q.id).locked) n++; });
    CONTENT.part3.forEach(function (q) { if (p3(q.id).locked) n++; });
    return n;
  }
  function updateProgress() {
    var n = lockedCount();
    $("#progress-text").textContent = n + " of " + TOTAL + " locked";
    $("#progress-fill").style.width = Math.round(n / TOTAL * 100) + "%";
    $("#progress-bar").setAttribute("aria-valuenow", n);
  }

  /* ---------------- Render ---------------- */
  function render() {
    $("#commit").textContent = CONTENT.commit;
    $("#commit").href = CONTENT.repo + "/commit/" + CONTENT.commit;
    $("#f-name").value = state.name || "";
    $("#f-date").value = state.date || "";
    showDateText();
    $("#progress-bar").setAttribute("aria-valuemax", TOTAL);

    var h = "";
    /* Part 1 */
    CONTENT.part1.forEach(function (sec) {
      h += "<section class='sec'><h3 class='sec-h'>" + esc(sec.title) + "</h3>";
      sec.rules.forEach(function (r) {
        var s = p1(r.id);
        h += "<article class='rcard card' data-kind='p1' data-id='" + esc(r.id) + "' data-status='" + esc(s.status) + "'>" +
          "<div class='rc-head'><span class='rc-id'>" + esc(r.id) + "</span><span class='rc-title'>" + esc(r.title) + "</span><span class='rc-state'></span></div>" +
          "<p class='rc-text'>" + md(r.text) + "</p>" +
          "<div class='rc-actions no-print'>" +
            "<button type='button' class='btn btn-sm st-btn' data-set='locked'>" + icon("check") + "Locked</button>" +
            "<button type='button' class='btn btn-sm st-btn' data-set='change'>" + icon("edit") + "Needs change</button>" +
            "<button type='button' class='btn btn-sm st-btn' data-set='skip'>" + icon("skip") + "Skip for now</button>" +
          "</div>" +
          "<div class='field rc-change'><label>What should change? <span class='req'>*</span></label>" +
            "<textarea class='input change-text' rows='2' placeholder='Write what should change'>" + esc(s.text) + "</textarea>" +
            "<span class='error' hidden>Required when a rule needs change</span></div>" +
        "</article>";
      });
      h += "</section>";
    });
    /* 1.4 table */
    h += "<section class='sec'><h3 class='sec-h'>1.4 Existing decisions this changes <span class='badge'>Read-only</span></h3><div class='table-wrap'><table class='table p14'><thead><tr><th>Old</th><th>Change</th></tr></thead><tbody>";
    CONTENT.part14.forEach(function (r) { h += "<tr><td>" + md(r.old) + "</td><td>" + md(r.change) + "</td></tr>"; });
    h += "</tbody></table></div></section>";
    $("#part1").innerHTML = h;

    /* Part 2 */
    h = "";
    CONTENT.part2.forEach(function (sec) {
      var isE = !!sec.collapsed;
      var open = isE ? !!state.openE : true;
      h += "<section class='sec" + (isE ? " sec-e" : "") + "' data-sec='" + sec.key + "'" + (isE && !open ? " data-closed='1'" : "") + ">";
      h += "<h3 class='sec-h" + (isE ? " sec-toggle" : "") + "'>" + (isE ? "<button type='button' class='sec-tbtn' aria-expanded='" + open + "'>" + icon("chev") + "</button>" : "") +
        "<span>" + esc(sec.title) + "</span>" + (sec.tag ? " <span class='badge badge-info'>" + esc(sec.tag) + "</span>" : "") + "</h3>";
      h += "<div class='sec-body'>";
      sec.items.forEach(function (q) {
        var s = p2(q.id);
        if (!s.value && !s.locked) s.value = q.def; /* default pre-selected */
        h += "<article class='qcard card" + (s.locked ? " locked collapsed" : "") + "' data-kind='p2' data-id='" + esc(q.id) + "'>" +
          "<div class='qc-line' role='button' tabindex='0'><span class='rc-id'>" + esc(q.id) + "</span><span class='qc-sum'></span><span class='badge badge-success qc-lockbadge'>" + icon("lock") + "Locked</span></div>" +
          "<div class='qc-body'>" +
            "<p class='qc-q'>" + md(q.q) + "</p>" +
            "<div class='qc-opts'>";
        if (q.number) {
          h += "<label class='opt'><span class='opt-code'>Number</span>" +
            "<input type='number' class='input input-num num-val' min='1' value='" + esc(s.value === "__other" ? "" : s.value) + "'>" +
            (q.def ? "<span class='badge opt-def'>Default " + plain(q.defText) + "</span>" : "") + "</label>";
        } else {
          q.options.forEach(function (o) {
            var isDef = o[0] === q.def;
            h += "<label class='opt'><input type='radio' name='q-" + esc(q.id) + "' value='" + esc(o[0]) + "'" + (s.value === o[0] ? " checked" : "") + ">" +
              "<span class='opt-code'>" + esc(o[0]) + ")</span><span class='opt-text'>" + md(o[1]) + "</span>" +
              (isDef ? "<span class='badge opt-def'>Default" + (plain(q.defText).replace(/^\S+/, "") ? " ·" + esc(plain(q.defText).replace(/^\S+/, "")) : "") + "</span>" : "") + "</label>";
          });
        }
        h += "<label class='opt opt-other'><input type='radio' name='q-" + esc(q.id) + "' value='__other'" + (s.value === "__other" ? " checked" : "") + ">" +
          "<span class='opt-code'>" + (q.number ? "Other" : "Other") + "</span>" +
          "<input type='text' class='input other-text' placeholder='" + esc(q.otherLabel || "Write your option") + "' value='" + esc(s.other) + "'></label>";
        h += "</div>" +
            "<div class='field qc-note'><label>Note <span class='muted'>(optional)</span></label><textarea class='input note-text' rows='2' placeholder='Reason, if not the default'>" + esc(s.note) + "</textarea><span class='error' hidden></span></div>" +
            "<div class='rc-actions no-print'><button type='button' class='btn btn-primary btn-sm lock-btn'>" + icon("lock") + "Lock</button>" +
            "<button type='button' class='btn btn-sm unlock-btn'>" + icon("unlock") + "Unlock to edit</button></div>" +
          "</div></article>";
      });
      h += "</div></section>";
    });
    $("#part2").innerHTML = h;

    /* Part 3 */
    h = "<section class='sec'>";
    CONTENT.part3.forEach(function (q) {
      var s = p3(q.id);
      h += "<article class='qcard card" + (s.locked ? " locked collapsed" : "") + "' data-kind='p3' data-id='" + esc(q.id) + "'>" +
        "<div class='qc-line' role='button' tabindex='0'><span class='rc-id'>" + esc(q.id) + "</span><span class='qc-sum'></span><span class='badge badge-success qc-lockbadge'>" + icon("lock") + "Locked</span></div>" +
        "<div class='qc-body'>" +
          "<p class='qc-q'><strong>" + esc(q.title) + ":</strong> " + md(q.text) + "</p>" +
          "<div class='field'><label>Answer</label><textarea class='input ans-text' rows='3' placeholder='Client answer'>" + esc(s.text) + "</textarea><span class='error' hidden>Write an answer before locking</span></div>" +
          "<div class='rc-actions no-print'><button type='button' class='btn btn-primary btn-sm lock-btn'>" + icon("lock") + "Lock</button>" +
          "<button type='button' class='btn btn-sm unlock-btn'>" + icon("unlock") + "Unlock to edit</button></div>" +
        "</div></article>";
    });
    h += "</section>";
    $("#part3").innerHTML = h;

    $$(".rcard").forEach(refreshP1);
    $$(".qcard").forEach(refreshQ);
    applyFilter();
    updateProgress();
    $$(".tool-ico").forEach(function (el) { el.innerHTML = icon(el.getAttribute("data-ico")); });
  }

  function showDateText() {
    var t = $("#f-date-text");
    t.textContent = state.date ? fmtDate(state.date) : "Not set yet";
  }

  /* Part 1 card refresh */
  function refreshP1(card) {
    var s = p1(card.getAttribute("data-id"));
    card.setAttribute("data-status", s.status);
    $$(".st-btn", card).forEach(function (b) { b.classList.toggle("selected", b.getAttribute("data-set") === s.status); });
    var label = { locked: "Locked", change: "Needs change", skip: "Skipped for now" }[s.status] || "Not decided";
    var cls = { locked: "badge-success", change: "badge-warning", skip: "badge-info" }[s.status] || "";
    $(".rc-state", card).innerHTML = "<span class='badge " + cls + "'>" + esc(label) + "</span>";
    var box = $(".rc-change", card);
    box.style.display = s.status === "change" ? "" : "none";
    var err = $(".rc-change .error", card);
    var bad = s.status === "change" && !s.text.trim();
    err.hidden = !bad;
    $(".change-text", card).classList.toggle("invalid", bad);
  }

  /* Part 2 / 3 card refresh */
  function qLabel(q, s) {
    if (s.value === "__other") return "Other: " + (s.other.trim() || "—");
    if (q.number) return s.value ? s.value + " days" : "—";
    var o = q.options.filter(function (x) { return x[0] === s.value; })[0];
    return o ? o[0] + ") " + plain(o[1]) : "—";
  }
  function findQ(id) { return allP2().filter(function (q) { return q.id === id; })[0]; }
  function refreshQ(card) {
    var id = card.getAttribute("data-id"), kind = card.getAttribute("data-kind");
    var s = kind === "p2" ? p2(id) : p3(id);
    card.classList.toggle("locked", !!s.locked);
    if (!s.locked) card.classList.remove("collapsed");
    var sum;
    if (kind === "p2") {
      var q = findQ(id);
      sum = s.locked ? qLabel(q, s) : plain(q.q);
      $$("input", card).forEach(function (i) { i.disabled = !!s.locked; });
      $(".note-text", card).disabled = !!s.locked;
      $(".other-text", card).disabled = !!s.locked || s.value !== "__other";
    } else {
      var q3 = CONTENT.part3.filter(function (x) { return x.id === id; })[0];
      sum = q3.title + (s.locked ? ": " + (s.text.trim() || "—") : "");
      $(".ans-text", card).disabled = !!s.locked;
    }
    $(".qc-sum", card).textContent = sum;
  }

  /* ---------------- Filter ---------------- */
  function applyFilter() {
    var f = state.filter || "all";
    $$(".filter-seg .seg-btn").forEach(function (b) { b.classList.toggle("selected", b.getAttribute("data-filter") === f); });
    $$(".rcard, .qcard").forEach(function (card) {
      var id = card.getAttribute("data-id"), kind = card.getAttribute("data-kind");
      var show = true;
      if (f === "unlocked") show = kind === "p1" ? p1(id).status !== "locked" : !(kind === "p2" ? p2(id) : p3(id)).locked;
      else if (f === "change") show = kind === "p1" && p1(id).status === "change";
      card.hidden = !show;
    });
    $$(".sec").forEach(function (sec) {
      var cards = $$(".rcard, .qcard", sec);
      if (cards.length) sec.hidden = cards.every(function (c) { return c.hidden; });
    });
    var any = $$(".rcard, .qcard").some(function (c) { return !c.hidden; });
    $("#filter-empty").hidden = any;
  }

  /* ---------------- Export ---------------- */
  function answerText() {
    var out = [];
    out.push("GYM-OS · Lead & Client rules — answers");
    out.push("Client / attendee: " + (state.name.trim() || "—"));
    out.push("Meeting date: " + (state.date ? fmtDate(state.date) : "—"));
    out.push("Repo commit: " + CONTENT.commit);
    out.push("Generated at: " + fmtStamp(new Date()));
    out.push("Locked: " + lockedCount() + " of " + TOTAL);
    out.push("");
    out.push("## Answers (Part 2)");
    out.push("```");
    var notes = [];
    CONTENT.templateRows.forEach(function (row) {
      out.push(row.map(function (id) {
        var q = findQ(id), s = p2(id);
        var v = "";
        if (s.locked) {
          if (s.value === "__other") { v = "Other"; notes.push(id + ": Other — " + s.other.trim()); }
          else v = s.value;
        }
        if (s.note.trim()) notes.push(id + ": " + s.note.trim());
        return id + ": " + v;
      }).join("  ").replace(/\s+$/, ""));
    });
    out.push("Notes / anything that conflicts with Part 1:");
    notes.forEach(function (n) { out.push("- " + n); });
    out.push("```");
    out.push("(Blank = not locked yet. Other = see notes.)");
    out.push("");
    out.push("## Part 1 — Decided rules");
    allP1().forEach(function (r) {
      var s = p1(r.id), v;
      if (s.status === "locked") v = "Locked";
      else if (s.status === "change") v = "Needs change: " + (s.text.trim() || "—");
      else if (s.status === "skip") v = "Skipped for now";
      else v = "Not decided";
      out.push(r.id + ": " + v);
    });
    out.push("");
    out.push("## Part 3 — Client meeting");
    CONTENT.part3.forEach(function (q) {
      var s = p3(q.id);
      out.push(q.id + ". " + q.title + ": " + (s.text.trim() || "—") + (s.locked ? " (Locked)" : ""));
    });
    return out.join("\n") + "\n";
  }
  function download() {
    var text = answerText();
    var blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lead-client-rules-answers" + (state.date ? "-" + state.date : "") + ".md";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("Downloaded " + a.download);
  }
  function copy() {
    var text = answerText();
    function done() { toast("Answers copied"); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) { }
      document.body.removeChild(ta);
      if (ok) done(); else toast("Copy failed — use Download instead");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2500);
  }

  /* ---------------- Events ---------------- */
  function bind() {
    $("#f-name").addEventListener("input", function () { state.name = this.value; save(); });
    $("#f-date").addEventListener("change", function () { state.date = this.value; showDateText(); save(); });
    $("#f-date").addEventListener("input", function () { state.date = this.value; showDateText(); save(); });

    $$(".filter-seg .seg-btn").forEach(function (b) {
      b.addEventListener("click", function () { state.filter = b.getAttribute("data-filter"); save(); applyFilter(); });
    });
    $("#btn-lock-defaults").addEventListener("click", function () {
      var open = allP2().filter(function (q) { return !p2(q.id).locked; });
      if (!open.length) { toast("All Part 2 questions are already locked"); return; }
      if (!confirm("Lock all " + open.length + " open Part 2 questions with their default option? Your notes stay.")) return;
      open.forEach(function (q) { var s = p2(q.id); s.value = q.def; s.locked = true; });
      $$(".qcard[data-kind=p2]").forEach(function (card) {
        var s = p2(card.getAttribute("data-id"));
        var r = $("input[type=radio][value='" + s.value + "']", card); if (r) r.checked = true;
        var n = $(".num-val", card); if (n) n.value = s.value;
        card.classList.add("collapsed"); refreshQ(card);
      });
      save(); applyFilter(); toast("Defaults locked");
    });
    $("#btn-reset").addEventListener("click", function () {
      if (!confirm("Reset all answers, statuses, name and date on this page? This cannot be undone.")) return;
      state = blank();
      try { localStorage.removeItem(STORE_KEY); } catch (e) { }
      render(); save(); toast("Everything reset");
    });
    $("#btn-download").addEventListener("click", download);
    $("#btn-copy").addEventListener("click", copy);
    $("#btn-print").addEventListener("click", function () { window.print(); });

    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target : null; if (!t) return;
      var btn;
      /* Part 1 status */
      btn = t.closest(".st-btn");
      if (btn) {
        var card = btn.closest(".rcard"), s = p1(card.getAttribute("data-id"));
        s.status = btn.getAttribute("data-set");
        refreshP1(card); save(); applyFilter();
        if (s.status === "change") $(".change-text", card).focus();
        return;
      }
      /* Section E toggle */
      btn = t.closest(".sec-tbtn, .sec-toggle");
      if (btn) {
        var sec = btn.closest(".sec-e");
        state.openE = sec.hasAttribute("data-closed");
        if (state.openE) sec.removeAttribute("data-closed"); else sec.setAttribute("data-closed", "1");
        $(".sec-tbtn", sec).setAttribute("aria-expanded", String(state.openE));
        save(); return;
      }
      /* Lock */
      btn = t.closest(".lock-btn");
      if (btn) { lockCard(btn.closest(".qcard")); return; }
      btn = t.closest(".unlock-btn");
      if (btn) {
        var c = btn.closest(".qcard"), id = c.getAttribute("data-id");
        (c.getAttribute("data-kind") === "p2" ? p2(id) : p3(id)).locked = false;
        c.classList.remove("collapsed"); refreshQ(c); save(); applyFilter(); return;
      }
      /* Collapsed line: reopen */
      var line = t.closest(".qc-line");
      if (line) {
        var qc = line.closest(".qcard");
        if (qc.classList.contains("locked")) qc.classList.toggle("collapsed");
      }
    });
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("qc-line")) {
        e.preventDefault(); e.target.click();
      }
    });
    document.addEventListener("input", function (e) {
      var t = e.target, card = t.closest(".rcard, .qcard"); if (!card) return;
      var id = card.getAttribute("data-id"), kind = card.getAttribute("data-kind");
      if (kind === "p1" && t.classList.contains("change-text")) { p1(id).text = t.value; refreshP1(card); save(); }
      else if (kind === "p2") {
        var s = p2(id);
        if (t.classList.contains("other-text")) s.other = t.value;
        else if (t.classList.contains("note-text")) s.note = t.value;
        else if (t.classList.contains("num-val")) s.value = t.value;
        save();
      } else if (kind === "p3" && t.classList.contains("ans-text")) { p3(id).text = t.value; $(".error", card).hidden = true; save(); }
    });
    document.addEventListener("change", function (e) {
      var t = e.target; if (t.type !== "radio") return;
      var card = t.closest(".qcard"); if (!card) return;
      var s = p2(card.getAttribute("data-id"));
      s.value = t.value;
      $(".other-text", card).disabled = s.value !== "__other";
      if (s.value === "__other") $(".other-text", card).focus();
      $(".qc-note .error", card).hidden = true;
      save();
    });
  }

  function lockCard(card) {
    var id = card.getAttribute("data-id"), kind = card.getAttribute("data-kind");
    if (kind === "p2") {
      var s = p2(id), q = findQ(id), err = $(".qc-note .error", card), msg = "";
      if (q.number) { s.value = $(".num-val", card).value; if (!s.value) msg = "Enter a number before locking"; }
      else if (!s.value) msg = "Pick an option before locking";
      if (s.value === "__other" && !s.other.trim()) msg = "Write the other option before locking";
      if (msg) { err.textContent = msg; err.hidden = false; return; }
      err.hidden = true; s.locked = true;
    } else {
      var s3 = p3(id);
      if (!s3.text.trim()) { $(".error", card).hidden = false; return; }
      s3.locked = true;
    }
    card.classList.add("collapsed"); refreshQ(card); save(); applyFilter();
  }

  render();
  bind();
})();
