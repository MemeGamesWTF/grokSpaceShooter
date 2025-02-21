// game.js
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const spaceship = document.getElementById('spaceship');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');

let score = 0;
let gameSpeed = 1;
let lastShot = 0;
let gameActive = false;
let shipX = window.innerWidth / 2 - 20;
let shipY = window.innerHeight - 100;
let spawnRate = 1500; // Initial spawn delay in ms
let activeEnemies = 0; // Track current enemy count
let maxEnemies = 1; // Start with 1 enemy at a time
let spawnIncreaseInterval; // To increase enemy count over time

// Screen Management
function showScreen(screen) {
    startScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    screen.classList.add('active');
}

// Start Game
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function startGame() {
    score = 0;
    gameSpeed = 1;
    spawnRate = 1500; // Reset spawn rate
    maxEnemies = 1; // Reset max enemies
    activeEnemies = 0;
    scoreElement.textContent = score;
    shipX = window.innerWidth / 2 - 20;
    shipY = window.innerHeight - 100;
    updateShipPosition();
    gameActive = true;
    showScreen(gameScreen);
    gameLoop();
    spawnEnemies();
    // Increase enemy count over time
    spawnIncreaseInterval = setInterval(increaseEnemyCount, 10000); // Every 10 seconds
}

function increaseEnemyCount() {
    if (!gameActive) return;
    maxEnemies += 1; // Allow more simultaneous enemies
    spawnRate = Math.max(500, spawnRate - 200); // Decrease spawn delay, min 500ms
    console.log(`Max Enemies: ${maxEnemies}, Spawn Rate: ${spawnRate}`); // Debugging
}

// Spaceship Movement
gameScreen.addEventListener('mousemove', (e) => {
    if (!gameActive) return;
    shipX = e.clientX - 20;
    updateShipPosition();
});

function updateShipPosition() {
    spaceship.style.left = `${Math.max(0, Math.min(shipX, window.innerWidth - 40))}px`;
    spaceship.style.top = `${shipY}px`;
}

// Shooting
document.addEventListener('click', shoot);
function shoot() {
    if (!gameActive) return;
    const now = Date.now();
    if (now - lastShot < 200) return;
    lastShot = now;

    const projectile = document.createElement('div');
    projectile.classList.add('projectile');
    projectile.style.left = `${shipX + 17}px`;
    projectile.style.top = `${shipY - 10}px`;
    gameScreen.appendChild(projectile);

    let projY = shipY - 10;
    const projInterval = setInterval(() => {
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
    if (!gameActive) return;
    if (activeEnemies < maxEnemies) {
        const enemy = document.createElement('div');
        enemy.classList.add('enemy');
        const enemyX = Math.random() * (window.innerWidth - 40);
        enemy.style.left = `${enemyX}px`;
        enemy.style.top = `-40px`;
        gameScreen.appendChild(enemy);
        activeEnemies++;

        let enemyY = -40;
        const enemyInterval = setInterval(() => {
            enemyY += 3 * gameSpeed;
            enemy.style.top = `${enemyY}px`;
            if (enemyY > window.innerHeight) {
                enemy.remove();
                activeEnemies--;
                clearInterval(enemyInterval);
            }
        }, 16);
    }

    setTimeout(spawnEnemies, spawnRate / gameSpeed); // Dynamic spawn timing
}

// Game Loop (Collisions and Difficulty)
function gameLoop() {
    if (!gameActive) return;
    const projectiles = document.querySelectorAll('.projectile');
    const enemies = document.querySelectorAll('.enemy');
    const shipRect = spaceship.getBoundingClientRect();

    // Projectile-Enemy Collisions
    projectiles.forEach((projectile) => {
        const projRect = projectile.getBoundingClientRect();
        enemies.forEach((enemy) => {
            const enemyRect = enemy.getBoundingClientRect();
            if (
                projRect.left < enemyRect.right &&
                projRect.right > enemyRect.left &&
                projRect.top < enemyRect.bottom &&
                projRect.bottom > enemyRect.top
            ) {
                score += 10;
                scoreElement.textContent = score;
                createExplosion(enemyRect.left, enemyRect.top);
                projectile.remove();
                enemy.remove();
                activeEnemies--;
            }
        });
    });

    // Spaceship-Enemy Collisions
    enemies.forEach((enemy) => {
        const enemyRect = enemy.getBoundingClientRect();
        if (
            shipRect.left < enemyRect.right &&
            shipRect.right > enemyRect.left &&
            shipRect.top < enemyRect.bottom &&
            shipRect.bottom > enemyRect.top
        ) {
            endGame();
        }
    });

    // Increase Game Speed
    if (score > 0 && score % 50 === 0) {
        gameSpeed = Math.min(gameSpeed + 0.1, 3);
    }

    requestAnimationFrame(gameLoop);
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = `${x - 10}px`;
    explosion.style.top = `${y - 10}px`;
    gameScreen.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);
}

// Game Over
function endGame() {
    gameActive = false;
    clearInterval(spawnIncreaseInterval); // Stop enemy count increase
    finalScoreElement.textContent = score;
    showScreen(gameOverScreen);
    document.querySelectorAll('.projectile, .enemy').forEach(el => el.remove());
    activeEnemies = 0;
}

// Initial State
showScreen(startScreen);