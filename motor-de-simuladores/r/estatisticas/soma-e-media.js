export function sum(v)  { return v.reduce((a, b) => a + b, 0); }
export function mean(v) { return sum(v) / v.length; }
