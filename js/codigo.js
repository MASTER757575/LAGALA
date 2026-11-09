const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");

const botonIniciar = document.getElementById("iniciar");
const botonPausar = document.getElementById("pausar");
const botonReiniciar = document.getElementById("reiniciar");
const mensaje = document.querySelector(".mensaje");

// Variables del juego
let puntuacion = 0;
let vidas = 3;
let enemigosEliminados = 0;
let jugando = false;
let pausado = false;
let teclas = {};
let disparos = [];
let enemigos = [];
let ultimoEnemigo = 0;

// Objeto jugador
const jugador = {
    x: 400,
    y: 390,
    ancho: 35,
    alto: 30,
    velocidad: 5,

    dibujar: function () {
        ctx.fillStyle = "#65caff";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.alto / 2);
        ctx.lineTo(this.x - this.ancho / 2, this.y + this.alto / 2);
        ctx.lineTo(this.x + this.ancho / 2, this.y + this.alto / 2);
        ctx.closePath();
        ctx.fill();
    },

    mover: function () {
        if (teclas["ArrowLeft"] || teclas["a"]) {
            this.x -= this.velocidad;
        }

        if (teclas["ArrowRight"] || teclas["d"]) {
            this.x += this.velocidad;
        }

        if (teclas["ArrowUp"] || teclas["w"]) {
            this.y -= this.velocidad;
        }

        if (teclas["ArrowDown"] || teclas["s"]) {
            this.y += this.velocidad;
        }

        // Evitar que la nave salga del canvas
        this.x = Math.max(this.ancho / 2,
            Math.min(canvas.width - this.ancho / 2, this.x));

        this.y = Math.max(this.alto / 2,
            Math.min(canvas.height - this.alto / 2, this.y));
    },

    disparar: function () {
        disparos.push({
            x: this.x,
            y: this.y - this.alto / 2,
            velocidad: 7
        });
    }
};

// Objeto enemigo
function Enemigo() {
    this.x = Math.random() * (canvas.width - 40) + 20;
    this.y = -20;
    this.radio = 15;
    this.velocidad = 1.5 + Math.random() * 1.5;

    this.dibujar = function () {
        ctx.fillStyle = "#ff6584";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.x - 5, this.y - 3, 3, 3);
        ctx.fillRect(this.x + 3, this.y - 3, 3, 3);
    };

    this.mover = function () {
        this.y += this.velocidad;
    };
}

// Dibujar el fondo espacial
function dibujarFondo() {
    ctx.fillStyle = "#080d35";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estrellas
    ctx.fillStyle = "#ffffff";

    for (let i = 0; i < 50; i++) {
        let x = (i * 137) % canvas.width;
        let y = (i * 83) % canvas.height;

        ctx.fillRect(x, y, 2, 2);
    }
}

// Actualizar los datos en pantalla
function actualizarInformacion() {
    document.getElementById("puntuacion").textContent = puntuacion;
    document.getElementById("enemigos").textContent =
        enemigosEliminados + " / 10";

    const vidasTexto = document.querySelector(
        ".informacion div:nth-child(2) h2"
    );

    vidasTexto.textContent = "♥ ".repeat(vidas);
}

// Dibujar todos los elementos
function dibujarJuego() {
    dibujarFondo();

    disparos.forEach(function (disparo) {
        ctx.fillStyle = "#ffe66d";
        ctx.fillRect(disparo.x - 3, disparo.y, 6, 12);
    });

    enemigos.forEach(function (enemigo) {
        enemigo.dibujar();
    });

    jugador.dibujar();
}

// Detectar colisiones
function detectarColisiones() {
    for (let i = disparos.length - 1; i >= 0; i--) {
        for (let j = enemigos.length - 1; j >= 0; j--) {
            let dx = disparos[i].x - enemigos[j].x;
            let dy = disparos[i].y - enemigos[j].y;
            let distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia < enemigos[j].radio + 5) {
                disparos.splice(i, 1);
                enemigos.splice(j, 1);

                puntuacion += 10;
                enemigosEliminados++;
                actualizarInformacion();
                break;
            }
        }
    }

    // Si un enemigo llega a la nave
    for (let i = enemigos.length - 1; i >= 0; i--) {
        let dx = jugador.x - enemigos[i].x;
        let dy = jugador.y - enemigos[i].y;
        let distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia < enemigos[i].radio + 15) {
            enemigos.splice(i, 1);
            vidas--;
            actualizarInformacion();

            if (vidas <= 0) {
                terminarJuego("¡Fin del juego!");
                return;
            }
        }
    }
}

// Comprobar la victoria
function comprobarVictoria() {
    if (enemigosEliminados >= 10) {
        terminarJuego("¡Has salvado la galaxia!");
    }
}

