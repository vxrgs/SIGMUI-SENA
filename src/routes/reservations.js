import { Router } from "express";
import { Op } from "sequelize";
import crypto from "crypto";
import sequelize from "../db/connection.js";
import { Zone, Vehicle, Reservation, Payment } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";

// Reservas y pagos del usuario en sesión.
// requireAuth se aplica por ruta (no con router.use) porque este router se monta en /api
// y no debe bloquear las rutas públicas de /api (registro, zonas).
const router = Router();

const HOUR_MS = 60 * 60 * 1000;
const PAYMENT_METHODS = ["card", "pse"];

function serialize(reservation, zoneName) {
  const expired = reservation.endsAt <= new Date();
  return {
    id: reservation.id,
    code: reservation.code,
    zoneId: reservation.zoneId,
    zone: zoneName ?? reservation.Zone?.name ?? "—",
    vehicle: reservation.vehiclePlate,
    startsAt: reservation.startsAt,
    endsAt: reservation.endsAt,
    hours: reservation.hours,
    amount: reservation.amount,
    status: reservation.status,
    expired,
    canCancel: reservation.status !== "cancelada" && !expired,
  };
}

// Historial del usuario
router.get("/reservations", requireAuth, async (req, res) => {
  const reservations = await Reservation.findAll({
    where: { userId: req.user.id },
    include: [{ model: Zone, attributes: ["name"] }],
    order: [["createdAt", "DESC"]],
  });
  res.json({ success: true, reservations: reservations.map((r) => serialize(r)) });
});

// Reservar y pagar en un solo paso. Todo ocurre en una transacción: si algo falla,
// no queda ni reserva, ni pago, ni cupo descontado.
router.post("/payments", requireAuth, async (req, res) => {
  const hours = Number(req.body.hours);
  const method = req.body.method;

  if (!Number.isInteger(hours) || hours < 1 || hours > 24) {
    throw new HttpError(400, "La duración debe ser de 1 a 24 horas.");
  }
  if (!PAYMENT_METHODS.includes(method)) {
    throw new HttpError(400, "Método de pago no válido.");
  }

  const result = await sequelize.transaction(async (transaction) => {
    const zone = await Zone.findByPk(String(req.body.zoneId || ""), { transaction });
    if (!zone) throw new HttpError(404, "Zona no encontrada.");

    const vehicle = await Vehicle.findOne({
      where: { id: Number(req.body.vehicleId) || 0, userId: req.user.id },
      transaction,
    });
    if (!vehicle) throw new HttpError(400, "Selecciona uno de tus vehículos.");

    const active = await Reservation.findOne({
      where: {
        vehicleId: vehicle.id,
        status: { [Op.in]: ["pendiente", "pagada"] },
        endsAt: { [Op.gt]: new Date() },
      },
      transaction,
    });
    if (active) throw new HttpError(409, `El vehículo ${vehicle.plate} ya tiene una reserva activa.`);

    // Descuento atómico del cupo: solo avanza si todavía quedan cupos
    const [taken] = await Zone.update(
      { availableSpots: sequelize.literal("availableSpots - 1") },
      { where: { id: zone.id, availableSpots: { [Op.gt]: 0 } }, transaction }
    );
    if (!taken) throw new HttpError(409, "Esta zona ya no tiene cupos disponibles.");

    // El monto lo calcula el servidor con la tarifa vigente, nunca el navegador
    const amount = zone.price * hours;
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + hours * HOUR_MS);

    const reservation = await Reservation.create(
      {
        userId: req.user.id,
        zoneId: zone.id,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.plate,
        hours,
        amount,
        startsAt,
        endsAt,
        status: "pagada",
      },
      { transaction }
    );

    const payment = await Payment.create(
      {
        reservationId: reservation.id,
        userId: req.user.id,
        method,
        amount,
        status: "aprobado",
        reference: `PAY-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      },
      { transaction }
    );

    return { reservation, payment, zone };
  });

  res.status(201).json({
    success: true,
    message: "Pago aprobado y reserva confirmada.",
    reservation: serialize(result.reservation, result.zone.name),
    reference: result.payment.reference,
  });
});

// Cancelar una reserva y liberar el cupo
router.post("/reservations/:id/cancel", requireAuth, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  const reservation = await sequelize.transaction(async (transaction) => {
    const found = Number.isInteger(id)
      ? await Reservation.findOne({ where: { id, userId: req.user.id }, transaction })
      : null;
    if (!found) throw new HttpError(404, "Reserva no encontrada.");
    if (found.status === "cancelada") throw new HttpError(409, "Esta reserva ya fue cancelada.");
    if (found.endsAt <= new Date()) throw new HttpError(409, "No puedes cancelar una reserva expirada o ya utilizada.");

    await found.update({ status: "cancelada" }, { transaction });

    // Devuelve el cupo sin pasar nunca del total de la zona
    await Zone.update(
      { availableSpots: sequelize.literal("availableSpots + 1") },
      { where: { id: found.zoneId, availableSpots: { [Op.lt]: sequelize.col("totalSpots") } }, transaction }
    );

    return found;
  });

  const zone = await Zone.findByPk(reservation.zoneId);
  res.json({
    success: true,
    message: "Reserva cancelada. El cupo fue liberado.",
    reservation: serialize(reservation, zone?.name),
  });
});

export default router;
