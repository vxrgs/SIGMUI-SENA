import User from './User.js';
import Zone from './Zone.js';
import Vehicle from './Vehicle.js';
import Reservation from './Reservation.js';
import Payment from './Payment.js';

// Relaciones. El borrado en cascada se aplica en la propia base de datos:
//  - Borrar un usuario borra sus vehículos, reservas y pagos.
//  - Borrar un vehículo NO borra el historial: la reserva queda con vehicleId = NULL
//    (la placa se conserva en Reservation.vehiclePlate).
//  - Una zona con reservas no se puede borrar (RESTRICT).
User.hasMany(Vehicle, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
Vehicle.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false } });

User.hasMany(Reservation, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
Reservation.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false } });

Zone.hasMany(Reservation, { foreignKey: { name: 'zoneId', allowNull: false }, onDelete: 'RESTRICT' });
Reservation.belongsTo(Zone, { foreignKey: { name: 'zoneId', allowNull: false } });

Vehicle.hasMany(Reservation, { foreignKey: { name: 'vehicleId', allowNull: true }, onDelete: 'SET NULL' });
Reservation.belongsTo(Vehicle, { foreignKey: { name: 'vehicleId', allowNull: true } });

Reservation.hasMany(Payment, { foreignKey: { name: 'reservationId', allowNull: false }, onDelete: 'CASCADE' });
Payment.belongsTo(Reservation, { foreignKey: { name: 'reservationId', allowNull: false } });

User.hasMany(Payment, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
Payment.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false } });

export { User, Zone, Vehicle, Reservation, Payment };
