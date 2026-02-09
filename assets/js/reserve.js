// assets/js/reserve.js
(function () {
  const VAT = 0.19;

  // Prices (HT)
  const PRICE_STANDARD = 14500; // DZD/m²
  const PRICE_CUSTOM = 12500;   // DZD/m²

  // Options (HT)
  const OPT = {
    vip: 45000,
    backoffice: 55000,
    posterled: 100000,
    wall2: 350000,
    wall6: 750000,
    hostess_day_person: 5500
  };

  // ✅ 16 m² supprimé
  const PRESET_AREAS = [9, 12, 24, 36, 48];

  const $ = (s) => document.querySelector(s);

  const money = (n) => {
    n = Math.round(Number(n) || 0);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " DZD";
  };

  function getLang() {
    return (document.documentElement.lang || "fr").toLowerCase();
  }

  function getPdfPath() {
    const lang = getLang();
   if (lang === "en") return "/pdf/IAEXPO2026_Reservation_Stand_EN_Interactive.pdf";
if (lang === "ar") return "/pdf/IAEXPO2026_Reservation_Stand_AR_Interactive.pdf";
return "/pdf/IAEXPO2026_Reservation_Stand_FR_Interactive.pdf";
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function toggle(el, show) {
    if (!el) return;
    el.classList.toggle("hidden", !show);
  }

  function syncAreasUI() {
    const type = $("#stand_type")?.value || "standard";
    const presetWrap = $("#areaPresetWrap");
    const customWrap = $("#areaCustomWrap");

    toggle(presetWrap, type === "standard");
    toggle(customWrap, type === "custom");

    // Fill preset select (only once)
    const presetSelect = $("#stand_area_preset");
    if (presetSelect && presetSelect.options.length <= 1) {
      PRESET_AREAS.forEach((a) => {
        const opt = document.createElement("option");
        opt.value = String(a);
        opt.textContent = `${a} m²`;
        presetSelect.appendChild(opt);
      });
    }
  }

  function readArea() {
    const type = $("#stand_type")?.value || "standard";
    if (type === "standard") return Number($("#stand_area_preset")?.value || 0);

    // custom: 50–800
    let a = Number($("#stand_area_custom")?.value || 0);
    if (a < 50) a = 50;
    if (a > 800) a = 800;
    return a;
  }

  function readPosition() {
    // standard / angle / ilot
    return $("#stand_position")?.value || "standard";
  }

  function calc() {
    const type = $("#stand_type")?.value || "standard";
    const position = readPosition();
    const area = readArea();

    const pricePerM2 = type === "custom" ? PRICE_CUSTOM : PRICE_STANDARD;
    const standHT = area * pricePerM2;

    // Options
    const vip = $("#opt_vip")?.checked ? OPT.vip : 0;
    const backoffice = $("#opt_backoffice")?.checked ? OPT.backoffice : 0;
    const posterled = $("#opt_posterled")?.checked ? OPT.posterled : 0;
    const wall2 = $("#opt_wall2")?.checked ? OPT.wall2 : 0;
    const wall6 = $("#opt_wall6")?.checked ? OPT.wall6 : 0;

    const hostessChecked = !!$("#opt_hostess")?.checked;
    const hostessPersons = Number($("#hostess_persons")?.value || 0);
    const hostessDays = Number($("#hostess_days")?.value || 0);
    const hostessTotal = hostessChecked
      ? (hostessPersons * hostessDays * OPT.hostess_day_person)
      : 0;

    const optionsHT = vip + backoffice + posterled + wall2 + wall6 + hostessTotal;

    const totalHT = standHT + optionsHT;
    const tva = totalHT * VAT;
    const totalTTC = totalHT + tva;

    // Labels options
    const opts = [];
    if (vip) opts.push(`Salon VIP (${money(OPT.vip)})`);
    if (backoffice) opts.push(`Back office (${money(OPT.backoffice)})`);
    if (posterled) opts.push(`Poster LED (${money(OPT.posterled)})`);
    if (wall2) opts.push(`Mur LED 2 m² (${money(OPT.wall2)})`);
    if (wall6) opts.push(`Mur LED 6 m² (${money(OPT.wall6)})`);
    if (hostessChecked) {
      opts.push(
        `Hôtesses (${hostessPersons} pers × ${hostessDays} jours × 5 500 = ${money(hostessTotal)})`
      );
    }

    // Recap UI
    setText("sum_type", type === "standard" ? "Stand standard" : "Stand sur mesure (50–800 m²)");
    setText("sum_position", position === "angle" ? "Angle" : position === "ilot" ? "Îlot" : "Standard");
    setText("sum_area", area ? `${area} m²` : "—");
    setText("sum_price", money(pricePerM2) + " / m²");
    setText("sum_stand_ht", money(standHT));
    setText("sum_opts", opts.length ? opts.join(" • ") : "Aucune");
    setText("sum_opts_ht", money(optionsHT));
    setText("sum_ht", money(totalHT));
    setText("sum_tva", money(tva));
    setText("sum_ttc", money(totalTTC));

    toggle($("#hostessWrap"), hostessChecked);

    return {
      type, position, area, pricePerM2,
      standHT, optionsHT, totalHT, tva, totalTTC,
      optsText: opts.join("\n"),
      hostessChecked, hostessPersons, hostessDays, hostessTotal
    };
  }

  // --- Load PDF-Lib if missing (safe) ---
  async function ensurePdfLib() {
    if (window.PDFLib) return;

    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

    if (!window.PDFLib) throw new Error("PDFLib not loaded");
  }

  function val(id) {
    return (document.getElementById(id)?.value || "").trim();
  }

  // Helpers “safe”
  function safeText(form, name, value) {
    try {
      form.getTextField(name).setText(String(value ?? ""));
    } catch (_) {}
  }
  function safeCheck(form, name, on) {
    try {
      const f = form.getCheckBox(name);
      if (on) f.check();
      else f.uncheck();
    } catch (_) {}
  }

  async function downloadPrefilled() {
    await ensurePdfLib();
    const data = calc();

    const pdfUrl = getPdfPath();
    const r = await fetch(pdfUrl);
    if (!r.ok) throw new Error("PDF introuvable: " + pdfUrl);
    const existingPdfBytes = await r.arrayBuffer();

    const { PDFDocument } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    // ---- Exposant ----
    safeText(form, "company", val("company"));
    safeText(form, "activity", val("activity"));
    safeText(form, "address", val("address"));
    safeText(form, "country", val("country"));
    safeText(form, "city", val("city"));
    safeText(form, "phone", val("phone"));
    safeText(form, "email", val("email"));
    safeText(form, "contact", val("contact"));

    // ---- Stand / surfaces ----
    // Champs PDF: area, rate, standsubtotal
    safeText(form, "area", data.area || "");
    safeText(form, "rate", Math.round(data.pricePerM2 || 0));
    safeText(form, "standsubtotal", Math.round(data.standHT || 0));

    // ---- Implantation (non tarifée) ----
    safeCheck(form, "layout_1", data.position === "standard");
    safeCheck(form, "layout_2", data.position === "angle");
    safeCheck(form, "layout_3", data.position === "ilot");

    // ---- Options ----
    const isChecked = (sel) => !!document.querySelector(sel)?.checked;
    safeCheck(form, "opt_1", isChecked("#opt_vip"));
    safeCheck(form, "opt_2", isChecked("#opt_backoffice"));
    safeCheck(form, "opt_3", isChecked("#opt_posterled"));
    safeCheck(form, "opt_4", isChecked("#opt_wall2"));
    safeCheck(form, "opt_5", isChecked("#opt_wall6"));
    safeCheck(form, "opt_6", isChecked("#opt_hostess"));

   const hostessChecked = (data.hostessChecked === true) || isChecked("#opt_hostess");

// Clamp hostess days to max 4
let hostessDays = parseInt(data.hostessDays ?? "0", 10);
if (hostessDays > 4) {
  hostessDays = 4;
  const msgElement = document.getElementById("hostess_days_msg");
  if (msgElement) {
    msgElement.textContent = "⚠ Maximum is 4 days. Adjusted automatically.";
  }
} else {
  const msgElement = document.getElementById("hostess_days_msg");
  if (msgElement) {
    msgElement.textContent = "";
  }
}

safeText(form, "hostess_persons", hostessChecked ? (data.hostessPersons ?? "") : "");
safeText(form, "hostess_days", hostessChecked ? hostessDays : "");
safeText(form, "hostess_total", hostessChecked ? Math.round(data.hostessTotal ?? 0) : "");


    // ---- Totaux ----
    safeText(form, "tot_1", Math.round(data.optionsHT || 0));
    safeText(form, "tot_2", Math.round(data.tva || 0));
    safeText(form, "tot_3", Math.round(data.totalHT || 0));
    safeText(form, "tot_4", Math.round(data.totalTTC || 0));

    safeText(form, "grand_1", Math.round(data.totalHT || 0));
    safeText(form, "grand_2", Math.round(data.tva || 0));
    safeText(form, "grand_3", Math.round(data.totalTTC || 0));

    // ✅ verrouille (non modifiable après téléchargement)
    form.flatten();

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download =
      getLang() === "en" ? "IAEXPO2026_Booth_Booking_Prefilled.pdf" :
      getLang() === "ar" ? "IAEXPO2026_حجز_جناح_معبأ.pdf" :
      "IAEXPO2026_Reservation_Stand_Prerempli.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function bind() {
    document.querySelectorAll("input,select").forEach((el) => {
      el.addEventListener("change", calc);
      el.addEventListener("input", calc);
    });

    // accepte les 2 ids (selon tes pages)
    const btn1 = document.getElementById("downloadPrefilled");
    const btn2 = document.getElementById("btnPdf");
    if (btn1) btn1.addEventListener("click", downloadPrefilled);
    if (btn2) btn2.addEventListener("click", downloadPrefilled);

    const typeSelect = $("#stand_type");
    if (typeSelect) {
      typeSelect.addEventListener("change", () => {
        syncAreasUI();
        calc();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    syncAreasUI();
    calc();
    bind();
  });
})();
