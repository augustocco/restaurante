import { writable, derived } from "svelte/store";
import { tabs } from "../data/tabs";
import { getLocalStorageJSON, setLocalStorageJSON } from "../lib/utils";
import { supabase } from "../lib/supabaseClient";
import { hashPassword } from "../lib/crypto";

const TABLE_USERS   = "usuarios";
const TABLE_DISHES  = "platos";
const TABLE_CATS    = "categorias";
const TABLE_ORDERS  = "pedidos";
const TABLE_RES     = "reservas";
const TABLE_CIERRES = "cierres_caja";
const TABLE         = TABLE_USERS; // legacy alias for auth

function firstTabForRole(role) {
  return tabs.find(([, , roles]) => roles.includes(role))?.[0] ?? "menus";
}

const rawSession = getLocalStorageJSON("restaurant_session", null);

const initial = {
  tabs,
  activeTab:     rawSession ? firstTabForRole(rawSession.role) : "menus",
  filter:        "Todas",
  query:         "",
  cart:             getLocalStorageJSON("restaurant_cart", {}),
  invoices:         getLocalStorageJSON("restaurant_invoices", []),
  // Orders — Supabase + realtime
  orders:           [],
  ordersLoading:    false,
  ordersError:      null,
  // Reservations — Supabase + realtime
  reservations:     [],
  reservasLoading:  false,
  reservasError:    null,
  // Users — Supabase
  users:         [],
  usersLoading:  false,
  usersError:    null,
  // Menu — Supabase
  dishes:        [],
  dbCategories:  [],
  menuLoading:   false,
  menuError:     null,
  // Cierres de caja — Supabase
  cierres:        [],
  cierresLoading: false,
  cierresError:   null,
  session:       rawSession,
  // Form fields
  customerName:  "",
  orderPlace:    "",
  orderSummary:  "",
  userName:      "",
  userRole:      "Cliente",
  userEmail:     "",
  userPassword:  ""
};

function persist(state) {
  setLocalStorageJSON("restaurant_cart",     state.cart);
  setLocalStorageJSON("restaurant_invoices", state.invoices);
  // orders, reservations, users, menu → Supabase
}

