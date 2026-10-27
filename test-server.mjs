import express from 'express';
import { Sequelize } from 'sequelize';

const app = express();

app.get('/', (req, res) => res.send('OK'));

// Simulating what index.js does with top-level await
try {
  // Simulating initDatabase()
  const seq = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  await seq.authenticate();
  await seq.sync();
  console.log('DB ready');
} catch (e) {
  console.error('DB failed:', e.message);
  process.exit(1);
}

app.listen(4556, '0.0.0.0', () => {
  console.log('Listening on 4556');
  console.log('Handles:', process._getActiveHandles().length);
});

