// Trae los productos de productos.json, con sus respectivos precios y stocks
import { StoreManager, Product, CartItem, Cart } from './productosModelo.js';

// store - crea un nuevo gestor de la tienda, StoreManager
// filteredProducts - guarda temporalmente los productos filtrados
const store = new StoreManager();
let filteredProducts = [];

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
const cartItemsList = document.getElementById('cartItemsList');
const cartItemsCountBadge = document.getElementById('cartItemsCountBadge');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartSummaryDetails = document.getElementById('cartSummaryDetails');
const clearCartButton = document.getElementById('clearCartButton');
const confirmPurchaseButton = document.getElementById('confirmPurchaseButton');
const checkoutForm = document.getElementById('checkoutForm');
const sentEmailDisplay = document.getElementById('sentEmailDisplay');
const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
const successSendModal = new bootstrap.Modal(document.getElementById('successSendModal'));
const cartOffcanvasFooterButtons = document.getElementById('cartOffcanvasFooterButtons');

const IS_HOME = !!document.getElementById('productsGridContainer') && !document.getElementById('applyFiltersButton');

function reconcileCartWithProducts() {
    const keptItems = [];
    store.cart.items.forEach(item => {
        const prod = store.getProductById(item.product.id);
        if (prod && item.quantity > 0) {
            item.product = prod;
            keptItems.push(item);
        }
    });
    store.cart.items = keptItems;
    store.cart.save();
}

// Renderizar productos destacados en Home considerando stock real
function renderFeaturedOnHome() {
    if (!IS_HOME) return;

    const destacados = store.products.filter(p => {
        const existingCartItem = store.cart.items.find(i => i.product.id === p.id);
        const availableStock = Number(p.stock) - (existingCartItem ? Number(existingCartItem.quantity) : 0);
        return availableStock === 1;
    });

    filteredProducts = destacados;
    renderProducts(filteredProducts);
}

