import { stdin } from "process";
import { Bag } from "./bag.interface";
import { Tetris as tetris } from "./bag";

export default class Tetris {

    #tetris: Bag[] = tetris;
    #currentPiece: Bag;
    #bag: Bag[];
    #interval: NodeJS.Timeout;
    #board: string[][];
    #currentPosX = 4;
    #currentPosY = 0;
    #gameCounter = 0;

    constructor() { };

    public async start(): Promise<void> {

        const keypress = require("keypress");

        this.#bag = this.createBag();
        this.#currentPiece = this.#bag[0];
        this.#board = this.genBoard(false);


        this.#interval = setInterval(() => {
            this.#board = this.render();
        }, 200);

        keypress(stdin);

        stdin.on('keypress', (__, key) => {
            if (key && key.ctrl && key.name === "c") process.exit();
            if (key && key.name === "right") this.#currentPiece = this.rotate(this.#currentPiece, "r");
            if (key && key.name === "left") this.#currentPiece = this.rotate(this.#currentPiece, "l");
            if (key && key.name === "d") this.move("right");
            if (key && key.name === "a") this.move("left");
            if (key && key.name === "down") this.place();
        });

        stdin.setRawMode(true);
        stdin.resume();
    }

    //10x20

    private move(dirrection: "right" | "left") {
        if (dirrection === "right") this.#currentPosX++;
        else this.#currentPosX--;
    }

    private render() {

        const boardClone = this.#board;

        // // const boardClone = [...this.#board];
        // const boardClone = [];
        // // board.forEach(e => boardClone.push(e.join(" ").replaceAll("current ", "empty").split("")));


        for (let j = 0; j < boardClone.length; j++) {
            for (let i = 0; i < boardClone[0].length; i++) {
                if (boardClone[j][i] === "current") boardClone[j][i] = "empty";
            }
        }

        // this.#previousBoard = boardClone;

        const pieceYLength = this.#currentPiece[this.#currentPiece.current].filter(p => p === "\n").length + 1;

        for (let i = 0; i < boardClone[0].length; i++) {

            if (i === this.#currentPosX) {
                let additionalY = 0;
                let x = i;

                if ((this.#currentPosY + pieceYLength) - 20 === 0) {
                    this.place();
                    break;
                }

                for (let j = 0; j < this.#currentPiece[this.#currentPiece.current].length; j++) {
                    if (this.#currentPiece[this.#currentPiece.current][j] === "\n") {
                        additionalY++;
                        x = i;
                    }
                    else if (this.#currentPiece[this.#currentPiece.current][j] === "  ") {
                        boardClone[this.#currentPosY + additionalY][x] = "empty";
                        x++;
                    }
                    else {
                        boardClone[this.#currentPosY + additionalY][x] = this.#currentPiece[this.#currentPiece.current][j];
                        x++;
                    }
                }
                break;
            }

        }
        if (this.#gameCounter % 5 === 0 && this.#gameCounter !== 0) {
            this.#currentPosY++;
            this.#gameCounter++;
        } else this.#gameCounter++;


        let end = "";
        for (const part of boardClone) end += `${part.join("")}\n`;

        console.clear();
        console.log(end
            .replaceAll("empty", "⚫")
            .replaceAll("placed", "⚪")
            .replaceAll("current", "⚪"));
        console.log(this.nextUp());

        return boardClone;
    }

    private genBoard(modified?: boolean) {
        const board: string[][] = [];
        // if (!modified) {
        for (let i = 0; i < 20; i++) {
            let part: string[] = [];
            for (let j = 0; j < 10; j++) part.push("empty");
            board.push(part);
        }
        // } else {
        // for (let i = 0; i < 20; i++) {
        // for (let j = 0; j < 10; j++) board.push(this.#board[j]);
        // }
        // }
        return board;
    }

    private nextUp() {
        return `Next Up:\n${this.#bag[1] ? this.#bag[1][0].join("").replaceAll("current", "⚪") : "Please Wait"}`
    }

    private place() {
        this.#bag.shift();


        const currentPiece = this.#currentPiece;
        const x = this.#currentPosX;
        // const y = 0;
        const pieceYLength = currentPiece[currentPiece.current].filter(p => p === "\n").length + 1;

        let placedOffset = 0;

        for (let i = 0; i < this.#board[0].length; i++) {

            if (i === x) {

                let additionalY = 0;
                let xPos = i;

                for (let i = 0; i < pieceYLength; i++) {
                    if (this.#board[20 - 1 - i][xPos] !== "empty") placedOffset++;
                }

                for (let j = 0; j < this.#currentPiece[this.#currentPiece.current].length; j++) {
                    if (this.#currentPiece[this.#currentPiece.current][j] === "\n") {
                        additionalY++;
                        xPos = i;
                    }
                    else if (this.#currentPiece[this.#currentPiece.current][j] === "  " && this.#board[20 - pieceYLength + additionalY][xPos] !== "placed") {
                        this.#board[20 - pieceYLength - placedOffset + additionalY][xPos] = "empty";
                        xPos++;
                    }
                    else {
                        if (this.#board[20 - pieceYLength - placedOffset + additionalY][xPos] !== "placed") {
                            this.#board[20 - pieceYLength - placedOffset + additionalY][xPos] = "placed";
                        } else {

                            for (let k = 0; k < this.#board.length; k++) {
                                if (this.#board[20 - pieceYLength - k - placedOffset + additionalY] && this.#board[20 - pieceYLength - k - placedOffset + additionalY][xPos] === "empty") {
                                    this.#board[20 - pieceYLength - k - placedOffset + additionalY][xPos] = "placed";
                                    break;
                                }
                            }

                        }
                        xPos++;
                    }
                }
                break;
            }

        }

        this.#currentPosX = 4;
        this.#currentPosY = 0;

        this.#board = this.render();

        if (this.#bag.length === 0) {
            this.#bag = this.createBag();
            this.#currentPiece = this.#bag[0];
        } else {
            console.log("Placed Piece");
            this.#currentPiece = this.#bag[0];
        }

    }

    private rotate(piece: Bag, dirrection: "l" | "r"): Bag {
        if (dirrection === "r") {
            if (piece.current === 3) piece.current = 0;
            else piece.current++;
        } else if (dirrection === "l") {
            if (piece.current === 0) piece.current = 3;
            else piece.current--;
        }

        // console.log(piece[piece.current].join("") + "\n\n");

        return piece;
    }

    private createBag(): Bag[] {
        const bag: Bag[] = [];
        const tetrisClone = [...this.#tetris];
        for (let i = 0; i < 7; i++) {
            const tetrisIndex = Math.floor(Math.random() * tetrisClone.length);
            bag.push(tetrisClone[tetrisIndex]);
            tetrisClone.splice(tetrisIndex, 1);
        }
        return bag;
    }

}


