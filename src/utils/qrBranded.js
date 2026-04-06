const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

function escapeXml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Par défaut: QR PNG standard (le plus robuste en affichage/scan en prod).
 * Optionnel: QR SVG brandé si ENABLE_BRANDED_QR=1 (titre + logo local optionnel).
 */
async function buildBrandedQrDataUrl(targetUrl, title) {
  const branded = process.env.ENABLE_BRANDED_QR === "1";
  if (!branded) {
    return QRCode.toDataURL(targetUrl, {
      width:                360,
      margin:               2,
      errorCorrectionLevel: "M",
    });
  }

  try {
    const qrSvg = await QRCode.toString(targetUrl, {
      type:                 "svg",
      width:                240,
      margin:               2,
      errorCorrectionLevel: "H",
    });

    const inner = qrSvg
      .replace(/<\?xml[^?]*\?>/gi, "")
      .trim()
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>\s*$/i, "");

    const logoPath = path.join(__dirname, "../public/images/qr-logo.png");
    let logoSvg    = "";
    if (fs.existsSync(logoPath)) {
      const ext = logoPath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      const b64 = fs.readFileSync(logoPath).toString("base64");
      logoSvg = `<image href="data:${ext};base64,${b64}" x="92" y="92" width="56" height="56" preserveAspectRatio="xMidYMid meet"/>`;
    }

    const t = escapeXml((title || "Soirée").slice(0, 72));
    const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="340" viewBox="0 0 300 340">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="150" y="28" text-anchor="middle" font-family="system-ui,-apple-system,BlinkMacSystemFont,sans-serif" font-size="15" font-weight="600" fill="#111827">${t}</text>
  <g transform="translate(30, 44)">${inner}${logoSvg}</g>
</svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(fullSvg, "utf8").toString("base64")}`;
  } catch (err) {
    console.error("QR brandé indisponible, fallback PNG:", err.message || err);
    return QRCode.toDataURL(targetUrl, {
      width:                360,
      margin:               2,
      errorCorrectionLevel: "M",
    });
  }
}

module.exports = { buildBrandedQrDataUrl };
