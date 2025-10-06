/* Proyecto 1 - TODOs avanzado: persistencia local + API + UI mejorada */
const API = 'https://todoapitest.juansegaliz.com/todos';
const $ = id => document.getElementById(id);

// --- Persistencia local ---
const STORAGE_KEY = 'project1_todos_v2';
let localTodos = loadLocal();

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo localStorage:', e);
    return [];
  }
}

function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localTodos));
  } catch (e) {
    console.error('Error guardando localStorage:', e);
  }
}

// --- Estado UI ---
function setStatus(text, quick = true) {
  const el = $('status');
  if (!el) return;
  el.textContent = `Estado: ${text}`;
  if (!quick) setTimeout(() => { el.textContent = 'Estado: listo'; }, 3000);
}

// --- Fetch API con manejo de errores ---
async function apiFetch(path = '', options = {}) {
  const url = `${API}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.warn(`API returned ${res.status} for ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('fetch error', err);
    return null;
  }
}

// --- Inicialización ---
async function initialLoad() {
  setStatus('sincronizando con API...');
  const data = await apiFetch('');
  if (data) {
    const incoming = Array.isArray(data) ? data : [data];
    incoming.forEach(item => {
      if (!item || item.id === undefined) return;
      const exists = localTodos.find(t => String(t.id) === String(item.id));
      if (exists) Object.assign(exists, item, { _synced: true, _local: false });
      else localTodos.push(Object.assign({}, item, { _synced: true, _local: false }));
    });
    saveLocal();
    setStatus('sincronizado con API', false);
  } else {
    setStatus('no se pudo conectar con API — modo offline', false);
  }
  renderList(localTodos);
}

// --- CRUD con fallback local ---
async function createTodo(payload) {
  payload = {...payload, _updatedAt: new Date().toISOString()};
  setStatus('creando...');
  const result = await apiFetch('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (result && result.id !== undefined) {
    result._synced = true;
    result._local = false;
    result._updatedAt = new Date().toISOString();
    localTodos.push(result);
    saveLocal();
    setStatus('creado y sincronizado', false);
    renderList(localTodos);
    return result;
  } else {
    const localId = `local-${Date.now()}`;
    const localObj = { ...payload, id: localId, _synced: false, _local: true };
    localTodos.push(localObj);
    saveLocal();
    setStatus('creado localmente (sincronizar luego)', false);
    renderList(localTodos);
    return localObj;
  }
}

