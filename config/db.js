import { createPool } from 'mysql2/promise';

// Falla al iniciar si falta una variable necesaria, en lugar de ocultar el error
// hasta que una solicitud intente consultar la base de datos.
const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PASSWORD'];
const missingVariables = requiredVariables.filter((name) => (
  process.env[name] === undefined
  || (name !== 'DB_PASSWORD' && process.env[name].trim() === '')
));

if (missingVariables.length > 0) {
  throw new Error(`Faltan variables de entorno: ${missingVariables.join(', ')}`);
}

const port = Number(process.env.DB_PORT || 3306);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT debe ser un número entero entre 1 y 65535');
}

// Reutiliza conexiones para atender solicitudes sin abrir una conexión por consulta.
const pool = createPool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

export default pool;