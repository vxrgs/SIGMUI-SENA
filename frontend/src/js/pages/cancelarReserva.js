document.addEventListener('DOMContentLoaded', () => {
  let reservas = [];
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

  function formatearFecha(iso) {
    const d = new Date(iso);
    const fecha = d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
    const hora = d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
    return `${fecha} - ${hora}`;
  }

  // Convierte la respuesta de la API al formato que usa esta pantalla
  function mapear(r) {
    return {
      id: r.id,
      codigo: r.code,
      estado: r.status === "pagada" ? "confirmada" : r.status,
      zona: r.zone,
      fecha: formatearFecha(r.startsAt),
      tiempo: `${r.hours} ${r.hours === 1 ? "hora" : "horas"}`,
      precio: `$${r.amount.toLocaleString("es-CO")}`,
      canCancel: r.canCancel
    };
  }

  async function cargarReservas() {
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      reservas = data.reservations.map(mapear);
    } catch (error) {
      mostrarAlerta("No se pudieron cargar tus reservas");
      reservas = [];
    }
    renderReservas();
  }

  function renderReservas() {
    if (!reservasContainer) return;
    reservasContainer.innerHTML = "";

    const cancelables = reservas.filter(r => r.canCancel);

    if (cancelables.length === 0) {
      reservasContainer.innerHTML = `
        <div class="p-6 text-center text-sm text-gray-400 border border-dashed border-gray-800 rounded-lg">
          No tienes reservas activas para cancelar
        </div>`;
      return;
    }

    cancelables.forEach(r => {
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
          <span class="font-bold text-primary-400">${r.codigo}</span>
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
        reservaSeleccionada = reservas.find(r => String(r.id) === btn.dataset.id);
        mostrar("confirmacion");

        if (detalleReserva) detalleReserva.innerText = `${reservaSeleccionada.codigo} - ${reservaSeleccionada.zona}`;
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

  // La validación real (usada, expirada, ya cancelada) la hace el servidor
  async function cancelarReserva() {
    if (!reservaSeleccionada) {
      mostrarAlerta("No hay ninguna reserva seleccionada");
      return;
    }

    btnConfirmar.disabled = true;
    try {
      const res = await fetch(`/api/reservations/${reservaSeleccionada.id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        mostrarAlerta(data.message || "No se pudo cancelar la reserva");
        mostrar("lista");
        await cargarReservas();
        return;
      }

      reservaSeleccionada.estado = "cancelado";

      if (detalleExito) {
        detalleExito.innerHTML = `
          <div class="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
            <p><strong class="text-gray-200">Código:</strong> ${reservaSeleccionada.codigo}</p>
            <p><strong class="text-gray-200">Zona:</strong> ${reservaSeleccionada.zona}</p>
            <p><strong class="text-gray-200">Fecha:</strong> ${reservaSeleccionada.fecha}</p>
            <p><strong class="text-gray-200">Estado:</strong> <span class="px-2 py-0.5 rounded-full border bg-error/15 border-error text-error">Cancelada</span></p>
            <div class="mt-2 pt-2 border-t border-gray-800 text-secondary-400 font-semibold">
              +1 cupo liberado en ${reservaSeleccionada.zona}
            </div>
          </div>
        `;
      }

      await cargarReservas();
      mostrar("exito");
    } catch (error) {
      mostrarAlerta("Error de conexión con el servidor");
    } finally {
      btnConfirmar.disabled = false;
    }
  }

  function mostrarAlerta(mensaje) {
    if (!alerta) return;
    alerta.innerText = mensaje;
    alerta.classList.remove("hidden");

    setTimeout(() => {
      alerta.classList.add("hidden");
    }, 3000);
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
  cargarReservas();
  mostrar("lista");
});