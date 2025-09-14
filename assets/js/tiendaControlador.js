//=========================== CONTROLADOR DE LA TIENDA ====================================
// JS tiendaControlador.js
// Controlador de la tienda, gestiona los productos, el carrito y el cliente
// Los productos se cargan desde productos.json
// Se crea una tienda
// Se fijan los elementos del DOM
// - Sincronizar stock en tiempo real con otro JS (gestionInventario.js)
// - Renderizar productos destacados en Home
// - Renderizar productos en la tienda // Productos en tienda
// - Renderizar productos en el carrito // Productos en el carrito
// - Manejo del carrito // Input manual
// - Manejo de botones en el carrito // Agregar al carrito (página), icono eliminar del carrito, vaciar carrito, confirmar compra
// - Formulario de checkout // Formulario de compra
// - Funciones auxiliares
// -- Carrito con productos existentes (para stock correcto)
// -- Número de productos en el badge del carrito
// -- Filtros

//=========================== CONTROLADOR DE LA TIENDA ====================================

// Trae los productos de productos.json, con sus respectivos precios y stocks
import { StoreManager, Product, CartItem, Cart } from './productosModelo.js';

// store - crea un nuevo gestor de la tienda, StoreManager
// filteredProducts - guarda temporalmente los productos filtrados
const store = new StoreManager();
let filteredProducts = [];

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const cartOffcanvasEl = document.getElementById('cartOffcanvas');
const cartOffcanvas = cartOffcanvasEl ? new bootstrap.Offcanvas(cartOffcanvasEl) : null;
const cartItemsList = document.getElementById('cartItemsList');
const cartItemsCountBadge = document.getElementById('cartItemsCountBadge');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartSummaryDetails = document.getElementById('cartSummaryDetails');
const clearCartButton = document.getElementById('clearCartButton');
const confirmPurchaseButton = document.getElementById('confirmPurchaseButton');
const checkoutForm = document.getElementById('checkoutForm');
const sentEmailDisplay = document.getElementById('sentEmailDisplay');
const checkoutModalEl = document.getElementById('checkoutModal');
const checkoutModal = checkoutModalEl ? new bootstrap.Modal(checkoutModalEl) : null;
const successSendModalEl = document.getElementById('successSendModal');
const successSendModal = successSendModalEl ? new bootstrap.Modal(successSendModalEl) : null;
const cartOffcanvasFooterButtons = document.getElementById('cartOffcanvasFooterButtons');

const IS_HOME = !!document.getElementById('productsGridContainer') && !document.getElementById('applyFiltersButton');

//=========================== SINCRONIZACIÓN DE STOCK ====================================

// Listener para sincronizar stock en tiempo real con otro JS (gestionInventario.js)
window.addEventListener('storage', (e) => {
    if (e.key === 'products') {
        // Recargar productos desde localStorage
        store.products = JSON.parse(localStorage.getItem('products')) || [];

        // Re-renderizar productos y carrito con stock actualizado
        renderProducts(filteredProducts);
        renderCart();
        updateCartBadge();
    }
});

//=========================== RENDERIZADO DE PRODUCTOS DESTACADOS EN HOME ====================================

// Productos destacados en Home considerando stock real
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

//=========================== RENDERIZADO DE PRODUCTOS EN TIENDA ====================================

