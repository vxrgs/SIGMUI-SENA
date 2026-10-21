import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

// Un hash bcrypt siempre empieza por $2a$, $2b$ o $2y$
export const isHashed = (value) => /^\$2[aby]\$/.test(value || "");

// Compara una contraseña con lo guardado. Acepta contraseñas antiguas en texto plano
// (bases creadas antes del cifrado) para poder migrarlas en el siguiente login.
export async function verifyPassword(plain, stored) {
  if (typeof plain !== "string" || !stored) return false;
  return isHashed(stored) ? bcrypt.compare(plain, stored) : plain === stored;
}

// Entre 8 y 72 caracteres (límite de bcrypt), con al menos una letra y un número
export const isStrongPassword = (value) =>
  typeof value === "string" && value.length >= 8 && value.length <= 72 && /[A-Za-z]/.test(value) && /\d/.test(value);
