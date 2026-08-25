import { detectDelimiter, parseCsv, stringifyCsv } from './csv';
import { COMMANDS_BY_NAME } from './commands';
import { CompileErrors } from './errors';
import { parseExpression } from './expression';

interface AsmRow {
  lineNumber: number;
  jumpTarget: string;
  command: string;
  args: string[]; // always length 3
}

export interface CompileResult {
  machineCsv: string;
  constants: Array<{ name: string; value: string }>;
}

// Symbols allow letters, digits, underscore and hyphen (e.g. loop-begin).
const SYMBOL_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const IDENTIFIER_RE = /[A-Za-z_][A-Za-z0-9_-]*/g;

function isSymbol(s: string): boolean {
  return SYMBOL_RE.test(s);
}

function parseAsmRows(csvText: string): AsmRow[] {
  const rawRows = parseCsv(csvText, detectDelimiter(csvText));
  const rows: AsmRow[] = [];
  rawRows.forEach((cols, i) => {
    const lineNumber = i + 1;
    if (cols.every((c) => c.trim() === '')) return; // blank formatting row
    const [jumpTarget = '', command = '', a1 = '', a2 = '', a3 = ''] = cols;
    rows.push({
      lineNumber,
      jumpTarget: jumpTarget.trim(),
      command: command.trim(),
      args: [a1.trim(), a2.trim(), a3.trim()],
    });
  });
  return rows;
}

export function compile(asmCsvText: string): CompileResult {
  const asmRows = parseAsmRows(asmCsvText);

  // Pass 1: constants table (predefined command names + explicit `define` rows).
  const constants = new Map<string, string>();
  for (const [name, spec] of COMMANDS_BY_NAME) {
    constants.set(name, String(spec.id));
  }
  for (const row of asmRows) {
    if (row.command !== 'define') continue;
    if (row.jumpTarget !== '') {
      throw CompileErrors.badSyntax(row.lineNumber, 'a "define" row cannot have a jump target');
    }
    const [name, value] = row.args;
    if (!isSymbol(name)) {
      throw CompileErrors.badSyntax(row.lineNumber, `invalid constant name "${name}"`);
    }
    try {
      parseExpression(value);
    } catch {
      throw CompileErrors.badSyntax(
        row.lineNumber,
        `define value must be an expression (a natural number or a bracketed expression), got "${value}"`,
      );
    }
    if (constants.has(name)) {
      throw CompileErrors.badSyntax(row.lineNumber, `constant name "${name}" already defined`);
    }
    constants.set(name, value);
  }

  // `comment` rows are discarded entirely at compile time: their argument is
  // free text, not an expression, and never reaches Pass 3.
  for (const row of asmRows) {
    if (row.command !== 'comment') continue;
    if (row.jumpTarget !== '') {
      throw CompileErrors.badSyntax(row.lineNumber, 'a "comment" row cannot have a jump target');
    }
  }

  // Pass 2: assign cell indices to non-`define`/`comment` rows (4 consecutive
  // cells each, in file order) and build the jump-target table from their
  // label column.
  const codeRows = asmRows.filter((r) => r.command !== 'define' && r.command !== 'comment');
  const jumpTargets = new Map<string, number>();
  let nextCell = 0;
  const cellIndexOf: number[] = [];
  codeRows.forEach((row, i) => {
    cellIndexOf[i] = nextCell;
    if (row.jumpTarget) {
      if (jumpTargets.has(row.jumpTarget)) {
        throw CompileErrors.badSyntax(
          row.lineNumber,
          `jump target "${row.jumpTarget}" already defined`,
        );
      }
      jumpTargets.set(row.jumpTarget, nextCell);
    }
    nextCell += 4;
  });

  // Substitutes constant names with their defined value. Jump targets are
  // NOT substituted here: they stay symbolic in the Executable code and are
  // only resolved to a (start-cell-relative) absolute cell index when the
  // Aloha Runtime loads the program, since the load base isn't known yet at
  // compile time. A jump target is only valid as the *entire* argument of a
  // jump-target-eligible slot (see commands.ts); elsewhere it's a compile error.
  function resolveArgument(raw: string, lineNumber: number, allowJumpTarget: boolean): string {
    if (raw === '') return raw;

    if (allowJumpTarget && isSymbol(raw) && jumpTargets.has(raw)) {
      return raw; // kept symbolic; resolved by the Aloha Runtime at load time
    }

    const substituted = raw.replace(IDENTIFIER_RE, (word) => {
      if (constants.has(word)) return constants.get(word) as string;
      if (jumpTargets.has(word)) {
        throw CompileErrors.badSyntax(
          lineNumber,
          `jump target "${word}" cannot be used here; a jump target may only be used as the whole target argument of goto, ifEqGoto, or ifGtGoto`,
        );
      }
      throw CompileErrors.jumpTargetNotFound(word, lineNumber);
    });

    try {
      parseExpression(substituted);
    } catch {
      throw CompileErrors.badSyntax(lineNumber, `argument "${raw}" is not a valid expression`);
    }
    return substituted;
  }

  // Pass 3: emit machine cells.
  const machineRows: string[][] = [];
  codeRows.forEach((row) => {
    const spec = COMMANDS_BY_NAME.get(row.command);
    if (!spec || row.command === 'define') {
      throw CompileErrors.badSyntax(row.lineNumber, `unknown command "${row.command}"`);
    }
    for (let a = spec.arity; a < 3; a += 1) {
      if (row.args[a] !== '') {
        throw CompileErrors.badSyntax(
          row.lineNumber,
          `command "${row.command}" takes ${spec.arity} argument(s), got extra argument "${row.args[a]}"`,
        );
      }
    }

    const argCells: Array<string | null> = row.args.map((raw, argIdx) => {
      if (argIdx >= spec.arity || raw === '') return null;
      if (raw === 'nil') {
        if (!spec.nilableArgIndices?.includes(argIdx)) {
          throw CompileErrors.badSyntax(
            row.lineNumber,
            `"nil" is not allowed here; parameter ${argIdx + 1} of "${row.command}" must be an expression`,
          );
        }
        return null; // the literal "nil" is represented as an empty cell
      }
      return resolveArgument(raw, row.lineNumber, spec.jumpTargetArgIndex === argIdx);
    });

    machineRows.push([row.jumpTarget, String(spec.id)]);
    for (const cell of argCells) {
      machineRows.push(['', cell ?? '']);
    }
  });

  return {
    machineCsv: stringifyCsv(machineRows),
    constants: [...constants.entries()].map(([name, value]) => ({ name, value })),
  };
}
