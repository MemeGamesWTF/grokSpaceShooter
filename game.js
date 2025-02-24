// game.js
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseMenu = document.getElementById('pause-menu');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const pauseRestartButton = document.getElementById('pause-restart-button');
const resumeButton = document.getElementById('resume-button');
const pauseButton = document.getElementById('pause-button');
const difficultySelect = document.getElementById('difficulty');
const spaceship = document.getElementById('spaceship');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const timerElement = document.getElementById('timer');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');
const scoreDisplay = document.querySelector('.score');
const bgMusic = document.getElementById('bg-music');
const shootSound = document.getElementById('shoot-sound');
const explosionSound = document.getElementById('explosion-sound');
const tvFrame = document.querySelector('.tv-frame');

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let lives, timeLeft, gameSpeed, spawnRate, maxEnemies;
let lastShot = 0;
let gameActive = false;
let paused = false;
let shipX, shipY;
let activeEnemies = 0;
let bossActive = false;
let spawnIncreaseInterval, timerInterval;

function setDifficulty(difficulty) {
    switch (difficulty) {
        case 'easy':
            lives = 5;
            timeLeft = 180;
            gameSpeed = 0.8;
            spawnRate = 2000;
            maxEnemies = 1;
            break;
        case 'medium':
            lives = 3;
            timeLeft = 120;
            gameSpeed = 1;
            spawnRate = 1500;
            maxEnemies = 1;
            break;
        case 'hard':
            lives = 2;
            timeLeft = 90;
            gameSpeed = 1.2;
            spawnRate = 1000;
            maxEnemies = 2;
            break;
    }
}

// Screen Management
function showScreen(screen) {
    startScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    pauseMenu.classList.remove('active');
    screen.classList.add('active');
    if (screen === gameScreen) {
        pauseButton.style.display = 'block';
        scoreDisplay.classList.remove('score-hidden');
        scoreDisplay.classList.add('score-visible');
        bgMusic.play();
    } else {
        pauseButton.style.display = 'none';
        scoreDisplay.classList.remove('score-visible');
        scoreDisplay.classList.add('score-hidden');
        bgMusic.pause();
    }
}

// Start Game
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
pauseRestartButton.addEventListener('click', startGame);
resumeButton.addEventListener('click', () => {
    paused = false;
    showScreen(gameScreen);
});
pauseButton.addEventListener('click', pauseGame);

function startGame() {
    setDifficulty(difficultySelect.value);
    score = 0;
    activeEnemies = 0;
    bossActive = false;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    timerElement.textContent = formatTime(timeLeft);
    highScoreElement.textContent = highScore;
    
    const tvRect = tvFrame.getBoundingClientRect();
    shipX = tvRect.width / 2 - spaceship.offsetWidth / 2;
    shipY = tvRect.height - spaceship.offsetHeight - 20;
    updateShipPosition();
    
    gameActive = true;
    paused = false;
    showScreen(gameScreen);
    gameLoop();
    spawnEnemies();
    spawnIncreaseInterval = setInterval(increaseEnemyCount, 10000);
    timerInterval = setInterval(updateTimer, 1000);
}

function pauseGame() {
    if (!gameActive) return;
    paused = true;
    showScreen(pauseMenu);
    bgMusic.pause();
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}

function updateTimer() {
    if (!gameActive || paused) return;
    timeLeft--;
    timerElement.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) spawnBoss();
}

function increaseEnemyCount() {
    if (!gameActive || paused || bossActive) return;
    maxEnemies += 1;
    spawnRate = Math.max(500, spawnRate - 200);
}

// Spaceship Movement
gameScreen.addEventListener('mousemove', (e) => {
    if (!gameActive || paused) return;
    const tvRect = tvFrame.getBoundingClientRect();
    shipX = e.clientX - tvRect.left - spaceship.offsetWidth / 2;
    updateShipPosition();
});

gameScreen.addEventListener('touchmove', (e) => {
    if (!gameActive || paused) return;
    e.preventDefault();
    const touch = e.touches[0];
    const tvRect = tvFrame.getBoundingClientRect();
    shipX = touch.clientX - tvRect.left - spaceship.offsetWidth / 2;
    updateShipPosition();
}, { passive: false });

