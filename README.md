# Sabor & Mesa — Sistema de Gestión Integral para Restaurantes

Aplicación web para la gestión completa de un restaurante, desarrollada con **Svelte** y **Vite**. Centraliza en una sola interfaz los módulos operativos más importantes del negocio.

## Módulos

| Módulo | Descripción |
|---|---|
| **Pedidos** | Toma de pedidos con carrito, búsqueda y filtro por categoría, resumen de orden y confirmación |
| **Reservas** | Registro, listado y cancelación de reservas de mesas con fecha y número de comensales |
| **Gestión de menús** | Visualización del menú organizado por categorías con todos los platos disponibles |
| **Usuarios** | Alta, listado y eliminación de usuarios del sistema con asignación de rol |
| **Reportes** | Panel de métricas: ventas totales, ticket promedio y plato más vendido |
| **Facturación** | Historial de facturas generadas a partir de los pedidos confirmados |

## Tecnologías

- [Svelte 4](https://svelte.dev/) — framework reactivo de componentes
- [Vite 5](https://vitejs.dev/) — entorno de desarrollo y bundler
- CSS personalizado con variables y diseño responsivo

## Instalación y uso

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Generar build de producción
npm run build

# Previsualizar el build
npm run preview
```

## Estructura del proyecto

```
src/
├── components/
│   ├── PedidosModule.svelte
│   ├── ReservasModule.svelte
│   ├── MenusModule.svelte
│   ├── UsuariosModule.svelte
│   ├── ReportesModule.svelte
│   └── FacturacionModule.svelte
├── data/
│   ├── dishes.js        # Catálogo de platos
│   └── tabs.js          # Definición de pestañas
├── stores/
│   └── restaurantStore.js  # Estado global de la aplicación
├── lib/
│   └── utils.js
├── App.svelte
├── app.css
└── main.js
```

## Contexto académico

Proyecto desarrollado para la asignatura **Gestión del Software** — Semestre 7.
