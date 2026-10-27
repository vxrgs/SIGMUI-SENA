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

console.log('[DEBUG] Starting setup...');

try {
  assertAuthConfig();
  await initDatabase();
} catch (error) {
  console.error("No se pudo iniciar la aplicación:", error.message);
  process.exit(1);
}

console.log('[DEBUG] About to listen...');

const server = app.listen(3001, "0.0.0.0", () => {
  console.log('[DEBUG] Listen callback fired');
  console.log('[DEBUG] Active handles:', process._getActiveHandles().length);
  console.log('[DEBUG] Server listening:', server.listening);
});

console.log('[DEBUG] app.listen() called, server.listening:', server.listening);

process.on('exit', (code) => {
  console.log('[DEBUG] Process exit event with code:', code);
});

process.on('beforeExit', (code) => {
  console.log('[DEBUG] Process beforeExit event with code:', code);
  console.log('[DEBUG] Active handles at beforeExit:', process._getActiveHandles().length);
});

