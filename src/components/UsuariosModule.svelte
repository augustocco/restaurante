<script>
  import { createEventDispatcher } from "svelte";
  export let users = [];
  export let userName = "";
  export let userRole = "";
  export let userEmail = "";
  const dispatch = createEventDispatcher();
</script>

<div class="panel">
  <h3>Usuarios</h3>
  <div class="menu-tools">
    <input placeholder="Nombre" value={userName} on:input={(e) => dispatch("nameChange", e.currentTarget.value)} />
    <input placeholder="Rol" value={userRole} on:input={(e) => dispatch("roleChange", e.currentTarget.value)} />
    <input type="email" placeholder="Correo" value={userEmail} on:input={(e) => dispatch("emailChange", e.currentTarget.value)} />
    <button class="btn btn-ok" on:click={() => dispatch("addUser")}>Agregar usuario</button>
  </div>
  <table class="table"><thead><tr><th>Nombre</th><th>Rol</th><th>Email</th><th></th></tr></thead><tbody>
    {#each users as u, idx}<tr><td>{u.name}</td><td>{u.role}</td><td>{u.email}</td><td><button class="btn btn-danger" on:click={() => dispatch("removeUser", idx)}>Eliminar</button></td></tr>{/each}
  </tbody></table>
</div>
