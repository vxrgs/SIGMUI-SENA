import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const SESSION_COOKIE = "sigmui_session";
export const ROLE_ADMIN = "Administrador";
export const ROLE_CITIZEN = "Ciudadano";

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 horas

// El secreto se lee de forma perezosa para que dotenv ya haya cargado el .env.
// En producción es obligatorio: sin él cualquiera podría falsificar sesiones.
let warnedDevSecret = false;
const getSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET es obligatorio en producción. Defínelo en el .env.");
  }
  if (!warnedDevSecret) {
    console.warn("⚠️  JWT_SECRET no definido: usando una clave de desarrollo.");
    warnedDevSecret = true;
  }
  return "sigmui-dev-secret";
};

// Verifica al arrancar que la configuración de sesión es válida
export const assertAuthConfig = () => getSecret();

// Crea la cookie de sesión. Solo guarda el id: nombre, rol y estado se leen de la BD
// en cada petición, así un cambio de rol o una desactivación aplican de inmediato.
export function issueSession(res, user) {
  const token = jwt.sign({ id: user.id }, getSecret(), { expiresIn: "8h" });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE);
}

// Lee la sesión y expone `req.user` y `res.locals.user` a las vistas Pug
export async function loadUser(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  req.user = null;

  if (token) {
    try {
      const { id } = jwt.verify(token, getSecret());
      const dbUser = await User.findByPk(id);

      if (dbUser && dbUser.active) {
        req.user = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          isAdmin: dbUser.role === ROLE_ADMIN,
          avatarUrl: "/img/default-avatar.png",
        };
      } else {
        clearSession(res);
      }
    } catch (error) {
      // Token inválido o expirado
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        clearSession(res);
      } else {
        return next(error);
      }
    }
  }

  res.locals.user = req.user;
  next();
}

const isApi = (req) => req.originalUrl.startsWith("/api/");

// Redirige al login (o responde 401 en la API) si no hay sesión activa
export function requireAuth(req, res, next) {
  if (!req.user) {
    return isApi(req)
      ? res.status(401).json({ success: false, message: "No autenticado." })
      : res.redirect("/auth/login");
  }
  next();
}

// Solo deja pasar a administradores (vistas y APIs de administración)
export function requireAdmin(req, res, next) {
  if (!req.user) return requireAuth(req, res, next);

  if (!req.user.isAdmin) {
    if (isApi(req)) {
      return res.status(403).json({ success: false, message: "Acceso restringido a administradores." });
    }
    return res.status(403).render("pages/errors/forbiddenView", {
      title: "Acceso restringido",
      currentRoute: "",
    });
  }

  next();
}
