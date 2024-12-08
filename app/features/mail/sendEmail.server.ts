import nodemailer from "nodemailer";
import { MailFromUser } from "./mail.type";

export const mailTransporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_GMAIL_ADDRESS,
    pass: process.env.MAIL_PASSWORD,
  },
});
function getFromAddress(user: MailFromUser) {
  if (user === "support") return process.env.MAIL_SUPPORT_ADDRESS;
  if (user === "notify") return process.env.MAIL_NOTIFY_ADDRESS;
  if (user === "system") return process.env.MAIL_SYSTEM_ADDRESS;
}

export async function sendEmail({
  fromUser,
  to,
  subject,
  html,
}: {
  fromUser: MailFromUser;
  to: string;
  subject: string;
  html: string;
}) {
  return await mailTransporter.sendMail({
    from: `Okashibu <${getFromAddress(fromUser)}>`,
    to,
    subject,
    html,
  });
}
