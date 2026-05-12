/* ─────────────────────────────────────────────
   Lenticular Image Splicer
   ───────────────────────────────────────────── */

const $ = id => document.getElementById(id);

// ── Canvas ────────────────────────────────────
const canvas     = $('canvas');
const ctx        = canvas.getContext('2d');
const pathCanvas = $('pathCanvas');
const pctx       = pathCanvas.getContext('2d');
const canvasFrame = $('canvasFrame');
const canvasEmpty = $('canvasEmpty');
const emptyLabel  = $('emptyLabel');

// ── Sidebar scroll wrapper ────────────────────
// Wrap all panel content in a scrollable div between head and foot
(function buildScrollWrapper() {
  const sidebar     = document.querySelector('.sidebar');
  const head        = sidebar.querySelector('.sidebar-head');
  const foot        = sidebar.querySelector('.sidebar-foot');
  const splicePanel = $('splicePanel');
  const effectsPanel= $('effectsPanel');

  const wrap = document.createElement('div');
  wrap.className = 'sidebar-scroll';
  sidebar.insertBefore(wrap, foot);
  wrap.appendChild(splicePanel);
  wrap.appendChild(effectsPanel);
})();

// ── DOM refs ──────────────────────────────────
const splicePanel  = $('splicePanel');
const effectsPanel = $('effectsPanel');

const image1Input    = $('image1');
const image2Input    = $('image2');
const imageEInput    = $('imageE');
const stripSlider    = $('stripWidth');
const stripValue     = $('stripValue');

const glassEnabled    = $('glassEnabled');
const glassSliceWidth = $('glassSliceWidth');
const glassRefraction = $('glassRefraction');
const glassBlur       = $('glassBlur');
const glassHighlight  = $('glassHighlight');
const glassOpacity    = $('glassOpacity');

const caEnabled  = $('caEnabled');
const caAmount   = $('caAmount');
const caAngle    = $('caAngle');
const caGreen    = $('caGreen');

const pathBlurEnabled = $('pathBlurEnabled');
const pathRadius      = $('pathRadius');
const pathBlurStr     = $('pathBlurStr');
const clearPathBtn    = $('clearPath');

const noiseEnabled    = $('noiseEnabled');
const noiseIntensity  = $('noiseIntensity');
const noiseSize       = $('noiseSize');
const scanlineSpacing = $('scanlineSpacing');
const scanlineWidth   = $('scanlineWidth');

const downloadBtn = $('download');

// ── State ─────────────────────────────────────
let currentMode = 'splice';
let imgA = null, imgB = null, imgE = null;
let noiseType = 'film';
let blurPath   = [];   // flat array of {x,y} points — the full drawn path
let blurStrokes = [];  // array of stroke arrays for undo (each stroke = array of points)
let currentStroke = null;
let isDrawing = false;

// ── Mode tabs ─────────────────────────────────
document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    setMode(tab.dataset.mode);
  });
});

function setMode(mode) {
  const prev = currentMode;
  currentMode = mode;
  splicePanel.hidden  = mode !== 'splice';
  effectsPanel.hidden = mode !== 'effects';

  // Update empty-state label and clickability
  if (mode === 'effects') {
    canvasEmpty.classList.add('clickable');
    emptyLabel.textContent = 'Click or drag to upload image';
  } else {
    canvasEmpty.classList.remove('clickable');
    emptyLabel.textContent = 'Upload two images to get started';
  }

  // Re-render with whatever images are already loaded for this mode,
  // or show the empty state if none are loaded yet.
  const hasContent = mode === 'splice' ? (imgA && imgB) : imgE;
  if (hasContent) {
    generate();
  } else {
    // Only clear if there's nothing to show for this mode
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pctx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
    canvas.style.display     = 'none';
    pathCanvas.style.display = 'none';
    downloadBtn.disabled = true;
    canvasEmpty.style.display = '';
  }
}

