"""Build three readable finance lessons from the reviewed HTML content."""
from pathlib import Path
import re
from html import escape

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'docs'
PARTS = [
    {'slug': 'basics', 'title': 'Finance basics', 'intro': 'Start with one share. Then follow the money through returns, portfolios, and trading costs.', 'topics': ['Stocks and returns', 'Portfolios and weights', 'Growth, losses, and costs']},
    {'slug': 'project', 'title': 'Finance in this project', 'intro': 'Follow a trading decision: the information available, the holdings it creates, and the results that follow.', 'topics': ['Time and information', 'Prices and company data', 'Holdings and trading costs', 'Returns and risk measures']},
    {'slug': 'further', 'title': 'Further learning', 'intro': 'Go a little deeper into portfolio risk, market-wide changes, and the role of information.', 'topics': ['Portfolio risk', 'Market returns and beta', 'Information and learning']},
]

def figure(kind):
    if kind == 'share':
        return '''<figure class="lesson-figure"><div class="money-flow" role="img" aria-label="One share starts at 50 dollars. It ends worth 52 dollars and pays a 1 dollar cash dividend. The total gain is 3 dollars, or 6 percent."><div><span>START</span><strong>$50</strong><small>one share</small></div><b aria-hidden="true">→</b><div><span>END</span><strong>$52 <i>+ $1</i></strong><small>share value + cash dividend</small></div></div><figcaption>The share price rose by $2. The dividend adds $1. Together, the gain is $3 per share.</figcaption></figure>'''
    if kind == 'allocation':
        return '''<figure class="lesson-figure"><div class="allocation-title"><span>THE STARTING $1,000</span><b>100% of the account</b></div><div class="allocation-bar" role="img" aria-label="Stock A: 500 dollars, 50 percent. Stock B: 300 dollars, 30 percent. Cash: 200 dollars, 20 percent."><span style="width:50%">A · 50%</span><span style="width:30%">B · 30%</span><span style="width:20%">Cash · 20%</span></div><div class="allocation-labels"><span>Stock A <b>$500</b></span><span>Stock B <b>$300</b></span><span>Cash <b>$200</b></span></div><figcaption>A weight tells us where the money is. Cash is part of the portfolio, too.</figcaption></figure>'''
    if kind == 'time':
        return '''<figure class="lesson-figure"><div class="cutoff-flow" role="img" aria-label="At 08:50 news is available. At 09:00 the method makes a decision. News at 09:05 is too late for that decision. Results arrive later."><div><span>08:50</span><strong>News arrives</strong><small>Available</small></div><div class="cutoff-decision"><span>09:00</span><strong>Decision</strong><small>Information cutoff</small></div><div class="cutoff-late"><span>09:05</span><strong>New news</strong><small>Too late for this decision</small></div><div><span>LATER</span><strong>Results</strong><small>Feedback arrives</small></div></div><figcaption>Example times only. Being on the same date does not make a record available at the same time.</figcaption></figure>'''
    if kind == 'risk':
        return '''<figure class="lesson-figure"><div class="risk-comparison" role="img" aria-label="In the imagined equal-weight two-stock model, both stocks have 10 percent monthly standard deviation. Portfolio standard deviation is 10 percent when correlation is 1 and about 7.07 percent when correlation is zero."><div class="risk-row"><span>Correlation = 1</span><div><i style="width:100%"></i></div><b>10.00%</b></div><div class="risk-row"><span>Correlation = 0</span><div><i style="width:70.71%"></i></div><b>7.07%</b></div></div><figcaption>Estimated monthly portfolio standard deviation in this imagined model. The weights and individual stock risks are unchanged.</figcaption></figure>'''
    final = kind == 'result'
    if final:
        path = 'M48 130 L154 48 L264 138 L374 118'
        labels = '<text x="48" y="115">$1,000</text><text x="154" y="30">$1,100</text><text x="264" y="163">$990</text><text x="374" y="99">$1,015</text>'
        dots = '<circle cx="48" cy="130" r="4"/><circle cx="154" cy="48" r="4"/><circle cx="264" cy="138" r="4"/><circle cx="374" cy="118" r="4"/>'
        top = '<text x="316" y="45" class="return-label">End: +1.5%</text>'
        caption = 'This account ends above its starting value, but it still falls 10% from its earlier peak.'
        aria = 'Illustrative path: 1000, 1100, 990, then 1015 dollars. Total return is positive 1.5 percent. Maximum drawdown is 10 percent.'
    else:
        path = 'M48 130 L200 48 L374 138'
        labels = '<text x="48" y="115">$1,000</text><text x="200" y="30">$1,100</text><text x="374" y="163">$990</text>'
        dots = '<circle cx="48" cy="130" r="4"/><circle cx="200" cy="48" r="4"/><circle cx="374" cy="138" r="4"/>'
        top = '<text x="112" y="70">+10%</text><text x="290" y="75">−10%</text>'
        caption = 'Up 10%, then down 10%: the ending value is 1% below the start. The drop from the peak is 10%.'
        aria = 'Illustrative path from 1000 dollars to 1100 and then 990. Returns are positive 10 percent then negative 10 percent. Total return is negative 1 percent.'
    return f'''<figure class="lesson-figure"><svg class="value-diagram" viewBox="0 0 430 200" role="img" aria-label="{aria}"><path class="diagram-grid" d="M30 48H400 M30 90H400 M30 138H400"/><path class="diagram-line" d="{path}"/>{dots}<g class="diagram-labels">{labels}{top}</g><text class="diagram-axis" x="32" y="190">Earlier</text><text class="diagram-axis" x="365" y="190">Later</text></svg><figcaption>{caption} The path is illustrative.</figcaption></figure>'''

