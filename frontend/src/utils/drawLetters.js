export const DRAW_LETTERS = [
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)), // a-z
];

export const letterToNumber = (letter) => {
  const index = DRAW_LETTERS.indexOf(letter);
  return index >= 0 ? index + 1 : null;
};

export const numberToLetter = (value) => {
  if (typeof value === "string" && DRAW_LETTERS.includes(value)) return value;
  const n = Number(value);
  if (Number.isInteger(n) && n >= 1 && n <= DRAW_LETTERS.length) {
    return DRAW_LETTERS[n - 1];
  }
  return String(value);
};

export const toLetters = (values) =>
  Array.isArray(values) ? values.map((v) => numberToLetter(v)) : [];
