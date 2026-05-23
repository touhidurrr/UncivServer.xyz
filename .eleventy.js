export const config = {
  dir: {
    input: 'site',
    output: 'public',
  },
};

const passthroughCopyPaths = ['assets', '**/*.(ts|tsx|txt|css)'];

/** @param {import("@11ty/eleventy/UserConfig").default} eleventyConfig */
export default function (eleventyConfig) {
  eleventyConfig.addFilter('rstrip', str => str.replace(/\/+$/, ''));

  passthroughCopyPaths.forEach(path =>
    eleventyConfig.addPassthroughCopy(`${config.dir.input}/${path}`)
  );
}
