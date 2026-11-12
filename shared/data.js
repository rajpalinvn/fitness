/* ONE shared dummy data set for every screen. All names/numbers are fake.
   Dates are relative to the day the page is opened, so "overdue" stays overdue. */
(function () {
  function day(offset, hh, mm) {
    var d = new Date(); d.setDate(d.getDate() + offset);
    d.setHours(hh == null ? 11 : hh, mm || 0, 0, 0);
    return d.toISOString();
  }
  // Calendar date "YYYY-MM-DD" (local) for follow-up dueDate (+ optional dueTime "HH:MM").
  function dd(offset) {
    var d = new Date(); d.setDate(d.getDate() + offset);
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  var branches = [
    { id: "b1", name: "Sec 31" },
    { id: "b2", name: "Sec 65" },
    { id: "b3", name: "Golf Course" }
  ];

  var roles = ["SuperAdmin", "CEO", "Regional Manager", "Club Manager",
    "Sales Manager", "Sales Executive", "Trainer", "MXM"];

  var users = [
    { id: "u1", name: "Rohan Mehta",    role: "SuperAdmin",       branches: ["b1", "b2", "b3"] },
    { id: "u2", name: "Anita Kapoor",   role: "CEO",              branches: ["b1", "b2", "b3"] },
    { id: "u3", name: "Vikram Rao",     role: "Regional Manager", branches: ["b1", "b2"] },
    { id: "u4", name: "Sunita Iyer",    role: "Club Manager",     branches: ["b1"] },
    { id: "u5", name: "Karan Malhotra", role: "Sales Manager",    branches: ["b1"] },
    { id: "u6", name: "Priya Sharma",   role: "Sales Executive",  branches: ["b1"] },
    { id: "u7", name: "Arjun Nair",     role: "Sales Executive",  branches: ["b2"] },
    { id: "u8", name: "Deepak Verma",   role: "Trainer",          branches: ["b1"] },
    { id: "u9", name: "Meera Joshi",    role: "MXM",              branches: ["b3"] },
    { id: "u10", name: "Rahul Gupta",   role: "Sales Executive",  branches: ["b3"] },
    { id: "u11", name: "Pooja Khanna",  role: "Sales Executive",  branches: ["b3"] }
  ];

  var lists = {
    sources: ["Walk-in", "Phone Call", "Referral", "WhatsApp", "Website", "Facebook",
      "Instagram", "Google", "Hoarding", "Pamphlet", "Others"],
    followUpTypes: ["Call", "WhatsApp", "Visit planned", "Free trial planned", "Payment expected"],
    outcomes: ["Interested", "No answer", "Call later", "Will visit", "Not interested"],
    lostReasons: ["Price high", "Joined competitor", "Not interested", "No response",
      "Location issue", "Timing issue", "Health issue", "Already a member elsewhere",
      "Shifted location", "Other"],
    temperatures: ["Hot", "Warm", "Cold"],                       // fixed
    stages: ["New", "Contacted", "Trial", "Negotiation"],        // configurable
    systemStages: ["Converted", "Lost"],                         // fixed
    taskStatuses: ["Open", "Done", "Cancelled"],                 // WorkTask
    followUpStatuses: ["Open", "Done", "Cancelled", "Closed by system"],
    systemCloseReasons: ["Client converted", "Lead lost", "Client transferred"],
    priorities: ["Critical", "High", "Medium", "Low"],
    saleTypes: ["Trial", "Trial Paid", "Paid"],
    fobStatuses: ["In stock", "Assigned", "Lost", "Returned"],
    inquiryTypes: ["Call", "Walk-in"],
    genders: ["Female", "Male", "Other"],
    countryCodes: ["+91", "+971", "+1", "+44"],
    discountReasons: ["Festive offer", "Referral", "Corporate", "Staff family", "Other"]   // "Other" needs text (decision #73)
  };

  // Lead + client share ONE person record (kind: "Lead" | "Client").
  var people = [
    { id: "p1", kind: "Lead", name: "Aarav Patel", cc: "+91", mobile: "90000 01234", email: "aarav.patel@example.com",
      gender: "Male", birthDate: "1995-04-12", ffId: null, source: "Walk-in", temperature: "Hot", stage: "Negotiation",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: "Wants morning batch",
      externalId: null, createdAt: day(-12), lastActivityAt: day(-3), note: "EDGE: overdue follow-up" },
    { id: "p2", kind: "Lead", name: "Sneha Reddy", cc: "+91", mobile: "90000 01235", email: null,
      gender: "Female", birthDate: null, ffId: null, source: "Instagram", temperature: "Warm", stage: "Contacted",
      inquiryType: "Call", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null,
      externalId: null, createdAt: day(-6), lastActivityAt: day(-5), note: "EDGE: no follow-up set" },
    { id: "p3", kind: "Lead", name: "Rajesh Kumar", cc: "+91", mobile: "90000 01236", email: "rajesh.k@example.com",
      gender: "Male", birthDate: "1988-09-30", ffId: null, source: "Referral", temperature: "Cold", stage: "Lost",
      lostReason: "Price high", inquiryType: "Call", campaign: null, ownerUserId: "u7", branchId: "b2", remarks: null,
      externalId: null, createdAt: day(-40), lastActivityAt: day(-20), note: "EDGE: lost lead" },
    { id: "p4", kind: "Lead", name: "Kavya Menon", cc: "+91", mobile: "90000 01237", email: "kavya.menon@example.com",
      gender: "Female", birthDate: "1999-01-22", ffId: null, source: "Phone Call", temperature: "Warm", stage: "Contacted",
      lostReason: null, inquiryType: "Call", campaign: null, ownerUserId: "u6", createdByUserId: "u5", ownerHistory: [{ from: "u5", to: "u6", at: day(-58), by: "u5" }],
      branchId: "b1", remarks: "Was lost (Timing issue), re-opened",
      externalId: null, createdAt: day(-60), lastActivityAt: day(-1), reopenedAt: day(-1), note: "EDGE: re-opened lead" },
    { id: "p5", kind: "Lead", name: "Ishaan Singh", cc: "+91", mobile: "90000 01238", email: "ishaan.singh@example.com",
      gender: "Male", birthDate: "2001-07-04", ffId: null, source: "Website", temperature: "Hot", stage: "Trial",
      inquiryType: "Walk-in", campaign: "Diwali Fit 2026", ownerUserId: "u6", branchId: "b1", remarks: null,
      externalId: null, createdAt: day(-4), lastActivityAt: day(-1), freeTrial: { from: day(-1), to: day(2) }, freeTrialCount: 2, freeItemsReceived: ["it2"],
      note: "EDGE: free trial lead (stays a Lead); got a free T-shirt before -> Annual shows 'T-shirt (already received)'" },
    { id: "p6", kind: "Client", name: "Ananya Desai", cc: "+91", mobile: "90000 01239", email: "ananya.desai@example.com",
      gender: "Female", birthDate: "1993-11-15", ffId: "FF-20431", source: "Facebook", temperature: "Hot", stage: "Converted",
      inquiryType: "Call", campaign: null, ownerUserId: "u7", branchId: "b2", remarks: null, externalId: null,
      createdAt: day(-15), lastActivityAt: day(-2), clientNo: "CL-1002", homeBranchId: "b2", joinedAt: day(-2),
      keyFob: null, photo: null,
      membership: { packageId: "pk2", package: "Trial Paid 7 Days", saleType: "Trial Paid", start: day(-2), end: day(4), price: 800, discount: 0, discountReason: null, finalPrice: 800, salesRepUserId: "u7" },
      note: "EDGE: paid trial client (no fob)" },
    { id: "p7", kind: "Client", name: "Vivaan Joshi", cc: "+91", mobile: "90000 01240", email: "vivaan.joshi@example.com",
      gender: "Male", birthDate: "1990-02-08", ffId: "FF-19877", source: "Referral", temperature: "Hot", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null, externalId: null,
      createdAt: day(-120), lastActivityAt: day(-7), clientNo: "CL-1001", homeBranchId: "b1", joinedAt: day(-100),
      keyFob: "KF-S31-0012", photo: null,
      membership: { packageId: "pk7", package: "Annual Membership", saleType: "Paid", start: day(-100), end: day(264), price: 24000, discount: 2400, discountReason: "Referral offer", finalPrice: 21600, salesRepUserId: "u6" },
      note: "EDGE: paid member with key fob" },
    { id: "p8", kind: "Lead", name: "Fatima Shaikh", cc: "+91", mobile: "90000 01241", email: null,
      gender: null, birthDate: null, ffId: null, source: "Facebook", temperature: "Warm", stage: "New",
      inquiryType: null, campaign: "Meta Lead Ad – Nov", ownerUserId: null, branchId: "b3", remarks: null,
      externalId: "meta_1203948571", synced: true, createdAt: day(0, 8, 15), lastActivityAt: day(0, 8, 15),
      note: "EDGE: synced from Meta, unassigned" },
    { id: "p9", kind: "Lead", name: "Aditya Bose", cc: "+91", mobile: "90000 01242", email: "aditya.bose@example.com",
      gender: "Male", birthDate: null, ffId: null, source: "Google", temperature: "Cold", stage: "New",
      inquiryType: "Call", campaign: null, ownerUserId: "u10", branchId: "b3", remarks: null,
      externalId: null, createdAt: day(-1), lastActivityAt: day(-1), note: "Follow-up due today" },
    { id: "p10", kind: "Lead", name: "Nisha Agarwal", cc: "+91", mobile: "90000 01243", email: "nisha.a@example.com",
      gender: "Female", birthDate: "1997-06-19", ffId: null, source: "WhatsApp", temperature: "Warm", stage: "Contacted",
      inquiryType: "Call", campaign: null, ownerUserId: "u7", branchId: "b2", remarks: null,
      externalId: null, createdAt: day(-3), lastActivityAt: day(-1), note: "Follow-up scheduled (green)" },
    { id: "p11", kind: "Lead", name: "Simran Kaur", cc: "+91", mobile: "90000 01244", email: "simran.kaur@example.com",
      gender: "Female", birthDate: null, ffId: null, source: "Referral", temperature: "Warm", stage: "Contacted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u11", branchId: "b3", remarks: null,
      externalId: null, createdAt: day(-8), lastActivityAt: day(-2), note: "EDGE: duplicate target in another branch" }
  ];

  // ---- Today screen edge cases (decision #61) ----
  people.push(
    { id: "p12", kind: "Client", name: "Rohit Verma", cc: "+91", mobile: "90000 01245", email: "rohit.verma@example.com",
      gender: "Male", birthDate: "1992-03-18", ffId: null, source: "Walk-in", temperature: "Hot", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null, externalId: null,
      createdAt: day(-9), lastActivityAt: day(-3), clientNo: "CL-0998", homeBranchId: "b1", joinedAt: day(-3), keyFob: null, photo: null,
      membership: { packageId: "pk7", package: "Annual Membership", saleType: "Paid", start: day(-3), end: day(361), price: 24000,
        discount: 0, discountReason: null, finalPrice: 24000, salesRepUserId: "u6",
        freeItems: [{ itemId: "it2", name: "T-shirt", qty: 1, status: "Pending issue" }, { itemId: "it4", name: "Gym towel", qty: 1, status: "Issued" }] },
      freeItemsReceived: ["it4"], note: "EDGE (Today): FF ID pending + Key fob pending + T-shirt pending issue (Sec 31 stock 0)" },
    { id: "p13", kind: "Client", name: "Harsh Vardhan", cc: "+91", mobile: "90000 01246", email: "harsh.v@example.com",
      gender: "Male", birthDate: null, ffId: null, source: "Referral", temperature: "Warm", stage: "Converted",
      inquiryType: "Call", campaign: null, ownerUserId: "u7", branchId: "b2", remarks: null, externalId: null,
      createdAt: day(-20), lastActivityAt: day(-6), clientNo: "CL-0999", homeBranchId: "b2", joinedAt: day(-6), keyFob: "KF-S65-0103", photo: null,
      membership: { packageId: "pk5", package: "Quarterly Membership", saleType: "Paid", start: day(-6), end: day(83), price: 8000,
        discount: 0, discountReason: null, finalPrice: 8000, salesRepUserId: "u7", freeItems: [] },
      note: "EDGE (Today): only FF ID pending, Sec 65" },
    { id: "p14", kind: "Lead", name: "Neha Kulkarni", cc: "+91", mobile: "90000 01247", email: null,
      gender: "Female", birthDate: null, ffId: null, source: "Walk-in", temperature: "Warm", stage: "New",
      inquiryType: "Walk-in", campaign: null, ownerUserId: null, createdByUserId: "u4", branchId: "b1", remarks: "Asked at the front desk",
      externalId: null, createdAt: day(0, 10, 30), lastActivityAt: day(0, 10, 30), note: "EDGE (Today): unassigned walk-in, Sec 31, not from Meta" },
    { id: "p15", kind: "Lead", name: "Manish Tiwari", cc: "+91", mobile: "90000 01248", email: "manish.t@example.com",
      gender: "Male", birthDate: null, ffId: null, source: "Google", temperature: "Warm", stage: "Contacted",
      inquiryType: "Call", campaign: null, ownerUserId: "u7", branchId: "b2", remarks: null,
      externalId: null, createdAt: day(-7), lastActivityAt: day(-3), note: "EDGE (Today): overdue, Sec 65" },
    { id: "p16", kind: "Lead", name: "Ritika Saxena", cc: "+91", mobile: "90000 01249", email: "ritika.s@example.com",
      gender: "Female", birthDate: null, ffId: null, source: "Instagram", temperature: "Hot", stage: "Negotiation",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u10", branchId: "b3", remarks: null,
      externalId: null, createdAt: day(-10), lastActivityAt: day(-5), note: "EDGE (Today): overdue 4 days, Golf Course" },
    { id: "p17", kind: "Lead", name: "Arnav Chopra", cc: "+91", mobile: "90000 01250", email: "arnav.c@example.com",
      gender: "Male", birthDate: null, ffId: null, source: "Referral", temperature: "Warm", stage: "Contacted",
      inquiryType: "Call", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null,
      externalId: null, createdAt: day(-5), lastActivityAt: day(-2), note: "EDGE (Today): overdue 1 day, Priya" },
    { id: "p18", kind: "Client", name: "Kabir Malhotra", cc: "+91", mobile: "90000 01251", email: "kabir.m@example.com",
      gender: "Male", birthDate: "1996-09-21", ffId: "FF-20610", source: "Walk-in", temperature: "Hot", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null, externalId: null,
      createdAt: day(-14), lastActivityAt: day(-10), clientNo: "CL-1000", homeBranchId: "b1", joinedAt: day(-10), keyFob: null, photo: null,
      membership: { packageId: "pk4", package: "Monthly Membership", saleType: "Paid", start: day(-10), end: day(19), price: 3000,
        discount: 0, discountReason: null, finalPrice: 3000, salesRepUserId: "u6", freeItems: [] },
      note: "EDGE (payment): partial PT — 12 sessions ₹12,000, paid ₹5,500 -> 5 of 12 sessions unlocked, balance due" }
  );

  // ---------- Payments (decisions #79–#84). payment = { total, paid, dueDate, receipts: [{ no, at, by, rows: [{ method, amount, ref, slip }] }] }
  function rc(no, at, by, rows) { return { no: no, at: at, by: by, rows: rows.map(function (r) { return { method: r[0], amount: r[1], ref: r[2] || null, slip: r[3] || null }; }) }; }
  function pay(total, dueDate, receipts) {
    var paid = 0; receipts.forEach(function (x) { x.rows.forEach(function (r) { paid += r.amount; }); });
    return { total: total, paid: paid, dueDate: dueDate || null, receipts: receipts };
  }
  function P(id) { return people.filter(function (x) { return x.id === id; })[0]; }
  P("p6").membership.payment = pay(800, null, [rc("S65-000041", day(-2), "u7", [["UPI", 800, "UPI-55821934"]])]);
  // EDGE: partial membership — Annual + fob deposit ₹22,800, paid ₹16,200 by card, balance ₹6,600 due in 5 days
  P("p7").membership.payment = pay(22800, dd(5), [rc("S31-000098", day(-100), "u6", [["Card", 16200, "CARD-4471"]])]);
  // EDGE: full payment, cash
  P("p12").membership.payment = pay(24000, null, [rc("S31-000121", day(-3), "u6", [["Cash", 24000]])]);
  // EDGE: split payment cash + UPI (Quarterly ₹8,000 + fob deposit ₹1,200)
  P("p13").membership.payment = pay(9200, null, [rc("S65-000056", day(-6), "u7", [["Cash", 3000], ["UPI", 6200, "UPI-77120345"]])]);
  P("p18").membership.payment = pay(3000, null, [rc("S31-000119", day(-10), "u6", [["UPI", 3000, "UPI-60012877"]])]);
  // EDGE: partial PT — per-session price (12,000 − 0) / 12 = 1,000; paid 5,500 -> 5 sessions unlocked
  P("p18").pt = { packageId: "pk9", package: "PT 12 Sessions", price: 12000, discount: 0, finalPrice: 12000, sessions: 12, start: day(-10), end: day(79),
    salesRepUserId: "u6", payment: pay(12000, dd(7), [rc("S31-000120", day(-10), "u6", [["Cash", 5500]])]) };

  // CreatedBy never changes; Owner is changeable (history kept); Sales rep is per sale line (decision #36).
  people.forEach(function (p) {
    if (!("createdByUserId" in p)) p.createdByUserId = p.synced ? null : p.ownerUserId;  // Meta sync: created by the system
    if (!p.ownerHistory) p.ownerHistory = [];
    if (p.freeTrialCount == null) p.freeTrialCount = 0;
  });

  // Used by the quick lead modal to demo the live duplicate check.
  // Decision #19: same branch -> name + "Open profile"; other branch -> branch + owner first name + "Request access".
  var duplicateMobileAttempts = [
    { cc: "+91", mobile: "90000 01234", matchesPersonId: "p1",
      note: "EDGE (same branch, viewing Sec 31): 'Already exists: Aarav Patel' + Open profile" },
    { cc: "+91", mobile: "90000 01244", matchesPersonId: "p11",
      note: "EDGE (other branch): 'Already exists in Golf Course · Owner: Pooja' + Request access" }
  ];

  var followUps = [
    { id: "f1", personId: "p1", type: "Call", dueDate: dd(-2), dueTime: "17:00", ownerUserId: "u6", status: "Open", outcome: null, note: "Send price for quarterly" },
    { id: "f2", personId: "p4", type: "WhatsApp", dueDate: dd(0), dueTime: "16:00", ownerUserId: "u6", status: "Open", outcome: null, note: "Share batch timings" },
    { id: "f20", personId: "p7", type: "Payment expected", dueDate: dd(5), dueTime: null, ownerUserId: "u6", status: "Open", outcome: null, note: "Balance ₹6,600" },
    { id: "f21", personId: "p18", type: "Payment expected", dueDate: dd(7), dueTime: null, ownerUserId: "u6", status: "Open", outcome: null, note: "PT balance ₹6,500" },
    { id: "f3", personId: "p5", type: "Visit planned", dueDate: dd(2), dueTime: "18:00", ownerUserId: "u6", status: "Open", outcome: null, note: "End of free trial — discuss plans" },
    { id: "f4", personId: "p9", type: "Call", dueDate: dd(0), dueTime: "12:00", ownerUserId: "u10", status: "Open", outcome: null, note: null },
    { id: "f5", personId: "p10", type: "Call", dueDate: dd(3), dueTime: null, ownerUserId: "u7", status: "Open", outcome: null, note: null },
    { id: "f9", personId: "p11", type: "Visit planned", dueDate: dd(1), dueTime: "18:00", ownerUserId: "u11", status: "Open", outcome: null, note: null },
    { id: "f6", personId: "p1", type: "Call", dueDate: dd(-5), dueTime: "11:00", ownerUserId: "u6", status: "Done", outcome: "Interested", note: "Asked about quarterly price", doneAt: day(-5, 11, 20), nextId: "f1" },
    { id: "f7", personId: "p3", type: "Call", dueDate: dd(-20), dueTime: "11:00", ownerUserId: "u7", status: "Done", outcome: "Not interested", note: "Too expensive", doneAt: day(-20, 11, 10) },
    { id: "f8", personId: "p2", type: "Call", dueDate: dd(-5), dueTime: "10:00", ownerUserId: "u6", status: "Cancelled", outcome: null, note: null, cancelledAt: day(-6, 9), cancelReason: "Duplicate entry" },
    { id: "f10", personId: "p4", type: "Call", dueDate: dd(-35), dueTime: "12:00", ownerUserId: "u6", status: "Done", outcome: "Call later", note: "Busy with exams", doneAt: day(-35, 12, 5) },
    { id: "f11", personId: "p6", type: "Free trial planned", dueDate: dd(-4), dueTime: "10:00", ownerUserId: "u7", status: "Done", outcome: "Interested", note: "Liked the trainers", doneAt: day(-4, 10, 30) },
    { id: "f13", personId: "p15", type: "Call", dueDate: dd(-1), dueTime: "12:00", ownerUserId: "u7", status: "Open", outcome: null, note: "Wants weekend batch" },
    { id: "f14", personId: "p16", type: "Visit planned", dueDate: dd(-4), dueTime: "18:00", ownerUserId: "u10", status: "Open", outcome: null, note: null },
    { id: "f15", personId: "p17", type: "WhatsApp", dueDate: dd(-1), dueTime: null, ownerUserId: "u6", status: "Open", outcome: null, note: "Send couple PT details" },
    { id: "f12", personId: "p7", type: "Call", dueDate: dd(7), dueTime: "11:00", ownerUserId: "u6", status: "Open", outcome: null, note: "Check how training is going" }
  ];

  var workTasks = [  // WorkTask (staff work, decision #6)
    { id: "t1", title: "Collect ID proof copy", assignedUserId: "u6", dueAt: day(-1, 18), priority: "High", personId: "p7", status: "Open", note: null },
    { id: "t2", title: "Prepare Diwali offer flyer", assignedUserId: "u5", dueAt: day(0, 17), priority: "Medium", personId: null, status: "Open", note: null },
    { id: "t3", title: "Assign trainer for trial", assignedUserId: "u8", dueAt: day(1, 9), priority: "Critical", personId: "p5", status: "Open", note: "Morning slot" },
    { id: "t4", title: "Call back about locker", assignedUserId: "u7", dueAt: day(-3, 12), priority: "Low", personId: "p6", status: "Done", note: null },
    { id: "t6", title: "Print welcome kit for Rohit", assignedUserId: "u6", dueAt: day(0, 15), priority: "Medium", personId: "p12", status: "Open", note: null },
    { id: "t7", title: "Check fob stock count", assignedUserId: "u4", dueAt: day(0, 12), priority: "High", personId: null, status: "Open", note: null },
    { id: "t5", title: "Update brochure stock", assignedUserId: "u9", dueAt: day(2, 12), priority: "Low", personId: null, status: "Cancelled", note: null }
  ];

  // Human-language timeline events.
  var timeline = [
    // "Lead created" and finished/cancelled follow-ups are generated from people + followUps, not stored here.
    { personId: "p1", at: day(-4), kind: "note", text: "Priya noted: wants morning batch, 6–7 am", by: "u6" },
    { personId: "p1", at: day(-3), kind: "whatsapp", text: "Priya sent WhatsApp · quarterly price list", by: "u6" },
    { personId: "p2", at: day(-5, 15), kind: "note", text: "Priya noted: saw our Instagram reel, asked about Zumba", by: "u6" },
    { personId: "p3", at: day(-20, 11, 15), kind: "milestone", text: "Marked as Lost · Price high", by: "u7" },
    { personId: "p4", at: day(-30), kind: "milestone", text: "Marked as Lost · Timing issue", by: "u6" },
    { personId: "p4", at: day(-1), kind: "milestone", text: "Re-opened by Priya Sharma", by: "u6" },
    { personId: "p4", at: day(-1, 12), kind: "note", text: "Priya noted: exams over, wants evening batch", by: "u6" },
    { personId: "p5", at: day(-1), kind: "milestone", text: "Free trial started · 3 days", by: "u6" },
    { personId: "p6", at: day(-2), kind: "milestone", text: "Converted to Client · Trial Paid 7 Days", by: "u7" },
    { personId: "p7", at: day(-100), kind: "milestone", text: "Converted to Client · Annual Membership · key fob KF-S31-0012", by: "u6" },
    { personId: "p7", at: day(-7), kind: "note", text: "Priya noted: asked about PT sessions for next month", by: "u6" },
    { personId: "p8", at: day(0, 8, 15), kind: "milestone", text: "Lead received from Meta · waiting for an owner" },
    { personId: "p10", at: day(-1), kind: "whatsapp", text: "Arjun sent WhatsApp · price list", by: "u7" }
  ];

  // ---------- Masters (decisions #49–#56) ----------
  // Tax categories: admin master. Prices are stored INCL. GST; GST is worked out backwards. No rates in logic.
  var taxCategories = [
    { id: "tx1", name: "Gym services", rate: 5,  active: true },
    { id: "tx2", name: "Goods 18%",    rate: 18, active: true },
    { id: "tx3", name: "Goods 12%",    rate: 12, active: true },
    { id: "tx4", name: "Exempt",       rate: 0,  active: true }
  ];
  var membershipSubTypes = ["Regular", "Student", "Corporate", "Premium"];   // admin list
  var ptSubTypes = ["One-on-one", "Group"];                                     // admin list
  var addOnKinds = ["Transfer"];                                                // fixed in code

  // ONE item list: accessories, free items and the key fob (decision #53).
  // sellingPrice is incl. GST and admin-only. Key fob sellingPrice = refundable deposit.
  var items = [
    { id: "it1", name: "Key fob",        kind: "Key fob",   costPrice: 150, sellingPrice: 1200, taxCategoryId: "tx4", active: true },
    { id: "it2", name: "T-shirt",        kind: "Accessory", costPrice: 220, sellingPrice: 599,  taxCategoryId: "tx3", active: true },
    { id: "it3", name: "Shaker bottle",  kind: "Accessory", costPrice: 120, sellingPrice: 349,  taxCategoryId: "tx2", active: true },
    { id: "it4", name: "Gym towel",      kind: "Accessory", costPrice: 90,  sellingPrice: 249,  taxCategoryId: "tx3", active: true },
    { id: "it5", name: "Gym bag",        kind: "Accessory", costPrice: 450, sellingPrice: 1199, taxCategoryId: "tx2", active: false }
  ];
  // Accessory stock per branch (key fobs are tracked one by one in keyFobs).
  var itemStock = [
    { itemId: "it2", branchId: "b1", qty: 0 },   // EDGE: T-shirt out of stock at Sec 31 (free item -> "Pending issue")
    { itemId: "it2", branchId: "b2", qty: 14 },
    { itemId: "it2", branchId: "b3", qty: 6 },
    { itemId: "it3", branchId: "b1", qty: 25 },
    { itemId: "it3", branchId: "b2", qty: 0 },   // EDGE: accessory with 0 stock
    { itemId: "it4", branchId: "b1", qty: 40 },
    { itemId: "it4", branchId: "b3", qty: 12 }
  ];
  var stockMoves = [
    { itemId: "it2", branchId: "b1", qty: 20, at: day(-30), by: "u4", note: "Opening stock" },
    { itemId: "it2", branchId: "b1", qty: -20, at: day(-3), by: "u4", note: "Given free with memberships" },
    { itemId: "it3", branchId: "b1", qty: 25, at: day(-10), by: "u4", note: "Supplier delivery" },
    { itemId: "it3", branchId: "b2", qty: 10, at: day(-25), by: "u3", note: "Opening stock" },
    { itemId: "it3", branchId: "b2", qty: -10, at: day(-2), by: "u3", note: "Sold" },
    { itemId: "it4", branchId: "b1", qty: 40, at: day(-15), by: "u4", note: "Opening stock" },
    { itemId: "it2", branchId: "b2", qty: 14, at: day(-20), by: "u3", note: "Opening stock" },
    { itemId: "it2", branchId: "b3", qty: 6, at: day(-20), by: "u1", note: "Opening stock" },
    { itemId: "it4", branchId: "b3", qty: 12, at: day(-20), by: "u1", note: "Opening stock" }
  ];

  // Packages (decisions #20, #50). category Membership | PT | Add-on; isTrial; price incl. GST.
  // priceHistory: a price applies from its date; the latest one on or before today is the current price.
  // type / saleType / price are DERIVED in app.js (App.derivePackage), never typed by hand.
  // soldCount > 0 locks category, trial, people, days, sessions.
  function pk(id, name, category, o) {
    return Object.assign({ id: id, name: name, category: category, subType: null, isTrial: false, people: 1, days: null, sessions: null,
      taxCategoryId: "tx1", requiresMembership: category === "PT", branchIds: ["b1", "b2", "b3"], audience: "Both",
      freeItems: [], active: true, soldCount: 0 }, o);
  }
  var packages = [
    pk("pk1",  "Free Trial",                "Membership", { isTrial: true, days: 1, priceHistory: [{ price: 0, from: dd(-365) }], soldCount: 9 }),
    pk("pk2",  "Trial Paid 7 Days",         "Membership", { isTrial: true, days: 7, priceHistory: [{ price: 800, from: dd(-365) }], soldCount: 3 }),
    pk("pk3",  "Trial Paid 15 Days",        "Membership", { isTrial: true, days: 15, priceHistory: [{ price: 1500, from: dd(-365) }] }),
    pk("pk4",  "Monthly Membership",        "Membership", { subType: "Regular", days: 30, soldCount: 12,
      priceHistory: [{ price: 2800, from: dd(-400) }, { price: 3000, from: dd(-120) }, { price: 3300, from: dd(20) }] }),   // EDGE: future price change
    pk("pk5",  "Quarterly Membership",      "Membership", { subType: "Regular", days: 90, priceHistory: [{ price: 8000, from: dd(-365) }], soldCount: 5 }),
    pk("pk6",  "Half-Yearly Membership",    "Membership", { subType: "Regular", days: 180, priceHistory: [{ price: 14000, from: dd(-365) }], soldCount: 2 }),
    pk("pk7",  "Annual Membership",         "Membership", { subType: "Regular", days: 365, priceHistory: [{ price: 24000, from: dd(-365) }], soldCount: 8,
      freeItems: [{ itemId: "it2", qty: 1, rule: "Once per client" }, { itemId: "it4", qty: 1, rule: "Every sale" }] }),  // EDGE: sold (locked) + free items; T-shirt out of stock at Sec 31
    pk("pk9",  "PT 12 Sessions",            "PT", { subType: "One-on-one", days: 90, sessions: 12, priceHistory: [{ price: 12000, from: dd(-365) }], soldCount: 4 }),
    pk("pk10", "PT 24 Sessions",            "PT", { subType: "One-on-one", days: 180, sessions: 24, priceHistory: [{ price: 22000, from: dd(-365) }], soldCount: 1 }),
    pk("pk11", "Annual + PT Premium Combo", "Membership", { subType: "Premium", days: 365, priceHistory: [{ price: 100000, from: dd(-200) }] }),
    pk("pk12", "Couple PT 12 Sessions",     "PT", { subType: "One-on-one", people: 2, days: 90, sessions: 12, priceHistory: [{ price: 20000, from: dd(-60) }] }),  // EDGE: couple PT
    pk("pk13", "Branch transfer",           "Add-on", { subType: "Transfer", priceHistory: [{ price: 0, from: dd(-90) }], requiresMembership: true }),          // EDGE: free Add-on (allowed, decision #45)
    pk("pk14", "Student Monthly",           "Membership", { subType: "Student", days: 30, audience: "New", branchIds: ["b1", "b2"],
      priceHistory: [{ price: 2200, from: dd(-5) }] }),                                                                                            // EDGE: never sold, fully editable
    pk("pk15", "Summer Monthly 2025",       "Membership", { subType: "Regular", days: 30, active: false, priceHistory: [{ price: 2500, from: dd(-500) }], soldCount: 6 }), // EDGE: inactive
    pk("pk16", "Renewal Annual Offer",      "Membership", { subType: "Regular", days: 365, audience: "Renewal", priceHistory: [{ price: 21000, from: dd(-30) }] })     // renewal only: hidden for leads
  ];

  // Key fobs per branch (decisions #13, #30, #55). Deposit = Key fob item selling price, collected as a sale line.
  var keyFobs = [
    { no: "KF-S31-0012", branchId: "b1", status: "Assigned", personId: "p7", deposit: { amount: 1200, refunded: 0 },
      history: [{ at: day(-100), text: "Assigned to Vivaan Joshi · deposit ₹1,200 collected", by: "u6" }] },
    { no: "KF-S31-0013", branchId: "b1", status: "In stock", personId: null },
    { no: "KF-S31-0014", branchId: "b1", status: "In stock", personId: null },
    { no: "KF-S31-0009", branchId: "b1", status: "Lost", personId: null, deposit: { amount: 1200, refunded: 0 },             // EDGE: lost fob, deposit kept
      history: [{ at: day(-200), text: "Assigned to a former client · deposit ₹1,200 collected", by: "u6" }, { at: day(-40), text: "Marked as Lost", by: "u4" }] },
    { no: "KF-S65-0101", branchId: "b2", status: "In stock", personId: null },
    { no: "KF-S65-0102", branchId: "b2", status: "Returned", personId: null, deposit: { amount: 1200, refunded: 600, refundReason: "Strap damaged" },  // EDGE: partial refund
      history: [{ at: day(-150), text: "Assigned · deposit ₹1,200 collected", by: "u7" }, { at: day(-12), text: "Returned", by: "u7" },
        { at: day(-12), text: "Deposit refunded ₹600 of ₹1,200 · Strap damaged", by: "u3" }] },
    { no: "KF-S65-0103", branchId: "b2", status: "Assigned", personId: "p13", deposit: { amount: 1200, refunded: 0 },
      history: [{ at: day(-6), text: "Assigned to Harsh Vardhan · deposit ₹1,200 collected", by: "u7" }] },
    { no: "KF-GC-0201",  branchId: "b3", status: "In stock", personId: null },
    { no: "KF-GC-0202",  branchId: "b3", status: "In stock", personId: null }
  ];
  keyFobs.forEach(function (k) { if (!k.history) k.history = [{ at: day(-90), text: "Added to stock", by: "u1" }]; if (!k.deposit) k.deposit = null; });

  // Demo person shown for each "View as" role (placeholder until the permission matrix).
  var roleDemoUser = { "SuperAdmin": "u1", "CEO": "u2", "Regional Manager": "u3", "Club Manager": "u4",
    "Sales Manager": "u5", "Sales Executive": "u6", "Trainer": "u8", "MXM": "u9" };

  var notifications = [
    { id: "n1", text: "New lead from Meta: Fatima Shaikh · Golf Course", at: day(0, 8, 15), unread: true },
    { id: "n2", text: "Aarav Patel's follow-up is overdue", at: day(-2, 17), unread: true },
    { id: "n3", text: "Task due today: Prepare Diwali offer flyer", at: day(0, 9), unread: true }
  ];

  window.DUMMY = {
    roleDemoUser: roleDemoUser, notifications: notifications,
    branches: branches, roles: roles, users: users, lists: lists, people: people,
    followUps: followUps, workTasks: workTasks, timeline: timeline, packages: packages,
    keyFobs: keyFobs, taxCategories: taxCategories, items: items, itemStock: itemStock, stockMoves: stockMoves,
    membershipSubTypes: membershipSubTypes, ptSubTypes: ptSubTypes, addOnKinds: addOnKinds,
    // Max discount % by role (decision #77). Default, can change in Settings → Sales rules. Every role has a number; never "no limit".
    discountLimits: { "SuperAdmin": 100, "CEO": 50, "Regional Manager": 50, "Club Manager": 30, "Sales Manager": 20, "Sales Executive": 10, "Trainer": 0, "MXM": 0 },
    discountLimitDefaults: { "SuperAdmin": 100, "CEO": 50, "Regional Manager": 50, "Club Manager": 30, "Sales Manager": 20, "Sales Executive": 10, "Trainer": 0, "MXM": 0 },
    // Payment methods (decision #80). Default, can change. needsRef: reference / transaction no. required.
    paymentMethods: [
      { id: "pm1", name: "Cash", needsRef: false, active: true, isDefault: true },
      { id: "pm2", name: "UPI", needsRef: true, active: true, isDefault: true },
      { id: "pm3", name: "Net banking", needsRef: true, active: true, isDefault: true },
      { id: "pm4", name: "Card", needsRef: true, active: true, isDefault: true },
      { id: "pm5", name: "Cheque", needsRef: true, active: false, isDefault: false }   // EDGE: disabled method (hidden in Sell mode)
    ],
    // Receipt no. per branch (decision #81): <prefix>-<6 digits>, next = last + 1. Default, can change.
    receiptPrefix: { b1: "S31", b2: "S65", b3: "GC" },
    receiptSeq: { b1: 123, b2: 57, b3: 31 },
    nextClientNo: 1003, duplicateMobileAttempts: duplicateMobileAttempts,
    docs: [{ personId: "p7", type: "ID proof", name: "Aadhaar copy (placeholder).pdf", at: day(-100), by: "u6" }],
    docTypes: ["ID proof", "Waiver/consent form", "Medical form", "Photo", "Other"],
    currentUserId: "u6", currentRole: "Sales Executive", currentBranchId: "b1"
  };
})();
