#!/usr/bin/env node
import * as fs from 'node:fs';
import { compile } from '../src/compiler';
import { AlohaError } from '../src/errors';

function main(): void {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: alcomp <Aloha-Assembler-code-file.csv> <Aloha-Machine-code-file.csv>');
    process.exit(1);
  }

  const asmText = fs.readFileSync(inputPath, 'utf8');

  try {
    const { machineCsv, constants } = compile(asmText);
    fs.writeFileSync(outputPath, machineCsv);
    console.log('Constants:');
    for (const c of constants) console.log(`  ${c.name} = ${c.value}`);
    console.log(`Compiled successfully: ${outputPath}`);
  } catch (err) {
    if (err instanceof AlohaError) {
      console.error(`[${err.code}] ${err.errorName}: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

main();
