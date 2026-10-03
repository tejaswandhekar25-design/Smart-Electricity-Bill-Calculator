// ==================== STATE ====================
let usageHistory = JSON.parse(localStorage.getItem('usageHistory') || '[]');
let appliances = JSON.parse(localStorage.getItem('appliances') || '[]');
let charts = {};

// ==================== SLAB RATES (Indian States) ====================
const SLAB_RATES = {
  maharashtra: {
    residential: [
      { limit: 100, rate: 4.71, label: '0-100' },
      { limit: 200, rate: 7.55, label: '101-300' },
      { limit: 200, rate: 10.07, label: '301-500' },
      { limit: Infinity, rate: 12.58, label: '500+' }
    ],
    commercial: [
      { limit: 100, rate: 8.5, label: '0-100' },
      { limit: 200, rate: 10.0, label: '101-300' },
      { limit: Infinity, rate: 12.5, label: '300+' }
    ],
    fixedCharge: 100,
    taxRate: 0.16,
    dutyRate: 0.10
  },
  delhi: {
    residential: [
      { limit: 200, rate: 3.0, label: '0-200' },
      { limit: 200, rate: 4.5, label: '201-400' },
      { limit: 400, rate: 6.5, label: '401-800' },
      { limit: Infinity, rate: 7.75, label: '800+' }
    ],
    commercial: [
      { limit: 200, rate: 7.75, label: '0-200' },
      { limit: Infinity, rate: 9.0, label: '200+' }
    ],
    fixedCharge: 50,
    taxRate: 0.08,
    dutyRate: 0.05
  },
  karnataka: {
    residential: [
      { limit: 50, rate: 4.10, label: '0-50' },
      { limit: 50, rate: 5.45, label: '51-100' },
      { limit: 100, rate: 6.80, label: '101-200' },
      { limit: Infinity, rate: 8.15, label: '200+' }
    ],
    commercial: [
      { limit: 100, rate: 7.90, label: '0-100' },
      { limit: Infinity, rate: 9.50, label: '100+' }
    ],
    fixedCharge: 75,
    taxRate: 0.09,
    dutyRate: 0.06
  },
  tamilnadu: {
    residential: [
      { limit: 100, rate: 0, label: '0-100 (Free)' },
      { limit: 100, rate: 2.50, label: '101-200' },
      { limit: 100, rate: 4.00, label: '201-300' },
      { limit: 200, rate: 6.00, label: '301-500' },
      { limit: Infinity, rate: 8.00, label: '500+' }
    ],
    commercial: [
      { limit: 200, rate: 6.50, label: '0-200' },
      { limit: Infinity, rate: 8.50, label: '200+' }
    ],
    fixedCharge: 30,
    taxRate: 0.05,
    dutyRate: 0.05
  },
  up: {
    residential: [
      { limit: 100, rate: 3.50, label: '0-100' },
      { limit: 50, rate: 4.00, label: '101-150' },
      { limit: 100, rate: 5.00, label: '151-250' },
      { limit: Infinity, rate: 6.50, label: '250+' }
    ],
    commercial: [
      { limit: 200, rate: 7.00, label: '0-200' },
      { limit: Infinity, rate: 8.50, label: '200+' }
    ],
    fixedCharge: 70,
    taxRate: 0.05,
    dutyRate: 0.04
  }
};

const AVG_RATE = 6.5; // Approximate average rate for appliance cost calc

// ==================== NAVIGATION ====================
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    const section = document.getElementById('section-' + tab.dataset.section);
    section.classList.add('active');

    // Refresh charts when switching
    if (tab.dataset.section === 'usage') updateUsageCharts();
    if (tab.dataset.section === 'prediction') updatePrediction();
    if (tab.dataset.section === 'appliances') updateApplianceChart();
  });
});

