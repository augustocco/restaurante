<script>
  import { createEventDispatcher } from "svelte";
  export let reservations = [];
  export let resName = "";
  export let resPeople = 2;
  export let resDate = "";
  const dispatch = createEventDispatcher();
</script>

<div class="panel">
  <h3>Nueva reserva</h3>
  <div class="menu-tools">
    <input placeholder="Nombre" value={resName} on:input={(e) => dispatch("nameChange", e.currentTarget.value)} />
    <input type="number" min="1" value={resPeople} on:input={(e) => dispatch("peopleChange", Number(e.currentTarget.value))} />
    <input type="datetime-local" value={resDate} on:input={(e) => dispatch("dateChange", e.currentTarget.value)} />
    <button class="btn btn-ok" on:click={() => dispatch("addReservation")}>Guardar reserva</button>
  </div>
  <table class="table"><thead><tr><th>Cliente</th><th>Personas</th><th>Fecha</th><th></th></tr></thead><tbody>
    {#if reservations.length === 0}<tr><td colspan="4">Sin reservas.</td></tr>{/if}
    {#each reservations as r, idx}<tr><td>{r.name}</td><td>{r.people}</td><td>{new Date(r.date).toLocaleString()}</td><td><button class="btn btn-danger" on:click={() => dispatch("removeReservation", idx)}>Eliminar</button></td></tr>{/each}
  </tbody></table>
</div>
