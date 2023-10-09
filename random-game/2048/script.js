import { Grid } from "./grid.js";
import { Tile } from "./tile.js";

const gameBoard = document.getElementById('game-board'),
    menu = document.getElementById('menu');

const grid = new Grid(gameBoard);
grid.getEmptyCells().linkTile(new Tile(gameBoard));
grid.getEmptyCells().linkTile(new Tile(gameBoard));
setupInput();

function setupInput() {
    window.addEventListener('keydown', handleInput, { once: true});
}

async function handleInput(event) {
    console.log(event.key);
    switch (event.key) {
        case "ArrowUp":
            if (!canMoveUp()) {
                setupInput();
                return;
            }
            await moveUp();
            break;

        case "ArrowDown":
            if (!canMoveDown()) {
                setupInput();
                return;
            }
            await moveDown();
            break;

        case "ArrowLeft":
            if (!canMoveLeft()) {
                setupInput();
                return;
            }
            await moveLeft();
            break;

        case "ArrowRight":
            if (!canMoveRight()) {
                setupInput();
                return;
            }
            await moveRight();
            break;

        default:
            setupInput();
            return;
    }

    const newTile = new Tile(gameBoard);
    grid.getEmptyCells().linkTile(newTile);

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        await newTile.waitingToMove();
        alert("Try again");
        return;
    }

    // if

    setupInput();
}

async function moveUp() {
    await slideTiles(grid.groupedByColumn);
}

async function moveDown() {
    await slideTiles(grid.groupedByReversedColumn);
}

async function moveLeft() {
    await slideTiles(grid.groupedByRows);
}

async function moveRight() {
    await slideTiles(grid.groupedByReversedRows);
}

async function slideTiles(groupedCells) {
    const promises = [];
    groupedCells.forEach(group => groupTiles(group, promises));

    await Promise.all(promises);

    grid.cells.forEach(cell => {
        cell.readyForMerge() && cell.mergeTiles();
    })
}

function groupTiles(group, promises) {
    // Начинаем с i = 1, потому что верхнюю ячейку некуда двигать
    for (let i = 1; i < group.length; i++) {
        if (group[i].isEmpty()) {
            // Если текущая ячейка пустая,
            // то мы переходим к следующей итерации цикла
            continue;
        }
        // Когда ячейка не пустая...
        const cellWithTile = group[i];

        let targetCell;
        let j = i - 1;

        while (j >= 0 && group[j].canAccept(cellWithTile.linkedTile)) {
            targetCell = group[j];
            j--;
        }

        if (!targetCell) {
            // Если соседняя ячейка была с другим значением,
            // то мы переходим к следующей итерации цикла
            continue;
        }

        promises.push(cellWithTile.linkedTile.waitingTransition());

        if (targetCell.isEmpty()) {
            targetCell.linkTile(cellWithTile.linkedTile);
        } else {
            targetCell.connectTile(cellWithTile.linkedTile);
        }

        cellWithTile.unlinkTile();
    }
}

function canMoveUp() {
    return canMove(grid.groupedByColumn);
}

function canMoveDown() {
    return canMove(grid.groupedByReversedColumn);
}

function canMoveLeft() {
    return canMove(grid.groupedByRows);
}

function canMoveRight() {
    return canMove(grid.groupedByReversedRows);
}

function canMove(groupedCells) {
    return groupedCells.some(group => canMoveInsideGroup(group));
}

function canMoveInsideGroup(groupCells) {
    return groupCells.some((cell, index) => {
        if (index === 0) {
            return false;
        }

        if (cell.isEmpty()) {
            return false;
        }

        const targetCell = groupCells[index - 1];
        return targetCell.canAccept(cell.linkedTile);
    })
}