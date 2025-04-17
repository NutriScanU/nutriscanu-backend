import nodemailer from 'nodemailer';

export const sendResetPasswordEmail = async (toEmail, fullName, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const resetLink = `https://nutriscanu.com/reset-password/${token}`;

  const mailOptions = {
    from: `"NutriScanU 🔐" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Restablece tu contraseña',
    html: `
      <h2>Restablece tu contraseña</h2>
      <p>Hola <strong>${fullName}</strong>, hemos recibido una solicitud para cambiar tu contraseña.</p>

      <a href="${resetLink}" style="
        display: inline-block;
        background-color: #4CAF50;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        margin-top: 10px;
      ">Cambia tu contraseña</a>

      <p style="margin-top: 20px;">
        O accede con este enlace directo:<br/>
        <a href="${resetLink}">${resetLink}</a>
      </p>

      <p style="margin-top: 30px; color: #999;">
        Si no solicitaste el cambio de contraseña, ignora este correo o comunícate con nuestro centro de ayuda.
      </p>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`📨 Correo con enlace enviado a ${toEmail}`);
};
