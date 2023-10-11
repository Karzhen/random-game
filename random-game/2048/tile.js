export class Tile {
    constructor(gridElement) {
        this.tile = document.createElement('div');
        this.tile.classList.add('tile');
        this.setValue(Math.random() > 0.5 ? 2 : 4);
        gridElement.append(this.tile);
    }

    setXY(x, y) {
        this.x = x;
        this.y = y;
        this.tile.style.setProperty('--x', x);
        this.tile.style.setProperty('--y', y);
    }

    setValue(value) {
        // Нужно сделать выбор цвета из списка цветов,
        // а не каждый раз заглядывать в CSS.
        // Создать list с ключами 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048
        // и выбирать в зависимости от значения
        this.value = value;
        this.tile.textContent = value;
        const backGroundTile = `--color-${value}`;
        this.tile.style.backgroundColor = `var(${backGroundTile})`;
        if (value === 2048) {
            alert("mazafaka");
        }
    }

    removeFromDOM() {
        this.tile.remove();
    }

    waitingTransition() {
        return new Promise(resolve => {
            this.tile.addEventListener("transitionend", resolve, { once: true});
        })
    }

    waitingToMove() {
        return new Promise(resolve => {
            this.tile.addEventListener("animationend", resolve, { once: true});
        })
    }
}