// --- FIREBASE KURULUMU ---
const firebaseConfig = {
    apiKey: "AIzaSyAYgXSq8JUVbikdUct7T3ovciyqsY13ecI",
    authDomain: "my-heart--m.firebaseapp.com",
    databaseURL: "https://my-heart--m-default-rtdb.firebaseio.com",
    projectId: "my-heart--m",
    storageBucket: "my-heart--m.firebasestorage.app",
    messagingSenderId: "862744196687",
    appId: "1:862744196687:web:56d7f3eda8020c379d1c3a"
};

let database = null;
let highscoresRef = null;

try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "...") {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        highscoresRef = database.ref('highscores');
        console.log("Firebase başarıyla başlatıldı.");
    } else {
        console.warn("Firebase config boş, oyun çevrimdışı modda çalışacak.");
    }
} catch (e) {
    console.error("Firebase başlatılırken bir hata oluştu:", e);
}

// --- DEĞİŞKENLER VE ELEMENTLER ---
let currentPlayerName = '';
let currentHighScore = 0;
const lockScreen = document.getElementById('lockScreen');
const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('nameInput');
const gameScreen = document.getElementById('gameScreen');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreValueEl = document.getElementById('scoreValue');
const musicControl = document.getElementById('musicControl');
const backgroundMusic = document.getElementById('backgroundMusic');
const livesValueEl = document.getElementById('livesValue');
const gameOverScreen = document.getElementById('gameOverScreen');
const furkanHighScoreEl = document.getElementById('furkanHighScore');
const merveHighScoreEl = document.getElementById('merveHighScore');
const furkanCrown = document.querySelector('#profileFurkan .crown-icon');
const merveCrown = document.querySelector('#profileMerve .crown-icon');
const tutorialOverlay = document.getElementById('tutorialOverlay');
const finalStartBtn = document.getElementById('finalStartBtn');
const loveMessageOverlay = document.getElementById('loveMessageOverlay');

const pauseControl = document.getElementById('pauseControl');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
let isTurbo = false;

const energyBarFill = document.getElementById('energyBarFill');
// Turbo Sistemi Ayarları
let turboEnergy = 0;
const MAX_TURBO_ENERGY = 100;
const ENERGY_DRAIN_RATE = 0.5;   
const ENERGY_GAIN_PER_HEART = 10; 
const TURBO_SCORE_MULTIPLIER = 2; 
const MIN_ENERGY_TO_START = 100;    

// --- ZORLUK AYARLARI ---
const BASE_SPEED = 0.5;      
const MAX_SPEED = 8.0;      
const DIFFICULTY_CURVE = 0.5; 
let waveOffset = 0;        

// Oyun Alanı Sınırı
const MAX_GAME_WIDTH = 400;

// --- OYUN DURUM DEĞİŞKENLERİ ---
let score = 0;
let hearts = [];
let particles = [];
let gameState = 'playing'; 
let nextMilestoneScore = 10;
let giantHeart = { active: false, scale: 0, opacity: 0 };
let animationFrameId;
let stars = [];
const initialLives = 3;
let lives = initialLives;
let vineY;
let vinePlants = [];
let speedModifier = 1.0;
const baseSpawnRate = 0.021;
let currentSpawnRate = baseSpawnRate;
let spawnRateModifier = 1.0;

// --- EFEKT DEĞİŞKENLERİ ---
let iceEffectActive = false;
let iceTimer = 0;
let rainbowEffectActive = false;
let rainbowTimer = 0;
let nextLetterScoreTarget = 200; 

// --- SİNEMATİK MOD DEĞİŞKENLERİ ---
let celebrationState = 'none';
let celebrationTimer = 0;
let carY = 0;
let smokeParticles = [];
let neonParticles = [];
const carImage = new Image();
carImage.src = 'assets/images/car.png';
let hasCelebrated = false;
let blackScreenOpacity = 0;
let drawnPathCount = 0;

// --- TAKIMYILDIZI VERİLERİ ---
const constellationData = {
    gemini: {
        stars: [{ x: 0.28, y: 0.10 }, { x: 0.32, y: 0.18 }, { x: 0.38, y: 0.32 }, { x: 0.45, y: 0.45 }, { x: 0.48, y: 0.28 }, { x: 0.15, y: 0.15 }, { x: 0.20, y: 0.23 }, { x: 0.10, y: 0.30 }, { x: 0.25, y: 0.38 }, { x: 0.28, y: 0.52 }],
        lines: [[0, 1], [1, 2], [2, 3], [1, 4], [5, 6], [6, 7], [6, 8], [8, 9], [1, 6]]
    },
    pisces: {
        stars: [{ x: 0.60, y: 0.85 }, { x: 0.65, y: 0.75 }, { x: 0.70, y: 0.65 }, { x: 0.72, y: 0.58 }, { x: 0.70, y: 0.53 }, { x: 0.66, y: 0.50 }, { x: 0.62, y: 0.55 }, { x: 0.64, y: 0.61 }, { x: 0.75, y: 0.80 }, { x: 0.82, y: 0.83 }, { x: 0.88, y: 0.81 }, { x: 0.94, y: 0.78 }, { x: 0.90, y: 0.74 }],
        lines: [[0, 1], [0, 8], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 2], [8, 9], [9, 10], [10, 11], [11, 12]]
    }
};

