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
            // maxStock limita la cantidad de unidades que se pueden agregar al carrito para no exceda el stock disponible
            const maxStock = colProduct ? colProduct.stock + item.quantity : item.quantity;

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2', 'py-2', 'border-bottom');
            itemDiv.innerHTML = `
                <div>
                    <span class="d-block text-truncate fw-bold">${item.product.name}</span>
                    <small>Cantidad: ${item.quantity}</small>
                </div>
                <div class="d-flex align-items-center">
                    <span class="fw-bold me-2">$${Math.round(itemTotal).toLocaleString('es-CL')}</span>
                    <button class="btn btn-sm btn-outline-danger remove-from-cart-btn" data-product-id="${item.product.id}">
                        <i class="bi bi-trash-fill"></i>
                    </button>
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
// En cada producto muestra su imagen, nombre, precio, stock y botón para agregar al carrito}
// Si el stock es 0, envia una alerta
function renderProducts(productsToRender) {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p class="text-center w-100">No se encontraron productos que coincidan con los filtros.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const cartItem = store.cart.items.find(i => i.product.id === product.id);
        const displayedStock = cartItem ? product.stock - cartItem.quantity : product.stock;
        const stockMessage = renderStockMessage(displayedStock);
        const isOutOfStock = displayedStock <= 0;
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

// Mensaje según stock, cuando el stock es 0 avisamos que no hay stock
function renderStockMessage(stock) {
    if (stock <= 0) {
        return ''; // No mostrar nada
    } else if (stock === 1) {
        return `<span class="badge bg-warning text-dark">Última unidad, ¡No te lo pierdas!</span>`;
    } else if (stock > 1 && stock <= 4) {
        return `<span class="badge bg-warning text-dark">Sólo ${stock} en stock</span>`;
    }
    return ''; // No mostrar nada si hay más de 4
}

// Eventos del carrito
clearCartButton.addEventListener('click', () => {
    store.cart.clear();
    renderCart();
    applyFilters();
});

confirmPurchaseButton.addEventListener('click', () => {
    checkoutModal.show();
});

// Eventos de los modales
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
    store.cart.clear();
    renderCart();
    applyFilters();
    checkoutForm.reset();
    checkoutForm.classList.remove('was-validated');
});


// Función para aplicar los filtros
// categoria, precio y texto
function applyFilters() {
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

    // Se aplica el filtro de precio solo si se ha movido el rango
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
        // Muestra el valor inicial
        priceValueDisplay.textContent = `$${parseFloat(priceRangeInput.value).toLocaleString('es-CL')}`;

        // Event listener para actualizar el valor del rango
        priceRangeInput.addEventListener('input', () => {
            priceValueDisplay.textContent = `$${parseFloat(priceRangeInput.value).toLocaleString('es-CL')}`;
        });
    }

    // Eventos para los botones de categoría y búsqueda
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', e => {
            document.querySelector('.filter-button.active')?.classList.remove('active');
            e.currentTarget.classList.add('active');
            applyFilters();
        });
    });

    // Se agrega botón forzando la funcionalidad para la búsqueda y el rango de precio
    document.getElementById('applyFiltersButton').addEventListener('click', applyFilters);
}

// Eventos para los botones de "Agregar al carrito"
document.addEventListener('click', (e) => {
    const button = e.target.closest('.add-to-cart-btn');
    if (button) {
        const productId = button.dataset.productId;
        const product = store.getProductById(productId);
        if (product) {
            const added = store.cart.addItem(product, 1);
            if (added) {
                // Actualiza el stock en la tienda y en el almacenamiento local
                product.stock = Math.max(0, product.stock - 1);
                store.saveProducts();
                applyFilters();
                renderCart();
                // Muestra el offcanvas del carrito si se agregó un producto
                cartOffcanvas.show();
            }
        }
    }

    // Eventos para los botones de "Eliminar" y el input de cantidad del carrito
    const removeButton = e.target.closest('.remove-from-cart-btn');
    if (removeButton) {
        const productId = removeButton.dataset.productId;
        store.cart.removeItem(productId);
        // Encuentra el producto y devuelve su stock al valor original
        const originalProduct = store.products.find(p => p.id === productId);
        if (originalProduct) {
            originalProduct.stock += 1;
        }
        store.saveProducts();
        renderCart();
        applyFilters();
    }
});

// Manejo del cambio de cantidad en el carrito
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('cart-item-quantity')) {
        const input = e.target;
        const productId = input.dataset.productId;
        const newQuantity = parseInt(input.value);

        if (!isNaN(newQuantity) && newQuantity > 0) {
            store.cart.updateQuantity(productId, newQuantity);
        } else {
            input.value = 1;
            store.cart.updateQuantity(productId, 1);
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

    filteredProducts = store.products;
    renderProducts(filteredProducts);
    renderCart();
    updateCartBadge();

    if (productsGrid) {
        setupFilters();
    }
});