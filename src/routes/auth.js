import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { sendVerificationEmail } from "../utils/mailer.js"; // Nuestro cartero

const router = Router();

// Ruta para procesar el registro
router.post("/register", async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    // 1. Verificamos si el correo ya existe
    const existeUsuario = await User.findOne({ where: { email: correo } });
    if (existeUsuario) {
      return res.status(400).json({ success: false, message: "El correo ya está registrado." });
    }

    // 2. Ciframos la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Creamos el usuario inactivo (active: false)
    const nuevoUsuario = await User.create({
      name: nombre,
      email: correo,
      password: hashedPassword,
      role: "Ciudadano", // Rol por defecto
      active: false,      // Inactivo hasta que verifique su correo
    });

    // 4. Creamos un token temporal para el correo (expira en 1 día)
    const token = jwt.sign({ id: nuevoUsuario.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // 5. ¡Llamamos al cartero para que envíe el correo a Mailtrap!
    await sendVerificationEmail(correo, nombre, token);

    return res.status(201).json({
      success: true,
      message: "¡Registro exitoso! Revisa tu bandeja en Mailtrap para verificar tu cuenta.",
    });

  } catch (error) {
    console.error("Error en el registro:", error);
    return res.status(500).json({ success: false, message: "Error interno en el servidor." });
  }
});

export default router;