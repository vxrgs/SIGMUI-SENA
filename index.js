import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { Op } from "sequelize";
import { initDatabase } from "./src/db/init.js";
import { User, Zone } from "./src/models/index.js";
import {
  issueSession,
  clearSession,
  loadUser,
  requireAuth,
  requireAdmin,
  assertAuthConfig,
} from "./src/middleware/auth.js";
import { HttpError } from "./src/utils/httpError.js";
import { hashPassword, verifyPassword, isHashed, isStrongPassword } from "./src/utils/password.js";
import vehiclesRouter from "./src/routes/vehicles.js";
import reservationsRouter from "./src/routes/reservations.js";
import adminUsersRouter from "./src/routes/adminUsers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

// Middleware de peticiones
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Configuración del motor de plantillas (Pug)
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "frontend/src/views"));

// Archivos estáticos (CSS, JS, Imágenes)
app.use(express.static(path.join(__dirname, "frontend/public")));
app.use(express.static(path.join(__dirname, "frontend/src")));
app.use(express.static(path.join(__dirname, "public")));

// Sesión: expone `user` (nombre, correo, rol, isAdmin) a todas las vistas
app.use(loadUser);

// ==========================================
// RUTAS DE AUTENTICACIÓN Y HOME
// ==========================================

// Página principal (Home) al entrar a la raíz del sitio
app.get("/", (req, res) => {
  res.render("pages/home/homeView", {
    title: "PARKALIA - Sistema de Gestión de Parqueaderos"
  });
});

// Renderizar la pantalla de inicio de sesión (HU 02.1)
app.get("/auth/login", (req, res) => {
  res.render("pages/auth/loginView", {
    title: "Iniciar sesión",
  });
});

// Renderizar la pantalla de registro (HU 01)
app.get("/auth/register", (req, res) => {
  res.render("pages/auth/registerView", {
    title: "Crear cuenta",
  });
});

// Renderizar la pantalla de verificación de código (HU 02.2)
app.get("/auth/forgot-password", (req, res) => {
  res.render("pages/auth/forgotPasswordView", {
    title: "Olvidaste tu contraseña",
  });
});

// Renderizar la pantalla de verificación (HU 02.3)
app.get("/auth/verify-code", (req, res) => {
  res.render("pages/auth/verifyCodeView", {
    title: "Verificar código",
  });
});

// Renderizar la pantalla de nueva contraseña
app.get("/auth/new-password", (req, res) => {
  res.render("pages/auth/newPasswordView", {
    title: "Nueva Contraseña",
  });
});

// Renderizar la pantalla de Mis Vehículos
app.get('/vehicles', requireAuth, (req, res) => {
  res.render('pages/vehicles/vehiclesView', { 
    title: 'Mis Vehículos',
    currentRoute: 'vehicles'
  });
});

// Procesar el inicio de sesión
app.post("/auth/login", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  const renderError = (errorMessage) =>
    res.render("pages/auth/loginView", { title: "Iniciar sesión", errorMessage });

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await verifyPassword(password, user.password))) {
      return renderError("Credenciales inválidas");
    }
    if (!user.active) {
      return renderError("Tu cuenta está desactivada. Contacta a un administrador.");
    }

    // Migración transparente: contraseñas antiguas en texto plano pasan a bcrypt
    if (!isHashed(user.password)) {
      await user.update({ password: await hashPassword(password) });
    }

    issueSession(res, user);
    res.redirect("/zonas");
  } catch (error) {
    console.error(error);
    renderError("Ocurrió un error al iniciar sesión");
  }
});

// Procesar la solicitud de restablecimiento de contraseña (HU 02.2)
app.post("/auth/forgot-password", async (req, res) => {
  const email = normalizeEmail(req.body.email);

  try {
    // Respuesta idéntica exista o no el correo, para no revelar qué cuentas existen
    await User.findOne({ where: { email } });

    res.render("pages/auth/forgotPasswordView", {
      title: "Olvidaste tu contraseña",
      successMessage: "Si el correo existe en el sistema, enviamos el enlace de restablecimiento."
    });
  } catch (error) {
    res.render("pages/auth/forgotPasswordView", {
      title: "Olvidaste tu contraseña",
      errorMessage: "Ocurrió un error al procesar la solicitud."
    });
  }
});

// API para procesar el registro de usuario
app.post("/api/auth/register", async (req, res) => {
  const firstname = String(req.body.firstname || "").trim();
  const lastname = String(req.body.lastname || "").trim();
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!firstname || !lastname || !EMAIL_RE.test(email) || !isStrongPassword(password)) {
    return res.status(400).json({ success: false, message: "Datos de registro inválidos." });
  }

  try {
    if (await User.findOne({ where: { email } })) {
      return res.status(400).json({ success: false, message: "El correo ya existe." });
    }

    // El rol nunca viene del cliente: todo registro público es Ciudadano
    await User.create({
      name: `${firstname} ${lastname}`,
      email,
      password: await hashPassword(password),
      role: "Ciudadano"
    });

    return res.status(201).json({ success: true, message: "Usuario creado exitosamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error en servidor" });
  }
});

