# Sabor & Mesa — Sistema Integral de Gestión de Restaurante (SIGR)

Aplicación web de página única (SPA) construida con **Svelte 4 + Vite** e integrada con **Supabase** para la gestión completa de restaurantes: pedidos en tiempo real, reservas, menú digital, usuarios, cierre de caja y reportes de ventas.

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js     | 18.x o superior |
| npm         | 9.x o superior  |
| Cuenta Supabase | Plan gratuito (Free tier) |

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/equipoX/sigr.git
cd sigr
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto con las credenciales de tu proyecto Supabase:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<tu-clave>
```

> Las claves se obtienen en el panel de Supabase → **Project Settings → API**.

### 4. Configurar la base de datos

Ejecuta las siguientes sentencias SQL en **Supabase → SQL Editor**:

```sql
-- Usuarios del sistema
create table if not exists usuarios (
  id       bigint generated always as identity primary key,
  name     text not null,
  email    text not null unique,
  password text not null,
  role     text not null default 'Cliente'
);
alter table usuarios disable row level security;

-- Categorías del menú
create table if not exists categorias (
  id   bigint generated always as identity primary key,
  name text not null unique
);
alter table categorias disable row level security;

-- Platos del menú
create table if not exists platos (
  id          bigint generated always as identity primary key,
  name        text    not null,
  description text    default '',
  price       numeric not null,
  category    text    not null,
  image       text    default '',
  available   boolean not null default true
);
alter table platos disable row level security;

-- Pedidos (con Realtime)
create table if not exists pedidos (
  id         text        primary key,
  customer   text        not null,
  place      text        not null,
  items      jsonb       not null default '[]',
  total      numeric     not null default 0,
  status     text        not null default 'pendiente',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table pedidos disable row level security;
alter publication supabase_realtime add table pedidos;

-- Reservas (con Realtime)
create table if not exists reservas (
  id         bigint generated always as identity primary key,
  name       text        not null,
  people     int         not null default 2,
  date       timestamptz not null,
  phone      text        default '',
  notes      text        default '',
  status     text        not null default 'pendiente',
  created_at timestamptz default now()
);
alter table reservas disable row level security;
alter publication supabase_realtime add table reservas;

-- Cierres de caja
create table if not exists cierres_caja (
  id           bigint generated always as identity primary key,
  fecha        date        not null unique,
  total        numeric     not null default 0,
  orders_count int         not null default 0,
  closed_by    text        not null,
  notes        text        default '',
  created_at   timestamptz default now()
);
alter table cierres_caja disable row level security;
```

### 5. Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 6. Generar build de producción

```bash
npm run build
npm run preview   # previsualizar el build localmente
```

Los archivos estáticos se generan en `dist/` y pueden desplegarse en Netlify, Vercel o cualquier servidor estático.

---

## Módulos del sistema

| Módulo | Descripción | Roles con acceso |
|--------|-------------|-----------------|
| Autenticación | Login / registro con hash SHA-256 y control de sesión | Todos |
| Pedidos | Carta digital, carrito, tipo local/domicilio, seguimiento en tiempo real | Administrador, Mesero |
| Reservas | Formulario, vista lista y calendario mensual, gestión de estados | Todos |
| Gestión de Menús | CRUD completo de platos y categorías con imágenes | Administrador |
| Usuarios | CRUD de usuarios con roles y contraseñas hasheadas | Administrador |
| Reportes y Cierre de Caja | KPIs diarios, gráfico por hora, top platos, cierre formal, historial | Administrador |
| Facturación | Registro automático de facturas al confirmar pedidos | Administrador, Mesero |

---

## Estructura del proyecto

```
src/
├── components/          # Módulos de la interfaz (Svelte)
│   ├── AuthModule.svelte
│   ├── PedidosModule.svelte
│   ├── ReservasModule.svelte
│   ├── MenusModule.svelte
│   ├── UsuariosModule.svelte
│   ├── ReportesModule.svelte
│   └── FacturacionModule.svelte
├── stores/
│   └── restaurantStore.js   # Estado global (Svelte writable + derived)
├── lib/
│   ├── supabaseClient.js    # Instancia del cliente Supabase
│   ├── crypto.js            # Hash SHA-256 vía Web Crypto API
│   └── utils.js             # Funciones auxiliares (formatPrice, localStorage)
├── data/
│   └── tabs.js              # Pestañas y control de acceso por rol
├── App.svelte               # Componente raíz y layout
├── main.js                  # Punto de entrada
└── app.css                  # Estilos globales y variables CSS
```

---

## Licencia

Este proyecto está licenciado bajo los términos de la **Licencia MIT**.  
Consulta el archivo [LICENSE.txt](LICENSE.txt) para más detalles.

---

## Autor

**Augusto César Cañola Ortiz** — Gestión del Software, Semestre 7
