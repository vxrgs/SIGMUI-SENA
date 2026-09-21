document.addEventListener('DOMContentLoaded', () => {
  const reservas = [
    {
      id: "PRK-001",
      estado: "confirmada",
      zona: "Zona Norte A",
      fecha: "18 Mar 2026 - 2:00 AM",
      tiempo: "2 horas",
      precio: "$2000"
    },
    {
      id: "PRK-002",
      estado: "pendiente",
      zona: "Zona Sur B",
      fecha: "19 Mar 2026 - 4:00 PM",
      tiempo: "3 horas",
      precio: "$3000"
    },
    {
      id: "PRK-003",
      estado: "usada",
      zona: "Zona Central",
      fecha: "10 Mar 2025 - 2:00 AM",
      tiempo: "1 hora",
      precio: "$1500"
    }
  ];

  let reservaSeleccionada = null;

  // Elementos principales
  const reservasContainer = document.querySelector(".reservas-container");
  const alerta = document.getElementById("alerta");
  const detalleReserva = document.querySelector(".detalle-reserva");
  const alertaTexto = document.querySelector(".alerta-texto");
  const detalleExito = document.querySelector(".detalle-exito");

  // Botones de interacción
  const btnConfirmar = document.querySelector(".btn-confirmar");
  const btnVolver = document.querySelector(".btn-volver");
  const btnVerReservas = document.querySelector(".btn-ver-reservas");
  const btnInicio = document.querySelector(".btn-inicio");

  function renderReservas() {
    if (!reservasContainer) return;
    reservasContainer.innerHTML = "";

    reservas.filter(r => r.estado !== "cancelado").forEach(r => {
      const div = document.createElement("div");
      div.className = "bg-gray-950 border border-gray-800 rounded-lg p-4 transition-all hover:border-error hover:scale-[1.01]";

      let estadoClasses = "px-2 py-0.5 rounded-full text-xs font-medium border ";
      if (r.estado === "confirmada") {
        estadoClasses += "bg-secondary-500/15 border-secondary-500 text-secondary-400";
      } else if (r.estado === "pendiente") {
        estadoClasses += "bg-warning/15 border-warning text-warning";
      } else {
        estadoClasses += "bg-gray-800 border-gray-600 text-gray-400";
      }

      div.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold text-primary-400">${r.id}</span>
          <span class="${estadoClasses}">${r.estado}</span>
        </div>
        <p class="text-sm font-semibold text-gray-200">${r.zona}</p>
        <p class="text-xs text-gray-400">${r.fecha}</p>
        <p class="text-xs text-gray-400 mb-3">${r.tiempo} - ${r.precio}</p>

        <button class="btn-cancelar w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-error bg-error/10 text-error hover:bg-error/20 transition-all text-sm font-medium" data-id="${r.id}">
          🗑 Cancelar reserva
        </button>
      `;

      reservasContainer.appendChild(div);
    });

    document.querySelectorAll(".btn-cancelar").forEach(btn => {
      btn.addEventListener("click", () => {
        reservaSeleccionada = reservas.find(r => r.id === btn.dataset.id);
        mostrar("confirmacion");

        if (detalleReserva) detalleReserva.innerText = `${reservaSeleccionada.id} - ${reservaSeleccionada.zona}`;
        if (alertaTexto) alertaTexto.innerText = "¿Estás seguro que deseas cancelar esta reserva? El cupo será liberado automáticamente.";
      });
    });
  }

  function mostrar(tipo) {
    document.querySelectorAll(".card-step").forEach(c => {
      c.classList.add("hidden");
    });

    const card = document.getElementById(`card-${tipo}`);
    if (card) {
      card.classList.remove("hidden");
    }
  }

  function cancelarReserva() {
    if (!reservaSeleccionada) {
      mostrarAlerta("No hay ninguna reserva seleccionada");
      return;
    }

    if (reservaSeleccionada.estado === "usada") {
      mostrarAlerta("No puedes cancelar una reserva ya utilizada");
      return;
    }

    if (estaExpirada(reservaSeleccionada.fecha)) {
      mostrarAlerta("No puedes cancelar una reserva expirada");
      return;
    }

    if (reservaSeleccionada.estado === "cancelado") {
      mostrarAlerta("Esta reserva ya fue cancelada");
      return;
    }

    reservaSeleccionada.estado = "cancelado";

    if (detalleExito) {
      detalleExito.innerHTML = `
        <div class="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
          <p><strong class="text-gray-200">Código:</strong> ${reservaSeleccionada.id}</p>
          <p><strong class="text-gray-200">Zona:</strong> ${reservaSeleccionada.zona}</p>
          <p><strong class="text-gray-200">Fecha:</strong> ${reservaSeleccionada.fecha}</p>
          <p><strong class="text-gray-200">Estado:</strong> <span class="px-2 py-0.5 rounded-full border bg-error/15 border-error text-error">Cancelada</span></p>
          <div class="mt-2 pt-2 border-t border-gray-800 text-secondary-400 font-semibold">
            +1 cupo liberado en ${reservaSeleccionada.zona}
          </div>
        </div>
      `;
    }

    renderReservas();
    mostrar("exito");
  }

  function mostrarAlerta(mensaje) {
    if (!alerta) return;
    alerta.innerText = mensaje;
    alerta.classList.remove("hidden");

    setTimeout(() => {
      alerta.classList.add("hidden");
    }, 3000);
  }

  function estaExpirada(fechaTexto) {
    const fechaReserva = new Date(fechaTexto);
    const ahora = new Date();
    return fechaReserva < ahora;
  }

  // Event Listeners directos (Estilo Scrum Master)
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", () => cancelarReserva());
  }

  if (btnVolver) {
    btnVolver.addEventListener("click", () => mostrar("lista"));
  }

  if (btnVerReservas) {
    btnVerReservas.addEventListener("click", () => mostrar("lista"));
  }

  if (btnInicio) {
    btnInicio.addEventListener("click", () => {
      window.location.href = "/zonas";
    });
  }

  // Inicializar vista
  renderReservas();
  mostrar("lista");
});