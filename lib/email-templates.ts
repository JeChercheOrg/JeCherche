import { SITE_URL, SITE_NAME } from "./constants";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="padding:24px 24px 16px;text-align:center;border-bottom:1px solid #e4e4e7">
<strong style="font-size:18px;color:#18181b">${SITE_NAME}</strong>
</td></tr>
<tr><td style="padding:24px">${content}</td></tr>
<tr><td style="padding:16px 24px;text-align:center;border-top:1px solid #e4e4e7">
<span style="font-size:12px;color:#a1a1aa">Vous recevez cet email car les notifications sont activées sur votre compte ${SITE_NAME}.</span>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">${label}</a>`;
}

export function newOfferEmail(
  listingTitle: string,
  offerPrice: number,
  sellerName: string,
  listingUrl: string
) {
  return {
    subject: `Nouvelle offre sur "${listingTitle}"`,
    html: layout(`
      <p style="margin:0 0 12px;font-size:15px;color:#18181b">
        <strong>${sellerName}</strong> a fait une offre sur votre annonce.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;margin:0 0 16px">
        <tr><td style="padding:12px 16px">
          <p style="margin:0 0 4px;font-size:13px;color:#71717a">Annonce</p>
          <p style="margin:0 0 8px;font-size:15px;color:#18181b;font-weight:500">${listingTitle}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#71717a">Prix proposé</p>
          <p style="margin:0;font-size:18px;color:#2563eb;font-weight:700">${formatPrice(offerPrice)}</p>
        </td></tr>
      </table>
      <p style="margin:0;text-align:center">${button(listingUrl, "Voir l'offre")}</p>
    `),
  };
}

export function newMessageEmail(
  senderName: string,
  listingTitle: string,
  conversationUrl: string
) {
  return {
    subject: `Nouveau message de ${senderName}`,
    html: layout(`
      <p style="margin:0 0 12px;font-size:15px;color:#18181b">
        <strong>${senderName}</strong> vous a envoyé un message à propos de <strong>${listingTitle}</strong>.
      </p>
      <p style="margin:0;text-align:center">${button(conversationUrl, "Lire le message")}</p>
    `),
  };
}

export function offerAcceptedEmail(
  listingTitle: string,
  offerPrice: number,
  listingUrl: string
) {
  return {
    subject: `Offre acceptée sur "${listingTitle}" !`,
    html: layout(`
      <p style="margin:0 0 12px;font-size:15px;color:#18181b">
        Bonne nouvelle ! Votre offre a été <strong style="color:#16a34a">acceptée</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin:0 0 16px">
        <tr><td style="padding:12px 16px">
          <p style="margin:0 0 4px;font-size:13px;color:#71717a">Annonce</p>
          <p style="margin:0 0 8px;font-size:15px;color:#18181b;font-weight:500">${listingTitle}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#71717a">Votre offre</p>
          <p style="margin:0;font-size:18px;color:#16a34a;font-weight:700">${formatPrice(offerPrice)}</p>
        </td></tr>
      </table>
      <p style="margin:0;text-align:center">${button(listingUrl, "Voir l'annonce")}</p>
    `),
  };
}

export function listingAcceptedEmail(
  listingTitle: string,
  price: number,
  buyerName: string,
  listingUrl: string
) {
  return {
    subject: `${buyerName} a accepté votre prix sur "${listingTitle}" !`,
    html: layout(`
      <p style="margin:0 0 12px;font-size:15px;color:#18181b">
        Bonne nouvelle ! <strong>${buyerName}</strong> a <strong style="color:#16a34a">accepté votre prix</strong> sur votre annonce.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin:0 0 16px">
        <tr><td style="padding:12px 16px">
          <p style="margin:0 0 4px;font-size:13px;color:#71717a">Annonce</p>
          <p style="margin:0 0 8px;font-size:15px;color:#18181b;font-weight:500">${listingTitle}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#71717a">Prix accepté</p>
          <p style="margin:0;font-size:18px;color:#16a34a;font-weight:700">${formatPrice(price)}</p>
        </td></tr>
      </table>
      <p style="margin:0;text-align:center">${button(listingUrl, "Voir l'annonce")}</p>
    `),
  };
}

export function offerRejectedEmail(
  listingTitle: string,
  listingUrl: string
) {
  return {
    subject: `Offre refusée sur "${listingTitle}"`,
    html: layout(`
      <p style="margin:0 0 12px;font-size:15px;color:#18181b">
        Malheureusement, votre offre sur <strong>${listingTitle}</strong> a été <strong style="color:#dc2626">refusée</strong>.
      </p>
      <p style="margin:0;text-align:center">${button(listingUrl, "Voir l'annonce")}</p>
    `),
  };
}
