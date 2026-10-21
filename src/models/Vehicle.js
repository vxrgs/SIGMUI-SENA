import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Placa normalizada: mayúsculas, sin espacios ni guiones (ej. ABC123)
  plate: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true
});

export default Vehicle;
