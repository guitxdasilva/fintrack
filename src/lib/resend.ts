import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

export function getMailTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return _transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getMailTransporter();

  return transporter.sendMail({
    from: `FinTrack <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
}