async function updateTodoLocal(id, payload) {
  payload._updatedAt = new Date().toISOString();
  const isLocal = String(id).startsWith('local-');
  if (!isLocal) {
    const result = await apiFetch(`/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (result && result.id !== undefined) {
      const idx = localTodos.findIndex(t => String(t.id) === String(result.id));
      if (idx !== -1) localTodos[idx] = Object.assign({}, result, { _synced: true, _local: false });
      saveLocal();
      setStatus('actualizado en API', false);
      renderList(localTodos);
      return result;
    }
  }
  const idx = localTodos.findIndex(t => String(t.id) === String(id));
  if (idx !== -1) {
    localTodos[idx] = Object.assign({}, localTodos[idx], payload, { _synced: false });
    saveLocal();
    setStatus('actualizado localmente (sincronizar luego)', false);
    renderList(localTodos);
    return localTodos[idx];
  }
}

async function deleteTodoLocal(id) {
  const isLocal = String(id).startsWith('local-');
  if (!isLocal) await apiFetch(`/${id}`, { method: 'DELETE' });
  localTodos = localTodos.filter(t => String(t.id) !== String(id));
  saveLocal();
  setStatus('eliminado', false);
  renderList(localTodos);
}

// Obtener tarea individual
async function getTodoLocal(id) {
  const found = localTodos.find(t => String(t.id) === String(id));
  if (found && !String(id).startsWith('local-')) {
    const remote = await apiFetch(`/${id}`);
    if (remote) {
      const idx = localTodos.findIndex(t => String(t.id) === String(id));
      if (idx !== -1) localTodos[idx] = Object.assign({}, remote, { _synced: true, _local: false });
      saveLocal();
      renderList(localTodos);
      return localTodos[idx];
    }
  }
  return found;
}

// --- Render UI ---
function renderList(items) {
  const ul = $('todo-list');
  ul.innerHTML = '';
  if (!items.length) {
    ul.innerHTML = '<li>No hay tareas registradas todavía.</li>';
    return;
  }
  items
    .sort((a,b) => (b.priority||0) - (a.priority||0)) // ordenar por prioridad
    .forEach(item => {
      const li = document.createElement('li');

      const left = document.createElement('div');
      left.className = 'item-left';
      left.innerHTML = `
        <strong>${item.title}</strong>
        <div>${item.description || ''}</div>
        <small>
          Prioridad: ${item.priority || '-'} | Completada: ${item.isCompleted ? '✅' : '❌'} |
          Última actualización: ${item._updatedAt ? new Date(item._updatedAt).toLocaleString() : '-'}
          ${!item._synced ? '<span class="badge-unsynced">PENDIENTE</span>' : ''}
        </small>
      `;

      const actions = document.createElement('div');
      actions.className = 'item-actions';
      actions.innerHTML = `
        <button class="btn-view" data-id="${item.id}">Ver</button>
        <button class="btn-edit" data-id="${item.id}">Editar</button>
        <button class="btn-delete" data-id="${item.id}">Eliminar</button>
      `;
      li.appendChild(left);
      li.appendChild(actions);
      ul.appendChild(li);
    });
  attachListHandlers();
}

// --- Handlers ---
function attachListHandlers() {
  document.querySelectorAll('.btn-view').forEach(b => b.onclick = async e => {
    const id = e.target.dataset.id;
    const todo = await getTodoLocal(id);
    if (!todo) return alert('No se pudo obtener la tarea.');
    // mostrar modal simple (alert temporal, puede reemplazarse con modal real)
    alert(
`ID: ${todo.id}
Título: ${todo.title}
Descripción: ${todo.description || '-'}
Prioridad: ${todo.priority || '-'}
Completada: ${todo.isCompleted ? 'Sí' : 'No'}
Sincronizada: ${todo._synced ? 'Sí' : 'No'}
Última actualización: ${todo._updatedAt ? new Date(todo._updatedAt).toLocaleString() : '-'}`
    );
  });

  document.querySelectorAll('.btn-edit').forEach(b => b.onclick = e => {
    const id = e.target.dataset.id;
    const todo = localTodos.find(t => String(t.id) === String(id));
    if (!todo) return alert('Tarea no encontrada.');
    $('todo-id').value = todo.id;
    $('title').value = todo.title;
    $('description').value = todo.description || '';
    $('priority').value = todo.priority || 3;
    $('isCompleted').checked = !!todo.isCompleted;
    $('submit-btn').textContent = 'Actualizar';
    $('cancel-edit').style.display = 'inline';
    setStatus('modo edición', false);
  });

  document.querySelectorAll('.btn-delete').forEach(b => b.onclick = async e => {
    const id = e.target.dataset.id;
    if (!confirm('Eliminar tarea ' + id + '?')) return;
    await deleteTodoLocal(id);
  });
}

// --- Formulario ---
$('todo-form').onsubmit = async e => {
  e.preventDefault();
  const id = $('todo-id').value;
  const payload = {
    title: $('title').value.trim(),
    description: $('description').value.trim().substring(0,200),
    priority: Math.min(5, Math.max(1, parseInt($('priority').value,10) || 3)),
    isCompleted: $('isCompleted').checked
  };
  if (!payload.title || payload.title.length < 3) return alert('El título debe tener al menos 3 caracteres.');
  if (id) await updateTodoLocal(id, payload);
  else await createTodo(payload);

  // reset form
  $('todo-id').value = '';
  $('title').value = '';
  $('description').value = '';
  $('priority').value = 3;
  $('isCompleted').checked = false;
  $('submit-btn').textContent = 'Crear';
  $('cancel-edit').style.display = 'none';
  setStatus('listo', false);
};

// Cancelar edición
$('cancel-edit').onclick = () => {
  $('todo-id').value = '';
  $('title').value = '';
  $('description').value = '';
  $('priority').value = 3;
  $('isCompleted').checked = false;
  $('submit-btn').textContent = 'Crear';
  $('cancel-edit').style.display = 'none';
  setStatus('edición cancelada', false);
};

// Sincronizar pendientes
$('btn-sync').onclick = async () => {
  setStatus('sincronizando pendientes...');
  for (let i=0;i<localTodos.length;i++){
    const t = localTodos[i];
    if (String(t.id).startsWith('local-')) {
      const payload = {title:t.title, description:t.description, priority:t.priority, isCompleted:t.isCompleted};
      const created = await apiFetch('', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
      if (created && created.id !== undefined) localTodos[i] = {...created,_synced:true,_local:false,_updatedAt:new Date().toISOString()};
    } else if (t._synced===false) {
      const payload = {title:t.title, description:t.description, priority:t.priority, isCompleted:t.isCompleted};
      const updated = await apiFetch(`/${t.id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
      if (updated && updated.id!==undefined) localTodos[i] = {...updated,_synced:true,_local:false,_updatedAt:new Date().toISOString()};
    }
  }
  saveLocal();
  renderList(localTodos);
  setStatus('sincronización finalizada', false);
};

// Borrar local
$('btn-clear-local').onclick = () => {
  if (!confirm('Borrar todos los elementos locales?')) return;
  localTodos=[];
  saveLocal();
  renderList(localTodos);
  setStatus('local limpio', false);
};

// Inicialización
(async () => {
  renderList(localTodos);
  await initialLoad();
})();
