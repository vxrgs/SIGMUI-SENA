import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // Hash bcrypt (nunca texto plano)
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Ciudadano',
    validate: { isIn: [['Ciudadano', 'Administrador']] }
  },
  // Un usuario desactivado no puede iniciar sesión
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true
});

export default User;