// Cerrar sesión
app.post("/auth/logout", (req, res) => {
  clearSession(res);
  res.redirect("/auth/login");
});

// ==========================================
// RUTAS DE LA APLICACIÓN
// ==========================================

app.get("/dashboard", (req, res) => {
  res.redirect("/zonas");
});

app.get("/zonas", requireAuth, (req, res) => {
  res.render("pages/zones/zonesView", {
    title: "Consulta de Zonas",
    currentRoute: "zonas",
  });
});

app.get("/pagos", requireAuth, async (req, res) => {
  const zone = await Zone.findByPk(String(req.query.zoneId || 'centro-a'));

  if (!zone) {
    return res.redirect('/zonas');
  }

  res.render("pages/pagos/pagosView", {
    title: "Realizar Pago",
    currentRoute: "pagos",
    zone: zone
  });
});

app.get("/api/zones", async (req, res) => {
  try {
    res.json(await Zone.findAll());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

app.get("/reservas/cancelar", requireAuth, (req, res) => {
  res.render("pages/reservas/cancelarView", {
    title: "Cancelación de Reservas",
    currentRoute: "reservas",
  });
});

app.get("/reservas/historial", requireAuth, (req, res) => {
  res.render("pages/reservas/historialView", {
    title: "Historial de Reservas",
    currentRoute: "historial",
  });
});

// Solo administradores
app.get("/admin/usuarios", requireAdmin, (req, res) => {
  res.render("pages/admin/usuariosView", {
    title: "Gestión de Usuarios",
    currentRoute: "usuarios",
  });
});

// ==========================================
// CONFIGURACIÓN
// ==========================================

app.get("/configuracion", requireAuth, async (req, res) => {
  // Las tarifas por zona solo se cargan para administradores
  const zones = req.user.isAdmin ? await Zone.findAll({ raw: true }) : [];

  res.render("pages/configuracion/configuracionView", {
    title: "Configuración",
    currentRoute: "configuracion",
    zones,
  });
});

// Actualizar perfil (nombre y correo)
app.put("/api/settings/profile", requireAuth, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);

  if (name.length < 2 || name.length > 80) {
    throw new HttpError(400, "El nombre debe tener entre 2 y 80 caracteres.");
  }
  if (!EMAIL_RE.test(email)) {
    throw new HttpError(400, "Correo electrónico inválido.");
  }

  const user = await User.findByPk(req.user.id);
  if (await User.findOne({ where: { email, id: { [Op.ne]: user.id } } })) {
    throw new HttpError(409, "Ese correo ya está en uso.");
  }

  await user.update({ name, email });
  res.json({ success: true, message: "Perfil actualizado correctamente." });
});

// Cambiar contraseña
app.put("/api/settings/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!isStrongPassword(newPassword)) {
    throw new HttpError(400, "La nueva contraseña debe tener mínimo 8 caracteres, con letras y números.");
  }

  const user = await User.findByPk(req.user.id);
  if (!(await verifyPassword(currentPassword, user.password))) {
    throw new HttpError(400, "La contraseña actual es incorrecta.");
  }
  if (newPassword === currentPassword) {
    throw new HttpError(400, "La nueva contraseña debe ser distinta a la actual.");
  }

  await user.update({ password: await hashPassword(newPassword) });
  res.json({ success: true, message: "Contraseña actualizada correctamente." });
});

// Actualizar tarifas y horarios de las zonas (solo administradores)
app.put("/api/admin/zones", requireAdmin, async (req, res) => {
  const updates = Array.isArray(req.body.zones) ? req.body.zones : [];

  const invalid = updates.some(z =>
    typeof z.id !== "string" ||
    !Number.isFinite(z.price) || z.price < 0 ||
    typeof z.schedule !== "string" || !z.schedule.trim()
  );
  if (updates.length === 0 || invalid) {
    throw new HttpError(400, "Datos de zonas inválidos.");
  }

  for (const { id, price, schedule } of updates) {
    await Zone.update({ price: Math.round(price), schedule: schedule.trim() }, { where: { id } });
  }
  res.json({ success: true, message: "Tarifas y horarios actualizados correctamente." });
});

// ==========================================
// API: VEHÍCULOS, RESERVAS/PAGOS Y USUARIOS
// ==========================================

app.use("/api/vehicles", vehiclesRouter);
app.use("/api", reservationsRouter);
app.use("/api/admin/users", adminUsersRouter);

// ==========================================
// MANEJO DE ERRORES
// ==========================================

app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err.name === "SequelizeUniqueConstraintError") {
    status = 409;
    message = "Ya existe un registro con esos datos.";
  } else if (err.name === "SequelizeValidationError") {
    status = 400;
    message = err.errors?.[0]?.message || "Datos inválidos.";
  } else if (!(err instanceof HttpError)) {
    console.error(err);
    status = 500;
    message = "Error en servidor.";
  }

  if (req.originalUrl.startsWith("/api/")) {
    return res.status(status).json({ success: false, message });
  }
  res.status(status).send(message);
});

// ==========================================
// ARRANQUE
// ==========================================

try {
  assertAuthConfig();
  await initDatabase();
} catch (error) {
  console.error("No se pudo iniciar la aplicación:", error.message);
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});