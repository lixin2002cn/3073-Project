const assert = require('node:assert/strict');
const { simulate, syntheticReturns, rebalanceFactor, newsForDay } = require('./docs/app.js');
const near = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
// No-learning MWU is the same daily equal-weight portfolio, including drift and fees.
for (const scenario of ['switch', 'range', 'shock']) {
  for (const costBps of [0, 10, 40]) {
    const run = simulate({ scenario, eta: 0, costBps });
    assert.equal(run.length, 61);
    for (const record of run) {
      near(record.nav, record.equalNav);
      near(record.weights.reduce((a, b) => a + b, 0), 1);
      assert.ok(record.drawdown >= 0 && record.drawdown < 1);
    }
  }
}
// First allocation is funded from cash; fees are paid on invested notional.
near(rebalanceFactor([1/3, 1/3, 1/3], [0, 0, 0], .001), 1 / 1.001);
// Rebalancing to existing weights produces no fee.
near(rebalanceFactor([.2, .3, .5], [.2, .3, .5], .004), 1);
// Same-period decisions cannot use same-period expert results.
const run = simulate({ scenario: 'switch', eta: 1.5, costBps: 10 });
near(run[1].usedWeights[0], 1/3);
for (let day = 2; day <= 60; day++) run[day].usedWeights.forEach((w, i) => near(w, run[day-1].weights[i]));
const first = syntheticReturns('switch')[0];
near(run[1].nav, (1 / 1.001) * (1 + first.reduce((a, b) => a + b, 0) / 3));
// Fee sensitivity and deterministic replay.
for (const scenario of ['switch', 'range', 'shock']) {
  const free = simulate({ scenario, eta: 1.5, costBps: 0 });
  const paid = simulate({ scenario, eta: 1.5, costBps: 40 });
  assert.ok(paid[60].nav < free[60].nav);
  assert.deepEqual(simulate({ scenario }), simulate({ scenario }));
  const final = simulate({ scenario, eta: 8, costBps: 40 })[60];
  assert.ok(Number.isFinite(final.nav) && final.nav > 0);
}
assert.throws(() => simulate({ eta: NaN }));
assert.throws(() => simulate({ costBps: -1 }));
assert.throws(() => simulate({ scenario: 'unknown' }));
// News shares the observed day and scenario; future shock news is not shown early.
for (const scenario of ['switch', 'range', 'shock']) {
  assert.equal(newsForDay(scenario, 0), null);
  for (let day = 1; day <= 60; day++) {
    const brief = newsForDay(scenario, day);
    assert.equal(brief.day, day);
    assert.ok(brief.headline.length > 0 && brief.summary.length > 0);
    assert.deepEqual(brief, newsForDay(scenario, day));
  }
}
const shockHeadline = newsForDay('shock', 31).headline;
assert.match(shockHeadline, /unexpected funding gap/);
for (let day = 1; day <= 30; day++) assert.notEqual(newsForDay('shock', day).headline, shockHeadline);
assert.notDeepEqual(newsForDay('switch', 31), newsForDay('range', 31));
assert.notDeepEqual(newsForDay('shock', 31), newsForDay('shock', 32));
assert.throws(() => newsForDay('shock', 61));
assert.throws(() => newsForDay('shock', -1));
assert.throws(() => newsForDay('shock', 1.5));
assert.throws(() => newsForDay('unknown', 1));
console.log('Experiment checks passed: accounting, chronology, weights, fees, stability, deterministic news and event timing.');