// --- YARDIMCI FONKSİYONLAR ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createStarryNight();
    createVine();
}


function createFloatingHearts() {
    const container = document.querySelector('.hearts-background');
    if (!container) return;

    container.innerHTML = '';

    const symbols = ['MF', 'MF', '❤', 'MF', '♡', 'MF', '💕'];
    
    const MAX_PARTICLES = 45; 
    let particleCount = 0;

    function spawnParticle() {
        if (document.hidden) return;

        const el = document.createElement('div');
        el.classList.add('floating-item');

       
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        // --- RASTGELE GÖRÜNÜM AYARLARI ---
        
        const leftPos = Math.random() * 100;
        const size = Math.random() * 30 + 15; 
        const blurAmount = (45 - size) / 10; 
        const duration = Math.random() * 10 + 12; 
        const opacity = Math.random() * 0.6 + 0.2;

        const rotation = (Math.random() - 0.5) * 60;
        const sway = (Math.random() - 0.5) * 80;  

        el.style.left = `${leftPos}%`;
        el.style.fontSize = `${size}px`;
        el.style.filter = `blur(${blurAmount}px)`; 
        el.style.animation = `floatUp ${duration}s linear forwards`;
   
        el.style.setProperty('--rotation', `${rotation}deg`);
        el.style.setProperty('--sway', `${sway}px`);
        el.style.setProperty('--item-opacity', opacity);

        const colors = ['#ffffff', '#ffcad4', '#e2f0cb', '#c6edfe'];
        el.style.color = colors[Math.floor(Math.random() * colors.length)];

        container.appendChild(el);
        particleCount++;

        setTimeout(() => {
            el.remove();
            particleCount--;
        }, duration * 1000);
    }

    for(let i=0; i<15; i++) {
        setTimeout(spawnParticle, i * 400);
    }

    setInterval(() => {
        if (particleCount < MAX_PARTICLES) {
            spawnParticle();
        }
    }, 500);
}

function drawHeartSimple(x, y, size, color = '#ff4d6d', rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    const t = size * 0.3;
    ctx.moveTo(0, size * 0.25);
    ctx.bezierCurveTo(0, -t, -size / 2, -t, -size / 2, size * 0.25);
    ctx.bezierCurveTo(-size / 2, size * 0.55, 0, size * 0.8, 0, size);
    ctx.bezierCurveTo(0, size * 0.8, size / 2, size * 0.55, size / 2, size * 0.25);
    ctx.bezierCurveTo(size / 2, -t, 0, -t, 0, size * 0.25);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function drawHeart3D(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    const d = '#bf002f';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.25);
    ctx.bezierCurveTo(0, -size * 0.3, -size / 2, -size * 0.3, -size / 2, size * 0.25);
    ctx.bezierCurveTo(-size / 2, size * 0.55, 0, size * 0.8, 0, size);
    ctx.bezierCurveTo(0, size * 0.8, size / 2, size * 0.55, size / 2, size * 0.25);
    ctx.bezierCurveTo(size / 2, -size * 0.3, 0, -size * 0.3, 0, size * 0.25);
    ctx.closePath();
    ctx.fillStyle = d;
    ctx.fill();
    const m = '#ff4d6d';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.25);
    ctx.bezierCurveTo(0, -size * 0.25, -size * 0.45, -size * 0.25, -size * 0.45, size * 0.25);
    ctx.bezierCurveTo(-size * 0.45, size * 0.5, 0, size * 0.75, 0, size * 0.95);
    ctx.bezierCurveTo(0, size * 0.75, size * 0.45, size * 0.5, size * 0.45, size * 0.25);
    ctx.bezierCurveTo(size * 0.45, -size * 0.25, 0, -size * 0.25, 0, size * 0.25);
    ctx.closePath();
    ctx.fillStyle = m;
    ctx.shadowColor = m;
    ctx.shadowBlur = size * 0.1;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.15, size * 0.15, size * 0.2, size * 0.1, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.7)`;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-size * 0.1, size * 0.1, size * 0.15, size * 0.08, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
    ctx.fill();
    ctx.restore();
}

function updateEnergyBar() {

    turboEnergy = Math.max(0, Math.min(turboEnergy, MAX_TURBO_ENERGY));

    if (energyBarFill) {
        energyBarFill.style.width = `${turboEnergy}%`;
    }

    if (isTurbo && turboEnergy <= 0) {
        toggleTurbo(false);
    }

    if (!isTurbo && turboEnergy < MIN_ENERGY_TO_START) {
        turboBtn.classList.add('disabled');
    } else {
        turboBtn.classList.remove('disabled');
    }
}

function toggleTurbo(forceState = null) {
    const newState = forceState !== null ? forceState : !isTurbo;

    if (newState === true) {
        if (turboEnergy >= MIN_ENERGY_TO_START) {
            isTurbo = true;
            turboBtn.classList.add('active');
            if (navigator.vibrate) navigator.vibrate(200); 
        } else {
            if (navigator.vibrate) navigator.vibrate(50);
        }
    } else {
        isTurbo = false;
        turboBtn.classList.remove('active');
    }
}

// --- CLASS TANIMLARI ---
function Star() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.radius = Math.random() * 1.2 + 0.5;
    this.maxOpacity = Math.random() * 0.7 + 0.2;
    this.opacity = this.maxOpacity;
    this.phase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = Math.random() * 0.005 + 0.002;
    this.update = function () { this.opacity = Math.abs(Math.sin(this.phase)) * this.maxOpacity; this.phase += this.twinkleSpeed; };
    this.draw = function () { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`; ctx.shadowColor = 'white'; ctx.shadowBlur = 4; ctx.fill(); };
}

