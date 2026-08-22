#!/usr/bin/env node
import * as fs from 'node:fs';
import { loadMachineCode, run } from '../src/runtime';
import { Memory } from '../src/memory';
import { writeDump } from '../src/dump';
import { AlohaError } from '../src/errors';

function usageAndExit(): never {
  console.error(
    'Usage: aloha <Aloha-Machine-code-file.csv> <start cell index> <input load cell index> <input list of natural numbers...>',
  );
  process.exit(1);
}

function main(): void {
  const [, , machinePath, startCellStr, inputLoadCellStr, ...inputStrs] = process.argv;
  if (!machinePath || startCellStr === undefined || inputLoadCellStr === undefined) {
    usageAndExit();
  }

  const startCell = Number(startCellStr);
  const inputLoadCell = Number(inputLoadCellStr);
  const input = inputStrs.map(Number);

  const isNatural = (n: number) => Number.isInteger(n) && n >= 0;
  if (!isNatural(startCell) || !isNatural(inputLoadCell) || !input.every(isNatural)) {
    console.error('start cell, input load cell and all input values must be natural numbers');
    process.exit(1);
  }

  const csvText = fs.readFileSync(machinePath, 'utf8');
  let memory: Memory | undefined;

  try {
    memory = loadMachineCode(csvText, startCell);
    run(memory, { startCell, inputLoadCell, input }, (n) => console.log(n));
  } catch (err) {
    if (err instanceof AlohaError) {
      console.error(`[${err.code}] ${err.errorName}: ${err.message}`);
      if (memory) {
        const dumpPath = writeDump(machinePath, memory);
        console.error(`Dump written to: ${dumpPath}`);
      }
      process.exit(1);
    }
    throw err;
  }
}

main();
