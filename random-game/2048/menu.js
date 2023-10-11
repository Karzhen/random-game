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

        // Создание левой зоны для таймера
        this.leftZone = document.createElement('div');
        this.leftZone.classList.add('left-zone');
        this.menuElement.appendChild(this.leftZone);

        // Создание элемента таймера
        this.timerElement = document.createElement('div');
        this.timerElement.classList.add('timer');
        this.timerElement.classList.add('text');
        this.timerElement.textContent = "0:00";
        this.leftZone.appendChild(this.timerElement);

        // Создание правой зоны для кнопок
        this.rightZone = document.createElement('div');
        this.rightZone.classList.add('right-zone');
        this.menuElement.appendChild(this.rightZone);

        // Создание кнопки "Restart"
        this.restartButton = document.createElement('button');
        this.restartButton.classList.add('text');
        this.restartButton.textContent = 'Restart';
        this.restartButton.addEventListener('click', () => {
            if (typeof this.restartCallback === 'function') {
                this.restartCallback();
            }
        });
        this.rightZone.appendChild(this.restartButton);

        // Создание кнопки "Undo"
        this.undoButton = document.createElement('button');
        this.undoButton.classList.add('text');
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

    endTime(seconds) {
        return formatTime(seconds);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secondsRemainder = Math.floor(seconds % 60);
    return `${minutes}:${secondsRemainder.toString().padStart(2, '0')}`;
}