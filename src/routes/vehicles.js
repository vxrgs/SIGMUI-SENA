import { Router } from "express";
import { Op } from "sequelize";
import { Vehicle } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";

// CRUD de "Mis Vehículos". Todo está limitado a los vehículos del usuario en sesión.
const router = Router();
router.use(requireAuth);

const normalizePlate = (value) => String(value || "").toUpperCase().replace(/[\s-]/g, "");

const serialize = (v) => ({ id: v.id, plate: v.plate, brand: v.brand, model: v.model, year: v.year });

function parseBody(body) {
  const plate = normalizePlate(body.plate);
  const brand = String(body.brand || "").trim();
  const model = String(body.model || "").trim();
  const year = Number(body.year);

  if (!/^[A-Z0-9]{5,7}$/.test(plate)) throw new HttpError(400, "La placa no es válida (ej. ABC123).");
  if (brand.length < 2 || brand.length > 40) throw new HttpError(400, "La marca debe tener entre 2 y 40 caracteres.");
  if (model.length < 1 || model.length > 40) throw new HttpError(400, "El modelo es obligatorio (máx. 40 caracteres).");
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    throw new HttpError(400, "El año no es válido.");
  }
  return { plate, brand, model, year };
}

async function findOwned(req) {
  const id = Number.parseInt(req.params.id, 10);
  const vehicle = Number.isInteger(id)
    ? await Vehicle.findOne({ where: { id, userId: req.user.id } })
    : null;
  if (!vehicle) throw new HttpError(404, "Vehículo no encontrado.");
  return vehicle;
}

async function assertPlateFree(plate, exceptId = null) {
  const where = { plate };
  if (exceptId) where.id = { [Op.ne]: exceptId };
  if (await Vehicle.findOne({ where })) throw new HttpError(409, "Esa placa ya está registrada.");
}

router.get("/", async (req, res) => {
  const vehicles = await Vehicle.findAll({ where: { userId: req.user.id }, order: [["createdAt", "DESC"]] });
  res.json({ success: true, vehicles: vehicles.map(serialize) });
});

router.post("/", async (req, res) => {
  const data = parseBody(req.body);
  await assertPlateFree(data.plate);
  const vehicle = await Vehicle.create({ ...data, userId: req.user.id });
  res.status(201).json({ success: true, message: "Vehículo registrado.", vehicle: serialize(vehicle) });
});

router.put("/:id", async (req, res) => {
  const vehicle = await findOwned(req);
  const data = parseBody(req.body);
  await assertPlateFree(data.plate, vehicle.id);
  await vehicle.update(data);
  res.json({ success: true, message: "Vehículo actualizado.", vehicle: serialize(vehicle) });
});

router.delete("/:id", async (req, res) => {
  const vehicle = await findOwned(req);
  await vehicle.destroy();
  res.json({ success: true, message: "Vehículo eliminado." });
});

export default router;
