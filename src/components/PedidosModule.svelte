<script>
  import { restaurantStore, restaurantView } from "../stores/restaurantStore";
  import { formatPrice } from "../lib/utils";

  export let session = null;

  let tab = "carta"; // "carta" | "pedidos"
  let orderType = "local"; // "local" | "domicilio"

  $: selectedClient = $restaurantStore.users.find(
    u => u.name === $restaurantStore.customerName
  ) ?? null;

  // ── Order filter ──────────────────────────────────────────────────────
  let filterStatus = "todos";

  const STATUS = {
    pendiente:      { label: "Pendiente",       color: "#9a5f00", bg: "#fef0d4", next: "en_preparacion", nextLabel: "Iniciar preparación" },
    en_preparacion: { label: "En preparación",  color: "#1a4f9c", bg: "#dbeafe", next: "listo",          nextLabel: "Marcar listo" },
    listo:          { label: "Listo",            color: "#0d6b3e", bg: "#d4f4e6", next: "entregado",      nextLabel: "Marcar entregado" },
    entregado:      { label: "Entregado",        color: "#555",    bg: "#ececec", next: null,             nextLabel: null }
  };

  const STATUS_FILTERS = ["todos", "pendiente", "en_preparacion", "listo", "entregado"];
  const STATUS_FILTER_LABELS = { todos: "Todos", pendiente: "Pendientes", en_preparacion: "En prep.", listo: "Listos", entregado: "Entregados" };

  // ── Derived ───────────────────────────────────────────────────────────
  $: orders = $restaurantStore.orders;

  $: pendingCount    = orders.filter(o => o.status === "pendiente").length;
  $: prepCount       = orders.filter(o => o.status === "en_preparacion").length;
  $: readyCount      = orders.filter(o => o.status === "listo").length;
  $: deliveredCount  = orders.filter(o => o.status === "entregado").length;

  $: filteredOrders  = filterStatus === "todos"
    ? orders
    : orders.filter(o => o.status === filterStatus);

  // ── Helpers ───────────────────────────────────────────────────────────
  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "Hace un momento";
    if (mins < 60) return `Hace ${mins} min`;
    return `Hace ${Math.floor(mins / 60)}h ${mins % 60}min`;
  }

  async function advanceStatus(order) {
    const next = STATUS[order.status]?.next;
    if (!next) return;
    await restaurantStore.updateOrderStatus(order.id, next);
  }
</script>

