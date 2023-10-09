export class Menu {
    // Необходимо добавить таймер в левой части экрана
    // Таймер должен запускаться с началом игры
    // Справа должны быть две кнопки - отмена хода и начать сначала
    // Ещё нужна кнопка вернуться назад - к выбору игры
    // При нажатии кнопок назад и начать сначала должно появляться модальное окно

    constructor(menuElement, restartCallback, undoCallback) {
        this.menuElement = menuElement;
        this.restartCallback = restartCallback;
        this.undoCallback = undoCallback;

        // Create left-zone for timer
        this.leftZone = document.createElement('div');
        this.leftZone.classList.add('left-zone');
        this.menuElement.appendChild(this.leftZone);

        // Create timer element
        this.timerElement = document.createElement('div');
        this.timerElement.classList.add('timer');
        this.leftZone.appendChild(this.timerElement);

        // Create right-zone for buttons
        this.rightZone = document.createElement('div');
        this.rightZone.classList.add('right-zone');
        this.menuElement.appendChild(this.rightZone);

        // Create "Restart" button
        this.restartButton = document.createElement('button');
        this.restartButton.textContent = 'Restart';
        this.restartButton.addEventListener('click', () => {
            if (typeof this.restartCallback === 'function') {
                this.restartCallback();
            }
        });
        this.rightZone.appendChild(this.restartButton);

        // Create "Undo" button
        this.undoButton = document.createElement('button');
        this.undoButton.textContent = 'Undo';
        this.undoButton.addEventListener('click', () => {
            if (typeof this.undoCallback === 'function') {
                this.undoCallback();
            }
        });
        this.rightZone.appendChild(this.undoButton);
    }

    setTimer(seconds) {
        this.timerElement.textContent = formatTime(seconds);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secondsRemainder = Math.floor(seconds % 60);
    const formattedTime = `${minutes}:${secondsRemainder.toString().padStart(2, '0')}`;
    return formattedTime;
}