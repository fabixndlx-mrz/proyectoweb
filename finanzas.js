const currencyControl = document.querySelector("#currency");
const incomeField = document.querySelector("#income");
const expenseFields = [...document.querySelectorAll("[data-expense]")];
const savingsGoalField = document.querySelector("#savings-goal");
const savingsCurrentField = document.querySelector("#savings-current");

const expenseCategories = [
  { key: "food", label: "Alimentación", type: "Gasto necesario" },
  { key: "transport", label: "Transporte", type: "Gasto necesario" },
  { key: "services", label: "Servicios básicos", type: "Gasto necesario" },
  { key: "leisure", label: "Entretenimiento y ocio", type: "Gasto personal" },
  { key: "other", label: "Imprevistos y gastos diversos", type: "Otros gastos" }
];

const errorIds = new Map([
  ["income", "income-error"],
  ["expense-food", "expense-food-error"],
  ["expense-transport", "expense-transport-error"],
  ["expense-services", "expense-services-error"],
  ["expense-leisure", "expense-leisure-error"],
  ["expense-other", "expense-other-error"],
  ["savings-goal", "goal-error"],
  ["savings-current", "current-error"]
]);

const summaryRows = document.querySelector("#summary-rows");
const distributionList = document.querySelector("#distribution-list");
const distributionEmpty = document.querySelector("#distribution-empty");
let currentBudget = null;
let currentSavings = { goal: null, saved: 0, percent: null };

function getCurrencyCode() {
  return currencyControl.value;
}