<!-- ══════════════════════════════════════════════════════════════════════ -->
<div class="pedidos-module">

  <!-- Tab bar -->
  <div class="tab-bar">
    <button class="inner-tab {tab === 'carta' ? 'active' : ''}" on:click={() => tab = 'carta'}>
      <svg viewBox="0 0 24 24"><path d="M5 3h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2zm2 4v2h8V7H7zm0 4v2h8v-2H7z"/></svg>
      Carta
    </button>
    <button class="inner-tab {tab === 'pedidos' ? 'active' : ''}" on:click={() => tab = 'pedidos'}>
      <svg viewBox="0 0 24 24"><path d="M4 5h16v2H4V5zm1 4h14l-1.2 9H6.2L5 9zm4.5-6h5v2h-5V3z"/></svg>
      Pedidos activos
      {#if pendingCount + prepCount + readyCount > 0}
        <span class="badge">{pendingCount + prepCount + readyCount}</span>
      {/if}
    </button>
    <!-- Realtime indicator -->
    <div class="live-badge">
      <span class="live-dot"></span> En vivo
    </div>
  </div>

  <!-- ══ CARTA ══════════════════════════════════════════════════════════ -->
  {#if tab === 'carta'}
    <div class="grid-2">
      <!-- Menu -->
      <div class="panel">
        <div class="menu-tools">
          <input placeholder="Buscar platos…"
            value={$restaurantStore.query}
            on:input={(e) => restaurantStore.setQuery(e.currentTarget.value)} />
          <div class="filter-wrap">
            {#each $restaurantView.categories as c}
              <button
                class="filter-btn {$restaurantStore.filter === c ? 'active' : ''}"
                on:click={() => restaurantStore.setFilter(c)}>{c}</button>
            {/each}
          </div>
        </div>

        {#if $restaurantStore.menuLoading}
          <p class="small muted">Cargando menú…</p>
        {:else if $restaurantView.filtered.length === 0}
          <p class="small muted">Sin resultados.</p>
        {:else}
          <div class="menu-grid">
            {#each $restaurantView.filtered as d (d.id)}
              <article class="card {!d.available ? 'card--unavail' : ''}">
                {#if d.image}
                  <img src={d.image} alt={d.name} loading="lazy"
                    on:error={(e) => { e.currentTarget.style.display='none'; }} />
                {:else}
                  <div class="card-img-placeholder"></div>
                {/if}
                <div class="card-body">
                  <div class="row">
                    <strong>{d.name}</strong>
                    <span class="small">{d.category}</span>
                  </div>
                  <p class="small">{d.description}</p>
                  <div class="row">
                    <strong>{formatPrice(d.price)}</strong>
                    {#if d.available}
                      <button class="btn btn-main"
                        on:click={() => restaurantStore.addToCart(d.id)}>Agregar</button>
                    {:else}
                      <span class="sold-badge">Agotado</span>
                    {/if}
                  </div>
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Cart + Order form -->
      <div class="panel">
        <h3>Carrito</h3>
        <ul class="list">
          {#if $restaurantView.cartEntries.length === 0}
            <li class="small muted">Aún sin productos.</li>
          {/if}
          {#each $restaurantView.cartEntries as i (i.id)}
            <li class="item">
              <div>
                <strong>{i.name}</strong>
                <div class="small">{formatPrice(i.price)} c/u</div>
              </div>
              <input type="number" min="1" value={i.quantity}
                on:input={(e) => restaurantStore.updateQty({ id: i.id, value: e.currentTarget.value })} />
              <button class="btn btn-danger"
                on:click={() => restaurantStore.removeFromCart(i.id)}>Quitar</button>
            </li>
          {/each}
        </ul>

        <div class="row total-row">
          <strong>Total</strong>
          <strong class="total-price">{formatPrice($restaurantView.total)}</strong>
        </div>
        <hr />

        <div class="menu-tools">

          <!-- Tipo de pedido -->
          <div class="order-type-toggle">
            <button
              class="ot-btn {orderType === 'local' ? 'active' : ''}"
              on:click={() => { orderType = 'local'; restaurantStore.setOrderPlace(''); }}>
              <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              En local
            </button>
            <button
              class="ot-btn {orderType === 'domicilio' ? 'active' : ''}"
              on:click={() => { orderType = 'domicilio'; restaurantStore.setOrderPlace(''); }}>
              <svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5l-3-4zm-.5 1.5 1.96 2.5H17V9.5h2.5zM6 18a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm2.22-3a3 3 0 0 0-4.44 0H3V6h12v9H8.22zM18 18a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
              Domicilio
            </button>
          </div>

          <!-- Cliente -->
          <div class="order-field">
            <label class="field-label">Cliente *</label>
            {#if $restaurantStore.users.filter(u => u.role === 'Cliente').length === 0}
              <p class="no-clients-warn">Sin clientes registrados. Agrega uno en Usuarios.</p>
            {:else}
              <select
                value={$restaurantStore.customerName}
                on:change={(e) => restaurantStore.setCustomerName(e.currentTarget.value)}>
                <option value="">— Seleccionar cliente —</option>
                {#each $restaurantStore.users.filter(u => u.role === 'Cliente') as u (u.id)}
                  <option value={u.name}>{u.name}</option>
                {/each}
              </select>
            {/if}

            {#if selectedClient}
              <div class="client-info-box">
                <span class="ci-item">
                  <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  {selectedClient.email}
                </span>
              </div>
            {/if}
          </div>

          <!-- Mesa o dirección -->
          <div class="order-field">
            {#if orderType === 'local'}
              <label class="field-label">Número de mesa *</label>
              <input
                type="number" min="1" placeholder="Ej: 5"
                value={$restaurantStore.orderPlace}
                on:input={(e) => restaurantStore.setOrderPlace(e.currentTarget.value)} />
            {:else}
              <label class="field-label">Dirección de entrega *</label>
              <input
                type="text" placeholder="Calle 123 # 45-67, Barrio…"
                value={$restaurantStore.orderPlace}
                on:input={(e) => restaurantStore.setOrderPlace(e.currentTarget.value)} />
            {/if}
          </div>

          <button class="btn btn-ok" on:click={() => restaurantStore.confirmOrder()}>
            Confirmar pedido
          </button>
        </div>

        {#if $restaurantStore.orderSummary}
          <div class="order-confirmed">
            <svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
            {$restaurantStore.orderSummary}
          </div>
        {/if}
      </div>
    </div>

  <!-- ══ PEDIDOS ACTIVOS ════════════════════════════════════════════════ -->
  {:else}
    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat stat--pending">
        <span class="stat-num">{pendingCount}</span>
        <span class="stat-lbl">Pendientes</span>
      </div>
      <div class="stat stat--prep">
        <span class="stat-num">{prepCount}</span>
        <span class="stat-lbl">En preparación</span>
      </div>
      <div class="stat stat--ready">
        <span class="stat-num">{readyCount}</span>
        <span class="stat-lbl">Listos</span>
      </div>
      <div class="stat stat--done">
        <span class="stat-num">{deliveredCount}</span>
        <span class="stat-lbl">Entregados</span>
      </div>
    </div>

    <!-- Filter pills -->
    <div class="filter-wrap" style="margin-bottom:.9rem">
      {#each STATUS_FILTERS as sf}
        <button
          class="filter-btn {filterStatus === sf ? 'active' : ''}"
          on:click={() => filterStatus = sf}>
          {STATUS_FILTER_LABELS[sf]}
        </button>
      {/each}
    </div>

    {#if $restaurantStore.ordersLoading}
      <div class="loading-msg"><span class="spinner"></span> Cargando pedidos…</div>
    {:else if filteredOrders.length === 0}
      <div class="empty-orders">
        <svg viewBox="0 0 24 24"><path d="M4 5h16v2H4V5zm1 4h14l-1.2 9H6.2L5 9zm4.5-6h5v2h-5V3z"/></svg>
        <p>No hay pedidos{filterStatus !== 'todos' ? ' en este estado' : ' aún'}.</p>
      </div>
    {:else}
      <div class="orders-grid">
        {#each filteredOrders as order (order.id)}
          {@const st = STATUS[order.status] ?? STATUS.pendiente}
          <div class="order-card">
            <!-- Card header -->
            <div class="order-header">
              <div class="order-id">{order.id}</div>
              <div class="order-time">{timeAgo(order.created_at ?? order.date)}</div>
            </div>

            <!-- Customer + place -->
            <div class="order-meta">
              <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              <span>{order.customer}</span>
              <svg viewBox="0 0 24 24" style="margin-left:.4rem"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <span>{order.place}</span>
            </div>

            <!-- Items -->
            <ul class="order-items">
              {#each (order.items ?? []) as item}
                <li>
                  <span class="item-qty">×{item.quantity}</span>
                  <span class="item-name">{item.name}</span>
                  <span class="item-subtotal">{formatPrice(item.price * item.quantity)}</span>
                </li>
              {/each}
            </ul>

            <div class="order-total">
              Total: <strong>{formatPrice(order.total)}</strong>
            </div>

            <!-- Status + action -->
            <div class="order-footer">
              <span class="status-badge" style="background:{st.bg}; color:{st.color}">
                {st.label}
              </span>
              {#if st.next}
                <button class="btn-advance" on:click={() => advanceStatus(order)}>
                  {st.nextLabel} →
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .pedidos-module { display: flex; flex-direction: column; gap: .85rem; }

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
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 .35rem;
    background: var(--primary); color: #fff;
    border-radius: 999px; font-size: .72rem; font-weight: 800;
  }
  .live-badge {
    margin-left: auto; display: inline-flex; align-items: center; gap: .35rem;
    font-size: .78rem; font-weight: 700; color: #0d6b3e;
  }
  .live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 0 rgba(34,197,94,.4);
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse {
    0%   { box-shadow: 0 0 0 0 rgba(34,197,94,.5); }
    70%  { box-shadow: 0 0 0 7px rgba(34,197,94,0); }
    100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
  }

  /* ── Carta tab ── */
  .muted      { color: var(--muted); }
  .sold-badge {
    font-size: .78rem; font-weight: 700; background: #ffe4d4;
    color: #c0380a; padding: .22rem .6rem; border-radius: 999px;
  }
  .card--unavail { opacity: .55; pointer-events: none; }
  .total-row  { margin: .5rem 0; }
  .total-price { font-size: 1.1rem; color: var(--primary); }
  .order-confirmed {
    display: flex; align-items: center; gap: .5rem;
    background: #d4f4e6; border: 1px solid #a3e6c4; border-radius: 9px;
    color: #0d6b3e; font-weight: 600; font-size: .9rem; padding: .65rem .85rem;
    margin-top: .5rem;
  }
  .order-confirmed svg { width: 18px; height: 18px; fill: currentColor; flex-shrink: 0; }
  .no-clients-warn {
    margin: 0; font-size: .83rem; color: #9a5f00;
    background: #fef0d4; border-radius: 8px; padding: .5rem .75rem;
  }

  /* ── Order type toggle ── */
  .order-type-toggle {
    display: grid; grid-template-columns: 1fr 1fr; gap: .4rem;
  }
  .ot-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
    border: 1.5px solid #e0d4c0; border-radius: 9px; background: #fffdf8;
    padding: .55rem .8rem; cursor: pointer; font: inherit; font-size: .87rem;
    font-weight: 600; color: #5b3f25; transition: all .2s;
  }
  .ot-btn svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }
  .ot-btn.active {
    background: linear-gradient(90deg, var(--primary), var(--primary-2));
    color: #fff; border-color: transparent;
    box-shadow: 0 4px 10px rgba(215,78,9,.25);
  }
  .ot-btn:hover:not(.active) { background: #fff6e6; }

  /* ── Order field ── */
  .order-field { display: flex; flex-direction: column; gap: .3rem; }
  .field-label { font-size: .82rem; font-weight: 700; color: #4a3520; }

  /* ── Client info box ── */
  .client-info-box {
    display: flex; align-items: center; gap: .5rem; flex-wrap: wrap;
    background: #f0f9f4; border: 1px solid #b8e8d0; border-radius: 8px;
    padding: .45rem .75rem; margin-top: .1rem;
  }
  .ci-item {
    display: flex; align-items: center; gap: .3rem;
    font-size: .8rem; color: #0d6b3e; font-weight: 500;
  }
  .ci-item svg { width: 13px; height: 13px; fill: currentColor; flex-shrink: 0; }

  /* ── Stats bar ── */
  .stats-bar {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: .65rem;
  }
  .stat {
    border-radius: 12px; padding: .75rem; text-align: center;
    display: flex; flex-direction: column; gap: .15rem;
  }
  .stat-num { font-size: 1.8rem; font-weight: 800; line-height: 1; }
  .stat-lbl { font-size: .75rem; font-weight: 600; }
  .stat--pending { background: #fef0d4; color: #9a5f00; }
  .stat--prep    { background: #dbeafe; color: #1a4f9c; }
  .stat--ready   { background: #d4f4e6; color: #0d6b3e; }
  .stat--done    { background: #ececec; color: #555; }

  /* ── Orders grid ── */
  .orders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: .85rem;
  }
  .order-card {
    background: #fffdf8; border: 1.5px solid #e8dccf; border-radius: 14px;
    padding: 1rem; display: flex; flex-direction: column; gap: .55rem;
    transition: box-shadow .2s;
  }
  .order-card:hover { box-shadow: 0 8px 20px rgba(40,24,8,.1); }

  .order-header {
    display: flex; justify-content: space-between; align-items: center;
  }
  .order-id   { font-weight: 800; font-size: .88rem; color: var(--text); }
  .order-time { font-size: .76rem; color: var(--muted); }

  .order-meta {
    display: flex; align-items: center; gap: .3rem;
    font-size: .85rem; color: #4a3520; flex-wrap: wrap;
  }
  .order-meta svg { width: 14px; height: 14px; fill: var(--muted); flex-shrink: 0; }

  .order-items {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: .25rem;
    border-top: 1px dashed #e8dccf; border-bottom: 1px dashed #e8dccf;
    padding: .45rem 0;
  }
  .order-items li {
    display: flex; align-items: center; gap: .4rem;
    font-size: .84rem;
  }
  .item-qty      { font-weight: 700; color: var(--primary); min-width: 22px; }
  .item-name     { flex: 1; color: var(--text); }
  .item-subtotal { font-weight: 600; color: var(--muted); font-size: .8rem; }

  .order-total   { font-size: .88rem; color: var(--muted); text-align: right; }
  .order-total strong { color: var(--text); font-size: 1rem; }

  .order-footer {
    display: flex; align-items: center; justify-content: space-between; gap: .5rem;
    flex-wrap: wrap; margin-top: .1rem;
  }
  .status-badge {
    font-size: .76rem; font-weight: 700; padding: .25rem .7rem; border-radius: 999px;
  }
  .btn-advance {
    border: none; border-radius: 8px; padding: .4rem .9rem;
    background: linear-gradient(90deg, var(--primary), var(--primary-2));
    color: #fff; cursor: pointer; font: inherit; font-size: .82rem; font-weight: 700;
    transition: opacity .2s;
  }
  .btn-advance:hover { opacity: .88; }

  /* ── Loading / empty ── */
  .loading-msg {
    display: flex; align-items: center; gap: .5rem;
    color: var(--muted); font-size: .9rem; padding: 1rem 0;
  }
  .empty-orders {
    text-align: center; padding: 2.5rem 1rem; color: var(--muted);
  }
  .empty-orders svg { width: 44px; height: 44px; fill: #d4b899; margin-bottom: .7rem; }
  .empty-orders p   { margin: 0; }

  /* ── Spinner ── */
  .spinner {
    display: inline-block; width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(0,0,0,.12); border-top-color: var(--primary);
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) {
    .stats-bar { grid-template-columns: repeat(2, 1fr); }
    .tab-bar   { flex-wrap: wrap; }
    .live-badge { margin-left: 0; }
  }
</style>
