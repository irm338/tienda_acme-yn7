import { validationResult } from 'express-validator';

// Convierte errores de express-validator a un formato estable y no devuelve
// valores enviados por el cliente, que podrían incluir contraseñas.
export default function manejadorErroresValidacion(req, res, next) {
  const resultado = validationResult(req);

  if (!resultado.isEmpty()) {
    const error = new Error('Errores de validación');
    error.statusCode = 400;
    error.details = resultado.array().map((detalle) => ({
      campo: detalle.path || 'body',
      mensaje: detalle.msg
    }));
    return next(error);
  }

  return next();
}