// ── Collapsible sections ──────────────────────
document.querySelectorAll('[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const block = btn.closest('.section-block');
    block.classList.toggle('open');
  });
});

// ── Helpers ───────────────────────────────────
function loadImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}

function updateLabel(slider, label, unit = '') {
  if (!slider || !label) return;
  label.textContent = unit ? `${slider.value} ${unit}` : slider.value;
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function fitImage(img, width, height) {
  const tmp = document.createElement('canvas');
  tmp.width = width; tmp.height = height;
  const tc = tmp.getContext('2d');
  const scale = Math.max(width / img.width, height / img.height);
  const w = img.width * scale, h = img.height * scale;
  tc.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  return tmp;
}

function showCanvas() {
  canvasEmpty.style.display = 'none';
  canvas.style.display = 'block';
  // size and position pathCanvas to exactly match canvas
  const r = canvas.getBoundingClientRect();
  const fr = canvasFrame.getBoundingClientRect();
  pathCanvas.width  = canvas.width;
  pathCanvas.height = canvas.height;
  pathCanvas.style.width  = canvas.offsetWidth  + 'px';
  pathCanvas.style.height = canvas.offsetHeight + 'px';
  pathCanvas.style.left   = (canvas.offsetLeft) + 'px';
  pathCanvas.style.top    = (canvas.offsetTop)  + 'px';
  pathCanvas.style.display = 'block';
}

// ── Upload: splice ────────────────────────────
async function handleSpliceUpload(input, previewEl, which) {
  const file = input.files[0];
  if (!file) return;
  const img = await loadImage(file);
  previewEl.src = img.src;
  if (which === 'A') imgA = img; else imgB = img;
  if (imgA && imgB) { updateSpliceSliderMax(); generate(); }
}

function updateSpliceSliderMax() {
  const w = Math.min(imgA.width, imgB.width);
  stripSlider.max   = Math.floor(w / 2);
  stripSlider.value = Math.min(+stripSlider.value, stripSlider.max);
  updateLabel(stripSlider, stripValue, 'px');
}

image1Input.addEventListener('change', () => handleSpliceUpload(image1Input, $('preview1'), 'A'));
image2Input.addEventListener('change', () => handleSpliceUpload(image2Input, $('preview2'), 'B'));

// ── Upload: effects ───────────────────────────
async function handleEffectsUpload(file) {
  if (!file) return;
  imgE = await loadImage(file);
  $('previewE').src = imgE.src;
  generate();
}

// click on empty canvas (effects mode)
canvasEmpty.addEventListener('click', () => {
  if (currentMode === 'effects') $('canvasUpload').click();
});
$('canvasUpload').addEventListener('change', e => handleEffectsUpload(e.target.files[0]));
imageEInput.addEventListener('change', e => handleEffectsUpload(e.target.files[0]));

// drag-and-drop
canvasFrame.addEventListener('dragover', e => { e.preventDefault(); canvasFrame.classList.add('drag-over'); });
canvasFrame.addEventListener('dragleave', () => canvasFrame.classList.remove('drag-over'));
canvasFrame.addEventListener('drop', e => {
  e.preventDefault();
  canvasFrame.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (currentMode === 'effects') handleEffectsUpload(file);
});

// ── Render pipeline ───────────────────────────
function generate() {
  if (currentMode === 'splice') {
    if (!imgA || !imgB) return;
    renderSplice();
  } else {
    if (!imgE) return;
    renderEffects();
  }
  downloadBtn.disabled = false;
}

function renderSplice() {
  const W = Math.min(imgA.width, imgB.width);
  const H = Math.min(imgA.height, imgB.height);
  canvas.width = W; canvas.height = H;

  const a = fitImage(imgA, W, H);
  const b = fitImage(imgB, W, H);
  ctx.clearRect(0, 0, W, H);

  const strip = +stripSlider.value;
  let useA = true;
  for (let x = 0; x < W; x += strip) {
    const src = useA ? a : b;
    const w   = Math.min(strip, W - x);
    ctx.drawImage(src, x, 0, w, H, x, 0, w, H);
    useA = !useA;
  }
  showCanvas();
}

function renderEffects() {
  const W = imgE.width, H = imgE.height;
  canvas.width = W; canvas.height = H;

  function stage() {
    const c = document.createElement('canvas');
    c.width = W; c.height = H; return c;
  }

  const s1 = stage(); s1.getContext('2d').drawImage(imgE, 0, 0);
  const s2 = stage(); applyGlass(s2.getContext('2d'), s1, W, H);
  const s3 = stage(); applyCA(s3.getContext('2d'), s2, W, H);
  const s4 = stage(); applyPathBlur(s4.getContext('2d'), s3, W, H);
  const s5 = stage(); applyNoise(s5.getContext('2d'), s4, W, H);

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(s5, 0, 0);
  showCanvas();
  drawPathOverlay();
}

// ── Glass ─────────────────────────────────────
function applyGlass(dst, src, W, H) {
  if (!glassEnabled.checked) { dst.drawImage(src, 0, 0); return; }
  const sliceW  = +glassSliceWidth.value;
  const refract = +glassRefraction.value;
  const blur    = +glassBlur.value;
  const hl      = +glassHighlight.value;
  const opacity = +glassOpacity.value / 100;

  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const oc = off.getContext('2d');
  oc.drawImage(src, 0, 0);

  for (let x = 0; x < W; x += sliceW) {
    const w   = Math.min(sliceW, W - x);
    const dir = Math.floor(x / sliceW) % 2 === 0 ? 1 : -1;
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = H;
    const tc = tmp.getContext('2d');
    if (blur > 0) tc.filter = `blur(${blur}px)`;
    tc.drawImage(src, x + dir * refract, 0, w, H, 0, 0, w, H);
    tc.filter = 'none';
    oc.save(); oc.globalAlpha = opacity; oc.drawImage(tmp, x, 0); oc.restore();
    if (hl > 0) {
      const g = oc.createLinearGradient(x, 0, x + Math.min(6, w), 0);
      g.addColorStop(0, `rgba(255,255,255,${hl / 255})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      oc.fillStyle = g;
      oc.fillRect(x, 0, Math.min(6, w), H);
    }
  }
  dst.drawImage(off, 0, 0);
}

// ── Chromatic Aberration ──────────────────────
function applyCA(dst, srcCanvas, W, H) {
  if (!caEnabled.checked) { dst.drawImage(srcCanvas, 0, 0); return; }
  const amount = +caAmount.value;
  const angle  = (+caAngle.value * Math.PI) / 180;
  const green  = +caGreen.value;
  if (amount === 0 && green === 0) { dst.drawImage(srcCanvas, 0, 0); return; }

  const dx = Math.round(Math.cos(angle) * amount);
  const dy = Math.round(Math.sin(angle) * amount);

  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  tmp.getContext('2d').drawImage(srcCanvas, 0, 0);
  const sd = tmp.getContext('2d').getImageData(0, 0, W, H).data;
  const out = new ImageData(W, H);
  const od  = out.data;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i  = (y * W + x) * 4;
      const ri = (clamp(y - dy, 0, H-1) * W + clamp(x - dx, 0, W-1)) * 4;
      const gi = (clamp(y - green, 0, H-1) * W + x) * 4;
      const bi = (clamp(y + dy, 0, H-1) * W + clamp(x + dx, 0, W-1)) * 4;
      od[i]   = sd[ri];
      od[i+1] = sd[gi+1];
      od[i+2] = sd[bi+2];
      od[i+3] = sd[i+3];
    }
  }
  dst.putImageData(out, 0, 0);
}

// ── Path Blur — directional motion blur along path tangent ───────────────
//
// How Photoshop's Path Blur works:
//   For each pixel, find the nearest point on the drawn path. Sample the
//   source image along a line in the *tangent direction* of the path at
//   that point, averaging N samples spread ±blurLength/2 pixels in that
//   direction. Pixels further from the path get progressively less blur
//   (Gaussian falloff by distance). The result is a smear that follows
//   the curve — exactly like motion blur oriented to the path shape.
//
function applyPathBlur(dst, srcCanvas, W, H) {
  if (!pathBlurEnabled.checked || blurPath.length < 2) { dst.drawImage(srcCanvas, 0, 0); return; }

  const blurLen  = +pathBlurStr.value * 4;   // half-length of sample line in px
  const falloff  = +pathRadius.value;         // distance at which blur fades to 0
  const samples  = Math.max(4, Math.round(blurLen * 1.5)); // number of samples along line

  // Read source pixels once
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  tmp.getContext('2d').drawImage(srcCanvas, 0, 0);
  const src = tmp.getContext('2d').getImageData(0, 0, W, H).data;

  const out = new ImageData(W, H);
  const od  = out.data;

  // Pre-compute path segment tangents and cumulative lengths
  const segs = []; // {x0,y0,x1,y1,tx,ty,len}
  for (let i = 0; i < blurPath.length - 1; i++) {
    const a = blurPath[i], b = blurPath[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    segs.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, tx: dx / len, ty: dy / len, len });
  }
  if (segs.length === 0) { dst.drawImage(srcCanvas, 0, 0); return; }

  // For a pixel (px,py), find nearest point on path and its tangent
  function nearestOnPath(px, py) {
    let bestDist = Infinity, bestTx = 1, bestTy = 0;
    for (const s of segs) {
      const ex = px - s.x0, ey = py - s.y0;
      const t  = clamp((ex * s.tx + ey * s.ty) / s.len, 0, 1);
      const nx = s.x0 + t * (s.x1 - s.x0) - px;
      const ny = s.y0 + t * (s.y1 - s.y0) - py;
      const d  = Math.hypot(nx, ny);
      if (d < bestDist) { bestDist = d; bestTx = s.tx; bestTy = s.ty; }
    }
    return { dist: bestDist, tx: bestTx, ty: bestTy };
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const { dist, tx, ty } = nearestOnPath(x, y);

      // Gaussian falloff: blur strength decreases with distance from path
      const weight = Math.exp(-(dist * dist) / (2 * falloff * falloff));

      if (weight < 0.01) {
        // Far from path — copy original pixel
        const si = (y * W + x) * 4;
        const oi = si;
        od[oi] = src[si]; od[oi+1] = src[si+1]; od[oi+2] = src[si+2]; od[oi+3] = src[si+3];
        continue;
      }

      // Sample along tangent direction, weighted by Gaussian along the line
      let rr = 0, gg = 0, bb = 0, aa = 0, total = 0;
      const halfLen = blurLen * weight;

      for (let s = 0; s <= samples; s++) {
        const t  = (s / samples - 0.5) * 2 * halfLen; // -halfLen .. +halfLen
        // Gaussian weight along the sample line
        const lw = Math.exp(-(t * t) / (2 * (halfLen * 0.4 + 1) ** 2));
        const sx = clamp(Math.round(x + tx * t), 0, W - 1);
        const sy = clamp(Math.round(y + ty * t), 0, H - 1);
        const si = (sy * W + sx) * 4;
        rr += src[si]   * lw;
        gg += src[si+1] * lw;
        bb += src[si+2] * lw;
        aa += src[si+3] * lw;
        total += lw;
      }

      const oi = (y * W + x) * 4;
      // Blend blurred result with original based on path proximity weight
      const si = oi;
      od[oi]   = clamp(rr / total * weight + src[si]   * (1 - weight), 0, 255);
      od[oi+1] = clamp(gg / total * weight + src[si+1] * (1 - weight), 0, 255);
      od[oi+2] = clamp(bb / total * weight + src[si+2] * (1 - weight), 0, 255);
      od[oi+3] = src[si+3];
    }
  }

  dst.putImageData(out, 0, 0);
}

// ── Noise ─────────────────────────────────────
function applyNoise(dst, srcCanvas, W, H) {
  if (!noiseEnabled.checked) { dst.drawImage(srcCanvas, 0, 0); return; }
  dst.drawImage(srcCanvas, 0, 0);
  const intensity = +noiseIntensity.value;
  const size      = +noiseSize.value;
  const type      = noiseType;
  if (intensity === 0) return;

  if (type === 'scanline') {
    const sp = +scanlineSpacing.value;
    const sw = +scanlineWidth.value;
    dst.save(); dst.globalAlpha = intensity / 255; dst.fillStyle = '#000';
    for (let y = 0; y < H; y += sp) dst.fillRect(0, y, W, sw);
    dst.restore(); return;
  }

  const id = dst.getImageData(0, 0, W, H);
  const d  = id.data;

  if (type === 'film') {
    for (let i = 0; i < d.length; i += 4) {
      const g = (Math.random()+Math.random()+Math.random()-1.5) * intensity;
      d[i]=clamp(d[i]+g,0,255); d[i+1]=clamp(d[i+1]+g,0,255); d[i+2]=clamp(d[i+2]+g,0,255);
    }
  } else if (type === 'rgb') {
    for (let i = 0; i < d.length; i += 4) {
      d[i]  =clamp(d[i]  +(Math.random()-.5)*intensity*2,0,255);
      d[i+1]=clamp(d[i+1]+(Math.random()-.5)*intensity*2,0,255);
      d[i+2]=clamp(d[i+2]+(Math.random()-.5)*intensity*2,0,255);
    }
  } else if (type === 'dust') {
    const specks = Math.floor(W*H*(intensity/255)*0.02);
    for (let s = 0; s < specks; s++) {
      const px=Math.floor(Math.random()*W), py=Math.floor(Math.random()*H);
      const val=Math.random()>.5?255:0, sz=Math.ceil(size*Math.random());
      for (let dy=0;dy<sz;dy++) for (let dx=0;dx<sz;dx++) {
        const ii=(clamp(py+dy,0,H-1)*W+clamp(px+dx,0,W-1))*4;
        d[ii]=d[ii+1]=d[ii+2]=val;
      }
    }
  }
  dst.putImageData(id, 0, 0);
}

// ── Path overlay ──────────────────────────────
function drawPathOverlay() {
  pctx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
  if (!pathBlurEnabled.checked || blurPath.length < 2) return;
  pctx.save();
  pctx.strokeStyle = 'rgba(255,255,255,0.55)';
  pctx.lineWidth   = Math.max(2, +pathRadius.value * 0.12);
  pctx.lineCap = 'round'; pctx.lineJoin = 'round';
  pctx.setLineDash([5, 5]);
  pctx.beginPath();
  pctx.moveTo(blurPath[0].x, blurPath[0].y);
  for (let i = 1; i < blurPath.length; i++) pctx.lineTo(blurPath[i].x, blurPath[i].y);
  pctx.stroke();
  pctx.restore();
}

// ── Path drawing ──────────────────────────────
function canvasCoords(e) {
  const rect = pathCanvas.getBoundingClientRect();
  const sx = pathCanvas.width  / rect.width;
  const sy = pathCanvas.height / rect.height;
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
}

pathCanvas.addEventListener('mousedown', e => {
  if (!pathBlurEnabled.checked || currentMode !== 'effects') return;
  isDrawing = true;
  currentStroke = [];
  const pt = canvasCoords(e);
  currentStroke.push({ x: pt.x, y: pt.y });
  blurPath.push({ x: pt.x, y: pt.y });
  drawPathOverlay();
});

pathCanvas.addEventListener('mousemove', e => {
  if (!isDrawing) return;
  const pt   = canvasCoords(e);
  const last = blurPath[blurPath.length - 1];
  if (!last || Math.hypot(pt.x-last.x, pt.y-last.y) > +pathRadius.value * 0.4) {
    currentStroke.push({ x: pt.x, y: pt.y });
    blurPath.push({ x: pt.x, y: pt.y });
    drawPathOverlay();
  }
});

pathCanvas.addEventListener('mouseup', () => {
  if (isDrawing) {
    isDrawing = false;
    if (currentStroke && currentStroke.length > 0) {
      blurStrokes.push(currentStroke);
      currentStroke = null;
    }
    generate();
  }
});
pathCanvas.addEventListener('mouseleave', () => {
  if (isDrawing) {
    isDrawing = false;
    if (currentStroke && currentStroke.length > 0) {
      blurStrokes.push(currentStroke);
      currentStroke = null;
    }
    generate();
  }
});

clearPathBtn.addEventListener('click', () => {
  blurPath = [];
  blurStrokes = [];
  currentStroke = null;
  pctx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
  generate();
});

// ── Ctrl+Z undo last stroke ───────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && currentMode === 'effects') {
    e.preventDefault();
    if (blurStrokes.length === 0) return;
    // Remove last stroke's points from blurPath
    const lastStroke = blurStrokes.pop();
    blurPath.splice(blurPath.length - lastStroke.length, lastStroke.length);
    drawPathOverlay();
    generate();
  }
});

pathBlurEnabled.addEventListener('change', () => {
  pathCanvas.style.pointerEvents = pathBlurEnabled.checked ? 'all' : 'none';
  pathCanvas.style.cursor        = pathBlurEnabled.checked ? 'crosshair' : 'default';
  if (!pathBlurEnabled.checked) pctx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
  generate();
});

// ── Noise chips ───────────────────────────────
$('noiseType').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#noiseType .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  noiseType = chip.dataset.val;
  const isScanline = noiseType === 'scanline';
  $('scanlineSpacingGroup').style.display = isScanline ? '' : 'none';
  $('scanlineWidthGroup').style.display   = isScanline ? '' : 'none';
  generate();
});

// ── Sliders ───────────────────────────────────
const sliderMap = [
  [stripSlider,      stripValue,              'px'],
  [glassSliceWidth,  $('glassSliceVal'),      'px'],
  [glassRefraction,  $('glassRefractionVal'), ''],
  [glassBlur,        $('glassBlurVal'),       ''],
  [glassHighlight,   $('glassHighlightVal'),  ''],
  [glassOpacity,     $('glassOpacityVal'),    '%'],
  [caAmount,         $('caAmountVal'),        'px'],
  [caAngle,          $('caAngleVal'),         '°'],
  [caGreen,          $('caGreenVal'),         'px'],
  [pathRadius,       $('pathRadiusVal'),      'px'],
  [pathBlurStr,      $('pathBlurStrVal'),     ''],
  [noiseIntensity,   $('noiseIntVal'),        ''],
  [noiseSize,        $('noiseSizeVal'),       ''],
  [scanlineSpacing,  $('scanlineSpacingVal'), 'px'],
  [scanlineWidth,    $('scanlineWidthVal'),   'px'],
];

sliderMap.forEach(([slider, label, unit]) => {
  if (!slider) return;
  slider.addEventListener('input', () => { updateLabel(slider, label, unit); generate(); });
  updateLabel(slider, label, unit);
});

// ── Effect toggles ────────────────────────────
[glassEnabled, caEnabled, noiseEnabled].forEach(cb => cb.addEventListener('change', generate));

// ── Download ──────────────────────────────────
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = currentMode === 'splice' ? 'spliced.png' : 'effects.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ── Init ──────────────────────────────────────
setMode('splice');
