import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { Router } from 'express';
import { param } from 'express-validator';

import pool from '../config/db.js';
import UsuarioCrearDTO from '../dto/usuario.crear.dto.js';
import UsuarioObtenerDTO from '../dto/usuario.obtener.dto.js';
import manejadorErroresValidacion from '../validaciones/manejador-errores.validaciones.js';
import usuarioCrearValidaciones from '../validaciones/usuario.crear.validaciones.js';

const usuariosRouter = Router();
const scrypt = promisify(scryptCallback);

// Guarda contraseñas con una sal aleatoria; el texto original nunca se persiste.
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

// Devuelve un usuario sin seleccionar ni exponer la columna de contraseña.
usuariosRouter.get(
  '/:id',
  param('id').isInt({ min: 1 }).withMessage('El identificador debe ser un entero positivo'),
  manejadorErroresValidacion,
  async (req, res, next) => {
    try {
      const [usuarios] = await pool.execute(
        'SELECT id, DPI AS dpi, nombre, email, telefono, activo, creado_en FROM usuarios WHERE id = ?',
        [req.params.id]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const usuario = new UsuarioObtenerDTO(usuarios[0]);
      return res.json(usuario.data);
    } catch (error) {
      return next(error);
    }
  }
);

// Valida y transforma los datos antes de crear la fila del usuario.
usuariosRouter.post(
  '/',
  usuarioCrearValidaciones,
  manejadorErroresValidacion,
  async (req, res, next) => {
    try {
      const usuario = new UsuarioCrearDTO(req.body);
      const contrasenaHash = await hashPassword(usuario.contrasena);
      const [resultado] = await pool.execute(
        'INSERT INTO usuarios (DPI, nombre, email, telefono, contrasena) VALUES (?, ?, ?, ?, ?)',
        [
          usuario.identificacion,
          usuario.nombre,
          usuario.email,
          usuario.telefono,
          contrasenaHash
        ]
      );

      return res.status(201).json({
        id: resultado.insertId,
        mensaje: 'Usuario registrado con éxito.'
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default usuariosRouter;
