/* Bienvenida al usuario nuevo */

const bienvenida = document.getElementById("bienvenida");
if (bienvenida) {
    if (localStorage.getItem("user")) {
        const user = localStorage.getItem("user");
        bienvenida.innerHTML = `${user} tenemos lo que andas buscando!`;
    }
    else {
        const user = prompt("Ingrese su nombre.");
        bienvenida.innerHTML = `${user} tenemos lo que andas buscando!`;
        localStorage.setItem("user", user);
    }
    
}

/* Boton de guardado formulario de contacto */
const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
const alertTrigger = document.getElementById('liveAlertBtn');

function showAlert(message, type) {
    // Eliminar cualquier alerta anterior
    alertPlaceholder.innerHTML = '';

    // Crear nueva alerta
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
      `;

    alertPlaceholder.append(wrapper);
}

alertTrigger.addEventListener('click', () => {
    showAlert('Guardado exitosamente', 'success');
});

/* const productos = [
    {id:1, nombre: "Mouse",descripcion:"Mouse inalambrico con baterias de color negro", precio: 1500, urlImagen: "./assets/images/mouse.jpg"},
    {id:2, nombre: "Teclado",descripcion: "teclado mecánico, inalambrico,c on luces RGB", precio: 3000, urlImagen: "./assets/images/teclado.jpg"},
    {id:3, nombre: "Monitor", precio: 12000, urlImagen: "./assets/images/monitor.jpg"},
    {id:4, nombre: "Auriculares", precio: 4500, urlImagen: "./assets/images/auriculares.jpg"},
];

let carrito = [];

if (localStorage.getItem("carrito")) {
    carrito = JSON.parse(localStorage.getItem("carrito"));
    actualizarCarrito();
}


const bienvenida = document.getElementById("bienvenida");
if (bienvenida) {
    if (localStorage.getItem("user")) {
        const user = localStorage.getItem("user");
        bienvenida.innerHTML = `Bienvenido ${user} a nuestra tienda digital.`;
    }
    else {
        const user = prompt("Ingrese su nombre.");
        bienvenida.innerHTML = `Bienvenido ${user} a nuestra tienda digital.`;
        localStorage.setItem("user", user);
    }
    
}

function mostrarProductos(lista){
    const contenedor = document.getElementById("productos-contenedor");
    contenedor.innerHTML = "";
    lista.forEach(producto => {
        const card = document.createElement("div");
        card.className = "card ";
        card.style.width = "18rem";
        card.innerHTML = `
            <img src="${producto.urlImagen}" class="card-img-top" alt="${producto.nombre}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${producto.nombre}</h5>
                <p class="card-text">${producto.descripcion}</p>
                <p class="card-text">${producto.precio}</p>
                <button class="btn btn-primary mt-auto" onclick="agregarAlCarrito(${producto.id})">Agregar</Button>
            </div>`;
        contenedor.appendChild(card);
    });
}
mostrarProductos(productos);

const filtroProductos = document.getElementById("filtroProductos");
if (filtroProductos) {
    filtroProductos.addEventListener("input", (e) => {
        const productosFiltrados = productos.filter(producto => {
            return producto.nombre.toLowerCase().includes(e.target.value.toLowerCase())
        });
        mostrarProductos(productosFiltrados);
    });
}

function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    carrito.push(producto);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarrito();
}

function actualizarCarrito(){
    const listaCarrito = document.getElementById("listCarrito");
    const totalCarrito = document.getElementById("totalCarrito");
    listaCarrito.innerHTML = "";
    let total = 0;
    carrito.forEach((item, index) => {  
        total += item.precio;
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `${item.nombre} - <span>$${item.precio}</span>
            <button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${index})">X</button>`;
        listaCarrito.appendChild(li);
    });
    totalCarrito.innerText = total;
    document.getElementById("contadorCarrito").innerText = carrito.length;
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarrito();
}


const btnCarrito = document.getElementById("btnCarrito");
const offcanvascarrito = new bootstrap.Offcanvas(document.getElementById("offcanvasCarrito"));
btnCarrito.addEventListener("click", () => {
    offcanvascarrito.toggle();
});

 */