document.addEventListener("DOMContentLoaded", () => {
  const usuarioActual = {
    nombre: "AdminUser",
    rol: "Administrador"
  };

  let usuarios = [
    {
      nombre: "JosephGomez8",
      correo: "joseph@correo.com",
      rol: "Ciudadano",
      fecha: "10 Ene 2026",
      reservas: 12,
      estado: "activo"
    },
    {
      nombre: "t_vxrgas",
      correo: "tvxrgas@correo.com",
      rol: "Administrador",
      fecha: "5 Ene 2026",
      reservas: 3,
      estado: "activo"
    },
    {
      nombre: "usuario3",
      correo: "usuario3@correo.com",
      rol: "Ciudadano",
      fecha: "15 Feb 2026",
      reservas: 7,
      estado: "inactivo"
    }
  ];

  let filtroActual = "todos";
  let textoBusqueda = "";
  let usuarioSeleccionado = null;
  let accionToggle = null;

  function actualizarCards() {
    const total = usuarios.length;
    const activos = usuarios.filter(u => u.estado === "activo").length;
    const inactivos = usuarios.filter(u => u.estado === "inactivo").length;
    const admins = usuarios.filter(u => u.rol === "Administrador").length;

    const totalEl = document.getElementById("totalUsuarios");
    const activosEl = document.getElementById("activos");
    const inactivosEl = document.getElementById("inactivos");
    const adminsEl = document.getElementById("admins");

    if (totalEl) totalEl.textContent = total;
    if (activosEl) activosEl.textContent = activos;
    if (inactivosEl) inactivosEl.textContent = inactivos;
    if (adminsEl) adminsEl.textContent = admins;
  }

  function renderTabla() {
    const cont = document.querySelector(".tabla-body");
    if (!cont) return;
    cont.innerHTML = "";

    const lista = usuarios
      .filter(u => {
        if (filtroActual === "activo") return u.estado === "activo";
        if (filtroActual === "inactivo") return u.estado === "inactivo";
        if (filtroActual === "admin") return u.rol === "Administrador";
        return true;
      })
      .filter(u => {
        return (
          u.nombre.toLowerCase().includes(textoBusqueda) ||
          u.correo.toLowerCase().includes(textoBusqueda)
        );
      });

    if (lista.length === 0) {
      cont.innerHTML = `
        <div class="p-8 text-center text-sm text-gray-400 bg-gray-900 border border-dashed border-gray-800 rounded-lg m-4">
          No se encontraron usuarios
        </div>`;
      actualizarCards();
      return;
    }

    lista.forEach((u) => {
      const index = usuarios.indexOf(u);
      const row = document.createElement("div");
      row.className = "grid grid-cols-1 md:grid-cols-6 px-5 py-4 items-center gap-2 md:gap-0 transition-colors hover:bg-gray-800/50 text-sm";

      let estadoStyles = u.estado === "activo"
        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
        : "bg-error/15 border-error/40 text-error";

      let rolStyles = u.rol === "Administrador"
        ? "bg-warning/15 border-warning/40 text-warning"
        : "text-gray-400";

      row.innerHTML = `
        <div>
          <b class="text-gray-200 block">${u.nombre}</b>
          <small class="text-gray-400 text-xs">${u.correo}</small>
        </div>
        <div>
          <span class="inline-block px-2.5 py-0.5 rounded-full border text-xs font-medium ${rolStyles}">
            ${u.rol}
          </span>
        </div>
        <div class="text-gray-400 text-xs">${u.fecha}</div>
        <div class="text-gray-400">${u.reservas}</div>
        <div>
          <span class="inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${estadoStyles}">
            ${u.estado === "activo" ? "Activo" : "Inactivo"}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-editar px-2.5 py-1 rounded-lg border border-primary-500/40 bg-primary-500/15 text-primary-400 text-xs font-medium transition-colors hover:bg-primary-500 hover:text-white" data-index="${index}" type="button">✏️</button>
          <button class="btn-toggle px-2.5 py-1 rounded-lg border border-warning/40 bg-warning/15 text-warning text-xs font-medium transition-colors hover:bg-warning hover:text-black" data-index="${index}" type="button">⏸️</button>
          <button class="btn-delete px-2.5 py-1 rounded-lg border border-error/40 bg-error/15 text-error text-xs font-medium transition-colors hover:bg-error hover:text-white" data-index="${index}" type="button">🗑️</button>
        </div>
      `;

      cont.appendChild(row);
    });

    actualizarCards();
  }

  function volverTabla() {
    document.getElementById("vista-editar")?.classList.add("hidden");
    document.getElementById("vista-toggle")?.classList.add("hidden");
    document.getElementById("vista-eliminar")?.classList.add("hidden");

    document.querySelector(".tabla-card")?.classList.remove("hidden");
    document.querySelector(".cards")?.classList.remove("hidden");
    document.querySelector(".filtros")?.classList.remove("hidden");

    renderTabla();
  }

  // Delegación de Eventos
  document.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    const index = target.dataset.index;

    // Editar
    if (target.classList.contains("btn-editar")) {
      usuarioSeleccionado = index;
      const user = usuarios[index];

      document.getElementById("editNombre").value = user.nombre;
      document.getElementById("editCorreo").value = user.correo;
      document.getElementById("editRol").value = user.rol;
      document.getElementById("editEstado").value = user.estado;

      document.querySelector(".tabla-card")?.classList.add("hidden");
      document.querySelector(".cards")?.classList.add("hidden");
      document.querySelector(".filtros")?.classList.add("hidden");
      document.getElementById("vista-editar")?.classList.remove("hidden");
    }

    if (target.id === "guardarEditar") {
      const user = usuarios[usuarioSeleccionado];
      user.nombre = document.getElementById("editNombre").value;
      user.correo = document.getElementById("editCorreo").value;
      user.rol = document.getElementById("editRol").value;
      user.estado = document.getElementById("editEstado").value;

      volverTabla();
    }

    if (target.id === "cancelarEditar" || target.id === "cerrarEditar") {
      volverTabla();
    }

    // Toggle Estado
    if (target.classList.contains("btn-toggle")) {
      usuarioSeleccionado = index;
      const user = usuarios[index];

      accionToggle = user.estado === "activo" ? "desactivar" : "activar";

      const tituloToggle = document.getElementById("tituloToggle");
      if (tituloToggle) {
        tituloToggle.textContent = accionToggle === "desactivar" ? "Desactivar usuario" : "Activar usuario";
      }

      const mensajeToggle = document.getElementById("mensajeToggle");
      if (mensajeToggle) {
        mensajeToggle.innerHTML = `
          ¿Seguro que deseas ${accionToggle} a <strong class="text-white">${user.nombre}</strong>?
          <br><br>
          <span class="inline-block px-2.5 py-0.5 rounded-full border text-xs font-medium ${user.rol === "Administrador" ? "bg-warning/15 border-warning/40 text-warning" : "text-gray-400"}">
            ${user.rol}
          </span>
        `;
      }

      document.querySelector(".tabla-card")?.classList.add("hidden");
      document.querySelector(".cards")?.classList.add("hidden");
      document.querySelector(".filtros")?.classList.add("hidden");
      document.getElementById("vista-toggle")?.classList.remove("hidden");
    }

    if (target.id === "confirmarToggle") {
      const user = usuarios[usuarioSeleccionado];
      user.estado = user.estado === "activo" ? "inactivo" : "activo";
      volverTabla();
    }

    if (target.id === "cancelarToggle" || target.id === "cerrarToggle") {
      volverTabla();
    }

    // Eliminar
    if (target.classList.contains("btn-delete")) {
      usuarioSeleccionado = index;
      const user = usuarios[index];

      const preview = document.getElementById("deleteUserPreview");
      if (preview) {
        preview.innerHTML = `
          <div>
            <b class="text-gray-200 block">${user.nombre}</b>
            <small class="text-gray-400 text-xs">${user.correo}</small>
          </div>
          <span class="inline-block px-2.5 py-0.5 rounded-full border text-xs font-medium ${user.rol === "Administrador" ? "bg-warning/15 border-warning/40 text-warning" : "text-gray-400"}">
            ${user.rol}
          </span>
        `;
      }

      document.querySelector(".tabla-card")?.classList.add("hidden");
      document.querySelector(".cards")?.classList.add("hidden");
      document.querySelector(".filtros")?.classList.add("hidden");
      document.getElementById("vista-eliminar")?.classList.remove("hidden");
    }

    if (target.id === "confirmarEliminar") {
      usuarios.splice(usuarioSeleccionado, 1);
      volverTabla();
    }

    if (target.id === "cancelarEliminar" || target.id === "cerrarEliminar") {
      volverTabla();
    }
  });

  // Buscador
  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", (e) => {
      textoBusqueda = e.target.value.toLowerCase();
      renderTabla();
    });
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

      filtroActual = btn.dataset.filtro;
      renderTabla();
    });
  });

  // Validar rol de acceso
  if (usuarioActual.rol !== "Administrador") {
    document.body.innerHTML = `
      <div class="flex items-center justify-center h-screen bg-gray-950 text-white font-sans text-center">
        <div>
          <h1 class="text-2xl font-bold text-error mb-2">Acceso restringido</h1>
          <p class="text-sm text-gray-400">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    `;
    return;
  }

  // Inicialización
  renderTabla();
});