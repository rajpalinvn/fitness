/* App shell: sidebar, top bar, dropdowns, inline search, display preferences, SVG icons.
   ONE place for every page. Usage in a page:
     <div class="app" data-shell="leads" data-root="../../"> <main class="main">…</main> </div>
   Load order: data.js, app.js, shell.js. */
(function () {
  var $ = App.$, $all = App.$all, esc = App.esc;

  // ---------- Display preferences (decision #35) ----------
  // Per user in the real app; session storage in the mockup. Applied as data attributes
  // on <html>; tokens.css switches token values, so pages need no changes.
  var PREF_DEFAULTS = { drawer: "70", density: "comfortable", text: "medium", search: "medium", sidebar: "expanded" };
  App.PREF_DEFAULTS = PREF_DEFAULTS;
  App.prefs = (function () {
    var saved = {}; try { saved = JSON.parse(App.sessionGet("prefs") || "{}") || {}; } catch (e) {}
    return Object.assign({}, PREF_DEFAULTS, saved);
  })();
  App.applyPrefs = function () {
    var r = document.documentElement;
    ["drawer", "density", "text", "search"].forEach(function (k) { r.setAttribute("data-" + k, App.prefs[k]); });
  };
  App.setPref = function (k, v) {
    App.prefs[k] = v; App.sessionSet("prefs", JSON.stringify(App.prefs)); App.applyPrefs();
    if (k === "sidebar" && app) { App.sessionSet("sidebar", ""); if (!isTablet.matches) setCollapsed(v === "collapsed", false); }
    document.dispatchEvent(new CustomEvent("mock:prefs", { detail: App.prefs }));
  };
  App.resetPrefs = function () {
    App.prefs = Object.assign({}, PREF_DEFAULTS); App.sessionSet("prefs", "{}"); App.applyPrefs();
    if (app) { App.sessionSet("sidebar", ""); if (!isTablet.matches) setCollapsed(false, false); }
    document.dispatchEvent(new CustomEvent("mock:prefs", { detail: App.prefs }));
  };
  App.applyPrefs();

  // ---------- Icons: 24x24, line style, stroke = currentColor ----------
  var ICONS = {
    today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    followups: '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/><path d="M20 3l-5 5M15 3v5h5"/>',
    tasks: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>',
    leads: '<path d="M3 4h18l-7 8v6l-4 2v-8L3 4z"/>',
    clients: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h3a1 1 0 0 1 1 1v11M3 21h18M8 7h4M8 11h4M8 15h4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    "chevron-down": '<path d="M6 9l6 6 6-6"/>',
    "chevrons-left": '<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>',
    "chevrons-right": '<path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    phone: '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    message: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    "x-circle": '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    "chevron-left": '<path d="M15 18l-6-6 6-6"/>',
    "chevron-right": '<path d="M9 18l6-6-6-6"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    swap: '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><path d="M12 7v5l3 2"/>'
  };
  App.icon = function (name, cls) {
    return '<svg class="ico ' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || "") + "</svg>";
  };
  // Static HTML can ask for an icon with <span data-icon="x"></span>.
  App.fillIcons = function (root) {
    $all("[data-icon]", root).forEach(function (el) {
      if (!el.querySelector("svg")) el.insertAdjacentHTML("afterbegin", App.icon(el.dataset.icon));
    });
  };

  // ---------- Shared modal skeleton: App.makeModal("id") -> { el, title, body, foot } ----------
  App.makeModal = function (id, size) {
    var m = document.getElementById(id);
    if (!m) {
      m = document.createElement("div"); m.id = id; m.className = "modal" + (size ? " modal-" + size : "");
      m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", id + "-t");
      m.innerHTML = '<div class="modal-head"><h3 id="' + id + '-t" data-m-title></h3>' +
        '<button class="btn btn-ghost icon-btn" data-close aria-label="Close">' + App.icon("x") + "</button></div>" +
        '<div class="modal-body" data-m-body></div><div class="modal-foot" data-m-foot></div>';
      document.body.appendChild(m);
    }
    return { el: m, title: m.querySelector("[data-m-title]"), body: m.querySelector("[data-m-body]"), foot: m.querySelector("[data-m-foot]") };
  };

  // ---------- Styled select: keeps the native <select> (hidden) as the value store ----------
  var selSeq = 0;
  App.enhanceSelect = function (sel) {
    if (!sel || sel._dd) { if (sel) App.syncSelect(sel); return; }
    if (!sel.id) sel.id = "sel" + (++selSeq);
    var name = "sel-" + sel.id, wrap = document.createElement("div");
    wrap.className = "dd dd-select" + (sel.classList.contains("block") || sel.closest(".field") ? " block" : "");
    if (sel.classList.contains("tablet-hide")) wrap.classList.add("tablet-hide");
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel); sel.hidden = true;
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "pill select-btn";
    btn.dataset.dd = name; btn.setAttribute("aria-haspopup", "menu"); btn.setAttribute("aria-expanded", "false");
    var lab = sel.getAttribute("aria-label") || (document.querySelector('label[for="' + sel.id + '"]') || {}).textContent || "";
    btn.setAttribute("aria-label", lab.trim());
    var lbl = document.querySelector('label[for="' + sel.id + '"]'); if (lbl) lbl.setAttribute("for", "");
    var menu = document.createElement("div"); menu.className = "dd-menu dd-left"; menu.dataset.ddMenu = name; menu.setAttribute("role", "menu"); menu.hidden = true;
    wrap.appendChild(btn); wrap.appendChild(menu);
    sel._dd = { btn: btn, menu: menu };
    new MutationObserver(function () { App.syncSelect(sel); }).observe(sel, { childList: true });
    App.syncSelect(sel);
  };
  // Searchable dropdowns (#128): lists that can be long get a "Type to filter" box + "No match".
  // Owner, Assigned to, Sales rep, Source, Branch, Package, Staff / trainer / approver pickers, State, Region; plus any list of 10+.
  // Short fixed lists (gender, temperature, stage, country code, method, discount reason…) stay plain.
  App.SEARCH_SELECT = /^(fOwner|fRep|fBranch|fSource|fRegion|qlOwner|qlBranch|qlSource|assignUser|assignManyUser|ffAssign.*|movePerson|pickSe|cvRep|cvPkg.*|trTrainer|trApprover|qrAsk|qPkg|qTrainer|sfBranch|brState|brRegion|fiItem.*)$/;
  App.isSearchSelect = function (sel) {
    return sel.dataset.search != null || App.SEARCH_SELECT.test(sel.id) || sel.name === "source" || sel.classList.contains("ff-assign") || sel.options.length >= 10;
  };
  App.syncSelect = function (sel) {
    if (!sel || !sel._dd) return;
    var o = sel.options[sel.selectedIndex], first = sel.options[0];
    sel._dd.btn.innerHTML = '<span class="pill-text">' + esc(o ? o.text : "") + "</span>" + App.icon("chevron-down", "ico-sm");
    sel._dd.btn.classList.toggle("is-set", !!o && !!first && o !== first && sel.dataset.noHighlight == null);
    sel._dd.btn.disabled = sel.disabled;
    var search = App.isSearchSelect(sel);
    sel._dd.menu.classList.toggle("dd-searchable", search);
    sel._dd.menu.innerHTML = (search ? '<div class="dd-search">' + App.icon("search") + '<input class="input" type="text" data-dd-search placeholder="Type to filter" aria-label="Filter ' + esc(sel._dd.btn.getAttribute("aria-label") || "list") + '" autocomplete="off"></div>' : "") +
      Array.prototype.map.call(sel.options, function (op) {
      return '<button class="dd-item" role="menuitemradio" tabindex="-1" data-sel="' + esc(sel.id) + '" data-val="' + esc(op.value) +
        '" aria-checked="' + (op.selected) + '"><span class="dd-check">' + (op.selected ? App.icon("check") : "") + "</span><span>" + esc(op.text) + "</span></button>";
    }).join("") + (search ? '<div class="dd-empty muted" data-dd-nomatch hidden>No match</div>' : "");
  };
  App.syncAllSelects = function (root) { $all("select", root).forEach(function (s) { if (s._dd) App.syncSelect(s); }); };

  // ---------- Navigation ----------
  var GROUPS = [
    { label: "Daily work", items: [
      { key: "today", label: "Today", path: "features/today/index.html", badge: "attention" },
      { key: "followups", label: "Follow-ups", path: "features/followups/index.html", badge: "dueToday" },
      { key: "tasks", label: "Tasks", path: "features/tasks/index.html", badge: "openTasks" }] },
    { label: "CRM", items: [
      { key: "leads", label: "Leads", path: "features/leads/index.html" },
      { key: "clients", label: "Clients", path: "features/clients/index.html" }] }
  ];
  var SETTINGS = { key: "settings", label: "Settings", path: "features/settings/index.html" };
  var BADGE = {
    attention: { cls: "red", say: "need attention (overdue or no follow-up)" },
    dueToday: { cls: "amber", say: "follow-ups due today" },
    openTasks: { cls: "neutral", say: "open tasks" }
  };
  App.built = ["today", "leads", "clients", "settings"]; // screens that exist; others show a toast instead of a broken link

  var app, root, active, isTablet = window.matchMedia("(max-width: 1024px)");

  function navItem(n, counts) {
    var built = App.built.indexOf(n.key) > -1 && n.path;
    var attrs = built ? 'href="' + root + n.path + '"' : 'href="#" data-toast="' + n.label + ' screen is not built yet" data-toast-kind=""';
    var badge = "";
    if (n.badge && counts[n.badge] > 0) {
      var c = counts[n.badge], b = BADGE[n.badge];
      badge = '<span class="nav-badge ' + b.cls + '" aria-label="' + c + " " + b.say + '">' + (c > 99 ? "99+" : c) + "</span>";
    }
    var on = n.key === active;
    return '<a class="nav-item' + (on ? " active" : "") + '" ' + attrs + ' data-tip="' + n.label + '"' + (on ? ' aria-current="page"' : "") + ">" +
      '<span class="nav-icon">' + App.icon(n.key) + badge + '</span><span class="nav-label">' + n.label + "</span></a>";
  }

  function renderSidebar() {
    var counts = App.counts(), u = App.demoUser(), collapsed = app.classList.contains("sb-collapsed"), unseen = App.WhatsNew.unseen().length;
    $(".sidebar", app).innerHTML =
      '<div class="sb-brand"><div class="sb-logo" aria-hidden="true">FL</div><div class="sb-text">' +
        '<div class="sb-name">Fitness Labs</div><div class="sb-branch">' + esc(App.branchName(App.state.branchId)) + "</div></div></div>" +
      '<nav class="sb-nav" aria-label="Main">' + GROUPS.map(function (g) {
        return '<div class="sb-group"><div class="sb-group-label">' + g.label + "</div>" +
          g.items.map(function (n) { return navItem(n, counts); }).join("") + "</div>";
      }).join("") + "</nav>" +
      '<div class="sb-bottom">' + navItem(SETTINGS, counts) +
        '<button class="nav-item sb-toggle" data-sb-toggle data-tip="' + (collapsed ? "Expand sidebar" : "Collapse sidebar") +
          '" aria-label="' + (collapsed ? "Expand sidebar" : "Collapse sidebar") + '" aria-expanded="' + !collapsed + '">' +
          '<span class="nav-icon">' + App.icon(collapsed ? "chevrons-right" : "chevrons-left") + '</span><span class="nav-label">Collapse</span></button>' +
        '<div class="sb-user" data-tip="' + esc(u.name + " · " + u.role) + '"><span class="avatar">' + esc(App.initials(u.name)) + "</span>" +
          '<span class="sb-user-text"><span class="sb-user-name">' + esc(u.name) + '</span><span class="sb-user-role">' + esc(u.role) + "</span></span></div>" +
        // Two lines under the user (#124): What's new (unseen count) + a small grey version line.
        '<button class="nav-item sb-news" data-whats-new data-tip="What&#39;s new" aria-label="What&#39;s new' + (unseen ? ", " + unseen + " new" : "") + '">' +
          '<span class="nav-icon">' + App.icon("info") + (unseen ? '<span class="nav-badge neutral" data-news-count>' + unseen + "</span>" : "") + "</span>" +
          '<span class="nav-label">What&#39;s new</span></button>' +
        '<div class="sb-version" data-version>' + esc(App.buildLine()) + "</div>" +
      "</div>";
  }

  // ---------- What's new (#124) ----------
  App.buildLine = function () { var b = DUMMY.build || {}; return "Build " + App.empty(b.date) + " · " + App.empty(b.commit); };
  App.WhatsNew = {
    // "Seen" is remembered per user in localStorage (#125). Wrapped: storage can be blocked.
    key: function () { return "mock.newsSeen." + ((App.demoUser() || {}).id || "anon"); },
    seen: function () { try { return (localStorage.getItem(App.WhatsNew.key()) || "").split(",").filter(Boolean); } catch (e) { return []; } },
    markSeen: function () { try { localStorage.setItem(App.WhatsNew.key(), DUMMY.releaseNotes.map(function (n) { return n.id; }).join(",")); } catch (e) {} },
    unseen: function () { var s = App.WhatsNew.seen(); return DUMMY.releaseNotes.filter(function (n) { return s.indexOf(n.id) < 0; }); },
    open: function () {
      var m = App.makeModal("newsModal"), s = App.WhatsNew.seen();
      m.title.textContent = "What's new";
      m.body.innerHTML = DUMMY.releaseNotes.length ? '<ul class="news-list">' + DUMMY.releaseNotes.map(function (n) {
        return '<li><div class="row row-tight"><strong>' + esc(n.title) + "</strong>" + (s.indexOf(n.id) < 0 ? ' <span class="badge badge-info">New</span>' : "") +
          '</div><div class="cell-sub">' + esc(App.formatDate(n.date)) + "</div><p>" + esc(n.text) + "</p></li>";
      }).join("") + "</ul>" : '<p class="muted">Nothing new yet.</p>';
      m.body.innerHTML += '<p class="sb-version">' + esc(App.buildLine()) + "</p>";
      m.foot.innerHTML = '<button class="btn btn-primary" data-close>Close</button>';
      App.openModal("newsModal");
      App.WhatsNew.markSeen();
      renderSidebar();
    }
  };

  function menuItem(attrs, label, selected, icon) {
    return '<button class="dd-item" role="' + (selected == null ? "menuitem" : "menuitemradio") + '" tabindex="-1" ' + attrs +
      (selected == null ? "" : ' aria-checked="' + selected + '"') + ">" +
      '<span class="dd-check">' + (selected ? App.icon("check") : icon ? App.icon(icon) : "") + "</span><span>" + label + "</span></button>";
  }

  // Branch switcher (#124): grouped by region; a search box from 6 branches.
  App.BRANCH_SEARCH_FROM = 6;
  function branchMenu(br) {
    var many = DUMMY.branches.length >= App.BRANCH_SEARCH_FROM;
    var groups = DUMMY.regions.map(function (r) { return { r: r, list: DUMMY.branches.filter(function (b) { return b.regionId === r.id; }) }; })
      .concat([{ r: { name: "No region" }, list: DUMMY.branches.filter(function (b) { return !App.byId(DUMMY.regions, b.regionId); }) }])
      .filter(function (g) { return g.list.length; });
    return (many ? '<div class="dd-search">' + App.icon("search") + '<input class="input" type="text" data-branch-search placeholder="Search branches" aria-label="Search branches" autocomplete="off"></div>' : "") +
      menuItem('data-branch="all"', "All branches", br === "all") +
      groups.map(function (g) {
        return '<div class="dd-group" data-branch-group><div class="dd-sublabel">' + esc(g.r.name) + "</div>" +
          g.list.map(function (b) { return menuItem('data-branch="' + b.id + '" data-branch-name="' + esc((b.name + " " + (b.city || "") + " " + g.r.name).toLowerCase()) + '"', esc(b.name), br === b.id); }).join("") + "</div>";
      }).join("") + '<div class="dd-empty muted" data-branch-none hidden>No branch matches</div>';
  }
  function filterBranches(q) {
    q = q.toLowerCase().trim(); var any = false;
    $all("[data-branch-group]").forEach(function (g) {
      var vis = 0;
      $all("[data-branch-name]", g).forEach(function (i) { var on = !q || i.dataset.branchName.indexOf(q) > -1; i.hidden = !on; if (on) vis++; });
      g.hidden = !vis; if (vis) any = true;
    });
    var all = $('[data-branch="all"]'); if (all) all.hidden = !!q;
    var none = $("[data-branch-none]"); if (none) none.hidden = any;
  }
  App.filterBranches = filterBranches;
  // Filter a searchable select menu (#128). The first option ("All …" / "Choose…") stays visible.
  App.filterMenu = function (menu, q) {
    q = String(q || "").toLowerCase().trim(); var shown = 0, list = $all("[data-sel]", menu);
    list.forEach(function (b, i) { var on = !q || i === 0 && !b.dataset.val || b.textContent.toLowerCase().indexOf(q) > -1; b.hidden = !on; if (on && (b.dataset.val || i > 0)) shown++; });
    var nm = $("[data-dd-nomatch]", menu); if (nm) nm.hidden = shown > 0;
  };

  function renderTopbar() {
    var counts = App.counts(), u = App.demoUser(), role = App.state.role, br = App.state.branchId;
    var title = app.dataset.title || (GROUPS.concat([{ items: [SETTINGS] }]).reduce(function (a, g) { return a.concat(g.items); }, [])
      .filter(function (n) { return n.key === active; })[0] || {}).label || "";
    $(".tb-title", app).textContent = title;
    var tmp = document.createElement("div");
    tmp.innerHTML =
      '<div class="tb-right">' +
        '<button class="demo-chip" data-dd="user" aria-haspopup="menu" title="Demo tool: change the role you are viewing as">' + App.icon("eye") +
          '<span class="dc-long">Demo · Viewing as:</span><span class="dc-short">Demo:</span><strong>' + esc(role) + "</strong></button>" +
        '<button class="btn btn-primary" data-new-lead>' + App.icon("plus") + "Lead</button>" +
        '<div class="dd">' +
          '<button class="pill" data-dd="branch" aria-haspopup="menu" aria-expanded="false" aria-label="Branch: ' + esc(App.branchName(br)) + '">' +
            App.icon("building") + '<span class="pill-text">' + esc(App.branchName(br)) + "</span>" + App.icon("chevron-down", "ico-sm") + "</button>" +
          '<div class="dd-menu" data-dd-menu="branch" role="menu" hidden>' +
            '<div class="dd-label">Branch</div>' + branchMenu(br) +
          "</div></div>" +
        '<div class="dd">' +
          '<button class="icon-round" data-dd="bell" aria-haspopup="menu" aria-expanded="false" aria-label="Notifications' +
            (counts.unread ? ", " + counts.unread + " unread" : "") + '">' + App.icon("bell") +
            (counts.unread ? '<span class="dot">' + counts.unread + "</span>" : "") + "</button>" +
          '<div class="dd-menu dd-wide" data-dd-menu="bell" role="menu" hidden>' +
            '<div class="dd-label dd-label-row"><span>Notifications</span>' +
              (counts.unread ? '<button class="link-btn" data-mark-read tabindex="-1">Mark all read</button>' : "") + "</div>" +
            App.Notify.mine().map(function (n) {
              return '<button class="dd-item notif' + (n.unread ? " unread" : "") + '" role="menuitem" tabindex="-1" data-notif="' + n.id + '">' +
                '<span class="dd-check">' + App.icon("clock") + '</span><span><span class="notif-text">' + esc(n.text) +
                '</span><span class="notif-time">' + esc(App.formatDate(n.at)) + (n.unread ? " · Unread" : "") + "</span></span></button>";
            }).join("") +
          "</div></div>" +
        '<div class="dd">' +
          '<button class="avatar-btn" data-dd="user" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu for ' + esc(u.name) + '">' +
            '<span class="avatar">' + esc(App.initials(u.name)) + "</span></button>" +
          '<div class="dd-menu dd-right" data-dd-menu="user" role="menu" hidden>' +
            '<div class="dd-user"><span class="avatar avatar-lg">' + esc(App.initials(u.name)) + '</span><span><strong>' + esc(u.name) +
              '</strong><span class="sb-user-role">' + esc(u.role) + "</span></span></div>" +
            '<div class="dd-label dd-demo">View as (demo)</div>' +
            DUMMY.roles.map(function (r) { return menuItem('data-role="' + esc(r.name) + '"', esc(r.name), r.name === role); }).join("") +
            '<div class="dd-sep"></div>' +
            menuItem('data-toast="My profile comes later" data-toast-kind=""', "My profile", null, "user") +
            menuItem('data-toast="Sign out is not part of the mockup" data-toast-kind=""', "Sign out", null, "logout") +
          "</div></div>" +
      "</div>";
    $(".tb-right", app).replaceWith(tmp.firstChild);
  }

  function render() { renderSidebar(); renderTopbar(); }

  // ---------- Sidebar collapse ----------
  function setCollapsed(c, remember) {
    app.classList.toggle("sb-collapsed", c);
    app.classList.toggle("sb-overlay-open", !c && isTablet.matches);
    if (remember) App.sessionSet("sidebar", c ? "collapsed" : "expanded");
    renderSidebar();
  }
  function initialCollapsed() {
    var saved = App.sessionGet("sidebar");
    if (isTablet.matches) return true;            // tablet always starts collapsed
    if (saved) return saved === "collapsed";      // a toggle this session wins
    return App.prefs.sidebar === "collapsed";     // Settings > Display > Sidebar default
  }

  // ---------- Dropdowns ----------
  var openDD = null; // { menu, trigger }
  function closeDD(restore) {
    if (!openDD) return false;
    openDD.menu.hidden = true;
    $all('[data-dd="' + openDD.name + '"]').forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    if (restore && openDD.trigger && document.contains(openDD.trigger)) openDD.trigger.focus();
    openDD = null; return true;
  }
  function items(menu) { return $all(".dd-item:not([hidden]), [data-mark-read], [data-branch-search], [data-dd-search]", menu).filter(function (x) { return !x.closest("[hidden]"); }); }
  function openMenu(name, trigger) {
    collapseSearch();
    closeDD(false);
    var menu = $('[data-dd-menu="' + name + '"]'); if (!menu) return;
    menu.hidden = false;
    $all('[data-dd="' + name + '"]').forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    openDD = { name: name, menu: menu, trigger: trigger };
    var list = items(menu), sel = menu.querySelector('[aria-checked="true"]') || list[0], srch = menu.querySelector("[data-dd-search]");
    if (srch) { srch.value = ""; App.filterMenu(menu, ""); srch.focus(); }   // searchable list: type right away (#128)
    else if (sel) sel.focus();
  }

  // ---------- Inline search (decision #34): the top-bar field expands in place ----------
  var sIndex = 0;
  function sBox() { return $("[data-tb-search]"); }
  function sInput() { return $("[data-search-input]"); }
  function searchHTML() {
    return '<div class="tb-search" data-tb-search>' +
      '<div class="tb-search-box">' + App.icon("search") +
        '<input type="text" class="tb-search-input" data-search-input autocomplete="off" spellcheck="false" role="combobox" ' +
          'aria-label="Search leads, clients, FF ID (Ctrl K)" aria-expanded="false" aria-controls="tbSearchResults" placeholder="Search leads, clients, FF ID…">' +
        "<kbd data-search-kbd>Ctrl K</kbd></div>" +
      '<div class="tb-search-results" id="tbSearchResults" role="listbox" hidden></div></div>';
  }
  function sResults() {
    var q = (sInput().value || "").toLowerCase().trim();
    var recent = App.visibleLeads("all").slice().sort(function (a, b) { return new Date(b.lastActivityAt) - new Date(a.lastActivityAt); });
    if (q) recent = recent.filter(function (p) { return p.name.toLowerCase().indexOf(q) > -1 || App.phoneMatches(p, q)   /* E.164 (#119) */; });
    return recent.slice(0, 5);
  }
  function renderSearch() {
    var res = sResults(), q = sInput().value.trim(), box = $("#tbSearchResults");
    sIndex = Math.min(sIndex, Math.max(res.length - 1, 0));
    box.innerHTML = (res.length
      ? '<div class="pal-section">' + (q ? "Matching leads" : "Recent leads") + "</div>" + res.map(function (p, i) {
          return '<div class="pal-item' + (i === sIndex ? " active" : "") + '" role="option" id="sr-' + p.id + '" aria-selected="' + (i === sIndex) + '" data-sr-id="' + p.id + '">' +
            '<span class="avatar avatar-sm">' + esc(App.initials(p.name)) + '</span><span class="pal-main"><span>' + esc(p.name) +
            '</span><span class="pal-sub">' + esc(p.cc + " " + p.mobile) + " · " + esc(App.branchName(p.branchId)) + "</span></span>" +
            '<span class="badge badge-info">Lead</span></div>';
        }).join("")
      : '<div class="pal-empty">No leads match "' + esc(q) + '".' +
          (/^[+\d\s-]{6,}$/.test(q) ? ' <button type="button" class="btn btn-sm btn-primary" data-sr-create>' + App.icon("plus", "ico-sm") + "Create lead with this number</button>" : "") + "</div>") +
      '<div class="pal-foot">' + App.icon("search", "ico-sm") + " Placeholder results. Full search comes in a later screen.</div>";
    sInput().setAttribute("aria-activedescendant", res[sIndex] ? "sr-" + res[sIndex].id : "");
  }
  function expandSearch() {
    var s = sBox(); if (!s || s.classList.contains("open")) return;
    closeDD(false);
    s.classList.add("open"); sIndex = 0;
    sInput().setAttribute("aria-expanded", "true"); $("[data-search-kbd]").textContent = "Esc";
    $("#tbSearchResults").hidden = false; renderSearch();
  }
  function collapseSearch() {
    var s = sBox(); if (!s || !s.classList.contains("open")) return false;
    s.classList.remove("open");
    $("#tbSearchResults").hidden = true; sInput().value = "";
    sInput().setAttribute("aria-expanded", "false"); $("[data-search-kbd]").textContent = "Ctrl K";
    if (document.activeElement === sInput()) sInput().blur();
    return true;
  }
  App.isSearchOpen = function () { var s = sBox(); return !!s && s.classList.contains("open"); };
  function chooseResult(id) {
    collapseSearch();
    if (App.openLead) App.openLead(id);
    else if (App.openProfile) App.openProfile(id);
    else App.toast("Opening profiles from here comes with the search screen", "");
  }

  // Quick lead (screen 4) lives in profile.js. Pages without it go to the Leads page and open it there.
  function newLead(o) {
    if (App.QuickLead) { App.QuickLead.open(o); return; }
    location.href = root + "features/leads/index.html?new=1" + (o.mobile ? "&mobile=" + encodeURIComponent(o.mobile) : "");
  }

  // Esc order: search → dropdown → tablet overlay sidebar → (app.js) modal → drawer
  App.closeShellLayer = function () {
    if (collapseSearch()) return true;
    if (closeDD(true)) return true;
    if (app && app.classList.contains("sb-overlay-open")) { setCollapsed(true, false); return true; }
    return false;
  };
  App.refreshShell = render;

  // ---------- Events ----------
  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-dd]"))) {
      var name = t.dataset.dd;
      if (openDD && openDD.name === name) closeDD(false); else openMenu(name, t);
      return;
    }
    if ((t = e.target.closest("[data-sel]"))) {
      var s = document.getElementById(t.dataset.sel);
      closeDD(true);
      if (s && s.value !== t.dataset.val) { s.value = t.dataset.val; App.syncSelect(s); s.dispatchEvent(new Event("change", { bubbles: true })); }
      return;
    }
    if ((t = e.target.closest("[data-branch]"))) { closeDD(true); App.setBranch(t.dataset.branch); return; }
    if ((t = e.target.closest("[data-role]"))) { closeDD(true); App.setRole(t.dataset.role); return; }
    if ((t = e.target.closest("[data-whats-new]"))) { App.WhatsNew.open(); return; }
    if ((t = e.target.closest("[data-mark-read]"))) {   // "Mark all read" (#120)
      DUMMY.notifications.forEach(function (n) { n.unread = false; });
      closeDD(false); renderTopbar(); App.toast("All notifications marked as read", ""); return;
    }
    if ((t = e.target.closest("[data-notif]"))) {
      var n = App.byId(DUMMY.notifications, t.dataset.notif); if (n) n.unread = false;
      closeDD(false); renderTopbar(); return;
    }
    if (openDD && !e.target.closest(".dd-menu")) closeDD(false);
    if (e.target.closest(".dd-menu .dd-item")) closeDD(false);
    if ((t = e.target.closest("[data-sr-id]"))) { chooseResult(t.dataset.srId); return; }
    if ((t = e.target.closest("[data-sr-create]"))) { var num = sInput().value.trim(); collapseSearch(); newLead({ mobile: num }); return; }
    if (e.target.closest("[data-tb-search]")) { expandSearch(); if (document.activeElement !== sInput()) sInput().focus(); return; }
    collapseSearch(); // outside click
    if (e.target.closest("[data-sb-toggle]")) { setCollapsed(!app.classList.contains("sb-collapsed"), true); return; }
    if (e.target.closest(".sb-scrim")) { setCollapsed(true, false); return; }
    if (e.target.closest("[data-new-lead]")) newLead({});
  });

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (App.isSearchOpen()) collapseSearch(); else { sInput().focus(); expandSearch(); }
      return;
    }
    // Dropdown keyboard
    if (openDD && openDD.menu.contains(document.activeElement)) {
      var list = items(openDD.menu), i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); list[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); list[list.length - 1].focus(); }
      else if (e.key === "Tab") closeDD(false);
      return;
    }
    // Arrow down on a closed trigger opens it
    var trg = e.target.closest && e.target.closest("[data-dd]");
    if (trg && e.key === "ArrowDown") { e.preventDefault(); openMenu(trg.dataset.dd, trg); return; }
    // Search keyboard
    if (App.isSearchOpen() && e.target === sInput()) {
      var res = sResults();
      if (e.key === "ArrowDown") { e.preventDefault(); sIndex = Math.min(sIndex + 1, res.length - 1); renderSearch(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sIndex = Math.max(sIndex - 1, 0); renderSearch(); }
      else if (e.key === "Enter" && res[sIndex]) { e.preventDefault(); chooseResult(res[sIndex].id); }
      else if (e.key === "Tab") collapseSearch();
    }
  });
  document.addEventListener("input", function (e) {
    if (e.target.matches("[data-search-input]")) { sIndex = 0; renderSearch(); }
    if (e.target.matches("[data-branch-search]")) filterBranches(e.target.value);
    if (e.target.matches("[data-dd-search]")) App.filterMenu(e.target.closest(".dd-menu"), e.target.value);
  });
  document.addEventListener("focusin", function (e) { if (e.target.matches && e.target.matches("[data-search-input]")) expandSearch(); });
  document.addEventListener("mock:context", render);
  document.addEventListener("mock:data", render);

  // ---------- Build ----------
  document.addEventListener("DOMContentLoaded", function () {
    app = $("[data-shell]"); if (!app) return;
    active = app.dataset.shell; root = app.dataset.root || "";
    var main = $(".main", app);
    var side = document.createElement("aside"); side.className = "sidebar";
    var content = document.createElement("div"); content.className = "content";
    var top = document.createElement("header"); top.className = "topbar";
    var scrim = document.createElement("div"); scrim.className = "sb-scrim";
    app.insertBefore(side, app.firstChild);
    app.appendChild(scrim);
    app.appendChild(content);
    content.appendChild(top);
    top.innerHTML = '<div class="tb-title"></div>' + searchHTML() + '<div class="tb-right"></div>';
    var setPh = function () { sInput().placeholder = isTablet.matches ? "Search…" : "Search leads, clients, FF ID…"; };
    setPh();
    if (main) content.appendChild(main);
    app.classList.toggle("sb-collapsed", initialCollapsed());
    render();
    App.fillIcons(document);
    // Leaving tablet width removes the overlay state.
    var onMQ = function () { setPh(); app.classList.remove("sb-overlay-open"); if (isTablet.matches) app.classList.add("sb-collapsed"); renderSidebar(); };
    if (isTablet.addEventListener) isTablet.addEventListener("change", onMQ); else isTablet.addListener(onMQ);
  });
  // Bell (#120): the unread count refreshes every 60 s and when the tab gets focus (the real app polls the API).
  // Read notifications older than 90 days are deleted by a nightly job at 02:00 India time (mockup: once on load).
  App.Bell = {
    REFRESH_MS: 60000, KEEP_READ_DAYS: 90,
    refresh: function () { if (typeof renderTopbar === "function" && !document.querySelector(".dd-menu:not([hidden])")) renderTopbar(); },
    purge: function () {
      var cut = Date.now() - App.Bell.KEEP_READ_DAYS * 864e5, n = DUMMY.notifications.length;
      DUMMY.notifications = DUMMY.notifications.filter(function (x) { return x.unread || new Date(x.at).getTime() >= cut; });
      return n - DUMMY.notifications.length;
    }
  };
  App.Bell.purge();
  setInterval(App.Bell.refresh, App.Bell.REFRESH_MS);
  window.addEventListener("focus", App.Bell.refresh);
})();
