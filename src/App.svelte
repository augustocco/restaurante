<script>
  import { onMount, onDestroy } from "svelte";
  import AuthModule      from "./components/AuthModule.svelte";
  import PedidosModule    from "./components/PedidosModule.svelte";
  import ReservasModule   from "./components/ReservasModule.svelte";
  import MenusModule      from "./components/MenusModule.svelte";
  import UsuariosModule   from "./components/UsuariosModule.svelte";
  import ReportesModule   from "./components/ReportesModule.svelte";
  import FacturacionModule from "./components/FacturacionModule.svelte";
  import { restaurantStore, restaurantView } from "./stores/restaurantStore";

  const ROLE_STYLE = {
    Administrador: { bg: "#ffe4d4", color: "#c0380a" },
    Mesero:        { bg: "#fef0d4", color: "#9a5f00" },
    Cliente:       { bg: "#d4f4e6", color: "#0d6b3e" }
  };

  const icons = {
    pedidos:     `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v2H4V5zm1 4h14l-1.2 9H6.2L5 9zm4.5-6h5v2h-5V3z"/></svg>`,
    reservas:    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm11 8H6v10h12V10zM6 8h12V6H6v2z"/></svg>`,
    menus:       `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2zm2 4v2h8V7H7zm0 4v2h8v-2H7z"/></svg>`,
    usuarios:    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-3.999-4A4 4 0 0 0 16 11zm-8 0A3 3 0 1 0 5 8a3 3 0 0 0 3 3zm8 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zM8 13c-.29 0-.62.02-.97.05C5.36 13.24 2 14.06 2 16.5V20h6v-3c0-1.53.8-2.85 2.22-3.9A9.7 9.7 0 0 0 8 13z"/></svg>`,
    reportes:    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V6h2v14H4zm7 0V4h2v16h-2zm7 0v-9h2v9h-2z"/></svg>`,
    facturacion: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2zm3 5v2h6V7H9zm0 4v2h6v-2H9z"/></svg>`
  };

  onMount(() => {
    restaurantStore.loadUsers();
    restaurantStore.loadMenu();
    restaurantStore.loadOrders();
    restaurantStore.loadReservations();
    restaurantStore.loadCierres();
    restaurantStore.subscribeToOrders();
    restaurantStore.subscribeToReservations();
  });

  onDestroy(() => {
    restaurantStore.unsubscribeFromOrders();
    restaurantStore.unsubscribeFromReservations();
  });

  $: session     = $restaurantStore.session;
  $: visibleTabs = session
    ? $restaurantStore.tabs.filter(([, , roles]) => roles.includes(session.role))
    : [];
  $: roleStyle   = session ? (ROLE_STYLE[session.role] ?? { bg: "#eee", color: "#333" }) : {};
</script>

{#if !session}
  <AuthModule />
{:else}
  <header class="hero">
    <div class="hero__overlay"></div>
    <div class="container hero__content">
      <div class="hero-top">
        <div>
          <h1>Sabor &amp; Mesa</h1>
          <p>Pedidos, reservas, menús, usuarios, reportes y facturación.</p>
        </div>
        <div class="user-bar">
          <div class="user-info">
            <span class="user-avatar">{session.name.charAt(0).toUpperCase()}</span>
            <div class="user-details">
              <span class="user-name">{session.name}</span>
              <span
                class="user-role"
                style="background:{roleStyle.bg}; color:{roleStyle.color}"
              >{session.role}</span>
            </div>
          </div>
          <button class="btn-logout" on:click={() => restaurantStore.logout()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
            Salir
          </button>
        </div>
      </div>
    </div>
  </header>

  <main class="container main-wrap">
    <nav class="tabs">
      {#each visibleTabs as [id, label]}
        <button
          class="tab-btn {$restaurantStore.activeTab === id ? 'active' : ''}"
          on:click={() => restaurantStore.setActiveTab(id)}
        >
          <span class="tab-icon" aria-hidden="true">{@html icons[id]}</span>
          <span>{label}</span>
        </button>
      {/each}
    </nav>

    <section class="tab-content active">
      {#if $restaurantStore.activeTab === "pedidos"}
        <PedidosModule session={$restaurantStore.session} />
      {/if}

      {#if $restaurantStore.activeTab === "reservas"}
        <ReservasModule session={$restaurantStore.session} />
      {/if}

      {#if $restaurantStore.activeTab === "menus"}
        <MenusModule session={$restaurantStore.session} />
      {/if}

      {#if $restaurantStore.activeTab === "usuarios"}
        <UsuariosModule
          users={$restaurantStore.users}
          usersLoading={$restaurantStore.usersLoading}
          usersError={$restaurantStore.usersError}
          userName={$restaurantStore.userName}
          userRole={$restaurantStore.userRole}
          userEmail={$restaurantStore.userEmail}
          userPassword={$restaurantStore.userPassword}
          on:nameChange={(e) => restaurantStore.setUserName(e.detail)}
          on:roleChange={(e) => restaurantStore.setUserRole(e.detail)}
          on:emailChange={(e) => restaurantStore.setUserEmail(e.detail)}
          on:passwordChange={(e) => restaurantStore.setUserPassword(e.detail)}
          on:addUser={() => restaurantStore.addUser()}
          on:removeUser={(e) => restaurantStore.removeUser(e.detail)}
        />
      {/if}

      {#if $restaurantStore.activeTab === "reportes"}
        <ReportesModule session={$restaurantStore.session} />
      {/if}

      {#if $restaurantStore.activeTab === "facturacion"}
        <FacturacionModule invoices={$restaurantStore.invoices} />
      {/if}
    </section>
  </main>
{/if}

<style>
  .hero-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
  }

  .user-bar {
    display: flex;
    align-items: center;
    gap: .8rem;
    flex-shrink: 0;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: .6rem;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,.22);
    border: 2px solid rgba(255,255,255,.5);
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: 1.05rem;
    color: #fff;
    flex-shrink: 0;
  }

  .user-details {
    display: flex;
    flex-direction: column;
    gap: .2rem;
    align-items: flex-start;
  }

  .user-name {
    color: #fff;
    font-weight: 600;
    font-size: .92rem;
    line-height: 1;
  }

  .user-role {
    font-size: .72rem;
    font-weight: 700;
    padding: .15rem .5rem;
    border-radius: 999px;
    line-height: 1.4;
  }

  .btn-logout {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    border: 1.5px solid rgba(255,255,255,.55);
    border-radius: 9px;
    background: rgba(255,255,255,.12);
    color: #fff;
    padding: .45rem .85rem;
    cursor: pointer;
    font: inherit;
    font-size: .85rem;
    font-weight: 600;
    transition: background .2s;
    backdrop-filter: blur(4px);
  }
  .btn-logout:hover { background: rgba(255,255,255,.22); }
  .btn-logout svg   { width: 16px; height: 16px; fill: currentColor; }

  @media (max-width: 640px) {
    .hero-top    { flex-direction: column; align-items: center; text-align: center; }
    .user-bar    { flex-wrap: wrap; justify-content: center; }
  }
</style>
