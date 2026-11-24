# Tienda ACME

API REST y aplicación web sencilla para consultar y administrar productos de una tienda, además de registrar y consultar usuarios.

## Tecnologías

- Node.js con módulos ES.
- Express 5 para la API HTTP y la publicación de la interfaz web.
- MySQL2 para consultas preparadas a MySQL.
- express-validator para validar los datos de las solicitudes.
- dotenv para cargar la configuración local.
- Node.js Test Runner para pruebas HTTP automatizadas.

## Estructura del proyecto

```text
.
├── app.js                         # Configuración de Express y middleware
├── server.js                      # Inicio del servidor HTTP
├── config/
│   └── db.js                      # Pool de conexiones MySQL
├── dto/
│   ├── usuario.crear.dto.js       # Datos normalizados para crear usuarios
│   └── usuario.obtener.dto.js     # Representación pública de usuarios
├── public/
│   ├── app.js                     # Interacciones de la interfaz de productos
│   ├── index.html                 # Página de administración
│   └── styles.css                 # Estilos de la página
├── routes/
│   ├── productos.router.js        # Operaciones CRUD de productos
│   └── usuarios.router.js         # Registro y consulta de usuarios
└── validaciones/
    ├── manejador-errores.validaciones.js
    ├── producto.validaciones.js
    └── usuario.crear.validaciones.js
```

## Requisitos

- Node.js 18 o posterior.
- npm.
- Un servidor MySQL con una base de datos y tablas compatibles con las columnas usadas por la API.

Este repositorio no incluye migraciones ni un esquema SQL. La tabla `productos` debe tener `id`, `codigo`, `nombre`, `descripcion`, `precio`, `activo` y `creado_en`. La tabla `usuarios` debe tener `id`, `DPI`, `nombre`, `email`, `telefono`, `contrasena`, `activo` y `creado_en`; la columna `contrasena` debe admitir al menos 168 caracteres para guardar el hash scrypt. Ajusta estos nombres o longitudes a tu esquema antes de ejecutar el proyecto.

## Configuración

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` y configura la conexión a MySQL:

   ```dotenv
   SERVER_PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_mysql_user
   DB_PASSWORD=your_local_password
   DB_NAME=tienda_acme
   ```

   `DB_PASSWORD` puede ser una cadena vacía si tu instancia local lo requiere. No guardes credenciales reales en el control de versiones; `.env` está excluido por `.gitignore`.

## Arranque

Para iniciar el servidor en modo normal:

```bash
npm start
```

Para reiniciarlo automáticamente durante el desarrollo:

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:3000` (o en el puerto definido en `SERVER_PORT`). La página web se publica desde esa misma dirección.

## Endpoints

Todas las rutas de la API aceptan y devuelven JSON. Los identificadores deben ser enteros positivos. Los datos se envían como JSON y las consultas a la base de datos usan parámetros para evitar concatenar valores de usuario en SQL.

### Productos

| Método | Ruta | Descripción | Respuesta correcta |
| --- | --- | --- | --- |
| `GET` | `/productos` | Lista productos | `200` y un arreglo de productos |
| `GET` | `/productos/:id` | Consulta un producto | `200` y el producto |
| `POST` | `/productos` | Crea un producto | `201` y su identificador |
| `PUT` | `/productos/:id` | Actualiza uno o más campos | `200` |
| `DELETE` | `/productos/:id` | Elimina un producto | `204` sin cuerpo |

Ejemplo de creación:

```http
POST /productos
Content-Type: application/json

{
  "codigo": "ACM-001",
  "nombre": "Taza ACME",
  "descripcion": "Taza de cerámica",
  "precio": 49.9,
  "activo": true
}
```

Respuesta (`201`):

```json
{
  "id": 1,
  "mensaje": "Producto registrado con éxito."
}
```

Ejemplo de listado (`GET /productos`, `200`):

```json
[
  {
    "id": 1,
    "codigo": "ACM-001",
    "nombre": "Taza ACME",
    "descripcion": "Taza de cerámica",
    "precio": "49.90",
    "activo": 1,
    "creado_en": "2026-01-15T12:00:00.000Z"
  }
]
```

Ejemplo de actualización parcial:

```http
PUT /productos/1
Content-Type: application/json

{
  "precio": 0,
  "activo": false
}
```

Respuesta (`200`):

```json
{
  "mensaje": "Producto actualizado correctamente."
}
```

### Usuarios

| Método | Ruta | Descripción | Respuesta correcta |
| --- | --- | --- | --- |
| `GET` | `/usuarios/:id` | Consulta los datos públicos de un usuario | `200` y el usuario |
| `POST` | `/usuarios` | Registra un usuario | `201` y su identificador |

Ejemplo de registro:

```http
POST /usuarios
Content-Type: application/json

{
  "identificacion": "1234567890123",
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "telefono": "55551234",
  "contrasena": "cambia-esta-clave"
}
```

La contraseña se guarda como un hash scrypt con sal aleatoria; nunca se incluye en la respuesta.

Respuesta (`201`):

```json
{
  "id": 1,
  "mensaje": "Usuario registrado con éxito."
}
```

Ejemplo de consulta (`GET /usuarios/1`, `200`):

```json
{
  "id": 1,
  "dpi": "1234567890123",
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "telefono": "55551234",
  "activo": true,
  "creadoEn": "2026-01-15T12:00:00.000Z"
}
```

### Errores

- `400 Bad Request`: identificador o datos de entrada no válidos. El cuerpo incluye `error` y, para errores de validación, `errores`.
- `404 Not Found`: ruta o registro inexistente.
- `409 Conflict`: la base de datos rechaza un registro duplicado.
- `500 Internal Server Error`: error inesperado del servidor; los detalles internos se registran en el servidor y no se envían al cliente.

## Pruebas

Ejecuta las pruebas HTTP automatizadas con:

```bash
npm test
```

Las pruebas de validación y publicación de la interfaz no necesitan una conexión activa a MySQL. Para verificar operaciones exitosas de lectura y escritura, configura una base de datos de prueba con el esquema indicado y prueba los endpoints contra ella.
