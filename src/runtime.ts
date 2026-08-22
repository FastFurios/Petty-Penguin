import { Memory } from './memory';
import { parseCsv } from './csv';
import { COMMANDS_BY_ID } from './commands';
import { RuntimeErrors } from './errors';
import { evaluateString } from './expression';

export interface RunOptions {
  startCell: number;
  inputLoadCell: number;
  input: number[];
}

export function loadMachineCode(csvText: string): Memory {
  const rows = parseCsv(csvText).filter((cols) => !(cols.length <= 1 && (cols[0] ?? '') === ''));
  const memory = new Memory();
  rows.forEach((cols, index) => {
    const content = (cols[1] ?? '').trim();
    memory.set(index, content === '' ? null : content);
  });
  return memory;
}

export function run(memory: Memory, options: RunOptions, print: (n: number) => void): void {
  let pc = options.startCell;
  let inputCursor = options.inputLoadCell;
  const inputQueue = [...options.input];

  for (;;) {
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

    switch (spec.name) {
      case 'import': {
        if (inputQueue.length === 0) throw RuntimeErrors.inputExhausted();
        const value = inputQueue.shift() as number;
        memory.set(inputCursor, String(value));
        inputCursor += 1;
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
      case 'nil': {
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
        const a = evalArg(0);
        const b = evalArg(1);
        const target = evalArg(2);
        pc = a === b ? target : pc + 4;
        break;
      }
      case 'ifGtGoto': {
        const a = evalArg(0);
        const b = evalArg(1);
        const target = evalArg(2);
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
