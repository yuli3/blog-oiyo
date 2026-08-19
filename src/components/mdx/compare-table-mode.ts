export type CompareObjectRow = {
  label: string;
  left: string;
  right: string;
};

export function isGridCompareTable(
  headers: string[] | undefined,
  rows: CompareObjectRow[] | string[][] | undefined,
): rows is string[][] {
  return (
    Array.isArray(headers) &&
    headers.length > 0 &&
    Array.isArray(rows) &&
    (rows.length === 0 || Array.isArray(rows[0]))
  );
}
