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

  // Multi-tenant (decision #102): one tenant = one gym business with its branches. The mockup shows ONE tenant.
  // Every tenant-owned record (branches, users, people, packages) carries tenantId.
  var tenants = [{ id: "t1", name: "Innovana Fitness Labs", createdByUserId: "u1" }];

  var branches = [
    { id: "b1", name: "Sec 31", tenantId: "t1" },
    { id: "b2", name: "Sec 65", tenantId: "t1" },
    { id: "b3", name: "Golf Course", tenantId: "t1" }
  ];

  // Roles are FIXED (decisions #95, #102; notes v3 §2a): seeded, locked rows. Code uses `key`, never a row id.
  // `name` is the label used everywhere on screen (and in users[].role); `short` is the grid column header.
  // 10 TENANT roles (Marketing + HR added, #114); CEO is the top role inside a tenant. SuperAdmin is a PLATFORM role (platformRoles below):
  // it creates tenants and their first CEO account, has no tenant, does no gym work, and is not in the grid or "View as".
  var platformRoles = [
    { key: "SUPER_ADMIN", name: "SuperAdmin", short: "SA", reportsTo: null, multiBranch: true, platform: true }
  ];
  var roles = [
    { key: "CEO",              name: "CEO",              short: "CEO", reportsTo: null,               multiBranch: true  },
    { key: "REGIONAL_MANAGER", name: "Regional Manager", short: "RM",  reportsTo: "CEO",              multiBranch: true  },
    { key: "CLUB_MANAGER",     name: "Club Manager",     short: "CM",  reportsTo: "REGIONAL_MANAGER", multiBranch: false },
    { key: "SALES_MANAGER",    name: "Sales Manager",    short: "SM",  reportsTo: "CLUB_MANAGER",     multiBranch: false },
    { key: "SALES_EXECUTIVE",  name: "Sales Executive",  short: "SE",  reportsTo: "SALES_MANAGER",    multiBranch: false },
    { key: "MXM",              name: "MXM",              short: "MXM", reportsTo: "CLUB_MANAGER",     multiBranch: false },
    { key: "TRAINER",          name: "Trainer",          short: "TR",  reportsTo: "MXM",              multiBranch: false },
    // Finance / HR / Marketing: branches picked when the user is created, one or many (#114). Only CEO has every branch (All).
    { key: "FINANCE",          name: "Finance",          short: "FIN", reportsTo: "CLUB_MANAGER",     multiBranch: true  },
    // Marketing / HR (#114): no lead / trial / sales / client access by default. HR has nothing in the mockup yet (staff screens are real-app only).
    { key: "MARKETING",        name: "Marketing",        short: "MKT", reportsTo: "CEO",              multiBranch: true  },
    { key: "HR",               name: "HR",               short: "HR",  reportsTo: "CEO",              multiBranch: true  }
  ];

  // Trainer types: admin master list, not a role (decision #95). Any type can take PT sessions; the type only changes the payout.
  var trainerTypes = [
    { id: "tt1", name: "General Trainer",    short: "GT",    active: true, canTakePT: true },
    { id: "tt2", name: "Personal Trainer",   short: "PT",    active: true, canTakePT: true },
    { id: "tt3", name: "General + Personal", short: "GT-PT", active: true, canTakePT: true }
  ];

  // Staff: exactly one roleKey + branchIds (exactly 1 for single-branch roles); trainers get a trainerTypeId (#95).
  // `role` (name) and `branches` stay for the screens built before #95; they always equal roleKey / branchIds.
  var users = [
    // Platform user (SuperAdmin): no tenant, no branches. Kept only as "who created the tenant / opening stock".
    { id: "u1", name: "Rohan Mehta",    role: "SuperAdmin",       roleKey: "SUPER_ADMIN",      branches: [], branchIds: [], tenantId: null, platform: true },
    { id: "u2", name: "Anita Kapoor",   role: "CEO",              roleKey: "CEO",              branches: ["b1", "b2", "b3"], branchIds: ["b1", "b2", "b3"] },
    { id: "u3", name: "Vikram Rao",     role: "Regional Manager", roleKey: "REGIONAL_MANAGER", branches: ["b1", "b2"],       branchIds: ["b1", "b2"] },
    { id: "u4", name: "Sunita Iyer",    role: "Club Manager",     roleKey: "CLUB_MANAGER",     branches: ["b1"],             branchIds: ["b1"] },
    { id: "u5", name: "Karan Malhotra", role: "Sales Manager",    roleKey: "SALES_MANAGER",    branches: ["b1"],             branchIds: ["b1"] },
    { id: "u6", name: "Priya Sharma",   role: "Sales Executive",  roleKey: "SALES_EXECUTIVE",  branches: ["b1"],             branchIds: ["b1"] },
    { id: "u7", name: "Arjun Nair",     role: "Sales Executive",  roleKey: "SALES_EXECUTIVE",  branches: ["b2"],             branchIds: ["b2"] },
    { id: "u8", name: "Deepak Verma",   role: "Trainer",          roleKey: "TRAINER",          branches: ["b1"],             branchIds: ["b1"], trainerTypeId: "tt2" },
    { id: "u9", name: "Meera Joshi",    role: "MXM",              roleKey: "MXM",              branches: ["b3"],             branchIds: ["b3"] },
    { id: "u10", name: "Rahul Gupta",   role: "Sales Executive",  roleKey: "SALES_EXECUTIVE",  branches: ["b3"],             branchIds: ["b3"] },
    { id: "u11", name: "Pooja Khanna",  role: "Sales Executive",  roleKey: "SALES_EXECUTIVE",  branches: ["b3"],             branchIds: ["b3"] },
    { id: "u12", name: "Nisha Bhatia",  role: "Finance",          roleKey: "FINANCE",          branches: ["b2"],             branchIds: ["b2"] },
    { id: "u13", name: "Sanjay Pillai", role: "Trainer",          roleKey: "TRAINER",          branches: ["b3"],             branchIds: ["b3"], trainerTypeId: "tt3" },
    // c9: every real branch has an MXM and a trainer (PT quotes, #110).
    { id: "u14", name: "Rakesh Yadav",  role: "MXM",              roleKey: "MXM",              branches: ["b2"],             branchIds: ["b2"] },
    { id: "u15", name: "Imran Khan",    role: "Trainer",          roleKey: "TRAINER",          branches: ["b2"],             branchIds: ["b2"], trainerTypeId: "tt2" },
    // c11 (#114): Marketing + HR demo staff.
    { id: "u16", name: "Kavya Menon",   role: "Marketing",        roleKey: "MARKETING",        branches: ["b1", "b2"],       branchIds: ["b1", "b2"] },
    { id: "u17", name: "Farhan Ali",    role: "HR",               roleKey: "HR",               branches: ["b1", "b3"],       branchIds: ["b1", "b3"] }
  ];

  users.forEach(function (u) { if (u.tenantId === undefined) u.tenantId = "t1"; });

  // ---------- Roles & permissions grid (decisions #96, #102, notes v3 §2). Same list as docs/permissions.md. ----------
  // type: "scope" (None / Own / Branch / All), "tick" (true / false), "number" (0–100 %).
  // defaults: per role short name. CEO = everything (locked, top tenant role); TR / MXM / FIN = nothing by default (editable).
  // lock: "all" = every cell locked; minOwn: roles that can never go below Own ("owner always sees own leads").
  var permissionDefs = [
    { key: "leads.view",            module: "Leads",    label: "View leads",                                            type: "scope",  defaults: { SE: "Own", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" }, minOwn: ["SE", "SM", "CM", "RM", "CEO"] },
    { key: "leads.viewUnassigned",  module: "Leads",    label: "View unassigned leads (the \"pool\")",                  type: "scope",  defaults: { CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "leads.take",            module: "Leads",    label: "Take an unassigned lead (\"Take this lead\")",           type: "scope",  defaults: { CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "leads.viewLost",        module: "Leads",    label: "View lost leads",                                       type: "scope",  defaults: { SE: "Own", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "leads.own",             module: "Leads",    label: "Can own leads (owner lists, follow-up person, release / pick lists)", type: "tick", defaults: { SE: true, SM: true, CM: true, RM: true, CEO: true } },
    { key: "leads.crossBranchFollowUp", module: "Leads", label: "Add a follow-up for myself on another branch's lead (walk-in / inquiry)", type: "tick", defaults: { SE: true, SM: true, CM: true, RM: true, CEO: true } },
    { key: "leads.export",          module: "Leads",    label: "Export leads (no export screen yet)",                   type: "tick",   defaults: {} },
    { key: "leads.create",          module: "Leads",    label: "Create lead",                                           type: "tick",   defaults: { SE: true, SM: true, CM: true, RM: true, CEO: true } },
    { key: "leads.assign",          module: "Leads",    label: "Assign / reassign / change owner (leads and clients)", type: "scope",  defaults: { SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" }, atLeastOne: true },
    { key: "leads.assignFollowUp",  module: "Leads",    label: "Assign a follow-up to another staff (any branch)",      type: "scope",  defaults: { SE: "Own", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "leads.markLost",        module: "Leads",    label: "Mark lost",                                             type: "scope",  defaults: { SE: "Own", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "leads.reopen",          module: "Leads",    label: "Re-open lost lead",                                     type: "scope",  defaults: { SE: "Own", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "leads.move",            module: "Leads",    label: "Move lead to another branch",                           type: "scope",  defaults: { SE: "Own", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "leads.movePickPerson",  module: "Leads",    label: "While moving, pick the follow-up person in the new branch directly", type: "scope", defaults: { CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "trials.book",           module: "Trials",   label: "Book trial",                                            type: "scope",  defaults: { SE: "Own", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "trials.editLimits",     module: "Trials",   label: "Edit free-trial limit settings (per person, per branch)", type: "tick", defaults: { CM: true, RM: true, CEO: true } },
    { key: "trials.approve",        module: "Trials",   label: "Can be picked as trial approver (approve / reject)",    type: "scope",  defaults: { SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "trials.adjustAfterEnd", module: "Trials",   label: "Paid trial adjust after it ended (7-day buffer)",       type: "scope",  defaults: { CM: "Branch", CEO: "All" } },
    { key: "sales.convert",         module: "Sales",    label: "Convert to Client / Sell",                              type: "scope",  defaults: { SE: "Own", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    // Max discount per role = % AND a ₹ cap; the LOWER applies; cap 0 = no ₹ cap; % 0 = no discount (#77, #103 Q22).
    // Defaults keep the #77 % with no cap; demo: SM 20% · max ₹5,000. CEO set by the club in the grid (Q31 closed).
    { key: "sales.discountMax",     module: "Sales",    label: "Max discount % · max ₹",                    type: "pctcap", defaults: { SE: { pct: 10, cap: 0 }, SM: { pct: 20, cap: 5000 }, CM: { pct: 30, cap: 0 }, RM: { pct: 50, cap: 0 }, CEO: { pct: 100, cap: 0 } } },
    // PT quote flow (#110): SE sells MEMBERSHIP only; PT / Premium PT are decided by CM / MXM in a quote; the SE bills the quote.
    { key: "sales.sellMembership",  module: "Sales",    label: "Sell membership packages",                              type: "tick",   defaults: { SE: true, SM: true, CM: true, RM: true, CEO: true } },
    { key: "pt.quote",              module: "Sales",    label: "Create PT quote / book PT trial (CM / MXM decide trainer + price)", type: "scope", defaults: { CM: "Branch", MXM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "sales.sellPTDirect",    module: "Sales",    label: "Sell PT / Premium PT without a quote",                  type: "tick",   defaults: {} },
    { key: "sales.sellFromQuote",   module: "Sales",    label: "Bill a PT quote",                                       type: "tick",   defaults: { SE: true, SM: true, CM: true, CEO: true } },
    { key: "sales.rep",             module: "Sales",    label: "Can be sales rep",                                      type: "tick",   defaults: { SE: true, SM: true, CM: true, RM: true, CEO: true } },
    { key: "sales.sellCrossBranch", module: "Sales",    label: "\"Sell here\" on another branch's lead (needs the cross-branch follow-up row)", type: "tick", defaults: { SE: true, SM: true, CM: true, RM: true, CEO: true }, requires: "leads.crossBranchFollowUp" },
    { key: "sales.backDate",        module: "Sales",    label: "Back-date a sale start (current month only)",     type: "tick",   defaults: {} },
    { key: "payments.refund",       module: "Payments", label: "Refund / cancel a payment (no screen yet)",       type: "tick",   defaults: {} },
    { key: "clients.view",          module: "Clients",  label: "View clients",                                          type: "scope",  defaults: { SE: "Branch", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "clients.collectPayment", module: "Clients", label: "Collect payment",                                       type: "scope",  defaults: { SE: "Branch", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "clients.issueItems",    module: "Clients",  label: "Issue FF ID / key fob / item on a client",           type: "scope",  defaults: { SE: "Branch", SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "clients.waive",         module: "Clients",  label: "Waive pending item",                              type: "scope",  defaults: { SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "settings.packages",     module: "Settings", label: "Packages",                                              type: "tick",   defaults: { CEO: true } },
    // One View row per master (#114). Branch-owned masters (Packages, Items, Lead sources) = scope; company-wide masters
    // (Tax, Sales rules, Trainer types, Lost reasons) = tick (#115). Edit rule stays as before unless listed here.
    { key: "settings.viewPackages",     module: "Settings", label: "View Packages (edit: Packages row)",                  type: "scope", defaults: { SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "settings.viewItems",        module: "Settings", label: "View Items (edit: Packages row)",                     type: "scope", defaults: { SM: "Branch", CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "settings.viewTax",          module: "Settings", label: "View Tax categories (edit: Packages row)",            type: "tick",  defaults: { SM: true, CM: true, RM: true } },
    { key: "settings.viewSalesRules",   module: "Settings", label: "View Sales rules (edit: Packages row)",               type: "tick",  defaults: { SM: true, CM: true, RM: true } },
    { key: "settings.viewTrainerTypes", module: "Settings", label: "View Trainer types (edit: Roles & permissions row)",  type: "tick",  defaults: { SM: true, CM: true, RM: true } },
    // Lead sources are branch-assignable (#115): Branch = see / create / edit sources only for my own branches. SE View = Branch (Source dropdown).
    { key: "settings.viewLeadSources",  module: "Settings", label: "View Lead sources (no screen yet)",                   type: "scope", defaults: { SE: "Branch", SM: "Branch", CM: "Branch", RM: "Branch", MKT: "Branch", CEO: "All" } },
    { key: "settings.editLeadSources",  module: "Settings", label: "Create / edit Lead sources (no screen yet)",          type: "scope", defaults: { RM: "Branch", MKT: "Branch", CEO: "All" } },
    { key: "settings.viewLostReasons",  module: "Settings", label: "View Lost reasons (no screen yet)",                   type: "tick",  defaults: { SM: true, CM: true, RM: true } },
    { key: "settings.editLostReasons",  module: "Settings", label: "Edit Lost reasons (no screen yet)",                   type: "tick",  defaults: { CEO: true } },
    { key: "settings.stock",        module: "Settings", label: "Accessory / key fob stock",                       type: "scope",  defaults: { CM: "Branch", RM: "Branch", CEO: "All" } },
    { key: "settings.editInactivity", module: "Settings", label: "Edit inactivity release days",                        type: "tick",   defaults: { CM: true, RM: true, CEO: true } },
    { key: "settings.rolesPermissions", module: "Settings", label: "Roles & permissions",                               type: "tick",   defaults: { CEO: true }, lock: "all" }
  ];
  // Settings values (decision #96, notes "Settings values"). Who can change: a grid row (permission key) or CEO.
  var settingDefs = [
    { key: "freeTrialsPerPerson",      label: "Free trials per person (each trial type)", def: 2, min: 0, max: 10, unit: "trials", by: "trials.editLimits", hint: "Counted by mobile number across all branches, separately for Membership trials and PT trials." },
    { key: "freeTrialsPerBranch",      label: "Free trials per branch (each trial type)", def: 1, min: 0, max: 10, unit: "trials", by: "trials.editLimits", hint: "Must be the same or fewer than per person." },
    { key: "paidTrialAdjustBufferDays", label: "Paid trial adjust buffer after it ends", def: 7, min: 0, max: 30, unit: "days", by: "CEO", hint: "Within this many days after a paid trial ended, the adjust is still offered (to roles with the grid row)." },
    { key: "inactivityReleaseDays",    label: "Release inactive leads after",           def: 7, min: 1, max: 90, unit: "days", by: "settings.editInactivity", hint: "Next follow-up overdue or not set for this many days → the lead becomes Unassigned." },
    { key: "releaseWarnDaysBefore",    label: "Warn the owner before release",          def: 1, min: 0, max: 89, unit: "days before", by: "settings.editInactivity", hint: "Must be less than the inactivity days." },
    { key: "exClientAfterDays",        label: "Ex-client after (days without an active package)", def: 30, min: 0, max: 365, unit: "days", by: "CEO", hint: "Expired for this many days after the last package ends (membership or PT), then Ex-client." },
    { key: "ptQuoteValidDays",         label: "PT quote valid for",                     def: 7, min: 1, max: 90, unit: "days", by: "CEO", hint: "A PT quote can be billed until this many days after it is made; then it shows Expired." },
    { key: "ptTrialsPerPerson",        label: "PT trials per person",                   def: 0, min: 0, max: 20, unit: "trials (0 = no limit)", by: "CEO", hint: "PT trials are CM / MXM assessments: no approval, no limit by default; repeats show as info only." },
    { key: "crossBranchOwnerChange",   label: "When another branch's staff works on a lead, owner changes", def: "On sale", options: ["On sale", "On first follow-up", "Never"], by: "CEO", hint: "On the trigger the lead moves to that staff's branch, they become the owner and the old owner's open follow-ups close (\"Taken over by <branch>\"). Never: owner and branch stay; the seller is only the sales rep." },
    { key: "newLeadAssignment",        label: "New-lead assignment",                    def: "Manual", options: ["Manual", "Round-robin", "Round-robin among on-shift staff"], by: "CEO", hint: "Round-robin and on-shift round-robin come later (need shift data, docs/lead-lifecycle.md)." }
  ];

  var lists = {
    sources: ["Walk-in", "Phone Call", "Referral", "WhatsApp", "Website", "Facebook",
      "Instagram", "Google", "Hoarding", "Pamphlet", "Others"],
    // Lead sources are branch-assignable (#115): branches null = all branches (default); else the branches it applies to
    // (a region = pick its branches). Quick lead / edit lead show only the sources that apply to the lead's branch.
    leadSourceBranches: { "Hoarding": ["b1"], "Pamphlet": ["b1", "b2"] },
    followUpTypes: ["Call", "WhatsApp", "Visit planned", "Free trial planned", "Payment expected"],
    outcomes: ["Interested", "No answer", "Call later", "Will visit", "Not interested"],
    lostReasons: ["Price high", "Joined competitor", "Not interested", "No response",
      "Location issue", "Timing issue", "Health issue", "Already a member elsewhere",
      "Shifted location", "Other"],
    temperatures: ["Hot", "Warm", "Cold"],                       // fixed
    stages: ["New", "Contacted", "Trial", "Negotiation"],        // the 5 stages with Lost (#101); Trial is automatic
    stageChoices: ["New", "Contacted", "Negotiation"],           // what staff may pick by hand (#94, L5); locked while a trial runs
    systemStages: ["Converted", "Lost"],                         // fixed
    taskStatuses: ["Open", "Done", "Cancelled", "Closed by system"],   // WorkTask ("Closed by system": owner changed / released, #99, #100)
    followUpStatuses: ["Open", "Done", "Cancelled", "Closed by system"],
    systemCloseReasons: ["Client converted", "Lead lost", "Client transferred", "Owner changed", "Released (inactive)"],
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
      externalId: null, createdAt: day(-4), lastActivityAt: day(-1), freeItemsReceived: ["it2"],
      // 2nd membership free trial running (1st was Rejected by the approver, trial ran anyway); got a free T-shirt before.
      trials: [
        { id: "tr1", type: "Membership", kind: "free", packageId: "pk1", package: "Free Trial", from: day(-40), to: day(-40), price: 0, paid: 0, branchId: "b1", bookedByUserId: "u6", bookedAt: day(-40),
          comment: "Walk-in, wants to try the floor", approverUserId: "u5", approval: "Rejected", approvalRemark: "Second visit without a plan", approvedAt: day(-39), endedFollowUpId: "f3old" },
        { id: "tr2", type: "Membership", kind: "free", packageId: "pk1", package: "Free Trial", from: day(-1), to: day(2), price: 0, paid: 0, branchId: "b1", bookedByUserId: "u6", bookedAt: day(-1),
          comment: "Came back after the Diwali offer", approverUserId: "u5", approval: "Pending" }
      ],
      note: "EDGE: free trial lead (stays a Lead), 2nd free membership trial = at the limit; got a free T-shirt before -> Annual shows 'T-shirt (already received)'" },
    { id: "p6", kind: "Lead", name: "Ananya Desai", cc: "+91", mobile: "90000 01239", email: "ananya.desai@example.com",
      gender: "Female", birthDate: "1993-11-15", ffId: null, source: "Facebook", temperature: "Hot", stage: "Trial",
      inquiryType: "Call", campaign: null, ownerUserId: "u7", branchId: "b2", remarks: null, externalId: null,
      createdAt: day(-15), lastActivityAt: day(-2),
      // Paid trial = still a Lead (decision #92); paid in full at once (#93). Booked through "Book trial" (c3).
      trials: [{ id: "tr3", type: "Membership", kind: "paid", packageId: "pk2", package: "Trial Paid 7 Days", from: day(-2), to: day(4), price: 800, paid: 800, receiptNo: "S65-000041",
        branchId: "b2", bookedByUserId: "u7", bookedAt: day(-2), comment: "Wants to try before the Quarterly", approverUserId: "u3", approval: "Pending" }],
      note: "EDGE: lead on a RUNNING paid membership trial (stage Trial) -> Convert shows the adjust ticked and locked" },
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
      membership: { packageId: "pk4", package: "Monthly Membership", saleType: "Paid", start: day(-17), end: day(12), price: 3000,
        discount: 0, discountReason: null, finalPrice: 3000, salesRepUserId: "u6", freeItems: [] },
      note: "EDGE (c6): membership renews in 12 days, PT runs longer (Membership renewal due, PT active). EDGE (payment): partial PT — 12 sessions ₹12,000, paid ₹5,500 -> 5 of 12 sessions unlocked, balance due" },
    { id: "p19", kind: "Client", name: "Divya Nair", cc: "+91", mobile: "90000 01252", email: "divya.nair@example.com",
      gender: null, birthDate: null, ffId: "FF-20701", source: "Walk-in", temperature: "Warm", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null, externalId: null,
      createdAt: day(-29), lastActivityAt: day(-27), clientNo: "CL-0919", homeBranchId: "b1", joinedAt: day(-27), keyFob: "KF-S31-0021", photo: null,
      membership: { packageId: "pk4", package: "Monthly Membership", saleType: "Paid", start: day(-27), end: day(3), price: 3000,
        discount: 0, discountReason: null, finalPrice: 3000, salesRepUserId: "u6", freeItems: [] },
      trials: [
        { id: "tr5", type: "Membership", kind: "free", packageId: "pk1", package: "Free Trial", from: day(-60), to: day(-60), price: 0, paid: 0, branchId: "b1", bookedByUserId: "u6", bookedAt: day(-60), comment: "First visit", approverUserId: "u5", approval: "Approved", approvedAt: day(-59), endedFollowUpId: "x" },
        { id: "tr6", type: "Membership", kind: "free", packageId: "pk1", package: "Free Trial", from: day(-35), to: day(-35), price: 0, paid: 0, branchId: "b2", bookedByUserId: "u7", bookedAt: day(-35), comment: "Tried Sec 65 near her office", approverUserId: "u3", approval: "Approved", approvedAt: day(-34), endedFollowUpId: "x" }
      ],
      note: "EDGE (Clients): Renewal due · 3 days left; used 2 membership free trials as a lead -> can still book a free PT trial (limits per type)" },
    { id: "p20", kind: "Client", name: "Sameer Khan", cc: "+91", mobile: "90000 01253", email: "sameer.k@example.com",
      gender: null, birthDate: null, ffId: "FF-20702", source: "Walk-in", temperature: "Warm", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u7", branchId: "b2", remarks: null, externalId: null,
      createdAt: day(-80), lastActivityAt: day(-78), clientNo: "CL-0920", homeBranchId: "b2", joinedAt: day(-78), keyFob: "KF-S65-0110", photo: null,
      membership: { packageId: "pk5", package: "Quarterly Membership", saleType: "Paid", start: day(-78), end: day(12), price: 8000,
        discount: 0, discountReason: null, finalPrice: 8000, salesRepUserId: "u7", freeItems: [] },
      note: "EDGE (Clients): Renewal due · 12 days left, Sec 65" },
    { id: "p21", kind: "Client", name: "Pallavi Rao", cc: "+91", mobile: "90000 01254", email: "pallavi.rao@example.com",
      gender: null, birthDate: null, ffId: "FF-20703", source: "Walk-in", temperature: "Warm", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u10", branchId: "b3", remarks: null, externalId: null,
      createdAt: day(-96), lastActivityAt: day(-94), clientNo: "CL-0921", homeBranchId: "b3", joinedAt: day(-94), keyFob: "KF-GC-0210", photo: null,
      membership: { packageId: "pk5", package: "Quarterly Membership", saleType: "Paid", start: day(-94), end: day(-5), price: 8000,
        discount: 0, discountReason: null, finalPrice: 8000, salesRepUserId: "u10", freeItems: [] },
      note: "EDGE (Clients): Expired 5 days ago, Golf Course" },
    { id: "p22", kind: "Client", name: "Tarun Mehra", cc: "+91", mobile: "90000 01255", email: "tarun.m@example.com",
      gender: null, birthDate: null, ffId: "FF-20704", source: "Walk-in", temperature: "Warm", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null, externalId: null,
      createdAt: day(-91), lastActivityAt: day(-89), clientNo: "CL-0922", homeBranchId: "b1", joinedAt: day(-89), keyFob: "KF-S31-0022", photo: null,
      membership: { packageId: "pk4", package: "Monthly Membership", saleType: "Paid", start: day(-89), end: day(-60), price: 3000,
        discount: 0, discountReason: null, finalPrice: 3000, salesRepUserId: "u6", freeItems: [] },
      note: "EDGE (Clients): Expired 60 days ago" },
    { id: "p23", kind: "Lead", name: "Ira Kapoor", cc: "+91", mobile: "90000 01256", email: "ira.kapoor@example.com",
      gender: null, birthDate: null, ffId: null, source: "Walk-in", temperature: "Warm", stage: "Trial",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u7", branchId: "b2", remarks: null, externalId: null,
      createdAt: day(-12), lastActivityAt: day(-4),
      trials: [{ id: "tr4", type: "Membership", kind: "paid", packageId: "pk2", package: "Trial Paid 7 Days", from: day(-10), to: day(-4), price: 800, paid: 800, receiptNo: "S65-000051",
        branchId: "b2", bookedByUserId: "u7", bookedAt: day(-10), comment: "Referred by Sameer", approverUserId: "u3", approval: "Approved", approvedAt: day(-9), endedFollowUpId: "f11c" }],
      note: "EDGE: lead whose paid trial ENDED 4 days ago (Trial ended) -> within the 7-day buffer: adjust optional for CM / CEO" },
    { id: "p24", kind: "Client", name: "Zoya Siddiqui", cc: "+91", mobile: "90000 01257", email: "zoya.s@example.com",
      gender: null, birthDate: null, ffId: "FF-20705", source: "Walk-in", temperature: "Warm", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u11", branchId: "b3", remarks: null, externalId: null,
      createdAt: day(-42), lastActivityAt: day(-40), clientNo: "CL-0924", homeBranchId: "b3", joinedAt: day(-40), keyFob: "KF-GC-0211", photo: null,
      membership: { packageId: "pk7", package: "Annual Membership", saleType: "Paid", start: day(-40), end: day(324), price: 24000,
        discount: 0, discountReason: null, finalPrice: 24000, salesRepUserId: "u11", freeItems: [] },
      note: "EDGE (Clients): PT 24 sessions with a balance, Golf Course" }
  ,  { id: "p25", kind: "Lead", name: "Kunal Bose", cc: "+91", mobile: "90000 01258", email: "kunal.bose@example.com",
      gender: "Male", birthDate: null, ffId: null, source: "Instagram", temperature: "Hot", stage: "Trial",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null, externalId: null,
      createdAt: day(-3), lastActivityAt: day(-1),
      trials: [
        { id: "tr7", type: "Membership", kind: "free", packageId: "pk1", package: "Free Trial", from: day(0), to: day(0), price: 0, paid: 0, branchId: "b1", bookedByUserId: "u6", bookedAt: day(-1), comment: "Wants the floor + a PT taste", approverUserId: "u5", approval: "Pending" },
        { id: "tr8", type: "PT", kind: "free", packageId: "pk19", package: "PT Trial Session", from: day(0), to: day(1), price: 0, paid: 0, branchId: "b1", bookedByUserId: "u6", bookedAt: day(-1), comment: "PT taste with Deepak", approverUserId: "u5", approval: "Approved", approvedAt: day(-1) }
      ],
      note: "EDGE (trials): a membership trial AND a PT trial running together (one running trial per type)" },
    { id: "p26", kind: "Lead", name: "Ritika Sen", cc: "+91", mobile: "90000 01259", email: null,
      gender: "Female", birthDate: null, ffId: null, source: "Referral", temperature: "Warm", stage: "Negotiation",
      inquiryType: "Call", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: "Asks about PT", externalId: null,
      createdAt: day(-70), lastActivityAt: day(-2),
      trials: [
        { id: "tr9", type: "Membership", kind: "free", packageId: "pk1", package: "Free Trial", from: day(-65), to: day(-65), price: 0, paid: 0, branchId: "b1", bookedByUserId: "u6", bookedAt: day(-66), comment: "Referral from Vivaan", approverUserId: "u5", approval: "Approved", approvedAt: day(-65), endedFollowUpId: "x" },
        { id: "tr10", type: "Membership", kind: "free", packageId: "pk1", package: "Free Trial", from: day(-20), to: day(-20), price: 0, paid: 0, branchId: "b2", bookedByUserId: "u7", bookedAt: day(-21), comment: "Tried Sec 65 too", approverUserId: "u3", approval: "Approved", approvedAt: day(-20), endedFollowUpId: "x" }
      ],
      note: "EDGE (trials): at the membership free-trial limit (2 of 2, incl. 1 at Sec 31) -> free membership trials disabled, free PT trial still allowed" },
    { id: "p27", kind: "Lead", name: "Mohit Jain", cc: "+91", mobile: "90000 01260", email: "mohit.jain@example.com",
      gender: "Male", birthDate: null, ffId: null, source: "Walk-in", temperature: "Warm", stage: "Trial",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u10", branchId: "b3", remarks: null, externalId: null,
      createdAt: day(-6), lastActivityAt: day(-3),
      trials: [{ id: "tr11", type: "Membership", kind: "paid", packageId: "pk3", package: "Trial Paid 15 Days", from: day(-3), to: day(11), price: 1500, paid: 1500, receiptNo: "GC-000030",
        branchId: "b3", bookedByUserId: "u10", bookedAt: day(-3), comment: "Paid 15 days, deciding between Quarterly and Annual", approverUserId: null, approval: "No approver available" }],
      note: "EDGE (trials): Golf Course has no SM / CM / RM -> approval 'No approver available', shows in the CEO's pending list" }
  );

  // ---- Ownership edge cases (decisions #97-#100, c4). L() = a plain open lead. ----
  function L(id, name, mob, branchId, ownerUserId, stage, extra) {
    return Object.assign({ id: id, kind: "Lead", name: name, cc: "+91", mobile: mob, email: null, gender: null, birthDate: null, ffId: null,
      source: "Walk-in", temperature: "Warm", stage: stage || "Contacted", inquiryType: "Walk-in", campaign: null, ownerUserId: ownerUserId,
      branchId: branchId, remarks: null, externalId: null, createdAt: day(-20), lastActivityAt: day(-6) }, extra || {});
  }
  people.push(
    L("p28", "Varun Khanna", "90000 01261", "b3", "u10", "Contacted", { createdAt: day(-5), lastActivityAt: day(-1),
      note: "EDGE (#97): owner Rahul (Golf Course); open follow-up ASSIGNED TO Priya (Sec 31, another branch) -> Priya sees it with 'Follow-up from Rahul'" }),
    L("p29", "Tanvi Shah", "90000 01262", "b2", "u7", "Contacted", { createdAt: day(-9), lastActivityAt: day(-2),
      note: "EDGE (#97): Priya's follow-up on this lead is DONE -> the lead left Priya's list (stays in her follow-up history)" }),
    L("p30", "Gaurav Sethi", "90000 01263", "b1", "u6", "Contacted", { createdAt: day(-20), lastActivityAt: day(-6),
      note: "EDGE (#100): follow-up overdue 6 days -> 'Releases tomorrow' + one notification to Priya" }),
    L("p31", "Meghna Pillai", "90000 01264", "b1", "u6", "New", { createdAt: day(-25), lastActivityAt: day(-8),
      note: "EDGE (#100): follow-up overdue 8 days -> RELEASED on page load (Unassigned · Released), follow-up + task closed by system" }),
    L("p32", "Rohan Das", "90000 01265", "b1", "u6", "Trial", { createdAt: day(-15), lastActivityAt: day(-1),
      trials: [{ id: "tr12", type: "Membership", kind: "paid", packageId: "pk2", package: "Trial Paid 7 Days", from: day(-1), to: day(5), price: 800, paid: 800, receiptNo: "S31-000122",
        branchId: "b1", bookedByUserId: "u6", bookedAt: day(-1), comment: "Wants to try evenings", approverUserId: "u5", approval: "Approved", approvedAt: day(-1), endedFollowUpId: null }],
      note: "EDGE (#100): follow-up overdue 9 days BUT a trial is running -> never released, no warning" }),
    L("p33", "Asha Menon", "90000 01266", "b2", "u7", "Contacted", { createdAt: day(-30), lastActivityAt: day(0, 9),
      ownerHistory: [{ from: "u3", to: "u7", at: day(0, 9), by: "u3" }],
      note: "EDGE (#100 FIX): assigned to Arjun TODAY, follow-up overdue 10 days -> NOT released (clock starts when the current owner got it)" }),
    L("p34", "Kiran Joshi", "90000 01267", "b1", "u7", "Contacted", { createdAt: day(-12), lastActivityAt: day(-1),
      transferredIn: { from: "b2", by: "u7", at: day(-1) },
      note: "EDGE (#98): moved Sec 65 -> Sec 31 by Arjun (SE, cannot pick) -> 'Transferred in' waiting for Sunita (CM) to pick an SE" }),
    L("p35", "Lakshmi Iyer", "90000 01268", "b1", "u4", "New", { createdAt: day(-3), lastActivityAt: day(-2), source: "Instagram",
      ownerHistory: [{ from: null, to: "u4", at: day(-2), by: "u4", how: "Taken" }],
      note: "EDGE (#100): was Unassigned · New, TAKEN by Sunita ('Take this lead')" }),
    L("p36", "Yash Arora", "90000 01269", "b1", null, "Contacted", { createdAt: day(-30), lastActivityAt: day(-1), unassignedReason: "Released", releasedAt: day(-1),
      ownerHistory: [{ from: "u5", to: null, at: day(-1), by: null, how: "Released" }],
      note: "EDGE (#100): Unassigned · Released (inactive) yesterday, was Karan's" }),
    L("p37", "Sana Qureshi", "90000 01270", "b1", "u5", "Lost", { createdAt: day(-40), lastActivityAt: day(-10), stageBeforeLost: "Negotiation", lostReason: "Timing issue", lostAt: day(-10),
      note: "EDGE (#100/#99): Karan's LOST lead with an open task -> re-opened by someone else (e.g. Sunita) = new owner + owner-change dialog (N = 1)" }),
    L("p38", "Dev Malhotra", "90000 01271", "b1", "u6", "Negotiation", { createdAt: day(-8), lastActivityAt: day(-1),
      note: "EDGE (#99 FIX): Priya owns it; Arjun (third person) has his own open follow-up -> an owner change moves only Priya's items, Arjun's stays" })
  );

  // ---- Client status by the last package end (#103 Q25; Settings "Ex-client after" default 30 days). p21 = Expired 5 days, p22 = Ex-client (60). ----
  people.push(
    L("p42", "Tanvi Shah", "90000 01275", "b3", "u10", "Trial", { createdAt: day(-4), lastActivityAt: day(-1), source: "Instagram",
      trials: [{ id: "tr13", type: "PT", kind: "free", packageId: "pk19", package: "PT Trial Session", from: day(0), to: day(0), price: 0, paid: 0, branchId: "b3", bookedByUserId: "u9", bookedAt: day(-1),
        comment: "PT assessment · weight loss", trainerUserId: "u13", approverUserId: null, approval: "Not needed", endedFollowUpId: null }],
      note: "EDGE (#111, #112): OPEN PT quote request from Rahul (SE) to Meera (MXM); Meera booked a PT trial with trainer Sanjay (no approval)" }),
    L("p43", "Manish Gupta", "90000 01276", "b1", "u6", "Negotiation", { createdAt: day(-3), lastActivityAt: day(-1), source: "Referral",
      note: "EDGE (#111, #113): OPEN Premium PT quote by Sunita (CM, trainer Deepak) + an EXPIRED quote -> Priya (SE) bills the open one, locked" }),
    L("p41", "Farhan Qureshi", "90000 01274", "b2", "u7", "Contacted", { createdAt: day(-2), lastActivityAt: day(-2), source: "Walk-in",
      note: "EDGE (#105): Sec 65 lead (owner Arjun). He walks in at Sec 31: Priya searches 9000001274 -> read-only row -> Add a follow-up for myself / Sell here" }),
    { id: "p39", kind: "Client", name: "Rekha Chawla", cc: "+91", mobile: "90000 01272", email: "rekha.c@example.com",
      gender: "Female", birthDate: null, ffId: "FF-20706", source: "Walk-in", temperature: "Warm", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null, externalId: null,
      createdAt: day(-140), lastActivityAt: day(-45), clientNo: "CL-0925", homeBranchId: "b1", joinedAt: day(-135), keyFob: "KF-S31-0023", photo: null,
      membership: { packageId: "pk5", package: "Quarterly Membership", saleType: "Paid", start: day(-135), end: day(-45), price: 8000,
        discount: 0, discountReason: null, finalPrice: 8000, salesRepUserId: "u6", freeItems: [] },
      note: "EDGE (#103): last package ended 45 days ago -> Ex-client (out of renewals)" },
    { id: "p40", kind: "Client", name: "Nikhil Arora", cc: "+91", mobile: "90000 01273", email: "nikhil.a@example.com",
      gender: "Male", birthDate: null, ffId: "FF-20707", source: "Referral", temperature: "Warm", stage: "Converted",
      inquiryType: "Walk-in", campaign: null, ownerUserId: "u6", branchId: "b1", remarks: null, externalId: null,
      createdAt: day(-70), lastActivityAt: day(-5), clientNo: "CL-0926", homeBranchId: "b1", joinedAt: day(-65), keyFob: "KF-S31-0024", photo: null,
      membership: { packageId: "pk4", package: "Monthly Membership", saleType: "Paid", start: day(-35), end: day(-5), price: 3000,
        discount: 0, discountReason: null, finalPrice: 3000, salesRepUserId: "u6", freeItems: [] },
      note: "EDGE (#103, c6): membership ended 5 days ago, PT runs 40 more days -> client Active (later end) but PT ON HOLD (12 unlocked, 0 usable)" }
  );

  // ---------- Payments (decisions #79–#84). payment = { total, paid, dueDate, receipts: [{ no, at, by, rows: [{ method, amount, ref, slip }] }] }
  function rc(no, at, by, rows) { return { no: no, at: at, by: by, rows: rows.map(function (r) { return { method: r[0], amount: r[1], ref: r[2] || null, slip: r[3] || null }; }) }; }
  function pay(total, dueDate, receipts) {
    var paid = 0; receipts.forEach(function (x) { x.rows.forEach(function (r) { paid += r.amount; }); });
    return { total: total, paid: paid, dueDate: dueDate || null, receipts: receipts };
  }
  function P(id) { return people.filter(function (x) { return x.id === id; })[0]; }
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

  // Clients list dummy (decision #91): payments for the new clients.
  P("p19").membership.payment = pay(4200, null, [rc("S31-000101", day(-27), "u6", [["UPI", 4200, "UPI-40012001"]])]);
  P("p20").membership.payment = pay(9200, null, [rc("S65-000049", day(-78), "u7", [["Card", 9200, "CARD-5521"]])]);
  P("p21").membership.payment = pay(9200, null, [rc("GC-000024", day(-94), "u10", [["Cash", 9200]])]);
  P("p22").membership.payment = pay(4200, null, [rc("S31-000077", day(-89), "u6", [["Cash", 4200]])]);
  P("p24").membership.payment = pay(25200, null, [rc("GC-000027", day(-40), "u11", [["Card", 25200, "CARD-6610"]])]);
  // EDGE: PT 24 sessions ₹22,000, paid ₹11,000 -> per session 916.67 -> 12 of 24 unlocked; balance ₹11,000 due in 10 days
  P("p39").membership.payment = pay(9200, null, [rc("S31-000060", day(-135), "u6", [["Cash", 9200]])]);
  P("p40").membership.payment = pay(4200, null, [rc("S31-000090", day(-35), "u6", [["UPI", 4200, "UPI-40012010"]])]);
  // EDGE (#116): duplicate reference — p22's UPI ref was already used on p19's payment; staff confirmed with a reason -> flagged for Finance / CEO.
  P("p22").membership.payment.receipts.push(rc("S31-000102", day(-26), "u6", [["UPI", 0.01, "UPI-40012001"]]));
  (function (r) { r.amount = 500; r.dup = { usedOn: "S31-000101", usedAt: day(-27), personId: "p19", reason: "Same UPI paid two bills (family)", by: "u6", flagged: true }; })(P("p22").membership.payment.receipts[1].rows[0]);
  P("p22").membership.payment.total += 500; P("p22").membership.payment.paid += 500;
  P("p40").pt = { packageId: "pk9", package: "PT 12 Sessions", price: 12000, discount: 0, finalPrice: 12000, sessions: 12, start: day(-50), end: day(40),
    salesRepUserId: "u6", payment: pay(12000, null, [rc("S31-000091", day(-50), "u6", [["Card", 12000, "CARD-7710"]])]) };
  P("p24").pt = { packageId: "pk10", package: "PT 24 Sessions", price: 22000, discount: 0, finalPrice: 22000, sessions: 24, start: day(-40), end: day(140),
    salesRepUserId: "u11", payment: pay(22000, dd(10), [rc("GC-000028", day(-40), "u11", [["UPI", 11000, "UPI-40012003"]])]) };

  // CreatedBy never changes; Owner is changeable (history kept); Sales rep is per sale line (decision #36).
  people.forEach(function (p) {
    if (!("createdByUserId" in p)) p.createdByUserId = p.synced ? null : p.ownerUserId;  // Meta sync: created by the system
    if (!p.ownerHistory) p.ownerHistory = [];
    if (!p.trials) p.trials = [];
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
    { id: "f11b", personId: "p6", type: "Visit planned", dueDate: dd(3), dueTime: "18:00", ownerUserId: "u7", status: "Open", outcome: null, note: "Last trial day · talk about Quarterly" },
    { id: "f11c", personId: "p23", type: "Call", dueDate: dd(-3), dueTime: null, ownerUserId: "u7", status: "Open", outcome: null, note: "Trial ended · ask about joining" },
    { id: "f25", personId: "p25", type: "Visit planned", dueDate: dd(1), dueTime: "19:00", ownerUserId: "u6", status: "Open", outcome: null, note: "After the PT trial · talk packages" },
    { id: "f26", personId: "p26", type: "Call", dueDate: dd(2), dueTime: null, ownerUserId: "u6", status: "Open", outcome: null, note: "Offer a PT trial session" },
    { id: "f27", personId: "p27", type: "Visit planned", dueDate: dd(11), dueTime: "18:00", ownerUserId: "u10", status: "Open", outcome: null, note: "Last day of the paid trial" },
    { id: "f13", personId: "p15", type: "Call", dueDate: dd(-1), dueTime: "12:00", ownerUserId: "u7", status: "Open", outcome: null, note: "Wants weekend batch" },
    { id: "f14", personId: "p16", type: "Visit planned", dueDate: dd(-4), dueTime: "18:00", ownerUserId: "u10", status: "Open", outcome: null, note: null },
    { id: "f15", personId: "p17", type: "WhatsApp", dueDate: dd(-1), dueTime: null, ownerUserId: "u6", status: "Open", outcome: null, note: "Send couple PT details" },
    { id: "f12", personId: "p7", type: "Call", dueDate: dd(7), dueTime: "11:00", ownerUserId: "u6", status: "Open", outcome: null, note: "Check how training is going" },
    // Ownership (#97-#100). ownerUserId = the lead owner the follow-up comes from; assignedToUserId = who does it (default = owner).
    { id: "f28", personId: "p28", type: "Call", dueDate: dd(1), dueTime: "17:00", ownerUserId: "u10", assignedToUserId: "u6", status: "Open", outcome: null, note: "Lives near Sec 31 · invite for a visit", createdAt: day(-1) },
    { id: "f29", personId: "p29", type: "Call", dueDate: dd(-2), dueTime: "12:00", ownerUserId: "u7", assignedToUserId: "u6", status: "Done", outcome: "Interested", note: "Asked about Sec 31 timings", createdAt: day(-4), doneAt: day(-2, 12, 20) },
    { id: "f29b", personId: "p29", type: "WhatsApp", dueDate: dd(2), dueTime: null, ownerUserId: "u7", status: "Open", outcome: null, note: "Send Sec 65 batch list", createdAt: day(-2) },
    { id: "f30", personId: "p30", type: "Call", dueDate: dd(-6), dueTime: "11:00", ownerUserId: "u6", status: "Open", outcome: null, note: "Price discussion", createdAt: day(-9) },
    { id: "f31", personId: "p31", type: "Call", dueDate: dd(-8), dueTime: null, ownerUserId: "u6", status: "Open", outcome: null, note: null, createdAt: day(-12) },
    { id: "f32", personId: "p32", type: "Call", dueDate: dd(-9), dueTime: null, ownerUserId: "u6", status: "Open", outcome: null, note: "Before the trial", createdAt: day(-14) },
    { id: "f33", personId: "p33", type: "Call", dueDate: dd(-10), dueTime: null, ownerUserId: "u7", status: "Open", outcome: null, note: "Moved from Vikram today", createdAt: day(-15) },
    { id: "f34", personId: "p34", type: "Call", dueDate: dd(2), dueTime: null, ownerUserId: "u7", status: "Open", outcome: null, note: "Arjun keeps in touch", createdAt: day(-1) },
    { id: "f35", personId: "p35", type: "Call", dueDate: dd(1), dueTime: "12:00", ownerUserId: "u4", status: "Open", outcome: null, note: null, createdAt: day(-2) },
    { id: "f36", personId: "p36", type: "Call", dueDate: dd(-8), dueTime: null, ownerUserId: "u5", status: "Closed by system", closeReason: "Released (inactive)", closedAt: day(-1), outcome: null, note: null, createdAt: day(-12) },
    { id: "f38", personId: "p38", type: "Visit planned", dueDate: dd(1), dueTime: "18:00", ownerUserId: "u6", status: "Open", outcome: null, note: "Couple membership", createdAt: day(-1) },
    { id: "f38b", personId: "p38", type: "Call", dueDate: dd(3), dueTime: null, ownerUserId: "u6", assignedToUserId: "u7", status: "Open", outcome: null, note: "Arjun: Sec 65 timings for his wife", createdAt: day(-1) }
  ];

  var workTasks = [  // WorkTask (staff work, decision #6)
    { id: "t1", title: "Collect ID proof copy", assignedUserId: "u6", dueAt: day(-1, 18), priority: "High", personId: "p7", status: "Open", note: null },
    { id: "t2", title: "Prepare Diwali offer flyer", assignedUserId: "u5", dueAt: day(0, 17), priority: "Medium", personId: null, status: "Open", note: null },
    { id: "t3", title: "Assign trainer for trial", assignedUserId: "u8", dueAt: day(1, 9), priority: "Critical", personId: "p5", status: "Open", note: "Morning slot" },
    { id: "t4", title: "Call back about locker", assignedUserId: "u7", dueAt: day(-3, 12), priority: "Low", personId: "p6", status: "Done", note: null },
    { id: "t6", title: "Print welcome kit for Rohit", assignedUserId: "u6", dueAt: day(0, 15), priority: "Medium", personId: "p12", status: "Open", note: null },
    { id: "t7", title: "Check fob stock count", assignedUserId: "u4", dueAt: day(0, 12), priority: "High", personId: null, status: "Open", note: null },
    { id: "t5", title: "Update brochure stock", assignedUserId: "u9", dueAt: day(2, 12), priority: "Low", personId: null, status: "Cancelled", note: null },
    { id: "t8", title: "Send Meghna the offer PDF", assignedUserId: "u6", dueAt: day(-7, 12), priority: "Low", personId: "p31", status: "Open", note: null },
    { id: "t9", title: "Return Sana's ID copy", assignedUserId: "u5", dueAt: day(2, 12), priority: "Medium", personId: "p37", status: "Open", note: "Lost lead, open task" },
    { id: "t10", title: "Share Dev's diet plan", assignedUserId: "u6", dueAt: day(2, 15), priority: "Low", personId: "p38", status: "Open", note: null }
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
    { personId: "p5", at: day(-40), kind: "milestone", text: "Free membership trial booked · Free Trial · approval asked from Karan", by: "u6" },
    { personId: "p5", at: day(-39), kind: "milestone", text: "Trial approval · Rejected by Karan · Second visit without a plan", by: "u5" },
    { personId: "p5", at: day(-1), kind: "milestone", text: "Free membership trial booked · Free Trial · 2nd trial · approval asked from Karan", by: "u6" },
    { personId: "p25", at: day(-1), kind: "milestone", text: "Free membership trial booked · Free Trial · approval asked from Karan", by: "u6" },
    { personId: "p25", at: day(-1), kind: "milestone", text: "Free PT trial booked · PT Trial Session · approval asked from Karan", by: "u6" },
    { personId: "p25", at: day(-1), kind: "milestone", text: "Trial approval · Approved by Karan", by: "u5" },
    { personId: "p27", at: day(-3), kind: "milestone", text: "Paid membership trial booked · Trial Paid 15 Days · ₹1,500 paid in full · no approver available at Golf Course", by: "u10" },
    { personId: "p6", at: day(-2), kind: "milestone", text: "Paid trial booked · Trial Paid 7 Days · ₹800 paid in full (UPI)", by: "u7" },
    { personId: "p23", at: day(-10), kind: "milestone", text: "Paid trial booked · Trial Paid 7 Days · ₹800 paid in full (UPI)", by: "u7" },
    { personId: "p23", at: day(-4), kind: "milestone", text: "Paid trial ended · no membership yet", by: null },
    { personId: "p7", at: day(-100), kind: "milestone", text: "Converted to Client · Annual Membership · key fob KF-S31-0012", by: "u6" },
    { personId: "p7", at: day(-7), kind: "note", text: "Priya noted: asked about PT sessions for next month", by: "u6" },
    { personId: "p8", at: day(0, 8, 15), kind: "milestone", text: "Lead received from Meta · waiting for an owner" },
    { personId: "p10", at: day(-1), kind: "whatsapp", text: "Arjun sent WhatsApp · price list", by: "u7" },
    { personId: "p28", at: day(-1), kind: "milestone", text: "Rahul set a follow-up for Priya (Sec 31) · Call", by: "u10" },
    { personId: "p33", at: day(0, 9), kind: "milestone", text: "Owner changed from Vikram to Arjun by Vikram", by: "u3" },
    { personId: "p34", at: day(-1), kind: "milestone", text: "Moved Sec 65 \u2192 Sec 31 by Arjun · lives in Sec 31 now", by: "u7" },
    { personId: "p35", at: day(-2), kind: "milestone", text: "Taken by Sunita", by: "u4" },
    { personId: "p36", at: day(-1), kind: "milestone", text: "Released to Unassigned · no follow-up for 7 days (was Karan Malhotra)", by: null },
    { personId: "p37", at: day(-10), kind: "milestone", text: "Marked as Lost · Timing issue", by: "u5" }
  ];

  // ---------- Masters (decisions #49–#56) ----------
  // Tax categories: admin master. Prices are stored INCL. GST; GST is worked out backwards. No rates in logic.
  var taxCategories = [
    { id: "tx1", name: "Gym services", rate: 5,  active: true },
    { id: "tx2", name: "Goods 18%",    rate: 18, active: true },
    { id: "tx3", name: "Goods 12%",    rate: 12, active: true },
    { id: "tx4", name: "Exempt",       rate: 0,  active: true }
  ];
  var membershipSubTypes = ["Regular", "Student", "Corporate"];   // admin list ("Premium" removed, decision #92)
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
      taxCategoryId: "tx1", requiresMembership: category === "PT", branchIds: ["b1", "b2", "b3"], audience: "Both",   // Premium PT: membership included, never "requires membership"
      freeItems: [], active: true, soldCount: 0 }, o);
  }
  var packages = [
    pk("pk1",  "Free Trial",                "Membership", { isTrial: true, days: 1, priceHistory: [{ price: 0, from: dd(-365) }], soldCount: 9 }),
    pk("pk2",  "Trial Paid 7 Days",         "Membership", { isTrial: true, days: 7, priceHistory: [{ price: 800, from: dd(-365) }], soldCount: 3 }),
    pk("pk3",  "Trial Paid 15 Days",        "Membership", { isTrial: true, days: 15, priceHistory: [{ price: 1500, from: dd(-365) }] }),
    // PT trials (#94, change of 16 Nov): "Requires an active membership" OFF = leads and clients; ON = clients only.
    pk("pk19", "PT Trial Session",          "PT", { isTrial: true, subType: "One-on-one", days: 1, sessions: 1, requiresMembership: false, priceHistory: [{ price: 0, from: dd(-200) }], soldCount: 4 }),
    pk("pk20", "PT Trial · 3 Sessions",     "PT", { isTrial: true, subType: "One-on-one", days: 7, sessions: 3, requiresMembership: true, priceHistory: [{ price: 1500, from: dd(-200) }], soldCount: 1 }),   // EDGE: clients only
    pk("pk4",  "Monthly Membership",        "Membership", { subType: "Regular", days: 30, soldCount: 12,
      priceHistory: [{ price: 2800, from: dd(-400) }, { price: 3000, from: dd(-120) }, { price: 3300, from: dd(20) }] }),   // EDGE: future price change
    pk("pk5",  "Quarterly Membership",      "Membership", { subType: "Regular", days: 90, priceHistory: [{ price: 8000, from: dd(-365) }], soldCount: 5 }),
    pk("pk6",  "Half-Yearly Membership",    "Membership", { subType: "Regular", days: 180, priceHistory: [{ price: 14000, from: dd(-365) }], soldCount: 2 }),
    pk("pk7",  "Annual Membership",         "Membership", { subType: "Regular", days: 365, priceHistory: [{ price: 24000, from: dd(-365) }], soldCount: 8,
      freeItems: [{ itemId: "it2", qty: 1, rule: "Once per client" }, { itemId: "it4", qty: 1, rule: "Every sale" }] }),  // EDGE: sold (locked) + free items; T-shirt out of stock at Sec 31
    pk("pk9",  "PT 12 Sessions",            "PT", { subType: "One-on-one", days: 90, sessions: 12, priceHistory: [{ price: 12000, from: dd(-365) }], soldCount: 4 }),
    pk("pk10", "PT 24 Sessions",            "PT", { subType: "One-on-one", days: 180, sessions: 24, priceHistory: [{ price: 22000, from: dd(-365) }], soldCount: 1 }),
    // Premium PT (decision #92): one package = membership + PT; referenceMembershipPrice is part of each price entry (#50 rule).
    pk("pk17", "Quarterly + 12 PT",          "Premium PT", { subType: "One-on-one", days: 90, sessions: 12, priceHistory: [{ price: 30000, referenceMembershipPrice: 8000, from: dd(-120) }], soldCount: 2 }),
    pk("pk18", "Annual + 36 PT",             "Premium PT", { subType: "One-on-one", days: 365, sessions: 36, priceHistory: [{ price: 95000, referenceMembershipPrice: 24000, from: dd(-60) }] }),
    // EDGE (#103): Premium PT with the membership FREE (reference ₹0) -> ₹0 membership line on the bill, no GST, drives status / renewal.
    // EDGE (#103 Q27): ₹20,000 membership for the paid trial adjust GST check (₹20,000 − ₹800 trial = GST on ₹19,200).
    pk("pk22", "Half-Yearly Membership", "Membership", { subType: "Regular", days: 180, priceHistory: [{ price: 20000, from: dd(-90) }] }),
    pk("pk21", "Monthly + 8 PT (membership free)", "Premium PT", { subType: "One-on-one", days: 30, sessions: 8, priceHistory: [{ price: 12000, referenceMembershipPrice: 0, from: dd(-30) }] }),
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
    { no: "KF-S31-0021", branchId: "b1", status: "Assigned", personId: "p19", deposit: { amount: 1200, refunded: 0 }, history: [{ at: day(-27), text: "Assigned to Divya Nair · deposit ₹1,200 collected", by: "u6" }] },
    { no: "KF-S31-0022", branchId: "b1", status: "Assigned", personId: "p22", deposit: { amount: 1200, refunded: 0 }, history: [{ at: day(-89), text: "Assigned to Tarun Mehra · deposit ₹1,200 collected", by: "u6" }] },
    { no: "KF-S65-0110", branchId: "b2", status: "Assigned", personId: "p20", deposit: { amount: 1200, refunded: 0 }, history: [{ at: day(-78), text: "Assigned to Sameer Khan · deposit ₹1,200 collected", by: "u7" }] },
    { no: "KF-GC-0210",  branchId: "b3", status: "Assigned", personId: "p21", deposit: { amount: 1200, refunded: 0 }, history: [{ at: day(-94), text: "Assigned to Pallavi Rao · deposit ₹1,200 collected", by: "u10" }] },
    { no: "KF-GC-0211",  branchId: "b3", status: "Assigned", personId: "p24", deposit: { amount: 1200, refunded: 0 }, history: [{ at: day(-40), text: "Assigned to Zoya Siddiqui · deposit ₹1,200 collected", by: "u11" }] },
    { no: "KF-GC-0202",  branchId: "b3", status: "In stock", personId: null },
    { no: "KF-S31-0023", branchId: "b1", status: "Assigned", personId: "p39", deposit: { amount: 1200, refunded: 0 } },
    { no: "KF-S31-0024", branchId: "b1", status: "Assigned", personId: "p40", deposit: { amount: 1200, refunded: 0 } }
  ];
  keyFobs.forEach(function (k) { if (!k.history) k.history = [{ at: day(-90), text: "Added to stock", by: "u1" }]; if (!k.deposit) k.deposit = null; });

  // Demo person shown for each "View as" role (placeholder until the permission matrix).
  var roleDemoUser = { "CEO": "u2", "Regional Manager": "u3", "Club Manager": "u4",
    "Sales Manager": "u5", "Sales Executive": "u6", "Trainer": "u8", "MXM": "u9", "Finance": "u12", "Marketing": "u16", "HR": "u17" };

  var notifications = [
    { id: "n1", text: "New lead from Meta: Fatima Shaikh · Golf Course", at: day(0, 8, 15), unread: true },
    { id: "n2", text: "Aarav Patel's follow-up is overdue", at: day(-2, 17), unread: true },
    { id: "n3", text: "Task due today: Prepare Diwali offer flyer", at: day(0, 9), unread: true },
    { id: "n4", text: "Trial approval asked from you: Ishaan Singh · Free Trial (Priya)", at: day(-1, 11), unread: true, forUserId: "u5", trialId: "tr2" },
    { id: "n5", text: "Trial approval asked from you: Ananya Desai · Trial Paid 7 Days (Arjun)", at: day(-2, 12), unread: true, forUserId: "u3", trialId: "tr3" },
    // Notification rules (#108): toUserIds = only these users see it in the bell.
    { id: "n6", text: "Kiran Joshi transferred in to Sec 31 · pick the follow-up person", at: day(-1, 10), unread: true, toUserIds: ["u4"] }
  ];

  window.DUMMY = {
    roleDemoUser: roleDemoUser, notifications: notifications, events: [],
    // PT quotes (#110–#113). Person-agnostic (personId); leads only for now (Premium PT, #89).
    quoteRequests: [
      { id: "qr1", personId: "p42", askedUserId: "u9", byUserId: "u10", note: "Wants weight-loss PT, mornings", at: day(-1), status: "Open", closedAt: null, quoteId: null }
    ],
    ptQuotes: [
      { id: "q1", personId: "p43", packageId: "pk17", package: "Quarterly + 12 PT", trainerUserId: "u8", price: 30000, refPrice: 8000, discount: 2200, discountReason: "Referral", discountReasonOther: null,
        validTill: dd(5), note: "Mornings, 3x a week", status: "Open", createdByUserId: "u4", createdAt: day(-2), requestId: null },
      { id: "q2", personId: "p43", packageId: "pk18", package: "Annual + 36 PT", trainerUserId: "u8", price: 95000, refPrice: 24000, discount: 0, discountReason: null, discountReasonOther: null,
        validTill: dd(-3), note: "Annual option", status: "Expired", createdByUserId: "u4", createdAt: day(-10), requestId: null }
    ],
    // Notification rules (#108): event -> roles (short) that get it, for their own branch(es). Directly involved people always get it.
    // 3rd element = the roles that can be ticked for that event (default RM / CM / SM). "Duplicate payment reference" (#117): any role, default CEO.
    notifyEvents: [["transferIn", "Lead transferred in"], ["released", "Lead released (inactive)"], ["crossBranch", "Cross-branch work on a lead (follow-up / sale)"], ["quoteRequested", "PT quote requested"],
      ["dupRef", "Duplicate payment reference", ["CEO", "RM", "CM", "SM", "SE", "MXM", "TR", "FIN", "MKT", "HR"]]],
    notifyRoles: ["RM", "CM", "SM"],
    notifyDefaults: { transferIn: { CM: true }, released: { CM: true }, crossBranch: { CM: true }, dupRef: { CEO: true } },
    tenants: tenants, branches: branches, roles: roles, platformRoles: platformRoles, users: users, lists: lists, people: people,
    trainerTypes: trainerTypes, permissionDefs: permissionDefs, settingDefs: settingDefs,
    followUps: followUps, workTasks: workTasks, timeline: timeline, packages: packages,
    keyFobs: keyFobs, taxCategories: taxCategories, items: items, itemStock: itemStock, stockMoves: stockMoves,
    membershipSubTypes: membershipSubTypes, ptSubTypes: ptSubTypes, addOnKinds: addOnKinds,
    // Max discount % by role (decision #77). Default, can change in Settings → Sales rules. Every role has a number; never "no limit".
    // Max discount % per role lives ONLY in the grid row sales.discountMax (permissionDefs, decisions #77, #96).
    // Minimum first payment on packages (decision #85). Default, can change (Settings → Sales rules).
    salesRules: { minFirstPayPct: 30 }, salesRuleDefaults: { minFirstPayPct: 30 },
    // Payment methods (decision #80). Default, can change. needsRef: reference / transaction no. required.
    paymentMethods: [
      // #116: Cash reference = the receipt number (auto, read-only). refLabel = what staff type; Cheque also needs the bank name.
      { id: "pm1", name: "Cash", needsRef: false, active: true, isDefault: true, refLabel: "Receipt no. (auto)" },
      { id: "pm2", name: "UPI", needsRef: true, active: true, isDefault: true, refLabel: "UTR / transaction ID" },
      { id: "pm3", name: "Bank transfer (NEFT / IMPS / Net banking)", needsRef: true, active: true, isDefault: true, refLabel: "UTR" },
      { id: "pm4", name: "Card", needsRef: true, active: true, isDefault: true, refLabel: "Approval code or last 4" },
      { id: "pm5", name: "Cheque", needsRef: true, active: false, isDefault: false, refLabel: "Cheque number", needsBank: true }   // EDGE: disabled method (hidden in Sell mode)
    ],
    // Receipt no. per branch (decision #81): <prefix>-<6 digits>, next = last + 1. Default, can change.
    receiptPrefix: { b1: "S31", b2: "S65", b3: "GC" },
    receiptSeq: { b1: 123, b2: 57, b3: 31 },
    nextClientNo: 1003, duplicateMobileAttempts: duplicateMobileAttempts,
    docs: [{ personId: "p7", type: "ID proof", name: "Aadhaar copy (placeholder).pdf", at: day(-100), by: "u6" }],
    docTypes: ["ID proof", "Waiver/consent form", "Medical form", "Photo", "Other"],
    currentUserId: "u2", currentRole: "CEO", currentBranchId: "all"
  };
  // Every person and package belongs to the one dummy tenant (#102).
  people.forEach(function (p) { p.tenantId = "t1"; });
  packages.forEach(function (p) { p.tenantId = "t1"; });
})();
