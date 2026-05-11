import axios from "axios";
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
    !process.env.BREVO_API_KEY ||
    !process.env.BREVO_SENDER_EMAIL
  ) {
    console.error("Missing Brevo API Credentials");
    return false;
  }

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "OrbitOnCX Support",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: subject,
        htmlContent: htmlContent || `<b>${text}</b>`,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Email sent successfully:", response.data);

    return true;
  } catch (error) {
    console.error(
      "Brevo API Email Error:",
      error.response?.data || error.message
    );

    return false;
  }
};