document.addEventListener("DOMContentLoaded", () => {
  let filtroActual = "todas";

  let reservas = [];

  function formatearFecha(iso) {
    const d = new Date(iso);
    const fecha = d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
    const hora = d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
    return `${fecha} - ${hora}`;
  }

  async function cargarReservas() {
    const cont = document.querySelector(".tabla-body");
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      reservas = data.reservations.map(r => ({
        codigo: r.code,
        zona: r.zone,
        vehiculo: r.vehicle,
        fecha: formatearFecha(r.startsAt),
        duracion: `${r.hours} ${r.hours === 1 ? "hora" : "horas"}`,
        monto: r.amount,
        estado: r.status === "cancelada" ? "cancelado" : r.status
      }));
    } catch (error) {
      if (cont) {
        cont.innerHTML = `
          <div class="p-8 text-center text-sm text-error bg-gray-900 border border-dashed border-gray-800 rounded-lg m-4">
            No se pudo cargar tu historial. Intenta de nuevo.
          </div>`;
      }
      return;
    }

    renderTabla();
    renderResumen();
  }

  function getReservasFiltradas() {
    if (filtroActual === "todas") return reservas;
    return reservas.filter(r => r.estado === filtroActual);
  }

  function renderTabla() {
    const cont = document.querySelector(".tabla-body");
    if (!cont) return;
    cont.innerHTML = "";

    const data = getReservasFiltradas();

    if (reservas.length === 0) {
      cont.innerHTML = `
        <div class="p-8 text-center text-sm text-gray-400 bg-gray-900 border border-dashed border-gray-800 rounded-lg m-4">
          No tienes reservas aún
        </div>`;
      return;
    }

    if (data.length === 0) {
      cont.innerHTML = `
        <div class="p-8 text-center text-sm text-gray-400 bg-gray-900 border border-dashed border-gray-800 rounded-lg m-4">
          No hay reservas en este estado
        </div>`;
      return;
    }

    data.forEach(r => {
      const row = document.createElement("div");
      row.className = "grid grid-cols-1 md:grid-cols-7 px-5 py-4 items-center gap-2 md:gap-0 transition-colors hover:bg-gray-800/50 text-sm";

      let estadoStyles = "";
      let montoColor = "";

      if (r.estado === "pagada") {
        estadoStyles = "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
        montoColor = "text-emerald-400";
      } else if (r.estado === "pendiente") {
        estadoStyles = "bg-warning/15 border-warning/40 text-warning";
        montoColor = "text-warning";
      } else {
        estadoStyles = "bg-error/15 border-error/40 text-error";
        montoColor = "text-error";
      }

      row.innerHTML = `
        <div>
          <span class="inline-block px-2.5 py-1 rounded-full border border-primary-500/40 bg-primary-500/15 text-primary-400 text-xs font-medium">
            ${r.codigo}
          </span>
        </div>
        <div class="text-gray-200 font-medium">${r.zona}</div>
        <div class="text-gray-400">${r.vehiculo}</div>
        <div class="text-gray-400 text-xs">${r.fecha}</div>
        <div class="text-gray-400">${r.duracion}</div>
        <div class="font-bold ${montoColor}">$${r.monto.toLocaleString()}</div>
        <div>
          <span class="inline-block px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${estadoStyles}">
            ${r.estado}
          </span>
        </div>
      `;

      cont.appendChild(row);
    });
  }

  function renderResumen() {
    const totalEl = document.getElementById("totalReservas");
    const pagadasEl = document.getElementById("totalPagadas");
    const pendientesEl = document.getElementById("totalPendientes");
    const canceladasEl = document.getElementById("totalCanceladas");

    if (totalEl) totalEl.innerText = reservas.length;
    if (pagadasEl) pagadasEl.innerText = reservas.filter(r => r.estado === "pagada").length;
    if (pendientesEl) pendientesEl.innerText = reservas.filter(r => r.estado === "pendiente").length;
    if (canceladasEl) canceladasEl.innerText = reservas.filter(r => r.estado === "cancelado").length;
  }

  // Filtros
  const botonesFiltro = document.querySelectorAll(".filtro-btn");
  botonesFiltro.forEach(btn => {
    btn.addEventListener("click", () => {
      botonesFiltro.forEach(b => {
        b.classList.remove("active", "bg-primary-500/10", "border-primary-500", "text-primary-400");
        b.classList.add("border-gray-800", "text-gray-400");
      });

      btn.classList.add("active", "bg-primary-500/10", "border-primary-500", "text-primary-400");
      btn.classList.remove("border-gray-800", "text-gray-400");

      const text = btn.textContent.trim().toLowerCase();
      if (text.includes("todas")) filtroActual = "todas";
      if (text.includes("pagadas")) filtroActual = "pagada";
      if (text.includes("pendientes")) filtroActual = "pendiente";
      if (text.includes("canceladas")) filtroActual = "cancelado";

      renderTabla();
    });
  });

  // Inicialización
  cargarReservas();
});