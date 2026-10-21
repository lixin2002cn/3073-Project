/* 3073 Market Lab. All experiment data is deterministic and synthetic. */
(() => {
  'use strict';
  const DAYS = 60;
  const thirds = () => [1 / 3, 1 / 3, 1 / 3];
  const sum = values => values.reduce((a, b) => a + b, 0);
  const dot = (a, b) => sum(a.map((v, i) => v * b[i]));

  // Fictional briefs are scheduled by day, never inferred from future returns.
  const NEWS_BRIEFS = {
    growth: [
      ['Retailers report stronger sales', 'Shops say more customers are buying. Some firms plan to hire more staff.'],
      ['Factories receive more orders', 'New orders rise, but higher material costs may limit profits.'],
      ['Software firms raise their sales forecasts', 'Business customers are spending more on digital tools. Future growth is still uncertain.'],
      ['Borrowing costs stay unchanged', 'The central bank leaves its policy rate unchanged. Investors differ on its next move.'],
      ['A large retailer plans new stores', 'The company expects higher demand. The new stores will also add costs.'],
      ['Transport firms add delivery routes', 'More shipments point to busy businesses. Fuel prices remain a concern.'],
      ['Investors debate high share prices', 'Recent gains draw new buyers. Other investors worry that good news is already in the price.'],
      ['Company results show steady profit growth', 'Several firms earn more than last year, while some fall short of investor hopes.']
    ],
    slowdown: [
      ['New orders slow across several industries', 'Firms report weaker demand. Investors review the growth they had expected.'],
      ['Retailers cut their sales forecasts', 'Shops expect slower spending. Some are offering discounts to attract buyers.'],
      ['Companies delay new hiring', 'Managers want more evidence of demand before adding staff.'],
      ['Investors focus on stable cash flows', 'Some buyers prefer firms with steady income. Others still look for faster growth.'],
      ['Lower sales meet lower input costs', 'Cheaper materials may help profits, but weaker demand could offset the benefit.'],
      ['A company reduces its spending plan', 'Management puts a planned expansion on hold and keeps more cash.'],
      ['Analysts disagree on a recovery', 'Some expect demand to improve soon. Others see little evidence so far.'],
      ['A strong result surprises investors', 'One firm reports higher profits despite a slower economy. It may not represent the whole market.']
    ],
    sideways: [
      ['Retail sales send mixed signals', 'Online sales rise while store sales fall. The overall change is small.'],
      ['Company profits beat forecasts by a little', 'Sales are steady. Lower costs help some firms earn slightly more.'],
      ['Borrowing costs stay unchanged', 'The central bank gives no clear date for its next policy change.'],
      ['Higher wages meet higher business costs', 'Workers have more income to spend, but firms face larger wage bills.'],
      ['Strong demand in one sector, weak demand in another', 'Travel bookings rise while sales of household goods slow.'],
      ['A large firm keeps its forecast unchanged', 'Management sees both new orders and signs of weaker demand.'],
      ['Investors split over company values', 'Some see attractive prices. Others expect little profit growth.'],
      ['Businesses wait before expanding', 'Most firms keep their plans unchanged while they watch demand and costs.']
    ],
    stress: [
      ['Lenders review their exposure', 'Banks check loans linked to the troubled lender. The full size of the problem is unclear.'],
      ['Companies check access to cash', 'Some firms review bank deposits and credit lines as a precaution.'],
      ['Officials discuss emergency support', 'A support plan is under review. Its terms and timing have not been confirmed.'],
      ['Investors wait for details of the support plan', 'New reports offer some reassurance, but several questions remain open.']
    ],
    recovery: [
      ['Officials announce a funding plan', 'The plan aims to help lenders meet short-term payments. It does not remove every risk.'],
      ['Banks report more stable deposits', 'Fewer customers move their money, though confidence has not fully returned.'],
      ['A large firm keeps its investment plan', 'Management says its cash reserves are enough to continue planned projects.'],
      ['Businesses report normal daily payments', 'Suppliers and customers continue to settle bills after the recent disruption.'],
      ['Some investors return to riskier shares', 'Others keep more cash while they wait for clearer company results.'],
      ['Retail demand holds up after the disruption', 'Stores report steady sales. Higher borrowing costs remain a concern.'],
      ['Companies restart delayed projects', 'Some managers see more stable funding, while others continue to wait.'],
      ['Analysts lower their estimates of bank losses', 'New figures are less severe than feared. The estimates may still change.']
    ]
  };

  function newsForDay(scenario, day) {
    if (!['switch', 'range', 'shock'].includes(scenario)) throw new Error('Unknown scenario');
    if (!Number.isInteger(day) || day < 0 || day > DAYS) throw new Error('Invalid news day');
    if (day === 0) return null;
    if (scenario === 'shock' && day === 31) return {
      day, headline: 'A major lender reports an unexpected funding gap',
      summary: 'The announcement raises concerns about other lenders. Investors have limited information about the wider impact.'
    };
    let deck, offset;
    if (scenario === 'range') { deck = NEWS_BRIEFS.sideways; offset = day - 1; }
    else if (scenario === 'switch' && day > 30) { deck = NEWS_BRIEFS.slowdown; offset = day - 31; }
    else if (scenario === 'shock' && day > 31 && day <= 35) { deck = NEWS_BRIEFS.stress; offset = day - 32; }
    else if (scenario === 'shock' && day > 35) { deck = NEWS_BRIEFS.recovery; offset = day - 36; }
    else { deck = NEWS_BRIEFS.growth; offset = day - 1; }
    const [headline, summary] = deck[offset % deck.length];
    return { day, headline, summary };
  }

  function syntheticReturns(scenario) {
    if (!['switch', 'range', 'shock'].includes(scenario)) throw new Error('Unknown scenario');
    return Array.from({ length: DAYS }, (_, i) => {
      const t = i + 1;
      if (scenario === 'range') return [
        -0.0007 + 0.009 * Math.sin(t * 1.1),
        0.0005 - 0.008 * Math.sin(t * 1.1 + 0.6),
        0.0002 + 0.0007 * Math.cos(t * 0.8)
      ];
      if (scenario === 'shock') {
        if (t === 31) return [-0.075, -0.045, -0.002];
        return [
          (t > 35 ? 0.003 : 0.0018) + 0.005 * Math.sin(t * 0.8),
          0.0004 + 0.004 * Math.cos(t * 0.9),
          0.00015 + 0.001 * Math.sin(t * 0.65)
        ];
      }
      return [
        (t <= 30 ? 0.0034 : -0.0022) + 0.0055 * Math.sin(t * 0.8),
        (t <= 30 ? -0.0009 : 0.0032) + 0.005 * Math.cos(t * 0.9),
        0.00025 + 0.0008 * Math.sin(t * 0.6)
      ];
    });
  }

  // If post-fee investable wealth is x, purchases/sales are |x*w - old|.
  // Solve x = 1 - fee * traded_notional exactly up to numerical tolerance.
  function rebalanceFactor(target, old, fee) {
    let factor = 1;
    for (let iteration = 0; iteration < 80; iteration++) {
      const next = 1 - fee * sum(target.map((w, i) => Math.abs(factor * w - old[i])));
      if (Math.abs(next - factor) < 1e-13) return next;
      factor = next;
    }
    return factor;
  }

  function simulate({ scenario = 'switch', eta = 1.5, costBps = 10 } = {}) {
    if (!Number.isFinite(eta) || eta < 0 || eta > 8) throw new Error('Invalid learning rate');
    if (!Number.isFinite(costBps) || costBps < 0 || costBps > 40) throw new Error('Invalid fee');
    const returns = syntheticReturns(scenario);
    const fee = costBps / 10000;
    let weights = thirds(), previous = [0, 0, 0], equalPrevious = [0, 0, 0];
    let nav = 1, equalNav = 1, peak = 1, equalPeak = 1, drawdown = 0, equalDrawdown = 0;
    const history = [{ day: 0, nav, equalNav, weights: [...weights], usedWeights: [...weights], drawdown, equalDrawdown }];
    returns.forEach((daily, i) => {
      const usedWeights = [...weights];
      const gross = 1 + dot(weights, daily);
      const equalGross = 1 + sum(daily) / 3;
      const adaptiveFeeFactor = rebalanceFactor(weights, previous, fee);
      const equalFeeFactor = rebalanceFactor(thirds(), equalPrevious, fee);
      nav *= adaptiveFeeFactor * gross;
      equalNav *= equalFeeFactor * equalGross;
      previous = weights.map((w, j) => w * (1 + daily[j]) / gross);
      equalPrevious = daily.map(r => (1 + r) / (3 * equalGross));
      peak = Math.max(peak, nav);
      equalPeak = Math.max(equalPeak, equalNav);
      drawdown = Math.max(drawdown, 1 - nav / peak);
      equalDrawdown = Math.max(equalDrawdown, 1 - equalNav / equalPeak);
      const updated = weights.map((w, j) => w * Math.exp(eta * daily[j] / 0.01));
      const total = sum(updated);
      weights = updated.map(w => w / total);
      history.push({ day: i + 1, nav, equalNav, weights: [...weights], usedWeights, drawdown, equalDrawdown });
    });
    return history;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { simulate, syntheticReturns, rebalanceFactor, newsForDay };
  if (typeof document === 'undefined') return;

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const directions = [
    {
      id: 'experts', name: 'Combining experts', english: 'ENSEMBLE & EXPERT ADVICE',
      title: 'Different perspectives, shared decisions.',
      intro: 'Price patterns, fundamentals, and news can suggest different views of the same market. Ensembles bring these perspectives together; their value depends on more than the number of models involved.',
      context: 'Expert advice connects this idea to sequential decision-making. The balance between diversity, reliability, and changing relevance leaves room for many kinds of combination.',
      concepts: ['Ensembles', 'Expert advice', 'Multiplicative weights']
    },
    {
      id: 'online', name: 'Learning over time', english: 'ONLINE LEARNING',
      title: 'Learning while the world moves.',
      intro: 'In a market, information and feedback arrive over time. Online learning offers a way to think about decisions that evolve alongside the observations available to them.',
      context: 'Responsiveness, stability, and memory interact when conditions change. Portfolio constraints and the cost of changing positions add another dimension to this relationship.',
      concepts: ['Online learning', 'Regularization', 'Sequential decisions']
    },
    {
      id: 'boosting', name: 'Weak signals', english: 'WEAK LEARNING & BOOSTING',
      title: 'Small signals, larger possibilities.',
      intro: 'A simple indicator or a narrow piece of information may have limited predictive power on its own. Weak learning and boosting provide one perspective on how such signals can interact.',
      context: 'Margins, loss functions, and the distribution of mistakes describe different aspects of prediction. Their relationship with portfolio outcomes is a further part of the picture.',
      concepts: ['Weak learning', 'AdaBoost', 'Margins & losses']
    },
    {
      id: 'generalization', name: 'Generalization', english: 'GENERALIZATION & MODEL COMPLEXITY',
      title: 'Patterns beyond one history.',
      intro: 'Financial histories are finite, and models can differ greatly in flexibility. Generalization, bias–variance, and regularization offer ways to think about how much a fitted pattern can tell us.',
      context: 'Model selection and changing data distributions complicate the link between past performance and future usefulness. A simpler representation can embody a different set of assumptions, rather than merely less computation.',
      concepts: ['Generalization', 'Bias–variance', 'Model selection']
    },
    {
      id: 'llm', name: 'Language & LLMs', english: 'LANGUAGE & MARKET INFORMATION',
      title: 'Another way to read the market.',
      intro: 'News carries descriptions of events, expectations, and uncertainty that price tables do not express directly. Language models offer new ways to represent and interpret this information.',
      context: 'Text and numerical signals can complement each other in many ways. Model knowledge, historical memory, interpretation, and the timing of information all shape this connection.',
      concepts: ['Text representations', 'Information', 'Hybrid models']
    },
    {
      id: 'agent', name: 'Agents & systems', english: 'AGENTS & DECISION SYSTEMS',
      title: 'Decisions as a process.',
      intro: 'An agent can bring together information gathering, tools, memory, and portfolio decisions. This opens up a design space that extends beyond a single prediction model.',
      context: 'Coordination, autonomy, and limited resources influence how such a system behaves. Single-agent, multi-agent, and hybrid approaches offer different ways to organize a decision process.',
      concepts: ['Tools & memory', 'Coordination', 'Decision systems']
    }
  ];
  // Expert experiment: history is precomputed locally, but only observed days are rendered.
  let scenario = 'switch', day = 0, timer = null, experiment = simulate();
  const etaInput = $('#learning-rate'), costInput = $('#trading-cost');
  const percent = value => `${value > 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
  function drawExperiment() {
    const observed = experiment.slice(0, day + 1), current = experiment[day];
    const values = observed.flatMap(item => [item.nav, item.equalNav]);
    let min = Math.min(...values, 1), max = Math.max(...values, 1);
    const pad = Math.max(0.015, (max - min) * 0.18);
    min -= pad; max += pad;
    const x = d => 54 + d / DAYS * 685, y = v => 236 - (v - min) / (max - min) * 213;
    const path = key => observed.map((item, i) => `${i ? 'L' : 'M'}${x(item.day).toFixed(2)},${y(item[key]).toFixed(2)}`).join(' ');
    $('#chart-grid').innerHTML = Array.from({ length: 5 }, (_, i) => {
      const value = min + (max - min) * i / 4, height = y(value);
      return `<line class="lab-grid-line" x1="54" x2="739" y1="${height}" y2="${height}"/><text class="lab-axis-label" x="43" y="${height + 3}" text-anchor="end">${value.toFixed(2)}</text>`;
    }).join('');
    $('#chart-labels').innerHTML = [0, 15, 30, 45, 60].map(d => `<text class="lab-axis-label" x="${x(d)}" y="263" text-anchor="middle">D${d}</text>`).join('');
    $('#adaptive-line').setAttribute('d', path('nav'));
    $('#equal-line').setAttribute('d', path('equalNav'));
    $('#adaptive-end').setAttribute('cx', x(day));
    $('#adaptive-end').setAttribute('cy', y(current.nav));
    $('#day-number').textContent = String(day).padStart(2, '0');
    const news = newsForDay(scenario, day);
    $('#news-day').textContent = `DAY ${String(day).padStart(2, '0')}`;
    $('#news-headline').textContent = news ? news.headline : 'A new day brings new information.';
    $('#news-summary').textContent = news ? news.summary : 'Press Next day or Play to see prices and a news brief arrive together.';
    for (const [selector, value] of [['#adaptive-return', current.nav - 1], ['#equal-return', current.equalNav - 1]]) {
      $(selector).textContent = percent(value);
      $(selector).classList.toggle('negative', value < 0);
      $(selector).classList.toggle('positive', value > 0);
    }
    $('#drawdown').textContent = current.drawdown > 0 ? `−${(current.drawdown * 100).toFixed(2)}%` : '0.00%';
    $('#drawdown').classList.toggle('negative', current.drawdown > 0);
    $$('#weights-bar span').forEach((span, i) => { span.style.width = `${current.weights[i] * 100}%`; });
    $('#weight-values').textContent = current.weights.map(w => (w * 100).toFixed(0)).join(' / ') + '%';
    $('#weights-bar').setAttribute('aria-label', ['Trend', 'Reversal', 'Defensive'].map((name, i) => `${name} ${(current.weights[i] * 100).toFixed(1)}%`).join(', '));
    $('#regime-label').textContent = day === 0 ? 'Ready for day one' : scenario === 'switch' ? (day <= 30 ? 'Observed: trend phase' : 'Observed: regime shift') : scenario === 'shock' ? (day < 31 ? 'Observed: before the shock' : 'Observed: shock and recovery') : 'Observed: sideways market';
    $('#step-experiment').disabled = day >= DAYS;
    $('#play-experiment').innerHTML = timer ? 'Pause <span aria-hidden="true">Ⅱ</span>' : day === DAYS ? 'Replay <span aria-hidden="true">▶</span>' : 'Play <span aria-hidden="true">▶</span>';
  }
  function pause() { if (timer) window.clearInterval(timer); timer = null; }
  function reset() {
    pause(); day = 0;
    experiment = simulate({ scenario, eta: Number(etaInput.value), costBps: Number(costInput.value) });
    $('#eta-output').textContent = Number(etaInput.value).toFixed(1);
    $('#cost-output').textContent = `${costInput.value} bps`;
    $('#experiment-status').textContent = 'Restarted at day 0. Decisions precede feedback.';
    drawExperiment();
  }
  function advance() {
    if (day < DAYS) day++;
    if (day === DAYS) {
      pause();
      $('#experiment-status').textContent = 'Day 60 complete.';
    } else {
      $('#experiment-status').textContent = `Day ${day} observed. Weights updated for the next day.`;
    }
    drawExperiment();
  }
  $('#play-experiment').addEventListener('click', () => {
    if (timer) { pause(); $('#experiment-status').textContent = `Paused at day ${day}.`; drawExperiment(); return; }
    if (day === DAYS) reset();
    timer = window.setInterval(advance, 400);
    drawExperiment();
  });
  $('#step-experiment').addEventListener('click', () => { pause(); advance(); });
  $('#reset-experiment').addEventListener('click', reset);
  etaInput.addEventListener('input', reset);
  costInput.addEventListener('input', reset);
  $$('.scenario').forEach(button => button.addEventListener('click', () => {
    scenario = button.dataset.scenario;
    $$('.scenario').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    reset();
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden && timer) { pause(); drawExperiment(); } });
  drawExperiment();

  // Accessible directional tabs, with explicit linkage to the panel.
  $('#direction-tabs').innerHTML = directions.map((item, i) => `<button type="button" role="tab" id="tab-${item.id}" aria-controls="direction-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-direction="${item.id}" class="direction-tab"><span>0${i + 1}</span><span>${item.name}</span><span aria-hidden="true">↗</span></button>`).join('');
  function showDirection(id, focus = false) {
    const item = directions.find(d => d.id === id);
    $$('.direction-tab').forEach(button => {
      const selected = button.dataset.direction === id;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    const panel = $('#direction-panel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.innerHTML = `<span class="direction-type">${item.english}</span><h3>${item.title}</h3><p class="direction-intro">${item.intro}</p><p class="direction-context">${item.context}</p><div class="small-tags direction-concepts">${item.concepts.map(concept => `<span>${concept}</span>`).join('')}</div>`;
  }
  $$('.direction-tab').forEach((button, i) => {
    button.addEventListener('click', () => showDirection(button.dataset.direction));
    button.addEventListener('keydown', event => {
      let index;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') index = (i + 1) % directions.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') index = (i + directions.length - 1) % directions.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = directions.length - 1;
      if (index !== undefined) { event.preventDefault(); showDirection(directions[index].id, true); }
    });
  });
  showDirection(directions[0].id);

  function readingProgress() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    $('#reading-progress').style.width = `${total > 0 ? Math.min(100, window.scrollY / total * 100) : 0}%`;
  }
  window.addEventListener('scroll', readingProgress, { passive: true });
  window.addEventListener('resize', readingProgress);
  readingProgress();
})();
