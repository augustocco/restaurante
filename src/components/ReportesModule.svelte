<script>
  import { formatPrice } from "../lib/utils";
  export let orders = [];
  export let totalSales = 0;
  export let avgTicket = 0;
  export let topDish;
</script>

<div class="kpis">
  <div class="kpi"><div class="small">Pedidos totales</div><strong>{orders.length}</strong></div>
  <div class="kpi"><div class="small">Ventas acumuladas</div><strong>{formatPrice(totalSales)}</strong></div>
  <div class="kpi"><div class="small">Ticket promedio</div><strong>{formatPrice(avgTicket)}</strong></div>
  <div class="kpi"><div class="small">Plato más vendido</div><strong>{topDish ? `${topDish[0]} (${topDish[1]})` : "N/A"}</strong></div>
</div>


