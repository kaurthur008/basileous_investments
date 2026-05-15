
const canvas = document.getElementById('bg');
const bgVideo = document.getElementById('bgVideo');
let ctx = null;
const hasCanvas = !!canvas;
if (hasCanvas) {
  ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  addEventListener('resize', resize);
  resize();
}

async function initBgStream() {
  if (!bgVideo) return;
  // No camera usage: play the fallback video only.
  try {
    bgVideo.muted = true;
    bgVideo.playsInline = true;
    await bgVideo.play().catch(() => {});
  } catch (e) {
    // ignore play errors (autoplay restrictions); user can interact to start playback
  }
}

// Configuration
const PAIRS = [
  { name: 'EUR/USD', base: 'USD', symbol: 'EUR', color: '#00ff88' },
  { name: 'GBP/USD', base: 'USD', symbol: 'GBP', color: '#66d9ff' },
  { name: 'USD/JPY', base: 'USD', symbol: 'JPY', color: '#ffd166' }
];
const HISTORY_DAYS = 60; // initial history length
const UPDATE_INTERVAL = 5000; // ms to poll latest rates

// Each pair will have a `data` array of recent candles ({o,h,l,c})
PAIRS.forEach(p => p.data = []);

function buildCandlesFromCloses(closes) {
  const candles = [];
  for (let i = 0; i < closes.length; i++) {
    const c = closes[i];
    const o = i === 0 ? c : closes[i - 1];
    const high = Math.max(o, c) * (1 + (Math.random() * 0.002 + 0.0005));
    const low = Math.min(o, c) * (1 - (Math.random() * 0.002 + 0.0005));
    candles.push({ o, h: high, l: low, c });
  }
  return candles;
}

function buildSyntheticCandles(count) {
  const start = 1 + Math.random() * 0.2;
  const closes = Array.from({ length: count }, (_, i) => start + Math.sin(i * 0.2) * 0.01 + (Math.random() - 0.5) * 0.01);
  return buildCandlesFromCloses(closes);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchHistorical(pair, days = HISTORY_DAYS) {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const url = `https://api.exchangerate.host/timeseries?start_date=${fmtDate(start)}&end_date=${fmtDate(end)}&base=${pair.base}&symbols=${pair.symbol}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json || !json.rates) throw new Error('No rates');
    const dates = Object.keys(json.rates).sort();
    const arr = dates.map(d => json.rates[d][pair.symbol]).filter(v => typeof v === 'number');
    return arr;
  } catch (e) {
    return null;
  }
}

async function fetchLatest(pair) {
  try {
    const url = `https://api.exchangerate.host/latest?base=${pair.base}&symbols=${pair.symbol}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json || !json.rates) throw new Error('No latest');
    return json.rates[pair.symbol];
  } catch (e) {
    return null;
  }
}

function fallbackNext(last) {
  const change = (Math.random() - 0.5) * 0.002; // small random walk
  return last * (1 + change);
}

function normalize(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  return { min, max, range };
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  const padding = 60;
  PAIRS.forEach((p, idx) => {
    if (!p.data || p.data.length < 2) return;
    const areaTop = padding + idx * (canvas.height - padding * 2) / PAIRS.length;
    const areaHeight = (canvas.height - padding * 2) / PAIRS.length - 20;

    // normalise using highs/lows/opens/closes
    const allPrices = p.data.flatMap(d => [d.o, d.h, d.l, d.c]);
    const norm = normalize(allPrices);

    const stepX = canvas.width / p.data.length;
    const candleWidth = Math.max(2, stepX * 0.6);

    p.data.forEach((cd, i) => {
      const x = i * stepX + stepX / 2;
      const yOpen = areaTop + areaHeight - ((cd.o - norm.min) / norm.range) * areaHeight;
      const yClose = areaTop + areaHeight - ((cd.c - norm.min) / norm.range) * areaHeight;
      const yHigh = areaTop + areaHeight - ((cd.h - norm.min) / norm.range) * areaHeight;
      const yLow = areaTop + areaHeight - ((cd.l - norm.min) / norm.range) * areaHeight;

      // draw wick
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // draw body
      const isBull = cd.c >= cd.o;
      ctx.fillStyle = isBull ? 'rgba(0,255,136,0.9)' : 'rgba(255,80,80,0.9)';
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // small label
    const last = p.data[p.data.length - 1];
    ctx.fillStyle = p.color;
    ctx.font = '14px Arial';
    ctx.fillText(p.name + '  ' + last.c.toFixed(4), 12, areaTop + 16 + idx * 0);
  });

  requestAnimationFrame(draw);
}

function initSlideshow() {
  const slideshow = document.getElementById('introSlideshow');
  const dotsContainer = document.getElementById('slideDots');
  if (!slideshow || !dotsContainer) return;

  const slides = Array.from(slideshow.querySelectorAll('.slide'));
  let activeIndex = 0;

  function setActive(index) {
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === index);
      dotsContainer.children[idx].classList.toggle('active', idx === index);
    });
    activeIndex = index;
  }

  slides.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slide-dot' + (idx === 0 ? ' active' : '');
    dot.addEventListener('click', () => setActive(idx));
    dotsContainer.appendChild(dot);
  });

  setActive(0);
  setInterval(() => setActive((activeIndex + 1) % slides.length), 6000);
}

async function init() {
  initSlideshow();
  initBgStream();
  // load historical data for each pair
  await Promise.all(PAIRS.map(async p => {
    const hist = await fetchHistorical(p);
    if (hist && hist.length) p.data = buildCandlesFromCloses(hist);
    else {
      // fallback synthetic candles
      p.data = buildSyntheticCandles(HISTORY_DAYS);
    }
  }));

  // periodic updates: append new candle based on latest price
  setInterval(async () => {
    for (const p of PAIRS) {
      const latest = await fetchLatest(p);
      const last = p.data[p.data.length - 1];
      if (latest && last) {
        const o = last.c;
        const c = latest;
        const h = Math.max(o, c) * (1 + (Math.random() * 0.002 + 0.0005));
        const l = Math.min(o, c) * (1 - (Math.random() * 0.002 + 0.0005));
        p.data.push({ o, h, l, c });
        if (p.data.length > HISTORY_DAYS) p.data.shift();
      } else if (last) {
        // fallback random small move
        const c = fallbackNext(last.c);
        const o = last.c;
        const h = Math.max(o, c) * (1 + (Math.random() * 0.002 + 0.0005));
        const l = Math.min(o, c) * (1 - (Math.random() * 0.002 + 0.0005));
        p.data.push({ o, h, l, c });
        if (p.data.length > HISTORY_DAYS) p.data.shift();
      }
    }
  }, UPDATE_INTERVAL);

  if (hasCanvas) draw();
}

init();
