// A cell's content is either nil (represented as null) or an unevaluated
// expression string, e.g. "42" or "[13]".
export type CellContent = string | null;

export class Memory {
  private cells = new Map<number, CellContent>();

  get(index: number): CellContent {
    return this.cells.get(index) ?? null;
  }

  set(index: number, value: CellContent): void {
    this.cells.set(index, value);
  }

  // All non-nil cells, ascending by index. Used for dump files.
  entries(): Array<[number, string]> {
    return [...this.cells.entries()]
      .filter((e): e is [number, string] => e[1] !== null)
      .sort((a, b) => a[0] - b[0]);
  }
}
