import { assertEquals } from "@std/assert/assert-equals";
import MarkdownIt from "markdown-it-impl";
import { toFullHandle } from "./label.ts";
import { mention } from "./plugin.ts";

Deno.test("mention()", () => {
  const md = new MarkdownIt({ html: true });
  md.use(mention);
  // deno-lint-ignore no-explicit-any
  const env: any = {};
  const html = md.render(
    `\
**Hello**, *@hongminhee@mastodon.social*!

> @hongminhee@todon.eu 테스트

[This should be ignored: @hongminhee@wizard.casa](https://example.com/)

<a href="">This also should be ignored: @foo@bar.com</a>

This also should be ignored: @foo.
`,
    env,
  );
  assertEquals(env.mentions, [
    "@hongminhee@mastodon.social",
    "@hongminhee@todon.eu",
  ]);
  assertEquals(
    html,
    `\
<p><strong>Hello</strong>, <em><a  href="acct:@hongminhee@mastodon.social"><span class="at">@</span><span class="user">hongminhee</span></a></em>!</p>
<blockquote>
<p><a  href="acct:@hongminhee@todon.eu"><span class="at">@</span><span class="user">hongminhee</span></a> 테스트</p>
</blockquote>
<p><a href="https://example.com/">This should be ignored: @hongminhee@wizard.casa</a></p>
<p><a href="">This also should be ignored: @foo@bar.com</a></p>
<p>This also should be ignored: @foo.</p>
`,
  );

  const md2 = new MarkdownIt();
  md2.use(mention, {
    // deno-lint-ignore no-explicit-any
    link: (handle: string, env: any) =>
      handle.endsWith(`@${env.domain}`)
        ? `https://example.com/${handle}`
        : null,
    // deno-lint-ignore no-explicit-any
    linkAttributes: (handle: string, env: any) => ({
      ...env.attrs,
      "data-handle": handle,
    }),
    label: toFullHandle,
  });
  const html2 = md2.render("# @foo@bar.com\n\n> @baz@qux.com", {
    domain: "bar.com",
    attrs: { class: "mention" },
  });
  assertEquals(
    html2,
    '<h1><a  class="mention" data-handle="@foo@bar.com" href="https://example.com/@foo@bar.com">' +
      '<span class="at">@</span><span class="user">foo</span><span class="at">@</span>' +
      '<span class="domain">bar.com</span></a></h1>\n' +
      "<blockquote>\n" +
      "<p>@baz@qux.com</p>\n" +
      "</blockquote>\n",
  );

  const md3 = new MarkdownIt();
  md3.use(mention, {
    localDomain(bareHandle, env) {
      return env.domains[bareHandle];
    },
  });
  const env3 = {
    domains: { "@foo": "a.com", "@bar": "b.com" },
    mentions: [],
  };
  const html3 = md3.render("@foo\n\n@bar\n\n@baz\n\n@qux@d.com", env3);
  assertEquals(
    html3,
    `\
<p><a  href="acct:@foo@a.com"><span class="at">@</span><span class="user">foo</span></a></p>
<p><a  href="acct:@bar@b.com"><span class="at">@</span><span class="user">bar</span></a></p>
<p>@baz</p>
<p><a  href="acct:@qux@d.com"><span class="at">@</span><span class="user">qux</span></a></p>
`,
  );
  assertEquals(env3.mentions, ["@foo@a.com", "@bar@b.com", "@qux@d.com"]);
});
