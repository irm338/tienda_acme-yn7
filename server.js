// Carga el archivo .env antes de importar módulos que leen la configuración.
import 'dotenv/config';

import app from './app.js';

// Mantiene el puerto configurable para desarrollo y despliegues.
const port = Number(process.env.SERVER_PORT || 3000);

app.listen(port, () => {
  console.log(`Servidor disponible en http://localhost:${port}`);
});
