import { Converter } from 'showdown';
import { rm } from 'node:fs/promises';

const converter = new Converter({
  completeHTMLDocument: true,
  encodeEmails: false,
  ghCodeBlocks: true,
  openLinksInNewWindow: true,
  smartIndentationFix: true,
});

await rm('public/bot', { recursive: true, force: true });
const paths = new Bun.Glob('src/data/bot/**.md').scan({ onlyFiles: true });

for await (const path of paths) {
  const md = await Bun.file(path).text();
  const html = converter.makeHtml(md);
  const outPath = path.replace(/src[/\\]data/, 'public').replace(/\.md$/, '/index.html');
  await Bun.write(outPath, html);
}

// format outputs
await Bun.$`prettier --write public`;
