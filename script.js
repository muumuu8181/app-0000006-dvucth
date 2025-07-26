// Meteor Storm - 超絶格好良い隕石落下アニメーション

class MeteorStorm {
    constructor() {
        this.setupCanvas();
        this.meteors = [];
        this.particles = [];
        this.explosions = [];
        this.animationId = null;
        this.isRunning = false;
        this.meteorCount = 0;
        this.destructionPower = 0;
        this.epicMode = false;
        
        this.meteorTypes = {
            fire: {
                colors: ['#ff6b35', '#ff8c42', '#ffd23f'],
                trailColor: 'rgba(255, 107, 53, 0.6)',
                glowColor: 'rgba(255, 107, 53, 0.3)',
                particleColors: ['#ff6b35', '#ffa500', '#ffff00']
            },
            ice: {
                colors: ['#00d9ff', '#00b4d8', '#0077b6'],
                trailColor: 'rgba(0, 217, 255, 0.6)',
                glowColor: 'rgba(0, 217, 255, 0.3)',
                particleColors: ['#00d9ff', '#90e0ef', '#caf0f8']
            },
            cosmic: {
                colors: ['#9d4edd', '#c77dff', '#e0aaff'],
                trailColor: 'rgba(157, 78, 221, 0.6)',
                glowColor: 'rgba(157, 78, 221, 0.3)',
                particleColors: ['#9d4edd', '#c77dff', '#f72585']
            },
            plasma: {
                colors: ['#ff006e', '#fb5607', '#ffbe0b'],
                trailColor: 'rgba(255, 0, 110, 0.6)',
                glowColor: 'rgba(255, 0, 110, 0.3)',
                particleColors: ['#ff006e', '#c9184a', '#ff4365']
            },
            rainbow: {
                colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
                trailColor: 'rgba(255, 255, 255, 0.6)',
                glowColor: 'rgba(255, 255, 255, 0.3)',
                particleColors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
            }
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudio();
    }
    
    setupCanvas() {
        this.meteorCanvas = document.getElementById('meteorCanvas');
        this.particleCanvas = document.getElementById('particleCanvas');
        this.glowCanvas = document.getElementById('glowCanvas');
        
        this.meteorCtx = this.meteorCanvas.getContext('2d');
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.glowCtx = this.glowCanvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        [this.meteorCanvas, this.particleCanvas, this.glowCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });
    }
    
    initializeElements() {
        this.meteorTypeSelect = document.getElementById('meteorType');
        this.meteorSizeSlider = document.getElementById('meteorSize');
        this.meteorSpeedSlider = document.getElementById('meteorSpeed');
        this.meteorDensitySlider = document.getElementById('meteorDensity');
        this.soundCheckbox = document.getElementById('soundEnabled');
        
        this.sizeValue = document.getElementById('sizeValue');
        this.speedValue = document.getElementById('speedValue');
        this.densityValue = document.getElementById('densityValue');
        
        this.meteorCountElement = document.getElementById('meteorCount');
        this.destructionPowerElement = document.getElementById('destructionPower');
        
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.epicModeBtn = document.getElementById('epicModeBtn');
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.epicModeBtn.addEventListener('click', () => this.toggleEpicMode());
        
        // スライダー値の表示更新
        this.meteorSizeSlider.addEventListener('input', (e) => {
            this.sizeValue.textContent = e.target.value;
        });
        
        this.meteorSpeedSlider.addEventListener('input', (e) => {
            this.speedValue.textContent = e.target.value;
        });
        
        this.meteorDensitySlider.addEventListener('input', (e) => {
            this.densityValue.textContent = e.target.value;
        });
    }
    