// Si el carrito esta vacio, muesta un mensaje de "carrito vacio"
// Si hay productos, muestra Nombre, Cantidad, Precio, Total y botones para limpiar y confirmar compra
function renderCart() {
    if (!cartItemsList) return;

    cartItemsList.innerHTML = '';

    if (store.cart.items.length === 0) {
        if (cartSummaryDetails) cartSummaryDetails.style.display = 'none';
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        if (cartOffcanvasFooterButtons) cartOffcanvasFooterButtons.style.display = 'none';
    } else {
        if (cartSummaryDetails) cartSummaryDetails.style.display = 'block';
        if (emptyCartMessage) emptyCartMessage.style.display = 'none';
        // Se hace visible el pie de página del carrito con los botones
        if (cartOffcanvasFooterButtons) cartOffcanvasFooterButtons.style.display = 'flex';

        store.cart.items.forEach(item => {
            const itemTotal = item.total;
            const colProduct = store.getProductById(item.product.id);
            const maxStock = colProduct ? colProduct.stock + item.quantity : item.quantity;

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2', 'py-2', 'border-bottom');

            // Separa nombre y cantidad de precio y botón, evitando que el nombre largo empuje el precio
            itemDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center w-100">
                    <div class="me-2 flex-grow-1 text-truncate">
                        <span class="fw-bold">${item.product.name}</span><br>
                        <input type="number" class="form-control form-control-sm cart-item-quantity mt-1"
                               value="${item.quantity}" min="1" max="${maxStock}"
                               data-product-id="${item.product.id}">
                    </div>
                    <div class="text-end d-flex flex-column align-items-end">
                        <span class="fw-bold">$${Math.round(itemTotal).toLocaleString('es-CL')}</span>
                        <button class="btn btn-sm btn-outline-danger mt-1 remove-from-cart-btn" data-product-id="${item.product.id}">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </div>
            `;

            cartItemsList.appendChild(itemDiv);
        });

        const { subtotal, iva, despatchCharge, total } = store.cart.totalValue;
        cartSummaryDetails.innerHTML = `
            <div class="d-flex justify-content-between"><span>Subtotal Neto:</span><span class="fw-bold">$${Math.round(subtotal).toLocaleString('es-CL')}</span></div>
            <div class="d-flex justify-content-between"><span>IVA (19%):</span><span class="fw-bold">$${Math.round(iva).toLocaleString('es-CL')}</span></div>
            <div class="d-flex justify-content-between"><span>Cargo Despacho:</span><span class="fw-bold">$${Math.round(despatchCharge).toLocaleString('es-CL')}</span></div>
            <hr>
            <div class="d-flex justify-content-between"><h4>Total:</h4><h4 class="fw-bold text-dark">$${Math.round(total).toLocaleString('es-CL')}</h4></div>
        `;
    }
    updateCartBadge();

    // Si estamos en la HOME, recalculamos los destacados inmediatamente despues de renderizar el carrito,
    // así los cambios de stock se reflejan en tiempo real en la sección destacada.
    renderFeaturedOnHome();
}

// Muestra el badge con la cantidad de productos en el carrito en el navbar
function updateCartBadge() {
    if (cartItemsCountBadge) {
        const totalItemsInCart = store.cart.totalItems;
        cartItemsCountBadge.textContent = totalItemsInCart;
        cartItemsCountBadge.style.display = totalItemsInCart > 0 ? 'inline-block' : 'none';
    }
}

// Muestra los productos dentro de la tienda.

function renderProducts(productsToRender) {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p class="text-center w-100">No se encontraron productos que coincidan con los filtros.</p>';
        return;
    }

    productsToRender.forEach(product => {
        // Considerar la cantidad que ya está en el carrito para mostrar stock real
        const existingCartItem = store.cart.items.find(i => i.product.id === product.id);
        const availableStock = Number(product.stock) - (existingCartItem ? Number(existingCartItem.quantity) : 0);

        const stockMessage = renderStockMessage(availableStock);
        const isOutOfStock = availableStock <= 0;

        const buttonHtml = isOutOfStock ?
            `<button class="btn btn-danger w-100 mt-auto" disabled>Agotado</button>` :
            `<button class="btn btn-primary w-100 mt-auto add-to-cart-btn" data-product-id="${product.id}">Agregar al Carrito</button>`;

        const colDiv = document.createElement('div');
        colDiv.classList.add('col');
        colDiv.setAttribute('data-category', product.category);
        colDiv.setAttribute('data-product-id', product.id);
        colDiv.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${product.imageSrc}" class="card-img-top mx-auto mt-3" alt="${product.name}" style="max-width: 200px; height: 180px; object-fit: contain;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-center">${product.name}</h5>
                    <p class="card-text">${product.description}</p>
                    <div class="mt-2">
                        <h6 class="text-center">$${product.price.toLocaleString('es-CL')}</h6>
                        <div class="stock-info text-center">${stockMessage}</div>
                    </div>
                    <div class="mt-3">
                        ${buttonHtml}
                    </div>
                </div>
            </div>
        `;
        productsGrid.appendChild(colDiv);
    });
}


function renderStockMessage(stock) {
    if (stock <= 0) {
        return `<span class="badge bg-secondary">Agotado</span>`;
    } else if (stock === 1) {
        return `<span class="badge bg-warning text-dark">Última unidad, ¡No te lo pierdas!</span>`;
    } else if (stock > 1 && stock <= 4) {
        return `<span class="badge bg-warning text-dark">Sólo ${stock} en stock</span>`;
    }
    return '';
}

// Eventos del carrito
// Vaciar carrito: solo limpiar carrito, no tocar stock
clearCartButton.addEventListener('click', () => {
    store.cart.clear();
    store.saveProducts();
    renderCart();
    applyFilters();
});

confirmPurchaseButton.addEventListener('click', () => {
    checkoutModal.show();
});

checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (checkoutForm.checkValidity()) {
        const email = document.getElementById('clientEmail').value;
        sentEmailDisplay.textContent = email;
        checkoutModal.hide();
        successSendModal.show();
    }
    checkoutForm.classList.add('was-validated');
});

successSendModal.show;
document.getElementById('successSendModal').addEventListener('hidden.bs.modal', () => {
    // Despues de comprar: se asume consumo definitivo del stock (no se restaura).
    store.cart.clear();
    renderCart();
    applyFilters();
    checkoutForm.reset();
    checkoutForm.classList.remove('was-validated');
});

// Función para aplicar filtros
function applyFilters() {
    // Si estamos en HOME, forzamos el render de destacados (stock === 1) y salimos.
    if (IS_HOME) {
        renderFeaturedOnHome();
        return;
    }

    const category = document.querySelector('.filter-button.active')?.dataset.category || 'todos';
    const priceRange = document.getElementById('priceRange')?.value;
    const searchText = document.getElementById('freeTextSearch')?.value.toLowerCase();

    let tempProducts = store.products.slice();

    if (searchText) {
        tempProducts = tempProducts.filter(p =>
            p.name.toLowerCase().includes(searchText) ||
            p.description.toLowerCase().includes(searchText) ||
            p.category.toLowerCase().includes(searchText) ||
            (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchText)))
        );
    }

    if (category !== 'todos') {
        tempProducts = tempProducts.filter(p =>
            p.category.toLowerCase().trim() === category.toLowerCase().trim()
        );
    }

    if (priceRange) {
        const maxPrice = parseFloat(priceRange);
        tempProducts = tempProducts.filter(p => p.price <= maxPrice);
    }

    filteredProducts = tempProducts;
    renderProducts(filteredProducts);
}

