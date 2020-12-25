import { stdin, stdout } from "process";
import { Bag } from "./Utils/bag.interface";
import { Tetris as tetris } from "./Utils/bag";
import { clone } from "ramda";
import mp3Duration from "mp3-duration";
import { promisify } from "util";
import rs from "readline-sync";
import play from "play-sound";

const getDuration = promisify(mp3Duration);
const player = "./src/Utils/mplayer/mplayer.exe";

export default class Tetris {

    #tetris: Bag[] = tetris;
    #currentPiece: Bag;

    #themePlayer = play({ player });

    #theme: any;

    #bag: Bag[];
    #secondBag: Bag[];

    #interval: NodeJS.Timeout | boolean;
    #board: string[][];
    #currentPosX = 4;
    #currentPosY = 0;
    #gameCounter = 0;
    #score = 0;

    #level = 1;
    #clearedRows = 0;
    #maxRows = 10;

    constructor() {
        this.start();
    };

    public async start(): Promise<void> {

        console.clear();
        console.log(`Welcome to Console Tetris, to move the pieces left and right, use the A and D keys. To hard drop a piece, press the down arrow. To move a piece down faster, use the S key. To rotate the pieces left and right, use the Left and Right arrow keys. Have fun!\n`)

        const ans = rs.question("Enter y to continue or any other key to cancel\n.");

        if (ans.toLowerCase() === "y") {
            this.#theme = this.#themePlayer.play("./src/Utils/audio/Tetris.mp3", { "./src/Utils/mplayer/mplayer.exe": ["-loop", 0] }, (err) => {
                if (err) throw (err);
            });

            const keypress = require("keypress");

            this.#bag = this.createBag();
            this.#secondBag = this.createBag();

