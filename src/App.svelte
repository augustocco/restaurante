<script>
  import PedidosModule from "./components/PedidosModule.svelte";
  import ReservasModule from "./components/ReservasModule.svelte";
  import MenusModule from "./components/MenusModule.svelte";
  import UsuariosModule from "./components/UsuariosModule.svelte";
  import ReportesModule from "./components/ReportesModule.svelte";
  import FacturacionModule from "./components/FacturacionModule.svelte";
  import { restaurantStore, restaurantView } from "./stores/restaurantStore";

  const icons = {
    pedidos: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v2H4V5zm1 4h14l-1.2 9H6.2L5 9zm4.5-6h5v2h-5V3z"/></svg>`,
    reservas: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm11 8H6v10h12V10zM6 8h12V6H6v2z"/></svg>`,
    menus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2zm2 4v2h8V7H7zm0 4v2h8v-2H7z"/></svg>`,
    usuarios: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-3.999-4A4 4 0 0 0 16 11zm-8 0A3 3 0 1 0 5 8a3 3 0 0 0 3 3zm8 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zM8 13c-.29 0-.62.02-.97.05C5.36 13.24 2 14.06 2 16.5V20h6v-3c0-1.53.8-2.85 2.22-3.9A9.7 9.7 0 0 0 8 13z"/></svg>`,
    reportes: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V6h2v14H4zm7 0V4h2v16h-2zm7 0v-9h2v9h-2z"/></svg>`,
    facturacion: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2zm3 5v2h6V7H9zm0 4v2h6v-2H9z"/></svg>`
  };
</script>

<header class="hero">
  <div class="hero__overlay"></div>
  <div class="container hero__content">
    <h1>Sabor & Mesa</h1>
    <p>Pedidos, reservas, menús, usuarios, reportes y facturación.</p>
  </div>
</header>

<main class="container main-wrap">
  <nav class="tabs">
    {#each $restaurantStore.tabs as [id, label]}
      <button class="tab-btn {$restaurantStore.activeTab === id ? 'active' : ''}" on:click={() => restaurantStore.setActiveTab(id)}>
        <span class="tab-icon" aria-hidden="true">
          {@html icons[id]}
        </span>
        <span>{label}</span>
      </button>
    {/each}
  </nav>

  <section class="tab-content active">
    {#if $restaurantStore.activeTab === "pedidos"}
      <PedidosModule
        categories={$restaurantView.categories}
        filter={$restaurantStore.filter}
        query={$restaurantStore.query}
        filtered={$restaurantView.filtered}
        cartEntries={$restaurantView.cartEntries}
        total={$restaurantView.total}
        customerName={$restaurantStore.customerName}
        orderPlace={$restaurantStore.orderPlace}
        orderSummary={$restaurantStore.orderSummary}
        on:filterChange={(e) => restaurantStore.setFilter(e.detail)}
        on:queryChange={(e) => restaurantStore.setQuery(e.detail)}
        on:addToCart={(e) => restaurantStore.addToCart(e.detail)}
        on:updateQty={(e) => restaurantStore.updateQty(e.detail)}
        on:removeFromCart={(e) => restaurantStore.removeFromCart(e.detail)}
        on:customerChange={(e) => restaurantStore.setCustomerName(e.detail)}
        on:placeChange={(e) => restaurantStore.setOrderPlace(e.detail)}
        on:confirmOrder={() => restaurantStore.confirmOrder()}
      />
    {/if}

    {#if $restaurantStore.activeTab === "reservas"}
      <ReservasModule
        reservations={$restaurantStore.reservations}
        resName={$restaurantStore.resName}
        resPeople={$restaurantStore.resPeople}
        resDate={$restaurantStore.resDate}
        on:nameChange={(e) => restaurantStore.setResName(e.detail)}
        on:peopleChange={(e) => restaurantStore.setResPeople(e.detail)}
        on:dateChange={(e) => restaurantStore.setResDate(e.detail)}
        on:addReservation={() => restaurantStore.addReservation()}
        on:removeReservation={(e) => restaurantStore.removeReservation(e.detail)}
      />
    {/if}

    {#if $restaurantStore.activeTab === "menus"}
      <MenusModule categories={$restaurantView.categories} dishes={$restaurantStore.dishes} />
    {/if}

    {#if $restaurantStore.activeTab === "usuarios"}
      <UsuariosModule
        users={$restaurantStore.users}
        userName={$restaurantStore.userName}
        userRole={$restaurantStore.userRole}
        userEmail={$restaurantStore.userEmail}
        on:nameChange={(e) => restaurantStore.setUserName(e.detail)}
        on:roleChange={(e) => restaurantStore.setUserRole(e.detail)}
        on:emailChange={(e) => restaurantStore.setUserEmail(e.detail)}
        on:addUser={() => restaurantStore.addUser()}
        on:removeUser={(e) => restaurantStore.removeUser(e.detail)}
      />
    {/if}

    {#if $restaurantStore.activeTab === "reportes"}
      <ReportesModule
        orders={$restaurantStore.orders}
        totalSales={$restaurantView.totalSales}
        avgTicket={$restaurantView.avgTicket}
        topDish={$restaurantView.topDish}
      />
    {/if}

    {#if $restaurantStore.activeTab === "facturacion"}
      <FacturacionModule invoices={$restaurantStore.invoices} />
    {/if}
  </section>
</main>
