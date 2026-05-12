/* Patrimoine Pilot — Vanilla JS SPA locale. Données privées dans localStorage. */
const STORAGE_KEY = 'patrimoinePilot.v1';

const initialState = {
  theme: 'dark',
  profile: { ageRange: '26-35 ans', monthlySalary: 3200, tmi: 30, horizon: 30, savingCapacity: 800 },
  assets: [
    { id: 'pea', name: 'PEA', opened: '2019', balance: 16700, ytd: 8.2, tax: 'PEA > 5 ans', category: 'Investi', allocation: 'World 42.9 %, S&P 29.1 %, Émergents 14.8 %, Europe 13.2 %', history: [14200,14550,14820,15100,15450,15800,16020,16240,16400,16550,16620,16700], holdings: [
      { name: 'Amundi PEA MSCI World', isin: 'LU1681043599', value: 7156 },
      { name: 'Amundi PEA S&P 500', isin: 'LU1681048804', value: 4858 },
      { name: 'Amundi PEA MSCI Émergents ESG', isin: 'LU2008215762', value: 2471 },
      { name: 'BNP Easy Stoxx Europe 600', isin: 'LU1437018838', value: 2206 }
    ]},
    { id: 'livretA', name: 'Livret A', opened: '—', balance: 22700, ytd: 3.0, tax: 'Exonéré', category: 'Cash', allocation: 'Cash garanti', history: [22500,22600,22600,22650,22650,22700,22700,22700,22700,22700,22700,22700] },
    { id: 'avBnp', name: 'AV BNP Multiplacements Avenir', opened: '2008', balance: 172, ytd: 1.2, tax: 'AV > 8 ans', category: 'Investi', allocation: 'Ancien contrat', history: [165,166,167,168,168,169,170,170,171,171,172,172] },
    { id: 'per', name: 'PER', opened: '—', balance: 1000, ytd: 4.5, tax: 'Déductible TMI 30 %', category: 'Retraite', allocation: 'Long terme', history: [0,0,0,200,300,400,500,600,700,800,900,1000] },
    { id: 'current', name: 'Compte courant', opened: '—', balance: 1200, ytd: 0, tax: 'Disponible', category: 'Cash', allocation: 'Trésorerie', history: [1800,1700,1600,1500,1400,1350,1300,1280,1250,1220,1210,1200] },
    { id: 'property', name: 'Appartement', opened: '—', balance: 200000, ytd: 0, tax: 'Immo / LMNP futur', category: 'Immobilier', allocation: 'Valeur vénale', history: [195000,195000,196000,196000,197000,197000,198000,198000,199000,199000,200000,200000] }
  ],
  debts: [
    { id: 'mortgage', name: 'Crédit immobilier restant', amount: 92000, monthly: 690 },
    { id: 'ptz', name: 'PTZ', amount: 54000, monthly: 0 }
  ],
  realEstate: { futureRent: 900, charges: 100, propertyTax: 100 },
  targets: { per: 300, pea: 250, avModern: 200, avBnp: 50 },
  actualContributions: { per: 300, pea: 250, avModern: 0, avBnp: 50 },
  checklist: {},
  projection: { monthly: 800, returnRate: 7, horizon: 30, annualIncrease: 2 },
  snapshots: []
};

const checklistGroups = [
  { id: 'week', title: '🔥 Cette semaine', items: ['Analyser impact PTZ avant location', 'Comparer Lucya Cardif', 'Vérifier frais AV BNP', 'Recaler budget mensuel'] },
  { id: 'month', title: '📅 Ce mois', items: ['Ouvrir ou alimenter PER', 'Mettre en place virements auto', 'Versement PER 3 800 €', 'Étudier transfert PACTE', 'Souscrire PNO'] },
  { id: 'threeMonths', title: '📆 Dans 3 mois', items: ['Choisir expert-comptable LMNP', 'Finaliser meubles', 'Trouver locataire', 'Démarches INPI', 'Comparer GLI'] },
  { id: 'year', title: "🗓️ Dans l'année", items: ['Déclaration LMNP', 'Bilan patrimonial annuel', 'Point CGP', 'Revue allocation cible'] }
];

let state = loadState();
let charts = {};
const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });

