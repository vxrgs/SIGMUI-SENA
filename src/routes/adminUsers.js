import { Router } from "express";
import { Op } from "sequelize";
import { User, Reservation } from "../models/index.js";
import { requireAdmin } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";

// Gestión de usuarios (solo administradores)
const router = Router();
router.use(requireAdmin);

const ROLES = ["Ciudadano", "Administrador"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const serialize = (user, reservas, currentId) => ({
  id: user.id,
  nombre: user.name,
  correo: user.email,
  rol: user.role,
  fecha: user.createdAt,
  reservas,
  estado: user.active ? "activo" : "inactivo",
  esActual: user.id === currentId,
});

async function findTarget(req) {
  const id = Number.parseInt(req.params.id, 10);
  const user = Number.isInteger(id) ? await User.findByPk(id) : null;
  if (!user) throw new HttpError(404, "Usuario no encontrado.");
  return user;
}

router.get("/", async (req, res) => {
  const [users, counts] = await Promise.all([
    User.findAll({ order: [["createdAt", "ASC"]] }),
    Reservation.count({ group: ["userId"] }),
  ]);
  const byUser = new Map(counts.map((c) => [c.userId, c.count]));

  res.json({
    success: true,
    users: users.map((u) => serialize(u, byUser.get(u.id) || 0, req.user.id)),
  });
});

router.put("/:id", async (req, res) => {
  const user = await findTarget(req);

  const name = String(req.body.nombre || "").trim();
  const email = String(req.body.correo || "").trim().toLowerCase();
  const role = req.body.rol;
  const active = req.body.estado === "activo";

  if (name.length < 2 || name.length > 80) throw new HttpError(400, "El nombre debe tener entre 2 y 80 caracteres.");
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Correo electrónico inválido.");
  if (!ROLES.includes(role)) throw new HttpError(400, "Rol no válido.");
  if (!["activo", "inactivo"].includes(req.body.estado)) throw new HttpError(400, "Estado no válido.");

  // Evita que el único administrador se quite el acceso a sí mismo
  if (user.id === req.user.id && (role !== user.role || !active)) {
    throw new HttpError(400, "No puedes cambiar tu propio rol ni desactivar tu propia cuenta.");
  }

  if (await User.findOne({ where: { email, id: { [Op.ne]: user.id } } })) {
    throw new HttpError(409, "Ese correo ya está en uso.");
  }

  await user.update({ name, email, role, active });
  const reservas = await Reservation.count({ where: { userId: user.id } });
  res.json({ success: true, message: "Usuario actualizado.", user: serialize(user, reservas, req.user.id) });
});

router.delete("/:id", async (req, res) => {
  const user = await findTarget(req);
  if (user.id === req.user.id) throw new HttpError(400, "No puedes eliminar tu propia cuenta.");

  // Sus vehículos, reservas y pagos se eliminan en cascada (ver models/index.js)
  await user.destroy();
  res.json({ success: true, message: "Usuario eliminado." });
});

export default router;
