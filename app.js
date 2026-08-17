const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function val(id) { return Number(document.getElementById(id)?.value || 0); }

// Tool switching
const tabs = [...document.querySelectorAll('.tool-tab')];
const panels = [...document.querySelectorAll('.tool-panel')];
function activateTool(id, shouldScroll = false) {
  tabs.forEach(tab => {
    const active = tab.dataset.tool === id;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  panels.forEach(panel => {
    const active = panel.dataset.panel === id;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
  if (shouldScroll) document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
tabs.forEach(tab => tab.addEventListener('click', () => activateTool(tab.dataset.tool)));

// Allow deep links in pathway cards to open the correct tool.
document.querySelectorAll('a[href$="-tool"]').forEach(link => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href').slice(1);
    if (panels.some(p => p.id === id)) {
      event.preventDefault();
      activateTool(id, true);
      history.replaceState(null, '', `#${id}`);
    }
  });
});

// Freelance rate planner
function updateRate() {
  const income = val('target-income');
  const costs = val('business-costs');
  const weeks = Math.max(1, val('working-weeks'));
  const weekly = Math.max(1, val('weekly-hours'));
  const utilisation = clamp(val('utilisation'), 1, 100) / 100;
  const buffer = clamp(val('buffer'), 0, 100) / 100;
  const billable = weeks * weekly * utilisation;
  const revenueBeforeBuffer = income + costs;
  const targetRevenue = revenueBeforeBuffer * (1 + buffer);
  const hourly = billable > 0 ? targetRevenue / billable : 0;

  document.getElementById('utilisation-label').textContent = `${Math.round(utilisation * 100)}%`;
  document.getElementById('buffer-label').textContent = `${Math.round(buffer * 100)}%`;
  document.getElementById('hourly-rate').innerHTML = `${money.format(hourly)}<span>/hr</span>`;
  document.getElementById('day-rate').textContent = money.format(hourly * 7);
  document.getElementById('revenue-target').textContent = money.format(targetRevenue);
  document.getElementById('billable-hours').textContent = number.format(billable);

  const note = utilisation < .45
    ? 'Your billable assumption is cautious, which pushes the required rate up. That can be sensible when you are allowing plenty of time for sales, admin and gaps between projects.'
    : utilisation > .8
      ? 'This assumes a very high share of your working time is billable. Leave enough room for sales, admin, holidays and quiet periods before relying on this number.'
      : 'This rate covers your target income and business costs, then adds the buffer you selected for resilience and growth.';
  document.getElementById('rate-explain').textContent = note;
}
document.getElementById('rate-form').addEventListener('input', updateRate);

// Portfolio career planner
function updatePortfolio() {
  const target = Math.max(1, val('portfolio-target'));
  const totalIncome = val('anchor-income') + val('growth-income') + val('passion-income');
  const totalHours = val('anchor-hours') + val('growth-hours') + val('passion-hours');
  const coverage = (totalIncome / target) * 100;

  document.getElementById('portfolio-income').textContent = money.format(totalIncome);
  document.getElementById('portfolio-coverage').textContent = `${Math.round(coverage)}%`;
  document.getElementById('portfolio-hours').textContent = `${number.format(totalHours)} hrs`;
  document.getElementById('portfolio-meter').style.width = `${clamp(coverage, 0, 100)}%`;

  let message = '';
  if (coverage < 85) message = `This mix is ${money.format(Math.max(0, target - totalIncome))} below your annual target. The gap may need another stream, more capacity or stronger pricing.`;
  else if (coverage < 100) message = 'You are close to the target. A small improvement in pricing or one stream may be enough without adding a large time commitment.';
  else if (totalHours > 50) message = 'The income works, but the workload is heavy. Try raising the value of one stream rather than adding more hours.';
  else if (totalHours > 42) message = 'The target is covered, though the weekly commitment is getting tight. Protect some capacity for admin, selling and recovery.';
  else message = 'This mix covers the target while leaving some weekly capacity for admin, business development and life outside work.';
  document.getElementById('portfolio-message').textContent = message;
}
document.getElementById('portfolio-form').addEventListener('input', updatePortfolio);

// Career change readiness
function updateReadiness() {
  const ranges = [...document.querySelectorAll('.readiness-range')];
  const values = ranges.map(input => Number(input.value));
  ranges.forEach(input => document.getElementById(input.dataset.label).textContent = `${input.value}/10`);
  const raw = values.reduce((a,b) => a+b,0) / (values.length * 10) * 100;
  const score = Math.round(raw);
  document.getElementById('readiness-score').textContent = score;
  document.getElementById('readiness-ring').style.background = `conic-gradient(var(--red) ${score}%, rgba(255,255,255,.1) 0)`;

  const labels = ['financial runway', 'transferable-skills clarity', 'target-field knowledge', 'proof of competence', 'relevant network', 'energy and motivation'];
  const weak = values.map((v,i)=>({v,label:labels[i]})).sort((a,b)=>a.v-b.v).slice(0,2).map(x=>x.label);
  let title, message;
  if (score >= 80) {
    title = 'Strong foundations for a move';
    message = `Your weakest areas are ${weak.join(' and ')}. Close those gaps while you test real opportunities rather than waiting for a perfect score.`;
  } else if (score >= 60) {
    title = 'Promising, with manageable gaps';
    message = `Build ${weak.join(' and ')} before taking more financial risk. A transition can start while you are still in your current role.`;
  } else if (score >= 40) {
    title = 'Build before you leap';
    message = `Your next move is preparation, especially around ${weak.join(' and ')}. Use small experiments to build evidence and reduce uncertainty.`;
  } else {
    title = 'Early-stage transition';
    message = `Do not make the timetable the goal yet. Strengthen ${weak.join(' and ')} and gather evidence that the target direction fits before committing heavily.`;
  }
  document.getElementById('readiness-title').textContent = title;
  document.getElementById('readiness-message').textContent = message;
}
document.getElementById('readiness-form').addEventListener('input', updateReadiness);

// Personal brand statement
function cleanPhrase(value) { return value.trim().replace(/[.]+$/, ''); }
function updateBrand() {
  const audience = cleanPhrase(document.getElementById('brand-audience').value) || '[specific audience]';
  const outcome = cleanPhrase(document.getElementById('brand-outcome').value) || '[specific outcome]';
  const method = cleanPhrase(document.getElementById('brand-method').value) || '[your approach]';
  document.getElementById('brand-output').textContent = `“I help ${audience} ${outcome} through ${method}.”`;
}
document.getElementById('brand-form').addEventListener('input', updateBrand);
document.getElementById('copy-brand').addEventListener('click', async () => {
  const text = document.getElementById('brand-output').textContent.replace(/[“”]/g, '');
  try {
    await navigator.clipboard.writeText(text);
    document.getElementById('copy-brand').textContent = 'Copied';
    setTimeout(() => document.getElementById('copy-brand').textContent = 'Copy statement', 1400);
  } catch { document.getElementById('copy-brand').textContent = 'Select & copy'; }
});

// New manager plan
const managerPlans = {
  clarity: {
    d30: ['Hold 1:1s with every team member', 'Agree what good looks like with your manager', 'Document the team’s top priorities'],
    d60: ['Create a simple decision and ownership map', 'Set a reliable team meeting rhythm', 'Remove or rewrite conflicting priorities'],
    d90: ['Review delivery against the clarified priorities', 'Delegate more decisions to named owners', 'Reset goals using what you learned']
  },
  performance: {
    d30: ['Understand role expectations and current evidence', 'Separate capability, clarity and motivation issues', 'Give specific, timely feedback'],
    d60: ['Agree measurable improvement expectations', 'Provide support, resources and regular check-ins', 'Recognise visible progress as well as gaps'],
    d90: ['Review outcomes against the agreed standard', 'Strengthen accountability across the whole team', 'Make fair decisions where improvement has not happened']
  },
  trust: {
    d30: ['Listen before changing the system', 'Ask what is making the team cautious or frustrated', 'Admit what you do not know yet'],
    d60: ['Create safer ways to surface disagreement', 'Follow through visibly on small commitments', 'Recognise helpful challenge and collaboration'],
    d90: ['Review team norms together', 'Delegate meaningful ownership', 'Measure whether issues are surfaced earlier than before']
  },
  delivery: {
    d30: ['Map current work, owners and blockers', 'Identify where commitments routinely slip', 'Reduce competing priorities'],
    d60: ['Introduce a lightweight weekly delivery review', 'Clarify decision rights and escalation paths', 'Remove repeat blockers rather than chasing symptoms'],
    d90: ['Review delivery trend and bottlenecks', 'Delegate operational decisions closer to the work', 'Set the next quarter around fewer, clearer outcomes']
  },
  change: {
    d30: ['Communicate what is known, unknown and changing', 'Listen for practical and emotional concerns', 'Keep priorities simple while uncertainty is high'],
    d60: ['Repeat key messages through several channels', 'Create feedback loops as changes land', 'Protect useful routines while replacing broken ones'],
    d90: ['Review what the team has adapted to', 'Retire temporary change-management processes', 'Re-establish a clear longer-term operating rhythm']
  }
};
function updateManager() {
  const challenge = document.getElementById('manager-challenge').value;
  const context = document.getElementById('manager-context').value;
  const size = Math.max(1, val('team-size'));
  const plan = typeof structuredClone === 'function' ? structuredClone(managerPlans[challenge]) : JSON.parse(JSON.stringify(managerPlans[challenge]));
  if (context === 'first') plan.d30.unshift('Shift your measure of success from personal output to team output');
  if (context === 'promotion') plan.d30.unshift('Reset boundaries explicitly with former peers');
  if (context === 'newteam') plan.d30.unshift('Learn the team’s history before redesigning how it works');
  if (size > 12) plan.d60.push('Create a layer of ownership so every decision does not route through you');
  else plan.d60.push('Keep regular individual contact while the team is still small enough');

  [['plan-30', plan.d30], ['plan-60', plan.d60], ['plan-90', plan.d90]].forEach(([id, items]) => {
    document.getElementById(id).innerHTML = items.map(item => `<li>${item}</li>`).join('');
  });
}
document.getElementById('manager-form').addEventListener('input', updateManager);

// Initialise all results.
updateRate();
updatePortfolio();
updateReadiness();
updateBrand();
updateManager();

// Open hash-linked tool on first load.
if (location.hash && panels.some(p => `#${p.id}` === location.hash)) activateTool(location.hash.slice(1));