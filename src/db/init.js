import { Sequelize } from 'sequelize';

// Creamos la conexión a MySQL usando las variables de tu archivo .env
export const sequelize = new Sequelize(
  process.env.DB_NAME || 'parkalia',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false, // Ponlo en true si quieres ver las consultas SQL en la terminal
  }
);

export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('¡Conexión exitosa a la base de datos MySQL!');
    
    // Sincroniza los modelos y crea las tablas automáticamente en MySQL
    await sequelize.sync({ alter: true });
    console.log('¡Tablas sincronizadas correctamente en MySQL!');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos MySQL:', error.message);
    process.exit(1);
  }
};