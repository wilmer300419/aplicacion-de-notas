(() => {
  'use strict';
  const KEY = 'control-notas:v1';
  const APRUEBA = 3.0;
  const $ = id => document.getElementById(id);
  const f = { id: $('note-id'), estudiante: $('estudiante'), materia: $('materia'), curso: $('curso'), nota: $('nota') };
  const fields = [f.estudiante, f.materia, f.curso, f.nota];

  let notas = load();
  let pendingDelete = null, toastTimer;

  /* ---------- Almacenamiento ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(notas)); } catch { toast('No se pudo guardar en este navegador.'); } }

  /* ---------- Utilidades ---------- */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const key = s => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  const fmtNota = n => n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const fmtFecha = t => new Date(t).toLocaleDateString('es-CO', { dateStyle: 'medium' });
  const unicos = arr => [...new Map(arr.map(v => [key(v), v])).values()].sort((a, b) => a.localeCompare(b, 'es'));
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }
  function cell(tag, text, cls) { const c = document.createElement(tag); c.textContent = text; if (cls) c.className = cls; return c; }
  function btn(text, cls, fn, label) {
    const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = text;
    if (label) b.setAttribute('aria-label', label); b.addEventListener('click', fn); return b;
  }

  /* ---------- Pestañas ---------- */
  const tabs = [$('tab-registro'), $('tab-estudiante')];
  function showTab(i) {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = i !== j;
    });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => showTab(i));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      showTab(n); tabs[n].focus();
    });
  });

  /* ---------- Validación ---------- */
  const setError = (input, msg) => { $(input.id + '-err').textContent = msg; input.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
  const parseNota = v => Number(v.trim().replace(',', '.'));
  function validate() {
    const rules = [
      [f.estudiante, f.estudiante.value.trim(), 'Escribe el nombre del estudiante.'],
      [f.materia, f.materia.value.trim(), 'Escribe la materia.'],
      [f.curso, f.curso.value.trim(), 'Escribe el curso.']
    ];
    let first = null;
    rules.forEach(([inp, val, msg]) => { setError(inp, val ? '' : msg); if (!val && !first) first = inp; });
    const raw = f.nota.value.trim(), n = parseNota(raw);
    const okNota = raw !== '' && Number.isFinite(n) && n >= 0 && n <= 5;
    setError(f.nota, okNota ? '' : 'Escribe una nota entre 0,0 y 5,0.');
    if (!okNota && !first) first = f.nota;
    if (first) { first.focus(); return false; }
    return true;
  }

  /* ---------- Registrar / Editar ---------- */
  $('note-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    const data = { estudiante: f.estudiante.value.trim(), materia: f.materia.value.trim(), curso: f.curso.value.trim(),
                   nota: Math.round(parseNota(f.nota.value) * 100) / 100, updated: Date.now() };
    if (f.id.value) { notas = notas.map(n => n.id === f.id.value ? { ...n, ...data } : n); toast('Cambios guardados.'); }
    else { notas.unshift({ id: uid(), ...data }); toast('Nota guardada.'); }
    persist(); resetForm(); render();
  });

  function startEdit(id) {
    const n = notas.find(x => x.id === id); if (!n) return;
    f.id.value = n.id; f.estudiante.value = n.estudiante; f.materia.value = n.materia; f.curso.value = n.curso;
    f.nota.value = String(n.nota).replace('.', ',');
    fields.forEach(i => setError(i, ''));
    $('form-title').textContent = 'Editar nota'; $('save').textContent = 'Guardar cambios'; $('cancel').hidden = false;
    showTab(0); render(); f.estudiante.scrollIntoView({ block: 'center' }); f.estudiante.focus();
  }
  function resetForm() {
    $('note-form').reset(); f.id.value = ''; fields.forEach(i => setError(i, ''));
    $('form-title').textContent = 'Nueva nota'; $('save').textContent = 'Guardar nota'; $('cancel').hidden = true;
  }
  $('cancel').addEventListener('click', () => { resetForm(); render(); });

  /* ---------- Eliminar ---------- */
  function askDelete(id) {
    const n = notas.find(x => x.id === id); if (!n) return;
    pendingDelete = id;
    $('confirm-text').textContent = `Se eliminará la nota de ${n.estudiante} en ${n.materia} (${n.curso}): ${fmtNota(n.nota)}. Esta acción no se puede deshacer.`;
    $('confirm').showModal();
  }
  $('confirm').addEventListener('close', () => {
    const d = $('confirm');
    if (d.returnValue === 'ok' && pendingDelete) {
      notas = notas.filter(n => n.id !== pendingDelete);
      if (f.id.value === pendingDelete) resetForm();
      persist(); render(); toast('Nota eliminada.');
    }
    pendingDelete = null; d.returnValue = '';
  });

  /* ---------- Render: registro ---------- */
  function fillList(id, values) { $(id).replaceChildren(...unicos(values).map(v => { const o = document.createElement('option'); o.value = v; return o; })); }

  function renderRegistro() {
    const q = key($('search').value);
    const shown = notas.filter(n => !q || key(`${n.estudiante} ${n.materia} ${n.curso}`).includes(q));
    const tb = $('tabla').tBodies[0]; tb.replaceChildren();
    shown.forEach(n => {
      const tr = document.createElement('tr'); if (n.id === f.id.value) tr.className = 'editing';
      const td0 = document.createElement('td');
      td0.append(btn(n.estudiante, 'link', () => { $('sel-estudiante').value = key(n.estudiante); renderEstudiante(); showTab(1); $('sel-estudiante').focus(); }, `Ver todas las notas de ${n.estudiante}`));
      const acts = document.createElement('td'); acts.className = 'acts';
      acts.append(btn('Editar', 'btn small', () => startEdit(n.id), `Editar nota de ${n.estudiante} en ${n.materia}`),
                  btn('Eliminar', 'btn small', () => askDelete(n.id), `Eliminar nota de ${n.estudiante} en ${n.materia}`));
      tr.append(td0, cell('td', n.materia), cell('td', n.curso), cell('td', fmtNota(n.nota), 'num'), acts);
      tb.append(tr);
    });
    $('tabla').parentElement.hidden = !shown.length;
    const e = $('empty'); e.hidden = shown.length > 0;
    e.innerHTML = notas.length ? '<strong>No hay resultados</strong>Prueba con otro nombre, materia o curso.'
      : '<strong>Aún no hay notas registradas</strong>Completa el formulario y pulsa «Guardar nota».';
  }

  /* ---------- Render: por estudiante ---------- */
  function renderEstudiante() {
    const sel = $('sel-estudiante'), actual = sel.value;
    const est = unicos(notas.map(n => n.estudiante));
    sel.replaceChildren(new Option('Selecciona un estudiante', ''), ...est.map(n => new Option(n, key(n))));
    sel.value = est.some(n => key(n) === actual) ? actual : '';

    const lista = notas.filter(n => key(n.estudiante) === sel.value)
      .sort((a, b) => a.materia.localeCompare(b.materia, 'es') || a.curso.localeCompare(b.curso, 'es'));
    $('resumen').hidden = !lista.length;
    const e = $('empty-est'); e.hidden = lista.length > 0;
    e.innerHTML = notas.length ? '<strong>Elige un estudiante</strong>Verás todas sus notas, su promedio y cuántas materias aprobó.'
      : '<strong>Aún no hay notas registradas</strong>Registra una nota para ver aquí el detalle de cada estudiante.';
    if (!lista.length) return;

    const apr = lista.filter(n => n.nota >= APRUEBA).length;
    $('nombre-est').textContent = lista[0].estudiante;
    $('st-prom').textContent = fmtNota(lista.reduce((s, n) => s + n.nota, 0) / lista.length);
    $('st-total').textContent = lista.length; $('st-apr').textContent = apr; $('st-rep').textContent = lista.length - apr;
    const tb = $('tabla-est').tBodies[0]; tb.replaceChildren();
    lista.forEach(n => {
      const ok = n.nota >= APRUEBA, tr = document.createElement('tr'), td = document.createElement('td');
      td.append(cell('span', ok ? 'Aprobada' : 'Reprobada', 'badge ' + (ok ? 'ok' : 'no')));
      tr.append(cell('td', n.materia), cell('td', n.curso), cell('td', fmtNota(n.nota), 'num'), td, cell('td', fmtFecha(n.updated)));
      tb.append(tr);
    });
  }

  function render() {
    $('count').textContent = notas.length === 1 ? '1 nota registrada' : `${notas.length} notas registradas`;
    fillList('lista-estudiantes', notas.map(n => n.estudiante));
    fillList('lista-materias', notas.map(n => n.materia));
    fillList('lista-cursos', notas.map(n => n.curso));
    renderRegistro(); renderEstudiante();
  }
  $('search').addEventListener('input', renderRegistro);
  $('sel-estudiante').addEventListener('change', renderEstudiante);

  render();
})();
