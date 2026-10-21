import sequelize, { usingMysql } from "./connection.js";
import { User, Zone } from "../models/index.js";
import { hashPassword } from "../utils/password.js";

const ZONES = [
  { id: 'centro-a', name: 'Zona Centro A', shortName: 'Centro A', address: 'Calle 15 #8-20, Centro', price: 2500, availableSpots: 14, totalSpots: 20, schedule: '6:00 AM — 10:00 PM', positionTop: '22%', positionLeft: '18%' },
  { id: 'norte-b', name: 'Zona Norte B', shortName: 'Norte B', address: 'Carrera 10 #24-45, Norte', price: 3000, availableSpots: 3, totalSpots: 20, schedule: '7:00 AM — 9:00 PM', positionTop: '18%', positionLeft: '58%' },
  { id: 'sur-c', name: 'Zona Sur C', shortName: 'Sur C', address: 'Calle 80 #12-10, Sur', price: 2000, availableSpots: 12, totalSpots: 20, schedule: '24 Horas', positionTop: '55%', positionLeft: '30%' },
  { id: 'occidental-d', name: 'Zona Occidental D', shortName: 'Occ. D', address: 'Av. Américas #45-00', price: 2800, availableSpots: 0, totalSpots: 20, schedule: '6:00 AM — 11:00 PM', positionTop: '52%', positionLeft: '68%' }
];

const DEMO_USERS = [
  { email: 'usuario@ejemplo.com', password: 'password123', name: 'Thom Vargas', role: 'Ciudadano' },
  { email: 'admin@ejemplo.com', password: 'admin123', name: 'Administrador SIGMUI', role: 'Administrador' }
];

async function ensureUser({ email, password, name, role }) {
  const exists = await User.findOne({ where: { email } });
  if (!exists) {
    await User.create({ email, name, role, password: await hashPassword(password) });
  }
}

async function seed() {
  if ((await Zone.count()) === 0) {
    await Zone.bulkCreate(ZONES);
  }

  // Cuentas de demostración: solo fuera de producción
  if (process.env.NODE_ENV !== 'production') {
    for (const demo of DEMO_USERS) await ensureUser(demo);
  }

  // En producción el primer administrador se crea desde variables de entorno
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await ensureUser({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      name: process.env.ADMIN_NAME || 'Administrador',
      role: 'Administrador'
    });
  }
}

// Conecta, valida y sincroniza el esquema. Lanza error si no se puede conectar.
//   DB_SYNC=safe  (por defecto) crea las tablas que falten, sin tocar las existentes
//   DB_SYNC=alter ajusta las tablas existentes a los modelos (útil en desarrollo)
export async function initDatabase() {
  await sequelize.authenticate();

  const mode = (process.env.DB_SYNC || 'safe').toLowerCase();
  if (mode === 'alter') {
    await sequelize.sync({ alter: true });
  } else {
    await sequelize.sync();
  }

  await seed();

  console.log(
    usingMysql
      ? `Base de datos MySQL conectada (${process.env.DB_HOST}/${process.env.DB_NAME}), sync: ${mode}.`
      : `Base de datos SQLite local lista (${sequelize.options.storage}), sync: ${mode}.`
  );
}
