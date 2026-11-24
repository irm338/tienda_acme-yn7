// Carga las variables de entorno también cuando la aplicación se importa en pruebas.
import 'dotenv/config';

import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import productosRouter from './routes/productos.router.js';
import usuariosRouter from './routes/usuarios.router.js';

const app = express();
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const publicDirectory = join(currentDirectory, 'public');

// Reduce la información de implementación expuesta y limita el tamaño de las solicitudes.
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

// Publica las rutas de la API bajo prefijos estables.
app.use('/productos', productosRouter);
app.use('/usuarios', usuariosRouter);

// Sirve la interfaz web desde la carpeta pública del proyecto.
app.use(express.static(publicDirectory));

// Responde de forma consistente cuando la ruta solicitada no existe.
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Centraliza errores de validación, base de datos y análisis del cuerpo HTTP.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode
    || (error.type === 'entity.parse.failed' ? 400 : null)
    || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);

  if (statusCode >= 500) {
    console.error('Error interno del servidor:', error);
  }

  const response = {
    error: statusCode === 500
      ? 'Error interno del servidor'
      : error.message || 'Solicitud no válida'
  };

  if (error.details) {
    response.errores = error.details;
  }

  res.status(statusCode).json(response);
});

export default app;
