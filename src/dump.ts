import * as fs from 'node:fs';
import * as path from 'node:path';
import { Memory } from './memory';
import { stringifyCsv } from './csv';

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(
    d.getMinutes(),
  )}-${pad(d.getSeconds())}`;
}

// Name pattern per spec: "<program file name>_<yyyy-mm-dd_hh-mm-ss>.dump"
export function writeDump(machineFilePath: string, memory: Memory): string {
  const base = path.basename(machineFilePath, path.extname(machineFilePath));
  const dumpName = `${base}_${timestamp()}.dump`;
  const dumpPath = path.join(path.dirname(machineFilePath), dumpName);
  const rows = memory.entries().map(([index, content]) => [String(index), content]);
  fs.writeFileSync(dumpPath, stringifyCsv(rows));
  return dumpPath;
}
