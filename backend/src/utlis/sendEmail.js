import nodemailer from "nodemailer";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

export const sendEmail = async (email, subject, text, htmlContent = null) => {
  if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
    console.error("Missing Email Credentials");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 30000,
  });

  try {
    const info = await transporter.sendMail({
      from: `"OrbitonCX Support" <${process.env.EMAIL}>`,
      to: email,
      subject,
      text,
      html: htmlContent || `<b>${text}</b>`,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email send error:", error.message);
    return false;
  }
};