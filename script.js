/* ─────────────────────────────────────────────
   Cool Image Effects :)
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

const asciiEnabled = $('asciiEnabled');
const asciiSize    = $('asciiSize');

const downloadBtn = $('download');

// ── State ─────────────────────────────────────
let currentMode = 'splice';
let imgA = null, imgB = null, imgE = null;
let noiseType      = 'film';
let noiseMono      = true;
let asciiColorMode = 'mono';
let asciiBgMode    = 'black';
let asciiCharset   = 'standard';
let blurPath   = [];   // flat array of {x,y} points — the full drawn path
let blurStrokes = [];  // array of stroke arrays for undo (each stroke = array of points)
let currentStroke = null;
let isDrawing = false;

// ── Gradient Map state ────────────────────────
let gradientStops = [
  { pos: 0, color: '#000000' },
  { pos: 1, color: '#ffffff' },
];
let gradientOpacity = 100;
let gradientBlend   = 'normal';

const GRADIENT_PRESETS = {
  // ── Originals ──────────────────────────────
  'bw':      [{ pos: 0, color: '#000000' }, { pos: 1, color: '#ffffff' }],
  'sunset':  [{ pos: 0, color: '#0d0221' }, { pos: 0.3, color: '#c0392b' }, { pos: 0.6, color: '#e67e22' }, { pos: 1, color: '#f9ca24' }],
  'ocean':   [{ pos: 0, color: '#0f0c29' }, { pos: 0.5, color: '#302b63' }, { pos: 1, color: '#24243e' }],
  'neon':    [{ pos: 0, color: '#0d0221' }, { pos: 0.4, color: '#7b2ff7' }, { pos: 0.7, color: '#f107a3' }, { pos: 1, color: '#fffc00' }],
  'duotone': [{ pos: 0, color: '#1a1a2e' }, { pos: 1, color: '#e94560' }],
  'gold':    [{ pos: 0, color: '#3d2b1f' }, { pos: 0.4, color: '#c8860a' }, { pos: 0.7, color: '#f5d020' }, { pos: 1, color: '#fff9c4' }],

  // ── Pink Glow ──────────────────────────────
  // 1: charcoal → dusty rose → pale pink → ice blue
  'pg1': [
    { pos: 0,    color: '#2a2a30' },
    { pos: 0.35, color: '#c9a0b0' },
    { pos: 0.65, color: '#f0c8d8' },
    { pos: 0.85, color: '#c8d8ee' },
    { pos: 1,    color: '#8898b8' },
  ],
  // 2: dark slate → charcoal → rose → lavender → dark slate
  'pg2': [
    { pos: 0,    color: '#252530' },
    { pos: 0.2,  color: '#383845' },
    { pos: 0.45, color: '#d4607a' },
    { pos: 0.6,  color: '#e8a0c0' },
    { pos: 0.75, color: '#b8a0cc' },
    { pos: 1,    color: '#303040' },
  ],
  // 3: soft pink → cream yellow → pale cream → soft pink
  'pg3': [
    { pos: 0,    color: '#f0b8cc' },
    { pos: 0.3,  color: '#f8e8c0' },
    { pos: 0.55, color: '#fdf4d8' },
    { pos: 0.75, color: '#f8ecc8' },
    { pos: 1,    color: '#f0b8cc' },
  ],
  // 4: dark navy → blue-grey → rose → slate → hot pink → pale blue-white
  'pg4': [
    { pos: 0,    color: '#141828' },
    { pos: 0.2,  color: '#2c3450' },
    { pos: 0.42, color: '#c85878' },
    { pos: 0.6,  color: '#7888a8' },
    { pos: 0.78, color: '#e03870' },
    { pos: 1,    color: '#d8e8f8' },
  ],
  // 5: deep rose → rose → soft pink → near white → soft pink → rose
  'pg5': [
    { pos: 0,    color: '#a82848' },
    { pos: 0.2,  color: '#d84870' },
    { pos: 0.45, color: '#f0a0b8' },
    { pos: 0.6,  color: '#fdf0f4' },
    { pos: 0.8,  color: '#f0a0b8' },
    { pos: 1,    color: '#d84870' },
  ],
  // 6: dark grey → silver → white → silver → dark grey
  'pg6': [
    { pos: 0,    color: '#383838' },
    { pos: 0.25, color: '#a8a8b0' },
    { pos: 0.5,  color: '#f8f8f8' },
    { pos: 0.75, color: '#a8a8b0' },
    { pos: 1,    color: '#383838' },
  ],
  // 7: near black → deep crimson → hot pink → crimson → near black
  'pg7': [
    { pos: 0,    color: '#0a0a0a' },
    { pos: 0.2,  color: '#6a0828' },
    { pos: 0.45, color: '#e8185a' },
    { pos: 0.6,  color: '#f060a0' },
    { pos: 0.78, color: '#c01048' },
    { pos: 1,    color: '#0a0a0a' },
  ],
  // 8: near black → dark grey → soft pink → near white → soft pink → dark grey
  'pg8': [
    { pos: 0,    color: '#080808' },
    { pos: 0.2,  color: '#404040' },
    { pos: 0.5,  color: '#e8b0c8' },
    { pos: 0.65, color: '#fdf4f8' },
    { pos: 0.8,  color: '#e8b0c8' },
    { pos: 1,    color: '#404040' },
  ],

  // ── Signography ────────────────────────────
  // 표고3: purple → magenta → cyan → magenta → cyan → lime
  'sg3': [
    { pos: 0,    color: '#7800c8' },
    { pos: 0.12, color: '#f000a0' },
    { pos: 0.22, color: '#00e8d8' },
    { pos: 0.35, color: '#f000c0' },
    { pos: 0.55, color: '#00c8e8' },
    { pos: 1,    color: '#a0f000' },
  ],
  // 표고4: black → deep red → red → warm grey → silver → light grey
  'sg4': [
    { pos: 0,    color: '#080000' },
    { pos: 0.18, color: '#880000' },
    { pos: 0.35, color: '#e80000' },
    { pos: 0.55, color: '#887870' },
    { pos: 0.75, color: '#b8b0a8' },
    { pos: 1,    color: '#d8d0c8' },
  ],
  // 표고5: magenta → soft pink → lavender → peach-orange → mint → pale cyan
  'sg5': [
    { pos: 0,    color: '#d800a8' },
    { pos: 0.2,  color: '#f0a0c8' },
    { pos: 0.4,  color: '#c8b0e8' },
    { pos: 0.6,  color: '#f0a860' },
    { pos: 0.8,  color: '#80e8c0' },
    { pos: 1,    color: '#b8f0f0' },
  ],
  // 표고6: dark grey → brown-grey → red → warm grey → silver → light grey
  'sg6': [
    { pos: 0,    color: '#282020' },
    { pos: 0.2,  color: '#504038' },
    { pos: 0.38, color: '#c80000' },
    { pos: 0.55, color: '#807068' },
    { pos: 0.75, color: '#b0a8a0' },
    { pos: 1,    color: '#d0c8c0' },
  ],
  // 표고7: dark navy → blue → bright blue → silver → warm grey → light grey
  'sg7': [
    { pos: 0,    color: '#080820' },
    { pos: 0.2,  color: '#1818a0' },
    { pos: 0.38, color: '#0038f8' },
    { pos: 0.55, color: '#b0b0b8' },
    { pos: 0.75, color: '#a09890' },
    { pos: 1,    color: '#d0c8c0' },
  ],
  // 표고8: dark grey → silver → white → silver → pale cyan → light grey
  'sg8': [
    { pos: 0,    color: '#303030' },
    { pos: 0.3,  color: '#a8a8a8' },
    { pos: 0.5,  color: '#f8f8f8' },
    { pos: 0.7,  color: '#a8b8b8' },
    { pos: 0.85, color: '#b8d8d8' },
    { pos: 1,    color: '#c8c8c8' },
  ],
  // 표고9: white → light grey → silver → white → light grey → white
  'sg9': [
    { pos: 0,    color: '#f8f8f8' },
    { pos: 0.25, color: '#c8c8c8' },
    { pos: 0.5,  color: '#e0e0e0' },
    { pos: 0.75, color: '#f8f8f8' },
    { pos: 1,    color: '#e0e0e0' },
  ],
  // 표고10: black → red → dark grey → teal-green → warm grey → light grey
  'sg10': [
    { pos: 0,    color: '#000000' },
    { pos: 0.15, color: '#e80000' },
    { pos: 0.35, color: '#383030' },
    { pos: 0.55, color: '#208060' },
    { pos: 0.75, color: '#908880' },
    { pos: 1,    color: '#c8c0b8' },
  ],
  // 표고11: blue → cyan → white → pale pink → white → pale lavender
  'sg11': [
    { pos: 0,    color: '#0050f0' },
    { pos: 0.25, color: '#00d8f8' },
    { pos: 0.5,  color: '#f8f8f8' },
    { pos: 0.65, color: '#f8d0e0' },
    { pos: 0.8,  color: '#f8f8f8' },
    { pos: 1,    color: '#d8d0f0' },
  ],

  // ── Random ─────────────────────────────────
  // R1: red → orange → yellow → magenta → purple → cyan → green
  'rnd1': [
    { pos: 0,    color: '#f00000' },
    { pos: 0.17, color: '#f87000' },
    { pos: 0.33, color: '#f8e000' },
    { pos: 0.5,  color: '#e000c0' },
    { pos: 0.67, color: '#6000c0' },
    { pos: 0.83, color: '#00c8e8' },
    { pos: 1,    color: '#00d840' },
  ],
  // R2: red → white-lavender → yellow-orange → cyan → green
  'rnd2': [
    { pos: 0,    color: '#e80000' },
    { pos: 0.3,  color: '#e8d8f0' },
    { pos: 0.5,  color: '#f0c040' },
    { pos: 0.7,  color: '#00d8e8' },
    { pos: 1,    color: '#00e060' },
  ],
  // R3: magenta → lime → green → red → blue → cyan
  'rnd3': [
    { pos: 0,    color: '#f000a0' },
    { pos: 0.2,  color: '#a0e000' },
    { pos: 0.4,  color: '#00b800' },
    { pos: 0.55, color: '#e80000' },
    { pos: 0.75, color: '#0000e8' },
    { pos: 1,    color: '#00e8e8' },
  ],
  // R4: blue → cyan → white → red → green → magenta
  'rnd4': [
    { pos: 0,    color: '#1818e8' },
    { pos: 0.2,  color: '#40c8f8' },
    { pos: 0.38, color: '#f0f0f8' },
    { pos: 0.55, color: '#f00000' },
    { pos: 0.75, color: '#00c800' },
    { pos: 1,    color: '#e000c0' },
  ],
  // R5: blue → lavender → pink → red → orange → yellow → blue → green
  'rnd5': [
    { pos: 0,    color: '#4060e0' },
    { pos: 0.15, color: '#a080e0' },
    { pos: 0.3,  color: '#f060a0' },
    { pos: 0.45, color: '#e80000' },
    { pos: 0.58, color: '#f08000' },
    { pos: 0.7,  color: '#f8e000' },
    { pos: 0.82, color: '#0040e0' },
    { pos: 1,    color: '#00c840' },
  ],
  // R6: pink → orange → blue → red → pink → white
  'rnd6': [
    { pos: 0,    color: '#f060a0' },
    { pos: 0.2,  color: '#f08030' },
    { pos: 0.4,  color: '#2040e0' },
    { pos: 0.6,  color: '#e80020' },
    { pos: 0.8,  color: '#f060a0' },
    { pos: 1,    color: '#f8f0f4' },
  ],
  // R7: green → red → purple → cyan → cyan → orange → yellow
  'rnd7': [
    { pos: 0,    color: '#00b800' },
    { pos: 0.18, color: '#e80000' },
    { pos: 0.35, color: '#8000c0' },
    { pos: 0.5,  color: '#00c8e8' },
    { pos: 0.65, color: '#00d8e0' },
    { pos: 0.82, color: '#f08000' },
    { pos: 1,    color: '#f8e000' },
  ],
  // R8: cyan → yellow-orange → pink → cyan → purple → pink
  'rnd8': [
    { pos: 0,    color: '#00e8e0' },
    { pos: 0.25, color: '#f8c000' },
    { pos: 0.45, color: '#f060a0' },
    { pos: 0.6,  color: '#00c8e8' },
    { pos: 0.78, color: '#8000c0' },
    { pos: 1,    color: '#f060b0' },
  ],
  // R9: red → pink → yellow → pink → red
  'rnd9': [
    { pos: 0,    color: '#e80000' },
    { pos: 0.3,  color: '#f080a0' },
    { pos: 0.5,  color: '#f8e040' },
    { pos: 0.7,  color: '#f080a0' },
    { pos: 1,    color: '#e80000' },
  ],

  // ── Holographic ────────────────────────────
  // holo1: pale blue → lavender → pink → pale yellow → mint → pale blue
  'holo1': [
    { pos: 0,    color: '#a8c8f0' },
    { pos: 0.25, color: '#c8a8e8' },
    { pos: 0.45, color: '#f0a8c8' },
    { pos: 0.65, color: '#f8f0b8' },
    { pos: 0.82, color: '#a8f0d8' },
    { pos: 1,    color: '#a8d0f0' },
  ],
  // holo2: cyan → pink → lavender → pale pink → mint → pale blue
  'holo2': [
    { pos: 0,    color: '#80e8f0' },
    { pos: 0.2,  color: '#f0a0c8' },
    { pos: 0.4,  color: '#c8a8e8' },
    { pos: 0.6,  color: '#f8d0e0' },
    { pos: 0.8,  color: '#a0f0d8' },
    { pos: 1,    color: '#a8d8f0' },
  ],
  // holo3: pale blue → lavender → pale pink → peach → pale yellow → white
  'holo3': [
    { pos: 0,    color: '#b0c8f0' },
    { pos: 0.25, color: '#c8b0e8' },
    { pos: 0.45, color: '#f0c0d8' },
    { pos: 0.65, color: '#f8d8b8' },
    { pos: 0.82, color: '#f8f0c0' },
    { pos: 1,    color: '#f8f8f8' },
  ],
  // holo4: cyan → mint → pale green → pale yellow → white → pale cyan
  'holo4': [
    { pos: 0,    color: '#40d8f0' },
    { pos: 0.25, color: '#80f0d0' },
    { pos: 0.45, color: '#b0f0c0' },
    { pos: 0.65, color: '#f0f8b0' },
    { pos: 0.82, color: '#f8f8f0' },
    { pos: 1,    color: '#c0f0f0' },
  ],
  // holo5: mint → pale green → pale yellow → white → pale yellow → mint
  'holo5': [
    { pos: 0,    color: '#80f0c8' },
    { pos: 0.25, color: '#b0f0b8' },
    { pos: 0.45, color: '#e8f8a8' },
    { pos: 0.6,  color: '#f8f8f0' },
    { pos: 0.78, color: '#e8f8a8' },
    { pos: 1,    color: '#80f0c8' },
  ],
  // holo6: pale blue → pink → lavender → pale pink → mint → pale blue
  'holo6': [
    { pos: 0,    color: '#a0c0f0' },
    { pos: 0.2,  color: '#f0a0c0' },
    { pos: 0.4,  color: '#c8a8e8' },
    { pos: 0.6,  color: '#f8c8d8' },
    { pos: 0.8,  color: '#a0f0d0' },
    { pos: 1,    color: '#a8c8f0' },
  ],
};

// ── Halftone state ────────────────────────────
let halftoneType   = 'dots';
let halftoneInvert = false;

// ── Mode tabs ─────────────────────────────────
document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    setMode(tab.dataset.mode);
  });
});

function setMode(mode) {
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
  const s6 = stage(); applyGradientMap(s6.getContext('2d'), s5, W, H);
  const s7 = stage(); applyHalftone(s7.getContext('2d'), s6, W, H);
  const s8 = stage(); applyASCII(s8.getContext('2d'), s7, W, H);

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(s8, 0, 0);
  showCanvas();
  // Only show path overlay while actively drawing — clear it after render
  if (!isDrawing) {
    pctx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
  } else {
    drawPathOverlay();
  }
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
      if (noiseMono) {
        d[i]=clamp(d[i]+g,0,255); d[i+1]=clamp(d[i+1]+g,0,255); d[i+2]=clamp(d[i+2]+g,0,255);
      } else {
        d[i]  =clamp(d[i]  +(Math.random()+Math.random()+Math.random()-1.5)*intensity,0,255);
        d[i+1]=clamp(d[i+1]+(Math.random()+Math.random()+Math.random()-1.5)*intensity,0,255);
        d[i+2]=clamp(d[i+2]+(Math.random()+Math.random()+Math.random()-1.5)*intensity,0,255);
      }
    }
  } else if (type === 'rgb') {
    for (let i = 0; i < d.length; i += 4) {
      if (noiseMono) {
        const g = (Math.random()-.5)*intensity*2;
        d[i]=clamp(d[i]+g,0,255); d[i+1]=clamp(d[i+1]+g,0,255); d[i+2]=clamp(d[i+2]+g,0,255);
      } else {
        d[i]  =clamp(d[i]  +(Math.random()-.5)*intensity*2,0,255);
        d[i+1]=clamp(d[i+1]+(Math.random()-.5)*intensity*2,0,255);
        d[i+2]=clamp(d[i+2]+(Math.random()-.5)*intensity*2,0,255);
      }
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

// ── Gradient Map ──────────────────────────────
// Parses a CSS hex color string to [r, g, b] (0-255).
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

// Interpolate gradient stops at position t (0..1), returns [r,g,b].
function sampleGradient(stops, t) {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  if (t <= sorted[0].pos) return hexToRgb(sorted[0].color);
  if (t >= sorted[sorted.length - 1].pos) return hexToRgb(sorted[sorted.length - 1].color);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (t >= a.pos && t <= b.pos) {
      const f = (t - a.pos) / (b.pos - a.pos);
      const ca = hexToRgb(a.color), cb = hexToRgb(b.color);
      return [
        ca[0] + (cb[0] - ca[0]) * f,
        ca[1] + (cb[1] - ca[1]) * f,
        ca[2] + (cb[2] - ca[2]) * f,
      ];
    }
  }
  return [0, 0, 0];
}

// RGB ↔ HSL helpers for the "Color" blend mode
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h)       * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

function applyGradientMap(dst, srcCanvas, W, H) {
  if (!$('gradientEnabled').checked) { dst.drawImage(srcCanvas, 0, 0); return; }

  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  tmp.getContext('2d').drawImage(srcCanvas, 0, 0);
  const src = tmp.getContext('2d').getImageData(0, 0, W, H).data;
  const out = new ImageData(W, H);
  const od  = out.data;
  const opacity = gradientOpacity / 100;
  const blend   = gradientBlend;

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i], g = src[i + 1], b = src[i + 2], a = src[i + 3];
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const [gr, gg, gb] = sampleGradient(gradientStops, lum);

    // Apply blend mode between gradient result and original
    let br, bg_, bb;
    if (blend === 'multiply') {
      br = (gr * r) / 255;
      bg_ = (gg * g) / 255;
      bb = (gb * b) / 255;
    } else if (blend === 'screen') {
      br = 255 - (255 - gr) * (255 - r) / 255;
      bg_ = 255 - (255 - gg) * (255 - g) / 255;
      bb = 255 - (255 - gb) * (255 - b) / 255;
    } else if (blend === 'overlay') {
      br = r < 128 ? (2 * gr * r) / 255 : 255 - 2 * (255 - gr) * (255 - r) / 255;
      bg_ = g < 128 ? (2 * gg * g) / 255 : 255 - 2 * (255 - gg) * (255 - g) / 255;
      bb = b < 128 ? (2 * gb * b) / 255 : 255 - 2 * (255 - gb) * (255 - b) / 255;
    } else if (blend === 'color') {
      // Color blend: H+S from gradient, L from original
      const [, , lOrig] = rgbToHsl(r, g, b);
      const [hGrad, sGrad] = rgbToHsl(gr, gg, gb);
      [br, bg_, bb] = hslToRgb(hGrad, sGrad, lOrig);
    } else {
      // normal
      br = gr; bg_ = gg; bb = gb;
    }

    // Mix with original based on opacity
    od[i]     = clamp(br * opacity + r * (1 - opacity), 0, 255);
    od[i + 1] = clamp(bg_ * opacity + g * (1 - opacity), 0, 255);
    od[i + 2] = clamp(bb * opacity + b * (1 - opacity), 0, 255);
    od[i + 3] = a;
  }
  dst.putImageData(out, 0, 0);
}

// ── Gradient bar + stop UI ────────────────────
function renderGradientBar() {
  const bar = $('gradientBar');
  if (!bar) return;
  bar.width = bar.offsetWidth || 220;
  const bc = bar.getContext('2d');
  const sorted = [...gradientStops].sort((a, b) => a.pos - b.pos);
  const grad = bc.createLinearGradient(0, 0, bar.width, 0);
  sorted.forEach(s => grad.addColorStop(s.pos, s.color));
  bc.fillStyle = grad;
  bc.fillRect(0, 0, bar.width, bar.height);
}

function renderGradientStopUI() {
  const container = $('gradientStops');
  if (!container) return;

  // Remove any previously body-appended color inputs from this UI
  document.querySelectorAll('.gradient-color-input').forEach(el => el.remove());

  container.innerHTML = '';
  gradientStops.forEach((stop, idx) => {
    const item = document.createElement('div');
    item.className = 'gradient-stop-item';

    const swatch = document.createElement('div');
    swatch.className = 'gradient-stop-swatch';
    swatch.style.background = stop.color;

    // Append color input to body so the picker popup isn't clipped or
    // dismissed by mousedown events bubbling through the sidebar.
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = stop.color;
    colorInput.className = 'gradient-color-input';
    colorInput.style.cssText = 'position:fixed;opacity:0;width:0;height:0;pointer-events:none;';
    document.body.appendChild(colorInput);

    // Use both 'input' (live drag) and 'change' (final pick)
    const onColorChange = () => {
      gradientStops[idx].color = colorInput.value;
      swatch.style.background = colorInput.value;
      renderGradientBar();
      generate();
    };
    colorInput.addEventListener('input', onColorChange);
    colorInput.addEventListener('change', onColorChange);

    swatch.addEventListener('click', (e) => {
      e.stopPropagation();
      colorInput.click();
    });

    const posLabel = document.createElement('span');
    posLabel.className = 'gradient-stop-pos';
    posLabel.textContent = stop.pos.toFixed(2);

    item.appendChild(swatch);
    item.appendChild(posLabel);
    container.appendChild(item);
  });
}

function updateGradientUI() {
  renderGradientBar();
  renderGradientStopUI();
}

// ── Halftone ──────────────────────────────────
function applyHalftone(dst, srcCanvas, W, H) {
  if (!$('halftoneEnabled').checked) { dst.drawImage(srcCanvas, 0, 0); return; }

  const size   = +$('halftoneSize').value;
  const angleDeg = +$('halftoneAngle').value;
  const angle  = (angleDeg * Math.PI) / 180;
  const fg     = $('halftoneFg').value;
  const bg     = $('halftoneBg').value;
  const invert = halftoneInvert;
  const type   = halftoneType;

  // Read source brightness
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  tmp.getContext('2d').drawImage(srcCanvas, 0, 0);
  const srcData = tmp.getContext('2d').getImageData(0, 0, W, H).data;

  function brightness(x, y) {
    const xi = clamp(Math.round(x), 0, W - 1);
    const yi = clamp(Math.round(y), 0, H - 1);
    const i  = (yi * W + xi) * 4;
    return 0.299 * srcData[i] + 0.587 * srcData[i + 1] + 0.114 * srcData[i + 2];
  }

  // Average brightness over a small region for smoother results
  function avgBrightness(cx, cy, r) {
    let sum = 0, n = 0;
    const step = Math.max(1, Math.floor(r / 2));
    for (let dy = -r; dy <= r; dy += step) {
      for (let dx = -r; dx <= r; dx += step) {
        sum += brightness(cx + dx, cy + dy);
        n++;
      }
    }
    return sum / n;
  }

  // Fill background
  dst.fillStyle = bg;
  dst.fillRect(0, 0, W, H);
  dst.fillStyle = fg;
  dst.strokeStyle = fg;

  if (type === 'dots') {
    // Rotate the grid by computing dot centers in rotated space,
    // but sample brightness at the original (unrotated) image coordinates.
    // This keeps the image upright while the dot grid is angled.
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const cx0 = W / 2, cy0 = H / 2;

    // Determine grid bounds in rotated space to cover the full image
    const diag = Math.ceil(Math.hypot(W, H));
    const halfGrid = Math.ceil(diag / size) + 2;

    for (let row = -halfGrid; row <= halfGrid; row++) {
      for (let col = -halfGrid; col <= halfGrid; col++) {
        // Dot center in rotated grid space (relative to image center)
        const gx = col * size + size / 2;
        const gy = row * size + size / 2;

        // Rotate back to image space
        const ix = cx0 + gx * cos - gy * sin;
        const iy = cy0 + gx * sin + gy * cos;

        // Skip dots outside the image
        if (ix < -size || ix > W + size || iy < -size || iy > H + size) continue;

        const bri = avgBrightness(ix, iy, Math.ceil(size / 3));
        const t   = bri / 255;
        const dotR = invert
          ? (1 - t) * (size / 2) * 0.92
          :       t * (size / 2) * 0.92;

        if (dotR < 0.4) continue;

        // Draw dot at the rotated grid position (in image space)
        dst.beginPath();
        dst.arc(ix, iy, dotR, 0, Math.PI * 2);
        dst.fill();
      }
    }
  } else {
    // Lines mode — horizontal contour lines displaced by brightness.
    // Each line is a smooth polyline; displacement is proportional to brightness.
    // We sample every few pixels for performance and smooth with a small average.
    const lineWidth = Math.max(0.8, size * 0.18);
    const amplitude = size * 0.6; // max displacement ±
    dst.lineWidth = lineWidth;

    for (let row = 0; row * size <= H + size; row++) {
      const baseY = row * size;
      dst.beginPath();
      let started = false;
      for (let x = 0; x <= W; x += 2) {
        const bri = avgBrightness(x, baseY, 1);
        // Map brightness 0..255 → displacement -amplitude..+amplitude
        const disp = ((bri / 255) - 0.5) * 2 * amplitude;
        const y = baseY + disp;
        if (!started) { dst.moveTo(x, y); started = true; }
        else dst.lineTo(x, y);
      }
      dst.stroke();
    }
  }
}

// ── ASCII ─────────────────────────────────────
// Maps each cell's average brightness to a character, drawn with canvas 2D text.
// Charsets ordered dark→light (high density = dark areas).
const ASCII_CHARSETS = {
  standard: ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' '],
  blocks:   ['█', '▓', '▒', '░', ' '],
  minimal:  ['#', '+', '-', '.', ' '],
};

function applyASCII(dst, srcCanvas, W, H) {
  if (!asciiEnabled.checked) { dst.drawImage(srcCanvas, 0, 0); return; }

  const cell    = +asciiSize.value;
  const chars   = ASCII_CHARSETS[asciiCharset];
  const colored = asciiColorMode === 'color';
  const bg      = asciiBgMode;

  // Sample source at reduced resolution
  const samp = document.createElement('canvas');
  const cols  = Math.ceil(W / cell);
  const rows  = Math.ceil(H / cell);
  samp.width  = cols;
  samp.height = rows;
  samp.getContext('2d').drawImage(srcCanvas, 0, 0, cols, rows);
  const pixels = samp.getContext('2d').getImageData(0, 0, cols, rows).data;

  // Draw background
  if (bg === 'black') {
    dst.fillStyle = '#000';
    dst.fillRect(0, 0, W, H);
  } else if (bg === 'white') {
    dst.fillStyle = '#fff';
    dst.fillRect(0, 0, W, H);
  }
  // 'transparent' — leave blank (srcCanvas already drawn if needed)

  dst.font = `bold ${cell}px monospace`;
  dst.textBaseline = 'top';

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pi = (row * cols + col) * 4;
      const r  = pixels[pi], g = pixels[pi+1], b = pixels[pi+2];
      // Perceived luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const idx = Math.floor((lum / 255) * (chars.length - 1));
      const ch  = chars[idx];
      if (ch === ' ') continue;

      if (colored) {
        dst.fillStyle = `rgb(${r},${g},${b})`;
      } else {
        // Mono: white on dark bg, black on light bg
        dst.fillStyle = bg === 'white' ? '#000' : '#fff';
      }
      dst.fillText(ch, col * cell, row * cell);
    }
  }
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
  // hide color chip for scanline/dust (they don't use it meaningfully)
  $('noiseColorGroup').style.display = (isScanline) ? 'none' : '';
  generate();
});

$('noiseColor').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#noiseColor .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  noiseMono = chip.dataset.val === 'mono';
  generate();
});

// ── ASCII chips ───────────────────────────────
$('asciiColor').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#asciiColor .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  asciiColorMode = chip.dataset.val;
  generate();
});

$('asciiBg').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#asciiBg .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  asciiBgMode = chip.dataset.val;
  generate();
});

$('asciiCharset').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#asciiCharset .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  asciiCharset = chip.dataset.val;
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
  [$('gradientOpacity'), $('gradientOpacityVal'), ''],
  [$('halftoneSize'),    $('halftoneSizeVal'),    ''],
  [$('halftoneAngle'),   $('halftoneAngleVal'),   '°'],
  [asciiSize,        $('asciiSizeVal'),       'px'],
];

sliderMap.forEach(([slider, label, unit]) => {
  if (!slider) return;
  slider.addEventListener('input', () => { updateLabel(slider, label, unit); generate(); });
  updateLabel(slider, label, unit);
});

// ── Effect toggles ────────────────────────────
[glassEnabled, caEnabled, noiseEnabled, asciiEnabled,
 $('gradientEnabled'), $('halftoneEnabled')
].forEach(cb => cb.addEventListener('change', generate));

// ── Gradient Map controls ─────────────────────
$('gradientPreset').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#gradientPreset .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const preset = GRADIENT_PRESETS[chip.dataset.val];
  if (preset) {
    gradientStops = preset.map(s => ({ ...s }));
    updateGradientUI();
    generate();
  }
});

$('gradientBlend').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#gradientBlend .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  gradientBlend = chip.dataset.val;
  generate();
});

$('gradientOpacity').addEventListener('input', () => {
  gradientOpacity = +$('gradientOpacity').value;
  updateLabel($('gradientOpacity'), $('gradientOpacityVal'), '');
  generate();
});

$('gradientAddStop').addEventListener('click', () => {
  gradientStops.push({ pos: 0.5, color: '#888888' });
  updateGradientUI();
  generate();
});

$('gradientRemoveStop').addEventListener('click', () => {
  if (gradientStops.length > 2) {
    gradientStops.pop();
    updateGradientUI();
    generate();
  }
});

// ── Halftone controls ─────────────────────────
$('halftoneType').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#halftoneType .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  halftoneType = chip.dataset.val;
  // Show/hide angle control (only relevant for dots)
  $('halftoneAngleGroup').style.display = halftoneType === 'dots' ? '' : 'none';
  generate();
});

$('halftoneFg').addEventListener('input', generate);
$('halftoneBg').addEventListener('input', generate);

$('halftoneInvert').addEventListener('change', () => {
  halftoneInvert = $('halftoneInvert').checked;
  generate();
});

// ── Download ──────────────────────────────────
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = currentMode === 'splice' ? 'spliced.png' : 'effects.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ── Init ──────────────────────────────────────
setMode('splice');
// Initialize gradient UI after DOM is ready
updateGradientUI();