            this.#currentPiece = this.#bag[0];
            this.#board = this.genBoard();
            this.#interval = setInterval(() => {
                this.render();
            }, 100);

            keypress(stdin);

            stdin.on('keypress', (__, key) => {
                if (key && key.ctrl && key.name === "c") process.exit();                
                if (key && key.name === "right" && this.#interval !== false) this.#currentPiece = this.rotate(this.#currentPiece, "r");
                if (key && key.name === "left" && this.#interval !== false) this.#currentPiece = this.rotate(this.#currentPiece, "l");
                if (key && key.name === "d" && this.#interval !== false) this.move("right");
                if (key && key.name === "s" && this.#interval !== false) this.move("down");
                if (key && key.name === "a" && this.#interval !== false) this.move("left");
                if (key && key.name === "down" && this.#interval !== false) this.place();
            });

            stdin.setRawMode(true);
            stdin.resume();
        } else return;
    }

    private score() {

        let clearedRows = 0;
        const clonedBoard = clone(this.#board);

        let rowIndexsToClear: number[] = [];
         
        for (let i = 0; i <= 19; i++) {

            let clear = true;

            for (let j = 0; j < clonedBoard[0].length; j++) {
                const boardPart = clonedBoard[i][j];
                if (!boardPart.includes("placed")) {
                    clear = false;
                    break;
                }
            }
            if (clear) {
                rowIndexsToClear.push(i);
                clearedRows++;
            }

        }

        if (rowIndexsToClear.length > 0) {

            rowIndexsToClear.forEach(async (index, i) => {
                clonedBoard[index] = ["🟥", "🟥", "🟥", "🟥", "🟥", "🟥", "🟥", "🟥", "🟥", "🟥"];
                await this.clearAnimation(clonedBoard, index, i === 0 ? true : false, "🔲");
                clonedBoard.splice(index, 1);
                clonedBoard.unshift(["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"])
            });
        }

        if (clearedRows === 1) this.#score += 40;
        else if (clearedRows === 2) this.#score += 100;
        else if (clearedRows === 3) this.#score += 300;
        else if (clearedRows === 4) this.#score += 1200;

        this.#clearedRows += clearedRows;

        if (clearedRows === 4) {
            this.#themePlayer.play("./src/Utils/audio/TetrisClear.mp3", (err) => {
                if (err) throw err;
            });
        } else if (clearedRows > 0) {
            this.#themePlayer.play("./src/Utils/audio/Clear.mp3", (err) => {
                if (err) throw err;
            });
        }

        if (this.#clearedRows >= this.#maxRows) {
            this.#clearedRows -= 10;
            this.#level++;
        }
        

        return clonedBoard;

    }

    private async clearFlash(board: string[][], color: string, row: number, first: number, second: number) {

        board[row][first] = color;
        board[row][second] = color;
        console.clear();

        console.log(`Your current score is: ${this.#score}`);
        console.log(`Current level: ${this.#level} (${this.#clearedRows}/${this.#maxRows})`);
        console.log(this.showBoard(board));
        console.log(this.nextUp());

        await this.sleep(75);
        console.clear();

        board[row][first] = "empty";
        board[row][second] = "empty";

        console.log(`Your current score is: ${this.#score}`);
        console.log(`Current level: ${this.#level} (${this.#clearedRows}/${this.#maxRows})`);
        console.log(this.showBoard(board));
        console.log(this.nextUp());

        await this.sleep(175);

    }

    private async clearAnimation(board: string[][], row: number, modifyInterval: boolean, color: string) {

        if (this.#interval !== false && modifyInterval) {
            clearInterval(<NodeJS.Timeout>this.#interval);
            this.#interval = false;
        }

        await this.clearFlash(board, color, row, 4, 5);
        await this.clearFlash(board, color, row, 3, 6);
        await this.clearFlash(board, color, row, 2, 7);
        await this.clearFlash(board, color, row, 1, 8);
        await this.clearFlash(board, color, row, 0, 9);

        if (modifyInterval) {
            this.#interval = setInterval(() => {
                this.render();
            }, 100);
        }
    }

    private sleep(ms: number) {
        return new Promise((r) => setTimeout(r, ms));
    }

    private move(dirrection: "right" | "left" | "down") {

        const boardClone = clone(this.#board);

        if (dirrection === "right" 
        && (this.#currentPiece.xLength[this.#currentPiece.current] + this.#currentPosX) < this.#board[0].length) this.#currentPosX++;

        else if (dirrection === "left" 
        && (this.#currentPosX > 0)) {
            this.#currentPosX--;
        }
        else if (dirrection === "down") this.#currentPosY++;


        let additionalY = 0;
        let x = this.#currentPosX;
        
        let overlap = false;

        for (let j = 0; j < this.#currentPiece[this.#currentPiece.current].length; j++) {

            if (boardClone[this.#currentPosY + additionalY] 
                && boardClone[this.#currentPosY + additionalY][x] 
                && boardClone[this.#currentPosY + additionalY][x].includes("placed") 
                && this.#currentPiece[this.#currentPiece.current][j] !== "  " 
                && this.#currentPiece[this.#currentPiece.current][j] !== "\n") {

                overlap = true;
                break;
            }

            if (this.#currentPiece[this.#currentPiece.current][j] === "\n") {
                additionalY++;
                x = this.#currentPosX;
            } else if (this.#currentPiece[this.#currentPiece.current][j] === "  ") x++;
            else x++;
        }

        if (overlap) {
            if (dirrection === "right") this.#currentPosX--;
            else if (dirrection === "left") this.#currentPosX++;
        } else {
            if (dirrection !== "down") {
                const audio = this.#themePlayer.play("./src/Utils/audio/Move.mp3", (err) => {
                    if (err) throw err;
                });
                getDuration("./src/Utils/audio/Move.mp3").then(d => {
                    this.sleep(d * 1500).then(() => {
                        audio.kill();
                    });
                });
            }
        }
    }   

    private render() {

        const boardClone = clone(this.#board);

        const moduloCheck = this.#level === 1 ? 10 : this.#level === 2 ? 9 : this.#level === 3 ? 8 : this.#level === 4 ? 7 : this.#level === 5 ? 6 : this.#level === 6 ? 5 : this.#level === 7 ? 4 : 3;

        for (let j = 0; j < boardClone.length; j++) {
            for (let i = 0; i < boardClone[0].length; i++) {
                if (boardClone[j][i] === "current" || 
                boardClone[j][i] === "current1" || 
                boardClone[j][i] === "current2" || 
                boardClone[j][i] === "current3" ||
                boardClone[j][i] === "current4" ||  
                boardClone[j][i] === "current5" || 
                boardClone[j][i] === "current6") boardClone[j][i] = "empty";
            }
        }

        const pieceYLength = this.#currentPiece[this.#currentPiece.current].filter(p => p === "\n").length + 1;

        let largestOffset = 1;

        for (let p = 0; p < 4; p++) {
            const currentXPos = this.#currentPosX + p;
            let tempOffset = 0;
            for (let y = 0; y < this.#board.length; y++) {
                if (this.#board[y][currentXPos] !== "empty") tempOffset++;
            }
            if (tempOffset > largestOffset) largestOffset = tempOffset;
        }

        let placed = false;
        let clipped = false;
        let newClone = clone(this.#board);

        let additionalY = 0;
        let x = this.#currentPosX;

        if (this.#currentPosY + pieceYLength === 20) return this.place();

        for (let j = 0; j < this.#currentPiece[this.#currentPiece.current].length; j++) {

            if (this.#gameCounter % moduloCheck === 0
                && newClone[this.#currentPosY + additionalY] 
                && newClone[this.#currentPosY + additionalY][x] 
                && newClone[this.#currentPosY + additionalY][x].includes("placed") 
                && this.#currentPiece[this.#currentPiece.current][j] !== "  " 
                && this.#currentPiece[this.#currentPiece.current][j] !== "\n") {

                clipped = true;
                break;
            }

            if (this.#gameCounter % moduloCheck === 0
                && newClone[this.#currentPosY + additionalY + 1] 
                && newClone[this.#currentPosY + additionalY + 1][x] 
                && newClone[this.#currentPosY + additionalY + 1][x].includes("placed") 
                && this.#currentPiece[this.#currentPiece.current][j] !== "  " 
                && this.#currentPiece[this.#currentPiece.current][j] !== "\n") {

                placed = true;
                break;
            }

            if (this.#currentPiece[this.#currentPiece.current][j] === "\n") {
                additionalY++;
                x = this.#currentPosX;
            }
            else if (this.#currentPiece[this.#currentPiece.current][j] === "  ") {
                x++;
            }
            else {
                boardClone[this.#currentPosY + additionalY][x] = this.#currentPiece[this.#currentPiece.current][j];
                x++;
            }
        }

        if (placed) return this.place();
        if (clipped) return this.lose();

        this.#board = boardClone;

        if (this.#gameCounter % moduloCheck === 0 && this.#gameCounter !== 0) {
            this.#currentPosY++;
            this.#gameCounter++;
        } else this.#gameCounter++;

        console.clear();
        console.log(`Your current score is: ${this.#score}`);
        console.log(`Current level: ${this.#level} (${this.#clearedRows}/${this.#maxRows})`);
        console.log(this.showBoard(this.#board));
        console.log(this.nextUp());

        return boardClone;
    }

    private genBoard() {
        const board: string[][] = [];
        for (let i = 0; i < 20; i++) {
            let part: string[] = [];
            for (let j = 0; j < 10; j++) part.push("empty");
            board.push(part);
        }
        return board;
    }

    private showBoard(board: string[][]) {
        return board.map(p => p.join("")).join("\n")
            .replaceAll("empty", "⚫")

            .replaceAll("placed1", "🟥")
            .replaceAll("placed2", "🟪")
            .replaceAll("placed3", "🟧")
            .replaceAll("placed4", "🟨")
            .replaceAll("placed5", "🟩")
            .replaceAll("placed6", "🟫")
            .replaceAll("placed", "🟦")

            .replaceAll("current1", "🟥")
            .replaceAll("current2", "🟪")
            .replaceAll("current3", "🟧")
            .replaceAll("current4", "🟨")
            .replaceAll("current5", "🟩")
            .replaceAll("current6", "🟫")
            .replaceAll("current", "🟦");
    }

    private nextUp() {
        return `Next Up:\n${this.#bag[1] ? 
        this.#bag[1][0].join("")
        .replaceAll("current1", "🟥")
        .replaceAll("current2", "🟪")
        .replaceAll("current3", "🟧")
        .replaceAll("current4", "🟨")
        .replaceAll("current5", "🟩")
        .replaceAll("current6", "🟫")
        .replaceAll("current", "🟦") 
        : 
        this.#secondBag[0][0].join("")
        .replaceAll("current1", "🟥")
        .replaceAll("current2", "🟪")
        .replaceAll("current3", "🟧")
        .replaceAll("current4", "🟨")
        .replaceAll("current5", "🟩")
        .replaceAll("current6", "🟫")
        .replaceAll("current", "🟦")}`
    }

    private async place() {

        this.#bag.shift();
        const currentPiece = this.#currentPiece;
        const x = this.#currentPosX;
        const pieceYLength = currentPiece[currentPiece.current].filter(p => p === "\n").length + 1;

        let xPos = x;
        let extraY = 0;
        let boardClone = clone(this.#board);
        let i = 20;
        const draw = () => {
            
            let clipped = false;
            let lost = false;
            for (let j = 0; j < this.#currentPiece[this.#currentPiece.current].length; j++) {

                if ((i - pieceYLength + extraY) < 0) {
                    lost = true;
                    break;
                }

                if (boardClone[i - pieceYLength + extraY][xPos] && boardClone[i - pieceYLength + extraY][xPos].includes("placed") && this.#currentPiece[this.#currentPiece.current][j] !== "  " && this.#currentPiece[this.#currentPiece.current][j] !== "\n") {
                    clipped = true;
                    i--;
                    xPos = x;
                    extraY = 0;
                    boardClone = clone(this.#board);
                        
                    break;
                } 
                
                if (this.checkAbove(clone(this.#board), i - pieceYLength + extraY, xPos, j, this.#currentPosY)) {                    
                    clipped = true;
                    i--;
                    xPos = x;
                    extraY = 0;
                    boardClone = clone(this.#board);
                        
                    break;
                }

                if (this.#currentPiece[this.#currentPiece.current][j] === "\n") {
                    extraY++;
                    xPos = x;
                } else if (this.#currentPiece[this.#currentPiece.current][j] === "  ") {
                    xPos++;
                } else {
                    const numToAdd = this.#currentPiece[this.#currentPiece.current].filter(p => p !== "  " && p !== "\n")[0][7] ? this.#currentPiece[this.#currentPiece.current].filter(p => p !== "  " && p !== "\n")[0][7] : "";
                    boardClone[i - pieceYLength + extraY][xPos] = `placed${numToAdd}`;
                    xPos++;
                }
            }

            if (clipped) return draw();
            else if (lost) return this.lose();
            else this.#board = boardClone;
        } 
        draw();

        this.#currentPosX = 4;
        this.#currentPosY = 0;

        const audio = this.#themePlayer.play("./src/Utils/audio/Place.mp3", (err) => {
            if (err) throw err;
        });

        getDuration("./src/Utils/audio/Place.mp3").then(d => {
            this.sleep(d * 1500).then(() => {
                audio.kill();
            });
        });

        if (this.#bag.length === 0) {
            this.#bag = this.#secondBag;
            this.#secondBag = this.createBag();
            this.#currentPiece = this.#bag[0];
        } else this.#currentPiece = this.#bag[0];
        
        this.#board = this.score();

    }

    private async lose() {

        this.#theme.kill();

        this.#themePlayer.play("./src/Utils/audio/End.mp3");

        clearInterval(<NodeJS.Timeout>this.#interval);

        console.clear();

        const whiteFlash = this.genBoard();
        const redFlash: string[][] = [];

        for (let i = 0; i < 20; i++) {
            redFlash.push("🟥".repeat(10).split(""));
        }

        await this.flash(whiteFlash, redFlash);
        await this.flash(whiteFlash, redFlash);
        await this.flash(whiteFlash, redFlash);
        await this.flash(whiteFlash, redFlash);
        await this.flash(whiteFlash, redFlash);


        console.log(`
        
░██████╗░░█████╗░███╗░░░███╗███████╗  ░█████╗░██╗░░░██╗███████╗██████╗░
██╔════╝░██╔══██╗████╗░████║██╔════╝  ██╔══██╗██║░░░██║██╔════╝██╔══██╗
██║░░██╗░███████║██╔████╔██║█████╗░░  ██║░░██║╚██╗░██╔╝█████╗░░██████╔╝
██║░░╚██╗██╔══██║██║╚██╔╝██║██╔══╝░░  ██║░░██║░╚████╔╝░██╔══╝░░██╔══██╗
╚██████╔╝██║░░██║██║░╚═╝░██║███████╗  ╚█████╔╝░░╚██╔╝░░███████╗██║░░██║
░╚═════╝░╚═╝░░╚═╝╚═╝░░░░░╚═╝╚══════╝  ░╚════╝░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝`);


        const bigFontScore = this.#score.toString();
        console.log(`
        █▄█ █▀█ █░█   █▀ █▀▀ █▀█ █▀█ █▀▀ █▀▄ ${bigFontScore.replaceAll(/\d/g, " ")}  █▀█ █▀█ █ █▄░█ ▀█▀ █▀
        ░█░ █▄█ █▄█   ▄█ █▄▄ █▄█ █▀▄ ██▄ █▄▀ ${bigFontScore}  █▀▀ █▄█ █ █░▀█ ░█░ ▄█`);

        console.log(`
        ┏━┳━┓╋╋╋┏┓╋╋┏┓╋╋╋┏━┳━┓╋╋╋╋┏┳━┳┓┏┓╋╋╋╋╋╋╋╋╋┏━┓
        ┃┃┃┃┣━┓┏┛┣━┓┃┗┳┳┓┃┃┃┃┣━┓┏┳╋┫━┫┗┫┗┳━┳━━┳━┳━┫━╋━┓
        ┃┃┃┃┃╋┗┫╋┃┻┫┃╋┃┃┃┃┃┃┃┃╋┗╋┃┫┣━┃┏┫┃┃┻┫┃┃┃╋┃╋┣━┃┻┫
        ┗┻━┻┻━━┻━┻━┛┗━╋┓┃┗┻━┻┻━━┻┻┻┻━┻━┻┻┻━┻┻┻┻━┻━┻━┻━┛
        ╋╋╋╋╋╋╋╋╋╋╋╋╋╋┗━┛`);


    }

    private async flash(flashOne: string[][], flashTwo: string[][]) {
        console.clear();
        this.#board = flashOne;

        console.log(`Your current score is: ${this.#score}`);
        console.log(`Current level: ${this.#level} (${this.#clearedRows}/${this.#maxRows})`);
        console.log(this.showBoard(this.#board));
        console.log(this.nextUp());

        await this.sleep(500);

        console.clear();
        this.#board = flashTwo;

        console.log(`Your current score is: ${this.#score}`);
        console.log(`Current level: ${this.#level} (${this.#clearedRows}/${this.#maxRows})`);
        console.log(this.showBoard(this.#board));
        console.log(this.nextUp());

        await this.sleep(500);
    }

    private checkAbove(board: string[][], yPos: number, xPos: number, pieceNum: number, currentYPos: number) {
        let placedAbove = false;
        for (let i = yPos; i > 0; i--) {
            if (i - 1 > currentYPos && board[i - 1][xPos] && board[i - 1][xPos].includes("placed") && this.#currentPiece[this.#currentPiece.current][pieceNum] !== "  " && this.#currentPiece[this.#currentPiece.current][pieceNum] !== "\n") {
                placedAbove = true;
                break;
            }
        }
        return placedAbove;
    }

    private rotate(piece: Bag, dirrection: "l" | "r"): Bag {
        const boardClone = clone(this.#board);

        if (dirrection === "r") {
            if (piece.current === 3) piece.current = 0;
            else piece.current++;
        } else if (dirrection === "l") {
            if (piece.current === 0) piece.current = 3;
            else piece.current--;
        }

        if (piece.xLength[piece.current] + this.#currentPosX > this.#board[0].length - 1) {
            const amountToMove = (piece.xLength[piece.current] + this.#currentPosX) - this.#board[0].length;
            this.#currentPosX -= amountToMove;
        }

        let additionalY = 0;
        let x = this.#currentPosX;
        
        let overlap = false;

        for (let j = 0; j < this.#currentPiece[this.#currentPiece.current].length; j++) {

            if (boardClone[this.#currentPosY + additionalY] 
                && boardClone[this.#currentPosY + additionalY][x] 
                && boardClone[this.#currentPosY + additionalY][x].includes("placed") 
                && this.#currentPiece[this.#currentPiece.current][j] !== "  " 
                && this.#currentPiece[this.#currentPiece.current][j] !== "\n") {

                overlap = true;
                break;
            }

            if (this.#currentPiece[this.#currentPiece.current][j] === "\n") {
                additionalY++;
                x = this.#currentPosX;
            } else if (this.#currentPiece[this.#currentPiece.current][j] === "  ") x++;
            else x++;
        }

        if (overlap) {
            if (dirrection === "r") {
                if (piece.current === 0) piece.current = 3; 
                else piece.current--;
            } else if (dirrection === "l") {
                if (piece.current === 3) piece.current = 0;
                else piece.current++;
            }
        } else {
            const audio = this.#themePlayer.play("./src/Utils/audio/Rotate.mp3", (err) => {
                if (err) throw err;
            });
            getDuration("./src/Utils/audio/Rotate.mp3").then(d => {
                this.sleep(d * 1500).then(() => {
                    audio.kill();
                });
            });
        }


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