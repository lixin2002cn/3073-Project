# 3073-Project

An English-language project website for **DSAA3073 · Theories in Data Science**.

The Market Lab connects course ideas with simulated financial decisions in StockBench. It includes an interactive synthetic market, open directions, three finance tutorials, and the project requirements and rubric.

## Website

- Home: https://lixin2002cn.github.io/3073-Project/
- Project Requirements & Rubric: https://lixin2002cn.github.io/3073-Project/requirements.html

## Edit and preview

The published website is in `docs/`. All links are relative, so the website works under the repository's GitHub Pages path.

```sh
python -m http.server 8731 --bind 127.0.0.1 --directory docs
```

Open http://127.0.0.1:8731/ in a browser.

The finance lesson sources are in `content/`. After editing them, rebuild the lesson pages:

```sh
python build-tutorial.py
```

Check the playground's accounting, information timing, and daily news:

```sh
node --check docs/app.js
node check-experiment.cjs
```

## Publish

GitHub Pages publishes the `docs/` folder on the `main` branch. Push an update to `main` to publish it. The website is static HTML, CSS, and JavaScript; no API keys, paid services, or build dependencies are required.

All playground prices and news are fictional teaching data. Course data and the StockBench execution interface are announced separately.
