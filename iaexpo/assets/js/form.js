const VAT = 0.19;
const PRICE_STD_M2 = 14500;
const PRICE_CUSTOM_M2 = 12500;
const HOST_PRICE_PER_DAY = 5500;
const STANDARD_SURFACES = [9,12,16,24,36,48];
const OPTIONS = [
  { key:"vip", label:"Salon VIP", unit:45000 },
  { key:"storage", label:"Arrière-boutique", unit:55000 },
  { key:"tv", label:"TV écran 55 cm sur pied", unit:14500 },
  { key:"led_poster", label:"LED Poster P3 (192×64)", unit:100000 },
  { key:"wall_2", label:"Mur LED indoor 2 m²", unit:350000 },
  { key:"wall_6", label:"Mur LED indoor 6 m²", unit:750000 },
];

function $id(id){ return document.getElementById(id); }
function formatDA(n){ return Number(n||0).toLocaleString('fr-DZ',{maximumFractionDigits:0}) + " DA"; }

function toast(msg){
  const t = $id('toast'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2000);
}

function getData(){
  const standMode = document.querySelector('input[name="standMode"]:checked')?.value || "standard";
  const standardSurface = Number($id('standardSurface')?.value || 0);
  const customSurface = Number($id('customSurface')?.value || 0);
  const standType = document.querySelector('input[name="standType"]:checked')?.value || "Standard";

  const optionItems = OPTIONS.map(o=>{
    const checked = $id('opt_'+o.key)?.checked || false;
    const qty = checked ? Number($id('qty_'+o.key)?.value || 1) : 0;
    return {...o, checked, qty};
  });

  const hosts = Number($id('hosts')?.value || 0);
  const hostDays = Number($id('hostDays')?.value || 0);

  const exhibitor = {
    company: ($id('company')?.value || "").trim(),
    contact: ($id('contactPerson')?.value || "").trim(),
    phone: ($id('phone')?.value || "").trim(),
    email: ($id('email')?.value || "").trim(),
    address: ($id('address')?.value || "").trim(),
  };

  return { standMode, standardSurface, customSurface, standType, optionItems, hosts, hostDays, exhibitor };
}

function totals(d){
  let surface = 0, priceM2 = 0;
  if(d.standMode==="standard"){ surface = d.standardSurface; priceM2 = PRICE_STD_M2; }
  else { surface = d.customSurface; priceM2 = PRICE_CUSTOM_M2; }
  const standHT = surface * priceM2;
  const optionsHT = d.optionItems.reduce((s,x)=> s + (x.checked ? x.unit*x.qty : 0), 0);
  const hostsHT = d.hosts * d.hostDays * HOST_PRICE_PER_DAY;
  const totalHT = standHT + optionsHT + hostsHT;
  const tva = totalHT * VAT;
  const totalTTC = totalHT + tva;
  return { surface, priceM2, standHT, optionsHT, hostsHT, totalHT, tva, totalTTC };
}

function validate(step){
  const d = getData();
  if(step===1){
    if(!d.exhibitor.company || !d.exhibitor.phone || !d.exhibitor.email){ toast("Remplis les champs obligatoires."); return false; }
  }
  if(step===2){
    if(d.standMode==="standard" && !STANDARD_SURFACES.includes(d.standardSurface)){ toast("Choisis une surface standard."); return false; }
    if(d.standMode==="custom" && !(d.customSurface>=50 && d.customSurface<=800)){ toast("Surface personnalisée: 50–800 m²."); return false; }
  }
  if(step===5){
    if(d.hosts>0 && !(d.hostDays>=1 && d.hostDays<=4)){ toast("Jours (1–4) requis pour l’accueil."); return false; }
  }
  if(step===7){
    if(!$id('agree')?.checked){ toast("Accepte les conditions."); return false; }
  }
  return true;
}

