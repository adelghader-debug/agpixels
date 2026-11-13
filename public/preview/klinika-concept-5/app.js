/* Klinika concept 5. Wording comes from the website's own locale files (K.loc); o(en, ar) marks the few
   headings written for the new content sections. */
(function () {
  "use strict";
  const K = window.K, app = document.getElementById("app");
  const qs = new URLSearchParams(location.search);
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } } };
  let lang = qs.get("lang") || store.get("k5lang") || "en";
  if (lang !== "ar") lang = "en";

  /* ---------- wording ---------- */
  const pick = (key) => key.split(".").reduce((a, k) => (a == null ? a : a[k]), K.loc[lang]);
  function t(key, vars) {
    const v = pick(key);
    if (v == null) return key;
    return String(v).trim().replace(/\{\{(\w+)\}\}/g, (m, k) => (vars && vars[k] != null ? vars[k] : ""));
  }
  function tn(key, count) {
    const cat = new Intl.PluralRules(lang).select(count);
    const k = [key + "_" + cat, cat === "one" ? key : key + "_other", key].find((x) => pick(x) != null);
    return t(k, { count });
  }
  const x = (obj) => (obj ? obj[lang] : "");
  const o = (en, ar) => (lang === "ar" ? ar : en);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SAR = () => o("SAR", "ر.س");
  const cnt = (n, one, many, ar) => (lang === "ar" ? (n === 1 ? ar[0] : n === 2 ? ar[1] : `${n} ${ar[2]}`) : `${n} ${n === 1 ? one : many}`);
  const money = (n) => `${n} <small>${SAR()}</small>`;

  /* ---------- icons ---------- */
  const IC = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    pin: '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    go: '<path d="M5 12h14M13 6l6 6-6 6"/>', chev: '<path d="m9 6 6 6-6 6"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',
    clinic: '<path d="M5 21V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v15M3 21h18M12 7v5M9.5 9.5h5M10 21v-4h4v4"/>',
    home: '<path d="m3 11 9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h.01"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    pct: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    clip: '<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9"/>',
    steth: '<path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>',
  };
  const ic = (n, cls) => `<svg class="i ${n === "go" || n === "chev" ? "flip " : ""}${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;
  const star = (r, n) => `<span class="star"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.2 6.1L12 16.9l-5.5 2.9 1.2-6.1L3.2 9.4l6.1-.8z"/></svg>${r.toFixed(1)}${n != null ? ` <span>(${n} ${t("offers.reviews")})</span>` : ""}</span>`;
  const mk = (file) => `<span class="mk${/radiology/.test(file) ? " big" : ""}" style="--m:url(img/${file})" aria-hidden="true"></span>`;




  /* ---------- the Klinika 3D doctor as a layered puppet: body, head, eyelids ---------- */
  const DOCTOR = `<div class="rig"><div class="rig-body"><img src="img/doctor-body.webp" alt="" width="627" height="632"></div>
    <div class="rig-look"><div class="rig-head"><img src="img/doctor-head.webp" alt="" width="627" height="632">
      <svg viewBox="0 0 627 632" aria-hidden="true"><defs><linearGradient id="lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3C2A8"/><stop offset="1" stop-color="#E8A483"/></linearGradient></defs>
        <g class="lid"><ellipse cx="317.5" cy="168" rx="21.5" ry="14.5" transform="rotate(-4 317.5 168)" fill="url(#lid)"/><path d="M297 171q20 13 41 1" fill="none" stroke="#5A3327" stroke-width="2.6" stroke-linecap="round"/></g>
        <g class="lid"><ellipse cx="399" cy="163.5" rx="23" ry="15" transform="rotate(5 399 163.5)" fill="url(#lid)"/><path d="M377 165q22 14 44 3" fill="none" stroke="#5A3327" stroke-width="2.6" stroke-linecap="round"/></g>
      </svg></div></div></div>`;

  /* ---------- data helpers ---------- */
  const SVC = { clinic_visit: ["visits.clinic", "clinic"], telehealth: ["visits.tele", "video"], home_visit: ["visits.home", "home"] };
  const svcName = (s) => t(SVC[s][0]);
  const specById = (id) => K.specialties.find((s) => s.id === id);
  const specBySlug = (slug) => K.specialties.find((s) => s.slug === slug);
  const clinicByKey = (k) => K.clinics.find((c) => c.key === k);
  const docByKey = (k) => K.doctors.find((d) => d.key === k);
  const docsOfSpec = (id) => K.doctors.filter((d) => d.specialty === id);
  const docsOfClinic = (k) => K.doctors.filter((d) => d.places.some((p) => p.clinic === k));
  const placesFor = (d, svc) => d.places.filter((p) => p.prices[svc] != null);
  const WD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const loc = () => (lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB");
  const addDays = (n) => { const b = new Date(); return new Date(b.getFullYear(), b.getMonth(), b.getDate() + n); };
  function slotsFor(place, svc, day) {
    const span = svc === "telehealth" ? [18, 22] : place.pattern[WD[day.getDay()]];
    if (!span) return [];
    const out = [];
    for (let h = span[0]; h < span[1]; h++) out.push(h);
    const now = new Date();
    return day.toDateString() === now.toDateString() ? out.filter((h) => h > now.getHours() + 3) : out; // the website's 4 hour booking margin
  }
  function nextSlot(place, svc) {
    for (let i = 0; i < 21; i++) { const day = addDays(i), hs = slotsFor(place, svc, day); if (hs.length) return { day, hour: hs[0], in: i }; }
    return null;
  }
  const fmtHour = (h) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? o("AM", "ص") : o("PM", "م")}`;
  const fmtDay = (d, opts) => d.toLocaleDateString(loc(), opts || { weekday: "short", day: "numeric", month: "short" });
  function dayWord(d) {
    const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - addDays(0)) / 864e5);
    if (diff === 0 || diff === 1) { const w = new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(diff, "day"); return w.charAt(0).toUpperCase() + w.slice(1); }
    return fmtDay(d);
  }
  const slotText = (s) => `${dayWord(s.day)}, ${fmtHour(s.hour)}`;
  const weekday = (i) => new Date(2026, 10, 15 + i).toLocaleDateString(loc(), { weekday: "long" }); // 15 Nov 2026 is a Sunday
  function specIcon(s, cls) {
    return K.icons.includes(s.slug) ? `<img src="img/sp-${s.slug}.png" alt="" width="36" height="36" loading="lazy"${cls ? ` class="${cls}"` : ""}>` : `<span class="glyph" aria-hidden="true">${esc(x(s.name).charAt(0))}</span>`;
  }
  const avatar = (d, cls) => (d.photo ? `<img class="av ${cls || ""}" src="${d.photo}" alt="${esc(x(d.name))}" loading="lazy">` : `<span class="av ${cls || ""}" aria-hidden="true">${d.initials}</span>`);
  const clinicMark = (c, cls) => `<span class="av av-sq ${cls || ""}" aria-hidden="true">${ic("clinic")}</span>`;

  /* ---------- state ---------- */
  const S = {
    region: 0, popTab: "spec", faqAll: false,
    F: { svc: "clinic_visit", spec: "", gender: "any", sort: "", q: "", rating: 0 },
    B: null, // booking draft
    vTab: "up",
    visits: null,
  };
  function seedVisits() {
    const kh = docByKey("khalid"), sa = docByKey("sara"), mj = docByKey("majed"), no = docByKey("noura");
    const s2 = nextSlot(sa.places[0], "clinic_visit"), s3 = nextSlot(mj.places[0], "clinic_visit");
    const past = addDays(-9);
    return [
      { id: 1, doc: kh, place: kh.places[0], svc: "telehealth", day: addDays(1), hour: 18, paid: true, price: 100 },
      { id: 2, doc: sa, place: sa.places[0], svc: "clinic_visit", day: s2.day, hour: s2.hour + 1, paid: false, price: 300 },
      { id: 3, doc: mj, place: mj.places[0], svc: "clinic_visit", day: addDays(s3.in + 7), hour: s3.hour, paid: true, price: 380 },
      { id: 4, doc: no, place: no.places[0], svc: "clinic_visit", day: past, hour: 11, paid: true, price: 250, past: true },
    ];
  }

  /* ---------- shared pieces ---------- */
  function header(route) {
    const cur = (r) => (route === r ? ' aria-current="page"' : "");
    return `<header class="top"><div class="wrap">
      <a class="brand" href="#/" aria-label="Klinika"><img src="img/klinika-logo.png" alt="" width="34" height="32"><div><b>KLINIKA</b><span>${t("mobileApp.mobileAppHeading")}</span></div></a>
      <nav aria-label="${o("Main", "الرئيسية")}">
        <a href="#/doctors"${cur("doctors")}>${t("nav.doctorConsultation")}</a>
        <a href="#/" data-goto="offers">${t("nav.services")}</a>
        <a href="#/visits"${cur("visits")}>${t("mobileFooter.visits")}</a>
      </nav>
      <span class="grow"></span>
      <button class="langb" data-lang>${ic("globe")}${t("header.lng")}</button>
      <a class="acct" href="#/visits" aria-label="${t("mobileFooter.profile")}">TP</a>
    </div></header>`;
  }
  function bottomNav(route) {
    const a = (href, key, icon, r, extra) => `<a href="${href}"${route === r ? ' aria-current="page"' : ""}${extra || ""}>${ic(icon)}${t("mobileFooter." + key)}</a>`;
    return `<nav class="bnav" aria-label="${o("Sections", "الأقسام")}">${a("#/", "home", "home", "home")}${a("#/", "offers", "pct", "-", ' data-goto="offers"')}${a("#/doctors", "book", "cal", "doctors")}${a("#/visits", "visits", "clock", "visits")}${a("#/visits", "profile", "user", "-")}</nav>`;
  }
  function footer() {
    const c = K.contact;
    return `<footer class="foot"><div class="wrap">
      <a class="brand" href="#/"><img src="img/klinika-logo.png" alt="" width="34" height="32"><div><b>KLINIKA</b></div></a>
      <a href="#/">${t("footer.userAgreement")}</a><a href="#/">${t("footer.privacyPolicy")}</a><a href="#/" data-goto="faq">${t("footer.helpCenter")}</a>
      <span class="grow"></span><a href="mailto:${c.email}">${c.email}</a><a href="tel:${c.mobile}" dir="ltr">${c.mobile}</a>
    </div><div class="wrap"><p class="note">${o("Design concept. Doctors, clinics, prices and visits shown here are test records, not real ones.", "تصميم مقترح. الأطباء والعيادات والأسعار والزيارات المعروضة هنا بيانات تجريبية وليست حقيقية.")}</p></div></footer>`;
  }
  function faqList(items) {
    return `<div class="faq">${items.map((f) => `<details><summary><span>${esc(f.q)}</span><span class="pm">${ic("plus")}</span></summary><div class="ans">${f.html || `<p>${esc(f.a)}</p>`}</div></details>`).join("")}</div>`;
  }
  const cmsFaq = (i) => { const f = K.faqs[lang][i]; return { q: f.q, html: f.a }; };
  const space = (title, text) => `<div class="space"><span class="tag">${o("Content space", "مساحة محتوى")}</span><b>${title}</b>${text}</div>`;
  const seg = (name, items, value, cls, role) => `<div class="seg ${cls || ""}" role="${role === "radio" ? "radiogroup" : "tablist"}" data-seg="${name}">${items.map(([v, label, icon]) =>
    `<button type="button" role="${role || "tab"}" ${role === "radio" ? "aria-checked" : "aria-selected"}="${v === value}" data-v="${v}">${icon ? ic(icon) : ""}${label}</button>`).join("")}<i></i></div>`;
  const crumbs = (items) => `<nav class="crumbs wrap" aria-label="${o("You are here", "مسار الصفحة")}">${items.map(([label, href], i) => (href ? `<a href="${href}">${label}</a>` : `<span aria-current="page">${label}</span>`) + (i < items.length - 1 ? ic("chev") : "")).join("")}</nav>`;

  /* ---------- home ---------- */
  function docCard(d, svc, i) {
    const places = placesFor(d, svc), p = places[0], c = clinicByKey(p.clinic), s = nextSlot(p, svc), sp = specById(d.specialty);
    return `<article class="p dcard tap" data-rv style="--d:${Math.min(i, 5)}">
      <div class="row" style="align-items:flex-start">${avatar(d)}
        <div class="grow"><h3 class="h3"><a href="#/doctor/${d.key}">${x(d.name)}</a> ${d.choice ? `<span class="choice">${t("consultation.clinicChoice")}</span>` : ""}</h3>
          <p class="meta">${x(d.title)} · <a href="#/doctors/${sp.slug}">${x(sp.name)}</a></p>
          <p class="meta sm"><a href="#/clinic/${c.key}">${x(c.name)}</a>${places.length > 1 || d.places.length > 1 ? ` +${d.places.length - 1}` : ""} · ${x(c.city)}</p></div>
        ${star(d.rating)}</div>
      <div class="ft">${s ? `<span class="chip chip-gr">${ic("clock")}${slotText(s)}</span>` : ""}<span class="grow"></span>
        <span class="price">${money(p.prices[svc])}</span>
        <a class="btn btn-1 btn-s" href="#/book/${d.key}" data-book="${d.key}|${p.clinic}|${svc}">${t("doctorProfile.bookVisit")}</a></div>
    </article>`;
  }
  function popPanel() {
    if (S.popTab === "spec") {
      const list = K.specialties.filter((s) => docsOfSpec(s.id).length);
      return `<div class="grid3 tabp">${list.map((s) => { const ds = docsOfSpec(s.id), cs = new Set(ds.flatMap((d) => d.places.map((p) => p.clinic))).size;
        return `<a class="p prow" href="#/doctors/${s.slug}">${specIcon(s)}<span class="grow"><b>${x(s.name)}</b><span class="sm">${cnt(ds.length, "doctor", "doctors", ["طبيب واحد", "طبيبان", "أطباء"])} · ${cnt(cs, "clinic", "clinics", ["عيادة واحدة", "عيادتان", "عيادات"])}</span></span>${ic("go", "arr")}</a>`; }).join("")}</div>`;
    }
    if (S.popTab === "clin") {
      return `<div class="grid2 tabp">${K.clinics.map((c) => `<a class="p prow" href="#/clinic/${c.key}">${clinicMark(c)}<span class="grow"><b>${x(c.name)}</b><span class="sm">${x(c.address)}</span></span>${star(c.rating)}${ic("go", "arr")}</a>`).join("")}</div>`;
    }
    return `<div class="grid3 tabp">${K.packages.map((p) => `<div class="p prow"><span class="glyph">${ic("flask")}</span><span class="grow"><b>${x(p.name)}</b><span class="sm">${p.tests.length} ${t("labTests.tests")}</span></span><span class="price">${money(p.price)}</span></div>`).join("")}</div>`;
  }
  function homeFaq() {
    const all = K.faqs[lang].map((f, i) => ({ f, i })).filter(({ f }) => lang === "ar" || !/[؀-ۿ]{4}/.test(f.a.slice(0, 80)));
    const shown = S.faqAll ? all : all.slice(0, 6);
    return faqList(shown.map(({ i }) => cmsFaq(i))) + (all.length > 6 && !S.faqAll ? `<p style="margin-top:14px"><button class="btn btn-3" data-act="faq-all">${t("labTests.showAll")} (${all.length})</button></p>` : "");
  }
  function home() {
    const city = x(K.regions[S.region]);
    const tiles = [
      [`<a class="p" href="#/doctors">`, mk("modern_clinic_visit.svg"), t("nav.doctorConsultation"), "</a>"],
      [`<a class="p" href="#/" data-pop="lab">`, mk("modern_laboratory.svg"), t("nav.laboratory"), "</a>"],
      [`<div class="p tap">`, mk("modern_nursing.svg"), t("nav.nursing"), "</div>"],
      [`<div class="p tap">`, mk("modern_radiology.svg"), t("nav.radiology"), "</div>"],
      [`<div class="p soon">`, mk("psychiatry.svg"), `${t("nav.psychiatry")}<span class="chip chip-mu" style="height:22px;font-size:12px">${t("psychiatry.comingSoon")}</span>`, "</div>"],
      [`<a class="p" href="#/" data-goto="offers">`, `<span class="pct">${ic("pct")}</span>`, t("nav.services"), "</a>"],
    ];
    return `<div class="wrap">
    <section class="p lead hero">
      <div class="hero-in">
        <h1 class="h1"><span class="hi">${t("header.titleHello")}</span><span>${t("header.title")}</span></h1>
        <form class="search" role="search" data-search>
          ${ic("search")}<label class="sr" for="q">${t("search.placeholder")}</label>
          <input id="q" name="q" autocomplete="off" placeholder="${t("search.placeholder")}">
          <span class="sep"></span><label class="sr" for="reg">${t("clinicProfile.location")}</label>
          <select id="reg" data-region>${K.regions.map((r, i) => `<option value="${i}"${i === S.region ? " selected" : ""}>${x(r)}</option>`).join("")}</select>
          <button class="btn btn-1" type="submit">${t("search.search")}</button>
          <div class="sugg" id="sugg"></div>
        </form>
      </div>
      <div class="hero-art"><div class="doc-fig" aria-hidden="true">${DOCTOR}<span class="bubble">${t("header.titleHello").replace(/[,،]\s*$/, "")}</span></div></div>
    </section>

    <section class="instant" data-rv aria-labelledby="ic-h">
      <span class="ico">${ic("bolt")}</span>
      <div class="grow"><h2 id="ic-h">${t("uberConsultation.instantConsultation")}</h2><p>${t("uberConsultation.bookConsultation")}</p></div>
      <button class="btn" data-act="instant">${t("uberConsultation.tryNow")}${ic("go", "go")}</button>
    </section>

    <nav class="svc" aria-label="${t("consultation.services")}">${tiles.map(([a, icon, label, z], i) => `${a.replace(">", ` data-rv style="--d:${i}">`)}${icon}<span>${label}</span>${z}`).join("")}</nav>

    <section class="sec" id="offers" aria-labelledby="of-h">
      <div class="sec-h" data-rv><div class="grow"><h2 class="h2" id="of-h">${t("offers.topOffers")}</h2><p class="sm">${t("offers.exclusive")}</p></div></div>
      <div class="grid4 hs">${K.offers.map((f, i) => { const d = docByKey(f.doctor), c = clinicByKey(d.places[0].clinic);
        return `<article class="p offer tap" data-rv style="--d:${i}"><span class="chip chip-pk save">${t("offers.save")} ${Math.round((1 - f.new / f.old) * 100)}%</span>
          <h3 class="h3">${x(f.title)}</h3><p class="sm">${x(c.name)}</p>${star(f.rating, f.reviews)}
          <p class="pr"><span class="price">${money(f.new)}</span><s>${f.old}</s></p>
          <a class="btn btn-2 btn-s" style="margin-top:10px" href="#/book/${d.key}" data-book="${d.key}|${c.key}|clinic_visit">${t("offers.bookNow")}</a></article>`; }).join("")}</div>
    </section>

    <section class="sec" id="popular" aria-labelledby="pp-h">
      <div class="sec-h" data-rv><div class="grow"><h2 class="h2" id="pp-h">${t("mostPopular.title")}</h2><p class="sm">${t("consultation.inLocation", { reg: city })}</p></div>
        ${seg("pop", [["spec", t("mostPopular.specialties")], ["clin", t("mostPopular.clinics")], ["lab", t("mostPopular.labTests")]], S.popTab)}</div>
      <div id="pop" data-rv>${popPanel()}</div>
      <div class="prose sm" style="margin-top:18px;max-width:none" data-rv><p class="clamp" style="-webkit-line-clamp:2" id="pp-d">${t("mostPopular.descr", { city })}</p><button class="btn btn-3" data-more="pp-d">${t("clinicProfile.readMore")}</button></div>
    </section>

    <section class="sec" aria-labelledby="ab-h">
      <div class="about">
        <div class="p" data-rv><h2 class="h2" id="ab-h">${t("mobileApp.mobileAppHeading")}</h2>
          <div class="prose" style="margin-top:10px"><p class="clamp" id="ab-1">${t("mobileApp.mobileAppHeading")} ${t("mobileApp.mobileAppFirstP")}</p><p class="clamp" id="ab-2" hidden>${t("mobileApp.mobileAppSecondP")}</p></div>
          <button class="btn btn-3" data-more="ab-1,ab-2" style="margin-top:6px">${t("clinicProfile.readMore")}</button></div>
        <div class="p" data-rv style="--d:1"><h2 class="h2" style="font-size:24px">${t("bestDoctors.title")}</h2>
          <div class="prose" style="margin-top:10px"><p class="clamp" id="bd-1">${t("bestDoctors.option")}</p></div>
          <button class="btn btn-3" data-more="bd-1" style="margin-top:6px">${t("clinicProfile.readMore")}</button>
          <div class="links" style="margin-top:14px">${K.specialties.filter((s) => docsOfSpec(s.id).length).slice(0, 6).map((s) => `<a href="#/doctors/${s.slug}">${x(s.name)}</a>`).join("")}</div></div>
      </div>
    </section>

    <section class="sec" id="faq" aria-labelledby="fq-h">
      <div class="sec-h" data-rv><h2 class="h2" id="fq-h">${t("politics.questionsAndAnswers")}</h2></div>
      <div id="faqbox" data-rv>${homeFaq()}</div>
    </section>

    <section class="sec" aria-labelledby="gd-h">
      <div class="sec-h" data-rv><h2 class="h2" id="gd-h">${o("Patient guides", "أدلة المرضى")}</h2></div>
      <div class="grid3">${[0, 1, 2].map((i) => `<div data-rv style="--d:${i}">${space(o("Patient guide", "دليل للمريض"), o("Title, short summary and a link to the full guide. Written by Klinika.", "عنوان وملخص قصير ورابط للدليل الكامل. تكتبه كلينيكا."))}</div>`).join("")}</div>
    </section>

    <section class="sec" aria-labelledby="pt-h">
      <div class="partner">
        <div class="p lead" data-rv><h2 class="h2" id="pt-h">${t("partners.partnerWithUs")}</h2><p style="margin-top:8px">${t("partners.chooseText")}</p></div>
        <div class="p" data-rv style="--d:1"><h3 class="h3">${t("partners.clinic")}</h3><p class="sm" style="margin:4px 0 12px">${t("partners.clinicText")}</p><span class="btn btn-2 btn-s">${t("partners.clinicAction")}</span></div>
        <div class="p" data-rv style="--d:2"><h3 class="h3">${t("partners.doctor")}</h3><p class="sm" style="margin:4px 0 12px">${t("partners.doctorText")}</p><span class="btn btn-2 btn-s">${t("partners.doctorAction")}</span></div>
      </div>
    </section>
    </div>`;
  }

  /* ---------- doctors list (with the specialty content below it) ---------- */
  function listResults() {
    const F = S.F, q = F.q.trim().toLowerCase();
    let list = K.doctors.filter((d) => placesFor(d, F.svc).length)
      .filter((d) => !F.spec || specById(d.specialty).slug === F.spec)
      .filter((d) => F.gender === "any" || (F.gender === "female") === d.female)
      .filter((d) => d.rating > F.rating)
      .filter((d) => !q || [d.name.en, d.name.ar, specById(d.specialty).name.en, specById(d.specialty).name.ar].some((v) => v.toLowerCase().includes(q)));
    const price = (d) => placesFor(d, F.svc)[0].prices[F.svc];
    if (F.sort === "lo") list = list.slice().sort((a, b) => price(a) - price(b));
    if (F.sort === "hi") list = list.slice().sort((a, b) => price(b) - price(a));
    if (!list.length) return `<div class="p empty tabp"><p class="h3">${F.gender === "female" ? t("consultation.noFemaleDoctors") : o("No doctors match these filters", "لا يوجد أطباء مطابقون لهذه الخيارات")}</p><p style="margin-top:12px"><button class="btn btn-2 btn-s" data-act="reset">${t("filters.reset")}</button></p></div>`;
    return `<div class="list tabp">${list.map((d, i) => docCard(d, F.svc, i)).join("")}</div>`;
  }
  function doctors(slug) {
    const sp = slug ? specBySlug(slug) : null;
    S.F.spec = sp ? sp.slug : "";
    const F = S.F, city = x(K.regions[S.region]);
    const others = K.specialties.filter((s) => docsOfSpec(s.id).length && (!sp || s.id !== sp.id));
    const clinicsHere = sp ? [...new Set(docsOfSpec(sp.id).flatMap((d) => d.places.map((p) => p.clinic)))].map(clinicByKey) : K.clinics.filter((c) => docsOfClinic(c.key).length);
    const about = sp
      ? `<section class="blk" data-rv><h2 class="h2">${t("clinicProfile.about")} ${x(sp.name)}</h2>
          ${x(sp.description) ? `<div class="prose"><p>${esc(x(sp.description))}</p></div>` : space(o("What this specialty covers", "ما يغطيه هذا التخصص"), o("A clear explanation of what is offered. Some specialties already have this text on the website; this one does not yet.", "شرح واضح لما يقدمه التخصص. بعض التخصصات لديها هذا النص على الموقع، وهذا التخصص لم يُكتب له بعد."))}
          <div class="grid2" style="margin-top:12px">${space(o("Who it is suitable for", "لمن يناسب"), o("The cases and patients this specialty is for.", "الحالات والمرضى الذين يناسبهم هذا التخصص."))}${space(o("What to expect at the visit", "ماذا تتوقع في الزيارة"), o("What happens before, during and after the appointment.", "ما يحدث قبل الموعد وخلاله وبعده."))}</div></section>`
      : `<section class="blk" data-rv><h2 class="h2">${t("bestDoctors.title")}</h2><div class="prose"><p>${t("bestDoctors.option")}</p></div></section>`;
    return `${crumbs([[t("mobileFooter.home"), "#/"], [t("nav.doctorConsultation"), sp ? "#/doctors" : null]].concat(sp ? [[x(sp.name), null]] : []))}
    <div class="wrap">
      <header class="phead"><div class="row">${sp ? specIcon(sp) : ""}<h1 class="h1" style="font-size:clamp(28px,3.6vw,42px)">${sp ? x(sp.name) : t("nav.doctorConsultation")}</h1></div>
        <p class="sm" style="font-size:16px;margin-top:4px">${t("consultation.inLocation", { reg: city })}</p>
        <div class="filters">
          ${seg("svc", Object.keys(SVC).map((k) => [k, svcName(k), SVC[k][1]]), F.svc, "", "radio")}
          <label class="sr" for="f-sp">${t("filters.specialty")}</label><select class="fld" id="f-sp" data-f="spec"><option value="">${t("filters.specialty")}: ${t("labTests.all")}</option>${K.specialties.filter((s) => docsOfSpec(s.id).length).map((s) => `<option value="${s.slug}"${F.spec === s.slug ? " selected" : ""}>${x(s.name)}</option>`).join("")}</select>
          <label class="sr" for="f-g">${o("Doctor", "الطبيب")}</label><select class="fld" id="f-g" data-f="gender">${[["any", "form.any"], ["male", "form.male"], ["female", "form.female"]].map(([v, k]) => `<option value="${v}"${F.gender === v ? " selected" : ""}>${t(k)}</option>`).join("")}</select>
          <label class="sr" for="f-r">${t("filters.rating")}</label><select class="fld" id="f-r" data-f="rating">${[[0, "options.allRatings"], [1, "options.1star"], [2, "options.2star"], [3, "options.3star"], [4, "options.4star"]].map(([v, k]) => `<option value="${v}"${F.rating === v ? " selected" : ""}>${t(k)}</option>`).join("")}</select>
          <label class="sr" for="f-s">${t("filters.sort")}</label><select class="fld" id="f-s" data-f="sort"><option value="">${t("filters.selectSortOption")}</option><option value="lo"${F.sort === "lo" ? " selected" : ""}>${t("options.priceLowToHigh")}</option><option value="hi"${F.sort === "hi" ? " selected" : ""}>${t("options.priceHighToLow")}</option></select>
          <label class="sr" for="f-q">${t("filters.keyword")}</label><input class="fld" id="f-q" data-f="q" value="${esc(F.q)}" placeholder="${t("filters.keyword")}">
          <button class="btn btn-3" data-act="reset">${t("filters.reset")}</button>
        </div>
      </header>
      <div id="results">${listResults()}</div>

      ${about}
      <section class="blk" data-rv><h2 class="h2">${t("politics.questionsAndAnswers")}</h2>
        ${faqList([4, 6, 10].map(cmsFaq))}
        ${sp ? `<div style="margin-top:12px">${space(o(`Questions about ${x(sp.name)}`, `أسئلة عن ${x(sp.name)}`), o("Questions and answers specific to this specialty, added here above the general ones.", "أسئلة وأجوبة خاصة بهذا التخصص تضاف هنا قبل الأسئلة العامة."))}</div>` : ""}</section>
      <section class="blk" data-rv><h2 class="h2">${o("Related", "ذو صلة")}</h2>
        <h3 class="h3" style="margin-bottom:8px">${t("mostPopular.specialties")}</h3><div class="links">${others.map((s) => `<a href="#/doctors/${s.slug}">${x(s.name)}</a>`).join("")}</div>
        <h3 class="h3" style="margin:18px 0 8px">${t("mostPopular.clinics")}</h3><div class="links">${clinicsHere.map((c) => `<a href="#/clinic/${c.key}">${x(c.name)}</a>`).join("")}</div>
        <div style="margin-top:14px">${space(o("Patient guides", "أدلة المرضى"), o("Links to guides written for this page.", "روابط لأدلة مكتوبة لهذه الصفحة."))}</div></section>
    </div>`;
  }

  /* ---------- doctor profile ---------- */
  function doctor(key) {
    const d = docByKey(key);
    if (!d) return notFound();
    const sp = specById(d.specialty), name = x(d.name);
    const svcs = Object.keys(SVC).filter((s) => placesFor(d, s).length);
    const st = S.docSvc && svcs.includes(S.docSvc) ? S.docSvc : svcs[0];
    const places = placesFor(d, st), p = places.find((pl) => pl.clinic === S.docClinic) || places[0], c = clinicByKey(p.clinic), s = nextSlot(p, st);
    const priceLines = d.places.map((pl) => `${x(clinicByKey(pl.clinic).name)}: ${Object.keys(pl.prices).filter((k) => SVC[k]).map((k) => `${svcName(k)} ${pl.prices[k]} ${SAR()}`).join(o(", ", "، "))}`).join(". ");
    const fq = [
      { q: o(`Where does ${name} see patients?`, `أين يستقبل ${name} المرضى؟`), a: d.places.map((pl) => `${x(clinicByKey(pl.clinic).name)} (${x(clinicByKey(pl.clinic).address)})`).join(o("; ", "؛ ")) + "." },
      { q: o(`How much is a visit with ${name}?`, `كم سعر الزيارة مع ${name}؟`), a: priceLines + "." },
      { q: o(`Does ${name} offer telehealth?`, `هل يقدم ${name} استشارات عن بعد؟`), a: svcs.includes("telehealth") ? o(`Yes. You can book a telehealth consultation with ${name} for ${d.places[0].prices.telehealth} SAR.`, `نعم. يمكنك حجز استشارة عن بعد مع ${name} بسعر ${d.places[0].prices.telehealth} ر.س.`) : o("Not at the moment. Clinic visits can be booked online.", "ليس حالياً. يمكن حجز زيارات العيادة إلكترونياً.") },
      { q: o(`When is the next available appointment with ${name}?`, `متى أقرب موعد متاح مع ${name}؟`), a: s ? `${svcName(st)}: ${slotText(s)}.` : "-" },
    ];
    const related = K.doctors.filter((r) => r.key !== d.key && r.places.some((pl) => d.places.some((q) => q.clinic === pl.clinic))).slice(0, 4);
    return `${crumbs([[t("mobileFooter.home"), "#/"], [t("nav.doctorConsultation"), "#/doctors"], [x(sp.name), `#/doctors/${sp.slug}`], [name, null]])}
    <div class="wrap prof has-mbar">
      <div>
        <header class="p prof-h" data-rv>${avatar(d, "av-l")}
          <div class="grow"><h1 class="h1">${name}</h1>
            <p style="font-size:17px;margin-top:4px">${x(d.title)} · <a href="#/doctors/${sp.slug}" style="color:var(--pu);font-weight:500">${x(sp.name)}</a></p>
            <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:10px">${star(d.rating, d.reviews)}${d.choice ? `<span class="choice">${t("consultation.clinicChoice")}</span>` : ""}</div></div>
        </header>
        <section class="blk" data-rv><h2 class="h2">${o("Introduction", "نبذة عن الطبيب")}</h2><div class="prose"><p>${esc(x(d.bio))}</p></div></section>
        <section class="blk" data-rv><h2 class="h2">${t("mostPopular.specialties")}</h2><div class="links"><a href="#/doctors/${sp.slug}">${x(sp.name)}</a></div></section>
        <section class="blk" data-rv><h2 class="h2">${o("Qualifications and experience", "المؤهلات والخبرة")}</h2>
          <div class="grid2">${space(o("Qualifications", "المؤهلات"), o("Degrees, board certificates and licence. Needs a new field on the doctor profile.", "الشهادات والبورد والترخيص. يحتاج حقلاً جديداً في ملف الطبيب."))}${space(o("Experience", "الخبرة"), o("Years of practice and previous posts. Needs a new field on the doctor profile.", "سنوات الممارسة والمناصب السابقة. يحتاج حقلاً جديداً في ملف الطبيب."))}</div></section>
        <section class="blk" data-rv><h2 class="h2">${o("Languages", "اللغات")}</h2>${space(o("Languages spoken", "اللغات التي يتحدثها الطبيب"), o("Needs a new field on the doctor profile.", "يحتاج حقلاً جديداً في ملف الطبيب."))}</section>
        <section class="blk" data-rv><h2 class="h2">${o("Practice locations", "أماكن العمل")}</h2>
          ${d.places.map((pl) => { const cl = clinicByKey(pl.clinic); return `<div class="p place" style="margin-top:10px"><span class="pin">${ic("pin")}</span><div class="grow"><h3 class="h3"><a href="#/clinic/${cl.key}">${x(cl.name)}</a></h3><p class="sm">${x(cl.address)}</p>
            <p class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">${Object.keys(pl.prices).filter((k) => SVC[k]).map((k) => `<span class="chip chip-pu">${ic(SVC[k][1])}${svcName(k)} · ${pl.prices[k]} ${SAR()}</span>`).join("")}</p></div>
            <a class="btn btn-3" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${cl.lat},${cl.lng}">${t("profile.openMap")}</a></div>`; }).join("")}</section>
        <section class="blk" data-rv><h2 class="h2">${t("politics.questionsAndAnswers")}</h2>${faqList(fq)}</section>
        ${related.length ? `<section class="blk" data-rv><h2 class="h2">${o("Other doctors at the same clinic", "أطباء آخرون في العيادة نفسها")}</h2><div class="grid2">${related.map((r) => `<a class="p prow" href="#/doctor/${r.key}">${avatar(r)}<span class="grow"><b>${x(r.name)}</b><span class="sm">${x(specById(r.specialty).name)}</span></span>${ic("go", "arr")}</a>`).join("")}</div></section>` : ""}
      </div>
      <aside class="p bookbox" data-rv aria-label="${t("appointment.bookAnAppointment")}">
        <h2 class="h3" style="font-size:20px">${t("appointment.bookAnAppointment")}</h2>
        ${svcs.length > 1 ? seg("docsvc", svcs.map((k) => [k, t("servicTypes." + { clinic_visit: "atClinic", telehealth: "telehealth", home_visit: "atHome" }[k]), SVC[k][1]]), st, "", "radio") : `<span class="chip chip-pu" style="align-self:flex-start">${ic(SVC[st][1])}${svcName(st)}</span>`}
        ${places.length > 1 ? `<div><p class="sm">${t("doctorProfile.pleaseSelectOneThatSuitsYouBest")}</p>${places.map((pl) => `<label class="p opt" style="margin-top:8px;padding:10px 14px"><input type="radio" name="dc" value="${pl.clinic}" data-docclinic${pl.clinic === p.clinic ? " checked" : ""}><span class="grow">${x(clinicByKey(pl.clinic).name)}</span><b>${pl.prices[st]} ${SAR()}</b></label>`).join("")}</div>` : `<p class="kv"><span>${x(c.name)}</span></p>`}
        <p class="kv"><span>${o("Next available", "أقرب موعد")}</span>${s ? `<span class="chip chip-gr">${ic("clock")}${slotText(s)}</span>` : "-"}</p>
        <p class="kv"><span>${t("profile.serviceCoast")}</span><span class="price">${money(p.prices[st])}</span></p>
        <a class="btn btn-1 btn-w" href="#/book/${d.key}" data-book="${d.key}|${p.clinic}|${st}">${t("doctorProfile.bookVisit")}${ic("go", "go")}</a>
      </aside>
    </div>
    <div class="mbar"><span class="grow"><span class="price">${money(p.prices[st])}</span>${s ? `<br><span class="sm" style="color:var(--gr);font-weight:500">${slotText(s)}</span>` : ""}</span><a class="btn btn-1" href="#/book/${d.key}" data-book="${d.key}|${p.clinic}|${st}">${t("doctorProfile.bookVisit")}</a></div>`;
  }

  /* ---------- clinic profile ---------- */
  const SVC_ALL = { telehealth: ["visits.tele", "modern_telehealth.svg"], clinic_visit: ["visits.clinic", "modern_clinic_visit.svg"], home_visit: ["visits.home", "modern_home_visit.svg"],
    physical_therapy_clinic_visit: ["visits.physicalTherapy", "modern_physical_therapy.svg"], physical_therapy_home_visit: ["visits.physicalTherapy", "modern_physical_therapy.svg"],
    laboratory_clinic_visit: ["visits.labTests", "modern_laboratory.svg"], laboratory_home_visit: ["visits.labTests", "modern_laboratory.svg"], nursing: ["visits.nursing", "modern_nursing.svg"] };
  function clinic(key) {
    const c = clinicByKey(key);
    if (!c) return notFound();
    const name = x(c.name), docs = docsOfClinic(c.key), specs = [...new Set(docs.map((d) => d.specialty))].map(specById);
    const svcList = [...new Map(c.services.map((s) => [SVC_ALL[s][0] + (s.includes("home") ? "h" : "c"), s])).values()];
    const svcLabel = (s) => t(SVC_ALL[s][0]) + (/^(physical|laboratory)/.test(s) ? ` · ${t(s.includes("home") ? "servicTypes.atHome" : "servicTypes.atClinic")}` : "");
    const now = new Date(), today = WD[now.getDay()], h = c.hours[today], open = h && now.getHours() >= h[0] && now.getHours() < h[1];
    const hoursText = WD.map((w, i) => `${weekday(i)}: ${c.hours[w] ? `${fmtHour(c.hours[w][0])} - ${fmtHour(c.hours[w][1])}` : o("closed", "مغلق")}`).join(o("; ", "؛ "));
    const fq = [
      { q: o(`What services does ${name} offer?`, `ما الخدمات التي يقدمها ${name}؟`), a: svcList.map(svcLabel).join(o(", ", "، ")) + "." },
      { q: o(`What are the opening hours of ${name}?`, `ما أوقات عمل ${name}؟`), a: hoursText + "." },
      { q: o(`Where is ${name}?`, `أين يقع ${name}؟`), a: x(c.address) + "." },
    ].concat(specs.length ? [{ q: o(`Which specialties are available at ${name}?`, `ما التخصصات المتوفرة في ${name}؟`), a: specs.map((s) => x(s.name)).join(o(", ", "، ")) + "." }] : []);
    return `${crumbs([[t("mobileFooter.home"), "#/"], [t("mostPopular.clinics"), "#/"], [name, null]])}
    <div class="wrap prof">
      <div>
        <header class="p prof-h" data-rv>${clinicMark(c, "av-l")}
          <div class="grow"><h1 class="h1">${name}</h1><p class="row sm" style="font-size:16px;margin-top:6px;gap:6px">${ic("pin")}${x(c.address)}</p>
            <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:10px">${star(c.rating, c.reviews)}${c.choice ? `<span class="choice">${t("consultation.clinicChoice")}</span>` : ""}<span class="chip ${open ? "chip-gr" : "chip-mu"}"><span class="dot${open ? " live" : ""}"></span>${open ? o("Open now", "مفتوح الآن") : o("Closed now", "مغلق الآن")}</span></div></div>
        </header>
        <section class="blk" data-rv><h2 class="h2">${t("clinicProfile.about")} ${name}</h2><div class="prose"><p>${esc(x(c.description))}</p></div></section>
        <section class="blk" data-rv><h2 class="h2">${t("consultation.services")}</h2><div class="grid3">${svcList.map((s) => `<div class="p prow">${mk(SVC_ALL[s][1])}<b class="grow" style="font-size:15.5px">${svcLabel(s)}</b></div>`).join("")}</div></section>
        ${specs.length ? `<section class="blk" data-rv><h2 class="h2">${t("mostPopular.specialties")}</h2><div class="links">${specs.map((s) => `<a href="#/doctors/${s.slug}">${x(s.name)}</a>`).join("")}</div></section>` : ""}
        ${docs.length ? `<section class="blk" data-rv><h2 class="h2">${t("consultation.docs")}</h2><div class="grid2">${docs.map((d) => { const pl = d.places.find((q) => q.clinic === c.key), sv = Object.keys(pl.prices).find((k) => SVC[k]), s = nextSlot(pl, sv);
          return `<a class="p prow" href="#/doctor/${d.key}">${avatar(d)}<span class="grow"><b>${x(d.name)}</b><span class="sm">${x(specById(d.specialty).name)}</span>${s ? `<br><span class="chip chip-gr" style="margin-top:5px;height:24px;font-size:12.5px">${ic("clock")}${slotText(s)}</span>` : ""}</span>${ic("go", "arr")}</a>`; }).join("")}</div></section>` : ""}
        <section class="blk" data-rv><h2 class="h2">${o("Visiting information", "معلومات الزيارة")}</h2>
          <div class="grid3">${["rescheduling", "cancellation", "no_show"].map((k) => space(t("reschedulePolicy." + k), o("Set by the clinic in its policy settings and shown here in full.", "تحددها العيادة في إعدادات السياسات وتظهر هنا كاملة."))).join("")}</div>
          <div style="margin-top:12px">${space(o("Getting here", "الوصول إلى العيادة"), o("Parking, entrance and what to bring. Written by the clinic.", "المواقف والمدخل وما يجب إحضاره. تكتبها العيادة."))}</div></section>
        <section class="blk" data-rv><h2 class="h2">${t("politics.questionsAndAnswers")}</h2>${faqList(fq)}</section>
        <section class="blk" data-rv><h2 class="h2">${o("Related", "ذو صلة")}</h2><div class="links">${K.clinics.filter((r) => r.key !== c.key).map((r) => `<a href="#/clinic/${r.key}">${x(r.name)}</a>`).join("")}</div></section>
      </div>
      <aside class="bookbox p" data-rv>
        <h2 class="h3" style="font-size:20px">${t("clinicProfile.location")}</h2>
        <div class="map" aria-hidden="true">${ic("pin")}</div>
        <p>${x(c.address)}</p>
        <a class="btn btn-2 btn-w" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${c.lat},${c.lng}">${ic("pin")}${t("profile.openMap")}</a>
        <h2 class="h3" style="font-size:20px;margin-top:8px">${o("Opening hours", "أوقات العمل")}</h2>
        <table class="hours">${WD.map((w, i) => `<tr${w === today ? ' class="today"' : ""}><td>${weekday(i)}</td><td>${c.hours[w] ? `${fmtHour(c.hours[w][0])} - ${fmtHour(c.hours[w][1])}` : o("Closed", "مغلق")}</td></tr>`).join("")}</table>
        ${docs.length ? `<a class="btn btn-1 btn-w" href="#/doctors">${t("doctorProfile.bookVisit")}${ic("go", "go")}</a>` : ""}
      </aside>
    </div>`;
  }

  /* ---------- booking ---------- */
  function startBooking(key, clinicKey, svc) {
    const d = docByKey(key), place = d.places.find((p) => p.clinic === clinicKey) || d.places[0];
    const sv = place.prices[svc] != null ? svc : Object.keys(place.prices).find((k) => SVC[k]);
    const s = nextSlot(place, sv);
    S.B = { doc: d, place, svc: sv, dayIn: s ? s.in : 0, hour: s ? s.hour : null, step: 1, pay: "online", wallet: false };
  }
  function bookSteps(at) {
    const names = [t("appointment.step1", { count: "" }), t("appointment.step3", { count: "" }), t("appointment.step4", { count: "" })].map((s) => s.replace(/^[^:：]*[:：]\s*/, ""));
    return `<ol class="steps">${names.map((n, i) => `<li class="${i + 1 === at ? "on" : i + 1 < at ? "done" : ""}"><span class="n">${i + 1 < at ? ic("check") : i + 1}</span>${n}</li>${i < 2 ? '<li class="bar" aria-hidden="true"></li>' : ""}`).join("")}</ol>`;
  }
  function bookSummary(B) {
    const c = clinicByKey(B.place.clinic), sp = specById(B.doc.specialty);
    return `<div class="row" style="align-items:flex-start">${avatar(B.doc)}<div class="grow"><b style="font-size:18px;display:block">${x(B.doc.name)}</b><span class="sm">${x(B.doc.title)} · ${x(sp.name)}</span></div></div>
      <p class="kv" style="margin-top:14px"><span class="row" style="gap:8px">${ic(SVC[B.svc][1])}${svcName(B.svc)}</span><span>${x(c.name)}</span></p>
      ${B.hour != null ? `<p class="kv" style="margin-top:8px"><span class="row" style="gap:8px">${ic("cal")}${fmtDay(addDays(B.dayIn), { weekday: "long", day: "numeric", month: "long" })}</span><b>${fmtHour(B.hour)}</b></p>` : ""}`;
  }
  function book(key) {
    if (!S.B || S.B.doc.key !== key) { const d = docByKey(key); if (!d) return notFound(); startBooking(key, d.places[0].clinic, "clinic_visit"); }
    const B = S.B, price = B.place.prices[B.svc], used = B.wallet ? Math.min(K.wallet, price) : 0, due = price - used;
    let body;
    if (B.step === 1) {
      const svcs = Object.keys(B.place.prices).filter((k) => SVC[k]);
      const days = [...Array(7)].map((_, i) => ({ i, d: addDays(i), hs: slotsFor(B.place, B.svc, addDays(i)) }));
      const hs = days.find((d) => d.i === B.dayIn) ? slotsFor(B.place, B.svc, addDays(B.dayIn)) : [];
      const groups = [["appointmentDays.morning", hs.filter((h) => h < 12)], ["appointmentDays.afternoon", hs.filter((h) => h >= 12 && h < 18)], ["appointmentDays.night", hs.filter((h) => h >= 18)]].filter((g) => g[1].length);
      body = `<div class="book"><div>
          ${svcs.length > 1 ? `<div style="margin-bottom:18px">${seg("bsvc", svcs.map((k) => [k, t("servicTypes." + { clinic_visit: "atClinic", telehealth: "telehealth", home_visit: "atHome" }[k]), SVC[k][1]]), B.svc, "", "radio")}</div>` : ""}
          <h2 class="h3" style="margin-bottom:10px">${t("doctorProfile.selectDate")}</h2>
          <div class="days">${days.map((d) => `<button class="day" type="button" data-day="${d.i}" aria-pressed="${d.i === B.dayIn}"${d.hs.length ? "" : " disabled"}><span>${fmtDay(d.d, { weekday: "short" })}</span><b>${d.d.getDate()}</b><span>${fmtDay(d.d, { month: "short" })}</span></button>`).join("")}</div>
          <div class="tabp" id="slots">${groups.length ? groups.map(([k, list]) => `<p class="sm" style="margin:18px 0 8px;font-weight:500">${t(k)}</p><div class="slots">${list.map((h) => `<button class="slot" type="button" data-hour="${h}" aria-pressed="${h === B.hour}">${fmtHour(h)}</button>`).join("")}</div>`).join("") : `<p class="sm" style="margin-top:18px">${o("No times on this day", "لا توجد أوقات في هذا اليوم")}</p>`}</div>
        </div>
        <aside class="p bookbox">${bookSummary(B)}<p class="kv"><span>${t("profile.serviceCoast")}</span><span class="price">${money(price)}</span></p>
          <button class="btn btn-1 btn-w" data-act="to-pay"${B.hour == null ? " disabled" : ""}>${t("form.proceed")}${ic("go", "go")}</button></aside></div>`;
    } else if (B.step === 2) {
      body = `<div class="book"><div>
          <h2 class="h3" style="margin-bottom:10px">${t("appointmentPayment.availablePaymentMethods")}</h2>
          <label class="p opt"><input type="radio" name="pay" value="online" data-pay${B.pay === "online" ? " checked" : ""}><span class="grow"><b style="display:block">${t("appointmentPayment.onlinePayment")}</b><span class="sm">mada, Visa, Mastercard</span></span>${ic("card")}</label>
          <label class="p opt" style="margin-top:8px"><input type="radio" name="pay" value="apple" data-pay${B.pay === "apple" ? " checked" : ""}><b class="grow">Apple Pay</b></label>
          <label class="p opt" style="margin-top:8px;align-items:flex-start"><input type="checkbox" data-wallet${B.wallet ? " checked" : ""} style="margin-top:3px"><span class="grow"><b style="display:block">${t("wallet.title")}</b><span class="sm">${t("wallet.currentBalance")}: ${K.wallet} ${SAR()}</span>
            ${B.wallet ? `<span class="kv tabp" style="margin-top:8px"><span>${t("wallet.amountToUse")}</span><b>${used} ${SAR()}</b></span><span class="kv tabp"><span>${t("wallet.remainingToPay")}</span><b>${due} ${SAR()}</b></span>` : ""}</span>${ic("wallet")}</label>
          <label for="cp" class="h3" style="display:block;margin:22px 0 8px">${t("appointment.discountCoupon")}</label>
          <input class="fld" id="cp" placeholder="${t("appointment.couponCode")}" style="width:min(320px,100%)">
        </div>
        <aside class="p bookbox">${bookSummary(B)}
          <div class="total"><b>${t("profile.total")}</b><span class="price">${money(due)}</span></div>
          <button class="btn btn-1 btn-w" data-act="pay" style="margin-top:22px;height:54px;font-size:17px">${t("profile.payNow")} · ${due} ${SAR()}</button>
          ${B.svc === "clinic_visit" && !B.visitId ? `<button class="btn btn-2 btn-w" data-act="pay-clinic">${ic("clinic")}${t("appointmentPayment.payAtClinic")}</button>` : ""}
          <button class="btn btn-3" data-act="to-time" style="align-self:center">${t("doctorProfile.selectDate")}</button></aside></div>`;
    } else {
      body = `<div class="p" style="text-align:center;padding:44px 20px;max-width:680px;margin-inline:auto"><span class="okmark">${ic("check")}</span>
        <h2 class="h2" style="margin-top:16px">${t("booked.title")} ${t("booked.success")}</h2>
        <div style="max-width:420px;margin:18px auto;text-align:start">${bookSummary(B)}<p class="kv" style="margin-top:8px"><span>${t("profile.status")}</span><span class="chip ${B.paid ? "chip-gr" : "chip-am"}">${B.paid ? t("profile.paid") : t("profile.notPaid")}</span></p></div>
        <p class="sm" style="max-width:520px;margin:0 auto 20px">${t("booked.info")}</p>
        <a class="btn btn-1" href="#/visits">${t("booked.viewMyVisits")}${ic("go", "go")}</a></div>`;
    }
    return `${crumbs([[t("mobileFooter.home"), "#/"], [x(B.doc.name), `#/doctor/${B.doc.key}`], [t("appointment.bookAnAppointment"), null]])}
      <div class="wrap"><h1 class="h1" style="font-size:clamp(26px,3.4vw,38px)">${t("appointment.bookAnAppointment")}</h1>${bookSteps(B.step)}<div id="bookbody" class="tabp">${body}</div></div>`;
  }
  function finishBooking(paid) {
    const B = S.B;
    if (B.visitId) { S.visits.find((v) => v.id === B.visitId).paid = true; }
    else S.visits.push({ id: Date.now(), doc: B.doc, place: B.place, svc: B.svc, day: addDays(B.dayIn), hour: B.hour, paid, price: B.place.prices[B.svc] });
    B.paid = paid || !!B.visitId; B.step = 3;
  }

  /* ---------- visits ---------- */
  function callIn(v) {
    const at = new Date(v.day.getFullYear(), v.day.getMonth(), v.day.getDate(), v.hour), mins = Math.round((at - new Date()) / 6e4);
    if (mins < 60) return t("profileAppointmentCard.callStartingSoon");
    const hrs = Math.round(mins / 60);
    return hrs < 48 ? tn("profileAppointmentCard.callInHours", hrs) : tn("profileAppointmentCard.callInDays", Math.round(hrs / 24));
  }
  function visitCard(v, i) {
    const c = clinicByKey(v.place.clinic), sp = specById(v.doc.specialty), tele = v.svc === "telehealth";
    const [hh, ap] = fmtHour(v.hour).split(" ");
    let acts = "";
    if (v.past) acts = `<button class="btn btn-2 btn-s">${t("profile.feedback")}</button>`;
    else if (!v.paid) acts = `<a class="btn btn-1" href="#/book/${v.doc.key}" data-payvisit="${v.id}">${t("profile.payNow")} · ${v.price} ${SAR()}</a>${!tele ? `<a class="btn btn-3" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${c.lat},${c.lng}">${ic("pin")}${t("profile.openMap")}</a>` : ""}`;
    else if (tele) acts = `<button class="btn btn-1 btn-s" disabled>${ic("video")}${t("profile.joinToVideoCall")}</button><span class="sm">${callIn(v)}</span>`;
    else acts = `<a class="btn btn-2 btn-s" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${c.lat},${c.lng}">${ic("pin")}${t("profile.openMap")}</a>`;
    return `<article class="p visit ${!v.paid && !v.past ? "due" : ""}" data-rv style="--d:${Math.min(i, 4)}">
      <div class="when"><b>${hh}</b><span class="sm">${ap}</span></div>
      <div class="grow"><div class="row" style="flex-wrap:wrap;gap:8px">${v.paid ? `<span class="chip chip-gr"><span class="dot"></span>${t("profile.paid")}</span>` : `<span class="chip chip-am"><span class="dot live"></span>${t("profile.pendingPayment")}</span>`}<span class="chip chip-pu">${ic(SVC[v.svc][1])}${svcName(v.svc)}</span></div>
        <h3 class="h3" style="margin-top:8px"><a href="#/doctor/${v.doc.key}">${x(v.doc.name)}</a></h3><p class="sm">${x(sp.name)} · ${x(c.name)}${tele ? "" : `, ${x(c.address)}`}</p>
        <div class="acts">${acts}</div></div></article>`;
  }
  function visitsPanel() {
    const list = S.visits.filter((v) => !!v.past === (S.vTab === "past")).sort((a, b) => (a.day - b.day || a.hour - b.hour) * (S.vTab === "past" ? -1 : 1));
    let out = "", last = "";
    list.forEach((v, i) => { const dw = dayWord(v.day) + (/\d/.test(dayWord(v.day)) ? "" : ` · ${fmtDay(v.day)}`); if (dw !== last) { out += `<p class="dayh" data-rv>${dw}</p>`; last = dw; } out += visitCard(v, i); });
    return `<div class="tabp">${out}</div>`;
  }
  function visits() {
    const due = S.visits.filter((v) => !v.paid && !v.past).length;
    return `${crumbs([[t("mobileFooter.home"), "#/"], [t("mobileFooter.visits"), null]])}
      <div class="wrap" style="max-width:860px"><div class="sec-h" style="margin-top:6px"><h1 class="h1 grow" style="font-size:clamp(28px,3.6vw,42px)">${t("mobileFooter.visits")}</h1>
        ${seg("vtab", [["up", t("profileAppointments.upcoming")], ["past", t("profileAppointments.past")]], S.vTab)}</div>
        ${due && S.vTab === "up" ? `<p class="row" style="gap:8px" data-rv><span class="chip chip-am"><span class="dot live"></span>${t("profile.pendingPayment")}: ${due}</span></p>` : ""}
        <div id="vlist">${visitsPanel()}</div></div>`;
  }
  const notFound = () => `<div class="wrap" style="padding:80px 0;text-align:center"><h1 class="h1">404</h1><p style="margin-top:14px"><a class="btn btn-1" href="#/">${t("mobileFooter.home")}</a></p></div>`;

  /* ---------- instant consultation dialog ---------- */
  function instantDialog() {
    let dlg = document.getElementById("dlg");
    if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "dlg"; document.body.appendChild(dlg); dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); }
    dlg.innerHTML = `<form class="dlg" method="dialog"><div class="row"><h2 class="h2" style="font-size:25px">${t("uberConsultation.instantConsultation")}</h2><button class="x" value="x" aria-label="${t("uberConsultation.close")}">${ic("x")}</button></div>
      <label for="pr">${t("uberConsultation.describeProblem")}</label><textarea id="pr" required></textarea>
      <div class="row" style="flex-wrap:wrap"><span class="btn btn-2 btn-s">${ic("mic")}${t("uberConsultation.recordAudio")}</span><span class="btn btn-2 btn-s">${ic("clip")}${t("uberConsultation.attachFiles")}</span></div>
      <button class="btn btn-1 btn-w" type="button" data-act="order" style="height:54px;font-size:17px">${t("uberConsultation.orderConsultation")}</button></form>`;
    dlg.showModal();
  }

  /* ---------- render and routing ---------- */
  let pendingGoto = null;
  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("?")[0].split("/").filter(Boolean);
    const [r, a] = parts;
    if (!r) return ["home", home()];
    if (r === "doctors") return ["doctors", doctors(a)];
    if (r === "doctor") return ["doctors", doctor(a)];
    if (r === "clinic") return ["clinic", clinic(a)];
    if (r === "book") return ["doctors", book(a)];
    if (r === "visits") return ["visits", visits()];
    return ["-", notFound()];
  }
  function render(keepScroll) {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    const [name, html] = route();
    app.innerHTML = `${header(name)}<main id="main">${html}</main>${footer()}${bottomNav(name)}`;
    document.title = (app.querySelector("h1") ? app.querySelector("h1").textContent.trim() + " | " : "") + "Klinika";
    if (!keepScroll) window.scrollTo(0, 0);
    after();
    if (pendingGoto) { const el = document.getElementById(pendingGoto); pendingGoto = null; if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 60); }
  }
  let io;
  function after(root) {
    root = root || app;
    placeSegs();
    if (!("IntersectionObserver" in window)) { root.querySelectorAll("[data-rv]").forEach((e) => e.classList.add("in")); return; }
    if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    root.querySelectorAll("[data-rv]:not(.in)").forEach((e) => io.observe(e));
  }
  function placeSegs() {
    document.querySelectorAll(".seg").forEach((s) => {
      const on = s.querySelector('[aria-selected="true"],[aria-checked="true"]'), m = s.querySelector("i");
      if (on && m) { m.style.width = on.offsetWidth + "px"; m.style.transform = `translateX(${on.offsetLeft}px)`; }
    });
  }
  function swap(id, html) { const el = document.getElementById(id); if (el) { el.innerHTML = html; el.classList.add("in"); after(el); } }
  const SEGS = {
    pop(v) { S.popTab = v; swap("pop", popPanel()); },
    svc(v) { S.F.svc = v; swap("results", listResults()); },
    vtab(v) { S.vTab = v; render(true); },
    docsvc(v) { S.docSvc = v; render(true); },
    bsvc(v) { const B = S.B; B.svc = v; const s = nextSlot(B.place, v); B.dayIn = s ? s.in : 0; B.hour = s ? s.hour : null; render(true); },
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-lang],[data-act],[data-seg] button,[data-goto],[data-pop],[data-book],[data-payvisit],[data-day],[data-hour],[data-more]");
    if (!el) { const s = document.querySelector(".search.open"); if (s && !e.target.closest(".search")) s.classList.remove("open"); return; }
    if (el.matches("[data-lang]")) { lang = lang === "ar" ? "en" : "ar"; store.set("k5lang", lang); render(true); return; }
    if (el.matches("[data-seg] button")) {
      const s = el.closest("[data-seg]"), attr = el.hasAttribute("aria-checked") ? "aria-checked" : "aria-selected";
      s.querySelectorAll("button").forEach((b) => b.setAttribute(attr, b === el)); placeSegs();
      const fn = SEGS[s.dataset.seg]; setTimeout(() => fn(el.dataset.v), ["vtab", "docsvc", "bsvc"].includes(s.dataset.seg) ? 240 : 0); return;
    }
    if (el.matches("[data-goto]")) { const id = el.dataset.goto; if (location.hash.replace(/^#\/?/, "") === "") { e.preventDefault(); document.getElementById(id).scrollIntoView({ block: "start" }); } else pendingGoto = id; return; }
    if (el.matches("[data-pop]")) { e.preventDefault(); S.popTab = el.dataset.pop; render(true); document.getElementById("popular").scrollIntoView({ block: "start" }); return; }
    if (el.matches("[data-book]")) { const [k, c, s] = el.dataset.book.split("|"); startBooking(k, c, s); if (location.hash === `#/book/${k}`) { e.preventDefault(); render(); } return; }
    if (el.matches("[data-payvisit]")) { const v = S.visits.find((q) => q.id === +el.dataset.payvisit); S.B = { doc: v.doc, place: v.place, svc: v.svc, dayIn: Math.round((v.day - addDays(0)) / 864e5), hour: v.hour, step: 2, pay: "online", wallet: false, visitId: v.id }; return; }
    if (el.matches("[data-day]")) { const B = S.B; B.dayIn = +el.dataset.day; const hs = slotsFor(B.place, B.svc, addDays(B.dayIn)); B.hour = hs.includes(B.hour) ? B.hour : null; render(true); return; }
    if (el.matches("[data-hour]")) { S.B.hour = +el.dataset.hour; document.querySelectorAll(".slot").forEach((b) => b.setAttribute("aria-pressed", b === el)); const b = document.querySelector('[data-act="to-pay"]'); if (b) b.disabled = false;
      const kv = document.querySelector(".bookbox"); if (kv) { render(true); } return; }
    if (el.matches("[data-more]")) { const ids = el.dataset.more.split(","); const open = !document.getElementById(ids[0]).classList.contains("open"); ids.forEach((id) => { const p = document.getElementById(id); p.classList.toggle("open", open); if (p.hasAttribute("hidden") || p.dataset.h) { p.dataset.h = 1; p.hidden = !open; } }); el.textContent = open ? t("doctorProfile.readLess") : t("clinicProfile.readMore"); return; }
    const act = el.dataset.act;
    if (act === "instant") return instantDialog();
    if (act === "order") { const f = el.closest("form"); if (!f.querySelector("textarea").value.trim()) { f.querySelector("textarea").focus(); return; }
      f.innerHTML = `<div style="text-align:center;padding:26px 6px"><span class="dots"><i></i><i></i><i></i></span><h2 class="h2" style="font-size:24px;margin-top:16px">${t("uberConsultation.requestPlaced")}</h2><p style="margin-top:6px">${t("uberConsultation.studying")} ${t("uberConsultation.appointSoon")}</p><button class="btn btn-2" style="margin-top:20px" value="x">${t("uberConsultation.close")}</button></div>`; return; }
    if (act === "faq-all") { S.faqAll = true; swap("faqbox", homeFaq()); return; }
    if (act === "reset") { S.F = { svc: "clinic_visit", spec: "", gender: "any", sort: "", q: "", rating: 0 }; if (location.hash !== "#/doctors") location.hash = "#/doctors"; else render(true); return; }
    if (act === "to-pay") { S.B.step = 2; render(); return; }
    if (act === "to-time") { if (S.B.visitId) { location.hash = "#/visits"; return; } S.B.step = 1; render(); return; }
    if (act === "pay") { finishBooking(true); render(); return; }
    if (act === "pay-clinic") { finishBooking(false); render(); return; }
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.matches("[data-region]")) { S.region = +el.value; return; }
    if (el.matches("[data-f]")) { const k = el.dataset.f; if (k === "spec") { location.hash = el.value ? `#/doctors/${el.value}` : "#/doctors"; return; } S.F[k] = k === "rating" ? +el.value : el.value; swap("results", listResults()); return; }
    if (el.matches("[data-docclinic]")) { S.docClinic = el.value; render(true); return; }
    if (el.matches("[data-pay]")) { S.B.pay = el.value; return; }
    if (el.matches("[data-wallet]")) { S.B.wallet = el.checked; render(true); return; }
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.matches('[data-f="q"]')) { S.F.q = el.value; swap("results", listResults()); return; }
    if (el.id === "q") suggest(el);
  });
  document.addEventListener("focusin", (e) => { if (e.target.id === "q") suggest(e.target); });
  function suggest(input) {
    const q = input.value.trim().toLowerCase(), box = document.getElementById("sugg");
    const list = K.specialties.filter((s) => docsOfSpec(s.id).length && (!q || s.name.en.toLowerCase().includes(q) || s.name.ar.includes(q))).slice(0, 5);
    box.innerHTML = list.map((s) => `<a href="#/doctors/${s.slug}">${specIcon(s)}<span>${x(s.name)}</span></a>`).join("");
    input.closest(".search").classList.toggle("open", list.length > 0);
  }
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-search]");
    if (!f) return;
    e.preventDefault(); S.F.q = f.q.value.trim(); location.hash = "#/doctors";
  });
  window.addEventListener("hashchange", () => render());
  window.addEventListener("resize", placeSegs);
  window.addEventListener("scroll", () => { const h = document.querySelector(".top"); if (h) h.classList.toggle("stuck", window.scrollY > 8); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeSegs);

  // the doctor leans and turns his head towards the pointer (desktop only, off when reduced motion is asked for)
  if (window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) {
    let raf = 0;
    window.addEventListener("mousemove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vd = document.querySelector(".rig"); if (!vd) return;
        const r = vd.getBoundingClientRect(), cx = r.left + r.width * 0.57, cy = r.top + r.height * 0.3;
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 520)) * (lang === "ar" ? -1 : 1), dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 380));
        vd.style.setProperty("--lx", dx.toFixed(3)); vd.style.setProperty("--ly", dy.toFixed(3));
      });
    }, { passive: true });
  }
  S.visits = seedVisits();
  render();
})();