function loadState() {
  try { return { ...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return structuredClone(initialState); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function liquidAssets() { return state.assets.filter(a => a.id !== 'property').reduce((s, a) => s + Number(a.balance), 0); }
function totalAssets() { return state.assets.reduce((s, a) => s + Number(a.balance), 0); }
function totalDebts() { return state.debts.reduce((s, d) => s + Number(d.amount), 0); }
function netWorth() { return totalAssets() - totalDebts(); }
function totalTargets() { return Object.values(state.targets).reduce((s, v) => s + Number(v), 0); }
function investedAssets() { return state.assets.filter(a => ['Investi','Retraite'].includes(a.category)).reduce((s, a) => s + Number(a.balance), 0); }
function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }
function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function init() {
  document.documentElement.classList.toggle('light', state.theme === 'light');
  bindNavigation();
  bindActions();
  renderAll();
}

function bindNavigation() {
  document.querySelectorAll('[data-page], [data-page-jump]').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page || btn.dataset.pageJump)));
}
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelector(`#page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  const label = document.querySelector(`.nav-item[data-page="${page}"] span`)?.textContent || 'Paramètres';
  document.getElementById('pageTitle').textContent = label;
  setTimeout(() => renderCharts(), 0);
}

function bindActions() {
  document.getElementById('saveSnapshotBtn').addEventListener('click', () => {
    const now = new Date();
    state.snapshots.push({ date: now.toISOString().slice(0, 10), netWorth: netWorth(), totalAssets: totalAssets(), debts: totalDebts() });
    state.snapshots = state.snapshots.slice(-24);
    saveState(); renderAll();
  });
  document.getElementById('monthlyUpdateBtn').addEventListener('click', () => {
    state.assets.forEach(a => { a.history = [...(a.history || []).slice(-11), Number(a.balance)]; });
    saveState(); renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', exportJson);
  document.getElementById('importInput').addEventListener('change', importJson);
  document.getElementById('resetBtn').addEventListener('click', () => { if (confirm('Réinitialiser toutes les données locales ?')) { state = structuredClone(initialState); saveState(); renderAll(); } });
  document.getElementById('themeBtn').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; saveState(); document.documentElement.classList.toggle('light', state.theme === 'light'); renderCharts(); });
}

function renderAll() {
  saveState();
  renderKpis(); renderAlerts(); renderAssetsTable(); renderGoals(); renderChecklist(); renderSettings(); renderProjectionControls(); renderCharts();
  if (window.lucide) lucide.createIcons();
}

function renderKpis() {
  document.getElementById('netWorthKpi').textContent = euro.format(netWorth());
  document.getElementById('totalAssetsKpi').textContent = euro.format(totalAssets());
  document.getElementById('totalDebtKpi').textContent = euro.format(totalDebts());
  document.getElementById('savingsKpi').textContent = euro.format(totalTargets());
  const prev = state.snapshots.at(-2)?.netWorth || netWorth() - totalTargets();
  document.getElementById('netWorthDelta').textContent = `${euro.format(netWorth() - prev)} vs dernier point`;
}

function getAlerts() {
  const alerts = [];
  const cash = state.assets.find(a => a.id === 'livretA')?.balance || 0;
  if (cash > 15000) alerts.push({ level: 'orange', title: 'Cash élevé sur Livret A', text: 'Redéploiement prévu : 12 700 € sur 12 mois.' });
  if ((state.actualContributions.avModern || 0) < state.targets.avModern) alerts.push({ level: 'red', title: 'AV moderne non alimentée', text: 'Objectif mensuel : 200 €. Action à traiter.' });
  if (state.targets.per * 12 >= 3600) alerts.push({ level: 'green', title: 'PER cohérent avec plafond', text: `Économie fiscale annuelle estimée : ${euro.format(state.targets.per * 12 * state.profile.tmi / 100)}.` });
  if (state.realEstate.futureRent - state.realEstate.charges - state.realEstate.propertyTax - 690 > 0) alerts.push({ level: 'green', title: 'Cash-flow LMNP futur positif', text: 'Après mensualité, charges et taxe foncière.' });
  return alerts;
}
function renderAlerts() {
  const alerts = getAlerts();
  document.getElementById('alertCount').textContent = `${alerts.length} alertes`;
  document.getElementById('alertsList').innerHTML = alerts.map(a => `<div class="alert ${a.level}"><strong>${a.title}</strong><span>${a.text}</span></div>`).join('');
}

function renderAssetsTable() {
  const tbody = document.getElementById('assetsTable');
  tbody.innerHTML = state.assets.map(a => {
    const share = a.balance / totalAssets();
    return `<tr>
      <td data-label="Enveloppe"><strong>${a.name}</strong></td>
      <td data-label="Ouverture">${a.opened}</td>
      <td data-label="Solde"><input type="number" value="${a.balance}" data-asset-balance="${a.id}" aria-label="Solde ${a.name}"></td>
      <td data-label="Allocation">${a.allocation}</td>
      <td data-label="% patrimoine">${pct.format(share)}</td>
      <td data-label="YTD">${a.ytd.toFixed(1)} %</td>
      <td data-label="Fiscalité">${a.tax}</td>
      <td data-label="Historique"><canvas class="sparkline" id="spark-${a.id}" width="112" height="32"></canvas></td>
    </tr>`;
  }).join('');
  document.querySelectorAll('[data-asset-balance]').forEach(input => input.addEventListener('change', e => {
    const asset = state.assets.find(a => a.id === e.target.dataset.assetBalance);
    asset.balance = Number(e.target.value || 0); saveState(); renderAll();
  }));
}

function renderGoals() {
  const actual = state.actualContributions;
  const targets = state.targets;
  const rows = [ ['PER', 'per'], ['PEA', 'pea'], ['AV moderne', 'avModern'], ['AV BNP', 'avBnp'] ];
  document.getElementById('goalsList').innerHTML = rows.map(([label, key]) => goalRow(label, actual[key] || 0, targets[key] || 0)).join('');
  const perAnnual = targets.per * 12;
  const taxSaved = perAnnual * state.profile.tmi / 100;
  const pea = state.assets.find(a => a.id === 'pea').balance;
  document.getElementById('ceilingsList').innerHTML = [
    goalRow('PER annuel', perAnnual, 3840, `${euro.format(taxSaved)} économie impôt`),
    goalRow('PEA', pea, 150000, 'Plafond versements indicatif'),
    goalRow('AV abattement', 0, 4600, 'Abattement annuel après 8 ans'),
    goalRow('Redéploiement Livret A', 0, 12700, 'Sur 12 mois')
  ].join('');
}
function goalRow(label, value, target, note = '') {
  const ratio = target ? Math.min(value / target, 1) * 100 : 0;
  return `<div class="goal-row"><header><strong>${label}</strong><span>${euro.format(value)} / ${euro.format(target)}</span></header><div class="progress"><span style="width:${ratio}%"></span></div><small>${note || Math.round(ratio) + ' % atteint'}</small></div>`;
}

function renderChecklist() {
  let done = 0, total = 0;
  const html = checklistGroups.map(group => {
    const items = group.items.map((item, idx) => {
      const key = `${group.id}-${idx}`; const checked = !!state.checklist[key]; total++; if (checked) done++;
      return `<label><input type="checkbox" ${checked ? 'checked' : ''} data-check="${key}"><span>${item}</span></label>`;
    }).join('');
    return `<article class="card check-card"><h2>${group.title}</h2>${items}</article>`;
  }).join('');
  document.getElementById('checklistGroups').innerHTML = html;
  const progress = total ? Math.round(done / total * 100) : 0;
  document.getElementById('checklistProgress').textContent = `${progress} %`;
  document.getElementById('checklistProgressBar').style.width = `${progress}%`;
  document.querySelectorAll('[data-check]').forEach(cb => cb.addEventListener('change', e => { state.checklist[e.target.dataset.check] = e.target.checked; saveState(); renderChecklist(); }));
}

function renderSettings() {
  const profileFields = [ ['monthlySalary','Salaire net mensuel'], ['tmi','TMI (%)'], ['horizon','Horizon (années)'], ['savingCapacity','Capacité épargne'] ];
  document.getElementById('profileForm').innerHTML = profileFields.map(([key,label]) => field(label, key, state.profile[key], 'profile')).join('');
  const targetFields = [ ['per','PER'], ['pea','PEA'], ['avModern','AV moderne'], ['avBnp','AV BNP'] ];
  document.getElementById('targetsForm').innerHTML = targetFields.map(([key,label]) => field(label, key, state.targets[key], 'targets')).join('');
  document.querySelectorAll('[data-form-field]').forEach(input => input.addEventListener('change', e => {
    state[e.target.dataset.scope][e.target.dataset.formField] = Number(e.target.value || 0); saveState(); renderAll();
  }));
}
function field(label, key, value, scope) { return `<div class="field"><label>${label}</label><input type="number" value="${value}" data-scope="${scope}" data-form-field="${key}"></div>`; }

function renderProjectionControls() {
  const controls = [ ['monthly','Versement mensuel', 0, 3000, '€'], ['returnRate','Rendement annuel', 0, 12, '%'], ['horizon','Horizon', 1, 40, 'ans'], ['annualIncrease','Hausse annuelle versements', 0, 8, '%'] ];
  document.getElementById('projectionControls').innerHTML = controls.map(([key,label,min,max,suffix]) => `<div class="control-row"><header><strong>${label}</strong><span id="val-${key}">${state.projection[key]} ${suffix}</span></header><input type="range" min="${min}" max="${max}" step="${key==='returnRate'||key==='annualIncrease' ? .1 : 1}" value="${state.projection[key]}" data-projection="${key}"></div>`).join('');
  document.querySelectorAll('[data-projection]').forEach(input => input.addEventListener('input', e => { state.projection[e.target.dataset.projection] = Number(e.target.value); document.getElementById(`val-${e.target.dataset.projection}`).textContent = `${e.target.value} ${e.target.dataset.projection === 'monthly' ? '€' : e.target.dataset.projection === 'horizon' ? 'ans' : '%'}`; saveState(); renderProjectionResults(); renderProjectionChart(); }));
  renderProjectionResults();
}

function projectionSeries() {
  const p = state.projection; let capital = netWorth(); let monthly = p.monthly; const arr = [{ year: 0, capital }];
  for (let y = 1; y <= p.horizon; y++) { for (let m = 0; m < 12; m++) capital = (capital + monthly) * (1 + p.returnRate / 100 / 12); arr.push({ year: y, capital }); monthly *= (1 + p.annualIncrease / 100); }
  return arr;
}
function renderProjectionResults() {
  const arr = projectionSeries(); const last = arr.at(-1); const million = arr.find(x => x.capital >= 1000000);
  document.getElementById('millionDate').textContent = million ? `Dans ${million.year} ans` : 'Non atteint';
  document.getElementById('projectedCapital').textContent = euro.format(last.capital);
  document.getElementById('retirementIncome').textContent = euro.format(last.capital * .04);
  document.getElementById('taxSavingsProjected').textContent = euro.format(state.targets.per * 12 * state.profile.tmi / 100 * state.projection.horizon);
}

function renderCharts() {
  if (!window.Chart) return;
  renderAllocationChart(); renderMiniCharts(); renderPerformanceCharts(); renderGoalsCharts(); renderProjectionChart(); renderSparklines();
}
function isMobileViewport() { return window.matchMedia('(max-width: 640px)').matches; }
function baseOptions() {
  const mobile = isMobileViewport();
  return {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 120,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: mobile ? 'bottom' : 'top',
        labels: { color: cssVar('--muted'), boxWidth: mobile ? 10 : 14, font: { size: mobile ? 10 : 12 } }
      }
    },
    scales: {
      x: { ticks: { color: cssVar('--muted'), maxRotation: 0, autoSkip: true, maxTicksLimit: mobile ? 5 : 8, font: { size: mobile ? 10 : 12 } }, grid: { color: 'rgba(148,163,184,.08)' } },
      y: { ticks: { color: cssVar('--muted'), maxTicksLimit: mobile ? 4 : 6, font: { size: mobile ? 10 : 12 } }, grid: { color: 'rgba(148,163,184,.08)' } }
    }
  };
}
function renderAllocationChart() {
  const el = document.getElementById('allocationChart'); if (!el) return; destroyChart('allocationChart');
  const groups = ['Cash','Investi','Retraite','Immobilier'];
  charts.allocationChart = new Chart(el, { type: 'doughnut', data: { labels: groups, datasets: [{ data: groups.map(g => state.assets.filter(a => a.category === g).reduce((s,a)=>s+a.balance,0)), borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, resizeDelay: 120, plugins: { legend: { position: 'bottom', labels: { color: cssVar('--muted'), boxWidth: isMobileViewport() ? 10 : 14, font: { size: isMobileViewport() ? 10 : 12 } } } } } });
}
function renderMiniCharts() {
  const labels = ['M-11','M-10','M-9','M-8','M-7','M-6','M-5','M-4','M-3','M-2','M-1','M'];
  destroyChart('netWorthMiniChart');
  const summed = labels.map((_, i) => state.assets.reduce((s,a)=>s+(a.history?.[i] || a.balance),0) - totalDebts());
  charts.netWorthMiniChart = new Chart(document.getElementById('netWorthMiniChart'), { type: 'line', data: { labels, datasets: [{ label: 'Patrimoine net', data: summed, tension: .35, fill: true }] }, options: baseOptions() });
  destroyChart('monthlyContribChart');
  charts.monthlyContribChart = new Chart(document.getElementById('monthlyContribChart'), { type: 'bar', data: { labels: Object.keys(state.targets), datasets: [{ label: 'Objectif', data: Object.values(state.targets) }, { label: 'Réel', data: Object.values(state.actualContributions) }] }, options: baseOptions() });
}
function renderPerformanceCharts() {
  document.getElementById('irrMetric').textContent = '6,8 %';
  document.getElementById('ytdMetric').textContent = `${(state.assets.reduce((s,a)=>s+a.ytd*a.balance,0)/totalAssets()).toFixed(1)} %`;
  document.getElementById('drawdownMetric').textContent = '-8,5 %';
  const labels = ['M-11','M-10','M-9','M-8','M-7','M-6','M-5','M-4','M-3','M-2','M-1','M'];
  [['wealthChart','line'],['envelopeChart','bar'],['allocationTimeChart','line'],['benchmarkChart','line']].forEach(([id]) => destroyChart(id));
  charts.wealthChart = new Chart(document.getElementById('wealthChart'), { type: 'line', data: { labels, datasets: [{ label: 'Net worth', data: labels.map((_,i)=>state.assets.reduce((s,a)=>s+(a.history?.[i]||0),0)-totalDebts()), tension:.35 }] }, options: baseOptions() });
  charts.envelopeChart = new Chart(document.getElementById('envelopeChart'), { type: 'bar', data: { labels: state.assets.map(a=>a.name), datasets: [{ label: 'Solde', data: state.assets.map(a=>a.balance) }] }, options: baseOptions() });
  charts.allocationTimeChart = new Chart(document.getElementById('allocationTimeChart'), { type: 'line', data: { labels, datasets: [{ label: 'Investi', data: labels.map((_,i)=>state.assets.filter(a=>['Investi','Retraite'].includes(a.category)).reduce((s,a)=>s+(a.history?.[i]||0),0)), tension:.35 }, { label: 'Cash', data: labels.map((_,i)=>state.assets.filter(a=>a.category==='Cash').reduce((s,a)=>s+(a.history?.[i]||0),0)), tension:.35 }] }, options: baseOptions() });
  charts.benchmarkChart = new Chart(document.getElementById('benchmarkChart'), { type: 'line', data: { labels, datasets: [{ label: 'Portefeuille', data: labels.map((_,i)=>100+i*1.1+(i>7?i*.25:0)), tension:.35 }, { label: 'MSCI World simulé', data: labels.map((_,i)=>100+i*1.25), tension:.35 }] }, options: baseOptions() });
}
function renderGoalsCharts() {
  const el = document.getElementById('livretRedeployChart'); if (!el) return; destroyChart('livretRedeployChart');
  const labels = Array.from({length: 13}, (_, i) => `M+${i}`); const start = 12700;
  charts.livretRedeployChart = new Chart(el, { type: 'line', data: { labels, datasets: [{ label: 'Cash à redéployer', data: labels.map((_,i)=>Math.max(start - start/12*i,0)), tension:.35, fill:true }] }, options: baseOptions() });
}
function renderProjectionChart() {
  if (!window.Chart) return; const el = document.getElementById('projectionChart'); if (!el) return; destroyChart('projectionChart'); const arr = projectionSeries();
  charts.projectionChart = new Chart(el, { type: 'line', data: { labels: arr.map(x => `A${x.year}`), datasets: [{ label: 'Capital projeté', data: arr.map(x => Math.round(x.capital)), tension:.28, fill:true }] }, options: baseOptions() });
}
function renderSparklines() {
  state.assets.forEach(a => {
    const el = document.getElementById(`spark-${a.id}`); if (!el) return; destroyChart(`spark-${a.id}`);
    charts[`spark-${a.id}`] = new Chart(el, { type: 'line', data: { labels: a.history.map((_,i)=>i), datasets: [{ data: a.history, tension:.35, pointRadius:0, borderWidth:2 }] }, options: { responsive:false, plugins:{legend:{display:false}, tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}} } });
  });
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `patrimoine-pilot-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
}
function importJson(e) {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { try { state = { ...initialState, ...JSON.parse(reader.result) }; saveState(); renderAll(); alert('Import terminé.'); } catch { alert('Fichier JSON invalide.'); } };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', init);
