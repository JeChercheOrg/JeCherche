import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResend();
  if (!client) return;
  try {
    await client.emails.send({
      from: "VendsMoi <notifications@vendsmoi.fr>",
      ...params,
    });
  } catch (e) {
    console.error("Failed to send email:", e);
  }
}