function createStarryNight(count = 200) { stars = []; for (let i = 0; i < count; i++) { stars.push(new Star()); } }

function drawStar(x, y, radius) {
    ctx.save();
    const f = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
    f.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    f.addColorStop(0.5, 'rgba(200, 220, 255, 0.4)');
    f.addColorStop(1, 'rgba(180, 210, 255, 0)');
    ctx.fillStyle = f;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawConstellations() {
    const r = 2;
    for (const k in constellationData) {
        const c = constellationData[k];
        const p = [];
        c.stars.forEach(s => { const x = s.x * canvas.width, y = s.y * canvas.height; p.push({ x, y }); drawStar(x, y, r); });
        ctx.beginPath();
        c.lines.forEach(l => {
            const s = p[l[0]], e = p[l[1]];
            if (s && e) {
                const g = ctx.createLinearGradient(s.x, s.y, e.x, e.y);
                g.addColorStop(0, 'rgba(200, 220, 255, 0)');
                g.addColorStop(0.5, 'rgba(200, 220, 255, 0.3)');
                g.addColorStop(1, 'rgba(200, 220, 255, 0)');
                ctx.strokeStyle = g;
                ctx.lineWidth = 2;
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(e.x, e.y);
                ctx.stroke();
            }
        });
    }
}

function Particle(x, y) {
    this.x = x; this.y = y; const a = Math.random() * Math.PI * 2, s = Math.random() * 6 + 2; this.speedX = Math.cos(a) * s; this.speedY = Math.sin(a) * s; this.size = Math.random() * 10 + 5; this.opacity = 1; this.color = `hsl(${Math.random() * 20 + 340}, 100%, 70%)`;
    this.update = function () { this.x += this.speedX; this.y += this.speedY; this.opacity -= 0.02; };
    this.draw = function () { ctx.globalAlpha = this.opacity; drawHeartSimple(this.x, this.y, this.size, this.color, this.x); ctx.globalAlpha = 1; };
}

// --- HEART SINIFI ---
function Heart() {
    this.size = Math.random() * 25 + 15;
    if (this.type === 'letter') this.size = 35; 

    const actualGameWidth = Math.min(canvas.width, MAX_GAME_WIDTH);
    const startX = (canvas.width - actualGameWidth) / 2;

    const padding = this.size / 1.5; 
    const minX = startX + padding;
    const maxX = (startX + actualGameWidth) - padding;

    this.x = Math.random() * (maxX - minX) + minX;

    this.y = -50;
    this.type = 'normal';

    // Mektup Kontrolü
    if (score >= nextLetterScoreTarget && score > 0) {
        this.type = 'letter';
        nextLetterScoreTarget += 200;
    } else {
        const rand = Math.random();
        if (rand < 0.015) this.type = 'black';
        else if (rand < 0.035) this.type = 'rainbow'; // %2
        else if (rand < 0.065) this.type = 'gold';    // %3
        else if (rand < 0.115) this.type = 'ice';     // %5
        else if (rand < 0.265) this.type = 'broken';  // %15
    }

    this.size = Math.random() * 25 + 15;

    // Mektup boyutu ayarı
    if (this.type === 'letter') {
        this.size = 35;
    }

    // --- HIZ MANTIĞI ---
    let typeSpeedMultiplier = 1.0;

    if (this.type === 'black' || this.type === 'broken') {
        typeSpeedMultiplier = 1.1;
    }
    else if (this.type === 'letter') {
        typeSpeedMultiplier = 0.6;
    }

    // Formül: (Rastgele Taban Hız + Minimum Hız) * Genel Zorluk * Kalp Türü Çarpanı
    this.speed = (Math.random() * 1.1 + BASE_SPEED) * speedModifier * typeSpeedMultiplier;

    if (this.type === 'gold') this.color = '#ffd700';
    else if (this.type === 'ice') this.color = '#00f2ff';
    else if (this.type === 'broken') this.color = '#4a0a18';
    else if (this.type === 'black') this.color = '#111111';
    else if (this.type === 'rainbow') this.color = 'rainbow';
    else if (this.type === 'letter') this.color = '#fffff0';
    else this.color = '#ff4d6d';

    this.update = function () {
        let currentSpeed = this.speed;

        if (iceEffectActive && this.type !== 'letter') {
            currentSpeed *= 0.3;
        }

        if (isTurbo) {
            currentSpeed *= 2.5;
            ctx.shadowColor = '#ff1c45';
            ctx.shadowBlur = 15;
        } else {
            if (!iceEffectActive) ctx.shadowBlur = 0;
        }

        this.y += currentSpeed;
    };

    this.draw = function () {
        if (this.type === 'rainbow') {
            const hue = (Date.now() / 5) % 360;
            drawHeartSimple(this.x, this.y, this.size, `hsl(${hue}, 100%, 60%)`);
        }
        else if (this.type === 'letter') {
            ctx.save();
            ctx.translate(this.x, this.y);

            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'gold';

            const rectW = this.size * 1.4;
            const rectH = this.size * 1.0;

            ctx.fillRect(-rectW / 2, -rectH / 2, rectW, rectH);

            drawHeartSimple(0, 0, this.size * 0.55, '#ff0000');

            ctx.restore();
        }
        else {
            drawHeartSimple(this.x, this.y, this.size, this.color);
            if (this.type === 'broken') {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -this.size * 0.3);
                ctx.lineTo(-5, 0);
                ctx.lineTo(5, 5);
                ctx.lineTo(0, this.size * 0.4);
                ctx.stroke();
                ctx.restore();
            }
        }
    };
}

