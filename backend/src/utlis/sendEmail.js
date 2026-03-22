import nodemailer from "nodemailer";

export const sendEmail = async (email, subject, text, htmlContent = null) => {

  if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
    console.error("Missing Email Credentials in .env file");
    return false;
  }

  
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
    
    connectionTimeout: 10000, 
  });

  
  const mailOptions = {
    from: `"OrbitonCX Support" <${process.env.EMAIL}>`, 
    to: email,
    subject: subject,
    text: text, 
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