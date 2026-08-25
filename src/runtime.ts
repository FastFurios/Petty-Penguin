import { Memory } from './memory';
import { detectDelimiter, parseCsv } from './csv';
import { COMMANDS_BY_ID } from './commands';
import { RuntimeErrors } from './errors';
import { evaluateString, evaluateStringNilable } from './expression';

export interface RunOptions {
  startCell: number;
  inputLoadCell: number;
  input: number[];
}

// Must match compiler.ts's SYMBOL_RE: letters, digits, underscore and hyphen.
const SYMBOL_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;

// Loads the Executable code into Machine memory starting at `startCell`, i.e.
// row i of the Executable code lands in the Machine cell with index
// startCell + i. Jump targets are resolved to that same start-cell-relative
// absolute cell index; all other expressions (including constants baked in
// at compile time) are absolute and are loaded unchanged.
export function loadMachineCode(csvText: string, startCell: number): Memory {
  const rows = parseCsv(csvText, detectDelimiter(csvText)).filter(
    (cols) => !(cols.length <= 1 && (cols[0] ?? '') === ''),
  );

  const jumpTargets = new Map<string, number>();
  rows.forEach((cols, relativeOffset) => {
    const label = (cols[0] ?? '').trim();
    if (label) jumpTargets.set(label, relativeOffset);
  });

  const memory = new Memory();
  rows.forEach((cols, relativeOffset) => {
    const content = (cols[1] ?? '').trim();
    const cellIndex = startCell + relativeOffset;
    if (content === '') {
      memory.set(cellIndex, null);
      return;
    }
    if (SYMBOL_RE.test(content)) {
      const targetOffset = jumpTargets.get(content);
      if (targetOffset === undefined) throw RuntimeErrors.unresolvedJumpTarget(content);
      memory.set(cellIndex, String(startCell + targetOffset));
      return;
    }
    memory.set(cellIndex, content);
  });
  return memory;
}

export function run(memory: Memory, options: RunOptions, print: (n: number) => void): void {
  let pc = options.startCell;
  let inputCursor = options.inputLoadCell;
  const inputQueue = [...options.input];

  for (;;) {
    // Cell 0 is reserved: it always holds the index of the cell currently
    // being executed, readable by the program itself via [0].
    memory.set(0, String(pc));

    const idContent = memory.get(pc);
    if (idContent === null) throw RuntimeErrors.unknownCommand('nil', pc);
    const id = Number(idContent);
    const spec = COMMANDS_BY_ID.get(id);
    if (!spec || spec.name === 'define') throw RuntimeErrors.unknownCommand(idContent, pc);

    const argRaw = [memory.get(pc + 1), memory.get(pc + 2), memory.get(pc + 3)];
    const evalArg = (i: number): number => {
      const raw = argRaw[i];
      if (raw === null) throw RuntimeErrors.cellAccessFailure(`<nil argument ${i + 1} at cell ${pc}>`);
      return evaluateString(raw, memory);
    };
    // For parameters typed "expression or nil" (ifEqGoto/ifGtGoto's operands):
    // an empty argument cell, or an expression that dereferences to an empty
    // cell, yields null instead of throwing.
    const evalArgNilable = (i: number): number | null => {
      const raw = argRaw[i];
      if (raw === null) return null;
      return evaluateStringNilable(raw, memory);
    };

    switch (spec.name) {
      case 'import': {
        const value = inputQueue.length === 0 ? null : String(inputQueue.shift() as number);
        memory.set(inputCursor, value);
        inputCursor += 1;
        pc += 4;
        break;
      }
      case 'importTo': {
        const value = inputQueue.length === 0 ? null : String(inputQueue.shift() as number);
        const target = evalArg(0);
        memory.set(target, value);
        // Deliberately does not touch inputCursor: import's auto-increment
        // cursor and importTo's explicit target are independent, per spec.
        pc += 4;
        break;
      }
      case 'add': {
        const a = evalArg(0);
        const b = evalArg(1);
        const target = evalArg(2);
        memory.set(target, String(a + b));
        pc += 4;
        break;
      }
      case 'sub': {
        const a = evalArg(0);
        const b = evalArg(1);
        const target = evalArg(2);
        const result = b - a; // "subtract a from b"
        if (result < 0) throw RuntimeErrors.negativeNumber(result, pc);
        memory.set(target, String(result));
        pc += 4;
        break;
      }
      case 'clear': {
        const target = evalArg(0);
        memory.set(target, null);
        pc += 4;
        break;
      }
      case 'goto': {
        pc = evalArg(0);
        break;
      }
      case 'ifEqGoto': {
        const a = evalArgNilable(0);
        const b = evalArgNilable(1);
        const target = evalArg(2);
        pc = a === b ? target : pc + 4;
        break;
      }
      case 'ifGtGoto': {
        const a = evalArgNilable(0);
        const b = evalArgNilable(1);
        const target = evalArg(2);
        if (a === null || b === null) throw RuntimeErrors.comparisonWithNil(pc);
        pc = a > b ? target : pc + 4;
        break;
      }
      case 'print': {
        print(evalArg(0));
        pc += 4;
        break;
      }
      case 'exit':
        return;
      default:
        throw RuntimeErrors.unknownCommand(idContent, pc);
    }
  }
}
