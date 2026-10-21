document.addEventListener("DOMContentLoaded", () => {
  // La autorización la hace el servidor (requireAdmin): esta pantalla ni se renderiza
  // ni responde a la API si el usuario no es administrador.
  let usuarios = [];

  let filtroActual = "todos";
  let textoBusqueda = "";
  let usuarioSeleccionado = null;
  let accionToggle = null;
  let mensajeTimer = null;

  // Escapa texto antes de insertarlo con innerHTML (nombres y correos los escribe el usuario)
  function esc(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
  }

  function formatearFecha(iso) {
    return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  }

  function mostrarMensaje(texto, ok = true) {
    const el = document.getElementById("usuariosMensaje");
    if (!el) return;
    el.className = "mb-4 px-4 py-3 rounded-xl border text-sm " + (ok
      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
      : "bg-error/10 border-error/40 text-error");
    el.textContent = (ok ? "✅ " : "⚠️ ") + texto;

    clearTimeout(mensajeTimer);
    mensajeTimer = setTimeout(() => el.classList.add("hidden"), 5000);
  }

  async function api(url, method = "GET", body) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "No se pudo completar la acción.");
    return data;
  }

  async function cargarUsuarios() {
    try {
      usuarios = (await api("/api/admin/users")).users;
    } catch (error) {
      usuarios = [];
      mostrarMensaje(error.message, false);
    }
    renderTabla();
  }

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
      const row = document.createElement("div");
      row.className = "grid grid-cols-1 md:grid-cols-6 px-5 py-4 items-center gap-2 md:gap-0 transition-colors hover:bg-gray-800/50 text-sm";

      let estadoStyles = u.estado === "activo"
        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
        : "bg-error/15 border-error/40 text-error";

      let rolStyles = u.rol === "Administrador"
        ? "bg-warning/15 border-warning/40 text-warning"
        : "text-gray-400";

      // No puedes desactivarte ni eliminarte a ti mismo (el servidor también lo bloquea)
      const bloqueo = u.esActual ? "opacity-40 cursor-not-allowed" : "";
      const bloqueoAttr = u.esActual ? 'disabled title="No puedes hacerlo con tu propia cuenta"' : "";

      row.innerHTML = `
        <div>
          <b class="text-gray-200 block">${esc(u.nombre)}${u.esActual ? ' <span class="text-xs text-primary-400 font-normal">(tú)</span>' : ""}</b>
          <small class="text-gray-400 text-xs">${esc(u.correo)}</small>
        </div>
        <div>
          <span class="inline-block px-2.5 py-0.5 rounded-full border text-xs font-medium ${rolStyles}">
            ${esc(u.rol)}
          </span>
        </div>
        <div class="text-gray-400 text-xs">${formatearFecha(u.fecha)}</div>
        <div class="text-gray-400">${u.reservas}</div>
        <div>
          <span class="inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${estadoStyles}">
            ${u.estado === "activo" ? "Activo" : "Inactivo"}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-editar px-2.5 py-1 rounded-lg border border-primary-500/40 bg-primary-500/15 text-primary-400 text-xs font-medium transition-colors hover:bg-primary-500 hover:text-white" data-id="${u.id}" type="button">✏️</button>
          <button class="btn-toggle px-2.5 py-1 rounded-lg border border-warning/40 bg-warning/15 text-warning text-xs font-medium transition-colors hover:bg-warning hover:text-black ${bloqueo}" data-id="${u.id}" type="button" ${bloqueoAttr}>⏸️</button>
          <button class="btn-delete px-2.5 py-1 rounded-lg border border-error/40 bg-error/15 text-error text-xs font-medium transition-colors hover:bg-error hover:text-white ${bloqueo}" data-id="${u.id}" type="button" ${bloqueoAttr}>🗑️</button>
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

  function ocultarTabla() {
    document.querySelector(".tabla-card")?.classList.add("hidden");
    document.querySelector(".cards")?.classList.add("hidden");
    document.querySelector(".filtros")?.classList.add("hidden");
  }

  // Ejecuta una acción contra la API, recarga la lista y vuelve a la tabla
  async function ejecutar(accion) {
    try {
      const data = await accion();
      await cargarUsuarios();
      volverTabla();
      mostrarMensaje(data.message);
    } catch (error) {
      volverTabla();
      mostrarMensaje(error.message, false);
    }
  }

  const buscarUsuario = (id) => usuarios.find(u => String(u.id) === String(id));

  // Delegación de Eventos
  document.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target || target.disabled) return;

    const id = target.dataset.id;

    // Editar
    if (target.classList.contains("btn-editar")) {
      usuarioSeleccionado = id;
      const user = buscarUsuario(id);

      document.getElementById("editNombre").value = user.nombre;
      document.getElementById("editCorreo").value = user.correo;
      document.getElementById("editRol").value = user.rol;
      document.getElementById("editEstado").value = user.estado;

      // Sobre tu propia cuenta no se puede cambiar rol ni estado
      document.getElementById("editRol").disabled = user.esActual;
      document.getElementById("editEstado").disabled = user.esActual;

      ocultarTabla();
      document.getElementById("vista-editar")?.classList.remove("hidden");
    }

    if (target.id === "guardarEditar") {
      ejecutar(() => api(`/api/admin/users/${usuarioSeleccionado}`, "PUT", {
        nombre: document.getElementById("editNombre").value,
        correo: document.getElementById("editCorreo").value,
        rol: document.getElementById("editRol").value,
        estado: document.getElementById("editEstado").value,
      }));
    }

    if (target.id === "cancelarEditar" || target.id === "cerrarEditar") {
      volverTabla();
    }

    // Toggle Estado
    if (target.classList.contains("btn-toggle")) {
      usuarioSeleccionado = id;
      const user = buscarUsuario(id);

      accionToggle = user.estado === "activo" ? "desactivar" : "activar";

      const tituloToggle = document.getElementById("tituloToggle");
      if (tituloToggle) {
        tituloToggle.textContent = accionToggle === "desactivar" ? "Desactivar usuario" : "Activar usuario";
      }

      const mensajeToggle = document.getElementById("mensajeToggle");
      if (mensajeToggle) {
        mensajeToggle.innerHTML = `
          ¿Seguro que deseas ${accionToggle} a <strong class="text-white">${esc(user.nombre)}</strong>?
          <br><br>
          <span class="inline-block px-2.5 py-0.5 rounded-full border text-xs font-medium ${user.rol === "Administrador" ? "bg-warning/15 border-warning/40 text-warning" : "text-gray-400"}">
            ${esc(user.rol)}
          </span>
        `;
      }

      ocultarTabla();
      document.getElementById("vista-toggle")?.classList.remove("hidden");
    }

    if (target.id === "confirmarToggle") {
      const user = buscarUsuario(usuarioSeleccionado);
      ejecutar(() => api(`/api/admin/users/${user.id}`, "PUT", {
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        estado: user.estado === "activo" ? "inactivo" : "activo",
      }));
    }

    if (target.id === "cancelarToggle" || target.id === "cerrarToggle") {
      volverTabla();
    }

    // Eliminar
    if (target.classList.contains("btn-delete")) {
      usuarioSeleccionado = id;
      const user = buscarUsuario(id);

      const preview = document.getElementById("deleteUserPreview");
      if (preview) {
        preview.innerHTML = `
          <div>
            <b class="text-gray-200 block">${esc(user.nombre)}</b>
            <small class="text-gray-400 text-xs">${esc(user.correo)}</small>
          </div>
          <span class="inline-block px-2.5 py-0.5 rounded-full border text-xs font-medium ${user.rol === "Administrador" ? "bg-warning/15 border-warning/40 text-warning" : "text-gray-400"}">
            ${esc(user.rol)}
          </span>
        `;
      }

      ocultarTabla();
      document.getElementById("vista-eliminar")?.classList.remove("hidden");
    }

    if (target.id === "confirmarEliminar") {
      ejecutar(() => api(`/api/admin/users/${usuarioSeleccionado}`, "DELETE"));
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

  // Inicialización
  cargarUsuarios();
});