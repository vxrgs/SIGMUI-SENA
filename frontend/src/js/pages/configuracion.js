document.addEventListener("DOMContentLoaded", () => {
  const mensaje = document.getElementById("configMensaje");
  let mensajeTimer = null;

  const ESTILOS_OK = ["bg-emerald-500/10", "border-emerald-500/40", "text-emerald-400"];
  const ESTILOS_ERROR = ["bg-error/10", "border-error/40", "text-error"];

  function mostrarMensaje(texto, ok = true) {
    if (!mensaje) return;
    mensaje.classList.remove("hidden", ...ESTILOS_OK, ...ESTILOS_ERROR);
    mensaje.classList.add(...(ok ? ESTILOS_OK : ESTILOS_ERROR));
    mensaje.textContent = (ok ? "✅ " : "⚠️ ") + texto;
    mensaje.scrollIntoView({ behavior: "smooth", block: "nearest" });

    clearTimeout(mensajeTimer);
    mensajeTimer = setTimeout(() => mensaje.classList.add("hidden"), 5000);
  }

  async function enviar(url, method, body, boton) {
    if (boton) boton.disabled = true;
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        mostrarMensaje(data.message || "No se pudo completar la acción.", false);
        return null;
      }
      return data;
    } catch {
      mostrarMensaje("Error de conexión con el servidor.", false);
      return null;
    } finally {
      if (boton) boton.disabled = false;
    }
  }

  // ---------- Perfil ----------
  document.getElementById("formPerfil")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();

    if (nombre.length < 2) return mostrarMensaje("Ingresa un nombre válido.", false);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarMensaje("Ingresa un correo válido.", false);

    const data = await enviar("/api/settings/profile", "PUT", { name: nombre, email: correo }, document.getElementById("guardarPerfil"));
    if (data) mostrarMensaje(data.message);
  });

  // ---------- Contraseña ----------
  document.getElementById("formPassword")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const actual = document.getElementById("passwordActual").value;
    const nueva = document.getElementById("passwordNueva").value;
    const confirmar = document.getElementById("passwordConfirmar").value;

    if (!actual) return mostrarMensaje("Ingresa tu contraseña actual.", false);
    if (nueva.length < 8 || !/[A-Za-z]/.test(nueva) || !/\d/.test(nueva)) {
      return mostrarMensaje("La nueva contraseña debe tener mínimo 8 caracteres, con letras y números.", false);
    }
    if (nueva !== confirmar) return mostrarMensaje("Las contraseñas no coinciden.", false);

    const data = await enviar(
      "/api/settings/password",
      "PUT",
      { currentPassword: actual, newPassword: nueva },
      document.getElementById("guardarPassword")
    );
    if (data) {
      e.target.reset();
      mostrarMensaje(data.message);
    }
  });

  // ---------- Preferencias (localStorage) ----------
  const PREFS_KEY = "sigmui_preferencias";
  const PREFS_DEFAULT = {
    prefNotifReservas: true,
    prefNotifPagos: true,
    prefNotifCupos: false,
    prefCorreo: false,
  };

  let prefs = { ...PREFS_DEFAULT };
  try {
    prefs = { ...PREFS_DEFAULT, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    // Preferencias corruptas: se usan los valores por defecto
  }

  document.querySelectorAll(".pref-toggle").forEach((toggle) => {
    toggle.checked = Boolean(prefs[toggle.dataset.pref]);
    toggle.addEventListener("change", () => {
      prefs[toggle.dataset.pref] = toggle.checked;
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      mostrarMensaje("Preferencia actualizada.");
    });
  });

  // ---------- Tarifas de zonas (solo administradores) ----------
  document.getElementById("formZonas")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const zonas = [...document.querySelectorAll(".zone-row")].map((row) => ({
      id: row.dataset.zoneId,
      price: Number(row.querySelector(".zone-price").value),
      schedule: row.querySelector(".zone-schedule").value.trim(),
    }));

    if (zonas.some((z) => !Number.isFinite(z.price) || z.price < 0 || !z.schedule)) {
      return mostrarMensaje("Revisa los precios y horarios: no pueden estar vacíos ni ser negativos.", false);
    }

    const data = await enviar("/api/admin/zones", "PUT", { zones: zonas }, document.getElementById("guardarZonas"));
    if (data) mostrarMensaje(data.message);
  });
});
