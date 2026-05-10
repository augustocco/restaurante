<script>
  import { createEventDispatcher } from "svelte";
  export let users        = [];
  export let usersLoading = false;
  export let usersError   = null;
  export let userName     = "";
  export let userRole     = "Cliente";
  export let userEmail    = "";
  export let userPassword = "";
  const dispatch = createEventDispatcher();

  const ROLES = ["Cliente", "Mesero", "Administrador"];

  const ROLE_STYLE = {
    Administrador: { bg: "#ffe4d4", color: "#c0380a" },
    Mesero:        { bg: "#fef0d4", color: "#9a5f00" },
    Cliente:       { bg: "#d4f4e6", color: "#0d6b3e" }
  };
</script>

<div class="panel">
  <div class="section-header">
    <h3>Gestión de Usuarios</h3>
    {#if usersLoading}
      <span class="loading-badge">
        <span class="spinner-sm"></span> Sincronizando…
      </span>
    {:else}
      <span class="count-badge">{users.length} usuario{users.length !== 1 ? "s" : ""}</span>
    {/if}
  </div>

  {#if usersError}
    <div class="error-bar">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      {usersError}
    </div>
  {/if}

  <div class="menu-tools">
    <div class="form-row">
      <input
        placeholder="Nombre completo"
        value={userName}
        disabled={usersLoading}
        on:input={(e) => dispatch("nameChange", e.currentTarget.value)}
      />
      <select
        value={userRole}
        disabled={usersLoading}
        on:change={(e) => dispatch("roleChange", e.currentTarget.value)}
      >
        {#each ROLES as r}
          <option value={r}>{r}</option>
        {/each}
      </select>
    </div>
    <div class="form-row">
      <input
        type="email"
        placeholder="Correo electrónico"
        value={userEmail}
        disabled={usersLoading}
        on:input={(e) => dispatch("emailChange", e.currentTarget.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={userPassword}
        disabled={usersLoading}
        on:input={(e) => dispatch("passwordChange", e.currentTarget.value)}
      />
    </div>
    <button class="btn btn-ok" disabled={usersLoading} on:click={() => dispatch("addUser")}>
      {#if usersLoading}
        <span class="spinner-sm"></span> Guardando…
      {:else}
        + Agregar usuario
      {/if}
    </button>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Rol</th>
        <th>Correo</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#if usersLoading && users.length === 0}
        <tr>
          <td colspan="4" class="loading-row">
            <span class="spinner-sm"></span> Cargando usuarios desde Supabase…
          </td>
        </tr>
      {:else}
        {#each users as u, idx}
          <tr>
            <td>{u.name}</td>
            <td>
              <span
                class="role-badge"
                style="background:{ROLE_STYLE[u.role]?.bg ?? '#eee'}; color:{ROLE_STYLE[u.role]?.color ?? '#333'}"
              >{u.role}</span>
            </td>
            <td class="email-cell">{u.email}</td>
            <td>
              <button
                class="btn btn-danger"
                disabled={usersLoading}
                on:click={() => dispatch("removeUser", idx)}
              >Eliminar</button>
            </td>
          </tr>
        {/each}
        {#if users.length === 0}
          <tr><td colspan="4" class="empty">No hay usuarios registrados.</td></tr>
        {/if}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: .6rem;
  }
  .section-header h3 { margin: 0; }

  .count-badge {
    font-size: .8rem;
    font-weight: 600;
    color: var(--muted);
    background: #f0ebe1;
    border-radius: 999px;
    padding: .2rem .7rem;
  }
  .loading-badge {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    font-size: .8rem;
    font-weight: 600;
    color: #9a5f00;
    background: #fef0d4;
    border-radius: 999px;
    padding: .2rem .7rem;
  }

  .error-bar {
    display: flex;
    align-items: center;
    gap: .5rem;
    background: #ffe8e4;
    border: 1px solid #f5c0b4;
    border-radius: 9px;
    color: var(--danger);
    font-size: .88rem;
    font-weight: 500;
    padding: .6rem .8rem;
    margin-bottom: .8rem;
  }
  .error-bar svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .6rem;
  }
  .role-badge {
    font-size: .78rem;
    font-weight: 700;
    padding: .22rem .6rem;
    border-radius: 999px;
    white-space: nowrap;
  }
  .email-cell  { font-size: .88rem; color: var(--muted); }
  .empty       { text-align: center; color: var(--muted); padding: 1.2rem; font-style: italic; }
  .loading-row { text-align: center; color: var(--muted); padding: 1.4rem; display: flex; align-items: center; justify-content: center; gap: .5rem; }

  .spinner-sm {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0,0,0,.15);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  button:disabled { opacity: .6; cursor: not-allowed; }
  @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
</style>