function createRestaurantStore() {
  let _state = initial;
  let _ordersChannel = null;
  let _reservasChannel = null;
  const { subscribe, update: _svelte_update } = writable(initial);

  function update(fn) {
    _svelte_update(s => { _state = fn(s); return _state; });
  }

  // ── Internal: reload cierres ──────────────────────────────────────────
  async function _reloadCierres() {
    const { data, error } = await supabase
      .from(TABLE_CIERRES)
      .select("*")
      .order("fecha", { ascending: false });
    if (error) {
      update(s => ({ ...s, cierresLoading: false, cierresError: error.message }));
    } else {
      update(s => ({ ...s, cierres: data ?? [], cierresLoading: false, cierresError: null }));
    }
  }

  // ── Internal: reload orders ────────────────────────────────────────────
  async function _reloadOrders() {
    const { data, error } = await supabase
      .from(TABLE_ORDERS)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[orders]", error);
      update(s => ({ ...s, ordersLoading: false, ordersError: error.message }));
    } else {
      const orders = (data ?? []).map(o => ({ ...o, date: o.created_at }));
      update(s => ({ ...s, orders, ordersLoading: false, ordersError: null }));
    }
  }

  // ── Internal: reload reservations ────────────────────────────────────────
  async function _reloadReservations() {
    const { data, error } = await supabase
      .from(TABLE_RES)
      .select("*")
      .order("date", { ascending: true });
    if (error) {
      console.error("[reservas]", error);
      update(s => ({ ...s, reservasLoading: false, reservasError: error.message }));
    } else {
      update(s => ({ ...s, reservations: data ?? [], reservasLoading: false, reservasError: null }));
    }
  }

  // ── Internal helper: reload users from Supabase ────────────────────────
  async function _reloadUsers() {
    const { data, error } = await supabase.from(TABLE).select("*");
    console.log("[loadUsers] data:", data, "error:", error);
    if (error) {
      update(s => ({ ...s, usersLoading: false, usersError: error.message }));
    } else {
      update(s => ({ ...s, users: data ?? [], usersLoading: false, usersError: null }));
    }
  }

  return {
    subscribe,

    // ── Setters ───────────────────────────────────────────────────────────
    setActiveTab:    (tab)          => update(s => ({ ...s, activeTab: tab })),
    setFilter:       (filter)       => update(s => ({ ...s, filter })),
    setQuery:        (query)        => update(s => ({ ...s, query })),
    setCustomerName: (customerName) => update(s => ({ ...s, customerName })),
    setOrderPlace:   (orderPlace)   => update(s => ({ ...s, orderPlace })),
    setUserName:     (userName)     => update(s => ({ ...s, userName })),
    setUserRole:     (userRole)     => update(s => ({ ...s, userRole })),
    setUserEmail:    (userEmail)    => update(s => ({ ...s, userEmail })),
    setUserPassword: (userPassword) => update(s => ({ ...s, userPassword })),

    // ── Auth ──────────────────────────────────────────────────────────────
    // Returns { ok: true } or { ok: false, message: string }
    async login(email, password) {
      // Search by email (case-insensitive) and check password in JS
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .ilike("email", email.trim())
        .maybeSingle();

      if (error) {
        console.error("[Supabase login]", error);
        return { ok: false, message: `Error de conexión con Supabase: ${error.message}` };
      }
      if (!data) {
        return { ok: false, message: "Correo electrónico no registrado." };
      }
      // Compare hashed password
      const hashed = await hashPassword(password);
      const storedPassword = data.password ?? data.contraseña ?? data.pass ?? data.pwd ?? "";
      if (storedPassword !== hashed) {
        return { ok: false, message: "Contraseña incorrecta." };
      }

      const sess = { id: data.id, name: data.name, email: data.email, role: data.role };
      setLocalStorageJSON("restaurant_session", sess);
      update(s => ({ ...s, session: sess, activeTab: firstTabForRole(data.role) }));
      _reloadUsers(); // populate users list after login
      return { ok: true };
    },

    logout() {
      localStorage.removeItem("restaurant_session");
      update(s => ({ ...s, session: null, activeTab: "menus" }));
    },

    async register(name, email, password, role = "Cliente") {
      // El registro público solo crea Clientes — roles privilegiados solo los crea el Administrador
      role = "Cliente";
      const { data: existing, error: checkError } = await supabase
        .from(TABLE)
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (checkError) {
        console.error("[Supabase register check]", checkError);
        return { ok: false, message: `Error de conexión: ${checkError.message}` };
      }
      if (existing) return { ok: false, message: "Ese correo ya está registrado." };

      const { data, error } = await supabase
        .from(TABLE)
        .insert({ name, email: email.toLowerCase(), password: await hashPassword(password), role })
        .select()
        .single();

      if (error) {
        console.error("[Supabase register insert]", error);
        return { ok: false, message: `Error al crear usuario: ${error.message}` };
      }
      if (!data) return { ok: false, message: "No se pudo crear el usuario." };

      const sess = { id: data.id, name: data.name, email: data.email, role: data.role };
      setLocalStorageJSON("restaurant_session", sess);
      update(s => ({
        ...s,
        users: [...s.users, data],
        session: sess,
        activeTab: firstTabForRole(role)
      }));
      return { ok: true };
    },

    // ── Users CRUD (Supabase) ─────────────────────────────────────────────
    async loadUsers() {
      update(s => ({ ...s, usersLoading: true, usersError: null }));
      await _reloadUsers();
    },

    async addUser() {
      const { userName, userEmail, userPassword, userRole } = _state;
      if (!userName.trim() || !userEmail.trim() || !userPassword.trim()) return;

      const emailLower = userEmail.trim().toLowerCase();
      if (_state.users.some(u => u.email.toLowerCase() === emailLower)) {
        update(s => ({ ...s, usersError: "Ese correo ya está registrado." }));
        return;
      }

      update(s => ({ ...s, usersLoading: true, usersError: null }));

      const { error } = await supabase.from(TABLE).insert({
        name:     userName.trim(),
        email:    emailLower,
        password: await hashPassword(userPassword.trim()),
        role:     userRole || "Cliente"
      });

      if (error) {
        update(s => ({ ...s, usersLoading: false, usersError: error.message }));
        return;
      }

      update(s => ({ ...s, userName: "", userRole: "Cliente", userEmail: "", userPassword: "" }));
      await _reloadUsers();
    },

    async removeUser(idx) {
      const user = _state.users[idx];
      if (!user) return;

      update(s => ({ ...s, usersLoading: true, usersError: null }));

      const { error } = await supabase.from(TABLE).delete().eq("id", user.id);

      if (error) {
        update(s => ({ ...s, usersLoading: false, usersError: error.message }));
        return;
      }

      await _reloadUsers();
    },

    // ── Cart ──────────────────────────────────────────────────────────────
    addToCart: (id) => update(s => {
      const next = { ...s, cart: { ...s.cart, [id]: (s.cart[id] || 0) + 1 } };
      persist(next);
      return next;
    }),

    updateQty: ({ id, value }) => update(s => {
      const q = Number(value);
      const cart = (!q || q < 1)
        ? (({ [id]: _, ...rest }) => rest)(s.cart)
        : { ...s.cart, [id]: q };
      const next = { ...s, cart };
      persist(next);
      return next;
    }),

    removeFromCart: (id) => update(s => {
      const { [id]: _, ...rest } = s.cart;
      const next = { ...s, cart: rest };
      persist(next);
      return next;
    }),

    async confirmOrder() {
      const s = _state;
      const cartEntries = Object.entries(s.cart)
        .map(([id, q]) => ({ ...s.dishes.find(d => d.id === Number(id)), quantity: Number(q) }))
        .filter(d => d.id);
      if (!cartEntries.length || !s.customerName.trim() || !s.orderPlace.trim()) return;

      const total   = cartEntries.reduce((a, i) => a + i.price * i.quantity, 0);
      const orderId = `ORD-${Date.now()}`;

      const { error } = await supabase.from(TABLE_ORDERS).insert({
        id: orderId, customer: s.customerName.trim(), place: s.orderPlace.trim(),
        items: cartEntries, total, status: "pendiente"
      });
      if (error) { console.error("[confirmOrder]", error); return; }

      const invoice = { invoiceId: `FAC-${Date.now()}`, orderId, customer: s.customerName.trim(), total, date: new Date().toISOString() };
      update(st => {
        const next = { ...st, cart: {}, orderSummary: `Pedido ${orderId} confirmado.`, customerName: "", orderPlace: "", invoices: [...st.invoices, invoice] };
        persist(next);
        return next;
      });
      // realtime subscription will refresh orders; also reload manually
      await _reloadOrders();
    },

    // ── Reservations (Supabase + Realtime) ───────────────────────────────
    async loadReservations() {
      update(s => ({ ...s, reservasLoading: true, reservasError: null }));
      await _reloadReservations();
    },

    async addReservation({ name, people, date, phone, notes }) {
      const { error } = await supabase.from(TABLE_RES).insert({
        name, people: Number(people), date, phone: phone ?? "", notes: notes ?? "", status: "pendiente"
      });
      if (error) return error.message;
      await _reloadReservations();
      return null;
    },

    async updateReservationStatus(id, status) {
      const { error } = await supabase.from(TABLE_RES).update({ status }).eq("id", id);
      if (error) console.error("[reservas status]", error);
      else await _reloadReservations();
    },

    async deleteReservation(id) {
      const { error } = await supabase.from(TABLE_RES).delete().eq("id", id);
      if (error) console.error("[reservas delete]", error);
      else await _reloadReservations();
    },

    subscribeToReservations() {
      if (_reservasChannel) return;
      _reservasChannel = supabase
        .channel("reservas-rt")
        .on("postgres_changes", { event: "*", schema: "public", table: TABLE_RES }, () => {
          _reloadReservations();
        })
        .subscribe();
    },

    unsubscribeFromReservations() {
      if (_reservasChannel) {
        supabase.removeChannel(_reservasChannel);
        _reservasChannel = null;
      }
    },

    // ── Orders (Supabase + Realtime) ─────────────────────────────────────
    async loadOrders() {
      update(s => ({ ...s, ordersLoading: true, ordersError: null }));
      await _reloadOrders();
    },

    async updateOrderStatus(id, status) {
      const { error } = await supabase
        .from(TABLE_ORDERS)
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) console.error("[updateOrderStatus]", error);
      else await _reloadOrders();
    },

    subscribeToOrders() {
      if (_ordersChannel) return;
      _ordersChannel = supabase
        .channel("pedidos-rt")
        .on("postgres_changes", { event: "*", schema: "public", table: TABLE_ORDERS }, () => {
          _reloadOrders();
        })
        .subscribe();
    },

    unsubscribeFromOrders() {
      if (_ordersChannel) {
        supabase.removeChannel(_ordersChannel);
        _ordersChannel = null;
      }
    },

    // ── Cierres de caja (Supabase) ────────────────────────────────────────
    async loadCierres() {
      update(s => ({ ...s, cierresLoading: true, cierresError: null }));
      await _reloadCierres();
    },

    async closeCaja({ fecha, total, orders_count, closed_by, notes }) {
      update(s => ({ ...s, cierresLoading: true, cierresError: null }));
      const { error } = await supabase.from(TABLE_CIERRES).insert({
        fecha, total, orders_count, closed_by, notes: notes ?? ""
      });
      if (error) {
        update(s => ({ ...s, cierresLoading: false, cierresError: error.message }));
        return error.message;
      }
      await _reloadCierres();
      return null;
    },

    // ── Menu CRUD (Supabase) ──────────────────────────────────────────────
    async loadMenu() {
      update(s => ({ ...s, menuLoading: true, menuError: null }));
      const [dishRes, catRes] = await Promise.all([
        supabase.from(TABLE_DISHES).select("*").order("category").order("name"),
        supabase.from(TABLE_CATS).select("*").order("name")
      ]);
      console.log("[loadMenu] platos:", dishRes.data, dishRes.error);
      console.log("[loadMenu] categorias:", catRes.data, catRes.error);
      if (dishRes.error || catRes.error) {
        const msg = (dishRes.error ?? catRes.error).message;
        update(s => ({ ...s, menuLoading: false, menuError: msg }));
        return;
      }
      const dishes = (dishRes.data ?? []).map(p => ({
        id:          p.id,
        name:        p.name,
        description: p.description ?? "",
        price:       Number(p.price),
        category:    p.category,
        image:       p.image ?? p.imagen ?? p.image_url ?? p.img ?? "",
        available:   p.available ?? true
      }));
      update(s => ({ ...s, dishes, dbCategories: catRes.data ?? [], menuLoading: false, menuError: null }));
    },

    async addDish(data) {
      const { error } = await supabase.from(TABLE_DISHES).insert(data);
      if (error) return error.message;
      await restaurantStore.loadMenu();
      return null;
    },

    async updateDish(id, data) {
      const { error } = await supabase.from(TABLE_DISHES).update(data).eq("id", id);
      if (error) return error.message;
      await restaurantStore.loadMenu();
      return null;
    },

    async deleteDish(id) {
      const { error } = await supabase.from(TABLE_DISHES).delete().eq("id", id);
      if (error) return error.message;
      await restaurantStore.loadMenu();
      return null;
    },

    async addCategory(name) {
      const { error } = await supabase.from(TABLE_CATS).insert({ name });
      if (error) return error.message;
      await restaurantStore.loadMenu();
      return null;
    },

    async deleteCategory(id) {
      const { error } = await supabase.from(TABLE_CATS).delete().eq("id", id);
      if (error) return error.message;
      await restaurantStore.loadMenu();
      return null;
    }
  };
}

export const restaurantStore = createRestaurantStore();

export const restaurantView = derived(restaurantStore, ($s) => {
  const categories  = ["Todas", ...new Set($s.dishes.map(d => d.category))];
  const filtered    = $s.dishes.filter(d => ($s.filter === "Todas" || d.category === $s.filter) && d.name.toLowerCase().includes($s.query.toLowerCase()));
  const cartEntries = Object.entries($s.cart).map(([id, q]) => ({ ...$s.dishes.find(d => d.id === Number(id)), quantity: Number(q) })).filter(d => d.id);
  const total       = cartEntries.reduce((a, i) => a + i.price * i.quantity, 0);
  const totalSales  = $s.orders.reduce((a, o) => a + o.total, 0);
  const avgTicket   = $s.orders.length ? totalSales / $s.orders.length : 0;
  const dishCounter = $s.orders.flatMap(o => o.items).reduce((a, i) => (a[i.name] = (a[i.name] || 0) + i.quantity, a), {});
  const topDish     = Object.entries(dishCounter).sort((a, b) => b[1] - a[1])[0];
  return { categories, filtered, cartEntries, total, totalSales, avgTicket, topDish };
});
