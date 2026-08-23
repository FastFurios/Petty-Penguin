import { RuntimeErrors } from './errors';
import { Memory } from './memory';

// expression := natural-number | "[" expression "]"
export type Expr = { kind: 'num'; value: number } | { kind: 'ref'; inner: Expr };

export function parseExpression(raw: string): Expr {
  const s = raw.trim();
  if (s.length === 0 || !isFullyBalanced(s)) {
    throw RuntimeErrors.cellAccessFailure(raw);
  }
  return parseInner(s, raw);
}

function parseInner(s: string, original: string): Expr {
  if (s.length === 0) throw RuntimeErrors.cellAccessFailure(original);

  if (s[0] === '[' && s[s.length - 1] === ']' && isFullyWrapped(s)) {
    const inner = parseInner(s.slice(1, -1).trim(), original);
    return { kind: 'ref', inner };
  }
  if (/^\d+$/.test(s)) {
    return { kind: 'num', value: parseInt(s, 10) };
  }
  throw RuntimeErrors.cellAccessFailure(original);
}

// Checks brackets are balanced and never go negative anywhere in the string.
function isFullyBalanced(s: string): boolean {
  let depth = 0;
  for (const ch of s) {
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

// Checks that the outermost '[' ... ']' pair actually wraps the whole string,
// e.g. "[1][2]" is balanced but NOT fully wrapped by a single pair.
function isFullyWrapped(s: string): boolean {
  if (s[0] !== '[' || s[s.length - 1] !== ']') return false;
  let depth = 0;
  for (let i = 0; i < s.length; i += 1) {
    if (s[i] === '[') depth += 1;
    else if (s[i] === ']') {
      depth -= 1;
      if (depth === 0 && i !== s.length - 1) return false;
    }
  }
  return depth === 0;
}

// Fully evaluates an expression to a number. Dereferencing recurses: if a
// referenced cell's content is itself an expression (e.g. another bracketed
// reference), it keeps evaluating until it bottoms out at a plain number.
export function evaluate(expr: Expr, memory: Memory, original: string): number {
  if (expr.kind === 'num') return expr.value;

  const idx = evaluate(expr.inner, memory, original);
  if (!Number.isInteger(idx) || idx < 0) {
    throw RuntimeErrors.cellAccessFailure(original);
  }
  const content = memory.get(idx);
  if (content === null) {
    throw RuntimeErrors.cellAccessFailure(original);
  }
  const contentExpr = parseExpression(content);
  return evaluate(contentExpr, memory, content);
}

export function evaluateString(raw: string, memory: Memory): number {
  const expr = parseExpression(raw);
  return evaluate(expr, memory, raw);
}

// Like evaluate(), but a dereference that bottoms out on an empty (nil) cell
// yields null instead of throwing. Only for parameters explicitly typed
// "expression or nil" (ifEqGoto/ifGtGoto's operands); the index inside a
// bracket must still evaluate to a real number, so nesting still uses the
// strict evaluate() for that part.
export function evaluateNilable(expr: Expr, memory: Memory, original: string): number | null {
  if (expr.kind === 'num') return expr.value;

  const idx = evaluate(expr.inner, memory, original);
  if (!Number.isInteger(idx) || idx < 0) {
    throw RuntimeErrors.cellAccessFailure(original);
  }
  const content = memory.get(idx);
  if (content === null) return null;
  const contentExpr = parseExpression(content);
  return evaluateNilable(contentExpr, memory, content);
}

export function evaluateStringNilable(raw: string, memory: Memory): number | null {
  const expr = parseExpression(raw);
  return evaluateNilable(expr, memory, raw);
}