function updateShipPosition() {
    const tvRect = tvFrame.getBoundingClientRect();
    const shipWidth = spaceship.offsetWidth;
    const shipHeight = spaceship.offsetHeight;
    
    shipX = Math.max(0, Math.min(shipX, tvRect.width - shipWidth));
    shipY = Math.max(0, Math.min(shipY, tvRect.height - shipHeight));
    
    spaceship.style.left = `${shipX}px`;
    spaceship.style.top = `${shipY}px`;
}

// Shooting
document.addEventListener('click', shoot);
gameScreen.addEventListener('touchstart', (e) => {
    e.preventDefault();
    shoot();
}, { passive: false });

function shoot() {
    if (!gameActive || paused) return;
    const now = Date.now();
    if (now - lastShot < 200) return;
    lastShot = now;

    const projectile = document.createElement('div');
    projectile.classList.add('projectile');
    projectile.style.left = `${shipX + spaceship.offsetWidth / 2 - 2.5}px`;
    projectile.style.top = `${shipY - 10}px`;
    gameScreen.appendChild(projectile);
    projectile.classList.add('spawn-anim');
    shootSound.currentTime = 0;
    shootSound.play();

    let projY = shipY - 10;
    const projInterval = setInterval(() => {
        if (paused) return;
        projY -= 10 * gameSpeed;
        projectile.style.top = `${projY}px`;
        if (projY < -10) {
            projectile.remove();
            clearInterval(projInterval);
        }
    }, 16);
}

// Enemy Spawning
function spawnEnemies() {
    if (!gameActive || paused || bossActive) return;
    if (activeEnemies < maxEnemies) {
        const type = Math.random() < 0.3 ? 'fast' : 'normal';
        const enemy = document.createElement('div');
        enemy.classList.add('enemy', type);
        const tvRect = tvFrame.getBoundingClientRect();
        let enemyX = Math.random() * (tvRect.width - (type === 'fast' ? 45 : 60));
        enemy.style.left = `${enemyX}px`;
        enemy.style.top = `-40px`;
        gameScreen.appendChild(enemy);
        enemy.classList.add('spawn-anim');
        activeEnemies++;

        let enemyY = -40;
        let enemyDirection = Math.random() > 0.5 ? 1 : -1;
        const speed = type === 'fast' ? 5 : 3;
        const enemyInterval = setInterval(() => {
            if (paused) return;
            enemyY += speed * gameSpeed;
            enemyX += enemyDirection * (type === 'fast' ? 3 : 2) * gameSpeed;
            enemy.style.top = `${enemyY}px`;
            enemy.style.left = `${enemyX}px`;
            if (enemyX < 0 || enemyX > tvRect.width - (type === 'fast' ? 45 : 60)) enemyDirection *= -1;
            if (enemyY > tvRect.height) {
                enemy.remove();
                activeEnemies--;
                clearInterval(enemyInterval);
            }
        }, 16);
    }

    setTimeout(spawnEnemies, spawnRate / gameSpeed);
}

// Boss Fight
function spawnBoss() {
    if (bossActive || !gameActive) return;
    bossActive = true;
    clearInterval(spawnIncreaseInterval);
    document.querySelectorAll('.enemy').forEach(el => el.remove());
    activeEnemies = 0;

    const boss = document.createElement('div');
    boss.classList.add('boss');
    const tvRect = tvFrame.getBoundingClientRect();
    let bossX = tvRect.width / 2 - 50;
    let bossY = -100;
    let bossHealth = difficultySelect.value === 'easy' ? 30 : difficultySelect.value === 'medium' ? 50 : 70;
    boss.style.left = `${bossX}px`;
    boss.style.top = `${bossY}px`;
    gameScreen.appendChild(boss);
    boss.classList.add('spawn-anim');

    let bossDirection = 1;
    const bossInterval = setInterval(() => {
        if (paused) return;
        bossY += 1 * gameSpeed;
        bossX += bossDirection * 2 * gameSpeed;
        if (bossX < 0 || bossX > tvRect.width - 100) bossDirection *= -1;
        if (bossY < 100) boss.style.top = `${bossY}px`;
        boss.style.left = `${bossX}px`;

        if (Math.random() < 0.02) spawnBossProjectile(bossX + 45, bossY + 100);
    }, 16);

    boss.addEventListener('hit', () => {
        bossHealth--;
        boss.classList.add('hit');
        setTimeout(() => boss.classList.remove('hit'), 100);
        if (bossHealth <= 0) {
            score += 100;
            scoreElement.textContent = score;
            createExplosion(bossX + 25, bossY + 25);
            boss.remove();
            clearInterval(bossInterval);
            endGame(true);
        }
    });
}

