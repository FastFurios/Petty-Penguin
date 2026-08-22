export class AlohaError extends Error {
  code: string;
  errorName: string;
  data?: unknown;

  constructor(code: string, errorName: string, message: string, data?: unknown) {
    super(message);
    this.name = 'AlohaError';
    this.code = code;
    this.errorName = errorName;
    this.data = data;
  }
}

export class CompileError extends AlohaError {}
export class RuntimeErrorAloha extends AlohaError {}

// Errors 0001 and 0002 are defined in aloha-specification_v01.md's compile error table.
export const CompileErrors = {
  badSyntax: (line: number, detail?: string): CompileError =>
    new CompileError(
      '0001',
      'compile failure: bad syntax',
      `could not compile program: bad syntax in line: ${line}${detail ? ` (${detail})` : ''}`,
      { line },
    ),
  jumpTargetNotFound: (name: string, line: number): CompileError =>
    new CompileError(
      '0002',
      'compile failure: cannot find jump target',
      `could not find the jump target: ${name}`,
      { jumpTarget: name, line },
    ),
};

// Errors 0100 and 0101 are defined in aloha-specification_v01.md's runtime error table.
// The 'X0..' codes are implementation extensions: the spec doesn't define an error for
// them, but the runtime has to do something sensible when they occur.
export const RuntimeErrors = {
  negativeNumber: (value: number, pc: number): RuntimeErrorAloha =>
    new RuntimeErrorAloha(
      '0100',
      'runtime error: negative number',
      `value is a negative number: ${value}`,
      { value, cellIndexOfCommand: pc },
    ),
  cellAccessFailure: (expr: string): RuntimeErrorAloha =>
    new RuntimeErrorAloha(
      '0101',
      'runtime error: cell access failure',
      `cell id is negative or expression parsing error: ${expr}`,
      { expression: expr },
    ),
  inputExhausted: (): RuntimeErrorAloha =>
    new RuntimeErrorAloha(
      'X001',
      'runtime error: input exhausted (implementation extension, not in spec)',
      'import was executed but the input list is exhausted',
    ),
  unknownCommand: (idContent: string, pc: number): RuntimeErrorAloha =>
    new RuntimeErrorAloha(
      'X002',
      'runtime error: unknown command id (implementation extension, not in spec)',
      `cell ${pc} does not contain a known command id: "${idContent}"`,
      { pc, idContent },
    ),
  unresolvedJumpTarget: (name: string): RuntimeErrorAloha =>
    new RuntimeErrorAloha(
      'X003',
      'runtime error: unresolved jump target (implementation extension, not in spec)',
      `Executable code references a jump target that has no matching label: ${name}`,
      { jumpTarget: name },
    ),
};
