import type { TransactionWithItems } from '../types'
import type { AppSettings } from '../types'

export function buildReceiptHtml(tx: TransactionWithItems, settings: AppSettings, cashierName?: string): string {
  const sym = settings.currency_symbol
  const fmt = (c: number) => `${sym} ${(c / 100).toFixed(2)}`
  const date = new Date(tx.created_at * 1000).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const itemRows = tx.items.map(i => `
    <tr>
      <td style="padding:3px 0;">${i.product_name}</td>
      <td style="padding:3px 0;text-align:center;">${i.quantity}</td>
      <td style="padding:3px 0;text-align:right;">${fmt(i.unit_price)}</td>
      <td style="padding:3px 0;text-align:right;">${fmt(i.line_total)}</td>
    </tr>`).join('')

  const change = tx.change_given != null && tx.change_given > 0
    ? `<tr><td>Change</td><td></td><td></td><td style="text-align:right;">${fmt(tx.change_given)}</td></tr>` : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 300px; padding: 16px; }
  h1 { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 2px; }
  .sub { font-size: 11px; text-align: center; color: #555; }
  .divider { border-top: 1px dashed #aaa; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 10px; text-transform: uppercase; padding: 3px 0; border-bottom: 1px solid #ccc; }
  th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
  .totals td { padding: 2px 0; }
  .totals td:last-child { text-align: right; }
  .total-row td { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 4px; }
  .footer { text-align: center; font-size: 11px; color: #555; margin-top: 12px; }
  .txid { text-align: center; font-size: 10px; color: #999; margin-top: 4px; }
</style>
</head>
<body>
  <h1>${settings.store_name || 'NURTURE POS'}</h1>
  ${settings.store_address ? `<p class="sub">${settings.store_address}</p>` : ''}
  ${settings.store_phone ? `<p class="sub">Tel: ${settings.store_phone}</p>` : ''}
  <p class="sub">${date}</p>
  ${cashierName ? `<p class="sub">Cashier: ${cashierName}</p>` : ''}
  <div class="divider"></div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="divider"></div>
  <table class="totals">
    <tr><td>Subtotal</td><td></td><td></td><td>${fmt(tx.subtotal)}</td></tr>
    ${tx.discount > 0 ? `<tr><td>Discount</td><td></td><td></td><td>-${fmt(tx.discount)}</td></tr>` : ''}
    ${tx.tax > 0 ? `<tr><td>Tax</td><td></td><td></td><td>${fmt(tx.tax)}</td></tr>` : ''}
    <tr class="total-row"><td>TOTAL</td><td></td><td></td><td>${fmt(tx.total)}</td></tr>
    <tr><td>Paid (${tx.payment_method})</td><td></td><td></td><td>${tx.amount_tendered ? fmt(tx.amount_tendered) : fmt(tx.total)}</td></tr>
    ${change}
  </table>
  <div class="divider"></div>
  <p class="footer">${settings.receipt_footer || 'Thank you for your purchase!'}</p>
  <p class="txid">TX #${tx.id}</p>
</body>
</html>`
}
