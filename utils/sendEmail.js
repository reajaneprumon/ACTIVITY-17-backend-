const nodemailer = require("nodemailer");

module.exports = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "prumonreajane@gmail.com",
      pass: "jiwbidxsvsrqvvyq"
    }
  });

  await transporter.sendMail({
    from: "System",
    to,
    subject,
    html
  });
};