// Muestra los productos dentro de la tienda.
function renderProducts(productsToRender) {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p class="text-center w-100">No se encontraron productos que coincidan con los filtros.</p>';
        return;
    }

    productsToRender.forEach(product => {
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
    if (stock <= 0) return `<span class="badge bg-secondary">Reservalo por whatsapp !</span>`;
    if (stock === 1) return `<span class="badge bg-warning text-dark">Última unidad, ¡No te lo pierdas!</span>`;
    if (stock > 1 && stock <= 4) return `<span class="badge bg-warning text-dark">Sólo ${stock} en stock</span>`;
    return '';
}

//=========================== RENDERIZADO DEL CARRITO ====================================

// Si el carrito esta vacio, muesta un mensaje de "carrito vacio"
// Si hay productos, muestra Nombre, Cantidad, Precio, Total y botones para limpiar y confirmar compra
function renderCart() {

    if (!cartItemsList) return; // No hay carrito

    cartItemsList.innerHTML = ''; // Limpiar carrito

    if (store.cart.items.length === 0) { // Si el carrito esta vacio
        if (cartSummaryDetails) cartSummaryDetails.style.display = 'none'; // Ocultar resumen
        if (emptyCartMessage) emptyCartMessage.style.display = 'block'; // Mostrar "carrito vacio"
        if (cartOffcanvasFooterButtons) cartOffcanvasFooterButtons.style.display = 'none'; // Ocultar botones
    } else { // Si el carrito tiene productos
        if (cartSummaryDetails) cartSummaryDetails.style.display = 'block'; // Mostrar resumen
        if (emptyCartMessage) emptyCartMessage.style.display = 'none'; // Ocultar "carrito vacio"
        if (cartOffcanvasFooterButtons) cartOffcanvasFooterButtons.style.display = 'flex'; // Mostrar botones

        store.cart.items.forEach(item => { // Por cada item
            const itemTotal = item.total; // Total del item = precio * cantidad 
            const colProduct = store.getProductById(item.product.id); // Busca el producto por su ID
            const maxStock = colProduct ? colProduct.stock : item.quantity; // Stock maximo del producto

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2', 'py-2', 'border-bottom');

            // Separa nombre y cantidad de precio y botón, evitando que el nombre largo empuje el precio
            itemDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center w-100">
                    <div class="me-2 flex-grow-1 text-truncate">
                        <span class="fw-bold">${item.product.name}</span><br> 
                        <input type="number" class="form-control form-control-sm cart-item-quantity mt-1"
                               value="${item.quantity}" min="1" max="${maxStock}" step="1" 
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

        if (cartSummaryDetails) {
            const { subtotal, iva, despatchCharge, total } = store.cart.totalValue;
            cartSummaryDetails.innerHTML = `
                <div class="d-flex justify-content-between"><span>Subtotal Neto:</span><span class="fw-bold">$${Math.round(subtotal).toLocaleString('es-CL')}</span></div>
                <div class="d-flex justify-content-between"><span>IVA (19%):</span><span class="fw-bold">$${Math.round(iva).toLocaleString('es-CL')}</span></div>
                <div class="d-flex justify-content-between"><span>Cargo Despacho:</span><span class="fw-bold">$${Math.round(despatchCharge).toLocaleString('es-CL')}</span></div>
                <hr>
                <div class="d-flex justify-content-between"><h4>Total:</h4><h4 class="fw-bold text-dark">$${Math.round(total).toLocaleString('es-CL')}</h4></div>
            `;
        }
    }

    updateCartBadge();
    renderFeaturedOnHome();
}

//=========================== MANEJO DEL CARRITO ====================================

// Manejo del cambio de cantidad en el carrito
document.addEventListener('change', (e) => { // Cambio de cantidad
    if (!e.target.classList.contains('cart-item-quantity')) return; // Verificar si el input es de cantidad
    const input = e.target; // input
    const productId = input.dataset.productId; // ID del producto
    const newQuantity = parseInt(input.value, 10); // Nueva cantidad
    const item = store.cart.items.find(i => i.product.id === productId); // Producto en el carrito

    if (!item) return; // Verificar si el producto existe
    const prod = store.getProductById(productId); // Producto
    const stock = prod.stock; // Stock del producto
    const oldQty = Number(item.quantity); // Cantidad anterior en el carrito, antes de modificar

    if (isNaN(newQuantity) || newQuantity < 1) { // Verificar si la nueva cantidad es válida / si no es un número o si es menor a 1
        input.value = oldQty;
        return;
    }

    const diff = stock - newQuantity; // Diferencia entre la cantidad anterior y la nueva 

    if (diff < 0) {
        input.value = oldQty; // Restaurar la cantidad anterior antes de modificar el input
        alert('No hay suficiente stock disponible para esa cantidad.');
        return;
    } else if (diff >= 0) {
        item.quantity = newQuantity;
    }

    store.cart.save();
    store.saveProducts();
    renderCart();
    applyFilters();
});

//=========================== ENVENTOS DEL CARRITO (BOTONES) ====================================

document.addEventListener('click', (e) => {

    // ----------- AGREGAR AL CARRITO (botón .add-to-cart-btn) -----------
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) { // Verificar si el botón es de agregar
        const productId = addBtn.dataset.productId; // ID del producto
        const product = store.getProductById(productId); // Producto

        if (product) {
            const cartItem = store.cart.items.find(i => i.product.id === productId); // Producto en el carrito
            const cartQty = cartItem ? Number(cartItem.quantity) : 0; // Cantidad en el carrito
            const stock = Number(product.stock) - cartQty; // Stock disponible

            if (stock > 0) { // Verificar stock
                const added = store.cart.addItem(product, 1); // Agregar al carrito
                store.saveProducts();
                applyFilters();
                renderCart();
                if (cartOffcanvas) cartOffcanvas.show();
            }
        }
    }

    // ----------- ELIMINAR DEL CARRITO (botón .remove-from-cart-btn) -----------
    const removeBtn = e.target.closest('.remove-from-cart-btn');
    if (removeBtn) { // Verificar si el botón es de eliminar
        const productId = removeBtn.dataset.productId; // ID del producto
        const product = store.getProductById(productId); // Producto
        const cartItem = store.cart.items.find(i => i.product.id === productId); // Producto en el carrito

        const cartQty = cartItem ? Number(cartItem.quantity) : 0; // Cantidad en el carrito
        const stock = Number(product.stock) - cartQty; // Stock disponible

        // elimina del carrito
        store.cart.removeItem(productId);

        // actualiza el stock del producto
        if (product && Number(product.stock) === stock) {
            product.stock = stock + cartQty; // Suma las cantidades de vuelta
        }

        store.cart.save();
        store.saveProducts();
        applyFilters();
        renderCart();
        return;
    }

    // ----------- VACIAR CARRITO (botón DOM referenciado por clearCartButton) -----------
    if (typeof clearCartButton !== 'undefined' && clearCartButton && (e.target === clearCartButton || clearCartButton.contains(e.target))) {
        store.cart.items.forEach(cartItem => { // Recorre los productos en el carrito
            const product = store.getProductById(cartItem.product.id); // Producto en el carrito
            if (product) { // Verificar si el producto existe
                product.stock = Number(product.stock);
            }
        });

        // Vaciar carrito
        store.cart.clear();

        // Guardar cambios y actualizar vista
        store.cart.save();
        store.saveProducts();
        applyFilters();
        renderCart();
        return;
    }

    // --- CONFIRMAR COMPRA (botón DOM referenciado por confirmPurchaseButton) ---
    if (typeof confirmPurchaseButton !== 'undefined' && confirmPurchaseButton && (e.target === confirmPurchaseButton || confirmPurchaseButton.contains(e.target))) {
        if (store.cart.items.length === 0) {
            alert("Oops! Tu carrito está vacío. Agrega productos a tu carrito para continuar con tu compra.");
            return;
        }
        checkoutModal?.show();
        return;
    }
});

//============================ ENVENTOS DE CHECKOUT ====================================

// Checkout
checkoutForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (checkoutForm.checkValidity()) {
        store.cart.items.forEach(cartItem => { // Recorre los productos en el carrito
            const product = store.getProductById(cartItem.product.id); // Producto en el carrito
            
            if (product) {
                product.stock = Math.max(0, Number(product.stock) - Number(cartItem.quantity)); // Descuenta el stock despues de la compra
            }
        });

        store.saveProducts();
        const email = document.getElementById('clientEmail').value;
        sentEmailDisplay.textContent = email;
        checkoutModal?.hide();
        successSendModal?.show();
    }
    checkoutForm.classList.add('was-validated');

});

successSendModalEl?.addEventListener('hidden.bs.modal', () => {
    store.cart.clear();
    renderCart();
    applyFilters();
    checkoutForm.reset();
    checkoutForm.classList.remove('was-validated');
});

//============================ FUNCIONES AUXILIARES ====================================

// Carrito con productos existentes (para stock correcto)
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


// Muestra el badge con la cantidad de productos en el carrito en el navbar
function updateCartBadge() {
    if (!cartItemsCountBadge) return;
    const totalItemsInCart = store.cart.totalItems;
    cartItemsCountBadge.textContent = totalItemsInCart;
    cartItemsCountBadge.style.display = totalItemsInCart > 0 ? 'inline-block' : 'none';
}


// Aplicar filtros
function applyFilters() {
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
        tempProducts = tempProducts.filter(p => p.category.toLowerCase().trim() === category.toLowerCase().trim());
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

    document.getElementById('applyFiltersButton')?.addEventListener('click', applyFilters);
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await store.loadProducts();
    reconcileCartWithProducts();

    filteredProducts = store.products;
    renderProducts(filteredProducts);
    renderCart();
    updateCartBadge();

    if (productsGrid) setupFilters();

    renderFeaturedOnHome();
}); 