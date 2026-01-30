// iaexpo/api/exhibitor.js
// Vercel Serverless Function: POST /api/exhibitor
// Envoi email via Resend (recommandé). Configure RESEND_API_KEY dans Vercel > Project > Settings > Environment Variables

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function parseMaybeJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function parseFormUrlEncoded(text) {
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function pickRecipient(payload) {
  // Par défaut: exposant -> commercial
  const role = (payload.role || payload.type || payload.leadType || "").toString().toLowerCase();

  if (role.includes("sponsor") || role.includes("partenaire") || role.includes("partner")) {
    return "sponsor@iaexpo2026.com";
  }
  return "commercial@iaexpo2026.com";
}

function safe(v) {
  return (v === undefined || v === null) ? "" : String(v);
}

export default async function handler(req, res) {
  // CORS simple (utile si besoin)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
// TEST RESEND KEY (temporaire)
const key = process.env.RESEND_API_KEY;
return res.status(200).json({
  hasKey: !!key,
  keyLength: key ? key.length : 0,
  vercelEnv: process.env.VERCEL_ENV,
});
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const raw = await readBody(req);
    const ct = (req.headers["content-type"] || "").toLowerCase();

    let payload = null;

    if (ct.includes("application/json")) {
      payload = parseMaybeJSON(raw);
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      payload = parseFormUrlEncoded(raw);
    } else {
      // tentative JSON sinon form-urlencoded
      payload = parseMaybeJSON(raw) || parseFormUrlEncoded(raw);
    }

    payload = payload || {};

    // Champs utiles (tu peux en ajouter selon ton form)
    const to = pickRecipient(payload);
    const fromName = safe(payload.company || payload.exhibitor || payload.nomSociete || payload.societe || "IA Expo 2026");
    const contactPerson = safe(payload.contactPerson || payload.contact || payload.name || payload.fullName);
    const email = safe(payload.email);
    const phone = safe(payload.phone || payload.tel);
    const address = safe(payload.address);
    const standMode = safe(payload.standMode);
    const standType = safe(payload.standType);
    const options = safe(payload.options);
    const totalHT = safe(payload.totalHT);
    const tva = safe(payload.tva);
    const totalTTC = safe(payload.totalTTC);
    const notes = safe(payload.notes || payload.message);

    // Optionnel: PDF base64 (si plus tard tu veux envoyer un PDF généré)
    // payload.pdfBase64 = "JVBERi0xLjc..." (sans "data:application/pdf;base64,")
    // payload.pdfName = "bon-de-commande.pdf"
    const pdfBase64 = safe(payload.pdfBase64);
    const pdfName = safe(payload.pdfName || "bon-de-commande-iaexpo2026.pdf");

    const subject = `IA Expo 2026 — Nouvelle demande de réservation (${fromName})`;

    const text =
`Nouvelle demande de réservation (IA Expo 2026)

Société: ${fromName}
Contact: ${contactPerson}
Email: ${email}
Téléphone: ${phone}
Adresse: ${address}

StandMode: ${standMode}
StandType: ${standType}
Options: ${options}

Total HT: ${totalHT}
TVA: ${tva}
Total TTC: ${totalTTC}

Notes: ${notes}
`;

    const html = `
      <h2>Nouvelle demande de réservation — IA Expo 2026</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><b>Société</b></td><td>${fromName}</td></tr>
        <tr><td><b>Contact</b></td><td>${contactPerson}</td></tr>
        <tr><td><b>Email</b></td><td>${email}</td></tr>
        <tr><td><b>Téléphone</b></td><td>${phone}</td></tr>
        <tr><td><b>Adresse</b></td><td>${address}</td></tr>
        <tr><td><b>StandMode</b></td><td>${standMode}</td></tr>
        <tr><td><b>StandType</b></td><td>${standType}</td></tr>
        <tr><td><b>Options</b></td><td>${options}</td></tr>
        <tr><td><b>Total HT</b></td><td>${totalHT}</td></tr>
        <tr><td><b>TVA</b></td><td>${tva}</td></tr>
        <tr><td><b>Total TTC</b></td><td>${totalTTC}</td></tr>
      </table>
      ${notes ? `<p><b>Notes:</b><br/>${notes}</p>` : ""}
      <hr/>
      <p><small>Envoyé depuis le site iaexpo2026.com</small></p>
    `;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      // Si la clé n'est pas configurée, on renvoie une erreur claire
      return res.status(500).json({
        ok: false,
        error: "RESEND_API_KEY manquante. Ajoute-la dans Vercel > Settings > Environment Variables.",
      });
    }

    // From par défaut (Resend fonctionne avec onboarding@resend.dev).
    // Si tu vérifies ton domaine sur Resend, tu pourras mettre: no-reply@iaexpo2026.com
    const from = process.env.MAIL_FROM || "IA Expo 2026 <onboarding@resend.dev>";

    const body = {
      from,
      to: [to],
      subject,
      text,
      html,
      reply_to: email ? [email] : undefined,
      attachments: pdfBase64
        ? [
            {
              filename: pdfName,
              content: pdfBase64, // base64 string
            },
          ]
        : undefined,
    };

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const out = await r.json();

    if (!r.ok) {
      return res.status(502).json({ ok: false, error: "Resend error", details: out });
    }

    return res.status(200).json({ ok: true, to, id: out.id || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Server error", details: String(e?.message || e) });
  }
}
