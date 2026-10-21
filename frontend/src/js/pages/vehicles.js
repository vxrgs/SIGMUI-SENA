document.addEventListener('DOMContentLoaded', () => {
  // Este script se carga en todas las páginas del layout: solo actúa en "Mis Vehículos"
  const tbody = document.getElementById('vehicles-body');
  if (!tbody) return;

  const btnShowForm = document.getElementById('btn-show-form');
  const btnEmptyAdd = document.getElementById('btn-empty-add');
  const btnBack = document.getElementById('btn-back');
  const btnCancel = document.getElementById('btn-cancel');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const btnSave = document.getElementById('btn-save');
  const screenList = document.getElementById('screen-list');
  const screenForm = document.getElementById('screen-form');
  const emptyState = document.getElementById('empty-state');
  const table = document.getElementById('vehicles-table');
  const successMsg = document.getElementById('success-msg');
  const formTitle = document.getElementById('form-card-title');
  const modal = document.getElementById('modal-delete');

  const fields = ['plate', 'brand', 'model', 'year'];
  const input = (id) => document.getElementById(id);

  let vehicles = [];
  let editingId = null;
  let deletingId = null;
  let successTimer = null;

  // ---------- Utilidades ----------
  async function api(url, method = 'GET', body) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo completar la acción.');
    return data;
  }

  function showSuccess(text) {
    successMsg.textContent = '✅ ' + text;
    successMsg.style.display = 'flex';
    clearTimeout(successTimer);
    successTimer = setTimeout(() => (successMsg.style.display = 'none'), 4000);
  }

  function setError(id, message) {
    const el = input(`${id}-error`);
    if (el) el.textContent = message || '';
    const field = input(id);
    if (field) field.style.borderColor = message ? '#E8404A' : '#1E2A3A';
  }

  function clearErrors() {
    fields.forEach((id) => setError(id, ''));
  }

  // ---------- Pantallas ----------
  function showForm(vehicle = null) {
    editingId = vehicle ? vehicle.id : null;
    clearErrors();

    input('plate').value = vehicle ? vehicle.plate : '';
    input('brand').value = vehicle ? vehicle.brand : '';
    input('model').value = vehicle ? vehicle.model : '';
    input('year').value = vehicle ? vehicle.year : '';

    formTitle.textContent = vehicle ? 'Editar vehículo' : 'Nuevo vehículo';
    btnSave.textContent = vehicle ? 'Guardar cambios' : 'Registrar vehículo';
    btnCancel.style.display = vehicle ? 'none' : 'block';
    btnCancelEdit.style.display = vehicle ? 'block' : 'none';

    screenList.style.display = 'none';
    screenForm.style.display = 'block';
    input('plate').focus();
  }

  function showList() {
    screenForm.style.display = 'none';
    screenList.style.display = 'block';
    editingId = null;
  }

  // ---------- Render ----------
  const CELL = 'padding: 14px 20px; font-size: 13px; color: #E8EDF5;';
  const BTN = 'padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; background: transparent;';

  function cell(text, extra = '') {
    const td = document.createElement('td');
    td.style.cssText = CELL + extra;
    td.textContent = text;
    return td;
  }

  function actionButton(label, color, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.style.cssText = `${BTN} border: 1px solid ${color}; color: ${color};`;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function render() {
    tbody.replaceChildren();

    const hasVehicles = vehicles.length > 0;
    table.style.display = hasVehicles ? 'table' : 'none';
    emptyState.style.display = hasVehicles ? 'none' : 'block';

    vehicles.forEach((v) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #1E2A3A';

      tr.append(
        cell(v.plate, "font-family: 'Syne', sans-serif; font-weight: 700; letter-spacing: 1px;"),
        cell(v.brand),
        cell(v.model),
        cell(v.year)
      );

      const actions = document.createElement('td');
      actions.style.cssText = CELL;
      const group = document.createElement('div');
      group.style.cssText = 'display: flex; gap: 8px;';
      group.append(
        actionButton('✏️ Editar', '#1A6FD4', () => showForm(v)),
        actionButton('🗑️ Eliminar', '#E8404A', () => openDelete(v))
      );
      actions.append(group);
      tr.append(actions);

      tbody.append(tr);
    });
  }

  // ---------- Guardar (crear / editar) ----------
  function validate(data) {
    clearErrors();
    let ok = true;
    const plate = data.plate.toUpperCase().replace(/[\s-]/g, '');

    if (!/^[A-Z0-9]{5,7}$/.test(plate)) { setError('plate', 'Ingresa una placa válida (ej. ABC123).'); ok = false; }
    if (data.brand.trim().length < 2) { setError('brand', 'Ingresa la marca.'); ok = false; }
    if (!data.model.trim()) { setError('model', 'Ingresa el modelo.'); ok = false; }

    const year = Number(data.year);
    if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      setError('year', 'Ingresa un año válido.'); ok = false;
    }
    return ok;
  }

  async function save() {
    const data = {
      plate: input('plate').value,
      brand: input('brand').value,
      model: input('model').value,
      year: input('year').value,
    };
    if (!validate(data)) return;

    btnSave.disabled = true;
    try {
      const wasEditing = editingId !== null;
      const result = wasEditing
        ? await api(`/api/vehicles/${editingId}`, 'PUT', data)
        : await api('/api/vehicles', 'POST', data);

      await load();
      showList();
      showSuccess(result.message);
    } catch (error) {
      // El servidor valida la placa duplicada: se muestra junto al campo
      setError('plate', error.message);
    } finally {
      btnSave.disabled = false;
    }
  }

  // ---------- Eliminar ----------
  function openDelete(vehicle) {
    deletingId = vehicle.id;
    input('modal-plate').textContent = vehicle.plate;
    input('modal-detail').textContent = `${vehicle.brand} ${vehicle.model} · ${vehicle.year}`;
    modal.style.display = 'flex';
  }

  function closeDelete() {
    modal.style.display = 'none';
    deletingId = null;
  }

  async function confirmDelete() {
    if (deletingId === null) return;
    try {
      const result = await api(`/api/vehicles/${deletingId}`, 'DELETE');
      closeDelete();
      await load();
      showSuccess(result.message);
    } catch (error) {
      closeDelete();
      showSuccess('⚠️ ' + error.message);
    }
  }

  // ---------- Carga inicial ----------
  async function load() {
    try {
      vehicles = (await api('/api/vehicles')).vehicles;
    } catch (error) {
      vehicles = [];
      showSuccess('⚠️ ' + error.message);
    }
    render();
  }

  btnShowForm?.addEventListener('click', () => showForm());
  btnEmptyAdd?.addEventListener('click', () => showForm());
  btnBack?.addEventListener('click', showList);
  btnCancel?.addEventListener('click', showList);
  btnCancelEdit?.addEventListener('click', showList);
  btnSave?.addEventListener('click', save);
  input('btn-cancel-delete')?.addEventListener('click', closeDelete);
  input('btn-confirm-delete')?.addEventListener('click', confirmDelete);

  load();
});