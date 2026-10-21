import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

// Registro de pagos. Nunca se guardan datos de tarjeta: solo método, monto y referencia.
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isIn: [['card', 'pse']] }
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'aprobado',
    validate: { isIn: [['aprobado', 'rechazado', 'reembolsado']] }
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  timestamps: true
});

export default Payment;
