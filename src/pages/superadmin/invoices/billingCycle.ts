const LABELS: Record<string, string> = {
  monthly: 'Monthly',
  '6-months': '6 Months',
  yearly: 'Yearly',
  'one-time': 'One-time',
  installment: 'Installment',
};

export const billingCycleLabel = (cycle?: string) =>
  (cycle && LABELS[cycle]) || (cycle ? cycle.charAt(0).toUpperCase() + cycle.slice(1) : '—');

export const BILLING_CYCLE_OPTIONS = Object.entries(LABELS).map(([value, label]) => ({ value, label }));
