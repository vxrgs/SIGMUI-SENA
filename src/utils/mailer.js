import nodemailer from 'nodemailer';
import pug from 'pug';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para manejar rutas en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Creamos el cartero (transporter) usando las credenciales del .env
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. Función para enviar el correo de verificación usando Pug y Tailwind
export const sendVerificationEmail = async (to, name, token) => {
  try {
    // Ruta desde 'src/utils/' hacia tu archivo verify.pug en 'frontend/src/views/emails/'
    const templatePath = path.join(__dirname, '../../frontend/src/views/emails/verify.pug');
    
    // El enlace que abrirá el usuario al hacer clic en el botón del correo
    const verificationUrl = `http://localhost:3000/auth/verify?token=${token}`;

    // Compilamos la plantilla Pug a HTML pasándole el nombre y el link
    const htmlContent = pug.renderFile(templatePath, {
      name,
      verificationUrl,
    });

    // Enviamos el correo interceptado por Mailtrap
    const info = await transporter.sendMail({
      from: '"Parkalia" <no-reply@parkalia.com>',
      to,
      subject: 'Confirma tu cuenta en Parkalia',
      html: htmlContent, // Aquí viaja el diseño con Tailwind
    });

    console.log('¡Correo de verificación enviado con éxito! ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error detallado al enviar el correo:', error);
    return false;
  }
};