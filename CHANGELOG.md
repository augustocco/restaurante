# Changelog — Sabor & Mesa (SIGR)

Todos los cambios notables de este proyecto se documentan en este archivo.  
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)  
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] — 2026-05-09 · Línea base (commit a93b4f1)

### Agregado

#### Infraestructura y configuración
- Proyecto inicializado con Vite 5 + Svelte 4 (SPA, sin SvelteKit).
- Integración con Supabase como backend-as-a-service (PostgreSQL + Realtime).
- Variables de entorno con prefijo `VITE_` para compatibilidad con Vite (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- Store global reactivo (`restaurantStore`) basado en `writable` + `derived` de Svelte.
- Sistema de persistencia mixto: datos operativos en Supabase, sesión y carrito en `localStorage`.
- Estilos globales con custom properties CSS (`--primary`, `--bg`, `--surface`, `--ok`, `--danger`, etc.).

#### Módulo de autenticación (`AuthModule.svelte`)
- Formulario de login y registro en una sola vista con alternancia de modo.
- Hash de contraseñas con **SHA-256** mediante la Web Crypto API del navegador (sin dependencias externas).
- Control de sesión persistida en `localStorage` con restauración automática al recargar.
- Control de acceso por roles: **Administrador**, **Mesero**, **Cliente**.
- Redirección automática a la primera pestaña permitida según el rol tras iniciar sesión.
- Mensajes de error diferenciados: correo no registrado, contraseña incorrecta, error de conexión.

#### Módulo de pedidos (`PedidosModule.svelte`)
- Carta digital con búsqueda por nombre y filtros por categoría.
- Carrito de compras con control de cantidades y eliminación de ítems.
- Selector de cliente registrado (rol Cliente) desde la base de datos.
- Toggle de tipo de pedido: **En local** (número de mesa) / **Domicilio** (dirección de entrega).
- Visualización del correo del cliente seleccionado como confirmación.
- Confirmación de pedido con inserción en Supabase y generación automática de factura.
- Seguimiento en **tiempo real** de pedidos activos mediante Supabase Realtime.
- Flujo de estados: `pendiente → en_preparación → listo → entregado`.
- Indicador visual "En vivo" con animación de pulso.
- Panel de estadísticas: contadores por estado (pendientes, en preparación, listos, entregados).
- Filtros por estado en la vista de pedidos activos.

#### Módulo de reservas (`ReservasModule.svelte`)
- Formulario de nueva reserva: cliente registrado (selector), fecha/hora, número de personas, teléfono y notas.
- Vista **Lista** con tarjetas de reserva, estado coloreado y acciones (confirmar, cancelar, eliminar).
- Vista **Calendario** mensual con celdas por día, contadores de reservas y puntos de color por estado.
- Navegación entre meses en el calendario.
- Filtros por estado: todas, pendiente, confirmada, cancelada.
- Filtro por día al hacer clic en una celda del calendario.
- Chips de estadísticas en el encabezado: reservas hoy, pendientes, confirmadas.
- Sincronización en tiempo real mediante Supabase Realtime.
- Gestión de estados por rol: Administrador y Mesero pueden confirmar/cancelar.

#### Módulo de menú digital (`MenusModule.svelte`)
- Vista de menú público con búsqueda y filtros por categoría.
- Tarjetas de platos con imagen, descripción, precio y badge de "Agotado".
- Panel de administración (solo Administrador): formulario CRUD de platos y categorías.
- Edición inline de platos con todos los campos (nombre, categoría, precio, descripción, imagen, disponibilidad).
- Manejo de imágenes con fallback visual ante URL rota o vacía.

#### Módulo de usuarios (`UsuariosModule.svelte`)
- Tabla de usuarios registrados con nombre, correo y rol.
- Formulario de alta con campos: nombre, correo, contraseña y rol.
- Eliminación de usuarios con confirmación.
- Indicadores de carga y mensajes de error de Supabase.
- Las contraseñas se almacenan hasheadas (SHA-256), nunca en texto plano.

#### Módulo de reportes y cierre de caja (`ReportesModule.svelte`)
- Selector de fecha para consultar cualquier día (por defecto: hoy).
- KPIs del día: ventas totales, número de pedidos, ticket promedio, pedidos entregados.
- Gráfico de barras de ventas por hora (CSS puro, sin librerías externas).
- Ranking de los 5 platos más vendidos con barras proporcionales.
- Tabla completa de pedidos del día con todos los detalles.
- Banner de estado de caja: abierta / cerrada / sin pedidos.
- Formulario de cierre de caja con campo de notas (solo Administrador).
- Registro formal del cierre en tabla `cierres_caja` de Supabase (fecha única por día).
- Pestaña **Historial de cierres** con KPIs acumulados y tabla de todos los cierres.

#### Módulo de facturación (`FacturacionModule.svelte`)
- Generación automática de factura al confirmar un pedido.
- Listado de facturas con ID de factura, ID de pedido, cliente, total y fecha.

---

## [Unreleased] — Cambios planificados para v1.1.0

### Por agregar
- Módulo de pagos en línea con integración a pasarela de pago.
- Notificaciones push para nuevos pedidos y cambios de estado.
- Exportación de reportes a PDF desde el módulo de cierre de caja.
- Soporte multi-idioma (español / inglés).

### Por mejorar
- Validación de formularios con mensajes de error inline.
- Modo oscuro (dark mode).
- Versión PWA (Progressive Web App) para uso desde dispositivos móviles.

---

[1.0.0]: https://github.com/equipoX/sigr/releases/tag/v1.0.0
[Unreleased]: https://github.com/equipoX/sigr/compare/v1.0.0...HEAD
