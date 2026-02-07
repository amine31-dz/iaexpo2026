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

  const PRESET_AREAS = [9, 12, 16, 24, 36, 48];

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
    if (lang === "en") return "assets/pdf/IAEXPO2026_Reservation_Stand_EN_Interactive.pdf";
    if (lang === "ar") return "assets/pdf/IAEXPO2026_Reservation_Stand_AR_Interactive.pdf";
    return "assets/pdf/IAEXPO2026_Reservation_Stand_FR_Interactive.pdf";
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

    let a = Number($("#stand_area_custom")?.value || 0);
    if (a < 50) a = 50;
    if (a > 800) a = 800;
    return a;
  }

  function readPosition() {
    return $("#stand_position")?.value || "standard"; // standard / angle / ilot
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
    const hostessTotal = hostessChecked ? (hostessPersons * hostessDays * OPT.hostess_day_person) : 0;

    const optionsHT = vip + backoffice + posterled + wall2 + wall6 + hostessTotal;

    const totalHT = standHT + optionsHT;
    const tva = totalHT * VAT;
    const totalTTC = totalHT + tva;

    const opts = [];
    if (vip) opts.push(`Salon VIP (${money(OPT.vip)})`);
    if (backoffice) opts.push(`Back office (${money(OPT.backoffice)})`);
    if (posterled) opts.push(`Poster LED (${money(OPT.posterled)})`);
    if (wall2) opts.push(`Mur LED 2 m² (${money(OPT.wall2)})`);
    if (wall6) opts.push(`Mur LED 6 m² (${money(OPT.wall6)})`);
    if (hostessChecked) opts.push(`Hôtesses (${hostessPersons} pers × ${hostessDays} jours × 5 500 = ${money(hostessTotal)})`);

    // recap UI
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

  async function ensurePdfLib() {
    if (window.PDFLib) return;
    throw new Error("PDFLib not loaded");
  }

  function val(id) {
    return (document.getElementById(id)?.value || "").trim();
  }

  // Helpers “safe” (ne cassent pas si champ absent)
  function safeText(form, name, value) {
    try {
      const f = form.getTextField(name);
      f.setText(value ?? "");
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

    // Debug (optionnel)
    console.log("===== CHAMPS PDF =====");
    form.getFields().forEach(f => console.log(f.getName()));

    // ---- Exposant ----
    safeText(form, "company", val("company"));
    safeText(form, "activity", val("activity"));
    safeText(form, "address", val("address"));
    safeText(form, "country", val("country"));
    safeText(form, "city", val("city"));
    safeText(form, "phone", val("phone"));
    safeText(form, "email", val("email"));
    safeText(form, "contact", val("contact"));

    // ---- Stand / Surfaces ----
    // Dans ton PDF, les champs qui existent (d’après ta console) : area, rate, standsubtotal
    safeText(form, "area", String(data.area || ""));
    safeText(form, "rate", String(Math.round(data.pricePerM2 || 0)));
    safeText(form, "standsubtotal", String(Math.round(data.standHT || 0)));

    // Layout checkboxes
    safeCheck(form, "layout_1", data.type === "standard" && data.position === "standard");
    safeCheck(form, "layout_2", data.position === "angle");
    safeCheck(form, "layout_3", data.position === "ilot");

    // ---- Options ----
    safeCheck(form, "opt_1", !!$("#opt_vip")?.checked);
    safeCheck(form, "opt_2", !!$("#opt_backoffice")?.checked);
    safeCheck(form, "opt_3", !!$("#opt_posterled")?.checked);
    safeCheck(form, "opt_4", !!$("#opt_wall2")?.checked);
    safeCheck(form, "opt_5", !!$("#opt_wall6")?.checked);
    safeCheck(form, "opt_6", !!$("#opt_hostess")?.checked);

    safeText(form, "hostess_persons", data.hostessChecked ? String(data.hostessPersons || "") : "");
    safeText(form, "hostess_days", data.hostessChecked ? String(data.hostessDays || "") : "");
    safeText(form, "hostess_total", data.hostessChecked ? String(Math.round(data.hostessTotal || 0)) : "");

    // Totaux (si ces champs existent)
    safeText(form, "tot_1", String(Math.round(data.optionsHT || 0)));
    safeText(form, "tot_2", String(Math.round(data.tva || 0)));
    safeText(form, "tot_3", String(Math.round(data.totalHT || 0)));
    safeText(form, "tot_4", String(Math.round(data.totalTTC || 0)));

    safeText(form, "grand_1", String(Math.round(data.totalHT || 0)));
    safeText(form, "grand_2", String(Math.round(data.tva || 0)));
    safeText(form, "grand_3", String(Math.round(data.totalTTC || 0)));

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

    // accepte les 2 ids
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