function createExplosion(x, y, count = 15) { for (let i = 0; i < count; i++) { particles.push(new Particle(x, y)); } }

function startMilestoneAnimation() {
    gameState = 'milestone'; giantHeart.active = true; giantHeart.scale = 0; giantHeart.opacity = 0;
    if (navigator.vibrate) { navigator.vibrate([200, 100, 200, 100, 200, 100, 200, 100, 200, 100, 200]); }
    setTimeout(() => { if (!giantHeart.active) return; createExplosion(canvas.width / 2, canvas.height / 2, 120); giantHeart.active = false; }, 1500);
    setTimeout(() => { gameState = 'playing'; if (navigator.vibrate) { navigator.vibrate(0); } }, 3000);
}

function drawFlower(x, y, size, color) {
    ctx.save(); ctx.translate(x, y); const petalCount = 5; const petalSize = size; const petalColor = color; const centerColor = '#fff5b2'; ctx.fillStyle = petalColor; ctx.shadowColor = petalColor; ctx.shadowBlur = 8;
    for (let i = 0; i < petalCount; i++) { const angle = (i / petalCount) * Math.PI * 2; ctx.rotate(angle); ctx.beginPath(); ctx.ellipse(petalSize * 0.7, 0, petalSize, petalSize / 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.rotate(-angle); }
    ctx.beginPath(); ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2); ctx.fillStyle = centerColor; ctx.shadowColor = centerColor; ctx.shadowBlur = 5; ctx.fill(); ctx.restore();
}

function createVine() {
    vineY = canvas.height * 0.88;
    vinePlants = [];
    const flowerColors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#a0c4ff', '#ffc6ff', '#bde0fe', '#ffafcc', '#fcf6bd'];
    const actualGameWidth = Math.min(canvas.width, MAX_GAME_WIDTH);
    const startX = (canvas.width - actualGameWidth) / 2;
    const endX = startX + actualGameWidth;

    for (let x = startX; x < endX; x += 20) {
        if (Math.random() < 0.2) {
            vinePlants.push({ x: x + (Math.random() - 0.5) * 15, y: vineY + (Math.random() - 0.5) * 10, size: Math.random() * 8 + 5, color: flowerColors[Math.floor(Math.random() * flowerColors.length)], type: 'flower' });
        }
        if (Math.random() < 0.45) {
            vinePlants.push({ x: x + (Math.random() - 0.5) * 10, y: vineY + (Math.random() - 0.5) * 5, size: Math.random() * 6 + 4, angle: Math.random() * Math.PI, type: 'leaf' });
        }
    }
}

