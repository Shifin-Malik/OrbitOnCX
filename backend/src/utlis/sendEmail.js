import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config()
export const sendEmail = async (email, subject, text, htmlContent = null) => {
  if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
    console.error("Missing Email Credentials in .env file");
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

  const mailOptions = {
    from: `"OrbitonCX Support" <${process.env.EMAIL}>`,
    to: email,
    subject,
    text,
    html: htmlContent || `<b>${text}</b>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Email send error:", error.message);
    return false;
  }
};