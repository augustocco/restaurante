<script>
  import { restaurantStore } from "../stores/restaurantStore";

  export let session = null;
  $: canManage = session?.role === "Administrador" || session?.role === "Mesero";

  // ── View state ────────────────────────────────────────────────────────
  let view = "lista";            // "lista" | "calendario"
  let filterStatus = "todas";
  let selectedDay  = null;       // "YYYY-MM-DD" for calendar drill-down

  // ── Form ──────────────────────────────────────────────────────────────
  let showForm  = false;
  let saving    = false;
  let formError = "";
  let form = emptyForm();

  function emptyForm() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return {
      name:   "",
      people: 2,
      date:   toLocalISO(now),
      phone:  "",
      notes:  ""
    };
  }

  function toLocalISO(d) {
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function saveReservation() {
    formError = "";
    if (!form.name.trim())   { formError = "El nombre es obligatorio."; return; }
    if (!form.date)          { formError = "La fecha y hora son obligatorias."; return; }
    if (form.people < 1)     { formError = "Mínimo 1 persona."; return; }
    saving = true;
    const err = await restaurantStore.addReservation({ ...form, people: Number(form.people) });
    saving = false;
    if (err) { formError = err; return; }
    showForm = false;
    form = emptyForm();
  }

  async function changeStatus(id, status) {
    await restaurantStore.updateReservationStatus(id, status);
  }

  async function remove(id, name) {
    if (!confirm(`¿Eliminar la reserva de "${name}"?`)) return;
    await restaurantStore.deleteReservation(id);
  }

  // ── Status config ─────────────────────────────────────────────────────
  const STATUS = {
    pendiente:  { label: "Pendiente",  bg: "#fef0d4", color: "#9a5f00" },
    confirmada: { label: "Confirmada", bg: "#d4f4e6", color: "#0d6b3e" },
    cancelada:  { label: "Cancelada",  bg: "#ffe4d4", color: "#c0380a" }
  };
  const STATUS_FILTERS = ["todas", "pendiente", "confirmada", "cancelada"];

  // ── Calendar state ────────────────────────────────────────────────────
  let calYear  = new Date().getFullYear();
  let calMonth = new Date().getMonth();  // 0-indexed
  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DAYS   = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

  function prevMonth() { if (calMonth === 0) { calMonth = 11; calYear--; } else calMonth--; }
  function nextMonth() { if (calMonth === 11) { calMonth = 0; calYear++; } else calMonth++; }

  $: calDays = buildCalendar(calYear, calMonth);

  function buildCalendar(y, m) {
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // Mon=0
    const total    = new Date(y, m + 1, 0).getDate();
    const cells    = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }

  function dayKey(y, m, d) {
    const pad = n => String(n).padStart(2, "0");
    return `${y}-${pad(m+1)}-${pad(d)}`;
  }

  function reservasForDay(key) {
    return $restaurantStore.reservations.filter(r => r.date?.slice(0,10) === key);
  }

  function dayClass(key) {
    const rs = reservasForDay(key);
    if (!rs.length) return "";
    if (rs.some(r => r.status === "confirmada")) return "has-confirmed";
    if (rs.some(r => r.status === "pendiente"))  return "has-pending";
    return "has-cancelled";
  }

  const todayKey = dayKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  // ── Derived list ──────────────────────────────────────────────────────
  $: listReservations = $restaurantStore.reservations.filter(r => {
    const matchStatus = filterStatus === "todas" || r.status === filterStatus;
    const matchDay    = !selectedDay || r.date?.slice(0,10) === selectedDay;
    return matchStatus && matchDay;
  });

  function formatDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { weekday:"short", day:"numeric", month:"short", year:"numeric" })
      + " · " + d.toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });
  }

  $: todayCount     = $restaurantStore.reservations.filter(r => r.date?.slice(0,10) === todayKey).length;
  $: pendingCount   = $restaurantStore.reservations.filter(r => r.status === "pendiente").length;
  $: confirmedCount = $restaurantStore.reservations.filter(r => r.status === "confirmada").length;
</script>