function drawVine() {
    const actualGameWidth = Math.min(canvas.width, MAX_GAME_WIDTH);
    const startX = (canvas.width - actualGameWidth) / 2;
    const endX = startX + actualGameWidth;

    ctx.beginPath();
    ctx.moveTo(startX, vineY);
    ctx.bezierCurveTo(startX + actualGameWidth * 0.3, vineY - 10, startX + actualGameWidth * 0.7, vineY + 10, endX, vineY);

    ctx.strokeStyle = '#6a994e';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#6a994e';
    ctx.shadowBlur = 5;
    ctx.stroke();

    vinePlants.forEach(plant => {
        if (plant.type === 'flower') { drawFlower(plant.x, plant.y, plant.size, plant.color); }
        else {
            ctx.save(); ctx.translate(plant.x, plant.y); ctx.rotate(plant.angle); ctx.beginPath(); ctx.ellipse(0, 0, plant.size, plant.size / 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#9ef01a'; ctx.shadowColor = '#9ef01a'; ctx.shadowBlur = 5; ctx.fill(); ctx.restore();
        }
    });
    ctx.shadowBlur = 0;
}

function updateHighScoreDisplay(highscores) {
    const furkanData = highscores?.Furkan || 0;
    const merveData = highscores?.Merve || 0;
    furkanHighScoreEl.textContent = furkanData;
    merveHighScoreEl.textContent = merveData;
    furkanCrown.style.display = 'none';
    merveCrown.style.display = 'none';
    if (furkanData > 0 || merveData > 0) {
        if (furkanData >= merveData) { furkanCrown.style.display = 'block'; }
        if (merveData >= furkanData) { merveCrown.style.display = 'block'; }
    }
}

function syncScoreToFirebase() {

    if (highscoresRef && currentPlayerName) {
        if (score > currentHighScore) {
            highscoresRef.child(currentPlayerName).set(score);
            currentHighScore = score;
        }
    }
}

function setGameOver() {
    gameState = 'gameOver';
    if (navigator.vibrate) navigator.vibrate(0);
    canvas.classList.add('blur');
    gameOverScreen.classList.add('active');
}

// --- OYUN DÖNGÜSÜ ---
function calculateDifficulty() {
    let baseDifficulty = Math.log(score + 5) * DIFFICULTY_CURVE;
    let waveEffect = Math.sin(Date.now() / 2000) * 0.5; 

    speedModifier = 1 + (baseDifficulty * 0.8) + (score > 50 ? waveEffect : 0);

    if (speedModifier > MAX_SPEED) speedModifier = MAX_SPEED;

    let densityCurve = 0.021 + (Math.log(score + 1) * 0.005);
    currentSpawnRate = Math.min(densityCurve, 0.06); 
}


function gameLoop() {
    animationFrameId = requestAnimationFrame(gameLoop);

    if (gameState === 'paused' || gameState === 'tutorial') {
        return;
    }

    if (celebrationState !== 'none') {
        updateAndDrawCelebration();
        return;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => { s.update(); s.draw(); });
    drawConstellations();

    // GÖKKUŞAĞI
    if (rainbowEffectActive) {
        if (Date.now() - rainbowTimer > 2000) {
            rainbowEffectActive = false;
        } else {
            ctx.save();
            const elapsed = Date.now() - rainbowTimer;
            const opacity = Math.max(0, 1 - (elapsed / 2000));
            ctx.globalAlpha = opacity;
            ctx.globalCompositeOperation = 'lighter';
            const cx = canvas.width / 2;
            const cy = canvas.height * 1.2;
            const maxRadius = Math.max(canvas.width, canvas.height);
            const colors = [
                'rgba(255, 0, 0, 0.5)', 'rgba(255, 165, 0, 0.5)', 'rgba(255, 255, 0, 0.5)',
                'rgba(0, 128, 0, 0.5)', 'rgba(0, 0, 255, 0.5)', 'rgba(75, 0, 130, 0.5)', 'rgba(238, 130, 238, 0.5)'
            ];
            colors.forEach((color, i) => {
                ctx.beginPath();
                ctx.arc(cx, cy, maxRadius * (0.9 - (i * 0.06)), Math.PI, 0);
                ctx.strokeStyle = color; ctx.lineWidth = 40; ctx.shadowBlur = 30; ctx.shadowColor = color; ctx.stroke();
            });
            ctx.restore();
        }
    }

    drawVine();
    ctx.shadowBlur = 0;

    if (iceEffectActive) {
        ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (Date.now() - iceTimer > 3000) { iceEffectActive = false; }
    }

    if (gameState === 'playing' || gameState === 'milestone') {
        if (gameState === 'playing') {
            calculateDifficulty();
            if (isTurbo) {
                turboEnergy -= ENERGY_DRAIN_RATE; 
                updateEnergyBar();
                currentSpawnRate = 0.13; 
            } else {
                currentSpawnRate = baseSpawnRate * spawnRateModifier;
            }
        }
        if (Math.random() < currentSpawnRate && gameState === 'playing' && !rainbowEffectActive) {
            hearts.push(new Heart());
        }
        for (let i = hearts.length - 1; i >= 0; i--) {
            if (gameState === 'playing') hearts[i].update();
            if (hearts[i].y > vineY + hearts[i].size) {
                if (hearts[i].type === 'normal') {
                    lives--; livesValueEl.textContent = lives;
                    if (navigator.vibrate) navigator.vibrate(150);
                    if (lives <= 0) setGameOver();
                }
                hearts.splice(i, 1);
            }
        }
    }
    hearts.forEach(heart => heart.draw());
    if (giantHeart.active) {
        giantHeart.scale += (1 - giantHeart.scale) * 0.1; giantHeart.opacity += (1 - giantHeart.opacity) * 0.1; ctx.globalAlpha = giantHeart.opacity; const size = (Math.min(canvas.width, canvas.height) * 0.85) * giantHeart.scale; const pulse = Math.sin(Date.now() * 0.005) * 0.05 + 1; drawHeart3D(canvas.width / 2, canvas.height / 2, size * pulse); ctx.globalAlpha = 1;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); particles[i].draw();
        if (particles[i].opacity <= 0) particles.splice(i, 1);
    }
}

