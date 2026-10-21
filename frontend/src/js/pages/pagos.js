document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('payment-root');
    if (!root) return;

    const zoneId = root.dataset.zoneId;
    const price = Number(root.dataset.price);

    const paymentMethods = document.querySelectorAll('input[name="payment_method"]');
    const cardForm = document.getElementById('card-form');
    const submitBtn = document.getElementById('submit-payment');
    const successModal = document.getElementById('success-modal');
    const vehicleSelect = document.getElementById('vehicle-select');
    const hoursSelect = document.getElementById('hours-select');
    const noVehicles = document.getElementById('no-vehicles');
    const errorBox = document.getElementById('payment-error');

    const money = (n) => `$${n.toLocaleString('es-CO')}`;
    const time = (d) => d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
    const selectedMethod = () => document.querySelector('input[name="payment_method"]:checked')?.value;

    function showError(message) {
        errorBox.textContent = message;
        errorBox.classList.toggle('hidden', !message);
    }

    // Resumen y total (el servidor vuelve a calcular el monto: esto es solo informativo)
    function updateSummary() {
        const hours = Number(hoursSelect.value);
        const start = new Date();
        const end = new Date(start.getTime() + hours * 3600 * 1000);
        const total = price * hours;

        document.getElementById('summary-time').textContent =
            `${hours} ${hours === 1 ? 'hora' : 'horas'} (${time(start)} - ${time(end)})`;
        document.getElementById('summary-subtotal').textContent = money(total);
        document.getElementById('total-amount').textContent = money(total);
        submitBtn.textContent = `Pagar ${money(total)}`;
    }

    // Carga los vehículos del usuario
    async function loadVehicles() {
        try {
            const res = await fetch('/api/vehicles');
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message);

            vehicleSelect.replaceChildren();
            data.vehicles.forEach((v) => {
                const option = document.createElement('option');
                option.value = v.id;
                option.textContent = `${v.plate} · ${v.brand} ${v.model}`;
                vehicleSelect.append(option);
            });

            const hasVehicles = data.vehicles.length > 0;
            noVehicles.classList.toggle('hidden', hasVehicles);
            submitBtn.disabled = !hasVehicles;
        } catch (error) {
            showError('No se pudieron cargar tus vehículos.');
            submitBtn.disabled = true;
        }
    }

    // Validación de la tarjeta (simulada: los datos NO se envían ni se guardan)
    function validateCard() {
        const number = document.getElementById('card-number').value.replace(/\s/g, '');
        const expiry = document.getElementById('card-expiry').value.trim();
        const cvc = document.getElementById('card-cvc').value.trim();
        const name = document.getElementById('card-name').value.trim();

        if (!/^\d{13,19}$/.test(number)) return 'Ingresa un número de tarjeta válido.';

        const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
        if (!match) return 'El vencimiento debe tener el formato MM/YY.';
        const lastDay = new Date(2000 + Number(match[2]), Number(match[1]), 0, 23, 59, 59);
        if (lastDay < new Date()) return 'La tarjeta está vencida.';

        if (!/^\d{3,4}$/.test(cvc)) return 'Ingresa un CVC válido.';
        if (name.length < 3) return 'Ingresa el nombre que aparece en la tarjeta.';
        return null;
    }

    function showSuccess(reservation) {
        document.getElementById('success-code').textContent = reservation.code;
        successModal.classList.remove('hidden');
        successModal.classList.add('flex');

        // Trigger reflow for transition
        void successModal.offsetWidth;

        successModal.classList.remove('opacity-0');
        successModal.querySelector('div').classList.remove('scale-95');
        successModal.querySelector('div').classList.add('scale-100');
    }

    // Toggle forms based on payment method
    paymentMethods.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'card') {
                cardForm.style.display = 'block';
            } else {
                cardForm.style.display = 'none';
            }
        });
    });

    hoursSelect.addEventListener('change', updateSummary);

    // Handle submit
    submitBtn.addEventListener('click', async () => {
        showError('');

        if (!vehicleSelect.value) return showError('Selecciona uno de tus vehículos.');

        const method = selectedMethod();
        if (method === 'card') {
            const cardError = validateCard();
            if (cardError) return showError(cardError);
        }

        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="opacity-70">Procesando...</span>';
        submitBtn.disabled = true;

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    zoneId,
                    vehicleId: Number(vehicleSelect.value),
                    hours: Number(hoursSelect.value),
                    method,
                }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.success) {
                showError(data.message || 'No se pudo procesar el pago.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }

            submitBtn.textContent = originalText;
            showSuccess(data.reservation);
        } catch (error) {
            showError('Error de conexión con el servidor.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    updateSummary();
    loadVehicles();
});
