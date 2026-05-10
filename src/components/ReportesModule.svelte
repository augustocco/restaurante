<script>
  import { restaurantStore } from "../stores/restaurantStore";
  import { formatPrice } from "../lib/utils";

  export let session = null;

  let tab = "cierre";   // "cierre" | "historial"
  let selectedDate = todayStr();
  let closingNotes = "";
  let closing = false;
  let closeError = "";
  let closeSuccess = "";

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  // ── Orders for selected date ──────────────────────────────────────────
  $: dayOrders = $restaurantStore.orders.filter(o => {
    const d = (o.created_at ?? o.date ?? "").slice(0, 10);
    return d === selectedDate;
  });

  $: dayTotal        = dayOrders.reduce((a, o) => a + (o.total ?? 0), 0);
  $: dayCount        = dayOrders.length;
  $: dayAvgTicket    = dayCount ? dayTotal / dayCount : 0;
  $: dayDelivered    = dayOrders.filter(o => o.status === "entregado").length;
  $: dayPending      = dayOrders.filter(o => o.status !== "entregado" && o.status !== "cancelado").length;

  // ── Top dishes ────────────────────────────────────────────────────────
  $: topDishes = (() => {
    const counter = {};
    dayOrders.flatMap(o => o.items ?? []).forEach(i => {
      counter[i.name] = (counter[i.name] || 0) + (i.quantity ?? 1);
    });
    return Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, 5);
  })();

  // ── Sales by hour ─────────────────────────────────────────────────────
  $: hourData = (() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ h, total: 0 }));
    dayOrders.forEach(o => {
      const h = new Date(o.created_at ?? o.date).getHours();
      if (h >= 0 && h < 24) hours[h].total += o.total ?? 0;
    });
    // Only show hours with activity ± 1 buffer, min range 8–22
    const active = hours.filter(h => h.total > 0).map(h => h.h);
    const minH = active.length ? Math.max(0,  Math.min(...active) - 1) : 8;
    const maxH = active.length ? Math.min(23, Math.max(...active) + 1) : 22;
    const slice = hours.slice(minH, maxH + 1);
    const maxVal = Math.max(...slice.map(h => h.total), 1);
    return slice.map(h => ({ ...h, pct: Math.round((h.total / maxVal) * 100) }));
  })();

  // ── Cierre status ─────────────────────────────────────────────────────
  $: cierreDelDia = $restaurantStore.cierres.find(c => c.fecha === selectedDate) ?? null;
  $: isToday      = selectedDate === todayStr();
  $: canClose     = !cierreDelDia && dayCount > 0 && session?.role === "Administrador";

  async function handleClose() {
    closeError = "";
    closeSuccess = "";
    closing = true;
    const err = await restaurantStore.closeCaja({
      fecha:        selectedDate,
      total:        dayTotal,
      orders_count: dayCount,
      closed_by:    session?.name ?? "Sistema",
      notes:        closingNotes.trim()
    });
    closing = false;
    if (err) { closeError = err; }
    else {
      closeSuccess = `Caja cerrada correctamente para ${formatDate(selectedDate)}.`;
      closingNotes = "";
    }
  }

  function formatDate(str) {
    if (!str) return "";
    const [y, m, d] = str.split("-");
    return `${d}/${m}/${y}`;
  }

  function formatDateTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }
</script>

