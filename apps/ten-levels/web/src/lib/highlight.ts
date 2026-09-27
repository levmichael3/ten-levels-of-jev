import { esc } from "./viz";

/**
 * Minimal TypeScript highlighter. One pass, first match wins, in this order:
 * comment, string, number, keyword, built-in type, CONSTANT, PascalCase type,
 * function name (before a paren), property key (before a colon).
 */
const RE = new RegExp(
  [
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/,
    /(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
    /(\b\d+(?:\.\d+)?\b)/,
    /(\b(?:export|import|from|async|await|function|const|let|var|return|type|interface|class|extends|implements|new|if|else|for|of|in|while|do|switch|case|default|break|continue|throw|try|catch|finally|typeof|instanceof|as|readonly|private|public|static|true|false|null|undefined|void)\b)/,
    /(\b(?:string|number|boolean|unknown|never|any|object|symbol|bigint|Promise|Record|Partial|Required|Pick|Omit|Array|Set|Map|RegExp|Error|Exclude|Extract|ReturnType|Parameters)\b)/,
    /(\b[A-Z][A-Z0-9_]{2,}\b)/,
    /(\b[A-Z][a-zA-Z0-9]*\b)/,
    /(\b[a-zA-Z_$][\w$]*)(?=\s*\()/,
    /(\b[a-zA-Z_$][\w$]*)(?=\s*\?*:)/,
  ]
    .map((r) => r.source)
    .join("|"),
  "g",
);
const CLASSES = ["tok-c", "tok-s", "tok-n", "tok-k", "tok-t", "tok-v", "tok-t", "tok-f", "tok-p"];

/**
 * "ts" colors every string literal alike. "json" keeps keys (a string before a colon) in the
 * string color and gives string values the number color, so values read as one kind of thing.
 */
export function highlightTs(src: string, mode: "ts" | "json" = "ts"): string {
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(src))) {
    out += esc(src.slice(last, m.index));
    const g = m.slice(1).findIndex((x) => x !== undefined);
    const end = m.index + m[0].length;
    const isValueString = mode === "json" && g === 1 && !/^\s*:/.test(src.slice(end, end + 8));
    out += `<span class="${isValueString ? "tok-n" : CLASSES[g]}">${esc(m[0])}</span>`;
    last = end;
  }
  return out + esc(src.slice(last));
}

/** Fill a call template like `await urgentGate({{message}})` with the live input values. */
export function renderCall(template: string, input: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = input[key];
    return typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v, null, 2);
  });
}
