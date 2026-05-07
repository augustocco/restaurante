import { writable, derived } from "svelte/store";
import { dishes } from "../data/dishes";
import { tabs } from "../data/tabs";
import { getLocalStorageJSON, setLocalStorageJSON } from "../lib/utils";

const initial = {
  dishes,
  tabs,
  activeTab: "pedidos",
  filter: "Todas",
  query: "",
  cart: getLocalStorageJSON("restaurant_cart", {}),
  orders: getLocalStorageJSON("restaurant_orders", []),
  reservations: getLocalStorageJSON("restaurant_reservations", []),
  users: getLocalStorageJSON("restaurant_users", [{ name: "Admin", role: "Administrador", email: "admin@sabormesa.com" }]),
  invoices: getLocalStorageJSON("restaurant_invoices", []),
  customerName: "",
  orderPlace: "",
  orderSummary: "",
  resName: "",
  resPeople: 2,
  resDate: "",
  userName: "",
  userRole: "",
  userEmail: ""
};

function persist(state) {
  setLocalStorageJSON("restaurant_cart", state.cart);
  setLocalStorageJSON("restaurant_orders", state.orders);
  setLocalStorageJSON("restaurant_reservations", state.reservations);
  setLocalStorageJSON("restaurant_users", state.users);
  setLocalStorageJSON("restaurant_invoices", state.invoices);
}

function createRestaurantStore() {
  const { subscribe, update } = writable(initial);

  return {
    subscribe,
    setActiveTab: (tab) => update((s) => ({ ...s, activeTab: tab })),
    setFilter: (filter) => update((s) => ({ ...s, filter })),
    setQuery: (query) => update((s) => ({ ...s, query })),
    setCustomerName: (customerName) => update((s) => ({ ...s, customerName })),
    setOrderPlace: (orderPlace) => update((s) => ({ ...s, orderPlace })),
    setResName: (resName) => update((s) => ({ ...s, resName })),
    setResPeople: (resPeople) => update((s) => ({ ...s, resPeople })),
    setResDate: (resDate) => update((s) => ({ ...s, resDate })),
    setUserName: (userName) => update((s) => ({ ...s, userName })),
    setUserRole: (userRole) => update((s) => ({ ...s, userRole })),
    setUserEmail: (userEmail) => update((s) => ({ ...s, userEmail })),

    addToCart: (id) => update((s) => {
      const next = { ...s, cart: { ...s.cart, [id]: (s.cart[id] || 0) + 1 } };
      persist(next);
      return next;
    }),

    updateQty: ({ id, value }) => update((s) => {
      const q = Number(value);
      let cart;
      if (!q || q < 1) {
        const { [id]: _, ...rest } = s.cart;
        cart = rest;
      } else {
        cart = { ...s.cart, [id]: q };
      }
      const next = { ...s, cart };
      persist(next);
      return next;
    }),

    removeFromCart: (id) => update((s) => {
      const { [id]: _, ...rest } = s.cart;
      const next = { ...s, cart: rest };
      persist(next);
      return next;
    }),

    confirmOrder: () => update((s) => {
      const cartEntries = Object.entries(s.cart)
        .map(([id, q]) => ({ ...s.dishes.find((d) => d.id === Number(id)), quantity: Number(q) }))
        .filter((d) => d.id);

      if (!cartEntries.length || !s.customerName.trim() || !s.orderPlace.trim()) return s;

      const total = cartEntries.reduce((a, i) => a + i.price * i.quantity, 0);
      const order = {
        id: `ORD-${Date.now()}`,
        customer: s.customerName.trim(),
        place: s.orderPlace.trim(),
        items: cartEntries,
        total,
        date: new Date().toISOString()
      };
      const invoice = {
        invoiceId: `FAC-${Date.now()}`,
        orderId: order.id,
        customer: order.customer,
        total: order.total,
        date: order.date
      };

      const next = {
        ...s,
        orders: [...s.orders, order],
        invoices: [...s.invoices, invoice],
        cart: {},
        orderSummary: `Pedido ${order.id} confirmado. Factura: ${invoice.invoiceId}`,
        customerName: "",
        orderPlace: ""
      };
      persist(next);
      return next;
    }),

    addReservation: () => update((s) => {
      if (!s.resName.trim() || !s.resDate) return s;
      const next = {
        ...s,
        reservations: [...s.reservations, { name: s.resName.trim(), people: Number(s.resPeople), date: s.resDate }],
        resName: "",
        resPeople: 2,
        resDate: ""
      };
      persist(next);
      return next;
    }),

    removeReservation: (idx) => update((s) => {
      const next = { ...s, reservations: s.reservations.filter((_, i) => i !== idx) };
      persist(next);
      return next;
    }),

    addUser: () => update((s) => {
      if (!s.userName.trim() || !s.userRole.trim() || !s.userEmail.trim()) return s;
      const next = {
        ...s,
        users: [...s.users, { name: s.userName.trim(), role: s.userRole.trim(), email: s.userEmail.trim() }],
        userName: "",
        userRole: "",
        userEmail: ""
      };
      persist(next);
      return next;
    }),

    removeUser: (idx) => update((s) => {
      const next = { ...s, users: s.users.filter((_, i) => i !== idx) };
      persist(next);
      return next;
    })
  };
}

export const restaurantStore = createRestaurantStore();

export const restaurantView = derived(restaurantStore, ($s) => {
  const categories = ["Todas", ...new Set($s.dishes.map((d) => d.category))];
  const filtered = $s.dishes.filter((d) => ($s.filter === "Todas" || d.category === $s.filter) && d.name.toLowerCase().includes($s.query.toLowerCase()));
  const cartEntries = Object.entries($s.cart).map(([id, q]) => ({ ...$s.dishes.find((d) => d.id === Number(id)), quantity: Number(q) })).filter((d) => d.id);
  const total = cartEntries.reduce((a, i) => a + i.price * i.quantity, 0);
  const totalSales = $s.orders.reduce((a, o) => a + o.total, 0);
  const avgTicket = $s.orders.length ? totalSales / $s.orders.length : 0;
  const dishCounter = $s.orders.flatMap((o) => o.items).reduce((a, i) => (a[i.name] = (a[i.name] || 0) + i.quantity, a), {});
  const topDish = Object.entries(dishCounter).sort((a, b) => b[1] - a[1])[0];

  return { categories, filtered, cartEntries, total, totalSales, avgTicket, topDish };
});
