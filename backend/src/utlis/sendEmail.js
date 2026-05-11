import nodemailer from "nodemailer";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

export const sendEmail = async (
  email,
  subject,
  text,
  htmlContent = null
) => {
  if (
    !process.env.BREVO_SMTP_USER ||
    !process.env.BREVO_SMTP_KEY ||
    !process.env.BREVO_SENDER_EMAIL
  ) {
    console.error("Missing Brevo Credentials");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });

  const mailOptions = {
    from: `"OrbitOnCX Support" <${process.env.BREVO_SENDER_EMAIL}>`,
    to: email,
    subject,
    text,
    html: htmlContent || `<b>${text}</b>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent:", info.messageId);

    return true;
  } catch (error) {
    console.error("Email send error:", error);

    return false;
  }
};