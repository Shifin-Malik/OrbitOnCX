import { sendEmail } from "../../utlis/sendEmail.js";

const safeName = (user) => {
  const name = user?.name;
  return typeof name === "string" && name.trim() ? name.trim() : "there";
};

export const sendUserBlockedEmail = async (user) => {
  const subject = "Account Status Update - OrbitonCX";
  const text =
    "Your OrbitonCX account has been temporarily blocked. If you believe this is a mistake, please contact support.";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#111;">
      <h2 style="margin:0 0 12px;">Account Temporarily Blocked</h2>
      <p style="margin:0 0 10px;">Hi ${safeName(user)},</p>
      <p style="margin:0 0 10px;">
        Your OrbitonCX account has been <b>temporarily blocked</b>. You may not be able to log in or access protected features until it is restored.
      </p>
      <p style="margin:0 0 10px;">
        If you believe this action was taken in error, please contact our support team.
      </p>
      <p style="margin:16px 0 0; color:#666; font-size:12px;">— OrbitonCX Support</p>
    </div>
  `;

  return sendEmail(user.email, subject, text, html);
};

export const sendUserUnblockedEmail = async (user) => {
  const subject = "Account Restored - OrbitonCX";
  const text =
    "Your OrbitonCX account has been restored. You can now log in again.";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#111;">
      <h2 style="margin:0 0 12px;">Account Restored</h2>
      <p style="margin:0 0 10px;">Hi ${safeName(user)},</p>
      <p style="margin:0 0 10px;">
        Your OrbitonCX account access has been <b>restored</b>. You can now log in and use the platform again.
      </p>
      <p style="margin:16px 0 0; color:#666; font-size:12px;">— OrbitonCX Support</p>
    </div>
  `;

  return sendEmail(user.email, subject, text, html);
};

