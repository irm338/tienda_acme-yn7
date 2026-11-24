import assert from 'node:assert/strict';
import test from 'node:test';

// Proporciona configuración inocua: estas pruebas verifican HTTP sin conectarse a MySQL.
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? '';
process.env.DB_NAME = process.env.DB_NAME || 'test_database';

const { default: app } = await import('../app.js');
const { default: pool } = await import('../config/db.js');

// Inicia Express en un puerto libre para probarlo mediante HTTP real.
async function startTestServer() {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  return server;
}

// Cierra cada servidor de prueba y libera el puerto usado.
async function withServer(runTest) {
  const server = await startTestServer();
  try {
    await runTest(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('publica la interfaz y sus recursos estáticos', async () => {
  await withServer(async (baseUrl) => {
    const page = await fetch(baseUrl);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Gestión de productos/);

    const script = await fetch(`${baseUrl}/app.js`);
    assert.equal(script.status, 200);
    assert.match(await script.text(), /\/productos/);
  });
});

test('rechaza identificadores de producto y usuario que no sean enteros positivos', async () => {
  await withServer(async (baseUrl) => {
    const productResponse = await fetch(`${baseUrl}/productos/no-es-id`);
    const userResponse = await fetch(`${baseUrl}/usuarios/0`);

    assert.equal(productResponse.status, 400);
    assert.equal(userResponse.status, 400);
  });
});

test('rechaza productos sin los campos obligatorios antes de acceder a MySQL', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.equal(result.error, 'Errores de validación');
    assert.ok(result.errores.length >= 3);
  });
});

test('rechaza precios negativos y actualizaciones vacías antes de acceder a MySQL', async () => {
  await withServer(async (baseUrl) => {
    const invalidProduct = await fetch(`${baseUrl}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: 'ACM-001',
        nombre: 'Producto',
        precio: -1
      })
    });
    const emptyUpdate = await fetch(`${baseUrl}/productos/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(invalidProduct.status, 400);
    assert.equal(emptyUpdate.status, 400);
  });
});

test('resuelve las rutas CRUD con una base de datos simulada', async () => {
  const consultaOriginal = pool.query;
  const ejecucionOriginal = pool.execute;
  const producto = {
    id: 7,
    codigo: 'ACM-007',
    nombre: 'Taza ACME',
    descripcion: 'Taza',
    precio: '9.99',
    activo: 1,
    creado_en: '2026-01-15T12:00:00.000Z'
  };
  const llamadas = [];

  pool.query = async (sql, values) => {
    llamadas.push({ sql, values });
    return [[producto], []];
  };
  pool.execute = async (sql, values) => {
    llamadas.push({ sql, values });

    if (sql.startsWith('SELECT id, codigo')) {
      return [[producto], []];
    }
    if (sql.startsWith('SELECT id, DPI')) {
      return [[{
        id: 4,
        dpi: '1234567890123',
        nombre: 'Ana Pérez',
        email: 'ana@example.com',
        telefono: null,
        activo: 1,
        creado_en: '2026-01-15T12:00:00.000Z'
      }], []];
    }
    if (sql.startsWith('INSERT INTO productos')) {
      return [{ insertId: 7 }, []];
    }
    if (sql.startsWith('INSERT INTO usuarios')) {
      return [{ insertId: 4 }, []];
    }
    if (sql.startsWith('UPDATE productos')) {
      return [{ affectedRows: 1 }, []];
    }
    if (sql.startsWith('DELETE FROM productos')) {
      return [{ affectedRows: 1 }, []];
    }

    throw new Error(`Consulta inesperada en la prueba: ${sql}`);
  };

  try {
    await withServer(async (baseUrl) => {
      const productList = await fetch(`${baseUrl}/productos`);
      const productById = await fetch(`${baseUrl}/productos/7`);
      const createdProduct = await fetch(`${baseUrl}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: 'ACM-007',
          nombre: 'Taza ACME',
          precio: 9.99,
          activo: true
        })
      });
      const updatedProduct = await fetch(`${baseUrl}/productos/7`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precio: 0, activo: false })
      });
      const deletedProduct = await fetch(`${baseUrl}/productos/7`, {
        method: 'DELETE'
      });
      const userById = await fetch(`${baseUrl}/usuarios/4`);
      const createdUser = await fetch(`${baseUrl}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificacion: '1234567890123',
          nombre: 'Ana Pérez',
          email: 'ana@example.com',
          telefono: '55551234',
          contrasena: 'clave-segura-123'
        })
      });

      assert.equal(productList.status, 200);
      assert.equal((await productList.json())[0].id, 7);
      assert.equal(productById.status, 200);
      assert.equal((await productById.json()).codigo, 'ACM-007');
      assert.equal(createdProduct.status, 201);
      assert.equal((await createdProduct.json()).id, 7);
      assert.equal(updatedProduct.status, 200);
      assert.equal(deletedProduct.status, 204);
      assert.equal(userById.status, 200);
      const user = await userById.json();
      assert.equal(user.dpi, '1234567890123');
      assert.equal(user.activo, true);
      assert.equal(Object.hasOwn(user, 'contrasena'), false);
      assert.equal(createdUser.status, 201);

      const updateCall = llamadas.find(({ sql }) => sql.startsWith('UPDATE productos'));
      assert.deepEqual(updateCall.values, [0, false, '7']);

      const userInsert = llamadas.find(({ sql }) => sql.startsWith('INSERT INTO usuarios'));
      assert.match(userInsert.values[4], /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
      assert.notEqual(userInsert.values[4], 'clave-segura-123');
    });
  } finally {
    pool.query = consultaOriginal;
    pool.execute = ejecucionOriginal;
  }
});

test('valida usuarios y no devuelve la contraseña enviada en los errores', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrasena: 'clave-corta' })
    });
    const responseBody = await response.text();

    assert.equal(response.status, 400);
    assert.doesNotMatch(responseBody, /clave-corta/);
  });
});

test('responde 400 para JSON mal formado y 404 para rutas inexistentes', async () => {
  await withServer(async (baseUrl) => {
    const malformedJson = await fetch(`${baseUrl}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{'
    });
    const missingRoute = await fetch(`${baseUrl}/ruta-inexistente`);

    assert.equal(malformedJson.status, 400);
    assert.equal(missingRoute.status, 404);
  });
});