for i, part in enumerate(PARTS, start=1):
    fragment = (ROOT / 'content' / f'part{i}.html').read_text(encoding='utf-8')
    fragment = fragment.replace('In the inspected StockBench agent,', 'In StockBench,')
    fragment = fragment.replace('Each describes a different part of the market. A missing value', 'These describe different parts of the market. The table below explains common fields; the course data will determine which are available. A missing value')
    fragment = fragment.replace('The <strong>Sortino ratio</strong> compares mean return above that target with a measure of downside variation.', 'The <strong>Sortino ratio</strong> compares average return above that target with a measure of returns below the target. A target could be 0% per day.')
    # Normalize headings while keeping each lesson's actual content and sources.
    fragment = re.sub(r'<div class="lesson-kicker">.*?</div>\s*', '', fragment)
    fragment = re.sub(r'<div class="lesson-heading"><span class="lesson-number">.*?</span><h3>(.*?)</h3></div>', r'<h3>\1</h3>', fragment)
    fragment = fragment.replace('<h3>', '<h2>').replace('</h3>', '</h2>').replace('<h4>', '<h3>').replace('</h4>', '</h3>')
    fragment = re.sub(r'<!-- DIAGRAM:.*?-->', lambda match: figure('share' if i == 1 and 'single share' in match[0] else 'compound' if i == 1 else 'time' if i == 2 and 'timeline' in match[0] else 'result' if i == 2 else 'risk'), fragment, flags=re.S)
    # Add a visual allocation to the cash-and-holdings lesson.
    if i == 1:
        marker = '<p>The same result comes from the starting weights and each asset\'s return:</p>'
        fragment = fragment.replace(marker, figure('allocation') + '\n  ' + marker)
    ids = re.findall(r'<section class="lesson" id="([^"]+)"', fragment)
    for j, ident in enumerate(ids):
        marker = f'<section class="lesson" id="{ident}">'
        fragment = fragment.replace(marker, marker + f'\n  <div class="lesson-kicker">{i}.{j+1} / {escape(part["topics"][j])}</div>')
    part_nav = ''.join(f'<a href="{p["slug"]}.html" class="part-link{" current" if p is part else ""}"' + (' aria-current="page"' if p is part else '') + f'><span>PART 0{n}</span><strong>{p["title"]}</strong></a>' for n,p in enumerate(PARTS,start=1))
    lesson_nav = ''.join(f'<a href="#{ident}"><span>{i}.{n}</span>{escape(part["topics"][n-1])}</a>' for n,ident in enumerate(ids,start=1))
    previous = '<a href="../index.html#resources"><small>BACK TO</small><strong>Market Lab</strong></a>' if i == 1 else f'<a href="{PARTS[i-2]["slug"]}.html"><small>PREVIOUS PART</small><strong>← {PARTS[i-2]["title"]}</strong></a>'
    following = '<a href="../index.html#directions"><small>BACK TO THE PROJECT</small><strong>Explore possibilities ↗</strong></a>' if i == 3 else f'<a href="{PARTS[i]["slug"]}.html"><small>NEXT PART</small><strong>{PARTS[i]["title"]} →</strong></a>'
    page = f'''<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#8f2b3b"><title>{part['title']} · 3073 Market Lab</title><meta name="description" content="{escape(part['intro'], quote=True)}"><link rel="icon" type="image/svg+xml" href="../favicon.svg?v=2"><link rel="stylesheet" href="../styles.css?v=7"><link rel="stylesheet" href="../tutorial.css?v=3"></head>
<body class="tutorial-body">
<a class="skip-link" href="#lesson-content">Skip to lessons</a>
<header class="site-header tutorial-header"><a class="brand" href="../index.html" aria-label="3073 Market Lab home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>3073 <b>MARKET LAB</b></span></a><a class="tutorial-back" href="../index.html#resources">← Project home</a></header>
<main class="tutorial-layout">
<aside class="tutorial-sidebar"><nav aria-label="Tutorial parts"><div class="sidebar-label">FINANCE, STEP BY STEP</div>{part_nav}</nav><nav class="lesson-nav" aria-label="In this part"><div class="sidebar-label">IN THIS PART</div>{lesson_nav}</nav></aside>
<article class="tutorial-article" id="lesson-content"><div class="tutorial-title"><div class="eyebrow">PART 0{i} / FINANCE GUIDE</div><h1>{part['title']}</h1><p>{part['intro']}</p></div>{fragment}<nav class="next-part" aria-label="Continue reading">{previous}{following}</nav></article>
</main><footer class="tutorial-footer"><span>3073 MARKET LAB</span><p>DSAA3073 · Theories in Data Science</p><a href="https://lixin2002cn.github.io/dsaa3073/" target="_blank" rel="noopener noreferrer">Course home ↗</a></footer>
</body></html>'''
    target = DIST / 'learn' / f'{part["slug"]}.html'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(page, encoding='utf-8')
    print(f'Built {target.relative_to(ROOT)}: {len(ids)} lessons')
