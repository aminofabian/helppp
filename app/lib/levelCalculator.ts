// utils/levelCalculator.ts

const LEVEL_THRESHOLDS = [
  { level: 10, points: 10000 },
  { level: 9, points: 5000 },
  { level: 8, points: 2000 },
  { level: 7, points: 1200 },
  { level: 6, points: 500 },
  { level: 5, points: 120 },
  { level: 4, points: 30 },
  { level: 3, points: 70 },
  { level: 2, points: 12 },
  { level: 1, points: 0 }
];

export function calculateLevel(points: number): number {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (points >= threshold.points) {
      return threshold.level;
    }
  }
  return 1; // Default to level 1 if no threshold is met (shouldn't happen)
}