    initializeAudio() {
        this.audioContext = null;
        this.sounds = {
            whoosh: [],
            explosion: [],
            ambient: null
        };
        
        // Web Audio APIの初期化は最初のユーザーインタラクション時に行う
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createSounds();
            }
        }, { once: true });
    }
    
    createSounds() {
        // Whoosh音の生成
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 200 + Math.random() * 100;
            gainNode.gain.value = 0;
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            this.sounds.whoosh.push({ oscillator, gainNode });
        }
    }
    
    playSound(type) {
        if (!this.soundCheckbox.checked || !this.audioContext) return;
        
        if (type === 'whoosh') {
            const sound = this.sounds.whoosh[Math.floor(Math.random() * this.sounds.whoosh.length)];
            const now = this.audioContext.currentTime;
            sound.gainNode.gain.setValueAtTime(0, now);
            sound.gainNode.gain.linearRampToValueAtTime(0.1, now + 0.1);
            sound.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startBtn.textContent = '隕石嵐進行中';
        this.startBtn.disabled = true;
        
        // 隕石を定期的に生成
        this.meteorInterval = setInterval(() => {
            const density = parseInt(this.meteorDensitySlider.value);
            for (let i = 0; i < density; i++) {
                this.createMeteor();
            }
        }, 1000 / parseInt(this.meteorDensitySlider.value));
        
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        this.startBtn.textContent = '隕石嵐開始';
        this.startBtn.disabled = false;
        
        if (this.meteorInterval) {
            clearInterval(this.meteorInterval);
            this.meteorInterval = null;
        }
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    clear() {
        this.stop();
        this.meteors = [];
        this.particles = [];
        this.explosions = [];
        this.meteorCount = 0;
        this.destructionPower = 0;
        this.updateStats();
        
        // Canvas をクリア
        this.meteorCtx.clearRect(0, 0, this.meteorCanvas.width, this.meteorCanvas.height);
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        this.glowCtx.clearRect(0, 0, this.glowCanvas.width, this.glowCanvas.height);
    }
    
    toggleEpicMode() {
        this.epicMode = !this.epicMode;
        
        if (this.epicMode) {
            this.epicModeBtn.textContent = 'エピックモード ON';
            document.body.style.animation = 'epicShake 0.5s infinite';
            
            // エピックモードでは全ての値を最大に
            this.meteorSizeSlider.value = 5;
            this.meteorSpeedSlider.value = 10;
            this.meteorDensitySlider.value = 10;
            
            this.sizeValue.textContent = '5';
            this.speedValue.textContent = '10';
            this.densityValue.textContent = '10';
        } else {
            this.epicModeBtn.textContent = 'エピックモード';
            document.body.style.animation = '';
        }
    }
    
    createMeteor() {
        const type = this.epicMode ? 
            Object.keys(this.meteorTypes)[Math.floor(Math.random() * Object.keys(this.meteorTypes).length)] :
            this.meteorTypeSelect.value;
            
        const size = parseInt(this.meteorSizeSlider.value);
        const speed = parseInt(this.meteorSpeedSlider.value);
        
        const meteor = {
            x: Math.random() * this.meteorCanvas.width,
            y: -50,
            size: 10 + size * 10 + Math.random() * 20,
            speed: 2 + speed * 0.5 + Math.random() * 3,
            angle: Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 6,
            type: type,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            trail: [],
            trailLength: 15 + size * 5,
            life: 1
        };
        
        this.meteors.push(meteor);
        this.meteorCount++;
        this.playSound('whoosh');
    }
    
    updateMeteor(meteor) {
        // 前の位置を記録（軌跡用）
        meteor.trail.push({ x: meteor.x, y: meteor.y });
        if (meteor.trail.length > meteor.trailLength) {
            meteor.trail.shift();
        }
        
        // 位置更新
        meteor.x += Math.cos(meteor.angle) * meteor.speed;
        meteor.y += Math.sin(meteor.angle) * meteor.speed;
        meteor.rotation += meteor.rotationSpeed;
        
        // 地面に到達したら爆発
        if (meteor.y > this.meteorCanvas.height - 50) {
            this.createExplosion(meteor);
            return false;
        }
        
        // 画面外に出たら削除
        if (meteor.x < -100 || meteor.x > this.meteorCanvas.width + 100) {
            return false;
        }
        
        return true;
    }
    
    createExplosion(meteor) {
        const typeConfig = this.meteorTypes[meteor.type];
        
        // 爆発エフェクト
        this.explosions.push({
            x: meteor.x,
            y: meteor.y,
            radius: meteor.size,
            maxRadius: meteor.size * 3,
            life: 1,
            type: meteor.type
        });
        
        // パーティクル生成
        const particleCount = 20 + meteor.size;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;
            
            this.particles.push({
                x: meteor.x,
                y: meteor.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - Math.random() * 2,
                size: 2 + Math.random() * 4,
                life: 1,
                color: typeConfig.particleColors[Math.floor(Math.random() * typeConfig.particleColors.length)],
                gravity: 0.1
            });
        }
        
        // 破壊力追加
        this.destructionPower += Math.floor(meteor.size);
        this.updateStats();
    }
    
    drawMeteor(meteor) {
        const ctx = this.meteorCtx;
        const typeConfig = this.meteorTypes[meteor.type];
        
        // 軌跡を描画
        if (meteor.trail.length > 1) {
            ctx.strokeStyle = typeConfig.trailColor;
            ctx.lineWidth = meteor.size / 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            
            for (let i = 0; i < meteor.trail.length; i++) {
                const point = meteor.trail[i];
                const alpha = i / meteor.trail.length;
                
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            
            ctx.stroke();
        }
        
        // 隕石本体を描画
        ctx.save();
        ctx.translate(meteor.x, meteor.y);
        ctx.rotate(meteor.rotation);
        
        // グラデーション
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.size);
        typeConfig.colors.forEach((color, index) => {
            gradient.addColorStop(index / (typeConfig.colors.length - 1), color);
        });
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, meteor.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 内部の詳細
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i) / 3 + meteor.rotation;
            const x = Math.cos(angle) * meteor.size * 0.5;
            const y = Math.sin(angle) * meteor.size * 0.5;
            ctx.beginPath();
            ctx.arc(x, y, meteor.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // グロー効果をグローキャンバスに描画
        const glowCtx = this.glowCtx;
        glowCtx.fillStyle = typeConfig.glowColor;
        glowCtx.beginPath();
        glowCtx.arc(meteor.x, meteor.y, meteor.size * 2, 0, Math.PI * 2);
        glowCtx.fill();
    }
    
    drawParticle(particle) {
        const ctx = this.particleCtx;
        
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    drawExplosion(explosion) {
        const ctx = this.meteorCtx;
        const typeConfig = this.meteorTypes[explosion.type];
        
        const radius = explosion.radius + (explosion.maxRadius - explosion.radius) * (1 - explosion.life);
        
        ctx.strokeStyle = typeConfig.colors[0];
        ctx.lineWidth = 3 * explosion.life;
        ctx.globalAlpha = explosion.life;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内側の円
        ctx.strokeStyle = typeConfig.colors[1];
        ctx.lineWidth = 2 * explosion.life;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
    
    updateStats() {
        this.meteorCountElement.textContent = this.meteorCount;
        this.destructionPowerElement.textContent = this.destructionPower;
    }
    
    animate() {
        // Canvas をクリア
        this.meteorCtx.clearRect(0, 0, this.meteorCanvas.width, this.meteorCanvas.height);
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        this.glowCtx.clearRect(0, 0, this.glowCanvas.width, this.glowCanvas.height);
        
        // 隕石の更新と描画
        this.meteors = this.meteors.filter(meteor => {
            const alive = this.updateMeteor(meteor);
            if (alive) {
                this.drawMeteor(meteor);
            }
            return alive;
        });
        
        // パーティクルの更新と描画
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            particle.life -= 0.02;
            
            if (particle.life > 0) {
                this.drawParticle(particle);
                return true;
            }
            return false;
        });
        
        // 爆発の更新と描画
        this.explosions = this.explosions.filter(explosion => {
            explosion.life -= 0.05;
            
            if (explosion.life > 0) {
                this.drawExplosion(explosion);
                return true;
            }
            return false;
        });
        
        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
}

// エピックモード用のシェイクアニメーション
const style = document.createElement('style');
style.textContent = `
    @keyframes epicShake {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        10% { transform: translate(-2px, -2px) rotate(-0.5deg); }
        20% { transform: translate(2px, -2px) rotate(0.5deg); }
        30% { transform: translate(-2px, 2px) rotate(-0.5deg); }
        40% { transform: translate(2px, 2px) rotate(0.5deg); }
        50% { transform: translate(-2px, -2px) rotate(-0.5deg); }
        60% { transform: translate(2px, -2px) rotate(0.5deg); }
        70% { transform: translate(-2px, 2px) rotate(-0.5deg); }
        80% { transform: translate(2px, 2px) rotate(0.5deg); }
        90% { transform: translate(-2px, -2px) rotate(-0.5deg); }
    }
`;
document.head.appendChild(style);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new MeteorStorm();
});