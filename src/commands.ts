export interface CommandSpec {
  id: number;
  name: string;
  // Number of the 3 argument slots actually used by this command.
  arity: 0 | 1 | 2 | 3;
}

// Machine Command Id / Assembler Command Name / arity, per aloha-specification_v01.md's
// Command Overview table. `define` is compile-time only (see compiler.ts) but is kept
// here since it's a predefined constant like every other command name.
export const COMMANDS: CommandSpec[] = [
  { id: 5, name: 'define', arity: 2 },
  { id: 10, name: 'import', arity: 0 },
  { id: 20, name: 'add', arity: 3 },
  { id: 21, name: 'sub', arity: 3 },
  { id: 30, name: 'nil', arity: 1 },
  { id: 50, name: 'goto', arity: 1 },
  { id: 51, name: 'ifEqGoto', arity: 3 },
  { id: 52, name: 'ifGtGoto', arity: 3 },
  { id: 80, name: 'print', arity: 1 },
  { id: 90, name: 'exit', arity: 0 },
];

export const COMMANDS_BY_NAME = new Map(COMMANDS.map((c) => [c.name, c]));
export const COMMANDS_BY_ID = new Map(COMMANDS.map((c) => [c.id, c]));
