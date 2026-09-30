document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registroAccesoForm');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/accesos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          alert('Movimiento registrado correctamente');
          form.reset();
          window.location.reload();
        } else {
          const err = await response.json();
          alert(`Error: ${err.message || 'No se pudo registrar el acceso'}`);
        }
      } catch (error) {
        console.error('Error al registrar acceso:', error);
      }
    });
  }
});