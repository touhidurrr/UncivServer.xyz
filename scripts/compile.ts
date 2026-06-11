import tailwind from 'bun-plugin-tailwind';

const result = await Bun.build({
  entrypoints: ['src/index.ts'],
  plugins: [tailwind],
  minify: true,
  bytecode: true,
  sourcemap: true,
  format: 'esm',
  compile: {
    execArgv: ['--smol'],
    outfile: 'uncivserver',
  },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log('Compiled uncivserver');
