<script>
  import { formatPrice } from "../lib/utils";
  export let categories = [];
  export let dishes = [];
</script>

<div class="panel">
  <h3>Gestión de menús</h3>
  {#each categories.filter((c) => c !== "Todas") as cat}
    <h4>{cat}</h4>
    <ul>{#each dishes.filter((d) => d.category === cat) as d}<li>{d.name} - {formatPrice(d.price)}</li>{/each}</ul>
  {/each}
</div>


