"use strict";

/* ==========================================================
   ALGORITMO PARA EL CÁLCULO DE ÁREAS, PERÍMETROS Y VOLÚMENES

   Flujo general:
   1. El usuario elige una categoría (figuras planas, sólidos o
      sólido irregular) y una figura.
   2. El programa genera los campos de entrada de esa figura.
   3. Al pulsar "Calcular" se leen y validan los datos
      (no vacíos, numéricos y mayores que cero).
   4. Se aplican las fórmulas de la figura.
   5. Se muestra cada resultado con su fórmula y la sustitución
      de valores, para ver el procedimiento.
   ========================================================== */

/* ---------- Utilidades ---------- */

// Número con hasta 4 decimales y formato colombiano (1.234,56)
const formatear = (n) =>
  Number(n.toFixed(4)).toLocaleString("es-CO", { maximumFractionDigits: 4 });

const SUPERINDICE = { 2: "²", 3: "³" };

// exp indica la potencia de la unidad: 1 = cm, 2 = cm², 3 = cm³
const medida = (nombre, formula, sustitucion, valor, exp) => ({
  nombre,
  formula,
  sustitucion,
  valor,
  exp,
});

/* ---------- Catálogo de figuras y fórmulas ---------- */

const CATEGORIAS = {
  planas: {
    titulo: "Figuras planas",
    descripcion: "Área y perímetro",
    figuras: {
      cuadrado: {
        nombre: "Cuadrado",
        campos: [{ id: "lado", etiqueta: "Lado (l)" }],
        calcular: ({ lado }) => [
          medida("Área", "A = l²", `A = ${formatear(lado)}²`, lado ** 2, 2),
          medida("Perímetro", "P = 4 · l", `P = 4 · ${formatear(lado)}`, 4 * lado, 1),
        ],
      },

      rectangulo: {
        nombre: "Rectángulo",
        campos: [
          { id: "base", etiqueta: "Base (b)" },
          { id: "altura", etiqueta: "Altura (h)" },
        ],
        calcular: ({ base, altura }) => [
          medida("Área", "A = b · h", `A = ${formatear(base)} · ${formatear(altura)}`, base * altura, 2),
          medida("Perímetro", "P = 2 · (b + h)", `P = 2 · (${formatear(base)} + ${formatear(altura)})`, 2 * (base + altura), 1),
        ],
      },

      triangulo: {
        nombre: "Triángulo",
        campos: [
          { id: "a", etiqueta: "Lado a" },
          { id: "b", etiqueta: "Lado b" },
          { id: "c", etiqueta: "Lado c" },
        ],
        validar: ({ a, b, c }) =>
          a + b > c && a + c > b && b + c > a
            ? null
            : "Con esos lados no se forma un triángulo: la suma de dos lados siempre debe ser mayor que el tercero.",
        calcular: ({ a, b, c }) => {
          const s = (a + b + c) / 2; // semiperímetro
          const area = Math.sqrt(s * (s - a) * (s - b) * (s - c)); // fórmula de Herón
          return [
            medida(
              "Área",
              "A = √[s · (s − a) · (s − b) · (s − c)], con s = (a + b + c) / 2",
              `s = ${formatear(s)}; A = √[${formatear(s)} · ${formatear(s - a)} · ${formatear(s - b)} · ${formatear(s - c)}]`,
              area,
              2
            ),
            medida("Perímetro", "P = a + b + c", `P = ${formatear(a)} + ${formatear(b)} + ${formatear(c)}`, a + b + c, 1),
          ];
        },
      },

      circulo: {
        nombre: "Círculo",
        campos: [{ id: "radio", etiqueta: "Radio (r)" }],
        calcular: ({ radio }) => [
          medida("Área", "A = π · r²", `A = π · ${formatear(radio)}²`, Math.PI * radio ** 2, 2),
          medida("Perímetro (circunferencia)", "P = 2 · π · r", `P = 2 · π · ${formatear(radio)}`, 2 * Math.PI * radio, 1),
        ],
      },

      trapecio: {
        nombre: "Trapecio",
        campos: [
          { id: "baseMayor", etiqueta: "Base mayor (B)" },
          { id: "baseMenor", etiqueta: "Base menor (b)" },
          { id: "altura", etiqueta: "Altura (h)" },
          { id: "ladoC", etiqueta: "Lado no paralelo (c)" },
          { id: "ladoD", etiqueta: "Lado no paralelo (d)" },
        ],
        calcular: ({ baseMayor, baseMenor, altura, ladoC, ladoD }) => [
          medida(
            "Área",
            "A = ((B + b) · h) / 2",
            `A = ((${formatear(baseMayor)} + ${formatear(baseMenor)}) · ${formatear(altura)}) / 2`,
            ((baseMayor + baseMenor) * altura) / 2,
            2
          ),
          medida(
            "Perímetro",
            "P = B + b + c + d",
            `P = ${formatear(baseMayor)} + ${formatear(baseMenor)} + ${formatear(ladoC)} + ${formatear(ladoD)}`,
            baseMayor + baseMenor + ladoC + ladoD,
            1
          ),
        ],
      },

      rombo: {
        nombre: "Rombo",
        campos: [
          { id: "diagonalMayor", etiqueta: "Diagonal mayor (D)" },
          { id: "diagonalMenor", etiqueta: "Diagonal menor (d)" },
        ],
        calcular: ({ diagonalMayor, diagonalMenor }) => {
          // El lado del rombo es la hipotenusa de un triángulo rectángulo
          // formado por las mitades de las diagonales.
          const lado = Math.sqrt((diagonalMayor / 2) ** 2 + (diagonalMenor / 2) ** 2);
          return [
            medida(
              "Área",
              "A = (D · d) / 2",
              `A = (${formatear(diagonalMayor)} · ${formatear(diagonalMenor)}) / 2`,
              (diagonalMayor * diagonalMenor) / 2,
              2
            ),
            medida(
              "Perímetro",
              "P = 4 · l, con l = √[(D/2)² + (d/2)²]",
              `l = √[(${formatear(diagonalMayor / 2)})² + (${formatear(diagonalMenor / 2)})²] = ${formatear(lado)}; P = 4 · ${formatear(lado)}`,
              4 * lado,
              1
            ),
          ];
        },
      },

      poligono: {
        nombre: "Polígono regular",
        campos: [
          { id: "n", etiqueta: "Número de lados (n)", entero: true, min: 3, max: 100, sinUnidad: true },
          { id: "lado", etiqueta: "Longitud del lado (l)" },
        ],
        calcular: ({ n, lado }) => [
          medida(
            "Área",
            "A = (n · l²) / (4 · tan(π / n))",
            `A = (${formatear(n)} · ${formatear(lado)}²) / (4 · tan(π / ${formatear(n)}))`,
            (n * lado ** 2) / (4 * Math.tan(Math.PI / n)),
            2
          ),
          medida("Perímetro", "P = n · l", `P = ${formatear(n)} · ${formatear(lado)}`, n * lado, 1),
        ],
      },
    },
  },

  solidos: {
    titulo: "Sólidos regulares",
    descripcion: "Volumen",
    figuras: {
      cubo: {
        nombre: "Cubo",
        campos: [{ id: "arista", etiqueta: "Arista (a)" }],
        calcular: ({ arista }) => [
          medida("Volumen", "V = a³", `V = ${formatear(arista)}³`, arista ** 3, 3),
        ],
      },

      prisma: {
        nombre: "Prisma rectangular",
        campos: [
          { id: "largo", etiqueta: "Largo (l)" },
          { id: "ancho", etiqueta: "Ancho (w)" },
          { id: "alto", etiqueta: "Alto (h)" },
        ],
        calcular: ({ largo, ancho, alto }) => [
          medida("Volumen", "V = l · w · h", `V = ${formatear(largo)} · ${formatear(ancho)} · ${formatear(alto)}`, largo * ancho * alto, 3),
        ],
      },

      cilindro: {
        nombre: "Cilindro",
        campos: [
          { id: "radio", etiqueta: "Radio de la base (r)" },
          { id: "altura", etiqueta: "Altura (h)" },
        ],
        calcular: ({ radio, altura }) => [
          medida("Volumen", "V = π · r² · h", `V = π · ${formatear(radio)}² · ${formatear(altura)}`, Math.PI * radio ** 2 * altura, 3),
        ],
      },

      cono: {
        nombre: "Cono",
        campos: [
          { id: "radio", etiqueta: "Radio de la base (r)" },
          { id: "altura", etiqueta: "Altura (h)" },
        ],
        calcular: ({ radio, altura }) => [
          medida("Volumen", "V = (π · r² · h) / 3", `V = (π · ${formatear(radio)}² · ${formatear(altura)}) / 3`, (Math.PI * radio ** 2 * altura) / 3, 3),
        ],
      },

      esfera: {
        nombre: "Esfera",
        campos: [{ id: "radio", etiqueta: "Radio (r)" }],
        calcular: ({ radio }) => [
          medida("Volumen", "V = (4/3) · π · r³", `V = (4/3) · π · ${formatear(radio)}³`, (4 / 3) * Math.PI * radio ** 3, 3),
        ],
      },

      piramide: {
        nombre: "Pirámide de base cuadrada",
        campos: [
          { id: "ladoBase", etiqueta: "Lado de la base (l)" },
          { id: "altura", etiqueta: "Altura (h)" },
        ],
        calcular: ({ ladoBase, altura }) => [
          medida("Volumen", "V = (B · h) / 3, con B = l²", `V = (${formatear(ladoBase)}² · ${formatear(altura)}) / 3`, (ladoBase ** 2 * altura) / 3, 3),
        ],
      },
    },
  },

  irregular: {
    titulo: "Sólido irregular",
    descripcion: "Desplazamiento de agua",
    unidadFija: "mL",
    figuras: {
      desplazamiento: {
        nombre: "Método de Arquímedes",
        campos: [
          { id: "inicial", etiqueta: "Volumen inicial del agua (mL)" },
          { id: "final", etiqueta: "Volumen con el objeto sumergido (mL)" },
        ],
        nota: "Sumerge el objeto por completo en un recipiente graduado. Equivalencia: 1 mL = 1 cm³.",
        validar: ({ inicial, final }) =>
          final > inicial ? null : "El volumen final debe ser mayor que el inicial: el objeto desplaza agua al sumergirse.",
        calcular: ({ inicial, final }) => [
          medida("Volumen del sólido", "V = V final − V inicial", `V = ${formatear(final)} − ${formatear(inicial)}`, final - inicial, 3),
        ],
      },
    },
  },
};

