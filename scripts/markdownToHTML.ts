import { Converter } from 'showdown';

const converter = new Converter({
  completeHTMLDocument: true,
  encodeEmails: false,
  ghCodeBlocks: true,
  openLinksInNewWindow: true,
  smartIndentationFix: true,
});

const paths = new Bun.Glob('src/data/**.md').scan({ onlyFiles: true });

for await (const path of paths) {
  const md = await Bun.file(path).text();
  const html = converter.makeHtml(md);
  const outPath = path.replace(/src[/\\]data/, 'public').replace(/\.md$/, '/index.html');
  await Bun.write(outPath, html);
}

// format outputs
await Bun.$`prettier --write public --config .prettierrc.yaml`;
