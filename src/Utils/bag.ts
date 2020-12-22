import { Bag } from "./bag.interface";

export const Tetris: Bag[] = [
    {
        0: ["current", "current", "\n", "current", "\n", "current"],
        1: ["current", "current", "current", "\n", "  ", "  ", "current"],  // J Piece
        2: ["  ", "current", "\n", "  ", "current", "\n", "current", "current"],
        3: ["current", "\n", "current", "current", "current"],
        current: 0,
    },
    {
        0: ["  ", "current1", "\n", "current1", "current1", "\n", "current1"],
        1: ["current1", "current1", "\n", "  ", "current1", "current1"], // Z Piece
        2: ["  ", "current1", "\n", "current1", "current1", "\n", "current1"],
        3: ["current1", "current1", "\n", "  ", "current1", "current1"],
        current: 0,
    },
    {
        0: ["current2", "current2", "\n", "  ", "current2", "\n", "  ", "current2"],
        1: ["  ", "  ", "current2", "\n", "current2", "current2", "current2"], // L piece
        2: ["current2", "\n", "current2", "\n", "current2", "current2"],
        3: ["current2", "current2", "current2", "\n", "current2"],
        current: 0,
    },
    {
        0: ["current3", "\n", "current3", "current3", "\n", "  ", "current3"],
        1: ["  ", "current3", "current3", "\n", "current3", "current3"], // S piece
        2: ["current3", "\n", "current3", "current3", "\n", "  ", "current3"],
        3: ["  ", "current3", "current3", "\n", "current3", "current3"],
        current: 0,
    },
    {
        0: ["current4", "\n", "current4", "\n", "current4", "\n", "current4"],
        1: ["current4", "current4", "current4", "current4"], // I piece
        2: ["current4", "\n", "current4", "\n", "current4", "\n", "current4"],
        3: ["current4", "current4", "current4", "current4"],
        current: 0,
    },
    {
        0: ["current5", "current5", "\n", "current5", "current5"],
        1: ["current5", "current5", "\n", "current5", "current5"], // O piece
        2: ["current5", "current5", "\n", "current5", "current5"],
        3: ["current5", "current5", "\n", "current5", "current5"],
        current: 0,
    },
    {
        0: ["  ", "current6", "  ", "\n", "current6", "current6", "current6"],
        1: ["current6", "\n", "current6", "current6", "\n", "current6"], // T piece
        2: ["current6", "current6", "current6", "\n", "  ", "current6"],
        3: ["  ", "current6", "\n", "current6", "current6", "\n", "  ", "current6"],
        current: 0,
    },
];