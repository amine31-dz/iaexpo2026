(function () {
  const VAT = 0.19;

  // Rates from PDF
  const RATE_STANDARD = 14500; // DA / m² (HT)
  const RATE_CUSTOM = 12500;   // DA / m² (HT)
  const HOST_RATE = 5500;      // DA / day / person (HT)

  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const fmt = (n, currency = "DA") => {
    const v = Math.round(Number(n) || 0);
    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + currency;
  };

  function getStandType() {
    return ($("standType")?.value || "standard");
  }

  function getStandPosLabel() {
    const val = $("standPos")?.value || "standard";
    if (document.documentElement.lang === "ar") {
      if (val === "corner") return "زاوية";
      if (val === "island") return "جزيرة";
      return "قياسي";
    }
    if (document.documentElement.lang === "en") {
      if (val === "corner") return "Corner";
      if (val === "island") return "Island";
      return "Standard";
    }
    // fr
    if (val === "corner") return "Angle";
    if (val === "island") return "Îlot";
    return "Standard";
  }

  function getStandTypeLabel(type) {
    const lang = document.documentElement.lang || "fr";
    if (lang === "ar") return type === "custom" ? "جناح حسب الطلب" : "جناح قياسي";
    if (lang === "en") return type === "custom" ? "Custom booth" : "Standard booth";
    return type === "custom" ? "Stand sur mesure" : "Stand standard";
  }

  function getRate(type) {
    return type === "custom" ? RATE_CUSTOM : RATE_STANDARD;
  }

  function getArea(type) {
    if (type === "custom") {
      let a = Number($("areaCustom")?.value || 50);
      if (a < 50) a = 50;
      if (a > 800) a = 800;
      if ($("areaCustom")) $("areaCustom").value = a;
      return a;
    }
    // standard preset
    return Number($("areaStandard")?.value || 9);
  }

  function getHostTotal() {
    const qty = Number($("hostQty")?.value || 0);
    const days = Number($("hostDays")?.value || 0);
    const total = qty * days * HOST_RATE;
    return { qty, days, total };
  }

  function getOptionsTotal() {
    const fixed = $$(".opt:checked").reduce((sum, el) => {
      return sum + Number(el.dataset.price || 0);
    }, 0);

    const host = getHostTotal().total;
    return fixed + host;
  }

  function updateVisibility(type) {
    const stdWrap = $("areaStandardWrap");
    const cusWrap = $("areaCustomWrap");
    if (stdWrap) stdWrap.classList.toggle("hidden", type === "custom");
    if (cusWrap) cusWrap.classList.toggle("hidden", type !== "custom");
  }

  function render() {
    const type = getStandType();
    updateVisibility(type);

    const area = getArea(type);
    const rate = getRate(type);
    const standHT = area * rate;

    const optionsHT = getOptionsTotal();
    const totalHT = standHT + optionsHT;
    const tva = totalHT * VAT;
    const totalTTC = totalHT + tva;

    // Applied labels
    if ($("appliedType")) $("appliedType").textContent = getStandTypeLabel(type);
    if ($("appliedRate")) {
      const lang = document.documentElement.lang || "fr";
      const unit = (lang === "en") ? "DZD/m²" : (lang === "ar" ? "دج/م²" : "DA/m²");
      $("appliedRate").textContent = fmt(rate, "") + " " + unit;
    }

    // Hostesses line
    const host = getHostTotal();
    if ($("hostTotal")) {
      const lang = document.documentElement.lang || "fr";
      const currency = (lang === "en") ? "DZD" : (lang === "ar" ? "دج" : "DA");
      $("hostTotal").textContent = fmt(host.total, currency);
    }

    // Summary
    const lang = document.documentElement.lang || "fr";
    const currency = (lang === "en") ? "DZD" : (lang === "ar" ? "دج" : "DA");
    const unit = (lang === "en") ? "m²" : "m²";

    if ($("sum_type")) $("sum_type").textContent = getStandTypeLabel(type);
    if ($("sum_pos")) $("sum_pos").textContent = getStandPosLabel();
    if ($("sum_area")) $("sum_area").textContent = `${area} ${unit}`;
    if ($("sum_rate")) $("sum_rate").textContent = fmt(rate, currency) + " / m²";
    if ($("sum_stand_ht")) $("sum_stand_ht").textContent = fmt(standHT, currency);
    if ($("sum_opts_ht")) $("sum_opts_ht").textContent = fmt(optionsHT, currency);
    if ($("sum_ht")) $("sum_ht").textContent = fmt(totalHT, currency);
    if ($("sum_tva")) $("sum_tva").textContent = fmt(tva, currency);
    if ($("sum_ttc")) $("sum_ttc").textContent = fmt(totalTTC, currency);
  }

  function bind() {
    // Inputs/selects
    $$("input,select,textarea").forEach((el) => {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Safety: if page doesn't have these IDs, do nothing
    if (!$("standType") || !$("standPos")) return;

    // Init
    render();
    bind();
  });
})();