function getCurrencyFormatter() {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: getCurrencyCode(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatMoney(value) {
  return getCurrencyFormatter().format(value);
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("es", { maximumFractionDigits: 1 }).format(value)}%`;
}

function roundCents(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function setFieldError(field, message) {
  const errorElement = document.getElementById(errorIds.get(field.id));
  field.setCustomValidity(message);
  field.closest(".money-input-wrap")?.classList.toggle("has-error", Boolean(message));

  if (message) {
    field.setAttribute("aria-invalid", "true");
  } else {
    field.removeAttribute("aria-invalid");
  }

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function readAmount(field, { positive = false } = {}) {
  const empty = field.value.trim() === "";
  const value = empty ? 0 : field.valueAsNumber;
  let message = "";

  if (field.validity.badInput || !Number.isFinite(value)) {
    message = "Escribe un monto válido.";
  } else if (field.validity.rangeUnderflow || value < 0 || (positive && value === 0 && !empty)) {
    message = positive
      ? "La meta debe ser mayor que cero."
      : "El monto no puede ser menor que cero.";
  } else if (field.validity.stepMismatch) {
    message = "Usa un máximo de dos decimales.";
  }

  setFieldError(field, message);
  return message ? null : value;
}

function updateCurrencySymbols() {
  const parts = new Intl.NumberFormat("es", {
    style: "currency",
    currency: getCurrencyCode()
  }).formatToParts(0);
  const symbol = parts.find((part) => part.type === "currency")?.value;

  if (!symbol) {
    throw new Error(`No se encontró el símbolo para la moneda ${getCurrencyCode()}.`);
  }

  for (const element of document.querySelectorAll(".currency-symbol")) {
    element.textContent = symbol;
  }
}

function setOutput(element, value) {
  element.textContent = value;
}

function renderDistribution(expenses, total) {
  distributionList.querySelectorAll(".distribution-row").forEach((row) => row.remove());
  distributionEmpty.hidden = total > 0;

  if (total <= 0) {
    return;
  }

  for (const category of expenseCategories) {
    const amount = expenses[category.key];
    if (amount <= 0) {
      continue;
    }

    const share = (amount / total) * 100;
    const row = document.createElement("div");
    row.className = "distribution-row";

    const label = document.createElement("span");
    label.textContent = category.label;

    const value = document.createElement("strong");
    value.textContent = `${formatMoney(amount)} · ${formatPercent(share)}`;

    const meter = document.createElement("meter");
    meter.min = 0;
    meter.max = 100;
    meter.value = share;
    meter.setAttribute("aria-label", `${category.label}: ${formatPercent(share)} de los gastos`);

    row.append(label, value, meter);
    distributionList.append(row);
  }
}

function renderSummaryTable(budget) {
  const rows = [
    { label: "Ingresos mensuales", type: "Ingreso", amount: budget.income },
    ...expenseCategories.map((category) => ({
      label: category.label,
      type: category.type,
      amount: budget.expenses[category.key]
    })),
    { label: "Dinero disponible", type: "Balance", amount: budget.available, total: true }
  ];
  const fragment = document.createDocumentFragment();

  for (const row of rows) {
    const tr = document.createElement("tr");
    if (row.total) {
      tr.className = "summary-total";
    }

    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = row.label;
    const type = document.createElement("td");
    type.textContent = row.type;
    const amount = document.createElement("td");
    amount.textContent = formatMoney(row.amount);
    tr.append(label, type, amount);
    fragment.append(tr);
  }

  summaryRows.replaceChildren(fragment);
}

function renderInvalidBudget() {
  const panel = document.querySelector("#available-panel");
  panel.dataset.status = "negative";
  setOutput(document.querySelector("#income-total"), "Revisa los montos");
  setOutput(document.querySelector("#expenses-total"), "Revisa los montos");
  setOutput(document.querySelector("#available-total"), "No disponible");
  setOutput(document.querySelector("#balance-message"), "Corrige los campos marcados para actualizar el balance.");
  const errorRow = document.createElement("tr");
  const errorCell = document.createElement("td");
  errorCell.colSpan = 3;
  errorCell.textContent = "Revisa los valores marcados para ver el resumen.";
  errorRow.append(errorCell);
  summaryRows.replaceChildren(errorRow);
  distributionList.querySelectorAll(".distribution-row").forEach((row) => row.remove());
  distributionEmpty.hidden = false;
  distributionEmpty.textContent = "Corrige los montos marcados para ver la distribución.";
  currentBudget = null;
  updateSavingsSummary();
}

function renderBudget() {
  const income = readAmount(incomeField);
  const expenses = {};
  let valid = income !== null;

  for (const field of expenseFields) {
    const amount = readAmount(field);
    expenses[field.dataset.expense] = amount;
    valid = valid && amount !== null;
  }

  if (!valid) {
    renderInvalidBudget();
    return;
  }

  const expenseTotal = roundCents(Object.values(expenses).reduce((sum, amount) => sum + amount, 0));
  const available = roundCents(income - expenseTotal);

  if (!Number.isFinite(expenseTotal) || !Number.isFinite(available)) {
    renderInvalidBudget();
    document.querySelector("#balance-message").textContent = "Los montos superan el rango que esta página puede calcular.";
    return;
  }

  currentBudget = { income, expenses, expenseTotal, available };
  setOutput(document.querySelector("#income-total"), formatMoney(income));
  setOutput(document.querySelector("#expenses-total"), formatMoney(expenseTotal));
  setOutput(document.querySelector("#available-total"), formatMoney(available));

  const panel = document.querySelector("#available-panel");
  const message = document.querySelector("#balance-message");

  if (available > 0) {
    panel.dataset.status = "positive";
    message.textContent = `Te quedan ${formatMoney(available)} después de estos gastos.`;
  } else if (available < 0) {
    panel.dataset.status = "negative";
    message.textContent = `Tus gastos superan tus ingresos por ${formatMoney(Math.abs(available))}.`;
  } else {
    panel.dataset.status = "neutral";
    message.textContent = income === 0 && expenseTotal === 0
      ? "Ingresa tus montos para calcular tu balance."
      : "Tus ingresos y gastos están en equilibrio.";
  }

  renderSummaryTable(currentBudget);
  renderDistribution(expenses, expenseTotal);
  updateSavingsSummary();
}

function renderSavings() {
  const goal = readAmount(savingsGoalField, {
    positive: true
  });
  const saved = readAmount(savingsCurrentField);
  const goalIsEmpty = savingsGoalField.value.trim() === "";
  const valid = saved !== null && (goal !== null || (goalIsEmpty && savingsGoalField.dataset.touched !== "true"));

  if (!valid) {
    const message = document.querySelector("#savings-message");
    message.textContent = "Corrige los campos marcados para ver tu progreso.";
    currentSavings = { goal: null, saved: 0, percent: null };
    document.querySelector("#savings-progress").value = 0;
    setOutput(document.querySelector("#savings-percent"), "No disponible");
    setOutput(document.querySelector("#goal-display"), "Revisa la meta");
    setOutput(document.querySelector("#current-display"), formatMoney(saved ?? 0));
    updateSavingsSummary();
    return;
  }

  const hasGoal = !goalIsEmpty && goal > 0;
  const percentage = hasGoal ? roundCents((saved / goal) * 100) : null;
  currentSavings = { goal: hasGoal ? goal : null, saved, percent: percentage };
  setOutput(document.querySelector("#goal-display"), hasGoal ? formatMoney(goal) : "Elige una meta");
  setOutput(document.querySelector("#current-display"), formatMoney(saved));

  const progress = document.querySelector("#savings-progress");
  const percentageOutput = document.querySelector("#savings-percent");
  const message = document.querySelector("#savings-message");

  if (!hasGoal) {
    progress.value = 0;
    setOutput(percentageOutput, "0%");
    message.textContent = saved > 0
      ? "Añade una meta para comparar tu ahorro actual."
      : "Ingresa una meta para ver tu progreso.";
  } else {
    progress.value = Math.min(percentage, 100);
    progress.setAttribute("aria-label", `Avance de ahorro: ${formatPercent(percentage)} de la meta`);
    setOutput(percentageOutput, formatPercent(percentage));
    message.textContent = `¡Felicitaciones! Has ahorrado el ${formatPercent(percentage)} de tu meta.`;
  }

  updateSavingsSummary();
}

function updateSavingsSummary() {
  const element = document.querySelector("#summary-savings");
  if (currentSavings.goal === null) {
    element.textContent = currentSavings.saved > 0
      ? `${formatMoney(currentSavings.saved)} ahorrados, sin meta definida`
      : "Sin meta definida";
  } else {
    element.textContent = `${formatMoney(currentSavings.saved)} de ${formatMoney(currentSavings.goal)}`;
  }
}

for (const field of [incomeField, ...expenseFields, savingsGoalField, savingsCurrentField]) {
  field.addEventListener("input", () => {
    renderBudget();
    renderSavings();
  });
}

currencyControl.addEventListener("change", () => {
  updateCurrencySymbols();
  renderBudget();
  renderSavings();
});

updateCurrencySymbols();
renderBudget();
renderSavings();
