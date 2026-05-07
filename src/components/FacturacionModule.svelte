<script>
  import { formatPrice } from "../lib/utils";
  export let invoices = [];
</script>

<div class="panel">
  <h3>Facturas</h3>
  <table class="table"><thead><tr><th>Factura</th><th>Pedido</th><th>Cliente</th><th>Total</th><th>Fecha</th></tr></thead><tbody>
    {#if invoices.length === 0}<tr><td colspan="5">Sin facturas generadas.</td></tr>{/if}
    {#each [...invoices].reverse() as f}<tr><td>{f.invoiceId}</td><td>{f.orderId}</td><td>{f.customer}</td><td>{formatPrice(f.total)}</td><td>{new Date(f.date).toLocaleString()}</td></tr>{/each}
  </tbody></table>
</div>


