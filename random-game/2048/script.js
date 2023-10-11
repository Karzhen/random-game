import { Menu } from "./menu.js";
import { Grid } from "./grid.js";
import { Tile } from "./tile.js";

let timerInterval;
let secondsElapsed = 0;

const gameBoard = document.getElementById('game-board'),
    gameMenu = document.getElementById('menu');

const menu = new Menu(gameMenu, restartGame, backToPreviousMove);
const gameStateStack = [];

const grid = new Grid(gameBoard);
grid.getEmptyCells().linkTile(new Tile(gameBoard));
grid.getEmptyCells().linkTile(new Tile(gameBoard));

function restartGame() {
    gameStateStack.length = 0;

    grid.cells.forEach(cell => {
        if (cell.linkedTile) {
            cell.linkedTile.removeFromDOM();
            cell.unlinkTile();
        }
    });
    grid.cells.forEach(cell => cell.unlinkTile());

    grid.getEmptyCells().linkTile(new Tile(gameBoard));
    grid.getEmptyCells().linkTile(new Tile(gameBoard));
    // Перезапуск таймера
    stopTimer();
    secondsElapsed = 0;
    menu.setTimer(secondsElapsed);
    startTimer();
}

function backToPreviousMove() {
    if (gameStateStack.length > 0) {
        const previousState = gameStateStack.pop(); // Получить предыдущее состояние
        gameStateStack.length = 0; // Очистить текущее состояние

        // Сбросить сетку, удалив все плитки
        grid.cells.forEach(cell => {
            if (cell.linkedTile) {
                cell.linkedTile.removeFromDOM();
                cell.unlinkTile();
            }
        });

        // Восстановление предыдущего состояния сетки
        previousState.forEach(prevStateCell => {
            const cell = grid.cells.find(
                cell => cell.x === prevStateCell.x && cell.y === prevStateCell.y
            );

            if (cell) {
                if (prevStateCell.value > 0) {
                    // Восстановление плитки
                    const tile = new Tile(gameBoard);
                    tile.setXY(prevStateCell.x, prevStateCell.y);
                    tile.setValue(prevStateCell.value);
                    cell.linkTile(tile);
                }
            }
        });
    }
}

function saveGameState() {
    gameStateStack.length = 0;
    const gameState = grid.cells.map(cell => ({
        x: cell.x,
        y: cell.y,
        value: cell.linkedTile ? cell.linkedTile.value : 0,
    }));
    gameStateStack.push(gameState);
}

// Запуск таймера при начале игры
startTimer();
setupInput();

function setupInput() {
    window.addEventListener('keydown', handleInput, { once: true});
}

async function handleInput(event) {
    console.log(gameStateStack);
    switch (event.key) {
        case "ArrowUp":
            if (!canMoveUp()) {
                setupInput();
                return;
            }
            saveGameState();
            await moveUp();
            break;

        case "ArrowDown":
            if (!canMoveDown()) {
                setupInput();
                return;
            }
            saveGameState();
            await moveDown();
            break;

        case "ArrowLeft":
            if (!canMoveLeft()) {
                setupInput();
                return;
            }
            saveGameState();
            await moveLeft();
            break;

        case "ArrowRight":
            if (!canMoveRight()) {
                setupInput();
                return;
            }
            saveGameState();
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
        stopTimer();
        alert("Try again");
        getReward();
        setupInput();
        return;
    }
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

function startTimer() {
    timerInterval = setInterval(() => {
        secondsElapsed++;
        menu.setTimer(secondsElapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function getReward() {
    const stopTime = menu.endTime(secondsElapsed);
    alert(stopTime);
}