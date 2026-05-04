export function getHesitationBadgeClass(score) {
  if (score < 0.40) return 'bg-hesitation-low text-hesitation-low-text';
  if (score < 0.65) return 'bg-hesitation-med text-hesitation-med-text';
  return 'bg-hesitation-high text-hesitation-high-text';
}
