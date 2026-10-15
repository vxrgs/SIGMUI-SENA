/**
 * register.js
 * ------------------------------------------------------------------
 * ARCHIVO NUEVO — colócalo en: frontend/src/js/pages/register.js
 * (cargado desde registerView.pug con script(src="/js/pages/register.js"))
 *
 * Es hu01-script.js adaptado a las clases de Tailwind del registerForm.pug
 * migrado. La lógica de validación es la MISMA que hu01, solo cambia CÓMO
 * se pintan los estados (antes tocaba clases custom como .input-error,
 * .met, .hidden; ahora togglea clases utilitarias de Tailwind).
 * ------------------------------------------------------------------
 */

// ── SIMULACIÓN DE CORREOS YA REGISTRADOS (igual que en hu01) ──
const registeredEmails = ["test@mail.com", "admin@parkalia.com"];

const screenForm = document.getElementById("screen-form");
const screenSuccess = document.getElementById("screen-success");
const btnRegister = document.getElementById("btn-register");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");

// Clases de borde para inputs (antes eran .input-error / .input-success)
const BORDER_DEFAULT = "border-gray-700";
const BORDER_ERROR = "border-error";
const BORDER_SUCCESS = "border-secondary-500";

function setError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) {
    input.classList.remove(BORDER_DEFAULT, BORDER_SUCCESS);
    input.classList.add(BORDER_ERROR);
  }
  if (error) error.textContent = "⚠ " + message;
}

function setSuccess(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) {
    input.classList.remove(BORDER_ERROR, BORDER_DEFAULT);
    input.classList.add(BORDER_SUCCESS);
  }
  if (error) error.textContent = "";
}

// ── Checklist de requisitos de contraseña en vivo ──
// Antes: se togglaba una clase .met en el contenedor (y CSS resolvía
// el color del texto y del punto vía selectores anidados .met .req-dot).
// Ahora: como no hay CSS custom, togleamos directamente las clases de
// Tailwind en el texto y en el punto.
if (passwordInput) {
  passwordInput.addEventListener("input", function () {
    const value = this.value;
    const checks = {
      "req-length": value.length >= 8 && value.length <= 12,
      "req-upper": /[A-Z]/.test(value),
      "req-special": /[^a-zA-Z0-9]/.test(value),
      "req-alnum": /[a-zA-Z]/.test(value) && /[0-9]/.test(value),
    };

    Object.entries(checks).forEach(([id, passed]) => {
      const item = document.getElementById(id);
      if (!item) return;
      const dot = item.querySelector("span");

      item.classList.toggle("text-secondary-400", passed);
      item.classList.toggle("text-gray-500", !passed);

      if (dot) {
        dot.classList.toggle("bg-secondary-500", passed);
        dot.classList.toggle("bg-gray-500", !passed);
      }
    });
  });
}

// ── Limpiar error al escribir (igual que hu01) ──
["firstname", "lastname", "email", "password", "confirmPassword"].forEach((id) => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener("input", function () {
      this.classList.remove(BORDER_ERROR);
      this.classList.add(BORDER_DEFAULT);
      const errorEl = document.getElementById(id + "-error");
      if (errorEl) errorEl.textContent = "";
    });
  }
});

// ── Validación al enviar (misma lógica que hu01-script.js) ──
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Evitar que el formulario se envíe de forma nativa

    let valid = true;

    const firstname = document.getElementById("firstname").value.trim();
    const lastname = document.getElementById("lastname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!firstname) {
      setError("firstname", "firstname-error", "El primer nombre es requerido.");
      valid = false;
    } else {
      setSuccess("firstname", "firstname-error");
    }

    if (!lastname) {
      setError("lastname", "lastname-error", "El apellido es requerido.");
      valid = false;
    } else {
      setSuccess("lastname", "lastname-error");
    }

    if (!email) {
      setError("email", "email-error", "El correo electrónico es requerido.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("email", "email-error", "Ingresa un correo electrónico válido.");
      valid = false;
    } else if (registeredEmails.includes(email.toLowerCase())) {
      setError("email", "email-error", "Este correo ya está registrado.");
      valid = false;
    } else {
      setSuccess("email", "email-error");
    }

    if (!password) {
      setError("password", "password-error", "La contraseña es requerida.");
      valid = false;
    } else if (password.length < 8) {
      setError("password", "password-error", "La contraseña debe tener al menos 8 caracteres.");
      valid = false;
    } else if (password.length > 12) {
      setError("password", "password-error", "La contraseña no debe superar los 12 caracteres.");
      valid = false;
    } else if (!/[A-Z]/.test(password)) {
      setError("password", "password-error", "La contraseña debe tener al menos una mayúscula.");
      valid = false;
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
      setError("password", "password-error", "La contraseña debe tener al menos un carácter especial.");
      valid = false;
    } else if (!(/[a-zA-Z]/.test(password) && /[0-9]/.test(password))) {
      setError("password", "password-error", "La contraseña debe ser alfanumérica.");
      valid = false;
    } else {
      setSuccess("password", "password-error");
    }

    if (!confirm) {
      setError("confirmPassword", "confirmPassword-error", "Por favor confirma tu contraseña.");
      valid = false;
    } else if (password !== confirm) {
      setError("confirmPassword", "confirmPassword-error", "Las contraseñas no coinciden.");
      valid = false;
    } else {
      setSuccess("confirmPassword", "confirmPassword-error");
    }

    if (valid) {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstname, lastname, email, password }),
        });

        const data = await response.json();

        if (data.success) {
          document.getElementById("success-email-display").textContent = email;
          screenForm.classList.add("hidden");
          screenSuccess.classList.remove("hidden");
        } else {
          // Mostrar el error del servidor (ej: "El correo ya existe.")
          setError("email", "email-error", data.message || "Error al registrar.");
        }
      } catch (err) {
        setError("email", "email-error", "Error de conexión con el servidor.");
      }
    }
  });
}
