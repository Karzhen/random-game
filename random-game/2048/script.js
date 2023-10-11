import {Menu} from "./menu.js";
import {Grid} from "./grid.js";
import {Tile} from "./tile.js";

let timerInterval;
let secondsElapsed = 0;
let allowTileMovement = true;

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
    setupInput();
}

function backToPreviousMove() {
    if (gameStateStack.length > 0) {
        const previousState = gameStateStack.pop(); // Получить предыдущее состояние
        gameStateStack.length = 0; // Очистить текущее состояние

        menu.undoButton.style.opacity = '0';
        menu.undoButton.style.transition = '1s';
        menu.undoButton.addEventListener("mouseover", function() {
            menu.undoButton.style.cursor = "default";
        })

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
updateLeaderBoard();
startTimer();
setupInput();

function setupInput() {
    window.addEventListener('keydown', handleInput, { once: true});
}

function cancelInput() {
    window.removeEventListener('keydown', handleInput);
}

async function handleInput(event) {
    if (!allowTileMovement) {
        return;
    }

    // console.log(gameStateStack);
    if (menu.undoButton.style.opacity === '0') {
        menu.undoButton.style.opacity = '1';
        menu.undoButton.style.transition = '1s';
        menu.undoButton.addEventListener("mouseover", function() {
            menu.undoButton.style.cursor = "pointer";
        })
    }
    switch (event.key) {
        case "ArrowUp":
            if (!canMoveUp()) {
                setupInput();
                return;
            }
            saveGameState();
            await moveUp();
            checkFor2048Tile();
            break;

        case "ArrowDown":
            if (!canMoveDown()) {
                setupInput();
                return;
            }
            saveGameState();
            await moveDown();
            checkFor2048Tile();
            break;

        case "ArrowLeft":
            if (!canMoveLeft()) {
                setupInput();
                return;
            }
            saveGameState();
            await moveLeft();
            checkFor2048Tile();
            break;

        case "ArrowRight":
            if (!canMoveRight()) {
                setupInput();
                return;
            }
            saveGameState();
            await moveRight();
            checkFor2048Tile();
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
        showLose()
        // setupInput();
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
        if (!cell.readyForMerge()) {
            playSoundWhoosh();
        }
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

const modalCongrats = document.getElementById('modal-congrats'),
    modalLose = document.getElementById('modal-lose'),
    okButton = document.getElementById('ok-button'),
    loseButton = document.getElementById('lose-button'),
    gameTimeSpan = document.getElementById('game-time'),
    loseTimeSpan = document.getElementById('lose-time');

function checkFor2048Tile() {
    // cancelInput();
    for (const cell of grid.cells) {
        if (cell.linkedTile && cell.linkedTile.value === 512) {
            showCongratulations();
            return;
        }
    }
}

function showCongratulations() {
    allowTileMovement = false;
    stopTimer();
    const timeFinish = menu.endTime(secondsElapsed);
    gameTimeSpan.textContent = timeFinish;
    storeLeaderBoard(timeFinish);
    modalCongrats.style.display = 'flex';
    okButton.addEventListener('click', hideCongratulations);
    updateLeaderBoard();
}

function hideCongratulations() {
    allowTileMovement = true;
    modalCongrats.style.display = 'none';
    restartGame();
}

function showLose() {
    allowTileMovement = false;
    stopTimer();
    loseTimeSpan.textContent = menu.endTime(secondsElapsed);
    modalLose.style.display = 'flex';
    loseButton.addEventListener('click', hideLose);
}

function hideLose() {
    allowTileMovement = true;
    modalLose.style.display = 'none';
    restartGame();
}

function playSoundWhoosh() {
    const audio = document.getElementById("audioWhoosh");
    audio.play();
}

function storeLeaderBoard(timeFinish) {
    const topScores = getTopScore();
    topScores.push(timeFinish);
    topScores.sort((a, b) => compareScores(a, b));
    topScores.length = Math.min(topScores.length, 5);

    localStorage.setItem('topScores', JSON.stringify(topScores));
}

function getTopScore() {
    const topScoresJSON = localStorage.getItem('topScores');
    return topScoresJSON ? JSON.parse(topScoresJSON) : [];
}

function compareScores(timeA, timeB) {
    const [minutesA, secondsA] = timeA.split(':').map(Number);
    const [minutesB, secondsB] = timeB.split(':').map(Number);

    const timeSecA = minutesA * 60 + secondsA;
    const timeSecB = minutesB * 60 + secondsB;

    return timeSecA - timeSecB;
}

function updateLeaderBoard() {
// mini-text
    const topScores = getTopScore();

    console.log(`Top scores: ${topScores}`);

    const topScoresList = document.getElementById('top-scores-list');
    topScoresList.innerHTML = '';

    topScores.forEach((score, index) => {
        const newListItem = document.createElement('li');
        newListItem.classList.add('scores');
        // newListItem.textContent = `${index + 1}. ${score}`;
        newListItem.textContent = ` ${score}`;
        topScoresList.appendChild(newListItem);
    })
}