// --- YENİDEN BAŞLATMA ---
function restartGame() {
    score = 0; hasCelebrated = false; lives = initialLives;

    isTurbo = false;
    turboEnergy = 0;
    updateEnergyBar();
    turboBtn.classList.remove('active');

    nextMilestoneScore = 10; nextLetterScoreTarget = 200;
    iceEffectActive = false; rainbowEffectActive = false;
    hearts = []; particles = [];
    speedModifier = 1.0; spawnRateModifier = 1.0;
    currentSpawnRate = baseSpawnRate * spawnRateModifier;
    scoreValueEl.textContent = score; livesValueEl.textContent = lives;
    canvas.classList.remove('blur');
    gameOverScreen.classList.remove('active');
    tutorialOverlay.classList.remove('active');
    gameState = 'playing';
}

// --- ETKİLEŞİM YÖNETİMİ ---
function handleInteraction(event) {
    event.preventDefault();
    if (gameState !== 'playing') return;

    const x = event.clientX || event.touches[0].clientX;
    const y = event.clientY || event.touches[0].clientY;

    for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i];
        const d = Math.sqrt(Math.pow(x - h.x, 2) + Math.pow(y - h.y, 2));

        if (d < h.size) {
            // SİYAH KALP
            if (h.type === 'black') {
                createExplosion(h.x, h.y); hearts.splice(i, 1);
                score -= 50; if (score < 0) score = 0;
                scoreValueEl.textContent = score;
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                return;
            }
            // KIRIK KALP
            if (h.type === 'broken') {
                createExplosion(h.x, h.y); hearts.splice(i, 1);
                lives--; livesValueEl.textContent = lives;
                if (navigator.vibrate) navigator.vibrate(300);
                if (lives <= 0) setGameOver();
                return;
            }

            createExplosion(h.x, h.y); hearts.splice(i, 1);
            let pointsToAdd = 1;
            let multiplier = 1;

            if (isTurbo) {
                multiplier = TURBO_SCORE_MULTIPLIER; 
            } else {
                if (h.type !== 'black' && h.type !== 'broken') {
                    turboEnergy += ENERGY_GAIN_PER_HEART;
                    updateEnergyBar();
                }
            }

            if (h.type === 'gold') {

                if (lives < 3) {
                    lives = 3;
                }
                livesValueEl.textContent = lives;
                pointsToAdd = 1;
            }
            else if (h.type === 'ice') { iceEffectActive = true; iceTimer = Date.now(); pointsToAdd = 1; }
            else if (h.type === 'letter') {
                pointsToAdd = 50; lives = 5; livesValueEl.textContent = lives;
                gameState = 'paused'; loveMessageOverlay.classList.add('active');
                setTimeout(() => { loveMessageOverlay.classList.remove('active'); gameState = 'playing'; }, 2000);
            }
            else if (h.type === 'rainbow') {
                rainbowEffectActive = true; rainbowTimer = Date.now();
                pointsToAdd = 1 + hearts.length;
                hearts = [];
            }

            score += pointsToAdd * multiplier; scoreValueEl.textContent = score; syncScoreToFirebase();

            // KUTLAMA
            let currentOpponentScore = 0;
            if (currentPlayerName === 'Furkan') currentOpponentScore = (highscoresRef ? parseInt(merveHighScoreEl.textContent) : 0);
            if (currentPlayerName === 'Merve') currentOpponentScore = (highscoresRef ? parseInt(furkanHighScoreEl.textContent) : 0);
            if (!hasCelebrated && currentOpponentScore > 0 && score === currentOpponentScore + 1) {
                celebrationState = 'car_scene'; carY = canvas.height; blackScreenOpacity = 0;
                smokeParticles = []; celebrationTimer = 0;
                if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
            }

            if (score >= nextMilestoneScore) { startMilestoneAnimation(); nextMilestoneScore *= 2; }
            if (navigator.vibrate) { if (score !== nextMilestoneScore / 2) navigator.vibrate(50); }
            break;
        }
    }
}

