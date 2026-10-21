import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

export const RESERVATION_STATUSES = ['pendiente', 'pagada', 'cancelada'];

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Código visible para el usuario (PRK-001). Se calcula con el id, no se guarda.
  code: {
    type: DataTypes.VIRTUAL,
    get() {
      return `PRK-${String(this.getDataValue('id') || 0).padStart(3, '0')}`;
    }
  },
  hours: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endsAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  // Copia de la placa: el historial se conserva aunque se borre el vehículo
  vehiclePlate: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pendiente',
    validate: { isIn: [RESERVATION_STATUSES] }
  }
}, {
  timestamps: true
});

export default Reservation;
