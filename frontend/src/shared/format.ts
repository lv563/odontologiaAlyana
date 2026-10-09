/** "RD$ 9,450.00" — separador de miles y 2 decimales siempre, sin depender del locale del navegador. */
export function formatCurrency(amount: number): string {
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `RD$ ${formatted}`
}