function spawnBossProjectile(x, y) {
    const proj = document.createElement('div');
    proj.classList.add('boss-projectile');
    proj.style.left = `${x}px`;
    proj.style.top = `${y}px`;
    gameScreen.appendChild(proj);
    proj.classList.add('spawn-anim');

    let projY = y;
    const projInterval = setInterval(() => {
        if (paused) return;
        projY += 5 * gameSpeed;
        proj.style.top = `${projY}px`;
        if (projY > tvFrame.getBoundingClientRect().height) {
            proj.remove();
            clearInterval(projInterval);
        }
    }, 16);
}

// Game Loop
function gameLoop() {
    if (!gameActive || paused) return;
    const tvRect = tvFrame.getBoundingClientRect();
    const projectiles = document.querySelectorAll('.projectile');
    const enemies = document.querySelectorAll('.enemy');
    const boss = document.querySelector('.boss');
    const bossProjectiles = document.querySelectorAll('.boss-projectile');
    const shipRect = spaceship.getBoundingClientRect();

    projectiles.forEach((projectile) => {
        const projRect = projectile.getBoundingClientRect();
        enemies.forEach((enemy) => {
            const enemyRect = enemy.getBoundingClientRect();
            if (checkCollision(projRect, enemyRect)) {
                score += enemy.classList.contains('fast') ? 15 : 10;
                scoreElement.textContent = score;
                // Adjust explosion position relative to game-screen
                const gameScreenRect = gameScreen.getBoundingClientRect();
                const explosionX = enemyRect.left - gameScreenRect.left;
                const explosionY = enemyRect.top - gameScreenRect.top;
                createExplosion(explosionX, explosionY);
                projectile.remove();
                enemy.remove();
                activeEnemies--;
            }
        });
        if (boss) {
            const bossRect = boss.getBoundingClientRect();
            if (checkCollision(projRect, bossRect)) {
                boss.dispatchEvent(new Event('hit'));
                // Adjust explosion position for boss
                const gameScreenRect = gameScreen.getBoundingClientRect();
                const explosionX = projRect.left - gameScreenRect.left;
                const explosionY = projRect.top - gameScreenRect.top;
                createExplosion(explosionX, explosionY);
                projectile.remove();
            }
        }
    });

    enemies.forEach((enemy) => {
        if (checkCollision(shipRect, enemy.getBoundingClientRect())) {
            hitPlayer(enemy);
        }
    });
    bossProjectiles.forEach((proj) => {
        if (checkCollision(shipRect, proj.getBoundingClientRect())) {
            hitPlayer(proj);
        }
    });

    if (score > 0 && score % 50 === 0) {
        gameSpeed = Math.min(gameSpeed + 0.1, 3);
    }

    requestAnimationFrame(gameLoop);
}

function checkCollision(rect1, rect2) {
    return (
        rect1.left < rect2.right &&
        rect1.right > rect2.left &&
        rect1.top < rect2.bottom &&
        rect1.bottom > rect2.top
    );
}

function hitPlayer(element) {
    lives--;
    livesElement.textContent = lives;
    spaceship.classList.add('hit');
    setTimeout(() => spaceship.classList.remove('hit'), 200);
    element.remove();
    explosionSound.currentTime = 0;
    explosionSound.play();
    if (lives <= 0) endGame(false);
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = `${x - 10}px`; // Adjusted to center explosion
    explosion.style.top = `${y - 10}px`;  // Adjusted to center explosion
    gameScreen.appendChild(explosion);
    explosionSound.currentTime = 0;
    explosionSound.play();
    setTimeout(() => explosion.remove(), 500);
}

function endGame(victory = false) {
    gameActive = false;
    clearInterval(spawnIncreaseInterval);
    clearInterval(timerInterval);
    finalScoreElement.textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    document.getElementById('game-over-title').textContent = victory ? "Victory!" : "Game Over";
    showScreen(gameOverScreen);
    document.querySelectorAll('.projectile, .enemy, .boss, .boss-projectile, .explosion').forEach(el => el.remove());
    activeEnemies = 0;
    bossActive = false;
    bgMusic.pause();
}

// Pause Toggle
document.addEventListener('keydown', (e) => {
    if (e.key === 'p' && gameActive && !paused) pauseGame();
});

// Initial State
showScreen(startScreen);