function render(){
  const d = getData();
  const t = totals(d);
  const set = (id,val)=>{ const el=$id(id); if(el) el.textContent = val; };

  set('sum_company', d.exhibitor.company || "—");
  set('sum_contact', d.exhibitor.contact || "—");
  set('sum_phone', d.exhibitor.phone || "—");
  set('sum_email', d.exhibitor.email || "—");
  set('sum_address', d.exhibitor.address || "—");

  set('sum_surface', t.surface ? (t.surface+" m²") : "—");
  set('sum_price_m2', t.surface ? (formatDA(t.priceM2)+" / m² (HT)") : "—");
  set('sum_stand_type', d.standType || "—");

  set('sum_stand_ht', formatDA(t.standHT));
  set('sum_options_ht', formatDA(t.optionsHT));
  set('sum_hosts_ht', formatDA(t.hostsHT));
  set('sum_total_ht', formatDA(t.totalHT));
  set('sum_tva', formatDA(t.tva));
  set('sum_total_ttc', formatDA(t.totalTTC));

  const list = $id('opt_list');
  if(list){
    list.innerHTML = "";
    const sel = d.optionItems.filter(x=>x.checked && x.qty>0);
    if(sel.length===0){ list.innerHTML = '<div class="small">Aucune option.</div>'; }
    else{
      sel.forEach(x=>{
        const div = document.createElement('div');
        div.className = 'badge mono';
        div.textContent = `${x.label} × ${x.qty} — ${formatDA(x.unit*x.qty)} (HT)`;
        list.appendChild(div);
      });
    }
  }

  // enable/disable qty inputs
  OPTIONS.forEach(o=>{
    const cb=$id('opt_'+o.key), q=$id('qty_'+o.key);
    if(!cb||!q) return;
    q.disabled = !cb.checked;
    if(!cb.checked) q.value = 1;
  });
}

function setStep(n){
  document.querySelectorAll('[data-step]').forEach(s=>{
    s.classList.toggle('hidden', Number(s.dataset.step)!==n);
  });
  document.querySelectorAll('.step').forEach((el,idx)=>{
    const k=idx+1;
    el.classList.toggle('active', k===n);
  });
  $id('prevBtn').disabled = (n===1);
  $id('nextBtn').classList.toggle('hidden', n===7);
  $id('finishBtn').classList.toggle('hidden', n!==7);
  render();
}

function encodeForm(data){
  return Object.keys(data).map(k => encodeURIComponent(k)+"="+encodeURIComponent(data[k]??"")).join("&");
}

async function submitNetlify(){
  const d = getData();
  const t = totals(d);
  const file = (location.pathname.split('/').pop() || "");
  const formName = file.includes("-en") ? "exhibitor-en" : (file.includes("-ar") ? "exhibitor-ar" : "exhibitor");

  const payload = {
    "form-name": formName,
    company: d.exhibitor.company,
    contactPerson: d.exhibitor.contact,
    phone: d.exhibitor.phone,
    email: d.exhibitor.email,
    address: d.exhibitor.address,
    standMode: d.standMode,
    standardSurface: d.standardSurface,
    customSurface: d.customSurface,
    standType: d.standType,
    options: d.optionItems.filter(x=>x.checked && x.qty>0).map(x=>`${x.label} x${x.qty} = ${x.unit*x.qty}`).join(" | ") || "None",
    hosts: d.hosts,
    hostDays: d.hostDays,
    totalHT: t.totalHT,
    tva: t.tva,
    totalTTC: t.totalTTC
  };

  const res = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodeForm(payload)
  });
  return res.ok;
}

