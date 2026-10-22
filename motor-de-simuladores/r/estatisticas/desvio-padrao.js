import { sum, mean } from "./soma-e-media.js";

export function sd(v) {
  const m = mean(v);
  return Math.sqrt(sum(v.map((x) => (x - m) ** 2)) / (v.length - 1));
}
