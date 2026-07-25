function padDatePart(value: number, width = 2) {
  return String(value).padStart(width, "0");
}

/**
 * Formats a Date as the browser's local calendar date for an HTML date input.
 * Unlike an ISO slice, this does not roll into tomorrow during an evening in a
 * negative UTC offset (or into yesterday in a positive UTC offset).
 */
export function localDateInputValue(date = new Date()) {
  return [
    padDatePart(date.getFullYear(), 4),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

/** Returns a local date-input value a number of local calendar days away. */
export function localDateInputValueAfter(days: number, from = new Date()) {
  const shifted = new Date(from);
  shifted.setDate(shifted.getDate() + days);
  return localDateInputValue(shifted);
}
