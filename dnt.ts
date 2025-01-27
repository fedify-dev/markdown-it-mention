import { build, emptyDir } from "@deno/dnt";
import metadata from "./deno.json" with { type: "json" };

await emptyDir("./npm");

const importMap = ".dnt-import-map.json";
await Deno.writeTextFile(
  importMap,
  JSON.stringify({
    imports: {
      ...metadata.imports,
      "markdown-it": metadata.imports["markdown-it-impl"],
      "markdown-it/": `npm:/${
        metadata.imports["markdown-it-impl"].substring(4)
      }/`,
    },
  }),
);

await build({
  package: {
    // package.json properties
    name: "@fedify/markdown-it-mention",
    version: Deno.args[0] ?? metadata.version,
    description:
      "A markdown-it plugin that parses and renders Mastodon-style @mentions.",
    keywords: [
      "markdown",
      "markdown-it",
      "markdown-it-plugin",
      "Mastodon",
      "mention",
      "fediverse",
    ],
    license: "MIT",
    author: {
      name: "Hong Minhee",
      email: "hong@minhee.org",
      url: "https://hongminhee.org/",
    },
    homepage: "https://github.com/fedify-dev/markdown-it-mention",
    repository: {
      type: "git",
      url: "git+https://github.com/fedify-dev/markdown-it-mention.git",
    },
    bugs: {
      url: "https://github.com/fedify-dev/markdown-it-mention/issues",
    },
    funding: [
      "https://github.com/sponsors/dahlia"
    ],
    devDependencies: {
      "@types/markdown-it": "^14.1.1",
    },
  },
  outDir: "./npm",
  entryPoints: ["./mod.ts"],
  importMap,
  shims: {
    deno: true,
  },
  typeCheck: "both",
  declaration: "separate",
  declarationMap: true,
  test: true,
  async postBuild() {
    await Deno.copyFile("LICENSE", "npm/LICENSE");
    await Deno.copyFile("README.md", "npm/README.md");
  },
});

// cSpell: ignore Minhee
