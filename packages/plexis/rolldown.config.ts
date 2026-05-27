import { defineConfig } from 'rolldown';

const format = process.env.FORMAT as 'esm' | 'cjs' | undefined;

const esmOutput = { dir: 'dist/esm', format: 'esm' as const, entryFileNames: '[name].js' };
const cjsOutput = { dir: 'dist/cjs', format: 'cjs' as const, entryFileNames: '[name].cjs' };

export default defineConfig({
  input: 'src/index.ts',
  output: format === 'esm' ? [esmOutput] : format === 'cjs' ? [cjsOutput] : [esmOutput, cjsOutput],
});