<div class="rep-module">

  <!-- Inner tabs -->
  <div class="tab-bar">
    <button class="inner-tab {tab === 'cierre' ? 'active' : ''}" on:click={() => tab = 'cierre'}>
      <svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
      Cierre de caja
    </button>
    <button class="inner-tab {tab === 'historial' ? 'active' : ''}" on:click={() => tab = 'historial'}>
      <svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
      Historial de cierres
    </button>
  </div>

  <!-- ══ CIERRE DE CAJA ════════════════════════════════════════════════ -->
  {#if tab === 'cierre'}

    <!-- Date picker -->
    <div class="date-bar">
      <label class="date-label">
        <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
        Fecha del corte
      </label>
      <input type="date" class="date-input" bind:value={selectedDate} max={todayStr()} />
      {#if !isToday}
        <button class="btn-today" on:click={() => selectedDate = todayStr()}>Ir a hoy</button>
      {/if}
    </div>

    <!-- Status banner -->
    {#if cierreDelDia}
      <div class="status-banner status-closed">
        <svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
        <div>
          <strong>Caja cerrada</strong> · Cerrado por <strong>{cierreDelDia.closed_by}</strong>
          el {formatDateTime(cierreDelDia.created_at)}
          {#if cierreDelDia.notes}<br/><span class="banner-notes">"{cierreDelDia.notes}"</span>{/if}
        </div>
      </div>
    {:else if dayCount === 0}
      <div class="status-banner status-empty">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        Sin pedidos registrados para esta fecha.
      </div>
    {:else}
      <div class="status-banner status-open">
        <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
        <div>Caja <strong>abierta</strong> · {dayPending} pedido{dayPending !== 1 ? 's' : ''} pendiente{dayPending !== 1 ? 's' : ''} de entregar</div>
      </div>
    {/if}

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-main">
        <div class="kpi-icon">
          <svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
        </div>
        <div class="kpi-val">{formatPrice(dayTotal)}</div>
        <div class="kpi-lbl">Ventas del día</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-val">{dayCount}</div>
        <div class="kpi-lbl">Pedidos</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-val">{formatPrice(dayAvgTicket)}</div>
        <div class="kpi-lbl">Ticket promedio</div>
      </div>
      <div class="kpi-card kpi-ok">
        <div class="kpi-val">{dayDelivered}</div>
        <div class="kpi-lbl">Entregados</div>
      </div>
    </div>

    <!-- Body grid: chart + top dishes -->
    {#if dayCount > 0}
      <div class="body-grid">

        <!-- Sales by hour -->
        <div class="panel">
          <h4 class="panel-title">Ventas por hora</h4>
          <div class="hour-chart">
            {#each hourData as hd}
              <div class="hour-col">
                <div class="bar-wrap">
                  <div class="bar {hd.total > 0 ? 'bar-filled' : ''}" style="height:{hd.pct}%">
                    {#if hd.total > 0}
                      <span class="bar-tip">{formatPrice(hd.total)}</span>
                    {/if}
                  </div>
                </div>
                <div class="hour-label">{hd.h}h</div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Top dishes -->
        <div class="panel">
          <h4 class="panel-title">Platos más vendidos</h4>
          {#if topDishes.length === 0}
            <p class="empty-hint">Sin datos de platos.</p>
          {:else}
            <div class="top-dishes">
              {#each topDishes as [name, qty], i}
                {@const maxQty = topDishes[0][1]}
                <div class="dish-row">
                  <span class="dish-rank">#{i + 1}</span>
                  <div class="dish-info">
                    <span class="dish-name">{name}</span>
                    <div class="dish-bar-bg">
                      <div class="dish-bar" style="width:{Math.round((qty / maxQty) * 100)}%"></div>
                    </div>
                  </div>
                  <span class="dish-qty">×{qty}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Orders table -->
      <div class="panel">
        <h4 class="panel-title">Pedidos del día</h4>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Mesa / Dir.</th>
                <th>Platos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {#each dayOrders as o (o.id)}
                {@const statusColors = {
                  pendiente:      { bg:"#fef0d4", color:"#9a5f00" },
                  en_preparacion: { bg:"#dbeafe", color:"#1a4f9c" },
                  listo:          { bg:"#d4f4e6", color:"#0d6b3e" },
                  entregado:      { bg:"#ececec", color:"#555"    }
                }}
                {@const sc = statusColors[o.status] ?? { bg:"#eee", color:"#333" }}
                <tr>
                  <td class="order-id-cell">{o.id}</td>
                  <td>{o.customer}</td>
                  <td>{o.place}</td>
                  <td class="items-cell">
                    {(o.items ?? []).map(i => `${i.quantity}× ${i.name}`).join(", ")}
                  </td>
                  <td><strong>{formatPrice(o.total)}</strong></td>
                  <td>
                    <span class="status-pill" style="background:{sc.bg};color:{sc.color}">
                      {o.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td class="time-cell">{new Date(o.created_at ?? o.date).toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" })}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Close cash register -->
    {#if session?.role === "Administrador"}
      <div class="close-panel">
        <h4>Cierre de caja — {formatDate(selectedDate)}</h4>
        {#if cierreDelDia}
          <p class="already-closed">Esta caja ya fue cerrada. Consulta el historial para ver los detalles.</p>
        {:else}
          <textarea
            class="notes-area"
            placeholder="Notas del cierre (opcional): observaciones, diferencias, incidencias…"
            bind:value={closingNotes}
            rows="3"
            disabled={closing}
          ></textarea>
          {#if closeError}
            <p class="close-error">{closeError}</p>
          {/if}
          {#if closeSuccess}
            <p class="close-ok">{closeSuccess}</p>
          {/if}
          <div class="close-summary">
            <span>Total a cerrar: <strong>{formatPrice(dayTotal)}</strong></span>
            <span>{dayCount} pedido{dayCount !== 1 ? 's' : ''}</span>
          </div>
          <button
            class="btn-close-caja"
            on:click={handleClose}
            disabled={closing || dayCount === 0}>
            {#if closing}<span class="spinner-sm"></span>{/if}
            {closing ? "Cerrando…" : "Cerrar caja"}
          </button>
          {#if dayCount === 0}
            <p class="empty-hint" style="margin-top:.5rem">No hay pedidos para cerrar en esta fecha.</p>
          {/if}
        {/if}
      </div>
    {/if}

  <!-- ══ HISTORIAL ══════════════════════════════════════════════════════ -->
  {:else}
    {#if $restaurantStore.cierresLoading}
      <div class="loading-row"><span class="spinner"></span> Cargando historial…</div>
    {:else if $restaurantStore.cierres.length === 0}
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
        <p>Aún no hay cierres de caja registrados.</p>
      </div>
    {:else}
      <!-- Summary KPIs -->
      {@const totalAcum  = $restaurantStore.cierres.reduce((a, c) => a + c.total, 0)}
      {@const ordersAcum = $restaurantStore.cierres.reduce((a, c) => a + c.orders_count, 0)}
      <div class="hist-kpis">
        <div class="kpi-card kpi-main">
          <div class="kpi-val">{formatPrice(totalAcum)}</div>
          <div class="kpi-lbl">Ventas acumuladas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{$restaurantStore.cierres.length}</div>
          <div class="kpi-lbl">Días cerrados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{ordersAcum}</div>
          <div class="kpi-lbl">Pedidos totales</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{formatPrice(ordersAcum ? totalAcum / ordersAcum : 0)}</div>
          <div class="kpi-lbl">Ticket promedio global</div>
        </div>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Pedidos</th>
                <th>Total</th>
                <th>Ticket prom.</th>
                <th>Cerrado por</th>
                <th>Hora de cierre</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {#each $restaurantStore.cierres as c (c.id)}
                <tr>
                  <td><strong>{formatDate(c.fecha)}</strong></td>
                  <td>{c.orders_count}</td>
                  <td><strong class="amount">{formatPrice(c.total)}</strong></td>
                  <td>{formatPrice(c.orders_count ? c.total / c.orders_count : 0)}</td>
                  <td>{c.closed_by}</td>
                  <td class="time-cell">{formatDateTime(c.created_at)}</td>
                  <td class="notes-cell">{c.notes || "—"}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .rep-module { display: flex; flex-direction: column; gap: .9rem; }

  /* ── Inner tabs ── */
  .tab-bar {
    display: flex; align-items: center; gap: .4rem;
    background: #f0ebe1; border-radius: 12px; padding: .3rem .4rem;
  }
  .inner-tab {
    display: inline-flex; align-items: center; gap: .4rem;
    border: none; border-radius: 9px; padding: .5rem 1rem;
    cursor: pointer; font: inherit; font-size: .9rem; font-weight: 600;
    color: var(--muted); background: transparent;
    transition: background .2s, color .2s, box-shadow .2s;
  }
  .inner-tab svg { width: 16px; height: 16px; fill: currentColor; }
  .inner-tab.active { background: #fff; color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,.1); }

  /* ── Date bar ── */
  .date-bar {
    display: flex; align-items: center; gap: .75rem; flex-wrap: wrap;
  }
  .date-label {
    display: flex; align-items: center; gap: .35rem;
    font-size: .86rem; font-weight: 700; color: #4a3520;
    white-space: nowrap;
  }
  .date-label svg { width: 16px; height: 16px; fill: var(--muted); }
  .date-input {
    border: 1.5px solid #e0d4c0; border-radius: 9px;
    padding: .5rem .75rem; font: inherit; font-size: .9rem;
    background: #fff; width: auto;
  }
  .date-input:focus { outline: none; border-color: var(--primary); }
  .btn-today {
    border: 1.5px solid #e0d4c0; border-radius: 9px; background: #fff;
    padding: .5rem .9rem; cursor: pointer; font: inherit; font-size: .84rem;
    font-weight: 600; color: var(--primary); transition: background .18s;
  }
  .btn-today:hover { background: #fff6e6; }

  /* ── Status banner ── */
  .status-banner {
    display: flex; align-items: flex-start; gap: .65rem;
    border-radius: 11px; padding: .75rem 1rem; font-size: .88rem;
  }
  .status-banner svg { width: 20px; height: 20px; fill: currentColor; flex-shrink: 0; margin-top: .1rem; }
  .status-closed { background: #d4f4e6; color: #0d6b3e; border: 1px solid #a3e6c4; }
  .status-open   { background: #fef0d4; color: #9a5f00; border: 1px solid #f3cc7e; }
  .status-empty  { background: #f3f3f3; color: var(--muted); border: 1px solid #ddd; }
  .banner-notes  { font-style: italic; font-size: .84rem; }

  /* ── KPI grid ── */
  .kpi-grid {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: .7rem;
  }
  .hist-kpis {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: .7rem;
  }
  .kpi-card {
    background: #fff8eb; border: 1px solid #f3e2c6; border-radius: 13px;
    padding: .9rem 1rem; display: flex; flex-direction: column; gap: .25rem;
  }
  .kpi-main {
    background: linear-gradient(135deg, #fff3e0, #ffe0b2);
    border-color: #f5c97a; position: relative; overflow: hidden;
  }
  .kpi-ok { background: #e8f9f0; border-color: #a3e6c4; }
  .kpi-icon {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(215,78,9,.12); display: grid; place-items: center;
    margin-bottom: .15rem;
  }
  .kpi-icon svg { width: 20px; height: 20px; fill: var(--primary); }
  .kpi-val { font-size: 1.55rem; font-weight: 800; color: var(--text); line-height: 1; }
  .kpi-lbl { font-size: .76rem; font-weight: 600; color: var(--muted); }

  /* ── Body grid ── */
  .body-grid {
    display: grid; grid-template-columns: 1.6fr 1fr; gap: .9rem;
  }

  /* ── Panel ── */
  .panel {
    background: #fff; border: 1px solid #f1e7d9;
    border-radius: 13px; padding: .9rem; overflow: hidden;
  }
  .panel-title { margin: 0 0 .75rem; font-size: .95rem; color: #4a3520; }

  /* ── Hour chart ── */
  .hour-chart {
    display: flex; align-items: flex-end; gap: 3px;
    height: 120px; padding-bottom: 1.4rem; position: relative;
  }
  .hour-col { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0; height: 100%; }
  .bar-wrap  { flex: 1; display: flex; align-items: flex-end; width: 100%; }
  .bar {
    width: 100%; background: #f0ebe1; border-radius: 4px 4px 0 0;
    min-height: 4px; position: relative; transition: height .4s ease;
  }
  .bar-filled { background: linear-gradient(to top, var(--primary), var(--primary-2)); }
  .bar-tip {
    position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
    background: #333; color: #fff; font-size: .62rem; white-space: nowrap;
    border-radius: 4px; padding: .1rem .3rem; pointer-events: none;
    opacity: 0; transition: opacity .2s; margin-bottom: 3px;
  }
  .bar-filled:hover .bar-tip { opacity: 1; }
  .hour-label { font-size: .62rem; color: var(--muted); margin-top: .2rem; }

  /* ── Top dishes ── */
  .top-dishes { display: flex; flex-direction: column; gap: .55rem; }
  .dish-row { display: flex; align-items: center; gap: .5rem; }
  .dish-rank { font-size: .75rem; font-weight: 800; color: var(--muted); min-width: 20px; }
  .dish-info { flex: 1; min-width: 0; }
  .dish-name { font-size: .84rem; font-weight: 600; display: block; margin-bottom: .2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dish-bar-bg { background: #f0ebe1; border-radius: 999px; height: 7px; overflow: hidden; }
  .dish-bar { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--primary), var(--primary-2)); transition: width .5s ease; }
  .dish-qty { font-size: .8rem; font-weight: 700; color: var(--primary); min-width: 28px; text-align: right; }

  /* ── Table ── */
  .table-wrap { overflow-x: auto; }
  .order-id-cell { font-size: .75rem; font-family: monospace; color: var(--muted); white-space: nowrap; }
  .items-cell { font-size: .78rem; color: var(--muted); max-width: 200px; }
  .time-cell  { font-size: .82rem; color: var(--muted); white-space: nowrap; }
  .notes-cell { font-size: .82rem; color: var(--muted); font-style: italic; max-width: 160px; }
  .amount     { color: var(--primary); }
  .status-pill {
    font-size: .72rem; font-weight: 700; padding: .2rem .55rem;
    border-radius: 999px; white-space: nowrap; text-transform: capitalize;
  }

  /* ── Close panel ── */
  .close-panel {
    background: #fffdf8; border: 1.5px solid #e8dccf; border-radius: 14px;
    padding: 1.1rem 1.2rem; display: flex; flex-direction: column; gap: .7rem;
  }
  .close-panel h4 { margin: 0; font-size: 1rem; color: #4a3520; }
  .notes-area {
    width: 100%; border: 1.5px solid #e0d4c0; border-radius: 9px;
    padding: .65rem .85rem; font: inherit; font-size: .9rem; resize: vertical;
    background: #fff;
  }
  .notes-area:focus { outline: none; border-color: var(--primary); }
  .close-summary {
    display: flex; gap: 1.5rem; font-size: .88rem; color: #4a3520;
  }
  .close-error  { margin: 0; color: var(--danger); font-size: .86rem; font-weight: 600; }
  .close-ok     { margin: 0; color: #0d6b3e; font-size: .86rem; font-weight: 600; }
  .already-closed { margin: 0; color: var(--muted); font-size: .88rem; }
  .btn-close-caja {
    align-self: flex-start; display: inline-flex; align-items: center; gap: .45rem;
    border: none; border-radius: 10px; padding: .65rem 1.5rem;
    background: linear-gradient(90deg, var(--primary), var(--primary-2));
    color: #fff; cursor: pointer; font: inherit; font-size: .95rem; font-weight: 700;
    box-shadow: 0 6px 16px rgba(215,78,9,.3); transition: opacity .2s;
  }
  .btn-close-caja:hover    { opacity: .9; }
  .btn-close-caja:disabled { opacity: .55; cursor: not-allowed; box-shadow: none; }

  /* ── States ── */
  .loading-row { display: flex; align-items: center; gap: .5rem; color: var(--muted); font-size: .9rem; }
  .empty-state { text-align: center; padding: 2.5rem 1rem; color: var(--muted); }
  .empty-state svg { width: 44px; height: 44px; fill: #d4b899; margin: 0 auto .7rem; display: block; }
  .empty-state p { margin: 0; }
  .empty-hint { margin: 0; color: var(--muted); font-size: .84rem; }

  /* ── Spinner ── */
  .spinner, .spinner-sm {
    display: inline-block; border-radius: 50%;
    border: 2px solid rgba(0,0,0,.12); border-top-color: var(--primary);
    animation: spin .7s linear infinite;
  }
  .spinner    { width: 16px; height: 16px; }
  .spinner-sm { width: 13px; height: 13px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 940px) {
    .kpi-grid   { grid-template-columns: 1fr 1fr; }
    .hist-kpis  { grid-template-columns: 1fr 1fr; }
    .body-grid  { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .kpi-grid  { grid-template-columns: 1fr; }
    .hist-kpis { grid-template-columns: 1fr 1fr; }
  }
</style>
