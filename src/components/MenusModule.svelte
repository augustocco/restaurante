<script>
  import { restaurantStore } from "../stores/restaurantStore";
  import { formatPrice } from "../lib/utils";

  // Session passed from App
  export let session = null;
  $: isAdmin = session?.role === "Administrador";

  // View state
  let viewTab      = "menu";   // "menu" | "gestionar"
  let searchQuery  = "";
  let filterCat    = "Todas";

  // Dish form
  let showForm   = false;
  let editingId  = null;
  let dishSaving = false;
  let dishError  = "";
  let form       = emptyForm();

  // Category form
  let newCatName = "";
  let catSaving  = false;
  let catError   = "";

  function emptyForm() {
    return { name: "", description: "", price: "", category: "", image: "", available: true };
  }

  function startAdd() {
    editingId = null;
    form      = emptyForm();
    dishError = "";
    showForm  = true;
    setTimeout(() => document.getElementById("dish-name-input")?.focus(), 50);
  }

  function startEdit(dish) {
    editingId = dish.id;
    form      = { name: dish.name, description: dish.description, price: String(dish.price), category: dish.category, image: dish.image ?? "", available: dish.available };
    dishError = "";
    showForm  = true;
  }

  function cancelForm() {
    showForm  = false;
    editingId = null;
    form      = emptyForm();
    dishError = "";
  }

  async function saveDish() {
    dishError = "";
    if (!form.name.trim())               { dishError = "El nombre es obligatorio.";    return; }
    if (!form.category)                  { dishError = "Selecciona una categoría.";    return; }
    if (!form.price || Number(form.price) <= 0) { dishError = "Ingresa un precio válido."; return; }

    dishSaving = true;
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim(),
      price:       Number(form.price),
      category:    form.category,
      image:       form.image.trim(),
      available:   form.available
    };

    const err = editingId
      ? await restaurantStore.updateDish(editingId, payload)
      : await restaurantStore.addDish(payload);

    dishSaving = false;
    if (err) { dishError = err; return; }
    cancelForm();
  }

  async function removeDish(id, name) {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    await restaurantStore.deleteDish(id);
  }

  async function addCategory() {
    catError = "";
    if (!newCatName.trim()) { catError = "Escribe un nombre."; return; }
    catSaving = true;
    const err = await restaurantStore.addCategory(newCatName.trim());
    catSaving = false;
    if (err) { catError = err; return; }
    newCatName = "";
  }

  async function removeCategory(id, name) {
    const count = $restaurantStore.dishes.filter(d => d.category === name).length;
    const msg   = count > 0
      ? `"${name}" tiene ${count} plato(s). ¿Eliminar la categoría de todas formas?`
      : `¿Eliminar la categoría "${name}"?`;
    if (!confirm(msg)) return;
    await restaurantStore.deleteCategory(id);
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  $: allCats  = $restaurantStore.dbCategories;                      // [{id,name}]
  $: catNames = ["Todas", ...allCats.map(c => c.name)];

  $: filteredDishes = $restaurantStore.dishes.filter(d => {
    const matchCat = filterCat === "Todas" || d.category === filterCat;
    const q        = searchQuery.toLowerCase();
    const matchQ   = !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  $: groupedMenu = allCats.map(cat => ({
    ...cat,
    dishes: filteredDishes.filter(d => d.category === cat.name)
  })).filter(g => g.dishes.length > 0);

  $: uncategorized = filteredDishes.filter(
    d => !allCats.some(c => c.name === d.category)
  );
</script>

<!-- ═══════════════════════════════════════════════════════════ -->
<div class="menu-module">

  <!-- Header bar -->
  <div class="module-header">
    <div class="header-left">
      <h2>Menú Digital</h2>
      <span class="dish-count">{$restaurantStore.dishes.length} platos</span>
    </div>
    <div class="header-right">
      {#if isAdmin}
        <div class="view-toggle">
          <button class="toggle {viewTab === 'menu' ? 'active' : ''}" on:click={() => viewTab = 'menu'}>
            Ver menú
          </button>
          <button class="toggle {viewTab === 'gestionar' ? 'active' : ''}" on:click={() => viewTab = 'gestionar'}>
            Administrar
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Global error -->
  {#if $restaurantStore.menuError}
    <div class="alert-error">
      <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      {$restaurantStore.menuError}
    </div>
  {/if}

  <!-- Loading skeleton -->
  {#if $restaurantStore.menuLoading}
    <div class="loading-bar">
      <span class="spinner"></span> Cargando menú…
    </div>
  {/if}

  <!-- ══ VISTA MENÚ ══════════════════════════════════════════ -->
  {#if viewTab === 'menu'}
    <!-- Search + filters -->
    <div class="search-bar">
      <div class="search-input-wrap">
        <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.47 6.47 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input class="search-input" placeholder="Buscar plato…" bind:value={searchQuery} />
      </div>
      <div class="filter-pills">
        {#each catNames as cat}
          <button class="pill {filterCat === cat ? 'active' : ''}" on:click={() => filterCat = cat}>
            {cat}
          </button>
        {/each}
      </div>
    </div>

    <!-- Dishes by category -->
    {#if groupedMenu.length === 0 && !$restaurantStore.menuLoading}
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
        <p>No hay platos{searchQuery ? ' que coincidan con la búsqueda' : ' en el menú aún'}.</p>
        {#if isAdmin && !searchQuery}
          <button class="btn-main-sm" on:click={() => { viewTab = 'gestionar'; }}>Agregar platos</button>
        {/if}
      </div>
    {:else}
      {#each groupedMenu as group}
        <div class="category-section">
          <div class="category-label">
            <span class="cat-line"></span>
            <span class="cat-name">{group.name}</span>
            <span class="cat-count">{group.dishes.length}</span>
            <span class="cat-line"></span>
          </div>
          <div class="dishes-grid">
            {#each group.dishes as dish (dish.id)}
              <div class="dish-card {!dish.available ? 'unavailable' : ''}">
                {#if dish.image}
                  <div class="dish-img-wrap">
                    <img src={dish.image} alt={dish.name} loading="lazy" />
                    {#if !dish.available}
                      <span class="sold-out">Agotado</span>
                    {/if}
                  </div>
                {:else}
                  <div class="dish-img-placeholder">
                    <svg viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
                  </div>
                {/if}
                <div class="dish-body">
                  <div class="dish-top">
                    <span class="dish-name">{dish.name}</span>
                    <span class="dish-price">{formatPrice(dish.price)}</span>
                  </div>
                  {#if dish.description}
                    <p class="dish-desc">{dish.description}</p>
                  {/if}
                  {#if isAdmin}
                    <div class="dish-actions">
                      <button class="action-btn edit" on:click={() => { viewTab = 'gestionar'; startEdit(dish); }}>
                        Editar
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}

      <!-- Dishes without a valid category -->
      {#if uncategorized.length > 0}
        <div class="category-section">
          <div class="category-label">
            <span class="cat-line"></span>
            <span class="cat-name">Sin categoría</span>
            <span class="cat-line"></span>
          </div>
          <div class="dishes-grid">
            {#each uncategorized as dish (dish.id)}
              <div class="dish-card">
                <div class="dish-body">
                  <div class="dish-top">
                    <span class="dish-name">{dish.name}</span>
                    <span class="dish-price">{formatPrice(dish.price)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}

  <!-- ══ GESTIONAR (Admin only) ══════════════════════════════ -->
  {:else if viewTab === 'gestionar' && isAdmin}
    <div class="admin-layout">

      <!-- ── Dish form ── -->
      {#if showForm}
        <div class="form-card">
          <h3>{editingId ? 'Editar plato' : 'Nuevo plato'}</h3>
          <div class="form-grid">
            <label class="field span-2">
              <span>Nombre *</span>
              <input id="dish-name-input" type="text" placeholder="Nombre del plato" bind:value={form.name} />
            </label>
            <label class="field">
              <span>Categoría *</span>
              <select bind:value={form.category}>
                <option value="" disabled>Selecciona…</option>
                {#each allCats as cat}
                  <option value={cat.name}>{cat.name}</option>
                {/each}
              </select>
            </label>
            <label class="field">
              <span>Precio *</span>
              <input type="number" min="0" step="0.01" placeholder="0.00" bind:value={form.price} />
            </label>
            <label class="field span-2">
              <span>Descripción</span>
              <textarea rows="2" placeholder="Descripción breve del plato…" bind:value={form.description}></textarea>
            </label>
            <label class="field span-2">
              <span>URL de imagen</span>
              <input type="url" placeholder="https://…" bind:value={form.image} />
            </label>
            <label class="field available-toggle">
              <input type="checkbox" bind:checked={form.available} />
              <span>Disponible</span>
            </label>
          </div>
          {#if dishError}
            <p class="form-error">{dishError}</p>
          {/if}
          <div class="form-actions">
            <button class="btn-cancel" on:click={cancelForm} disabled={dishSaving}>Cancelar</button>
            <button class="btn-save" on:click={saveDish} disabled={dishSaving}>
              {#if dishSaving}<span class="spinner-sm"></span>{/if}
              {editingId ? 'Guardar cambios' : 'Agregar plato'}
            </button>
          </div>
        </div>
      {:else}
        <button class="btn-add-dish" on:click={startAdd}>
          <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Nuevo plato
        </button>
      {/if}

      <!-- ── Categories ── -->
      <div class="section-box">
        <h3>Categorías <span class="count-chip">{allCats.length}</span></h3>
        <div class="cat-manager">
          <div class="cat-list">
            {#each allCats as cat (cat.id)}
              <div class="cat-item">
                <span class="cat-item-name">{cat.name}</span>
                <span class="cat-item-count">{$restaurantStore.dishes.filter(d => d.category === cat.name).length} platos</span>
                <button class="icon-btn danger" title="Eliminar categoría" on:click={() => removeCategory(cat.id, cat.name)}>
                  <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            {/each}
            {#if allCats.length === 0}
              <p class="muted-text">Sin categorías aún.</p>
            {/if}
          </div>
          <div class="cat-add-row">
            <input placeholder="Nueva categoría…" bind:value={newCatName}
              on:keydown={(e) => e.key === 'Enter' && addCategory()} />
            <button class="btn-cat-add" on:click={addCategory} disabled={catSaving}>
              {#if catSaving}<span class="spinner-sm"></span>{:else}+ Agregar{/if}
            </button>
          </div>
          {#if catError}<p class="form-error">{catError}</p>{/if}
        </div>
      </div>

      <!-- ── Dishes table ── -->
      <div class="section-box">
        <h3>Platos <span class="count-chip">{$restaurantStore.dishes.length}</span></h3>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each $restaurantStore.dishes as dish (dish.id)}
                <tr>
                  <td>
                    <div class="dish-row-name">
                      {#if dish.image}
                        <img class="thumb" src={dish.image} alt={dish.name} loading="lazy" />
                      {/if}
                      <span>{dish.name}</span>
                    </div>
                  </td>
                  <td><span class="cat-pill">{dish.category}</span></td>
                  <td class="price-cell">{formatPrice(dish.price)}</td>
                  <td>
                    <span class="avail-badge {dish.available ? 'ok' : 'off'}">
                      {dish.available ? 'Disponible' : 'Agotado'}
                    </span>
                  </td>
                  <td class="action-cell">
                    <button class="icon-btn" title="Editar" on:click={() => startEdit(dish)}>
                      <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button class="icon-btn danger" title="Eliminar" on:click={() => removeDish(dish.id, dish.name)}>
                      <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </td>
                </tr>
              {/each}
              {#if $restaurantStore.dishes.length === 0 && !$restaurantStore.menuLoading}
                <tr><td colspan="5" class="empty-row">No hay platos. Agrega el primero.</td></tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .menu-module { padding: .2rem 0; }

  /* ── Header ── */
  .module-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: .6rem;
  }
  .header-left { display: flex; align-items: center; gap: .7rem; }
  .header-left h2 { margin: 0; font-size: 1.2rem; }
  .dish-count {
    font-size: .78rem; font-weight: 600; color: var(--muted);
    background: #f0ebe1; border-radius: 999px; padding: .2rem .65rem;
  }
  .view-toggle {
    display: flex; gap: .3rem;
    background: #f0ebe1; border-radius: 10px; padding: .28rem;
  }
  .toggle {
    border: none; border-radius: 8px; padding: .45rem .9rem;
    cursor: pointer; font: inherit; font-size: .88rem; font-weight: 600;
    color: var(--muted); background: transparent;
    transition: background .2s, color .2s, box-shadow .2s;
  }
  .toggle.active { background: #fff; color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,.1); }

  /* ── Alerts ── */
  .alert-error {
    display: flex; align-items: center; gap: .5rem;
    background: #ffe8e4; border: 1px solid #f5c0b4; border-radius: 9px;
    color: var(--danger); padding: .65rem .85rem; margin-bottom: .8rem; font-size: .88rem;
  }
  .alert-error svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }
  .loading-bar {
    display: flex; align-items: center; gap: .5rem;
    color: var(--muted); font-size: .88rem; margin-bottom: .8rem;
  }

  /* ── Search bar ── */
  .search-bar { display: flex; flex-direction: column; gap: .6rem; margin-bottom: 1.1rem; }
  .search-input-wrap { position: relative; }
  .search-icon {
    position: absolute; left: .75rem; top: 50%; transform: translateY(-50%);
    width: 17px; height: 17px; fill: var(--muted); pointer-events: none;
  }
  .search-input {
    width: 100%; padding: .65rem .85rem .65rem 2.4rem;
    border: 1.5px solid #e0d4c0; border-radius: 10px;
    font: inherit; font-size: .95rem; background: #fffdf8;
    transition: border-color .2s, box-shadow .2s;
  }
  .search-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(215,78,9,.12); }
  .filter-pills { display: flex; flex-wrap: wrap; gap: .4rem; }
  .pill {
    border: 1.5px solid #e5d7bf; border-radius: 999px; background: #fff;
    padding: .32rem .8rem; cursor: pointer; font: inherit; font-size: .83rem;
    font-weight: 600; color: #5b3f25; transition: background .18s, border-color .18s, color .18s;
  }
  .pill:hover  { background: #fff6e6; }
  .pill.active { background: linear-gradient(90deg, var(--primary), var(--primary-2)); color: #fff; border-color: transparent; }

  /* ── Category sections ── */
  .category-section { margin-bottom: 1.6rem; }
  .category-label {
    display: flex; align-items: center; gap: .7rem; margin-bottom: .8rem;
  }
  .cat-line { flex: 1; height: 1px; background: #e8dccf; }
  .cat-name { font-weight: 700; font-size: 1rem; color: #4a3520; white-space: nowrap; }
  .cat-count {
    font-size: .75rem; font-weight: 700; background: #f5ede0;
    color: #7a5230; border-radius: 999px; padding: .15rem .55rem;
  }

  /* ── Dish cards ── */
  .dishes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: .85rem;
  }
  .dish-card {
    background: var(--surface-2); border: 1px solid #f1e7d9;
    border-radius: 14px; overflow: hidden;
    transition: box-shadow .2s, transform .2s;
  }
  .dish-card:hover { box-shadow: 0 10px 22px rgba(40,24,8,.12); transform: translateY(-2px); }
  .dish-card.unavailable { opacity: .6; }

  .dish-img-wrap { position: relative; }
  .dish-img-wrap img { width: 100%; height: 145px; object-fit: cover; display: block; }
  .sold-out {
    position: absolute; top: .5rem; right: .5rem;
    background: rgba(0,0,0,.65); color: #fff;
    font-size: .72rem; font-weight: 700; padding: .2rem .55rem; border-radius: 6px;
  }
  .dish-img-placeholder {
    width: 100%; height: 100px; background: #f5ede0;
    display: grid; place-items: center;
  }
  .dish-img-placeholder svg { width: 40px; height: 40px; fill: #d4b899; }

  .dish-body { padding: .72rem .78rem; }
  .dish-top  { display: flex; justify-content: space-between; align-items: flex-start; gap: .4rem; margin-bottom: .3rem; }
  .dish-name { font-weight: 700; font-size: .95rem; color: var(--text); line-height: 1.3; }
  .dish-price { font-weight: 800; font-size: 1rem; color: var(--primary); white-space: nowrap; }
  .dish-desc  { margin: 0; font-size: .82rem; color: var(--muted); line-height: 1.45; }
  .dish-actions { margin-top: .55rem; display: flex; gap: .4rem; }
  .action-btn {
    border: 1px solid #e0d4c0; border-radius: 7px; background: #fff;
    padding: .3rem .7rem; cursor: pointer; font: inherit; font-size: .8rem;
    font-weight: 600; color: #5b3f25; transition: background .18s;
  }
  .action-btn:hover { background: #fff6e6; }

  /* ── Empty state ── */
  .empty-state {
    text-align: center; padding: 3rem 1rem; color: var(--muted);
  }
  .empty-state svg { width: 48px; height: 48px; fill: #d4b899; margin-bottom: .8rem; }
  .empty-state p   { margin: 0 0 1rem; }
  .btn-main-sm {
    border: none; border-radius: 9px; padding: .55rem 1.2rem;
    background: linear-gradient(90deg, var(--primary), var(--primary-2));
    color: #fff; cursor: pointer; font: inherit; font-weight: 600;
  }

  /* ── Admin layout ── */
  .admin-layout { display: flex; flex-direction: column; gap: 1.1rem; }

  .btn-add-dish {
    display: inline-flex; align-items: center; gap: .45rem;
    border: none; border-radius: 10px; padding: .65rem 1.2rem;
    background: linear-gradient(90deg, var(--primary), var(--primary-2));
    color: #fff; cursor: pointer; font: inherit; font-size: .95rem; font-weight: 700;
    box-shadow: 0 6px 16px rgba(215,78,9,.3); align-self: flex-start;
    transition: opacity .2s, transform .15s;
  }
  .btn-add-dish:hover { opacity: .9; transform: translateY(-1px); }
  .btn-add-dish svg  { width: 18px; height: 18px; fill: currentColor; }

  /* ── Dish form ── */
  .form-card {
    background: #fffdf8; border: 1.5px solid #e8dccf;
    border-radius: 14px; padding: 1.2rem;
  }
  .form-card h3 { margin: 0 0 1rem; font-size: 1rem; }
  .form-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: .75rem;
  }
  .field { display: flex; flex-direction: column; gap: .3rem; }
  .field span { font-size: .84rem; font-weight: 600; color: #4a3520; }
  .field input, .field select, .field textarea {
    border: 1.5px solid #e0d4c0; border-radius: 9px;
    padding: .6rem .8rem; font: inherit; font-size: .93rem; background: #fff;
    transition: border-color .2s;
  }
  .field input:focus, .field select:focus, .field textarea:focus {
    outline: none; border-color: var(--primary);
  }
  .field textarea { resize: vertical; min-height: 62px; }
  .span-2 { grid-column: span 2; }
  .available-toggle { flex-direction: row; align-items: center; gap: .5rem; }
  .available-toggle input { width: auto; }

  .form-error { margin: 0 0 .5rem; color: var(--danger); font-size: .87rem; font-weight: 500; }
  .form-actions { display: flex; gap: .6rem; justify-content: flex-end; }
  .btn-cancel {
    border: 1.5px solid #e0d4c0; border-radius: 9px; background: #fff;
    padding: .55rem 1.1rem; cursor: pointer; font: inherit; font-weight: 600; color: var(--muted);
  }
  .btn-save {
    display: inline-flex; align-items: center; gap: .4rem;
    border: none; border-radius: 9px; padding: .55rem 1.3rem;
    background: linear-gradient(90deg, var(--primary), var(--primary-2));
    color: #fff; cursor: pointer; font: inherit; font-weight: 700;
  }
  .btn-save:disabled, .btn-cancel:disabled { opacity: .6; cursor: not-allowed; }

  /* ── Section boxes ── */
  .section-box {
    background: #fffdf8; border: 1.5px solid #e8dccf; border-radius: 14px; padding: 1rem 1.1rem;
  }
  .section-box h3 { margin: 0 0 .85rem; font-size: 1rem; display: flex; align-items: center; gap: .5rem; }
  .count-chip {
    font-size: .75rem; font-weight: 700; background: #f5ede0;
    color: #7a5230; border-radius: 999px; padding: .15rem .55rem;
  }

  /* ── Categories manager ── */
  .cat-manager { display: flex; flex-direction: column; gap: .65rem; }
  .cat-list    { display: flex; flex-wrap: wrap; gap: .5rem; }
  .cat-item {
    display: inline-flex; align-items: center; gap: .5rem;
    background: #f5ede0; border: 1px solid #e8d9c4; border-radius: 9px;
    padding: .38rem .75rem;
  }
  .cat-item-name  { font-weight: 700; font-size: .88rem; color: #4a3520; }
  .cat-item-count { font-size: .75rem; color: var(--muted); }
  .cat-add-row { display: flex; gap: .5rem; }
  .cat-add-row input {
    flex: 1; border: 1.5px solid #e0d4c0; border-radius: 9px;
    padding: .55rem .8rem; font: inherit; font-size: .92rem;
  }
  .btn-cat-add {
    border: none; border-radius: 9px; padding: .55rem 1rem;
    background: var(--ok); color: #fff; cursor: pointer;
    font: inherit; font-weight: 700; white-space: nowrap;
    display: inline-flex; align-items: center; gap: .35rem;
  }
  .btn-cat-add:disabled { opacity: .6; cursor: not-allowed; }
  .muted-text { color: var(--muted); font-size: .88rem; font-style: italic; margin: 0; }

  /* ── Dishes table ── */
  .table-wrap { overflow-x: auto; }
  .dish-row-name { display: flex; align-items: center; gap: .55rem; }
  .thumb { width: 38px; height: 38px; border-radius: 7px; object-fit: cover; flex-shrink: 0; }
  .cat-pill {
    font-size: .76rem; font-weight: 600; background: #f5ede0;
    color: #7a5230; border-radius: 999px; padding: .18rem .6rem; white-space: nowrap;
  }
  .price-cell { font-weight: 700; color: var(--primary); }
  .avail-badge {
    font-size: .76rem; font-weight: 700; padding: .2rem .6rem; border-radius: 999px;
  }
  .avail-badge.ok  { background: #d4f4e6; color: #0d6b3e; }
  .avail-badge.off { background: #ffe4d4; color: #c0380a; }
  .action-cell { display: flex; gap: .3rem; justify-content: flex-end; }
  .icon-btn {
    border: 1px solid #e0d4c0; border-radius: 7px; background: #fff;
    width: 32px; height: 32px; display: grid; place-items: center;
    cursor: pointer; transition: background .18s;
  }
  .icon-btn:hover        { background: #fff6e6; }
  .icon-btn.danger:hover { background: #ffe8e4; }
  .icon-btn svg { width: 16px; height: 16px; fill: var(--muted); }
  .icon-btn.danger svg { fill: var(--danger); }
  .empty-row { text-align: center; color: var(--muted); padding: 1.4rem; font-style: italic; }

  /* ── Spinner ── */
  .spinner, .spinner-sm {
    display: inline-block; border-radius: 50%;
    border: 2.5px solid rgba(0,0,0,.12); border-top-color: var(--primary);
    animation: spin .7s linear infinite;
  }
  .spinner    { width: 18px; height: 18px; }
  .spinner-sm { width: 14px; height: 14px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 600px) {
    .form-grid { grid-template-columns: 1fr; }
    .span-2    { grid-column: span 1; }
  }
</style>
