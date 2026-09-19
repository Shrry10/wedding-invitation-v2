/**
 * Where an arriving object is thrown in from.
 *
 * Shared by every page that stages its arrival, so the invitation and the story
 * throw their objects by one rule rather than two that drift apart: an object
 * left of centre arrives from the left and an object right of centre from the
 * right, thrown further the further off centre it sits, so a page assembles
 * itself the way the objects would have been laid down.
 *
 * Returned as a CSS length for `--from-x`, which is the only thing any caller
 * does with it.
 */
export function arrivalThrow(centrePercent: number): string {
  const distance = 3 + Math.abs(centrePercent - 50) * 0.16
  return `${(centrePercent < 50 ? -distance : distance).toFixed(2)}rem`
}
