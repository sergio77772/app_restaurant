# 🍽️ Sistema de Restaurante — MVP

Stack: React + Vite + Supabase + Vercel

---

## Estructura del proyecto

```
src/
├── lib/
│   ├── supabase.js       # cliente Supabase
│   └── helpers.js        # WhatsApp, formatters, status
├── context/
│   └── AuthContext.jsx   # autenticación del dueño
├── pages/
│   ├── LoginPage.jsx
│   ├── admin/
│   │   ├── AdminLayout.jsx   # sidebar
│   │   ├── OrdersPage.jsx    # pedidos en tiempo real
│   │   ├── ProductsPage.jsx  # ABM productos
│   │   ├── SalesPage.jsx     # ventas del día
│   │   └── TablesPage.jsx    # mesas + QR
│   └── menu/
│       ├── MenuPage.jsx      # menú público (QR)
│       ├── CheckoutPage.jsx  # confirmar pedido
│       └── SuccessPage.jsx   # confirmación
├── App.jsx    # rutas
├── main.jsx
└── index.css  # design system
```

---

## Setup local

### 1. Clonar / descargar el proyecto

```bash
cd restaurant-app
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completar `.env.local` con los datos de Supabase:
- `VITE_SUPABASE_URL` → Supabase → Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY` → Supabase → Settings → API → anon public key
- `VITE_WHATSAPP_NUMBER` → número del local (formato: 5493884000000)

### 3. Supabase

1. Ejecutar `supabase_schema.sql` en el SQL Editor de Supabase
2. Ir a **Authentication → Users** → crear usuario del dueño

### 4. Correr en desarrollo

```bash
npm run dev
```

---

## Deploy en Vercel

1. Subir el código a GitHub
2. Importar el repo en [vercel.com](https://vercel.com)
3. En **Environment Variables** agregar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WHATSAPP_NUMBER`
4. Deploy → listo ✓

El archivo `vercel.json` ya maneja el routing de la SPA.

---

## Rutas

| URL                  | Descripción                        |
|----------------------|------------------------------------|
| `/`                  | Redirige a `/admin`                |
| `/login`             | Login del dueño                    |
| `/admin/orders`      | Pedidos en tiempo real             |
| `/admin/products`    | ABM de productos                   |
| `/admin/sales`       | Resumen de ventas                  |
| `/admin/tables`      | Mesas y generador de QR            |
| `/menu?t=mesa-1`     | Menú público para la mesa 1        |
| `/checkout`          | Confirmación del pedido            |
| `/success`           | Pantalla de pedido enviado         |

---

## Flujo del cliente

1. Escanea QR de la mesa → `/menu?t=mesa-1`
2. Agrega productos al carrito
3. Toca "Ver pedido" → `/checkout`
4. Completa nombre y tipo (mesa / delivery / llevar)
5. Confirma → se guarda en Supabase + abre WhatsApp con el resumen
6. Pantalla de éxito

## Flujo del dueño

1. Entra a `/admin` → login
2. Ve pedidos en tiempo real (actualización automática)
3. Toca un pedido → avanza el estado: Pendiente → Confirmado → Preparando → Listo → Entregado
4. En Ventas ve el resumen del día y los últimos 7 días
5. En Mesas genera e imprime el QR de cada mesa

---

## Próximas mejoras (post-MVP)

- [ ] Notificaciones push al dueño (nuevo pedido)
- [ ] Imagen de productos via Supabase Storage
- [ ] Múltiples locales / sucursales
- [ ] Integración con MercadoPago
- [ ] App móvil del dueño (PWA)
- [ ] Historial de pedidos del cliente
