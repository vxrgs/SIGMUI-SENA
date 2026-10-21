import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MySQL cuando el .env tiene DB_HOST y DB_NAME; si no, SQLite en un archivo local.
// Así el proyecto siempre tiene base de datos real (y persistente), incluso sin configurar MySQL.
export const usingMysql = Boolean(process.env.DB_HOST && process.env.DB_NAME);

let sequelize;

if (usingMysql) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
    }
  );
} else {
  const storage = process.env.DB_STORAGE
    ? path.resolve(process.env.DB_STORAGE)
    : path.resolve(__dirname, '../../data/sigmui.sqlite');

  fs.mkdirSync(path.dirname(storage), { recursive: true });

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
  });
}

export default sequelize;