async function generatePDF(){
  if(typeof window.jspdf === "undefined"){ toast("jsPDF non chargé."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"pt", format:"a4" });

  const d = getData();
  const t = totals(d);
  const ex = d.exhibitor;
  const margin = 46;
  let y = 52;

  const line = ()=>{ doc.setDrawColor(180); doc.setLineWidth(0.6); doc.line(margin,y,595-margin,y); y+=12; };
  const title = (txt)=>{ doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.text(txt, margin, y); y+=18; };
  const text = (txt,size=11,bold=false)=>{
    doc.setFont("helvetica", bold?"bold":"normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(txt, 540);
    doc.text(lines, margin, y);
    y += lines.length * (size+4);
  };
  const kv = (k,v)=>{
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.text(k, margin, y);
    doc.setFont("helvetica","normal"); doc.text(String(v||"—"), margin+150, y);
    y += 14;
  };
  const money = (label,val)=>{
    doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.text(label, margin, y);
    doc.setFont("helvetica","bold"); doc.text(formatDA(val), 595-margin, y, {align:"right"});
    y += 16;
  };

  title("IA Expo 2026 — Devis / Bon de commande exposant");
  doc.setFont("helvetica","normal"); doc.setFontSize(11);
  doc.text("Organisateur : Star Event Agency", margin, y); y+=14;
  doc.text("Dates : 12–15 octobre 2026 | Horaires : 10h00–18h00", margin, y); y+=14;
  doc.text("Lieu : Centre de Convention d’Oran – Algérie", margin, y); y+=12;
  line();

  text("INFORMATIONS EXPOSANT", 12, true);
  kv("Raison sociale", ex.company);
  kv("Personne à contacter", ex.contact);
  kv("Téléphone", ex.phone);
  kv("Email", ex.email);
  kv("Adresse", ex.address);
  line();

  text("DÉTAILS DU STAND", 12, true);
  const modeLabel = d.standMode==="standard" ? "Stand standard" : "Stand personnalisé";
  kv("Formule", `${modeLabel} — ${t.surface||"—"} m²`);
  kv("Type", d.standType);
  kv("Prix", `${formatDA(t.priceM2)} / m² (HT)`);
  money("Total stand (HT)", t.standHT);
  line();

  text("OPTIONS", 12, true);
  const sel = d.optionItems.filter(x=>x.checked && x.qty>0);
  if(sel.length===0) text("Aucune option sélectionnée.", 11, false);
  else sel.forEach(x=> money(`${x.label} × ${x.qty} (HT)`, x.unit*x.qty));
  money("Total options (HT)", t.optionsHT);
  line();

  text("HÔTESSES / HÔTES D’ACCUEIL", 12, true);
  if(d.hosts>0 && d.hostDays>0) money(`${d.hosts} × ${d.hostDays} jour(s) × 5 500 DA (HT)`, t.hostsHT);
  else text("Aucun personnel d’accueil demandé.", 11, false);
  line();

  text("RÉCAPITULATIF", 12, true);
  money("Total HT", t.totalHT);
  money("TVA (19%)", t.tva);
  money("Total TTC", t.totalTTC);

  doc.setFont("helvetica","normal"); doc.setFontSize(9);
  doc.text(doc.splitTextToSize("Devis généré automatiquement depuis le site IA Expo 2026.", 540), margin, 780);

  const filename = `IAExpo2026_Devis_${(ex.company||"Exposant").replace(/[^\w\-]+/g,"_")}.pdf`;
  doc.save(filename);
  toast("PDF généré.");
}

function init(){
  let step = 1;
  setStep(step);

  document.querySelectorAll('input,select,textarea').forEach(el=>{
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  $id('prevBtn').addEventListener('click', ()=>{ step=Math.max(1,step-1); setStep(step); });
  $id('nextBtn').addEventListener('click', ()=>{ if(!validate(step)) return; step=Math.min(7,step+1); setStep(step); });
  $id('finishBtn').addEventListener('click', async ()=>{
    if(!validate(7)) return;
    try{
      const ok = await submitNetlify();
      if(ok){
        const file=(location.pathname.split('/').pop()||"");
        location.href = file.includes("-en") ? "thank-you-en.html" : (file.includes("-ar") ? "thank-you-ar.html" : "thank-you.html");
        return;
      }
    }catch(e){}
    toast("Envoi impossible. Utilise le contact email.");
  });

  $id('pdfBtn').addEventListener('click', async ()=>{
    if(!validate(1) || !validate(2) || !validate(5)) return;
    await generatePDF();
  });

  $id('copyBtn').addEventListener('click', async ()=>{
    const d=getData(); const t=totals(d);
    const txt = [
      "IA Expo 2026 — Récapitulatif",
      `Société: ${d.exhibitor.company}`,
      `Contact: ${d.exhibitor.contact}`,
      `Téléphone: ${d.exhibitor.phone}`,
      `Email: ${d.exhibitor.email}`,
      `Adresse: ${d.exhibitor.address}`,
      `Stand: ${d.standMode==="standard" ? d.standardSurface+" m² (standard)" : d.customSurface+" m² (personnalisé)"}`,
      `Type: ${d.standType}`,
      `Total HT: ${formatDA(t.totalHT)}`,
      `TVA 19%: ${formatDA(t.tva)}`,
      `Total TTC: ${formatDA(t.totalTTC)}`
    ].join("\n");
    try{ await navigator.clipboard.writeText(txt); toast("Copié."); }
    catch(e){ toast("Copie impossible."); }
  });

  render();
}

document.addEventListener('DOMContentLoaded', ()=>{
  if(document.body.dataset.page === "reserve") init();
});