<!-- ════════════════════════════════════════════════════════════════════ -->
<div class="res-module">

  <!-- Header -->
  <div class="mod-header">
    <div class="header-left">
      <h2>Reservas</h2>
      <div class="stat-chips">
        <span class="chip chip--today">📅 {todayCount} hoy</span>
        <span class="chip chip--pending">{pendingCount} pendientes</span>
        <span class="chip chip--ok">{confirmedCount} confirmadas</span>
      </div>
    </div>
    <div class="header-right">
      <div class="view-toggle">
        <button class="vt {view==='lista'?'active':''}" on:click={() => { view='lista'; selectedDay=null; }}>
          <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
          Lista
        </button>
        <button class="vt {view==='calendario'?'active':''}" on:click={() => view='calendario'}>
          <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
          Calendario
        </button>
      </div>
      <button class="btn-new" on:click={() => { showForm = !showForm; formError = ""; form = emptyForm(); }}>
        {#if showForm}✕ Cerrar{:else}+ Nueva reserva{/if}
      </button>
    </div>
  </div>

  <!-- Error / loading -->
  {#if $restaurantStore.reservasError}
    <div class="alert-error">{$restaurantStore.reservasError}</div>
  {/if}

  <!-- ── New reservation form ── -->
  {#if showForm}
    <div class="form-card">
      <h3>Nueva reserva</h3>
      <div class="form-grid">
        <label class="field span-2">
          <span>Cliente *</span>
          {#if $restaurantStore.users.filter(u => u.role === 'Cliente').length === 0}
            <p class="no-clients-warn">No hay clientes registrados. Agrega uno en el módulo Usuarios.</p>
          {:else}
            <select bind:value={form.name} class="field-select">
              <option value="">— Seleccionar cliente —</option>
              {#each $restaurantStore.users.filter(u => u.role === 'Cliente') as u (u.id)}
                <option value={u.name}>{u.name} — {u.email}</option>
              {/each}
            </select>
          {/if}
        </label>
        <label class="field">
          <span>Fecha y hora *</span>
          <input type="datetime-local" bind:value={form.date} />
        </label>
        <label class="field">
          <span>Personas *</span>
          <input type="number" min="1" max="50" bind:value={form.people} />
        </label>
        <label class="field">
          <span>Teléfono</span>
          <input type="tel" placeholder="+57 300 000 0000" bind:value={form.phone} />
        </label>
        <label class="field">
          <span>Notas</span>
          <input type="text" placeholder="Ocasión, preferencias…" bind:value={form.notes} />
        </label>
      </div>
      {#if formError}<p class="form-error">{formError}</p>{/if}
      <div class="form-actions">
        <button class="btn-cancel" on:click={() => showForm = false} disabled={saving}>Cancelar</button>
        <button class="btn-save" on:click={saveReservation} disabled={saving}>
          {#if saving}<span class="spinner-sm"></span>{/if}
          Guardar reserva
        </button>
      </div>
    </div>
  {/if}

  <!-- ══ LISTA ══════════════════════════════════════════════════════════ -->
  {#if view === 'lista'}
    <div class="filter-row">
      {#each STATUS_FILTERS as sf}
        <button class="pill {filterStatus===sf?'active':''}" on:click={() => filterStatus=sf}>
          {sf === 'todas' ? 'Todas' : STATUS[sf]?.label}
        </button>
      {/each}
      {#if selectedDay}
        <span class="day-filter-badge">
          📅 {selectedDay}
          <button class="clear-day" on:click={() => selectedDay = null}>✕</button>
        </span>
      {/if}
    </div>

    {#if $restaurantStore.reservasLoading}
      <div class="loading-row"><span class="spinner"></span> Cargando reservas…</div>
    {:else if listReservations.length === 0}
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
        <p>No hay reservas{filterStatus !== 'todas' ? ' en este estado' : ''}.</p>
      </div>
    {:else}
      <div class="res-list">
        {#each listReservations as r (r.id)}
          {@const st = STATUS[r.status] ?? STATUS.pendiente}
          <div class="res-card">
            <div class="res-card-left">
              <div class="res-avatar">{r.name.charAt(0).toUpperCase()}</div>
              <div class="res-info">
                <div class="res-name">{r.name}
                  {#if r.phone}<span class="res-phone">· {r.phone}</span>{/if}
                </div>
                <div class="res-datetime">
                  <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                  {formatDateTime(r.date)}
                </div>
                <div class="res-people">
                  <svg viewBox="0 0 24 24"><path d="M16 11a4 4 0 1 0-3.999-4A4 4 0 0 0 16 11zm-8 0A3 3 0 1 0 5 8a3 3 0 0 0 3 3zm8 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/></svg>
                  {r.people} persona{r.people !== 1 ? 's' : ''}
                  {#if r.notes}<span class="res-notes">· {r.notes}</span>{/if}
                </div>
              </div>
            </div>
            <div class="res-card-right">
              <span class="status-badge" style="background:{st.bg};color:{st.color}">{st.label}</span>
              {#if canManage}
                <div class="res-actions">
                  {#if r.status === 'pendiente'}
                    <button class="btn-status ok" on:click={() => changeStatus(r.id,'confirmada')}>Confirmar</button>
                    <button class="btn-status danger" on:click={() => changeStatus(r.id,'cancelada')}>Cancelar</button>
                  {:else if r.status === 'confirmada'}
                    <button class="btn-status danger" on:click={() => changeStatus(r.id,'cancelada')}>Cancelar</button>
                  {/if}
                  <button class="btn-icon-del" title="Eliminar" on:click={() => remove(r.id, r.name)}>
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

  <!-- ══ CALENDARIO ═════════════════════════════════════════════════════ -->
  {:else}
    <div class="calendar-wrap">
      <div class="cal-header">
        <button class="cal-nav" on:click={prevMonth}>‹</button>
        <span class="cal-title">{MONTHS[calMonth]} {calYear}</span>
        <button class="cal-nav" on:click={nextMonth}>›</button>
      </div>

      <div class="cal-grid">
        {#each DAYS as d}
          <div class="cal-dow">{d}</div>
        {/each}
        {#each calDays as day}
          {#if day === null}
            <div class="cal-cell cal-empty"></div>
          {:else}
            {@const key = dayKey(calYear, calMonth, day)}
            {@const dayRes = reservasForDay(key)}
            <button
              class="cal-cell cal-day {dayClass(key)} {key === todayKey ? 'today' : ''} {selectedDay === key ? 'selected' : ''}"
              on:click={() => { selectedDay = selectedDay === key ? null : key; view = 'lista'; }}
            >
              <span class="day-num">{day}</span>
              {#if dayRes.length > 0}
                <span class="day-res-count">{dayRes.length}</span>
                <div class="day-dots">
                  {#each dayRes.slice(0,3) as r}
                    <span class="dot" style="background:{STATUS[r.status]?.color ?? '#999'}"></span>
                  {/each}
                </div>
              {/if}
            </button>
          {/if}
        {/each}
      </div>

      <!-- Legend -->
      <div class="cal-legend">
        <span class="legend-item"><span class="legend-dot" style="background:#0d6b3e"></span>Confirmada</span>
        <span class="legend-item"><span class="legend-dot" style="background:#9a5f00"></span>Pendiente</span>
        <span class="legend-item"><span class="legend-dot" style="background:#c0380a"></span>Cancelada</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .res-module { display: flex; flex-direction: column; gap: .85rem; }

  /* ── Header ── */
  .mod-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    flex-wrap: wrap; gap: .7rem;
  }
  .header-left { display: flex; flex-direction: column; gap: .4rem; }
  .header-left h2 { margin: 0; font-size: 1.2rem; }
  .stat-chips  { display: flex; flex-wrap: wrap; gap: .4rem; }
  .chip {
    font-size: .75rem; font-weight: 700; padding: .22rem .65rem;
    border-radius: 999px; white-space: nowrap;
  }
  .chip--today   { background: #f0ebe1; color: var(--muted); }
  .chip--pending { background: #fef0d4; color: #9a5f00; }
  .chip--ok      { background: #d4f4e6; color: #0d6b3e; }

  .header-right { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
  .view-toggle  {
    display: flex; gap: .25rem; background: #f0ebe1; border-radius: 10px; padding: .25rem;
  }
  .vt {
    display: inline-flex; align-items: center; gap: .35rem;
    border: none; border-radius: 8px; padding: .42rem .8rem;
    cursor: pointer; font: inherit; font-size: .84rem; font-weight: 600;
    color: var(--muted); background: transparent; transition: background .2s, color .2s;
  }
  .vt svg { width: 15px; height: 15px; fill: currentColor; }
  .vt.active { background: #fff; color: var(--primary); box-shadow: 0 2px 7px rgba(0,0,0,.09); }

  .btn-new {
    border: none; border-radius: 9px; padding: .5rem 1.1rem;
    background: linear-gradient(90deg, var(--primary), var(--primary-2));
    color: #fff; cursor: pointer; font: inherit; font-size: .88rem; font-weight: 700;
    box-shadow: 0 5px 14px rgba(215,78,9,.28); transition: opacity .2s;
  }
  .btn-new:hover { opacity: .9; }

  /* ── Alerts ── */
  .alert-error {
    background: #ffe8e4; border: 1px solid #f5c0b4; border-radius: 9px;
    color: var(--danger); padding: .65rem .85rem; font-size: .88rem;
  }

  /* ── Form ── */
  .form-card {
    background: #fffdf8; border: 1.5px solid #e8dccf; border-radius: 14px; padding: 1.2rem;
    animation: fade .28s ease;
  }
  .form-card h3 { margin: 0 0 .9rem; font-size: 1rem; }
  .form-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; margin-bottom: .7rem;
  }
  .field { display: flex; flex-direction: column; gap: .28rem; }
  .field span { font-size: .83rem; font-weight: 600; color: #4a3520; }
  .field input, .field-select {
    border: 1.5px solid #e0d4c0; border-radius: 9px;
    padding: .6rem .8rem; font: inherit; font-size: .93rem; background: #fff;
    transition: border-color .2s; width: 100%;
  }
  .field input:focus, .field-select:focus { outline: none; border-color: var(--primary); }
  .no-clients-warn {
    margin: .3rem 0 0; font-size: .83rem; color: #9a5f00;
    background: #fef0d4; border-radius: 8px; padding: .5rem .75rem;
  }
  .span-2 { grid-column: span 2; }
  .form-error { margin: 0 0 .5rem; color: var(--danger); font-size: .87rem; font-weight: 500; }
  .form-actions { display: flex; gap: .6rem; justify-content: flex-end; }
  .btn-cancel {
    border: 1.5px solid #e0d4c0; border-radius: 9px; background: #fff;
    padding: .52rem 1.1rem; cursor: pointer; font: inherit; font-weight: 600; color: var(--muted);
  }
  .btn-save {
    display: inline-flex; align-items: center; gap: .4rem;
    border: none; border-radius: 9px; padding: .52rem 1.3rem;
    background: linear-gradient(90deg, var(--primary), var(--primary-2));
    color: #fff; cursor: pointer; font: inherit; font-weight: 700;
  }
  .btn-save:disabled, .btn-cancel:disabled { opacity: .6; cursor: not-allowed; }

  /* ── Filter row ── */
  .filter-row { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
  .pill {
    border: 1.5px solid #e5d7bf; border-radius: 999px; background: #fff;
    padding: .32rem .8rem; cursor: pointer; font: inherit; font-size: .83rem;
    font-weight: 600; color: #5b3f25; transition: background .18s, border-color .18s;
  }
  .pill:hover  { background: #fff6e6; }
  .pill.active { background: linear-gradient(90deg, var(--primary), var(--primary-2)); color: #fff; border-color: transparent; }
  .day-filter-badge {
    display: inline-flex; align-items: center; gap: .35rem;
    background: #dbeafe; color: #1a4f9c; border-radius: 999px;
    padding: .3rem .75rem; font-size: .82rem; font-weight: 600;
  }
  .clear-day {
    border: none; background: none; cursor: pointer; font: inherit; color: inherit;
    padding: 0; line-height: 1;
  }

  /* ── Reservation cards ── */
  .res-list { display: flex; flex-direction: column; gap: .6rem; }
  .res-card {
    display: flex; align-items: flex-start; justify-content: space-between;
    background: #fffdf8; border: 1.5px solid #e8dccf; border-radius: 13px;
    padding: .9rem 1rem; gap: .8rem; flex-wrap: wrap;
    transition: box-shadow .2s;
  }
  .res-card:hover { box-shadow: 0 6px 18px rgba(40,24,8,.09); }
  .res-card-left  { display: flex; align-items: flex-start; gap: .75rem; flex: 1; min-width: 0; }
  .res-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; flex-shrink: 0; }

  .res-avatar {
    width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, var(--primary), var(--primary-2));
    color: #fff; font-weight: 800; font-size: 1.1rem;
    display: grid; place-items: center;
  }
  .res-info    { display: flex; flex-direction: column; gap: .28rem; min-width: 0; }
  .res-name    { font-weight: 700; font-size: .97rem; }
  .res-phone   { font-weight: 400; color: var(--muted); font-size: .88rem; }
  .res-datetime, .res-people {
    display: flex; align-items: center; gap: .3rem;
    font-size: .83rem; color: var(--muted);
  }
  .res-datetime svg, .res-people svg { width: 13px; height: 13px; fill: var(--muted); flex-shrink: 0; }
  .res-notes { color: var(--muted); font-size: .8rem; font-style: italic; }

  .status-badge {
    font-size: .75rem; font-weight: 700; padding: .22rem .65rem; border-radius: 999px;
    white-space: nowrap;
  }
  .res-actions { display: flex; gap: .35rem; flex-wrap: wrap; justify-content: flex-end; }
  .btn-status {
    border: none; border-radius: 7px; padding: .32rem .75rem;
    cursor: pointer; font: inherit; font-size: .78rem; font-weight: 700;
    transition: opacity .18s;
  }
  .btn-status.ok     { background: #d4f4e6; color: #0d6b3e; }
  .btn-status.danger { background: #ffe4d4; color: #c0380a; }
  .btn-status:hover  { opacity: .8; }
  .btn-icon-del {
    border: 1px solid #e0d4c0; border-radius: 7px; background: #fff;
    width: 30px; height: 30px; display: grid; place-items: center; cursor: pointer;
    transition: background .18s;
  }
  .btn-icon-del:hover { background: #ffe8e4; }
  .btn-icon-del svg   { width: 15px; height: 15px; fill: var(--danger); }

  /* ── Empty / loading ── */
  .loading-row {
    display: flex; align-items: center; gap: .5rem;
    color: var(--muted); font-size: .9rem; padding: 1rem 0;
  }
  .empty-state {
    text-align: center; padding: 2.5rem 1rem; color: var(--muted);
  }
  .empty-state svg { width: 44px; height: 44px; fill: #d4b899; margin-bottom: .7rem; display: block; margin: 0 auto .7rem; }
  .empty-state p { margin: 0; }

  /* ── Calendar ── */
  .calendar-wrap { display: flex; flex-direction: column; gap: .75rem; }
  .cal-header {
    display: flex; align-items: center; justify-content: center; gap: 1.2rem;
  }
  .cal-title { font-size: 1.05rem; font-weight: 700; color: #4a3520; min-width: 160px; text-align: center; }
  .cal-nav {
    border: 1.5px solid #e0d4c0; border-radius: 8px; background: #fff;
    width: 34px; height: 34px; cursor: pointer; font-size: 1.2rem; line-height: 1;
    display: grid; place-items: center; transition: background .18s;
  }
  .cal-nav:hover { background: #fff6e6; }

  .cal-grid {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px;
  }
  .cal-dow {
    text-align: center; font-size: .75rem; font-weight: 700; color: var(--muted);
    padding: .3rem 0;
  }
  .cal-cell {
    aspect-ratio: 1; border-radius: 10px; display: flex; flex-direction: column;
    align-items: center; justify-content: flex-start; padding: .35rem .2rem .2rem;
    border: 1.5px solid transparent; cursor: default;
    position: relative; overflow: hidden;
  }
  .cal-empty  { background: transparent; }
  .cal-day {
    background: #fffdf8; border-color: #f0e8d8; cursor: pointer;
    transition: border-color .18s, background .18s, box-shadow .18s;
  }
  .cal-day:hover { background: #fff6e6; border-color: var(--primary-2); }
  .cal-day.today { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(215,78,9,.18); }
  .cal-day.selected { background: #fef0d4; border-color: var(--primary); }

  .cal-day.has-confirmed { background: #e8f9f0; }
  .cal-day.has-pending   { background: #fef5e0; }
  .cal-day.has-cancelled { background: #f5f5f5; }

  .day-num { font-size: .85rem; font-weight: 700; color: var(--text); }
  .day-res-count {
    font-size: .68rem; font-weight: 800; line-height: 1;
    background: var(--primary); color: #fff;
    border-radius: 999px; padding: .05rem .35rem; margin-top: .1rem;
  }
  .day-dots { display: flex; gap: 2px; margin-top: auto; margin-bottom: .1rem; }
  .dot { width: 5px; height: 5px; border-radius: 50%; }

  .cal-legend {
    display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
  }
  .legend-item {
    display: flex; align-items: center; gap: .35rem;
    font-size: .78rem; color: var(--muted); font-weight: 600;
  }
  .legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

  /* ── Spinner ── */
  .spinner, .spinner-sm {
    display: inline-block; border-radius: 50%;
    border: 2px solid rgba(0,0,0,.12); border-top-color: var(--primary);
    animation: spin .7s linear infinite;
  }
  .spinner    { width: 16px; height: 16px; }
  .spinner-sm { width: 13px; height: 13px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes fade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

  @media (max-width: 640px) {
    .form-grid   { grid-template-columns: 1fr; }
    .span-2      { grid-column: span 1; }
    .res-card    { flex-direction: column; }
    .res-card-right { align-items: flex-start; }
  }
</style>
