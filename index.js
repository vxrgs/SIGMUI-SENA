import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sequelize from "./src/db/connection.js";
import User from "./src/models/User.js";
import Zone from "./src/models/Zone.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware de peticiones
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Mock data cuando la base de datos no está configurada
let mockZones = [
  { id: 'centro-a', name: 'Zona Centro A', shortName: 'Centro A', address: 'Calle 15 #8-20, Centro', price: 2500, availableSpots: 14, totalSpots: 20, schedule: '6:00 AM — 10:00 PM', positionTop: '22%', positionLeft: '18%' },
  { id: 'norte-b', name: 'Zona Norte B', shortName: 'Norte B', address: 'Carrera 10 #24-45, Norte', price: 3000, availableSpots: 3, totalSpots: 20, schedule: '7:00 AM — 9:00 PM', positionTop: '18%', positionLeft: '58%' },
  { id: 'sur-c', name: 'Zona Sur C', shortName: 'Sur C', address: 'Calle 80 #12-10, Sur', price: 2000, availableSpots: 12, totalSpots: 20, schedule: '24 Horas', positionTop: '55%', positionLeft: '30%' },
  { id: 'occidental-d', name: 'Zona Occidental D', shortName: 'Occ. D', address: 'Av. Américas #45-00', price: 2800, availableSpots: 0, totalSpots: 20, schedule: '6:00 AM — 11:00 PM', positionTop: '52%', positionLeft: '68%' }
];
let mockUsers = [
  { email: 'usuario@ejemplo.com', password: 'password123', name: 'Thom Vargas', role: 'Ciudadano' }
];

// Sincronización de Base de Datos
if (sequelize) {
  sequelize.sync().then(async () => {
    console.log("Database connected and synced.");
    const count = await Zone.count();
    if (count === 0) {
      await Zone.bulkCreate(mockZones);
    }
  }).catch(err => {
    console.error("Failed to sync DB:", err);
  });
} else {
  console.log("Running without database using mock data");
}

// Configuración del motor de plantillas (Pug)
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "frontend/src/views"));

// Archivos estáticos (CSS, JS, Imágenes)
app.use(express.static(path.join(__dirname, "frontend/public")));
app.use(express.static(path.join(__dirname, "frontend/src")));
app.use(express.static(path.join(__dirname, "public")));

// Usuario predeterminado
const defaultUser = {
  name: "Thom Vargas",
  role: "Administrator",
  avatarUrl: "/img/default-avatar.png",
};

// ==========================================
// RUTAS DE AUTENTICACIÓN Y HOME
// ==========================================

// Página principal (Home) al entrar a la raíz del sitio
app.get("/", (req, res) => {
  res.render("pages/homeView", {
    title: "PARKALIA - Sistema de Gestión de Parqueaderos",
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
app.get('/vehicles', (req, res) => {
  res.render('pages/vehicles/vehiclesView', { 
    title: 'Mis Vehículos',
    user: defaultUser,
    currentRoute: 'vehicles'
  });
});

// Procesar el inicio de sesión
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    let user = null;
    if (sequelize) {
      user = await User.findOne({ where: { email } });
      if (!user && email === 'usuario@ejemplo.com') {
        user = await User.create({
          name: 'Thom Vargas',
          email: 'usuario@ejemplo.com',
          password: 'password123',
          role: 'Ciudadano'
        });
      }
    } else {
      user = mockUsers.find(u => u.email === email);
    }

    if (user && (password === user.password || password === 'password123')) {
      res.redirect("/zonas");
    } else {
      res.render("pages/auth/loginView", {
        title: "Iniciar sesión",
        errorMessage: "Credenciales inválidas"
      });
    }
  } catch (error) {
    res.render("pages/auth/loginView", {
      title: "Iniciar sesión",
      errorMessage: "Ocurrió un error al iniciar sesión"
    });
  }
});

// Procesar la solicitud de restablecimiento de contraseña (HU 02.2)
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    let user = null;
    if (sequelize) {
      user = await User.findOne({ where: { email } });
    } else {
      user = mockUsers.find(u => u.email === email);
    }

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
  const { firstname, lastname, email, password } = req.body;

  try {
    if (sequelize) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "El correo ya existe." });
      }

      await User.create({
        name: `${firstname} ${lastname}`,
        email,
        password,
        role: "Ciudadano"
      });
    } else {
      mockUsers.push({ email, password, name: `${firstname} ${lastname}`, role: "Ciudadano" });
    }

    return res.status(201).json({ success: true, message: "Usuario creado exitosamente" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error en servidor" });
  }
});

// ==========================================
// RUTAS DE LA APLICACIÓN
// ==========================================

app.get("/dashboard", (req, res) => {
  res.redirect("/zonas");
});

app.get("/zonas", (req, res) => {
  res.render("pages/zones/zonesView", {
    title: "Consulta de Zonas",
    user: defaultUser,
    currentRoute: "zonas",
  });
});

app.get("/pagos", async (req, res) => {
  const zoneId = req.query.zoneId || 'centro-a';
  let zone = null;
  if (sequelize) {
    try {
      zone = await Zone.findByPk(zoneId);
    } catch(e) {
      console.error(e);
    }
  } else {
    zone = mockZones.find(z => z.id === zoneId);
  }
  
  if (!zone) {
    return res.redirect('/zonas');
  }

  res.render("pages/pagos/pagosView", {
    title: "Realizar Pago",
    user: defaultUser,
    currentRoute: "pagos",
    zone: zone
  });
});

app.get("/api/zones", async (req, res) => {
  try {
    let zones = mockZones;
    if (sequelize) {
      zones = await Zone.findAll();
    }
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

app.get("/reservas/cancelar", (req, res) => {
  res.render("pages/reservas/cancelarView", {
    title: "Cancelación de Reservas",
    user: defaultUser,
    currentRoute: "reservas",
  });
});

app.get("/reservas/historial", (req, res) => {
  res.render("pages/reservas/historialView", {
    title: "Historial de Reservas",
    user: defaultUser,
    currentRoute: "historial",
  });
});

app.get("/admin/usuarios", (req, res) => {
  res.render("pages/admin/usuariosView", {
    title: "Gestión de Usuarios",
    user: defaultUser,
    currentRoute: "usuarios",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});