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
    if (type === "standard") {
      return Number($("#stand_area_preset")?.value || 0);
    }
    // custom
    let a = Number($("#stand_area_custom")?.value || 0);
    if (a < 50) a = 50;
    if (a > 800) a = 800;
    return a;
  }

  function readPosition() {
    // position: standard / angle / ilot
    return $("#stand_position")?.value || "standard";
  }

  function calc() {
    const type = $("#stand_type")?.value || "standard";
    const position = readPosition();
    const area = readArea();

    const pricePerM2 = type === "custom" ? PRICE_CUSTOM : PRICE_STANDARD;

    // No multiplier mentioned in your PDF, so we keep same price.
    // We just report the choice in PDF via layout_1/layout_2/layout_3 + surface_type.
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

    // Build options label for recap + PDF
    const opts = [];
    if (vip) opts.push(`Salon VIP (${money(OPT.vip)})`);
    if (backoffice) opts.push(`Back office (${money(OPT.backoffice)})`);
    if (posterled) opts.push(`Poster LED (${money(OPT.posterled)})`);
    if (wall2) opts.push(`Mur LED 2 m² (${money(OPT.wall2)})`);
    if (wall6) opts.push(`Mur LED 6 m² (${money(OPT.wall6)})`);
    if (hostessChecked) opts.push(`Hôtesses (${hostessPersons} pers × ${hostessDays} jours × 5 500 = ${money(hostessTotal)})`);

    // Update recap UI
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

    // Show hostess inputs only if checked
    const hostessWrap = $("#hostessWrap");
    toggle(hostessWrap, hostessChecked);

    return {
      type, position, area, pricePerM2,
      standHT, optionsHT, totalHT, tva, totalTTC,
      optsText: opts.join("\n"),
      hostessChecked, hostessPersons, hostessDays, hostessTotal
    };
  }

  async function ensurePdfLib() {
    if (window.PDFLib) return;
    // Should be loaded by script tag, but just in case.
    throw new Error("PDFLib not loaded");
  }

  function val(id) {
    return ($("#" + id)?.value || "").trim();
  }

  async function downloadPrefilled() {
    await ensurePdfLib();
    const data = calc();

    const pdfUrl = getPdfPath();
    const existingPdfBytes = await fetch(pdfUrl).then((r) => r.arrayBuffer());

    const { PDFDocument } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const form = pdfDoc.getForm();

    // ---- Exhibitor fields (PDF) ----
    // (These names come from your FR interactive PDF)
    form.getTextField("company").setText(val("company"));
    form.getTextField("activity").setText(val("activity"));
    form.getTextField("address").setText(val("address"));
    form.getTextField("country").setText(val("country"));
    form.getTextField("city").setText(val("city"));
    form.getTextField("phone").setText(val("phone"));
    form.getTextField("email").setText(val("email"));
    form.getTextField("contact_person").setText(val("contact_person"));

    // ---- Stand / surfaces (PDF) ----
    form.getTextField("surface_type").setText(
      data.type === "standard" ? "Stand standard" : "Stand sur mesure (50–800 m²)"
    );
    form.getTextField("surface_choice").setText(String(data.area || ""));
    form.getTextField("price_applied").setText(String(data.pricePerM2));
    form.getTextField("total_stand_ht").setText(String(Math.round(data.standHT)));

    // Layout checkboxes (Standard / Angle / Îlot)
    // layout_1 = Standard, layout_2 = Angle, layout_3 = Îlot
    // For custom stand, we uncheck layout_1 and still check angle/ilot if chosen.
    const ck = (name, on) => {
      const f = form.getCheckBox(name);
      if (on) f.check();
      else f.uncheck();
    };

    ck("layout_1", data.type === "standard" && data.position === "standard");
    ck("layout_2", data.position === "angle");
    ck("layout_3", data.position === "ilot");

    // ---- Options (PDF) ----
    ck("opt_1", !!$("#opt_vip")?.checked);
    ck("opt_2", !!$("#opt_backoffice")?.checked);
    ck("opt_3", !!$("#opt_posterled")?.checked);
    ck("opt_4", !!$("#opt_wall2")?.checked);
    ck("opt_5", !!$("#opt_wall6")?.checked);
    ck("opt_6", !!$("#opt_hostess")?.checked);

    form.getTextField("hostess_persons").setText(data.hostessChecked ? String(data.hostessPersons || "") : "");
    form.getTextField("hostess_days").setText(data.hostessChecked ? String(data.hostessDays || "") : "");
    form.getTextField("hostess_total").setText(data.hostessChecked ? String(Math.round(data.hostessTotal)) : "");

    // Totals boxes (page options)
    form.getTextField("tot_1").setText(String(Math.round(data.optionsHT)));
    form.getTextField("tot_2").setText(String(Math.round(data.tva)));
    form.getTextField("tot_3").setText(String(Math.round(data.totalHT)));
    form.getTextField("tot_4").setText(String(Math.round(data.totalTTC)));

    // Global recap (page 3)
    form.getTextField("grand_1").setText(String(Math.round(data.totalHT)));
    form.getTextField("grand_2").setText(String(Math.round(data.tva)));
    form.getTextField("grand_3").setText(String(Math.round(data.totalTTC)));

    // Keep form editable (DO NOT flatten)
    // form.flatten(); // <- NON

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = getLang() === "en"
      ? "IAEXPO2026_Booth_Booking_Prefilled.pdf"
      : getLang() === "ar"
      ? "IAEXPO2026_حجز_جناح_معبأ.pdf"
      : "IAEXPO2026_Reservation_Stand_Prerempli.pdf";
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

    const btn = $("#downloadPrefilled");
    if (btn) btn.addEventListener("click", downloadPrefilled);

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
