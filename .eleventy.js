import { hash } from 'node:crypto';
import { globSync, statSync, writeFileSync } from 'node:fs';

export const config = {
  dir: {
    input: 'site',
    output: 'public',
  },
};

const passthroughCopyPaths = ['assets', '**/*.(ts|tsx|txt|css)'];

const getHashedVariableName = input => '_' + BigInt(`0x${hash('sha3-256', input)}`).toString(36);

const getOutputPassthroughFilePaths = () => {
  const outputDir = config.dir.output;
  const excludedExtensions = /\.(js|ts|tsx|map|html|css)$/i;
  const entries = globSync(`./${outputDir}/**/*`);
  return entries
    .filter(entry => statSync(entry).isFile() && !excludedExtensions.test(entry))
    .map(
      entry => './' + entry.replaceAll(/\\/g, '/').replace(new RegExp(`^\\.?/?${outputDir}/`), '')
    );
};

/** @param {import("@11ty/eleventy/UserConfig").default} eleventyConfig */
export default function (eleventyConfig) {
  eleventyConfig.addFilter('rstrip', str => str.replace(/\/+$/, ''));

  passthroughCopyPaths.forEach(path =>
    eleventyConfig.addPassthroughCopy(`${config.dir.input}/${path}`)
  );

  eleventyConfig.on('eleventy.after', async ({ results }) => {
    const imports = [];
    const routes = {};
    const output = `${config.dir.output}/_routes.ts`;

    // strip a leading "./" or "/" and re-add a single leading slash
    const toUrl = path => '/' + path.replace(/^\.?\/?/, '');

    // non-html assets: Bun imports them as strings, not HTMLBundle/Response,
    // so they cannot be route values directly. Serve them from disk instead.
    getOutputPassthroughFilePaths().forEach(path => {
      const url = toUrl(path);
      const varName = getHashedVariableName(path);

      imports.push(`import ${varName} from '${path}' with { type: "file" };`);
      routes[url] = `Bun.file(${varName})`;
    });

    const outputPaths = results.map(r => r.outputPath.replace(`${config.dir.output}/`, ''));
    outputPaths.forEach(path => {
      const varName = getHashedVariableName(path);
      imports.push(`import ${varName} from '${path}';`);

      // drop trailing /index.html; the bare directory url ("/" for root) serves it
      const url = toUrl(path).replace(/index\.html$/, '');
      routes[url] = varName;
      routes[url + 'index.html'] = `Response.redirect('${url}')`;
    });

    writeFileSync(
      output,
      `// auto-generated routes file for bun\n` +
        imports.join('\n') +
        `\n\nexport default {\n` +
        Object.entries(routes)
          .map(([path, expr]) => `  '${path}': ${expr},`)
          .join('\n') +
        `\n};\n`
    );

    console.log(`Generated ${output} with ${Object.keys(imports).length} imports.`);
  });
}
