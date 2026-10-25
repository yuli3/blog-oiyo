/** WHY 2026-10-25: stripping signs/letters silently changes the user's taxable salary. */
export function parseYearEndSalary(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text)) return null;
  const salary = Number(text.replace(/,/g, ""));
  return Number.isSafeInteger(salary) && salary >= 0 ? salary : null;
}
