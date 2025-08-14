/* Bienvenida al usuario nuevo */
document.addEventListener("DOMContentLoaded", () => {

    const bienvenida = document.getElementById("bienvenida");
    if (bienvenida) {
        if (localStorage.getItem("user")) {
            const user = localStorage.getItem("user");
            bienvenida.innerHTML = `${user}, tenemos lo que andas buscando.`;
        } else {
            const user = prompt("Ingrese su nombre.");
            bienvenida.innerHTML = `${user}, tenemos lo que andas buscando.`;
            localStorage.setItem("user", user);
        }
    }

    /* Productos */
    const productos = [
        { id: 1, nombre: "Mouse Gamer", precio: 15000, imagen: "assets/images/carrito/mouse.png" },
        { id: 2, nombre: "Teclado Mecánico", precio: 30000, imagen: "assets/images/carrito/teclado.png" },
        { id: 3, nombre: "Monitor 24''", precio: 90000, imagen: "assets/images/carrito/monitor.png" }
    ];

    // Recuperar carrito desde localStorage
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    // Elementos
    const listaProductos = document.getElementById("lista-productos");
    const items = document.getElementById("items");
    const total = document.getElementById("total");
    const filtro = document.getElementById("filtro");
    const contadorCarrito = document.getElementById("contadorCarrito");

    // Funciones carrito
    function actualizarContador() {
        if (contadorCarrito) {
            contadorCarrito.textContent = carrito.length;
        }
    }

    function guardarCarrito() {
        localStorage.setItem("carrito", JSON.stringify(carrito));
        actualizarContador();
    }

    function mostrarProductos(filtrados = productos) {
        if (!listaProductos) return; // Si no existe esta sección, salir
        listaProductos.innerHTML = "";
        filtrados.forEach(p => {
            listaProductos.innerHTML += `
            <div class="col-md-4">
                <div class="card border-0 shadow-lg bg-primary text-white">
                    <div class="card-body text-center">
                        <h5>${p.nombre}</h5>
                        <img src="${p.imagen}" class="card-img-top mx-auto d-block" alt="${p.nombre}" style="width:300px; height:auto;">
                        <p class="mt-2">Precio: $${p.precio}</p>
                        <button class="btn btn-light text-dark" onclick="agregarAlCarrito(${p.id})">Agregar</button>
                    </div>
                </div>
            </div>`;
        });
    }

    window.agregarAlCarrito = function(id) {
        const producto = productos.find(p => p.id === id);
        carrito.push(producto);
        guardarCarrito();
        actualizarCarrito();
    };

    function actualizarCarrito() {
        if (!items || !total) return; // Si no existe esta sección, salir
        items.innerHTML = "";
        let suma = 0;
        carrito.forEach((p, index) => {
            suma += p.precio;
            items.innerHTML += `<li class="list-group-item">
                ${p.nombre} - $${p.precio} 
                <button class="btn btn-sm btn-danger float-end" onclick="eliminarProducto(${index})">X</button>
            </li>`;
        });
        total.textContent = suma;
    }

    window.eliminarProducto = function(index) {
        carrito.splice(index, 1);
        guardarCarrito();
        actualizarCarrito();
    };

    const btnVaciar = document.getElementById("vaciar-carrito");
    if (btnVaciar) {
        btnVaciar.addEventListener("click", () => {
            carrito = [];
            guardarCarrito();
            actualizarCarrito();
        });
    }

    if (filtro) {
        filtro.addEventListener("input", () => {
            const texto = filtro.value.toLowerCase();
            const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(texto));
            mostrarProductos(filtrados);
        });
    }

    // Inicializar
    mostrarProductos();
    actualizarCarrito();
    actualizarContador();

});

