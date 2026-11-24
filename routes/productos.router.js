import { Router } from 'express';

import pool from '../config/db.js';
import manejadorErroresValidacion from '../validaciones/manejador-errores.validaciones.js';
import {
  identificadorProductoValidaciones,
  productoActualizarValidaciones,
  productoCrearValidaciones
} from '../validaciones/producto.validaciones.js';

const productosRouter = Router();
const columnasActualizables = ['codigo', 'nombre', 'descripcion', 'precio', 'activo'];

// Lista los campos públicos de los productos en un orden estable.
productosRouter.get('/', async (req, res, next) => {
  try {
    const [productos] = await pool.query(
      'SELECT id, codigo, nombre, descripcion, precio, activo, creado_en FROM productos ORDER BY id'
    );
    res.json(productos);
  } catch (error) {
    next(error);
  }
});

// Obtiene un producto por identificador y valida la ruta antes de consultar MySQL.
productosRouter.get(
  '/:id',
  identificadorProductoValidaciones,
  manejadorErroresValidacion,
  async (req, res, next) => {
    try {
      const [productos] = await pool.execute(
        'SELECT id, codigo, nombre, descripcion, precio, activo, creado_en FROM productos WHERE id = ?',
        [req.params.id]
      );

      if (productos.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      return res.json(productos[0]);
    } catch (error) {
      return next(error);
    }
  }
);

// Crea un producto únicamente después de validar y normalizar sus datos.
productosRouter.post(
  '/',
  productoCrearValidaciones,
  manejadorErroresValidacion,
  async (req, res, next) => {
    try {
      const { codigo, nombre, descripcion = '', precio, activo = true } = req.body;
      const [resultado] = await pool.execute(
        'INSERT INTO productos (codigo, nombre, descripcion, precio, activo) VALUES (?, ?, ?, ?, ?)',
        [codigo, nombre, descripcion ?? '', precio, activo]
      );

      return res.status(201).json({
        id: resultado.insertId,
        mensaje: 'Producto registrado con éxito.'
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Actualiza solo los campos enviados y permite conservar valores como cero o false.
productosRouter.put(
  '/:id',
  productoActualizarValidaciones,
  manejadorErroresValidacion,
  async (req, res, next) => {
    try {
      const campos = columnasActualizables.filter((campo) => (
        Object.hasOwn(req.body, campo)
      ));
      const asignaciones = campos.map((campo) => `${campo} = ?`).join(', ');
      const valores = campos.map((campo) => req.body[campo]);
      valores.push(req.params.id);

      const [resultado] = await pool.execute(
        `UPDATE productos SET ${asignaciones} WHERE id = ?`,
        valores
      );

      if (resultado.affectedRows === 0) {
        const [productos] = await pool.execute(
          'SELECT id FROM productos WHERE id = ?',
          [req.params.id]
        );

        if (productos.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }
      }

      return res.json({ mensaje: 'Producto actualizado correctamente.' });
    } catch (error) {
      return next(error);
    }
  }
);

// Elimina un producto y devuelve 404 cuando el identificador no existe.
productosRouter.delete(
  '/:id',
  identificadorProductoValidaciones,
  manejadorErroresValidacion,
  async (req, res, next) => {
    try {
      const [resultado] = await pool.execute(
        'DELETE FROM productos WHERE id = ?',
        [req.params.id]
      );

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  }
);

export default productosRouter;
