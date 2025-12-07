export const config = {
  dir: {
    input: 'site',
    output: 'public',
  },
};

const passthroughCopyPaths = ['assets', '**/*.ts', '**/*.txt', '**/*.css'];

/** @param {import("@11ty/eleventy/UserConfig").default} eleventyConfig */
export default function (eleventyConfig) {
  passthroughCopyPaths.forEach(path =>
    eleventyConfig.addPassthroughCopy(`${config.dir.input}/${path}`)
  );
}