// --- AKIŞ YÖNETİMİ ---
function startGameFlow() {
    nameInput.blur();
    if (lockScreen.classList.contains('loading')) return;
    lockScreen.classList.add('loading');
    const playPromise = backgroundMusic.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => { console.error("Müzik başlatılamadı:", error); }).finally(() => {
            lockScreen.classList.remove('active');
            gameScreen.classList.add('active');
            resizeCanvas();
            canvas.classList.add('blur');
            tutorialOverlay.classList.add('active');
            gameState = 'tutorial';
            if (!animationFrameId) gameLoop();
        });
    }
}

function startActualGameplay() {
    tutorialOverlay.classList.remove('active');
    canvas.classList.remove('blur');
    gameState = 'playing';
}

function init() {
    createFloatingHearts(); createStarryNight();
    if (highscoresRef) {
        highscoresRef.on('value', (snapshot) => {
            const highscores = snapshot.val() || { Furkan: 0, Merve: 0 };
            updateHighScoreDisplay(highscores);
            if (currentPlayerName) { currentHighScore = highscores[currentPlayerName] || 0; }
        });
    }
    nameInput.addEventListener('input', () => {
        const enteredName = nameInput.value.trim().toLowerCase();
        if (enteredName === 'furkan' || enteredName === 'merve') { lockScreen.classList.add('name-valid'); } else { lockScreen.classList.remove('name-valid'); }
    });
    nameInput.addEventListener('blur', () => { setTimeout(() => { window.scrollTo(0, 0); document.body.scrollTop = 0; resizeCanvas(); }, 100); });
    const startHandler = (event) => {
        if (event.target === nameInput) { return; }
        const enteredName = nameInput.value.trim().toLowerCase();
        if (enteredName === 'furkan' || enteredName === 'merve') {
            currentPlayerName = enteredName.charAt(0).toUpperCase() + enteredName.slice(1);
            if (!highscoresRef) { startGameFlow(); return; }
            highscoresRef.child(currentPlayerName).once('value', (snapshot) => { currentHighScore = snapshot.val() || 0; startGameFlow(); }, (error) => { console.error("Firebase error", error); startGameFlow(); });
        }
    };
    lockScreen.addEventListener('click', startHandler); lockScreen.addEventListener('touchstart', startHandler);
    finalStartBtn.addEventListener('click', startActualGameplay); finalStartBtn.addEventListener('touchstart', startActualGameplay);
    gameOverScreen.addEventListener('click', restartGame);
    musicControl.addEventListener('click', (event) => { event.stopPropagation(); backgroundMusic.paused ? backgroundMusic.play() : backgroundMusic.pause(); });
    backgroundMusic.addEventListener('play', () => { musicControl.classList.remove('paused'); });
    backgroundMusic.addEventListener('pause', () => { musicControl.classList.add('paused'); });
    musicControl.classList.add('paused');
    canvas.addEventListener('mousedown', handleInteraction); canvas.addEventListener('touchstart', handleInteraction, { passive: false });
    window.addEventListener('resize', resizeCanvas);

    // Oyunu Durdurma
    pauseControl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (gameState === 'playing') {
            gameState = 'paused';
            pauseOverlay.classList.add('active');
            canvas.classList.add('blur');
            backgroundMusic.pause(); 
        }
    });

    // Oyuna Devam Etme
    resumeBtn.addEventListener('click', () => {
        gameState = 'playing';
        pauseOverlay.classList.remove('active');
        canvas.classList.remove('blur');
        backgroundMusic.play();
    });

    turboBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        toggleTurbo();       
    });

    turboBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    }, { passive: false });
}

function drawSmokeShape(ctx, x, y, size, color, text = null) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = color.a; ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    if (text) {
        ctx.fillStyle = `rgba(200, 200, 200, ${color.a})`; ctx.font = `bold ${size * 1.2}px 'Arial'`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 0);
    } else {
        ctx.beginPath(); ctx.moveTo(0, size * 0.3); ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, size * 0.3); ctx.bezierCurveTo(-size / 2, size * 0.6, 0, size, 0, size * 1.3); ctx.bezierCurveTo(0, size, size / 2, size * 0.6, size / 2, size * 0.3); ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, size * 0.3); ctx.fill();
    } ctx.restore();
}

