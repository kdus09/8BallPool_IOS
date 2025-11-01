/* ===========================================================
   🎱 BILAR v9 PRO Dashboard Final
   File: app.js
   Môi trường: Safari iPhone (Add to Home Screen)
   =========================================================== */

/* ==========
   BIẾN TOÀN CỤC
   ========== */
const powerBtn = document.getElementById('powerBtn');
const bubbleMenu = document.getElementById('bubbleMenu');
const dashboard = document.getElementById('dashboard');
const sidebarItems = document.querySelectorAll('.sidebar li');
const tabs = document.querySelectorAll('.tab');
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

let powerOn = false;
let menuOpen = false;
let balls = [];
let holes = [];
let neonEnabled = true;
let glowEnabled = true;

/* ==========
   ÂM THANH CLICK iOS
   ========== */
function playClick() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

/* ==========
   POWER ON/OFF
   ========== */
powerBtn.addEventListener('touchstart', () => {
  playClick();
  powerOn = !powerOn;

  if (powerOn) {
    powerBtn.classList.remove('power-off');
    bubbleMenu.classList.remove('hidden');
  } else {
    bubbleMenu.classList.add('hidden');
    dashboard.classList.add('hidden');
    clearCanvas();
  }

  // lưu trạng thái
  localStorage.setItem('bilar_power', JSON.stringify(powerOn));
});

/* ==========
   BUBBLE MENU (⚙️)
   ========== */
bubbleMenu.addEventListener('touchstart', () => {
  playClick();
  menuOpen = !menuOpen;
  dashboard.classList.toggle('hidden', !menuOpen);
});

/* ==========
   SIDEBAR MENU - CHUYỂN TAB
   ========== */
sidebarItems.forEach(item => {
  item.addEventListener('touchstart', () => {
    sidebarItems.forEach(li => li.classList.remove('active'));
    item.classList.add('active');

    const targetTab = item.dataset.tab;
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${targetTab}`).classList.add('active');
  });
});

/* ==========
   CĂN BÀN - 4 LỖ CẦU VỒNG
   ========== */
document.getElementById('btnCalibrate').addEventListener('touchstart', () => {
  createHoles();
  saveState();
});

/* ==========
   BI / VẼ ĐƯỜNG
   ========== */
document.getElementById('btnAim').addEventListener('touchstart', () => {
  setupBallPlacement();
});
document.getElementById('btnClearBalls').addEventListener('touchstart', () => {
  balls = [];
  clearCanvas();
  saveState();
});

/* ==========
   ĐẶT LẠI TOÀN BỘ
   ========== */
document.getElementById('btnResetAll').addEventListener('touchstart', () => {
  localStorage.clear();
  location.reload();
});

/* ==========
   HIỆU ỨNG (toggle)
   ========== */
document.getElementById('toggleNeon').addEventListener('change', (e) => {
  neonEnabled = e.target.checked;
  saveState();
});
document.getElementById('toggleGlow').addEventListener('change', (e) => {
  glowEnabled = e.target.checked;
  saveState();
});

/* ==========
   CANVAS SETUP
   ========== */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* ==========
   VẼ TOÀN BỘ
   ========== */
function draw() {
  clearCanvas();

  // Vẽ lỗ bàn
  holes.forEach(h => {
    ctx.beginPath();
    const grd = ctx.createLinearGradient(0, 0, 25, 25);
    grd.addColorStop(0, "red");
    grd.addColorStop(0.2, "orange");
    grd.addColorStop(0.4, "yellow");
    grd.addColorStop(0.6, "green");
    grd.addColorStop(0.8, "blue");
    grd.addColorStop(1, "violet");
    ctx.fillStyle = grd;
    ctx.arc(h.x, h.y, 12, 0, Math.PI * 2);
    ctx.fill();
  });

  // Vẽ bi
  balls.forEach((b, i) => {
    const radius = 15;
    const grd = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, radius);
    grd.addColorStop(0, "white");
    grd.addColorStop(1, "#ccc");
    ctx.fillStyle = grd;
    ctx.shadowBlur = glowEnabled ? 20 : 0;
    ctx.shadowColor = "white";
    ctx.beginPath();
    ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Đường ngắm (bi đầu tiên là bi cái)
    if (i === 1) drawAimLine(balls[0], balls[1]);
  });
}

/* ==========
   ĐƯỜNG NGẮM + PHẢN XẠ
   ========== */
function drawAimLine(from, to) {
  if (!neonEnabled) return;

  ctx.lineWidth = 3;
  let angle = Math.atan2(to.y - from.y, to.x - from.x);
  let length = 1000;
  let endX = from.x + Math.cos(angle) * length;
  let endY = from.y + Math.sin(angle) * length;

  // phản xạ biên
  if (endX < 0 || endX > canvas.width) {
    angle = Math.PI - angle;
    endX = from.x + Math.cos(angle) * length;
  }
  if (endY < 0 || endY > canvas.height) {
    angle = -angle;
    endY = from.y + Math.sin(angle) * length;
  }

  const grd = ctx.createLinearGradient(from.x, from.y, endX, endY);
  grd.addColorStop(0, "red");
  grd.addColorStop(0.2, "orange");
  grd.addColorStop(0.4, "yellow");
  grd.addColorStop(0.6, "green");
  grd.addColorStop(0.8, "blue");
  grd.addColorStop(1, "violet");

  ctx.strokeStyle = grd;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // điểm sáng trắng cuối
  ctx.shadowBlur = 10;
  ctx.shadowColor = "white";
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(endX, endY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

/* ==========
   HÀM HỖ TRỢ
   ========== */
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function createHoles() {
  holes = [
    { x: 40, y: 40 },
    { x: canvas.width - 40, y: 40 },
    { x: 40, y: canvas.height - 40 },
    { x: canvas.width - 40, y: canvas.height - 40 },
  ];
  draw();
}

function setupBallPlacement() {
  canvas.addEventListener('touchstart', placeBall);
}

function placeBall(e) {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  balls.push({ x, y });
  if (balls.length > 2) balls = balls.slice(-2);

  draw();
  saveState();
}

/* ==========
   LƯU & KHÔI PHỤC TRẠNG THÁI
   ========== */
function saveState() {
  localStorage.setItem('bilar_balls', JSON.stringify(balls));
  localStorage.setItem('bilar_holes', JSON.stringify(holes));
  localStorage.setItem('bilar_neon', JSON.stringify(neonEnabled));
  localStorage.setItem('bilar_glow', JSON.stringify(glowEnabled));
}

function loadState() {
  balls = JSON.parse(localStorage.getItem('bilar_balls')) || [];
  holes = JSON.parse(localStorage.getItem('bilar_holes')) || [];
  neonEnabled = JSON.parse(localStorage.getItem('bilar_neon')) ?? true;
  glowEnabled = JSON.parse(localStorage.getItem('bilar_glow')) ?? true;
  powerOn = JSON.parse(localStorage.getItem('bilar_power')) ?? false;

  if (powerOn) {
    bubbleMenu.classList.remove('hidden');
  }
  draw();
}
loadState();

/* ==========
   CẬP NHẬT KHUNG HÌNH
   ========== */
function animate() {
  if (powerOn) draw();
  requestAnimationFrame(animate);
}
animate();
