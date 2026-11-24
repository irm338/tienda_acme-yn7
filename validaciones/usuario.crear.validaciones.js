import { body } from 'express-validator';

const usuarioCrearValidaciones = [
  body('identificacion')
    .isString().withMessage('La identificación debe enviarse como texto')
    .trim()
    .notEmpty().withMessage('La identificación es obligatoria')
    .isNumeric().withMessage('La identificación debe contener solo números'),
  body('nombre')
    .isString().withMessage('El nombre debe ser un texto')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio'),
  body('email')
    .isEmail().withMessage('El email debe ser válido')
    .normalizeEmail(),
  body('telefono')
    .optional({ nullable: true })
    .isString().withMessage('El teléfono debe ser un texto')
    .trim(),
  body('contrasena')
    .isString().withMessage('La contraseña debe ser un texto')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
];

export default usuarioCrearValidaciones;