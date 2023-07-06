// Constants
const startingCells = 1000;
const maxCells = 3000;
const newCellsPerUpdate = 30;
const removalPeriod = 1000; //how often in MS to remove dead/out of bounds
let globalSpeedModifier = 1;

let deadCells = 0;
let newCells = 0;

// Canvas. Resizes canvas if window size changes.
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

// Initial setup
resizeCanvas();

var width = canvas.width;
var height = canvas.height;

// fill the canvas with white background
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, width, height);

// Event listeners
// Mouse tracking
let mousePosition = { x: 0, y: 0 };
canvas.addEventListener('mousemove', (e) => {
    mousePosition.x = e.clientX - canvas.offsetLeft;
    mousePosition.y = e.clientY - canvas.offsetTop;
});

//Turn on or off background refresh
let backgroundRefresh = true;

window.addEventListener('keydown', function (event) {
    if (event.key === 'g' || event.key === 'G') {
        backgroundRefresh = !backgroundRefresh;
    }
});

//Speed change
window.addEventListener('keydown', function (event) {
    if (event.key === '[' && globalSpeedModifier > 0.21) {
        globalSpeedModifier -= 0.2;
        console.log(`Global speed modifier: ${globalSpeedModifier}`);
    }
});

window.addEventListener('keydown', function (event) {
    if (event.key === ']') {
        globalSpeedModifier += 0.2;
        console.log(`Global speed modifier: ${globalSpeedModifier}`);
    }
});

//Print stats
window.addEventListener('keydown', function (event) {
    if (event.key === '\\') {
        console.log(`Live Cells: ${cells.length} | Spawned Cells: ${newCells} | Dead Cells: ${deadCells}`)
        console.table(cells);
    }
});

//Color generator
const colorGenerator = new ColorGenerator();

// Functions
const getRandomCoordinate = (canvas) => {
    let padding = 25; // minimum distance from border

    let x = padding + Math.floor(Math.random() * (width - 2 * padding));
    let y = padding + Math.floor(Math.random() * (height - 2 * padding));

    return { x, y };
}

const getRandomNumInRange = (min, max) => {
    return Math.random() * (max - min) + min;
}

const generateName = (names) => {
    // Capitalize the first letter of each name and randomly select one
    return names
        .map(name => name.charAt(0).toUpperCase() + name.slice(1))
    [Math.floor(Math.random() * names.length)];
}

const getRandomAbsorbPhrase = (absorbPhrases) => {
    let randomIndex = Math.floor(Math.random() * absorbPhrases.length);
    return absorbPhrases[randomIndex];
}

const getRandomAmAbsorbedPhrase = (amAbsorbedPhrases) => {
    let randomIndex = Math.floor(Math.random() * amAbsorbedPhrases.length);
    return amAbsorbedPhrases[randomIndex];
}

function areColliding(cell1, cell2) {
    const dx = cell2.loc.x - cell1.loc.x;
    const dy = cell2.loc.y - cell1.loc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < (cell1.size / 2) + (cell2.size / 2);
}

function removeOutOfBoundsCells(cells, canvasWidth, canvasHeight) {
    for (let i = cells.length - 1; i >= 0; i--) {
        const cell = cells[i];

        //Gives 1k px leeway before they delete, to let large things move out before they disappear
        if (cell.size < 1 || cell.loc.x < -700 || cell.loc.x > canvasWidth + 700 || cell.loc.y < -700 || cell.loc.y > canvasHeight + 700) {
            cells.splice(i, 1);
            deadCells++;
        }
    }
}

// World creation
// Initialize an empty array to store all the cells
let cells = [];

// Create numCells cells with random starting positions, speed, and pauseTime
for (let i = 0; i < startingCells; i++) {
    const cell = new Cell(getRandomCoordinate(), generateName(names), colorGenerator.getOneColor(), getRandomNumInRange(2, 6), getRandomNumInRange(0, 360));
    cells.push(cell);
}

//Game loop
let lastTime = 0;
let timeSinceLastRemoval = 0;

const gameLoop = (timestamp) => {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (backgroundRefresh) { ctx.clearRect(0, 0, width, height); }

    //Spawn new cells
    if (cells.length < maxCells) {
        for (let i = 0; i < newCellsPerUpdate; i++) {
            const cell = new Cell(getRandomCoordinate(), generateName(names), colorGenerator.getOneColor(), getRandomNumInRange(1, 2), getRandomNumInRange(0, 360));
            cells.push(cell);
            newCells++;
        }
    }

    // Update and draw each cell
    cells.forEach(cell => {

        // Check for collisions or imminent collisions with other cells, only if big enough
        if (cell.size > 1.5) {
            cells.forEach(otherCell => {
                cell.checkForCollision(otherCell);
                cell.reactToImminentCollision(otherCell);
            });
        }

        cell.update(deltaTime, width, height);

        cell.draw(ctx);
    });

    timeSinceLastRemoval += deltaTime;
    if (timeSinceLastRemoval >= removalPeriod) {
        removeOutOfBoundsCells(cells, width, height);
        timeSinceLastRemoval = 0;
    }

    requestAnimationFrame(gameLoop);

}

requestAnimationFrame(gameLoop);