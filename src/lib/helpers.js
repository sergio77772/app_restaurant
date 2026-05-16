// ========================
// WHATSAPP
// ========================

export function buildWhatsAppMessage(order, items) {
  const typeLabel = {
    dine_in:  '🪑 En mesa',
    delivery: '🛵 Delivery',
    takeaway: '🥡 Para llevar',
  }[order.type] || order.type

  const itemLines = items
    .map(i => `  • ${i.quantity}x ${i.product_name} — $${(i.unit_price * i.quantity).toFixed(2)}`)
    .join('\n')

  let msg = `🍽️ *Nuevo pedido*\n\n`
  msg += `*Tipo:* ${typeLabel}\n`
  if (order.customer_name)  msg += `*Nombre:* ${order.customer_name}\n`
  if (order.table_label)    msg += `*Mesa:* ${order.table_label}\n`
  if (order.delivery_address) msg += `*Dirección:* ${order.delivery_address}\n`
  msg += `\n*Productos:*\n${itemLines}\n`
  msg += `\n*Total: $${Number(order.total).toFixed(2)}*`
  if (order.notes) msg += `\n\n*Notas:* ${order.notes}`

  return msg
}

export function openWhatsApp(message) {
  const phone = import.meta.env.VITE_WHATSAPP_NUMBER || ''
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

// ========================
// STATUS DE PEDIDOS
// ========================

export const ORDER_STATUSES = [
  { key: 'pending',   label: 'Pendiente',  emoji: '🕐' },
  { key: 'confirmed', label: 'Confirmado', emoji: '✅' },
  { key: 'preparing', label: 'Preparando', emoji: '👨‍🍳' },
  { key: 'ready',     label: 'Listo',      emoji: '🔔' },
  { key: 'delivered', label: 'Entregado',  emoji: '✓'  },
  { key: 'cancelled', label: 'Cancelado',  emoji: '✗'  },
]

export function getStatusInfo(status) {
  return ORDER_STATUSES.find(s => s.key === status) || { key: status, label: status, emoji: '?' }
}

export function getNextStatus(current) {
  const flow = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
  const idx = flow.indexOf(current)
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null
}

// ========================
// FORMATO
// ========================

export function formatPrice(n) {
  return `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