// ==================== BILL CALCULATION ====================
function calculateBill() {
  const state = document.getElementById('stateSelect').value;
  const type = document.getElementById('consumerType').value;
  const units = parseFloat(document.getElementById('unitsConsumed').value);
  const load = parseFloat(document.getElementById('sanctionedLoad').value) || 3;

  if (!units || units <= 0) {
    alert('Please enter valid units consumed!');
    return;
  }

  const rateData = SLAB_RATES[state];
  const slabs = rateData[type];
  let remaining = units;
  let energyCharge = 0;
  const breakdown = [];

  slabs.forEach((slab, i) => {
    if (remaining <= 0) {
      breakdown.push({ label: slab.label, units: 0, rate: slab.rate, amount: 0 });
      return;
    }
    const used = Math.min(remaining, slab.limit);
    const amount = used * slab.rate;
    energyCharge += amount;
    remaining -= used;
    breakdown.push({ label: slab.label, units: used, rate: slab.rate, amount });
  });

  const fixedCharge = rateData.fixedCharge * load;
  const subtotal = energyCharge + fixedCharge;
  const tax = subtotal * rateData.taxRate;
  const duty = subtotal * rateData.dutyRate;
  const total = subtotal + tax + duty;

  // Display results
  document.getElementById('billPlaceholder').style.display = 'none';
  document.getElementById('billResult').classList.add('show');

  animateValue('totalAmount', 0, Math.round(total), 800);

  document.getElementById('billStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-value electric">${units}</div>
      <div class="stat-label">Units</div>
    </div>
    <div class="stat-card">
      <div class="stat-value volt">₹${Math.round(energyCharge)}</div>
      <div class="stat-label">Energy</div>
    </div>
    <div class="stat-card">
      <div class="stat-value warn">₹${Math.round(fixedCharge)}</div>
      <div class="stat-label">Fixed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value energy">₹${Math.round(tax + duty)}</div>
      <div class="stat-label">Tax+Duty</div>
    </div>
  `;

  const maxUnits = Math.max(...breakdown.map(b => b.units));
  const colors = ['#00d4ff', '#7c3aed', '#f59e0b', '#ef4444', '#ec4899'];
  document.getElementById('slabBody').innerHTML = breakdown.map((b, i) => `
    <tr>
      <td><span class="badge badge-electric">${b.label}</span></td>
      <td>${b.units} kWh</td>
      <td>₹${b.rate.toFixed(2)}</td>
      <td>₹${b.amount.toFixed(2)}</td>
      <td>
        <div class="slab-bar">
          <div class="slab-bar-fill" style="width:${maxUnits ? (b.units / maxUnits * 100) : 0}%; background:${colors[i % colors.length]};"></div>
        </div>
      </td>
    </tr>
  `).join('');

  // Auto-log to history
  const month = document.getElementById('billingMonth').value;
  if (month) {
    const existing = usageHistory.findIndex(h => h.month === month);
    const entry = { month, units, bill: Math.round(total) };
    if (existing >= 0) usageHistory[existing] = entry;
    else usageHistory.push(entry);
    usageHistory.sort((a, b) => a.month.localeCompare(b.month));
    saveData();
  }
}

// ==================== USAGE TRACKING ====================
function logUsageData() {
  const month = document.getElementById('logMonth').value;
  const units = parseFloat(document.getElementById('logUnits').value);
  if (!month || !units) { alert('Please fill in both fields!'); return; }

  const state = document.getElementById('stateSelect').value;
  const bill = calcBillForUnits(units, state);

  const existing = usageHistory.findIndex(h => h.month === month);
  const entry = { month, units, bill };
  if (existing >= 0) usageHistory[existing] = entry;
  else usageHistory.push(entry);

  usageHistory.sort((a, b) => a.month.localeCompare(b.month));
  saveData();
  updateUsageCharts();
  document.getElementById('logMonth').value = '';
  document.getElementById('logUnits').value = '';
}

function loadSampleData() {
  const months = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05'];
  const units = [280, 320, 340, 250, 180, 160, 150, 170, 220, 300, 350];
  const state = document.getElementById('stateSelect').value;

  usageHistory = months.map((m, i) => ({
    month: m,
    units: units[i],
    bill: calcBillForUnits(units[i], state)
  }));
  saveData();
  updateUsageCharts();
}

function calcBillForUnits(units, state) {
  const rateData = SLAB_RATES[state];
  const slabs = rateData.residential;
  let remaining = units;
  let energy = 0;
  slabs.forEach(slab => {
    if (remaining <= 0) return;
    const used = Math.min(remaining, slab.limit);
    energy += used * slab.rate;
    remaining -= used;
  });
  const fixed = rateData.fixedCharge * 3;
  const sub = energy + fixed;
  return Math.round(sub * (1 + rateData.taxRate + rateData.dutyRate));
}

function updateUsageCharts() {
  if (usageHistory.length === 0) return;

  const labels = usageHistory.map(h => formatMonth(h.month));
  const unitsData = usageHistory.map(h => h.units);
  const billData = usageHistory.map(h => h.bill);

  // Stats
  const avgU = Math.round(unitsData.reduce((a, b) => a + b, 0) / unitsData.length);
  const avgB = Math.round(billData.reduce((a, b) => a + b, 0) / billData.length);
  const minIdx = unitsData.indexOf(Math.min(...unitsData));
  const maxIdx = unitsData.indexOf(Math.max(...unitsData));

  document.getElementById('avgUnits').textContent = avgU;
  document.getElementById('avgBill').textContent = '₹' + avgB;
  document.getElementById('lowestMonth').textContent = labels[minIdx];
  document.getElementById('highestMonth').textContent = labels[maxIdx];

  // Units chart
  if (charts.usage) charts.usage.destroy();
  charts.usage = new Chart(document.getElementById('usageChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Units (kWh)',
        data: unitsData,
        backgroundColor: unitsData.map(u => u > 300 ? 'rgba(239,68,68,0.6)' : u > 200 ? 'rgba(245,158,11,0.6)' : 'rgba(0,212,255,0.6)'),
        borderColor: unitsData.map(u => u > 300 ? '#ef4444' : u > 200 ? '#f59e0b' : '#00d4ff'),
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: chartOptions('Units (kWh)')
  });

  // Bill chart
  if (charts.bill) charts.bill.destroy();
  charts.bill = new Chart(document.getElementById('billChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Bill (₹)',
        data: billData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: chartOptions('Amount (₹)')
  });
}

// ==================== PREDICTION ====================
function updatePrediction() {
  if (usageHistory.length < 3) {
    document.getElementById('predictedBill').textContent = '—';
    document.getElementById('predictedUnits').textContent = '—';
    document.getElementById('predTrend').textContent = 'Need more data';
    document.getElementById('predictionNote').textContent = 'Add at least 3 months of usage data for prediction';
    return;
  }

  const units = usageHistory.map(h => h.units);
  const n = units.length;

  // Simple linear regression
  const xMean = (n - 1) / 2;
  const yMean = units.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  units.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  // Moving average component
  const last3Avg = units.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const regression = slope * n + intercept;
  const predicted = Math.round((regression + last3Avg) / 2);
  const clampedPredicted = Math.max(predicted, 50);

  const state = document.getElementById('stateSelect').value;
  const predBill = calcBillForUnits(clampedPredicted, state);

  document.getElementById('predictedBill').textContent = '₹' + predBill;
  document.getElementById('predictedUnits').textContent = clampedPredicted;

  const lastUnit = units[n - 1];
  const diff = clampedPredicted - lastUnit;
  const pct = ((diff / lastUnit) * 100).toFixed(1);
  const trendEl = document.getElementById('predTrend');

  if (diff > 0) {
    trendEl.innerHTML = `<span style="color:var(--accent-danger)">📈 +${pct}%</span>`;
  } else if (diff < 0) {
    trendEl.innerHTML = `<span style="color:var(--accent-energy)">📉 ${pct}%</span>`;
  } else {
    trendEl.innerHTML = `<span style="color:var(--accent-electric)">➡️ Stable</span>`;
  }

  document.getElementById('predictionNote').textContent =
    `Based on ${n} months of data using linear regression + moving average`;

  // Trend chart
  const labels = usageHistory.map(h => formatMonth(h.month));
  const nextMonth = getNextMonth(usageHistory[n - 1].month);
  labels.push(formatMonth(nextMonth) + ' (Est)');

  const actualData = [...units, null];
  const trendData = units.map((_, i) => Math.round(slope * i + intercept));
  trendData.push(clampedPredicted);

  if (charts.trend) charts.trend.destroy();
  charts.trend = new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Actual',
          data: actualData,
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#00d4ff'
        },
        {
          label: 'Trend',
          data: trendData,
          borderColor: '#7c3aed',
          borderDash: [8, 4],
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#7c3aed'
        }
      ]
    },
    options: chartOptions('Units (kWh)')
  });
}

// ==================== APPLIANCE CALCULATOR ====================
document.getElementById('applianceName').addEventListener('change', function() {
  const isCustom = this.value === '⚙️|Custom';
  document.getElementById('customApplianceFields').style.display = isCustom ? 'block' : 'none';
});

function addAppliance() {
  const select = document.getElementById('applianceName');
  const qty = parseInt(document.getElementById('applianceQty').value) || 1;
  const hours = parseFloat(document.getElementById('applianceHours').value) || 4;
  let emoji, name, watts;

  if (select.value === '⚙️|Custom') {
    const v = parseFloat(document.getElementById('voltageInput').value) || 230;
    const i = parseFloat(document.getElementById('currentInput').value);
    name = document.getElementById('customName').value || 'Custom';
    if (!i) { alert('Please enter current (Amperes)!'); return; }
    watts = Math.round(v * i);
    emoji = '⚙️';
  } else {
    const parts = select.value.split('|');
    emoji = parts[0];
    name = parts[1];
    watts = parseInt(parts[2]);
  }

  appliances.push({ id: Date.now(), emoji, name, watts, qty, hours });
  saveData();
  renderAppliances();
}

function removeAppliance(id) {
  appliances = appliances.filter(a => a.id !== id);
  saveData();
  renderAppliances();
}

function renderAppliances() {
  const list = document.getElementById('applianceList');
  const summary = document.getElementById('applianceSummary');
  const chartCard = document.getElementById('applianceChartCard');

  if (appliances.length === 0) {
    list.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">
      <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔌</div>
      <p>Add appliances to see their<br>power consumption breakdown</p>
    </div>`;
    summary.style.display = 'none';
    chartCard.hidden = true;
    document.getElementById('applianceCount').textContent = '0 items';
    return;
  }

  document.getElementById('applianceCount').textContent = appliances.length + ' items';

  let totalW = 0, totalDailyKwh = 0;
  const rendered = appliances.map(a => {
    const power = a.watts * a.qty;
    const dailyKwh = (power * a.hours) / 1000;
    const monthlyCost = dailyKwh * 30 * AVG_RATE;
    totalW += power;
    totalDailyKwh += dailyKwh;

    return `<div class="appliance-item">
      <span class="appliance-emoji">${a.emoji}</span>
      <div>
        <div class="appliance-name">${a.name} ${a.qty > 1 ? '×' + a.qty : ''}</div>
        <div style="font-size:0.75rem; color:var(--text-muted)">${a.hours}h/day</div>
      </div>
      <span class="appliance-watts">${power}W</span>
      <span class="appliance-cost">₹${Math.round(monthlyCost)}/mo</span>
      <button class="appliance-remove" onclick="removeAppliance(${a.id})">✕</button>
    </div>`;
  });

  list.innerHTML = rendered.join('');
  summary.style.display = 'block';
  chartCard.hidden = false;

  const totalMonthlyUnits = Math.round(totalDailyKwh * 30);
  const state = document.getElementById('stateSelect').value;
  const totalMonthlyCost = calcBillForUnits(totalMonthlyUnits, state);

  document.getElementById('totalWatts').textContent = totalW + 'W';
  document.getElementById('totalMonthlyCost').textContent = '₹' + totalMonthlyCost;
  document.getElementById('totalUnitsMonth').textContent = totalMonthlyUnits;
  document.getElementById('dailyUnits').textContent = totalDailyKwh.toFixed(1);

  updateApplianceChart();
}

