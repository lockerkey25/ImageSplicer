const $ = id => document.getElementById(id);

const image1Input = $('image1');
const image2Input = $('image2');
const preview1 = $('preview1');
const preview2 = $('preview2');

const stripSlider = $('stripWidth');
const stripValue = $('stripValue');

const generateBtn = $('generate');
const downloadBtn = $('download');

const canvas = $('canvas');
const ctx = canvas.getContext('2d');

let imgA = null;
let imgB = null;

function loadImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}

async function handleUpload(input, preview, which) {
  const file = input.files[0];
  if (!file) return;

  const img = await loadImage(file);
  preview.src = img.src;

  if (which === 'A') {
    imgA = img;
  } else {
    imgB = img;
  }

  if (imgA && imgB) {
    updateSliderMax();
    generate();
  }
}

function updateSliderMax() {
  const width = Math.min(imgA.width, imgB.width);
  const maxStrip = Math.floor(width / 2);

  stripSlider.max = maxStrip;
  stripSlider.value = Math.min(+stripSlider.value, maxStrip);

  updateStripLabel();
}

function updateStripLabel() {
  stripValue.textContent = `${stripSlider.value} px`;
}

function fitImage(img, width, height) {
  const temp = document.createElement('canvas');
  temp.width = width;
  temp.height = height;

  const tctx = temp.getContext('2d');

  const scale = Math.max(width / img.width, height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;

  const x = (width - w) / 2;
  const y = (height - h) / 2;

  tctx.drawImage(img, x, y, w, h);

  return temp;
}

function generate() {
  if (!imgA || !imgB) return;

  const width = Math.min(imgA.width, imgB.width);
  const height = Math.min(imgA.height, imgB.height);
  const strip = +stripSlider.value;

  updateStripLabel();

  canvas.width = width;
  canvas.height = height;

  const a = fitImage(imgA, width, height);
  const b = fitImage(imgB, width, height);

  let useA = true;

  for (let x = 0; x < width; x += strip) {
    const source = useA ? a : b;
    const w = Math.min(strip, width - x);

    ctx.drawImage(source, x, 0, w, height, x, 0, w, height);

    useA = !useA;
  }

  downloadBtn.disabled = false;
}

function download() {
  const link = document.createElement('a');
  link.download = 'spliced.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

image1Input.addEventListener('change', () =>
  handleUpload(image1Input, preview1, 'A')
);

image2Input.addEventListener('change', () =>
  handleUpload(image2Input, preview2, 'B')
);

stripSlider.addEventListener('input', generate);

generateBtn.addEventListener('click', generate);
downloadBtn.addEventListener('click', download);

updateStripLabel();