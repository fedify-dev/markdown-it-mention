import type MarkdownIt from "markdown-it";
import type { Options, PluginWithOptions } from "markdown-it";
import { isLinkClose, isLinkOpen } from "./html.ts";
import { toBareHandle } from "./label.ts";

type Renderer = MarkdownIt["renderer"];
type Token = ReturnType<MarkdownIt["parseInline"]>[number];
type StateCore = Parameters<MarkdownIt["core"]["process"]>[0];

/**
 * Options for the plugin.
 */
export interface PluginOptions {
  /**
   * A function to determine the domain of a bare handle.  If it returns `null`,
   * the bare handle will be rendered as plain text.  `null` by default.
   * @param bareHandle The bare handle, e.g., `"@john"`.
   * @param env The environment.
   * @returns The local domain of the handle or `null` if the handle should be
   *          plain text.
   * @since 0.3.0
   */
  // deno-lint-ignore no-explicit-any
  localDomain?: (bareHandle: string, env: any) => string | null;

  /**
   * A function to render a link href for a mention.  If it returns `null`,
   * the mention will be rendered as plain text.  `acct:${handle}` by default.
   * @param handle The handle, e.g., `"@john@example.com"`.
   * @param env The environment.
   * @returns The link href or `null` if the mention should be plain text.
   */
  // deno-lint-ignore no-explicit-any
  link?: (handle: string, env: any) => string | null;

  /**
   * A function to render extra attributes for a mention link.
   * @param handle The handle, e.g., `"@john@example.com"`.
   * @param env The environment.
   * @returns The extra attributes of the link (`<a>` tag).
   */
  // deno-lint-ignore no-explicit-any
  linkAttributes?: (handle: string, env: any) => Record<string, string>;

  /**
   * A function to render a label for a mention link.  {@link toBareHandle}
   * by default.
   * @param handle The handle, e.g., `"@john@example.com"`.
   * @param env The environment.
   * @returns The label of the link in HTML.
   */
  // deno-lint-ignore no-explicit-any
  label?: (handle: string, env: any) => string;
}

/**
 * A markdown-it plugin to parse and render Mastodon-style mentions.
 */
export const mention: PluginWithOptions<PluginOptions> = (
  md: MarkdownIt,
  options?: PluginOptions,
): void => {
  md.core.ruler.after(
    "inline",
    "mention",
    (state: StateCore) => parseMention(state, options),
  );
  md.renderer.rules.mention = renderMention;
};

function parseMention(state: StateCore, options?: PluginOptions) {
  for (const blockToken of state.tokens) {
    if (blockToken.type !== "inline") continue;
    if (blockToken.children == null) continue;
    let linkDepth = 0;
    let htmlLinkDepth = 0;
    blockToken.children = blockToken.children.flatMap((token: Token) => {
      if (token.type === "link_open") {
        linkDepth++;
      } else if (token.type === "link_close") {
        linkDepth--;
      } else if (token.type === "html_inline") {
        if (isLinkOpen(token.content)) {
          htmlLinkDepth++;
        } else if (isLinkClose(token.content)) {
          htmlLinkDepth--;
        }
      }
      if (
        linkDepth > 0 || htmlLinkDepth > 0 || token.type !== "text"
      ) {
        return [token];
      }
      return splitTokens(token, state, options);
    });
  }
}

const MENTION_PATTERN =
  /@[\p{L}\p{N}._-]+(@(?:[\p{L}\p{N}][\p{L}\p{N}_-]*\.)+[\p{L}\p{N}]{2,})?/giu;

function splitTokens(
  token: Token,
  state: StateCore,
  options?: PluginOptions,
): Token[] {
  const { content, level } = token;
  const tokens = [];
  let pos = 0;
  for (const match of content.matchAll(MENTION_PATTERN)) {
    if (match.index == null) continue;

    let handle = match[0];
    if (match[1] == null) {
      const localDomain = options?.localDomain == null
        ? null
        : options.localDomain(handle, state.env);
      if (localDomain == null) continue;
      handle += `@${localDomain}`;
    }

    if (match.index > pos) {
      const token = new state.Token("text", "", 0);
      token.content = content.substring(pos, match.index);
      token.level = level;
      tokens.push(token);
    }

    const href = options?.link?.(handle, state.env);
    if (href == null && options?.link != null) {
      const token = new state.Token("text", "", 0);
      token.content = match[0];
      token.level = level;
      tokens.push(token);
      pos = match.index + match[0].length;
      continue;
    }

    const token = new state.Token("mention", "", 0);
    token.content = options?.label?.(handle, state.env) ??
      toBareHandle(handle, state.env);
    token.level = level;
    const attrs = options?.linkAttributes?.(handle, state.env) ?? {};
    attrs.href = href ?? `acct:${handle}`;
    token.attrs = Object.entries(attrs);
    token.info = handle;
    tokens.push(token);
    pos = match.index + match[0].length;
  }

  if (pos < content.length) {
    const token = new state.Token("text", "", 0);
    token.content = content.substring(pos);
    token.level = level;
    tokens.push(token);
  }

  return tokens;
}

function renderMention(
  tokens: Token[],
  idx: number,
  opts: Options,
  // deno-lint-ignore no-explicit-any
  env: any,
  self: Renderer,
): string {
  if (tokens.length <= idx) return "";
  const token = tokens[idx];
  if (token.type !== "mention") return self.renderToken(tokens, idx, opts);
  if (typeof env === "object" && env !== null) {
    if (!("mentions" in env)) {
      env.mentions = [];
    }
    env.mentions.push(token.info);
  }
  return `<a ${self.renderAttrs(token)}>${token.content}</a>`;
}