// Mostrar el resultado final
function terminarJuego(texto) {
    jugando = false;
    pausado = false;
    mensaje.classList.remove("oculto");

    mensaje.innerHTML =
        "<h2>" + texto + "</h2>" +
        "<p>Puntuación final: " + puntuacion + "</p>" +
        "<p>Presiona Reiniciar para volver a jugar.</p>";

    botonPausar.textContent = "Pausar";
}

// Bucle principal del juego
function actualizar() {
    if (!jugando || pausado) {
        return;
    }

    jugador.mover();

    // Mover los disparos
    disparos.forEach(function (disparo) {
        disparo.y -= disparo.velocidad;
    });

    disparos = disparos.filter(function (disparo) {
        return disparo.y > 0;
    });

    // Crear enemigos cada cierto tiempo
    let ahora = Date.now();

    if (ahora - ultimoEnemigo > 1000) {
        enemigos.push(new Enemigo());
        ultimoEnemigo = ahora;
    }

    // Mover enemigos
    enemigos.forEach(function (enemigo) {
        enemigo.mover();
    });

    // Los enemigos que pasan la pantalla restan una vida
    for (let i = enemigos.length - 1; i >= 0; i--) {
        if (enemigos[i].y > canvas.height) {
            enemigos.splice(i, 1);
            vidas--;
            actualizarInformacion();

            if (vidas <= 0) {
                terminarJuego("¡Fin del juego!");
                return;
            }
        }
    }

    detectarColisiones();

    if (!jugando) {
        return;
    }

    comprobarVictoria();

    if (!jugando) {
        return;
    }

    dibujarJuego();
    requestAnimationFrame(actualizar);
}

// Iniciar la partida
function iniciarJuego() {
    if (jugando) return;

    jugando = true;
    pausado = false;
    mensaje.classList.add("oculto");
    botonPausar.textContent = "Pausar";

    actualizar();
}

// Reiniciar todos los valores
function reiniciarJuego() {
    puntuacion = 0;
    vidas = 3;
    enemigosEliminados = 0;
    disparos = [];
    enemigos = [];
    teclas = {};
    jugador.x = canvas.width / 2;
    jugador.y = canvas.height - 60;
    ultimoEnemigo = Date.now();

    jugando = false;
    pausado = false;

    mensaje.innerHTML =
        "<h2>¡Prepárate para jugar!</h2>" +
        "<p>Destruye las naves enemigas y consigue puntos.</p>";

    mensaje.classList.remove("oculto");
    botonPausar.textContent = "Pausar";

    actualizarInformacion();
    dibujarJuego();
}

// Eventos del teclado
document.addEventListener("keydown", function (evento) {
    teclas[evento.key] = true;

    if (["ArrowUp", "ArrowDown", "ArrowLeft",
        "ArrowRight", " "].includes(evento.key)) {
        evento.preventDefault();
    }

    if (evento.code === "Space" && jugando && !pausado) {
        if (!evento.repeat) {
            jugador.disparar();
        }
    }
});

document.addEventListener("keyup", function (evento) {
    teclas[evento.key] = false;
});

// Eventos de los botones
botonIniciar.addEventListener("click", iniciarJuego);

botonPausar.addEventListener("click", function () {
    if (!jugando) return;

    pausado = !pausado;

    if (pausado) {
        botonPausar.textContent = "Continuar";
    } else {
        botonPausar.textContent = "Pausar";
        actualizar();
    }
});

botonReiniciar.addEventListener("click", reiniciarJuego);

// Controles táctiles para celulares
const controlesMoviles = document.createElement("div");
controlesMoviles.className = "controles-moviles";

controlesMoviles.innerHTML = `
    <button type="button" data-tecla="ArrowLeft">◀</button>
    <button type="button" data-tecla="ArrowUp">▲</button>
    <button type="button" data-tecla="ArrowDown">▼</button>
    <button type="button" data-tecla="ArrowRight">▶</button>
    <button type="button" id="dispararMovil">Disparar</button>
`;

document.querySelector(".botones").after(controlesMoviles);

controlesMoviles.querySelectorAll("[data-tecla]").forEach(function (boton) {
    const tecla = boton.dataset.tecla;

    boton.addEventListener("pointerdown", function (evento) {
        evento.preventDefault();
        teclas[tecla] = true;
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach(
        function (nombreEvento) {
            boton.addEventListener(nombreEvento, function () {
                teclas[tecla] = false;
            });
        }
    );

    boton.addEventListener("contextmenu", function (evento) {
        evento.preventDefault();
    });
});

document.getElementById("dispararMovil").addEventListener(
    "pointerdown",
    function (evento) {
        evento.preventDefault();

        if (jugando && !pausado) {
            jugador.disparar();
        }
    }
);

// Preparar la pantalla inicial
actualizarInformacion();
dibujarJuego();