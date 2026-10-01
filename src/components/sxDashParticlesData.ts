// Exact Servex SX Logo Dots sampled directly from assets/servex_logo.png
export interface SxDotParticle {
  id: number;
  col: number;
  row: number;
  normX: number; // -0.5 to 0.5 relative to SX width
  normY: number; // -0.5 to 0.5 relative to SX height
  phase: number; // Wave phase offset for harmonic ripple
}

export const SX_DOT_PARTICLES: SxDotParticle[] = [
  {
    "id": 0,
    "col": 9,
    "row": 0,
    "normX": -0.1087,
    "normY": -0.5,
    "phase": 2.42
  },
  {
    "id": 1,
    "col": 10,
    "row": 0,
    "normX": -0.0652,
    "normY": -0.5,
    "phase": 2
  },
  {
    "id": 2,
    "col": 5,
    "row": 1,
    "normX": -0.2826,
    "normY": -0.4375,
    "phase": 2.88
  },
  {
    "id": 3,
    "col": 6,
    "row": 1,
    "normX": -0.2391,
    "normY": -0.4375,
    "phase": 1.7
  },
  {
    "id": 4,
    "col": 7,
    "row": 1,
    "normX": -0.1957,
    "normY": -0.4375,
    "phase": 0.39
  },
  {
    "id": 5,
    "col": 8,
    "row": 1,
    "normX": -0.1522,
    "normY": -0.4375,
    "phase": 1.39
  },
  {
    "id": 6,
    "col": 9,
    "row": 1,
    "normX": -0.1087,
    "normY": -0.4375,
    "phase": 0.6
  },
  {
    "id": 7,
    "col": 10,
    "row": 1,
    "normX": -0.0652,
    "normY": -0.4375,
    "phase": -2.8
  },
  {
    "id": 8,
    "col": 11,
    "row": 1,
    "normX": -0.0217,
    "normY": -0.4375,
    "phase": 1.28
  },
  {
    "id": 9,
    "col": 3,
    "row": 2,
    "normX": -0.3696,
    "normY": -0.375,
    "phase": 1.76
  },
  {
    "id": 10,
    "col": 4,
    "row": 2,
    "normX": -0.3261,
    "normY": -0.375,
    "phase": 1.32
  },
  {
    "id": 11,
    "col": 5,
    "row": 2,
    "normX": -0.2826,
    "normY": -0.375,
    "phase": -1.12
  },
  {
    "id": 12,
    "col": 6,
    "row": 2,
    "normX": -0.2391,
    "normY": -0.375,
    "phase": 1.52
  },
  {
    "id": 13,
    "col": 7,
    "row": 2,
    "normX": -0.1957,
    "normY": -0.375,
    "phase": 2.81
  },
  {
    "id": 14,
    "col": 8,
    "row": 2,
    "normX": -0.1522,
    "normY": -0.375,
    "phase": 3.1
  },
  {
    "id": 15,
    "col": 9,
    "row": 2,
    "normX": -0.1087,
    "normY": -0.375,
    "phase": 2.47
  },
  {
    "id": 16,
    "col": 10,
    "row": 2,
    "normX": -0.0652,
    "normY": -0.375,
    "phase": -1.99
  },
  {
    "id": 17,
    "col": 11,
    "row": 2,
    "normX": -0.0217,
    "normY": -0.375,
    "phase": -2.29
  },
  {
    "id": 18,
    "col": 12,
    "row": 2,
    "normX": 0.0217,
    "normY": -0.375,
    "phase": 0.97
  },
  {
    "id": 19,
    "col": 3,
    "row": 3,
    "normX": -0.3696,
    "normY": -0.3125,
    "phase": 2.09
  },
  {
    "id": 20,
    "col": 4,
    "row": 3,
    "normX": -0.3261,
    "normY": -0.3125,
    "phase": -2.12
  },
  {
    "id": 21,
    "col": 5,
    "row": 3,
    "normX": -0.2826,
    "normY": -0.3125,
    "phase": -0.37
  },
  {
    "id": 22,
    "col": 6,
    "row": 3,
    "normX": -0.2391,
    "normY": -0.3125,
    "phase": -1.18
  },
  {
    "id": 23,
    "col": 7,
    "row": 3,
    "normX": -0.1957,
    "normY": -0.3125,
    "phase": -0.03
  },
  {
    "id": 24,
    "col": 8,
    "row": 3,
    "normX": -0.1522,
    "normY": -0.3125,
    "phase": 1.07
  },
  {
    "id": 25,
    "col": 9,
    "row": 3,
    "normX": -0.1087,
    "normY": -0.3125,
    "phase": -2.89
  },
  {
    "id": 26,
    "col": 10,
    "row": 3,
    "normX": -0.0652,
    "normY": -0.3125,
    "phase": 0.29
  },
  {
    "id": 27,
    "col": 11,
    "row": 3,
    "normX": -0.0217,
    "normY": -0.3125,
    "phase": 1.62
  },
  {
    "id": 28,
    "col": 12,
    "row": 3,
    "normX": 0.0217,
    "normY": -0.3125,
    "phase": -0.42
  },
  {
    "id": 29,
    "col": 13,
    "row": 3,
    "normX": 0.0652,
    "normY": -0.3125,
    "phase": 1.47
  },
  {
    "id": 30,
    "col": 19,
    "row": 3,
    "normX": 0.3261,
    "normY": -0.3125,
    "phase": -2.38
  },
  {
    "id": 31,
    "col": 20,
    "row": 3,
    "normX": 0.3696,
    "normY": -0.3125,
    "phase": 2.55
  },
  {
    "id": 32,
    "col": 21,
    "row": 3,
    "normX": 0.413,
    "normY": -0.3125,
    "phase": -0.16
  },
  {
    "id": 33,
    "col": 22,
    "row": 3,
    "normX": 0.4565,
    "normY": -0.3125,
    "phase": -2.03
  },
  {
    "id": 34,
    "col": 3,
    "row": 4,
    "normX": -0.3696,
    "normY": -0.25,
    "phase": 2.37
  },
  {
    "id": 35,
    "col": 4,
    "row": 4,
    "normX": -0.3261,
    "normY": -0.25,
    "phase": -1.97
  },
  {
    "id": 36,
    "col": 5,
    "row": 4,
    "normX": -0.2826,
    "normY": -0.25,
    "phase": -1
  },
  {
    "id": 37,
    "col": 18,
    "row": 4,
    "normX": 0.2826,
    "normY": -0.25,
    "phase": 1.65
  },
  {
    "id": 38,
    "col": 19,
    "row": 4,
    "normX": 0.3261,
    "normY": -0.25,
    "phase": -1.36
  },
  {
    "id": 39,
    "col": 20,
    "row": 4,
    "normX": 0.3696,
    "normY": -0.25,
    "phase": -2.95
  },
  {
    "id": 40,
    "col": 21,
    "row": 4,
    "normX": 0.413,
    "normY": -0.25,
    "phase": 3.01
  },
  {
    "id": 41,
    "col": 3,
    "row": 5,
    "normX": -0.3696,
    "normY": -0.1875,
    "phase": -1.98
  },
  {
    "id": 42,
    "col": 4,
    "row": 5,
    "normX": -0.3261,
    "normY": -0.1875,
    "phase": 1.02
  },
  {
    "id": 43,
    "col": 5,
    "row": 5,
    "normX": -0.2826,
    "normY": -0.1875,
    "phase": 2.79
  },
  {
    "id": 44,
    "col": 9,
    "row": 5,
    "normX": -0.1087,
    "normY": -0.1875,
    "phase": -1.22
  },
  {
    "id": 45,
    "col": 10,
    "row": 5,
    "normX": -0.0652,
    "normY": -0.1875,
    "phase": 0.96
  },
  {
    "id": 46,
    "col": 11,
    "row": 5,
    "normX": -0.0217,
    "normY": -0.1875,
    "phase": -2.69
  },
  {
    "id": 47,
    "col": 12,
    "row": 5,
    "normX": 0.0217,
    "normY": -0.1875,
    "phase": -2.74
  },
  {
    "id": 48,
    "col": 17,
    "row": 5,
    "normX": 0.2391,
    "normY": -0.1875,
    "phase": -0.51
  },
  {
    "id": 49,
    "col": 18,
    "row": 5,
    "normX": 0.2826,
    "normY": -0.1875,
    "phase": 1.77
  },
  {
    "id": 50,
    "col": 19,
    "row": 5,
    "normX": 0.3261,
    "normY": -0.1875,
    "phase": 2.35
  },
  {
    "id": 51,
    "col": 20,
    "row": 5,
    "normX": 0.3696,
    "normY": -0.1875,
    "phase": -0.78
  },
  {
    "id": 52,
    "col": 3,
    "row": 6,
    "normX": -0.3696,
    "normY": -0.125,
    "phase": -0.07
  },
  {
    "id": 53,
    "col": 4,
    "row": 6,
    "normX": -0.3261,
    "normY": -0.125,
    "phase": -2.17
  },
  {
    "id": 54,
    "col": 5,
    "row": 6,
    "normX": -0.2826,
    "normY": -0.125,
    "phase": 2.78
  },
  {
    "id": 55,
    "col": 6,
    "row": 6,
    "normX": -0.2391,
    "normY": -0.125,
    "phase": 0.7
  },
  {
    "id": 56,
    "col": 7,
    "row": 6,
    "normX": -0.1957,
    "normY": -0.125,
    "phase": -1.12
  },
  {
    "id": 57,
    "col": 10,
    "row": 6,
    "normX": -0.0652,
    "normY": -0.125,
    "phase": 0.22
  },
  {
    "id": 58,
    "col": 11,
    "row": 6,
    "normX": -0.0217,
    "normY": -0.125,
    "phase": 0.4
  },
  {
    "id": 59,
    "col": 12,
    "row": 6,
    "normX": 0.0217,
    "normY": -0.125,
    "phase": 1.84
  },
  {
    "id": 60,
    "col": 13,
    "row": 6,
    "normX": 0.0652,
    "normY": -0.125,
    "phase": 0.44
  },
  {
    "id": 61,
    "col": 16,
    "row": 6,
    "normX": 0.1957,
    "normY": -0.125,
    "phase": 1.66
  },
  {
    "id": 62,
    "col": 17,
    "row": 6,
    "normX": 0.2391,
    "normY": -0.125,
    "phase": 3.03
  },
  {
    "id": 63,
    "col": 18,
    "row": 6,
    "normX": 0.2826,
    "normY": -0.125,
    "phase": -0.23
  },
  {
    "id": 64,
    "col": 19,
    "row": 6,
    "normX": 0.3261,
    "normY": -0.125,
    "phase": 0.81
  },
  {
    "id": 65,
    "col": 3,
    "row": 7,
    "normX": -0.3696,
    "normY": -0.0625,
    "phase": -1.2
  },
  {
    "id": 66,
    "col": 4,
    "row": 7,
    "normX": -0.3261,
    "normY": -0.0625,
    "phase": 0.83
  },
  {
    "id": 67,
    "col": 5,
    "row": 7,
    "normX": -0.2826,
    "normY": -0.0625,
    "phase": 0.47
  },
  {
    "id": 68,
    "col": 6,
    "row": 7,
    "normX": -0.2391,
    "normY": -0.0625,
    "phase": -1.95
  },
  {
    "id": 69,
    "col": 7,
    "row": 7,
    "normX": -0.1957,
    "normY": -0.0625,
    "phase": -0.05
  },
  {
    "id": 70,
    "col": 8,
    "row": 7,
    "normX": -0.1522,
    "normY": -0.0625,
    "phase": -3.03
  },
  {
    "id": 71,
    "col": 9,
    "row": 7,
    "normX": -0.1087,
    "normY": -0.0625,
    "phase": -2.89
  },
  {
    "id": 72,
    "col": 10,
    "row": 7,
    "normX": -0.0652,
    "normY": -0.0625,
    "phase": -0.24
  },
  {
    "id": 73,
    "col": 11,
    "row": 7,
    "normX": -0.0217,
    "normY": -0.0625,
    "phase": -0.78
  },
  {
    "id": 74,
    "col": 12,
    "row": 7,
    "normX": 0.0217,
    "normY": -0.0625,
    "phase": -1.41
  },
  {
    "id": 75,
    "col": 13,
    "row": 7,
    "normX": 0.0652,
    "normY": -0.0625,
    "phase": 2.87
  },
  {
    "id": 76,
    "col": 14,
    "row": 7,
    "normX": 0.1087,
    "normY": -0.0625,
    "phase": -2.74
  },
  {
    "id": 77,
    "col": 15,
    "row": 7,
    "normX": 0.1522,
    "normY": -0.0625,
    "phase": -1.16
  },
  {
    "id": 78,
    "col": 16,
    "row": 7,
    "normX": 0.1957,
    "normY": -0.0625,
    "phase": -0.66
  },
  {
    "id": 79,
    "col": 17,
    "row": 7,
    "normX": 0.2391,
    "normY": -0.0625,
    "phase": 0
  },
  {
    "id": 80,
    "col": 18,
    "row": 7,
    "normX": 0.2826,
    "normY": -0.0625,
    "phase": 0.47
  },
  {
    "id": 81,
    "col": 4,
    "row": 8,
    "normX": -0.3261,
    "normY": 0,
    "phase": -1.95
  },
  {
    "id": 82,
    "col": 5,
    "row": 8,
    "normX": -0.2826,
    "normY": 0,
    "phase": -2.51
  },
  {
    "id": 83,
    "col": 6,
    "row": 8,
    "normX": -0.2391,
    "normY": 0,
    "phase": -0.18
  },
  {
    "id": 84,
    "col": 7,
    "row": 8,
    "normX": -0.1957,
    "normY": 0,
    "phase": 1.65
  },
  {
    "id": 85,
    "col": 8,
    "row": 8,
    "normX": -0.1522,
    "normY": 0,
    "phase": -1.36
  },
  {
    "id": 86,
    "col": 9,
    "row": 8,
    "normX": -0.1087,
    "normY": 0,
    "phase": -0.49
  },
  {
    "id": 87,
    "col": 10,
    "row": 8,
    "normX": -0.0652,
    "normY": 0,
    "phase": 0.16
  },
  {
    "id": 88,
    "col": 11,
    "row": 8,
    "normX": -0.0217,
    "normY": 0,
    "phase": -0.23
  },
  {
    "id": 89,
    "col": 12,
    "row": 8,
    "normX": 0.0217,
    "normY": 0,
    "phase": 2.14
  },
  {
    "id": 90,
    "col": 14,
    "row": 8,
    "normX": 0.1087,
    "normY": 0,
    "phase": 2.5
  },
  {
    "id": 91,
    "col": 15,
    "row": 8,
    "normX": 0.1522,
    "normY": 0,
    "phase": -2.79
  },
  {
    "id": 92,
    "col": 16,
    "row": 8,
    "normX": 0.1957,
    "normY": 0,
    "phase": -2.22
  },
  {
    "id": 93,
    "col": 17,
    "row": 8,
    "normX": 0.2391,
    "normY": 0,
    "phase": -1.28
  },
  {
    "id": 94,
    "col": 6,
    "row": 9,
    "normX": -0.2391,
    "normY": 0.0625,
    "phase": -0.12
  },
  {
    "id": 95,
    "col": 7,
    "row": 9,
    "normX": -0.1957,
    "normY": 0.0625,
    "phase": 1.61
  },
  {
    "id": 96,
    "col": 8,
    "row": 9,
    "normX": -0.1522,
    "normY": 0.0625,
    "phase": -2.29
  },
  {
    "id": 97,
    "col": 9,
    "row": 9,
    "normX": -0.1087,
    "normY": 0.0625,
    "phase": -2.17
  },
  {
    "id": 98,
    "col": 10,
    "row": 9,
    "normX": -0.0652,
    "normY": 0.0625,
    "phase": -2.61
  },
  {
    "id": 99,
    "col": 11,
    "row": 9,
    "normX": -0.0217,
    "normY": 0.0625,
    "phase": 2.1
  },
  {
    "id": 100,
    "col": 12,
    "row": 9,
    "normX": 0.0217,
    "normY": 0.0625,
    "phase": -0.06
  },
  {
    "id": 101,
    "col": 13,
    "row": 9,
    "normX": 0.0652,
    "normY": 0.0625,
    "phase": 0.32
  },
  {
    "id": 102,
    "col": 15,
    "row": 9,
    "normX": 0.1522,
    "normY": 0.0625,
    "phase": 1.94
  },
  {
    "id": 103,
    "col": 16,
    "row": 9,
    "normX": 0.1957,
    "normY": 0.0625,
    "phase": 2.57
  },
  {
    "id": 104,
    "col": 9,
    "row": 10,
    "normX": -0.1087,
    "normY": 0.125,
    "phase": 0.44
  },
  {
    "id": 105,
    "col": 10,
    "row": 10,
    "normX": -0.0652,
    "normY": 0.125,
    "phase": -0.16
  },
  {
    "id": 106,
    "col": 11,
    "row": 10,
    "normX": -0.0217,
    "normY": 0.125,
    "phase": 2.04
  },
  {
    "id": 107,
    "col": 12,
    "row": 10,
    "normX": 0.0217,
    "normY": 0.125,
    "phase": 0.37
  },
  {
    "id": 108,
    "col": 13,
    "row": 10,
    "normX": 0.0652,
    "normY": 0.125,
    "phase": -1.57
  },
  {
    "id": 109,
    "col": 14,
    "row": 10,
    "normX": 0.1087,
    "normY": 0.125,
    "phase": 0.97
  },
  {
    "id": 110,
    "col": 15,
    "row": 10,
    "normX": 0.1522,
    "normY": 0.125,
    "phase": 2.73
  },
  {
    "id": 111,
    "col": 16,
    "row": 10,
    "normX": 0.1957,
    "normY": 0.125,
    "phase": 0.32
  },
  {
    "id": 112,
    "col": 17,
    "row": 10,
    "normX": 0.2391,
    "normY": 0.125,
    "phase": 1.98
  },
  {
    "id": 113,
    "col": 11,
    "row": 11,
    "normX": -0.0217,
    "normY": 0.1875,
    "phase": -2.43
  },
  {
    "id": 114,
    "col": 12,
    "row": 11,
    "normX": 0.0217,
    "normY": 0.1875,
    "phase": 1.84
  },
  {
    "id": 115,
    "col": 13,
    "row": 11,
    "normX": 0.0652,
    "normY": 0.1875,
    "phase": 1.41
  },
  {
    "id": 116,
    "col": 14,
    "row": 11,
    "normX": 0.1087,
    "normY": 0.1875,
    "phase": 0.07
  },
  {
    "id": 117,
    "col": 15,
    "row": 11,
    "normX": 0.1522,
    "normY": 0.1875,
    "phase": -0.66
  },
  {
    "id": 118,
    "col": 16,
    "row": 11,
    "normX": 0.1957,
    "normY": 0.1875,
    "phase": 1.87
  },
  {
    "id": 119,
    "col": 17,
    "row": 11,
    "normX": 0.2391,
    "normY": 0.1875,
    "phase": 0.3
  },
  {
    "id": 120,
    "col": 18,
    "row": 11,
    "normX": 0.2826,
    "normY": 0.1875,
    "phase": 1.71
  },
  {
    "id": 121,
    "col": 11,
    "row": 12,
    "normX": -0.0217,
    "normY": 0.25,
    "phase": -0.31
  },
  {
    "id": 122,
    "col": 12,
    "row": 12,
    "normX": 0.0217,
    "normY": 0.25,
    "phase": 0.85
  },
  {
    "id": 123,
    "col": 13,
    "row": 12,
    "normX": 0.0652,
    "normY": 0.25,
    "phase": -1
  },
  {
    "id": 124,
    "col": 14,
    "row": 12,
    "normX": 0.1087,
    "normY": 0.25,
    "phase": -2.5
  },
  {
    "id": 125,
    "col": 16,
    "row": 12,
    "normX": 0.1957,
    "normY": 0.25,
    "phase": -1.92
  },
  {
    "id": 126,
    "col": 17,
    "row": 12,
    "normX": 0.2391,
    "normY": 0.25,
    "phase": 0.12
  },
  {
    "id": 127,
    "col": 18,
    "row": 12,
    "normX": 0.2826,
    "normY": 0.25,
    "phase": -2.08
  },
  {
    "id": 128,
    "col": 19,
    "row": 12,
    "normX": 0.3261,
    "normY": 0.25,
    "phase": 0.87
  },
  {
    "id": 129,
    "col": 10,
    "row": 13,
    "normX": -0.0652,
    "normY": 0.3125,
    "phase": 1.4
  },
  {
    "id": 130,
    "col": 11,
    "row": 13,
    "normX": -0.0217,
    "normY": 0.3125,
    "phase": -2.73
  },
  {
    "id": 131,
    "col": 12,
    "row": 13,
    "normX": 0.0217,
    "normY": 0.3125,
    "phase": -0.71
  },
  {
    "id": 132,
    "col": 13,
    "row": 13,
    "normX": 0.0652,
    "normY": 0.3125,
    "phase": -0.83
  },
  {
    "id": 133,
    "col": 14,
    "row": 13,
    "normX": 0.1087,
    "normY": 0.3125,
    "phase": -1.82
  },
  {
    "id": 134,
    "col": 16,
    "row": 13,
    "normX": 0.1957,
    "normY": 0.3125,
    "phase": 2.23
  },
  {
    "id": 135,
    "col": 17,
    "row": 13,
    "normX": 0.2391,
    "normY": 0.3125,
    "phase": 2.34
  },
  {
    "id": 136,
    "col": 18,
    "row": 13,
    "normX": 0.2826,
    "normY": 0.3125,
    "phase": -3.02
  },
  {
    "id": 137,
    "col": 19,
    "row": 13,
    "normX": 0.3261,
    "normY": 0.3125,
    "phase": -0.25
  },
  {
    "id": 138,
    "col": 20,
    "row": 13,
    "normX": 0.3696,
    "normY": 0.3125,
    "phase": 0.96
  },
  {
    "id": 139,
    "col": 3,
    "row": 14,
    "normX": -0.3696,
    "normY": 0.375,
    "phase": 2.57
  },
  {
    "id": 140,
    "col": 4,
    "row": 14,
    "normX": -0.3261,
    "normY": 0.375,
    "phase": 0.74
  },
  {
    "id": 141,
    "col": 5,
    "row": 14,
    "normX": -0.2826,
    "normY": 0.375,
    "phase": -2.36
  },
  {
    "id": 142,
    "col": 6,
    "row": 14,
    "normX": -0.2391,
    "normY": 0.375,
    "phase": -1.27
  },
  {
    "id": 143,
    "col": 7,
    "row": 14,
    "normX": -0.1957,
    "normY": 0.375,
    "phase": 1.54
  },
  {
    "id": 144,
    "col": 8,
    "row": 14,
    "normX": -0.1522,
    "normY": 0.375,
    "phase": 1.29
  },
  {
    "id": 145,
    "col": 9,
    "row": 14,
    "normX": -0.1087,
    "normY": 0.375,
    "phase": 0.63
  },
  {
    "id": 146,
    "col": 10,
    "row": 14,
    "normX": -0.0652,
    "normY": 0.375,
    "phase": -1.51
  },
  {
    "id": 147,
    "col": 11,
    "row": 14,
    "normX": -0.0217,
    "normY": 0.375,
    "phase": 1.96
  },
  {
    "id": 148,
    "col": 12,
    "row": 14,
    "normX": 0.0217,
    "normY": 0.375,
    "phase": -1.68
  },
  {
    "id": 149,
    "col": 13,
    "row": 14,
    "normX": 0.0652,
    "normY": 0.375,
    "phase": 0.49
  },
  {
    "id": 150,
    "col": 17,
    "row": 14,
    "normX": 0.2391,
    "normY": 0.375,
    "phase": 2.26
  },
  {
    "id": 151,
    "col": 18,
    "row": 14,
    "normX": 0.2826,
    "normY": 0.375,
    "phase": 0.71
  },
  {
    "id": 152,
    "col": 19,
    "row": 14,
    "normX": 0.3261,
    "normY": 0.375,
    "phase": -2.42
  },
  {
    "id": 153,
    "col": 20,
    "row": 14,
    "normX": 0.3696,
    "normY": 0.375,
    "phase": -1.47
  },
  {
    "id": 154,
    "col": 21,
    "row": 14,
    "normX": 0.413,
    "normY": 0.375,
    "phase": -2.14
  },
  {
    "id": 155,
    "col": 1,
    "row": 15,
    "normX": -0.4565,
    "normY": 0.4375,
    "phase": -1.33
  },
  {
    "id": 156,
    "col": 2,
    "row": 15,
    "normX": -0.413,
    "normY": 0.4375,
    "phase": -0.32
  },
  {
    "id": 157,
    "col": 3,
    "row": 15,
    "normX": -0.3696,
    "normY": 0.4375,
    "phase": -1.35
  },
  {
    "id": 158,
    "col": 4,
    "row": 15,
    "normX": -0.3261,
    "normY": 0.4375,
    "phase": 0.1
  },
  {
    "id": 159,
    "col": 5,
    "row": 15,
    "normX": -0.2826,
    "normY": 0.4375,
    "phase": 2.04
  },
  {
    "id": 160,
    "col": 6,
    "row": 15,
    "normX": -0.2391,
    "normY": 0.4375,
    "phase": -0.57
  },
  {
    "id": 161,
    "col": 7,
    "row": 15,
    "normX": -0.1957,
    "normY": 0.4375,
    "phase": -1.8
  },
  {
    "id": 162,
    "col": 8,
    "row": 15,
    "normX": -0.1522,
    "normY": 0.4375,
    "phase": 1.93
  },
  {
    "id": 163,
    "col": 9,
    "row": 15,
    "normX": -0.1087,
    "normY": 0.4375,
    "phase": 2.81
  },
  {
    "id": 164,
    "col": 10,
    "row": 15,
    "normX": -0.0652,
    "normY": 0.4375,
    "phase": 1.87
  },
  {
    "id": 165,
    "col": 11,
    "row": 15,
    "normX": -0.0217,
    "normY": 0.4375,
    "phase": 1.99
  },
  {
    "id": 166,
    "col": 12,
    "row": 15,
    "normX": 0.0217,
    "normY": 0.4375,
    "phase": -1.15
  },
  {
    "id": 167,
    "col": 18,
    "row": 15,
    "normX": 0.2826,
    "normY": 0.4375,
    "phase": 1.16
  },
  {
    "id": 168,
    "col": 19,
    "row": 15,
    "normX": 0.3261,
    "normY": 0.4375,
    "phase": -1.46
  },
  {
    "id": 169,
    "col": 20,
    "row": 15,
    "normX": 0.3696,
    "normY": 0.4375,
    "phase": 2.73
  },
  {
    "id": 170,
    "col": 21,
    "row": 15,
    "normX": 0.413,
    "normY": 0.4375,
    "phase": -1.31
  },
  {
    "id": 171,
    "col": 22,
    "row": 15,
    "normX": 0.4565,
    "normY": 0.4375,
    "phase": 0.49
  },
  {
    "id": 172,
    "col": 1,
    "row": 16,
    "normX": -0.4565,
    "normY": 0.5,
    "phase": -1.79
  },
  {
    "id": 173,
    "col": 2,
    "row": 16,
    "normX": -0.413,
    "normY": 0.5,
    "phase": -2.92
  },
  {
    "id": 174,
    "col": 3,
    "row": 16,
    "normX": -0.3696,
    "normY": 0.5,
    "phase": -2.12
  },
  {
    "id": 175,
    "col": 4,
    "row": 16,
    "normX": -0.3261,
    "normY": 0.5,
    "phase": 0.49
  },
  {
    "id": 176,
    "col": 5,
    "row": 16,
    "normX": -0.2826,
    "normY": 0.5,
    "phase": -1.06
  },
  {
    "id": 177,
    "col": 6,
    "row": 16,
    "normX": -0.2391,
    "normY": 0.5,
    "phase": -0.38
  },
  {
    "id": 178,
    "col": 7,
    "row": 16,
    "normX": -0.1957,
    "normY": 0.5,
    "phase": -0.39
  },
  {
    "id": 179,
    "col": 8,
    "row": 16,
    "normX": -0.1522,
    "normY": 0.5,
    "phase": 0.62
  },
  {
    "id": 180,
    "col": 9,
    "row": 16,
    "normX": -0.1087,
    "normY": 0.5,
    "phase": 2.05
  },
  {
    "id": 181,
    "col": 10,
    "row": 16,
    "normX": -0.0652,
    "normY": 0.5,
    "phase": -1.81
  }
];

// Alias for backwards compatibility
export const SX_DASH_PARTICLES = SX_DOT_PARTICLES;
export type DashParticle = SxDotParticle;
