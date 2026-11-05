/* ONE shared dummy data set for every screen. All names/numbers are fake.
   Dates are relative to the day the page is opened, so "overdue" stays overdue. */
(function () {
  function day(offset, hh, mm) {
    var d = new Date(); d.setDate(d.getDate() + offset);
    d.setHours(hh == null ? 11 : hh, mm || 0, 0, 0);
    return d.toISOString();
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
    taskStatuses: ["Open", "Done", "Cancelled"],
    priorities: ["Critical", "High", "Medium", "Low"],
    saleTypes: ["Trial", "Trial Paid", "Paid"],
    fobStatuses: ["In stock", "Assigned", "Lost", "Returned"],
    inquiryTypes: ["Call", "Walk-in"],
    genders: ["Female", "Male", "Other"],
    countryCodes: ["+91", "+971", "+1", "+44"]
  };

  // Lead + client share ONE person record (type: "Lead" | "Client").
  var people = [
    { id: "p1", type: "Lead", name: "Aarav Patel", cc: "+91", mobile: "90000 01234", email: "aarav.patel@example.com",
      gender: "Male", birthDate: "1995-04-12", ffId: null, source: "Walk-in", temperature: "Hot", stage: "Negotiation",
      inquiryType: "Walk-in", campaign: null, ownerId: "u6", branchId: "b1", remarks: "Wants morning batch",
      externalId: null, createdAt: day(-12), lastActivityAt: day(-3), note: "EDGE: overdue follow-up" },
    { id: "p2", type: "Lead", name: "Sneha Reddy", cc: "+91", mobile: "90000 01235", email: null,
      gender: "Female", birthDate: null, ffId: null, source: "Instagram", temperature: "Warm", stage: "Contacted",
      inquiryType: "Call", campaign: null, ownerId: "u6", branchId: "b1", remarks: null,
      externalId: null, createdAt: day(-6), lastActivityAt: day(-5), note: "EDGE: no follow-up set" },
    { id: "p3", type: "Lead", name: "Rajesh Kumar", cc: "+91", mobile: "90000 01236", email: "rajesh.k@example.com",
      gender: "Male", birthDate: "1988-09-30", ffId: null, source: "Referral", temperature: "Cold", stage: "Lost",
      lostReason: "Price high", inquiryType: "Call", campaign: null, ownerId: "u7", branchId: "b2", remarks: null,
      externalId: null, createdAt: day(-40), lastActivityAt: day(-20), note: "EDGE: lost lead" },
    { id: "p4", type: "Lead", name: "Kavya Menon", cc: "+91", mobile: "90000 01237", email: "kavya.menon@example.com",
      gender: "Female", birthDate: "1999-01-22", ffId: null, source: "Phone Call", temperature: "Warm", stage: "Contacted",
      lostReason: null, inquiryType: "Call", campaign: null, ownerId: "u6", branchId: "b1", remarks: "Was lost (Timing issue), re-opened",
      externalId: null, createdAt: day(-60), lastActivityAt: day(-1), reopenedAt: day(-1), note: "EDGE: re-opened lead" },
    { id: "p5", type: "Lead", name: "Ishaan Singh", cc: "+91", mobile: "90000 01238", email: "ishaan.singh@example.com",
      gender: "Male", birthDate: "2001-07-04", ffId: null, source: "Website", temperature: "Hot", stage: "Trial",
      inquiryType: "Walk-in", campaign: "Diwali Fit 2026", ownerId: "u6", branchId: "b1", remarks: null,
      externalId: null, createdAt: day(-4), lastActivityAt: day(-1), freeTrial: { from: day(-1), to: day(2) },
      note: "EDGE: free trial lead (stays a Lead)" },
    { id: "p6", type: "Client", name: "Ananya Desai", cc: "+91", mobile: "90000 01239", email: "ananya.desai@example.com",
      gender: "Female", birthDate: "1993-11-15", ffId: "FF-20431", source: "Facebook", temperature: "Hot", stage: "Converted",
      inquiryType: "Call", campaign: null, ownerId: "u7", branchId: "b2", remarks: null, externalId: null,
      createdAt: day(-15), lastActivityAt: day(-2), clientNo: "CL-1002", homeBranchId: "b2", joinedAt: day(-2),
      keyFob: null, photo: null,
      membership: { packageId: "pk2", package: "Trial Paid 7 Days", saleType: "Trial Paid", start: day(-2), end: day(5), price: 800 },
      note: "EDGE: paid trial client (no fob)" },
    { id: "p7", type: "Client", name: "Vivaan Joshi", cc: "+91", mobile: "90000 01240", email: "vivaan.joshi@example.com",
      gender: "Male", birthDate: "1990-02-08", ffId: "FF-19877", source: "Referral", temperature: "Hot", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerId: "u6", branchId: "b1", remarks: null, externalId: null,
      createdAt: day(-120), lastActivityAt: day(-7), clientNo: "CL-1001", homeBranchId: "b1", joinedAt: day(-100),
      keyFob: "KF-S31-0012", photo: null,
      membership: { packageId: "pk7", package: "Annual Membership", saleType: "Paid", start: day(-100), end: day(265), price: 24000 },
      note: "EDGE: paid member with key fob" },
    { id: "p8", type: "Lead", name: "Fatima Shaikh", cc: "+91", mobile: "90000 01241", email: null,
      gender: null, birthDate: null, ffId: null, source: "Facebook", temperature: "Warm", stage: "New",
      inquiryType: null, campaign: "Meta Lead Ad – Nov", ownerId: null, branchId: "b3", remarks: null,
      externalId: "meta_1203948571", synced: true, createdAt: day(0, 8, 15), lastActivityAt: day(0, 8, 15),
      note: "EDGE: synced from Meta, unassigned" },
    { id: "p9", type: "Lead", name: "Aditya Bose", cc: "+91", mobile: "90000 01242", email: "aditya.bose@example.com",
      gender: "Male", birthDate: null, ffId: null, source: "Google", temperature: "Cold", stage: "New",
      inquiryType: "Call", campaign: null, ownerId: "u10", branchId: "b3", remarks: null,
      externalId: null, createdAt: day(-1), lastActivityAt: day(-1), note: "Follow-up due today" },
    { id: "p10", type: "Lead", name: "Nisha Agarwal", cc: "+91", mobile: "90000 01243", email: "nisha.a@example.com",
      gender: "Female", birthDate: "1997-06-19", ffId: null, source: "WhatsApp", temperature: "Warm", stage: "Contacted",
      inquiryType: "Call", campaign: null, ownerId: "u7", branchId: "b2", remarks: null,
      externalId: null, createdAt: day(-3), lastActivityAt: day(-1), note: "Follow-up scheduled (green)" },
    { id: "p11", type: "Lead", name: "Simran Kaur", cc: "+91", mobile: "90000 01244", email: "simran.kaur@example.com",
      gender: "Female", birthDate: null, ffId: null, source: "Referral", temperature: "Warm", stage: "Contacted",
      inquiryType: "Walk-in", campaign: null, ownerId: "u11", branchId: "b3", remarks: null,
      externalId: null, createdAt: day(-8), lastActivityAt: day(-2), note: "EDGE: duplicate target in another branch" }
  ];

  // Used by the quick lead modal to demo the live duplicate check.
  // Decision #19: same branch -> name + "Open profile"; other branch -> branch + owner first name + "Request access".
  var duplicateMobileAttempts = [
    { cc: "+91", mobile: "90000 01234", matchesPersonId: "p1",
      note: "EDGE (same branch, viewing Sec 31): 'Already exists: Aarav Patel' + Open profile" },
    { cc: "+91", mobile: "90000 01244", matchesPersonId: "p11",
      note: "EDGE (other branch): 'Already exists in Golf Course · Owner: Pooja' + Request access" }
  ];

  var followUps = [
    { id: "f1", personId: "p1", type: "Call", dueAt: day(-2, 17), ownerId: "u6", status: "Open", outcome: null, note: "Send price for quarterly" },
    { id: "f2", personId: "p4", type: "WhatsApp", dueAt: day(0, 16), ownerId: "u6", status: "Open", outcome: null, note: "Share batch timings" },
    { id: "f3", personId: "p5", type: "Visit planned", dueAt: day(2, 18), ownerId: "u6", status: "Open", outcome: null, note: "End of free trial — discuss plans" },
    { id: "f4", personId: "p9", type: "Call", dueAt: day(0, 12), ownerId: "u10", status: "Open", outcome: null, note: null },
    { id: "f5", personId: "p10", type: "Call", dueAt: day(3, 11), ownerId: "u7", status: "Open", outcome: null, note: null },
    { id: "f9", personId: "p11", type: "Visit planned", dueAt: day(1, 18), ownerId: "u11", status: "Open", outcome: null, note: null },
    { id: "f6", personId: "p1", type: "Call", dueAt: day(-5, 11), ownerId: "u6", status: "Done", outcome: "Interested", note: "Asked about quarterly price", doneAt: day(-5, 11, 20), nextId: "f1" },
    { id: "f7", personId: "p3", type: "Call", dueAt: day(-20, 11), ownerId: "u7", status: "Done", outcome: "Not interested", note: "Too expensive", doneAt: day(-20, 11, 10) },
    { id: "f8", personId: "p2", type: "Call", dueAt: day(-5, 10), ownerId: "u6", status: "Cancelled", outcome: null, note: null, cancelledAt: day(-6, 9), cancelReason: "Duplicate entry" },
    { id: "f10", personId: "p4", type: "Call", dueAt: day(-35, 12), ownerId: "u6", status: "Done", outcome: "Call later", note: "Busy with exams", doneAt: day(-35, 12, 5) },
    { id: "f11", personId: "p6", type: "Free trial planned", dueAt: day(-4, 10), ownerId: "u7", status: "Done", outcome: "Interested", note: "Liked the trainers", doneAt: day(-4, 10, 30) },
    { id: "f12", personId: "p7", type: "Call", dueAt: day(7, 11), ownerId: "u6", status: "Open", outcome: null, note: "Check how training is going" }
  ];

  var tasks = [
    { id: "t1", title: "Collect ID proof copy", assignedTo: "u6", dueAt: day(-1, 18), priority: "High", personId: "p7", status: "Open", note: null },
    { id: "t2", title: "Prepare Diwali offer flyer", assignedTo: "u5", dueAt: day(0, 17), priority: "Medium", personId: null, status: "Open", note: null },
    { id: "t3", title: "Assign trainer for trial", assignedTo: "u8", dueAt: day(1, 9), priority: "Critical", personId: "p5", status: "Open", note: "Morning slot" },
    { id: "t4", title: "Call back about locker", assignedTo: "u7", dueAt: day(-3, 12), priority: "Low", personId: "p6", status: "Done", note: null },
    { id: "t5", title: "Update brochure stock", assignedTo: "u9", dueAt: day(2, 12), priority: "Low", personId: null, status: "Cancelled", note: null }
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

  // type = package type; saleType = Trial | Trial Paid | Paid (decision #14).
  // Assumption: Membership and PT packages are sale type "Paid".
  var packages = [
    { id: "pk1",  name: "Free Trial",                type: "Trial",      saleType: "Trial",      days: 1,   price: 0 },
    { id: "pk2",  name: "Trial Paid 7 Days",         type: "Trial Paid", saleType: "Trial Paid", days: 7,   price: 800 },
    { id: "pk3",  name: "Trial Paid 15 Days",        type: "Trial Paid", saleType: "Trial Paid", days: 15,  price: 1500 },
    { id: "pk4",  name: "Monthly Membership",        type: "Membership", saleType: "Paid",       days: 30,  price: 3000 },
    { id: "pk5",  name: "Quarterly Membership",      type: "Membership", saleType: "Paid",       days: 90,  price: 8000 },
    { id: "pk6",  name: "Half-Yearly Membership",    type: "Membership", saleType: "Paid",       days: 180, price: 14000 },
    { id: "pk7",  name: "Annual Membership",         type: "Membership", saleType: "Paid",       days: 365, price: 24000 },
    { id: "pk8",  name: "Couple Annual Membership",  type: "Membership", saleType: "Paid",       days: 365, price: 45000 },
    { id: "pk9",  name: "PT 12 Sessions",            type: "PT",         saleType: "Paid",       days: 90,  price: 12000 },
    { id: "pk10", name: "PT 24 Sessions",            type: "PT",         saleType: "Paid",       days: 180, price: 22000 },
    { id: "pk11", name: "Annual + PT Premium Combo", type: "Membership", saleType: "Paid",       days: 365, price: 100000 }
  ];

  var keyFobs = [
    { no: "KF-S31-0012", branchId: "b1", status: "Assigned", personId: "p7" },
    { no: "KF-S31-0013", branchId: "b1", status: "In stock", personId: null },
    { no: "KF-S31-0014", branchId: "b1", status: "In stock", personId: null },
    { no: "KF-S31-0009", branchId: "b1", status: "Lost",     personId: null },
    { no: "KF-S65-0101", branchId: "b2", status: "In stock", personId: null },
    { no: "KF-S65-0102", branchId: "b2", status: "Returned", personId: null },
    { no: "KF-GC-0201",  branchId: "b3", status: "In stock", personId: null },
    { no: "KF-GC-0202",  branchId: "b3", status: "In stock", personId: null }
  ];

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
    followUps: followUps, tasks: tasks, timeline: timeline, packages: packages,
    keyFobs: keyFobs, duplicateMobileAttempts: duplicateMobileAttempts,
    docs: [{ personId: "p7", type: "ID proof", name: "Aadhaar copy (placeholder).pdf", at: day(-100), by: "u6" }],
    docTypes: ["ID proof", "Waiver/consent form", "Medical form", "Photo", "Other"],
    currentUserId: "u6", currentRole: "Sales Executive", currentBranchId: "b1"
  };
})();
