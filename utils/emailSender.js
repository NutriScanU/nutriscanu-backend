import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (toEmail, tempPassword, fullName) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

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

  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw new Error('No se pudo enviar el correo de bienvenida');
  }
};

export const sendResetPasswordCodeEmail = async (toEmail, code) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

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
