export class Cell {
    constructor(gridElement, x, y) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        gridElement.append(cell);
        this.x = x;
        this.y = y;
    }

    linkTile(tile) {
        tile.setXY(this.x, this.y);
        this.linkedTile = tile;
    }

    unlinkTile() {
        this.linkedTile = null;
    }

    isEmpty() {
        return !this.linkedTile;
    }

    connectTile(tile) {
        tile.setXY(this.x, this.y);
        this.connectedTile = tile;
    }

    unlinkTileAfterConnect() {
        this.connectedTile = null;
    }

    readyForMerge() {
        return !!this.connectedTile;
    }

    canAccept(newTile) {
        return this.isEmpty() || (!this.readyForMerge() && this.linkedTile.value === newTile.value);
    }

    mergeTiles() {
        this.linkedTile.setValue(this.linkedTile.value + this.connectedTile.value);
        this.connectedTile.removeFromDOM();
        this.unlinkTileAfterConnect();
    }
}