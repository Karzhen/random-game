import { Cell } from "./cell.js";

const gridSize = 4,
    cellsCount = gridSize * gridSize;

export class Grid {
    constructor(gridElement) {
        this.cells = [];
        for (let i = 0; i < cellsCount; i++) {
            this.cells.push(
                new Cell(gridElement, i % gridSize, Math.floor(i / gridSize))
            );
        }

        this.groupedByColumn = this.groupByColumn();
        this.groupedByReversedColumn = this.groupedByColumn.map(column => [...column].reverse());
        this.groupedByRows = this.groupByRows();
        this.groupedByReversedRows = this.groupedByRows.map(rows => [...rows].reverse());
    }

    getEmptyCells() {
        const emptyCell = this.cells.filter(cell => cell.isEmpty());
        const randomCell = Math.floor(Math.random() * emptyCell.length);
        return emptyCell[randomCell];
    }

    groupByColumn() {
        return this.cells.reduce((groupedCells, cell) => {
            groupedCells[cell.x] = groupedCells[cell.x] || [];
            groupedCells[cell.x][cell.y] = cell;
            return groupedCells;
        }, [])
    }

    groupByRows() {
        return this.cells.reduce((groupedCells, cell) => {
            groupedCells[cell.y] = groupedCells[cell.y] || [];
            groupedCells[cell.y][cell.x] = cell;
            return groupedCells;
        }, [])
    }
}