function createNeonFlowHeart() {
    neonParticles = []; const particleCount = 700;
    for (let i = 0; i < particleCount; i++) {
        const hue = 190 + Math.random() * 70;
        neonParticles.push({ id: i, t: (i / particleCount) * Math.PI * 2, size: Math.random() * 2 + 2, hue: hue, baseHue: hue, x: 0, y: 0, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, alpha: 1, offset: (Math.random() - 0.5) * 5 });
    }
}

function updateAndDrawCelebration() {
    if (celebrationState === 'car_scene') {
        ctx.fillStyle = '#01002aff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const carSpeed = canvas.height / 300; carY -= carSpeed;
        let carDrawWidth = canvas.width * 1.05; let carDrawHeight = carDrawWidth * 2.1;
        if (carImage.complete && carImage.naturalWidth > 0) { const aspectRatio = carImage.naturalWidth / carImage.naturalHeight; carDrawHeight = carDrawWidth / aspectRatio; }
        const carX = (canvas.width - carDrawWidth) / 2;
        if (carY > -carDrawHeight) {
            const smokeCount = 6;
            for (let i = 0; i < smokeCount; i++) {
                const isText = Math.random() < 0.15;
                smokeParticles.push({ x: (canvas.width / 2) + (Math.random() - 0.5) * 40, y: carY + carDrawHeight - 10, vx: (Math.random() - 0.5) * (Math.random() * 10), vy: Math.random() * 2 + 2, size: Math.random() * 20 + 15, grow: 0.4, life: 1.2, color: { r: 40, g: 40, b: 40, a: 0.9 }, text: isText ? (Math.random() > 0.5 ? "M" : "F") : null });
            }
        }
        for (let i = smokeParticles.length - 1; i >= 0; i--) {
            const p = smokeParticles[i]; p.x += p.vx; p.y += p.vy; p.size += p.grow; p.life -= 0.004; p.color.a = Math.max(0, p.life); drawSmokeShape(ctx, p.x, p.y, p.size, p.color, p.text); if (p.life <= 0) smokeParticles.splice(i, 1);
        }
        if (carImage.complete) { ctx.drawImage(carImage, carX, carY, carDrawWidth, carDrawHeight); }
        if (carY < canvas.height * 0.4) { if (blackScreenOpacity < 1) { blackScreenOpacity += 0.006; } }
        if (blackScreenOpacity > 0) { ctx.fillStyle = `rgba(0, 0, 0, ${blackScreenOpacity})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        if (blackScreenOpacity >= 1.0 && carY < -carDrawHeight) { celebrationState = 'neon_drawing'; createNeonFlowHeart(); smokeParticles = []; drawnPathCount = 0; }
    }
    if (celebrationState === 'neon_drawing' || celebrationState === 'heart_exploding') {
        ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff'; ctx.globalCompositeOperation = 'lighter';
        const scale = Math.min(canvas.width, canvas.height) / 35; const centerX = canvas.width / 2; const centerY = canvas.height / 2;
        if (celebrationState === 'neon_drawing') { drawnPathCount += 5; }
        let activeParticlesCount = 0;
        neonParticles.forEach(p => {
            if (celebrationState === 'heart_exploding') { p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.alpha -= 0.015; p.hue += 2; }
            else { const xBase = 16 * Math.pow(Math.sin(p.t), 3); const yBase = -(13 * Math.cos(p.t) - 5 * Math.cos(2 * p.t) - 2 * Math.cos(3 * p.t) - Math.cos(4 * p.t)); p.x = centerX + (xBase * scale) + p.offset; p.y = centerY + (yBase * scale) + p.offset; p.hue = (p.baseHue + Date.now() * 0.1) % 360; }
            if (celebrationState === 'heart_exploding' || p.id < drawnPathCount) {
                if (p.alpha > 0) { ctx.beginPath(); if (celebrationState === 'heart_exploding') { drawHeartSimple(p.x, p.y, p.size * 3, `hsla(${p.hue}, 100%, 60%, ${p.alpha})`); } else { ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`; ctx.fill(); } activeParticlesCount++; }
            }
        });
        ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
        if (celebrationState === 'neon_drawing' && drawnPathCount > neonParticles.length + 50) { celebrationState = 'heart_exploding'; if (navigator.vibrate) navigator.vibrate([50, 50, 50, 50, 200]); }
        if (celebrationState === 'heart_exploding' && activeParticlesCount === 0) { celebrationState = 'none'; gameState = 'playing'; hasCelebrated = true; blackScreenOpacity = 0; }
    }
}

init();