// Configuración de los filtros
function setupFilters() {
    const priceRangeInput = document.getElementById('priceRange');
    const priceValueDisplay = document.getElementById('priceValue');

    if (priceRangeInput && priceValueDisplay) {
        priceValueDisplay.textContent = `$${parseFloat(priceRangeInput.value).toLocaleString('es-CL')}`;
        priceRangeInput.addEventListener('input', () => {
            priceValueDisplay.textContent = `$${parseFloat(priceRangeInput.value).toLocaleString('es-CL')}`;
        });
    }

    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', e => {
            document.querySelector('.filter-button.active')?.classList.remove('active');
            e.currentTarget.classList.add('active');
            applyFilters();
        });
    });

    document.getElementById('applyFiltersButton').addEventListener('click', applyFilters);
}

// Eventos para los botones de "Agregar al carrito"
document.addEventListener('click', (e) => {
    const button = e.target.closest('.add-to-cart-btn');
    if (button) {
        const productId = button.dataset.productId;
        const product = store.getProductById(productId);
        if (product) {
            // Considerar la cantidad que ya está en el carrito
            const existingCartItem = store.cart.items.find(i => i.product.id === productId);
            const cartQty = existingCartItem ? Number(existingCartItem.quantity) : 0;
            const availableStock = Number(product.stock) - cartQty;

            if (availableStock > 0) {
                store.cart.addItem(product, 1); // addItem maneja la cantidad internamente
                store.saveProducts();
                applyFilters();
                renderCart();
                cartOffcanvas.show();
            } else {
                console.warn('Intento de agregar sin stock suficiente');
            }
        }
    }

    // Eliminar ítem del carrito: devolver al producto la cantidad exacta del item.
    const removeButton = e.target.closest('.remove-from-cart-btn');
    if (removeButton) {
        const productId = removeButton.dataset.productId;
        const item = store.cart.items.find(i => i.product.id === productId);
        if (item) {
            const prod = store.getProductById(productId);
            if (prod) {
                prod.stock = Number(prod.stock) + Number(item.quantity);
            }
            store.cart.removeItem(productId);
            store.saveProducts();
            renderCart();
            applyFilters();
        }
    }
});

// Manejo del cambio de cantidad en el carrito
// Ajusta stock según la diferencia entre la nueva cantidad y la antigua.
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('cart-item-quantity')) {
        const input = e.target;
        const productId = input.dataset.productId;
        const newQuantity = parseInt(input.value, 10);

        const item = store.cart.items.find(i => i.product.id === productId);
        if (!item) {
            return;
        }
        const prod = store.getProductById(productId);
        const oldQty = Number(item.quantity);

        if (isNaN(newQuantity) || newQuantity < 1) {
            input.value = oldQty;
            return;
        }

        const delta = newQuantity - oldQty;
        if (delta > 0) {
            if (!prod || prod.stock < delta) {
                input.value = oldQty;
                alert('No hay suficiente stock disponible para esa cantidad.');
                return;
            }
            prod.stock = Number(prod.stock) - delta;
            item.quantity = newQuantity;
            store.cart.save();
            store.saveProducts();
        } else if (delta < 0) {
            const toReturn = Math.abs(delta);
            if (prod) {
                prod.stock = Number(prod.stock) + toReturn;
            }
            item.quantity = newQuantity;
            store.cart.save();
            store.saveProducts();
        }

        renderCart();
        applyFilters();
    }
});

// Espera a que la pagina esté cargada para cargar los productos
// Carga los productos de productos.json
// Actualiza el badge con la cantidad de productos en el carrito
// Muestra los productos en el navegador
// Configura los filtros
document.addEventListener('DOMContentLoaded', async () => {
    await store.loadProducts();

    reconcileCartWithProducts();

    filteredProducts = store.products;
    renderProducts(filteredProducts);
    renderCart();
    updateCartBadge();

    if (productsGrid) {
        setupFilters();
    }

    // Mostrar destacados en HOME al cargar.
    renderFeaturedOnHome();
});
