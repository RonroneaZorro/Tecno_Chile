// gestionInventario.js

import { StoreManager } from './productosModelo.js';

const store = new StoreManager();
const tableBody = document.querySelector('#inventoryTable tbody');
const addProductBtn = document.getElementById('addProductBtn');
const filterCategory = document.getElementById('filterCategory');

window.addEventListener('storage', (e) => {
    if (e.key === 'products') {
        // Recargar productos desde localStorage
        store.products = JSON.parse(localStorage.getItem('products')) || [];
    }
});

// Inicialización
async function init() {
    await store.loadProducts();
    renderTable(store.products);
}

// Orden alfabético-numérico por código
function sortByCode(products) {
    return products.slice().sort((a, b) => {
        const regex = /([A-Za-z]+)(\d+)/;
        const [, aLet, aNum] = a.code.match(regex);
        const [, bLet, bNum] = b.code.match(regex);
        if (aLet === bLet) return parseInt(aNum) - parseInt(bNum);
        return aLet.localeCompare(bLet);
    });
}

// Render tabla
function renderTable(products) {
    tableBody.innerHTML = '';
    const sorted = sortByCode(products);

    sorted.forEach(prod => {
        const tr = document.createElement('tr');
        tr.dataset.id = prod.id;

        tr.innerHTML = `
            <td><input type="text" class="form-control" value="${prod.code}" disabled></td>
            <td><input type="text" class="form-control" value="${prod.name}" disabled></td>
            <td><input type="text" class="form-control" value="${prod.id}" disabled></td>
            <td><input type="text" class="form-control" value="${prod.description}" disabled></td>
            <td><input type="number" class="form-control" value="${prod.price}" disabled></td>
            <td><input type="number" class="form-control" value="${prod.stock}" disabled></td>
            <td><button class="btn btn-sm btn-secondary image-btn"disabled>${prod.imageSrc ? '✔️' : 'Subir'}</button></td>
            <td><button class="btn btn-primary btn-sm edit-btn">Editar</button></td>
            <td><button class="btn btn-success btn-sm save-btn" disabled>Guardar</button></td>
            <td><button class="btn btn-danger btn-sm delete-btn">Eliminar</button></td>
        `;

        tableBody.appendChild(tr);
    });
}

// Manejo de botones (delegación)
tableBody.addEventListener('click', async e => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const prodId = tr.dataset.id;
    const prod = store.getProductById(prodId);

    // Editar
    if (e.target.classList.contains('edit-btn')) {
        // Deshabilitar todos los botones
        tableBody.querySelectorAll('button').forEach(btn => btn.disabled = true);
        tableBody.querySelectorAll('input').forEach(input => input.disabled = true);
        addProductBtn.disabled = true;
        filterCategory.disabled = true;


        // Habilitar solo la fila actual
        tr.querySelectorAll('input').forEach(input => input.disabled = false);
        tr.querySelector('.save-btn').disabled = false;
        tr.querySelector('.image-btn').disabled = false;
        tr.querySelector('.delete-btn').disabled = false;
        // Cambiar el texto del botón eliminar a "Descartar"
        const deleteBtn = tr.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.textContent = 'Descartar';
            deleteBtn.classList.add('discard-btn');
        }

    }

    // Guardar
    if (e.target.classList.contains('save-btn')) {
        const inputs = tr.querySelectorAll('input');

        if (prod) {
            // Producto existente
            prod.code = inputs[0].value;
            prod.name = inputs[1].value;
            prod.id = inputs[2].value;
            prod.description = inputs[3].value;
            prod.price = parseFloat(inputs[4].value);
            prod.stock = parseInt(inputs[5].value);
        } else {
            // Producto nuevo
            const newProduct = {
                code: inputs[0].value,
                name: inputs[1].value,
                id: inputs[2].value,
                description: inputs[3].value,
                price: parseFloat(inputs[4].value),
                stock: parseInt(inputs[5].value),
                imageSrc: tr.dataset.imageSrc || ''
            };
            store.products.push(newProduct);
        }
        await store.saveProducts();
        renderTable(store.products); // actualiza la tabla
        addProductBtn.disabled = false;
        filterCategory.disabled = false;
    }

// Eliminar o Descartar
if (e.target.classList.contains('delete-btn')) {
    const isDiscard = e.target.classList.contains('discard-btn');

    if (isDiscard) {
        // Descartar cambios
        // Recargamos los productos para restaurar la fila original
        await store.loadProducts();
        renderTable(store.products);
    } else {
        // Eliminar
        if (prod) {
            if (confirm('¿Seguro que quieres eliminar este producto?')) {
                store.deleteProduct(prodId);
                renderTable(store.products);
            }
        } else {
            // Fila nueva no guardada
            tr.remove();
            await store.saveProducts();
        }
    }
}

    // Imagen
    if (e.target.classList.contains('image-btn')) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.png';
        fileInput.onchange = async () => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async () => {
                    if (prod) {
                        prod.imageSrc = reader.result;
                        await store.saveProducts();
                        location.reload();
                    } else {
                        tr.dataset.imageSrc = reader.result;
                        e.target.textContent = '✔️';
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    }
});

// Agregar producto
addProductBtn.addEventListener('click', () => {
    const tr = document.createElement('tr');
    tr.dataset.id = "new"; // identificador temporal


    tr.innerHTML = `
        <td><input type="text" class="form-control" value=""></td>
        <td><input type="text" class="form-control" value=""></td>
        <td><input type="text" class="form-control" value="" disabled></td>
        <td><input type="text" class="form-control" value=""></td>
        <td><input type="number" class="form-control" value=""></td>
        <td><input type="number" class="form-control" value=""></td>
        <td><button class="btn btn-sm btn-secondary image-btn">Subir</button></td>
        <td><button class="btn btn-primary btn-sm edit-btn">Editar</button></td>
        <td><button class="btn btn-success btn-sm save-btn">Guardar</button></td>
        <td><button class="btn btn-danger btn-sm delete-btn">Eliminar</button></td>
    `;

    tableBody.prepend(tr);
});

// Filtrar por categoría
filterCategory.addEventListener('change', () => {
    const cat = filterCategory.value;
    if (cat === 'todos') renderTable(store.products);
    else renderTable(store.products.filter(p => p.category === cat));
});

init();
