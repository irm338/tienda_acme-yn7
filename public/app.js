// Reúne referencias de la interfaz para mantener las operaciones HTTP legibles.
const productForm = document.querySelector('#product-form');
const productList = document.querySelector('#product-list');
const formTitle = document.querySelector('#form-title');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const statusMessage = document.querySelector('#status-message');

// Consulta la API y convierte las respuestas HTTP no exitosas en errores visibles.
async function requestApi(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || result.mensaje || 'No se pudo completar la solicitud.');
  }

  return response.status === 204 ? null : response.json();
}

// Muestra el resultado de la última operación en la región accesible del formulario.
function showMessage(message) {
  statusMessage.textContent = message;
}

// Construye cada celda con textContent para no interpretar datos del catálogo como HTML.
function createCell(value) {
  const cell = document.createElement('td');
  cell.textContent = value ?? '';
  return cell;
}

// Rellena el formulario con un producto existente y activa el modo de edición.
function startEditing(product) {
  productForm.elements.codigo.value = product.codigo;
  productForm.elements.nombre.value = product.nombre;
  productForm.elements.descripcion.value = product.descripcion ?? '';
  productForm.elements.precio.value = product.precio;
  productForm.elements.activo.checked = isProductActive(product.activo);
  productForm.dataset.productId = product.id;
  formTitle.textContent = 'Editar producto';
  saveButton.textContent = 'Guardar cambios';
  cancelButton.hidden = false;
  productForm.elements.codigo.focus();
}

// Normaliza el valor tinyint/boolean devuelto por MySQL antes de mostrarlo.
function isProductActive(value) {
  return value === true || value === 1 || value === '1';
}

// Carga los productos y crea acciones de edición y eliminación para cada fila.
async function loadProducts() {
  const products = await requestApi('/productos');
  productList.replaceChildren();

  for (const product of products) {
    const row = document.createElement('tr');
    const active = isProductActive(product.activo);
    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    row.append(
      createCell(product.codigo),
      createCell(product.nombre),
      createCell(product.descripcion),
      createCell(Number(product.precio).toFixed(2))
    );

    badge.className = `badge ${active ? 'badge-active' : 'badge-inactive'}`;
    badge.textContent = active ? 'Activo' : 'Inactivo';
    statusCell.append(badge);
    row.append(statusCell);

    actions.className = 'actions';
    editButton.type = 'button';
    editButton.className = 'button button-secondary';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => startEditing(product));

    deleteButton.type = 'button';
    deleteButton.className = 'button button-danger';
    deleteButton.textContent = 'Eliminar';
    deleteButton.addEventListener('click', async () => {
      if (!window.confirm(`¿Eliminar el producto "${product.nombre}"?`)) {
        return;
      }

      try {
        await requestApi(`/productos/${encodeURIComponent(product.id)}`, {
          method: 'DELETE'
        });
        showMessage('Producto eliminado.');
        await loadProducts();
      } catch (error) {
        showMessage(error.message);
      }
    });

    actions.append(editButton, deleteButton);
    actionsCell.append(actions);
    row.append(actionsCell);
    productList.append(row);
  }
}

// Envía el formulario como creación o actualización según el identificador activo.
productForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const productId = productForm.dataset.productId;
  const product = {
    codigo: productForm.elements.codigo.value.trim(),
    nombre: productForm.elements.nombre.value.trim(),
    descripcion: productForm.elements.descripcion.value.trim(),
    precio: Number(productForm.elements.precio.value),
    activo: productForm.elements.activo.checked
  };
  const url = productId
    ? `/productos/${encodeURIComponent(productId)}`
    : '/productos';

  try {
    await requestApi(url, {
      method: productId ? 'PUT' : 'POST',
      body: JSON.stringify(product)
    });
    showMessage(productId ? 'Producto actualizado.' : 'Producto registrado.');
    productForm.reset();
    productForm.elements.activo.checked = true;
    delete productForm.dataset.productId;
    formTitle.textContent = 'Agregar producto';
    saveButton.textContent = 'Guardar';
    cancelButton.hidden = true;
    await loadProducts();
  } catch (error) {
    showMessage(error.message);
  }
});

// Permite salir de la edición sin modificar el producto.
cancelButton.addEventListener('click', () => {
  productForm.reset();
  productForm.elements.activo.checked = true;
  delete productForm.dataset.productId;
  formTitle.textContent = 'Agregar producto';
  saveButton.textContent = 'Guardar';
  cancelButton.hidden = true;
  showMessage('');
});

// Informa fallos al cargar el catálogo en lugar de dejar la tabla vacía sin explicación.
loadProducts().catch((error) => {
  showMessage(`No se pudo cargar el catálogo: ${error.message}`);
});
