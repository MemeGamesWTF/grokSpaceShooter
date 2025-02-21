// game.js
const gameContainer = document.querySelector('.game-container');
const spaceship = document.getElementById('spaceship');
const scoreElement = document.getElementById('score');
let score = 0;
let gameSpeed = 1; // Increases over time
let lastShot = 0;

// Spaceship Movement
let shipX = 50;
let shipY = window.innerHeight / 2;

gameContainer.addEventListener('mousemove', (e) => {
    shipX = e.clientX - 30; // Offset by half spaceship width
    shipY = e.clientY - 20; // Offset by half spaceship height
    updateShipPosition();
});

function updateShipPosition() {
    spaceship.style.left = `${Math.max(0, Math.min(shipX, window.innerWidth - 60))}px`;
    spaceship.style.top = `${Math.max(0, Math.min(shipY, window.innerHeight - 40))}px`;
}

// Shooting
document.addEventListener('click', shoot);
function shoot() {
    const now = Date.now();
    if (now - lastShot < 200) return; // Shooting cooldown (200ms)
    lastShot = now;

    const projectile = document.createElement('div');
    projectile.classList.add('projectile');
    projectile.style.left = `${shipX + 60}px`; // Right of spaceship
    projectile.style.top = `${shipY + 17}px`; // Middle of spaceship
    gameContainer.appendChild(projectile);

    let projX = shipX + 60;
    const projInterval = setInterval(() => {
        projX += 10 * gameSpeed;
        projectile.style.left = `${projX}px`;
        if (projX > window.innerWidth) {
            projectile.remove();
            clearInterval(projInterval);
        }
    }, 16); // ~60fps
}

// Enemy Spawning
function spawnEnemy() {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    const enemyY = Math.random() * (window.innerHeight - 40);
    enemy.style.left = `${window.innerWidth}px`;
    enemy.style.top = `${enemyY}px`;
    gameContainer.appendChild(enemy);

    let enemyX = window.innerWidth;
    const enemyInterval = setInterval(() => {
        enemyX -= 3 * gameSpeed;
        enemy.style.left = `${enemyX}px`;
        if (enemyX < -40) {
            enemy.remove();
            clearInterval(enemyInterval);
        }
    }, 16);
}

setInterval(spawnEnemy, 1500 / gameSpeed); // Spawn every 1.5s, adjusted by speed

// Collision Detection and Game Loop
function gameLoop() {
    const projectiles = document.querySelectorAll('.projectile');
    const enemies = document.querySelectorAll('.enemy');

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
                // Collision Detected
                score += 10;
                scoreElement.textContent = score;
                createExplosion(enemyRect.left, enemyRect.top);
                projectile.remove();
                enemy.remove();
            }
        });
    });

    // Increase difficulty
    if (score > 0 && score % 50 === 0) {
        gameSpeed += 0.1;
    }

    requestAnimationFrame(gameLoop);
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = `${x - 10}px`;
    explosion.style.top = `${y - 10}px`;
    gameContainer.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500); // Match explosion animation duration
}

// Start the Game
gameLoop();