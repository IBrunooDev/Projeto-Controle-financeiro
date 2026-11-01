export const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

export const dateLabel = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");

export function summarize(transactions, purchases, reserveMoves) {
  const income = transactions.filter(x => x.type === "income").reduce((s, x) => s + Number(x.amount), 0);
  const expenses = transactions.filter(x => x.type === "expense").reduce((s, x) => s + Number(x.amount), 0);
  const reserveDeposits = reserveMoves.filter(x => x.type === "deposit").reduce((s, x) => s + Number(x.amount), 0);
  const reserveWithdrawals = reserveMoves.filter(x => x.type === "withdrawal").reduce((s, x) => s + Number(x.amount), 0);
  const purchaseBalance = purchases.filter(x => x.payment_source === "balance").reduce((s, x) => s + Number(x.amount), 0);
  const purchaseReserve = purchases.filter(x => x.payment_source === "reserve").reduce((s, x) => s + Number(x.amount), 0);
  return {
    income, expenses, reserveDeposits, reserveWithdrawals, purchaseBalance, purchaseReserve,
    balance: income - expenses - reserveDeposits + reserveWithdrawals - purchaseBalance,
    reserve: reserveDeposits - reserveWithdrawals - purchaseReserve,
    purchases: purchaseBalance + purchaseReserve
  };
}

export const today = () => new Date().toISOString().slice(0, 10);
