<script>
  import { createEventDispatcher } from "svelte";
  import { formatPrice } from "../lib/utils";
  export let categories = [];
  export let filter = "Todas";
  export let query = "";
  export let filtered = [];
  export let cartEntries = [];
  export let total = 0;
  export let customerName = "";
  export let orderPlace = "";
  export let orderSummary = "";

  const dispatch = createEventDispatcher();
</script>

<div class="grid-2">
  <div class="panel">
    <div class="menu-tools">
      <input placeholder="Buscar platos..." value={query} on:input={(e) => dispatch("queryChange", e.currentTarget.value)} />
      <div class="filter-wrap">
        {#each categories as c}
          <button class="filter-btn {filter === c ? 'active' : ''}" on:click={() => dispatch("filterChange", c)}>{c}</button>
        {/each}
      </div>
    </div>
    <div class="menu-grid">
      {#if filtered.length === 0}<p class="small">Sin resultados</p>{/if}
      {#each filtered as d}
        <article class="card"><img src={d.image} alt={d.name} /><div class="card-body"><div class="row"><strong>{d.name}</strong><span class="small">{d.category}</span></div><p class="small">{d.description}</p><div class="row"><strong>{formatPrice(d.price)}</strong><button class="btn btn-main" on:click={() => dispatch("addToCart", d.id)}>Agregar</button></div></div></article>
      {/each}
    </div>
  </div>
  <div class="panel">
    <h3>Carrito</h3>
    <ul class="list">
      {#if cartEntries.length === 0}<li class="small">Aún sin productos.</li>{/if}
      {#each cartEntries as i}
        <li class="item"><div><strong>{i.name}</strong><div class="small">{formatPrice(i.price)} c/u</div></div><input type="number" min="1" value={i.quantity} on:input={(e) => dispatch("updateQty", { id: i.id, value: e.currentTarget.value })}><button class="btn btn-danger" on:click={() => dispatch("removeFromCart", i.id)}>Quitar</button></li>
      {/each}
    </ul>
    <div class="row"><strong>Total</strong><strong>{formatPrice(total)}</strong></div>
    <hr />
    <div class="menu-tools">
      <input placeholder="Nombre cliente" value={customerName} on:input={(e) => dispatch("customerChange", e.currentTarget.value)} />
      <input placeholder="Mesa o dirección" value={orderPlace} on:input={(e) => dispatch("placeChange", e.currentTarget.value)} />
      <button class="btn btn-ok" on:click={() => dispatch("confirmOrder")}>Confirmar pedido</button>
    </div>
    {#if orderSummary}<div class="panel"><strong>{orderSummary}</strong></div>{/if}
  </div>
</div>