function updateApplianceChart() {
  if (appliances.length === 0) return;

  const data = appliances.map(a => ({
    label: a.name,
    value: (a.watts * a.qty * a.hours) / 1000
  }));

  const colors = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  if (charts.appliance) charts.appliance.destroy();
  charts.appliance = new Chart(document.getElementById('applianceChart'), {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: data.map((_, i) => colors[i % colors.length] + '80'),
        borderColor: data.map((_, i) => colors[i % colors.length]),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16 }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(2)} kWh/day`
          }
        }
      }
    }
  });
}

// ==================== HELPERS ====================
function chartOptions(yLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: '#64748b', font: { family: 'Inter' } },
        grid: { color: 'rgba(255,255,255,0.03)' }
      },
      y: {
        ticks: { color: '#64748b', font: { family: 'Inter' } },
        grid: { color: 'rgba(255,255,255,0.05)' },
        title: { display: true, text: yLabel, color: '#64748b' }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter' } }
      }
    }
  };
}

function formatMonth(str) {
  if (!str) return '';
  const [y, m] = str.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[parseInt(m) - 1] + ' ' + y.slice(2);
}

function getNextMonth(str) {
  const [y, m] = str.split('-').map(Number);
  if (m === 12) return (y + 1) + '-01';
  return y + '-' + String(m + 1).padStart(2, '0');
}

function animateValue(id, start, end, duration) {
  const el = document.getElementById(id);
  const range = end - start;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + range * eased).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function saveData() {
  localStorage.setItem('usageHistory', JSON.stringify(usageHistory));
  localStorage.setItem('appliances', JSON.stringify(appliances));
}

// ==================== INIT ====================
(function init() {
  // Set default billing month
  const now = new Date();
  const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('billingMonth').value = monthStr;

  // Render saved appliances
  renderAppliances();

  // If we have usage data, show charts
  if (usageHistory.length > 0) {
    updateUsageCharts();
    updatePrediction();
  }
})();
