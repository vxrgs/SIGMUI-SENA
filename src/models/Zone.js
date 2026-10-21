import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

const Zone = sequelize.define('Zone', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shortName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  availableSpots: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSpots: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  schedule: {
    type: DataTypes.STRING,
    allowNull: false
  },
  positionTop: {
    type: DataTypes.STRING
  },
  positionLeft: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true
});

export default Zone;
