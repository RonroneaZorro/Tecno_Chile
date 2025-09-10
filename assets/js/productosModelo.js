/**
* PRODUCTOS DE LA TIENDA TECNO CHILE
* - Los productos
* - Los ítems dentro del carrito
* - El carrito (totales, guardar en localStorage, etc.)
* - El gestor de la tienda (cargar productos, buscar, cliente)
*/

// Guardamos nombres “etiquetas” que usaremos para guardar cosas en la memoria del navegador (LocalStorage).
const LS_PRODUCTS_KEY = 'products';
const LS_CART_KEY = 'shoppingCart';
const LS_CLIENT_NAME = 'clientName';
const LS_CLIENT_SURNAME = 'clientSurname';

// Plantilla para crear productos
// id - identificador
// code - código
// name - nombre
// description - descripción
// price - precio
// stock - stock
// imageSrc - url de la imagen
// category - categoria
// tags - etiquetas para busqueda
export class Product {
    constructor(id, code, name, description, price, stock, imageSrc, category, tags = []) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.price = Number(price);
        this.stock = Number(stock);
        this.imageSrc = imageSrc;
        this.category = category;
        this.tags = Array.isArray(tags) ? tags : [];
    }
}

// Productos dentro del carrito /Producto/Cantidad/Total a pagar
export class CartItem {
    constructor(product, quantity) {
        this.product = product;
        this.quantity = Number(quantity);
    }

    get total() {
        return this.product.price * this.quantity;
    }
}

// Carrito completo
// storedItems - carga los items del carrito de localStorage - navegador
// IVA_RATE y DESPATCH_CHARGE_RATE calculan el impuestos y envío.
export class Cart {
    constructor() {
        this.items = [];
        const storedItems = safeParseLocalStorage(LS_CART_KEY, []);
        this.items = storedItems.map(
            (item) =>
                new CartItem(
                    new Product(
                        item.product.id,
                        item.product.code,
                        item.product.name,
                        item.product.description,
                        item.product.price,
                        item.product.stock,
                        item.product.imageSrc,
                        item.product.category,
                        item.product.tags
                    ),
                    item.quantity
                )
        );

        this.IVA_RATE = 0.19;
        this.DESPATCH_CHARGE_RATE = 0.11;
        this.DESPATCH_CHARGE_THRESHOLD = 100000;
    }

    // Método utilizados en el carrito
    // save - guarda el carrito en localStorage
    // addItem - agrega un producto al carrito
    // removeItem - elimina un producto del carrito
    // clear - limpia el carrito
    // updateQuantity - actualiza la cantidad de un producto en el carrito
    // totalItems y totalValue - devuelven el total de productos y el total a pagar
    save() {
        localStorage.setItem(LS_CART_KEY, JSON.stringify(this.items));
    }

    addItem(product, quantity) {
        const qty = Number(quantity) || 0;
        if (qty <= 0) return false;

        const existing = this.items.find((i) => i.product.id === product.id);
        if (existing) {
            const newQty = existing.quantity + qty;
            if (newQty > product.stock) return false;
            existing.quantity = newQty;
        } else {
            if (qty > product.stock) return false;
            this.items.push(new CartItem(product, qty));
        }
        this.save();
        return true;
    }

    removeItem(productId) {
        this.items = this.items.filter((i) => i.product.id !== productId);
        this.save();
    }

    clear() {
        this.items = [];
        this.save();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.items.find((i) => i.product.id === productId);
        if (!item) return;
        const qty = Math.max(1, Math.min(Number(newQuantity) || 1, item.product.stock));
        item.quantity = qty;
        this.save();
    }

    get totalItems() {
        return this.items.reduce((acc, i) => acc + i.quantity, 0);
    }

    get totalValue() {
        const subtotal = this.items.reduce((acc, i) => acc + i.total, 0);
        const iva = subtotal * this.IVA_RATE;
        const despatchCharge = subtotal < this.DESPATCH_CHARGE_THRESHOLD ? subtotal * this.DESPATCH_CHARGE_RATE : 0;
        const total = subtotal + iva + despatchCharge;
        return { subtotal, iva, despatchCharge, total };
    }
}

// Gestor de la tienda
// Maneja los productos disponibles, el carrito y el cliente
export class StoreManager {
    constructor() {
        this.products = [];
        this.cart = new Cart();
        this.clientName = localStorage.getItem(LS_CLIENT_NAME) || '';
    }

    // Métodos de StoreManager
    // loadProducts - carga los productos desde productos.json
    // saveProducts - guarda los productos en localStorage
    // getProductById - devuelve un producto por su id
    // setClientName - establece el nombre y apellido del cliente
    async loadProducts() {
        // Cargamos primero el JSON para asegurarnos de tener los precios correctos
        // Luego combinamos con los stocks almacenados en localStorage para no perder el inventario actual
        let jsonProducts = [];
        try {
            const resp = await fetch('./assets/js/productos.json');
            const data = await resp.json();
            jsonProducts = data.map(
                // Se asegura que los valores sean del tipo correcto
                (p) => new Product(p.id, p.code, p.name, p.description, p.price, p.stock, p.imageSrc, p.category, p.tags)
            );
        } catch (err) {
            console.error('Error loading products.json:', err);
            jsonProducts = [];
        }

        // Recuperar productos guardados en localStorage solo para el stock
        const storedProducts = safeParseArray(localStorage.getItem(LS_PRODUCTS_KEY));
        this.products = jsonProducts.map((p) => {
            const stored = storedProducts.find((sp) => sp.id === p.id);
            if (stored) {
                // Solo conservamos el stock del localStorage
                p.stock = Number(stored.stock); 
            }
            return p;
        });

        this.saveProducts(); 
    }

    saveProducts() {
        localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(this.products));
    }

    getProductById(productId) {
        // Busca el producto por su ID
        return this.products.find((p) => p.id === productId);
    }

    setClientName(name, surname) {
        const full = `${name} ${surname}`.trim();
        this.clientName = full;
        localStorage.setItem(LS_CLIENT_NAME, full);
        localStorage.setItem(LS_CLIENT_SURNAME, surname || '');
    }
}

// Funciones auxiliares
// safeParseArray - intenta convertir un string a un array, revisa si esta vacio, si no lo "parsea"
// safeParseLocalStorage - intenta convertir un string a un objeto, revisa si esta vacio, si no lo "parsea"
function safeParseArray(raw) {
    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function safeParseLocalStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}