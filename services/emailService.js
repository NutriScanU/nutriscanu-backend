import nodemailer from 'nodemailer';

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Correo para restablecer la contraseña
export const sendResetPasswordEmail = async (toEmail, fullName, token) => {
  // URL dinámica para el restablecimiento de la contraseña
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"NutriScanU 🔐" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Restablece tu contraseña',
    html: `
      <h2>Restablece tu contraseña</h2>
      <p>Hola <strong>${fullName}</strong>, hemos recibido una solicitud para cambiar tu contraseña.</p>
      <a href="${resetLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Cambia tu contraseña</a>
      <p style="margin-top: 20px;">O accede con este enlace directo:<br/>
      <a href="${resetLink}">${resetLink}</a></p>
      <p style="margin-top: 30px; color: #999;">Si no solicitaste el cambio de contraseña, ignora este correo o comunícate con nuestro centro de ayuda.</p>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`📨 Correo con enlace enviado a ${toEmail}`);
};

// Correo para código de restablecimiento de contraseña
export const sendResetPasswordCodeEmail = async (toEmail, code) => {
  const mailOptions = {
    from: `"NutriScanU 🔐" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Tu código para restablecer contraseña',
    html: `
      <h2>Hola,</h2>
      <p>Tu código de recuperación es:</p>
      <h1 style="letter-spacing: 4px;">${code}</h1>
      <p>Este código expirará en 10 minutos.</p>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`📨 Código enviado a ${toEmail}`);
};

// Correo de bienvenida
export const sendWelcomeEmail = async (toEmail, tempPassword, fullName) => {
  const mailOptions = {
    from: `"Equipo Recomendador 👨‍💻" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🎓 Bienvenido a la plataforma',
    html: `
      <h2>Hola ${fullName},</h2>
      <p>Tu cuenta ha sido creada con éxito.</p>
      <p><strong>Contraseña temporal:</strong> ${tempPassword}</p>
      <p>Cuando ingreses por primera vez, se te pedirá que cambies esta contraseña por una personalizada.</p>
      <br/>
      <p>Gracias por formar parte del sistema de recomendación de alimentos 🍽️</p>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Correo enviado a ${toEmail}`);
};

// Correo para código de acceso temporal
export const sendLoginCodeEmail = async (toEmail, fullName, code) => {
  const mailOptions = {
    from: `"NutriScanU 🔑" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Tu código de acceso temporal',
    html: `
      <h2>Hola ${fullName},</h2>
      <p>Te hemos enviado un código de acceso único para iniciar sesión.</p>
      <h1 style="letter-spacing: 4px; color: #4CAF50;">${code}</h1>
      <p>Este código es válido por 10 minutos. Ingresa este código en la pantalla de inicio de sesión.</p>
      <p><strong>Nota importante:</strong> Si no solicitaste este acceso, puedes ignorar este mensaje.</p>
      <p style="margin-top: 30px; color: #999;">Si necesitas asistencia, por favor contáctanos o visita nuestro centro de ayuda.</p>
      <footer style="margin-top: 20px; color: #888; font-size: 12px;">
        <p>NutriScanU - Sistema de Recomendación de Alimentos</p>
        <p>© ${new Date().getFullYear()} Todos los derechos reservados.</p>
      </footer>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`📨 Código de acceso enviado a ${toEmail}`);
};

// Correo de verificación de cambio de email
export const sendEmailChangeVerification = async (toEmail, fullName, token) => {
  const verificationLink = `${process.env.BASE_URL}/verificar-correo?token=${token}`;

  const mailOptions = {
    from: `"NutriScanU 🔄" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Confirma tu nuevo correo electrónico',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Hola ${fullName},</h2>
        <p>Hemos recibido una solicitud para actualizar tu dirección de correo electrónico en <strong>NutriScanU</strong>.</p>
        <p>Haz clic en el siguiente botón para confirmar tu nuevo correo:</p>
        <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0;">Confirmar nuevo correo</a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-word;"><a href="${verificationLink}" style="color: #0066cc;">${verificationLink}</a></p>
        <hr style="margin: 30px 0;" />
        <footer style="font-size: 12px; color: #888;">
          <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
          <p>NutriScanU – Sistema de Recomendación de Alimentos</p>
          <p>© ${new Date().getFullYear()} Todos los derechos reservados.</p>
        </footer>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`📨 Enlace de verificación enviado a ${toEmail}`);
};
