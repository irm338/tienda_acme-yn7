import { body, param } from 'express-validator';

// Valida los campos admitidos antes de crear un producto.
export const productoCrearValidaciones = [
  body('codigo')
    .isString().withMessage('El código debe ser un texto')
    .trim()
    .notEmpty().withMessage('El código es obligatorio'),
  body('nombre')
    .isString().withMessage('El nombre debe ser un texto')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio'),
  body('descripcion')
    .optional({ nullable: true })
    .isString().withMessage('La descripción debe ser un texto')
    .trim(),
  body('precio')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a cero')
    .toFloat(),
  body('activo')
    .optional()
    .isBoolean().withMessage('El estado activo debe ser booleano')
    .toBoolean()
];

// Restringe las actualizaciones a campos conocidos y exige al menos uno.
export const productoActualizarValidaciones = [
  param('id').isInt({ min: 1 }).withMessage('El identificador debe ser un entero positivo'),
  body().custom((datos) => {
    const camposPermitidos = ['codigo', 'nombre', 'descripcion', 'precio', 'activo'];
    return datos
      && typeof datos === 'object'
      && !Array.isArray(datos)
      && Object.keys(datos).length > 0
      && Object.keys(datos).every((campo) => camposPermitidos.includes(campo));
  }).withMessage('Envía al menos un campo permitido para actualizar'),
  body('codigo')
    .optional()
    .isString().withMessage('El código debe ser un texto')
    .trim()
    .notEmpty().withMessage('El código no puede estar vacío'),
  body('nombre')
    .optional()
    .isString().withMessage('El nombre debe ser un texto')
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío'),
  body('descripcion')
    .optional({ nullable: true })
    .isString().withMessage('La descripción debe ser un texto')
    .trim(),
  body('precio')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a cero')
    .toFloat(),
  body('activo')
    .optional()
    .isBoolean().withMessage('El estado activo debe ser booleano')
    .toBoolean()
];

// Comparte la validación del identificador en las operaciones de consulta y borrado.
export const identificadorProductoValidaciones = [
  param('id').isInt({ min: 1 }).withMessage('El identificador debe ser un entero positivo')
];
