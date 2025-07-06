export const config = {
  dir: {
    input: 'site',
    output: 'public',
    includes: '_includes',
    layouts: '_layouts',
  },
};

const passthroughCopyPaths = [
  '_assets',
  'robots.txt',
  'sitemap.txt',
  'index.css',
  'tools/index.css',
];

export default function (eleventyConfig) {
  passthroughCopyPaths.forEach(path =>
    eleventyConfig.addPassthroughCopy(`${config.dir.input}/${path}`)
  );
}
