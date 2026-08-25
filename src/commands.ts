export interface CommandSpec {
  id: number;
  name: string;
  // Number of the 3 argument slots actually used by this command.
  arity: 0 | 1 | 2 | 3;
  // 0-based index of the argument slot that may hold a bare jump-target label
  // instead of an expression (per the "expression or jump target" parameter
  // type), or undefined if this command takes no such argument.
  jumpTargetArgIndex?: number;
  // 0-based indices of argument slots typed "expression or nil", i.e. the
  // literal token "nil" is accepted there instead of an expression.
  nilableArgIndices?: number[];
}

// Machine Command Id / Assembler Command Name / arity, per aloha-specification_v01.md's
// Command Overview table. `comment` and `define` are Assembler-only: they never
// produce Machine cells (see compiler.ts) but are kept here since they're
// predefined constants like every other command name.
export const COMMANDS: CommandSpec[] = [
  { id: 2, name: 'comment', arity: 1 },
  { id: 5, name: 'define', arity: 2 },
  { id: 10, name: 'import', arity: 0 },
  { id: 11, name: 'importTo', arity: 1 },
  { id: 20, name: 'add', arity: 3 },
  { id: 21, name: 'sub', arity: 3 },
  { id: 30, name: 'clear', arity: 1 },
  { id: 50, name: 'goto', arity: 1, jumpTargetArgIndex: 0 },
  { id: 51, name: 'ifEqGoto', arity: 3, jumpTargetArgIndex: 2, nilableArgIndices: [0, 1] },
  { id: 52, name: 'ifGtGoto', arity: 3, jumpTargetArgIndex: 2, nilableArgIndices: [0, 1] },
  { id: 80, name: 'print', arity: 1 },
  { id: 90, name: 'exit', arity: 0 },
];

export const COMMANDS_BY_NAME = new Map(COMMANDS.map((c) => [c.name, c]));
export const COMMANDS_BY_ID = new Map(COMMANDS.map((c) => [c.id, c]));
