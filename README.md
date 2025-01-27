<!-- deno-fmt-ignore-file -->

@fedify/markdown-it-mention
===========================

[![JSR][JSR badge]][JSR]
[![npm][npm badge]][npm]
[![GitHub Actions][GitHub Actions badge]][GitHub Actions]

This is a [markdown-it] plugin that parses and renders Mastodon-style @mentions,
e.g., `@username@domain.com`.  It converts them to a link, e.g.:

~~~~ html
<a href="acct:@username@domain.com"><span class="at">@</span><span
  class="user">username</span></a>
~~~~

The value of `href` attributes, other attributes (if any), and the content of
the link can be customized by passing [options] to the plugin:

~~~~ typescript
import MarkdownIt from "markdown-it";
import { mention, toFullHandle } from "@fedify/markdown-it-mention";

const md = new MarkdownIt();
md.use(mention, {
  link: (handle: string, env: any) => `https://example.com/${handle}`,
  linkAttributes: (handle: string, env: any) => ({ class: "mention" }),
  label: toFullHandle,
});
~~~~

> [!TIP]
> The `link` callback can return `null` to disable the link.

If you want to collect all the handles mentioned in the document, you can pass
the environment object to the `render()` method:

~~~~ typescript
const env = {};
md.render(
  "# Hello, @foo@bar.com\n\n> @baz@qux.com",
  env,
);
console.log(env.mentions);  // ["@foo@bar.com", "@baz@qux.com"]
~~~~

[JSR]: https://jsr.io/@fedify/markdown-it-mention
[JSR badge]: https://jsr.io/badges/@fedify/markdown-it-mention
[npm]: https://www.npmjs.com/package/@fedify/markdown-it-mention
[npm badge]: https://img.shields.io/npm/v/%40fedify%2Fmarkdown-it-mention?logo=npm
[GitHub Actions]: https://github.com/fedify-dev/markdown-it-mention/actions/workflows/main.yaml
[GitHub Actions badge]: https://github.com/fedify-dev/markdown-it-mention/actions/workflows/main.yaml/badge.svg
[markdown-it]: https://github.com/markdown-it/markdown-it
[options]: https://jsr.io/@fedify/markdown-it-mention/doc/~/PluginOptions


Installation
------------

### Deno

~~~~ sh
deno add @fedify/markdown-it-mention
~~~~

### Node.js

~~~~ sh
npm add @fedify/markdown-it-mention
~~~~

### Bun

~~~~ sh
bun add @fedify/markdown-it-mention
~~~~
