(function(){
  const VAT = 0.19;

  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
  function money(n){
    n = Math.round((Number(n)||0));
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g," ") + " DA";
  }

  function calc(){
    const type = qs('input[name="stand_type"]:checked')?.value || "standard";
    const shape = qs('input[name="stand_shape"]:checked')?.value || "line";
    const areaMode = qs('input[name="area_mode"]:checked')?.value || "preset";

    let area = 0;
    if(areaMode === "preset"){
      area = Number(qs('#area_preset')?.value || 0);
    } else {
      area = Number(qs('#area_custom')?.value || 0);
    }

    // Area rules
    if(type === "custom"){
      // custom stand: free area 50-800 m²
      if(area < 50) area = 50;
      if(area > 800) area = 800;
    }

    // Pricing (modifiable)
    const pricePerM2 = (type === "custom") ? 12500 : 14500;
    const shapeMult = (shape === "corner") ? 1.10 : (shape === "island") ? 1.25 : 1.00;

    const optTotal = qsa('input[name="opt"]:checked').reduce((s,el)=> s + Number(el.dataset.price||0), 0);

    const standTotal = area * pricePerM2 * shapeMult;
    const ht = standTotal + optTotal;
    const tva = ht * VAT;
    const ttc = ht + tva;

    const w = (id, val)=>{ const el=qs(id); if(el) el.textContent = val; };
    w('#sum_area', area ? (area + " m²") : "—");
    w('#sum_type', type === "custom" ? (qs('#t_custom_label')?.textContent || "Custom") : (qs('#t_standard_label')?.textContent || "Standard"));
    const shapeLabel = shape === "corner" ? (qs('#s_corner_label')?.textContent||"Corner") : shape==="island" ? (qs('#s_island_label')?.textContent||"Island") : (qs('#s_line_label')?.textContent||"Line");
    w('#sum_shape', shapeLabel);
    w('#sum_stand', money(standTotal));
    w('#sum_opts', money(optTotal));
    w('#sum_ht', money(ht));
    w('#sum_tva', money(tva));
    w('#sum_ttc', money(ttc));
    return {type, shape, area, pricePerM2, shapeMult, optTotal, standTotal, ht, tva, ttc};
  }

  function bind(){
    qsa('input,select').forEach(el=>{
      el.addEventListener('change', ()=>calc());
      el.addEventListener('input', ()=>calc());
    });

    qsa('input[name="area_mode"]').forEach(r=>{
      r.addEventListener('change', ()=>{
        const mode = qs('input[name="area_mode"]:checked')?.value || "preset";
        qs('#areaPresetWrap')?.classList.toggle('hidden', mode !== "preset");
        qs('#areaCustomWrap')?.classList.toggle('hidden', mode !== "custom");
        calc();
      });
    });

    const btn = qs('#downloadPrefilled');
    if(btn){
      btn.addEventListener('click', ()=>{
        const data = calc();
        const lang = document.documentElement.lang || "fr";

        // load jsPDF if missing
        if(!window.jspdf){
          alert("PDF library is loading, please retry in 2 seconds.");
          return;
        }
        
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ====== Simple, clean, non-overlapping PDF layout (FR/EN/AR) ======
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14; // margin
  const C = {
    text: [20, 24, 35],
    muted: [110, 115, 130],
    line: [210, 216, 226]
  };

  const setRGB = (arr) => doc.setTextColor(arr[0], arr[1], arr[2]);
  const lineRGB = (arr) => doc.setDrawColor(arr[0], arr[1], arr[2]);

  const sectionTitle = (title, y) => {
    // Dark band + title (kept away from borders)
    doc.setFillColor(10, 32, 56);
    doc.roundedRect(M, y, pageW - 2 * M, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(title, pageW / 2, y + 10.5, { align: "center" });
    setRGB(C.text);
    doc.setFont("helvetica", "normal");
    return y + 22;
  };

  const infoLine = (text, y) => {
    // Put the contact info line in its own light box -> no overlap with lines
    doc.setFillColor(245, 247, 251);
    doc.roundedRect(M, y, pageW - 2 * M, 10, 2, 2, "F");
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    setRGB(C.muted);
    doc.text(text, pageW / 2, y + 6.5, { align: "center" });
    setRGB(C.text);
    return y + 14;
  };

  const field = (label, value, x, y, w, h = 9) => {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    setRGB(C.muted);
    doc.text(label, x, y - 1.6);
    setRGB(C.text);

    // Field box (padding inside so text never touches border)
    lineRGB(C.line);
    doc.setLineWidth(0.25);
    doc.setFillColor(229, 236, 255);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");

    doc.setFontSize(10.5);
    doc.text(String(value || ""), x + 2.2, y + h / 2 + 1.1, {
      maxWidth: w - 4.4
    });
    return y + h + 6;
  };

  const twoColFields = (left, right, y) => {
    const gap = 8;
    const w = (pageW - 2 * M - gap) / 2;
    const x1 = M;
    const x2 = M + w + gap;
    const h = 9;

    // labels
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    setRGB(C.muted);
    doc.text(left.label, x1, y - 1.6);
    doc.text(right.label, x2, y - 1.6);
    setRGB(C.text);

    // boxes
    lineRGB(C.line);
    doc.setLineWidth(0.25);
    doc.setFillColor(229, 236, 255);
    doc.roundedRect(x1, y, w, h, 2, 2, "FD");
    doc.roundedRect(x2, y, w, h, 2, 2, "FD");

    doc.setFontSize(10.5);
    doc.text(String(left.value || ""), x1 + 2.2, y + h / 2 + 1.1, { maxWidth: w - 4.4 });
    doc.text(String(right.value || ""), x2 + 2.2, y + h / 2 + 1.1, { maxWidth: w - 4.4 });

    return y + h + 6;
  };

  const bigBox = (label, x, y, w, h) => {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    setRGB(C.muted);
    doc.text(label, x, y - 1.6);
    setRGB(C.text);

    lineRGB(C.line);
    doc.setLineWidth(0.25);
    doc.setFillColor(229, 236, 255);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
    return y + h + 6;
  };

  // Pull values from the form (safe)
  const v = (id) => (document.getElementById(id) ? document.getElementById(id).value : "");
  const checked = (id) => (document.getElementById(id) ? document.getElementById(id).checked : false);

  // Some IDs might differ by language; keep tolerant
  const company = v("company") || v("raisonSociale") || v("raison_sociale");
  const lastName = v("lastName") || v("nom");
  const firstName = v("firstName") || v("prenom");
  const email = v("email");
  const phone = v("phone") || v("telephone");
  const role = v("role") || v("fonction");
  const standType = v("standType") || v("stand_type");
  const standConfig = v("standConfig") || v("stand_config");
  const surface = v("surface") || v("superficie");
  const optionsText = (document.getElementById("selectedOptions") ? document.getElementById("selectedOptions").textContent : "");
  const totalHT = v("totalHT") || v("total_ht");
  const tva = v("tva") || v("vat");
  const totalTTC = v("totalTTC") || v("total_ttc");

  // ===== PAGE 1: Exhibitor + Stand =====
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setRGB(C.text);
  doc.text("Document de réservation — IAEXPO 2026", pageW / 2, y, { align: "center" });

  y += 6;
  y = infoLine("Star Event Agency • contact@iaexpo2026.com • +213 771 724 051 (WhatsApp Pro) | IA Expo 2026 • Oran • 12–15 Oct 2026", y);

  y = sectionTitle("1) Informations Exposant / Exhibitor Info", y);

  y = field("Raison sociale / Company", company, M, y, pageW - 2 * M);
  y = twoColFields(
    { label: "Nom / Last name", value: lastName },
    { label: "Prénom / First name", value: firstName },
    y
  );
  y = twoColFields(
    { label: "Email", value: email },
    { label: "Téléphone / Phone", value: phone },
    y
  );
  y = field("Fonction / Role", role, M, y, pageW - 2 * M);

  y = sectionTitle("2) Stand (choix) / Stand selection", y);

  y = twoColFields(
    { label: "Type stand (standard/perso)", value: standType },
    { label: "Implantation (îlot/coin/etc.)", value: standConfig },
    y
  );
  y = twoColFields(
    { label: "Superficie (m²)", value: surface },
    { label: "Total HT (stand)", value: totalHT },
    y
  );

  // Page break if needed
  if (y > pageH - 40) {
    doc.addPage();
    y = 16;
  }

  // ===== PAGE 2: Options + Totals =====
  y = sectionTitle("3) Options & services (selon besoin) / Options", y);

  // options big box
  y = bigBox("Options sélectionnées / Selected options", M, y, pageW - 2 * M, 38);
  doc.setFontSize(10.5);
  setRGB(C.text);
  doc.text((optionsText || "").trim(), M + 2.2, y - 38 + 7.5, { maxWidth: pageW - 2 * M - 4.4 });

  y = sectionTitle("4) Totaux / Totals", y);

  const gap = 8;
  const w = (pageW - 2 * M - gap) / 2;
  const x1 = M;
  const x2 = M + w + gap;

  // Totals boxes (no lines crossing text)
  y = twoColFields(
    { label: "Total options HT", value: v("totalOptionsHT") || v("options_ht") },
    { label: "TVA (19%)", value: tva },
    y
  );
  y = twoColFields(
    { label: "Total HT (global)", value: v("grandTotalHT") || v("total_global_ht") || totalHT },
    { label: "Total TTC", value: totalTTC },
    y
  );

  // Payment note
  doc.setFillColor(245, 247, 251);
  doc.roundedRect(M, y, pageW - 2 * M, 16, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  setRGB(C.text);
  doc.text("Paiement: 70% (3 mois avant) + 30% (1 mois avant) • Envoyer le document signé + cachet à contact@iaexpo2026.com", M + 4, y + 10, { maxWidth: pageW - 2 * M - 8 });
  y += 22;

  // Page break for signatures
  doc.addPage();
  y = 16;

  // ===== PAGE 3: Signatures =====
  y = sectionTitle("5) Signatures", y);

  // Make sure text NEVER goes inside the rectangle border
  const boxW = (pageW - 2 * M - 10) / 2;
  const boxH = 58;
  const boxY = y + 6;
  const bx1 = M;
  const bx2 = M + boxW + 10;

  // Outer signature boxes
  lineRGB(C.line);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(bx1, boxY, boxW, boxH, 3, 3, "D");
  doc.roundedRect(bx2, boxY, boxW, boxH, 3, 3, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setRGB(C.text);
  doc.text("Exposant", bx1 + 6, boxY + 10);
  doc.text("Organisateur", bx2 + 6, boxY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setRGB(C.muted);

  // Date fields (aligned; label above; box below)
  const dateY = boxY + 18;
  const stampY = boxY + 36;

  // Left date
  doc.text("Date", bx1 + 6, dateY);
  doc.setFillColor(229, 236, 255);
  doc.roundedRect(bx1 + 6, dateY + 2.5, boxW - 12, 9, 2, 2, "FD");

  // Right date
  doc.text("Date", bx2 + 6, dateY);
  doc.roundedRect(bx2 + 6, dateY + 2.5, boxW - 12, 9, 2, 2, "FD");

  // Stamp / signature fields
  doc.text("Cachet / Signature", bx1 + 6, stampY);
  doc.roundedRect(bx1 + 6, stampY + 2.5, boxW - 12, 20, 2, 2, "FD");

  doc.text("Cachet / Signature", bx2 + 6, stampY);
  doc.roundedRect(bx2 + 6, stampY + 2.5, boxW - 12, 20, 2, 2, "FD");

  // Footer
  doc.setFontSize(9.5);
  setRGB(C.muted);
  doc.text("www.iaexpo2026.com", pageW - M, pageH - 12, { align: "right" });

  // Save
  doc.save("reservation_IAEXPO2026.pdf");

      });
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // load jsPDF
    if(!window.jspdf){
      const s = document.createElement('script');
      s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      s.defer = true;
      document.head.appendChild(s);
    }
    // labels for options
    qsa('input[name="opt"]').forEach(el=>{
      const lab = document.querySelector(`label[for="${el.id}"]`);
      if(lab) el.dataset.label = lab.textContent.trim();
    });
    // area initial
    const mode = document.querySelector('input[name="area_mode"]:checked')?.value || "preset";
    const presetWrap = qs('#areaPresetWrap');
    const customWrap = qs('#areaCustomWrap');
    if(presetWrap && customWrap){
      presetWrap.classList.toggle('hidden', mode !== "preset");
      customWrap.classList.toggle('hidden', mode !== "custom");
    }
    calc();
    bind();
  });
})();