/* ---------- Estado y referencias al DOM ---------- */

const estado = { categoria: "planas", figura: "cuadrado" };

const $ = (id) => document.getElementById(id);
const contenedorCategorias = $("categorias");
const contenedorFiguras = $("lista-figuras");
const tituloDatos = $("titulo-datos");
const contenedorCampos = $("campos");
const formulario = $("formulario");
const selectUnidad = $("unidad");
const bloqueUnidad = $("bloque-unidad");
const mensajeNota = $("nota");
const mensajeError = $("error");
const contenedorResultado = $("resultado");

const MENSAJE_VACIO = "Escribe las medidas y pulsa Calcular para ver el resultado y su procedimiento.";

// Crea un elemento con clase y texto (textContent evita inyectar HTML)
function crear(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

const categoriaActual = () => CATEGORIAS[estado.categoria];
const figuraActual = () => categoriaActual().figuras[estado.figura];

/* ---------- Dibujar la interfaz ---------- */

function dibujarCategorias() {
  contenedorCategorias.replaceChildren();
  Object.entries(CATEGORIAS).forEach(([clave, categoria]) => {
    const boton = crear("button", "categoria", categoria.titulo);
    boton.type = "button";
    boton.setAttribute("aria-pressed", String(clave === estado.categoria));
    boton.append(crear("small", "", categoria.descripcion));
    boton.addEventListener("click", () => {
      estado.categoria = clave;
      estado.figura = Object.keys(categoria.figuras)[0];
      dibujarTodo();
    });
    contenedorCategorias.append(boton);
  });
}

function dibujarFiguras() {
  contenedorFiguras.replaceChildren();
  Object.entries(categoriaActual().figuras).forEach(([clave, figura]) => {
    const boton = crear("button", "figura", figura.nombre);
    boton.type = "button";
    boton.setAttribute("aria-pressed", String(clave === estado.figura));
    boton.addEventListener("click", () => {
      estado.figura = clave;
      dibujarTodo();
    });
    contenedorFiguras.append(boton);
  });
}

function dibujarCampos() {
  const figura = figuraActual();
  tituloDatos.textContent = figura.nombre;
  contenedorCampos.replaceChildren();

  figura.campos.forEach((campo) => {
    const bloque = crear("div", "campo");
    const etiqueta = crear("label", "", campo.etiqueta);
    etiqueta.htmlFor = `campo-${campo.id}`;

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal"; // teclado numérico en el celular
    input.id = `campo-${campo.id}`;
    input.autocomplete = "off";
    input.addEventListener("input", () => {
      input.removeAttribute("aria-invalid");
      ocultarError();
    });

    bloque.append(etiqueta, input);
    contenedorCampos.append(bloque);
  });

  // Unidad: se oculta en el sólido irregular porque usa mL
  bloqueUnidad.hidden = Boolean(categoriaActual().unidadFija);

  mensajeNota.hidden = !figura.nota;
  mensajeNota.textContent = figura.nota || "";
}

function limpiarResultado() {
  contenedorResultado.replaceChildren(crear("p", "vacio", MENSAJE_VACIO));
}

function dibujarTodo() {
  dibujarCategorias();
  dibujarFiguras();
  dibujarCampos();
  ocultarError();
  limpiarResultado();
}

/* ---------- Validación ---------- */

function mostrarError(texto, input) {
  mensajeError.textContent = texto;
  mensajeError.hidden = false;
  if (input) {
    input.setAttribute("aria-invalid", "true");
    input.focus();
  }
}

function ocultarError() {
  mensajeError.hidden = true;
  mensajeError.textContent = "";
}

// Lee los campos y devuelve { valores } o { error, input }
function leerValores(figura) {
  const valores = {};

  for (const campo of figura.campos) {
    const input = $(`campo-${campo.id}`);
    const nombre = campo.etiqueta.replace(/\s*\(.*\)$/, "").toLowerCase();
    const texto = input.value.trim().replace(",", "."); // acepta coma decimal

    if (texto === "") {
      return { error: `Falta escribir: ${nombre}.`, input };
    }

    const numero = Number(texto);

    if (!Number.isFinite(numero)) {
      return { error: `En "${nombre}" escribe solo números (por ejemplo 12,5).`, input };
    }
    if (numero <= 0) {
      return { error: `El valor de "${nombre}" debe ser mayor que cero.`, input };
    }
    if (campo.entero && !Number.isInteger(numero)) {
      return { error: `El valor de "${nombre}" debe ser un número entero.`, input };
    }
    if (campo.min !== undefined && numero < campo.min) {
      return { error: `El valor de "${nombre}" debe ser mínimo ${campo.min}.`, input };
    }
    if (campo.max !== undefined && numero > campo.max) {
      return { error: `El valor de "${nombre}" debe ser máximo ${campo.max}.`, input };
    }

    valores[campo.id] = numero;
  }

  // Reglas que involucran varios campos (por ejemplo, la desigualdad triangular)
  if (figura.validar) {
    const mensaje = figura.validar(valores);
    if (mensaje) return { error: mensaje, input: null };
  }

  return { valores };
}

/* ---------- Calcular y mostrar ---------- */

function mostrarResultados(medidas) {
  const categoria = categoriaActual();
  const unidadBase = categoria.unidadFija || selectUnidad.value;
  contenedorResultado.replaceChildren();

  medidas.forEach((m) => {
    const unidad = categoria.unidadFija ? categoria.unidadFija : unidadBase + (SUPERINDICE[m.exp] || "");

    const tarjeta = crear("article", "medida");
    const valor = crear("p", "valor");
    valor.append(crear("span", "numero", formatear(m.valor)), crear("span", "unidad-resultado", unidad));

    tarjeta.append(
      crear("h3", "", m.nombre),
      valor,
      crear("p", "formula", `Fórmula: ${m.formula}`),
      crear("p", "sustitucion", `${m.sustitucion} = ${formatear(m.valor)} ${unidad}`)
    );
    contenedorResultado.append(tarjeta);
  });
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  ocultarError();

  const figura = figuraActual();
  const lectura = leerValores(figura);

  if (lectura.error) {
    limpiarResultado();
    mostrarError(lectura.error, lectura.input);
    return;
  }

  mostrarResultados(figura.calcular(lectura.valores));
});

formulario.addEventListener("reset", () => {
  ocultarError();
  contenedorCampos.querySelectorAll("input").forEach((i) => i.removeAttribute("aria-invalid"));
  limpiarResultado();
});

// Si cambia la unidad y ya hay un resultado, se recalcula con la nueva unidad
selectUnidad.addEventListener("change", () => {
  if (contenedorResultado.querySelector(".medida")) formulario.requestSubmit();
});

/* ---------- Inicio ---------- */

dibujarTodo();