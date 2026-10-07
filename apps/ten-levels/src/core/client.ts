/**
 * JevClient — a provider and credential snapshot, with no runtime fallback.
 * The only live backend is LiteLLM, authenticated with LITELLM_API_KEY.
 * Mock requires an explicit selection or node:test isolation; missing
 * production credentials fail closed.
 */
import { MockJev } from "./mock.ts";
import {
  QuestionValidationError,
  validateRequest,
  type Questions,
  type State,
  type SystemOneRequest,
  type SystemOneResponse,
} from "./types.ts";

export type JevProvider = "mock" | "litellm";

const DEFAULT_LITELLM_ORIGIN = "https://litellm.tikalk.dev/v1";
const DEFAULT_MODEL = "open-weight-smart";
/** open-weight-smart reasons by default: ~600 hidden tokens and 7-9 s per decision. "none" answers in about 1 s. */
const DEFAULT_REASONING_EFFORT = "none";

const KEY_ENV = {
  litellm: "LITELLM_API_KEY",
} as const;

/** Ask the chat model for the System One envelope and nothing else. */
const DECISION_PROMPT = [
  "You are a decision engine. Reply with one JSON object and no other text.",
  'Shape: {"model":"<the model id>","answers":{...},"usage":{"input_tokens":0,"output_tokens":0}}',
  "For each question id in the user message:",
  '- noul: {"type":"noul","noul":<number from 0 to 1>}',
  '- choice: {"type":"choice","choice":"<one declared key>","probabilities":{<every declared key>: <0..1>},"confidence":<0..1>}. Probabilities must sum to 1.',
  '- score: {"type":"score","score":<0..level count minus 1>,"confidence":<0..1>,"probabilities":{"0":p,...},"legend":{"0":"<criteria[0]>",...}}. One probability and legend entry per criterion, in order. Probabilities must sum to 1.',
].join("\n");

const RETRY_STATUSES = new Set([429, 502, 503, 529]);
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;

/** Caller-supplied USD prices; no assumed provider/model rates. */
export interface JevPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export type JevCost =
  | { amount: number; source: "reported" | "estimated" | "mock" }
  | { amount: null; source: "unknown" };

export interface JevClientOptions {
  /** Overrides test isolation, JEV_BACKEND, and automatic key-based selection. */
  provider?: JevProvider;
  /** Requires opts.provider to explicitly name a live provider. */
  apiKey?: string;
  /** Full endpoint URL (not an origin). Redirects are refused. */
  baseUrl?: string;
  /** Pin a versioned model ID instead of the moving alias. */
  model?: string;
  /** Total budget including retries and response bodies. Default: 30,000 ms. */
  timeoutMs?: number;
  /** Exponential backoff base, plus up to 20% jitter. Default: 500 ms; 0 is allowed. */
  retryDelayMs?: number;
  /** Used only when usage.cost is not a valid reported cost. Snapshotted at construction. */
  pricing?: JevPricing;
}

export interface JevRawExchange {
  /** Snapshot of the JSON sent; no credentials or headers. */
  request: SystemOneRequest;
  requestText: string;
  /** Unenriched provider payload, including unknown fields. */
  response: SystemOneResponse;
  /** Exact response body text; mock responses use synthetic JSON. */
  responseText: string;
}

export interface SystemOneResult extends SystemOneResponse {
  raw: JevRawExchange;
  meta: {
    provider: JevProvider;
    requestedModel: string;
    resolvedModel: string;
    elapsedMs: number;
    attempts: number;
    /** USD, or null when no trustworthy cost is available. */
    cost: JevCost;
  };
}

export class ContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractError";
  }
}

/** Live observation of every call — the web layer streams these to the UI. */
export type JevEvent =
  | { kind: "request"; provider: JevProvider; model: string; state: State; questions: Questions }
  | { kind: "response"; result: SystemOneResult };

export class JevClient {
  readonly provider: JevProvider;
  private readonly apiKey?: string;
  private readonly endpoint?: string;
  private readonly mock = new MockJev();
  private readonly model?: string;
  /** Snapshotted so a later JEV_MODEL change cannot retarget an existing client. */
  private readonly defaultModel: string;
  private readonly reasoningEffort: string;
  private readonly timeoutMs: number;
  private readonly retryDelayMs: number;
  private readonly pricing?: JevPricing;
  private listeners: ((event: JevEvent) => void)[] = [];
  /** Count of validated systemOne calls, for the demo's cost story. */
  calls = 0;

  constructor(opts: JevClientOptions = {}) {
    if (opts.apiKey !== undefined && opts.provider !== "litellm") {
      throw new Error("apiKey requires an explicit live opts.provider (litellm).");
    }
    this.provider = selectProvider(opts.provider);
    this.model = opts.model;
    this.defaultModel = process.env.JEV_MODEL?.trim() || DEFAULT_MODEL;
    this.reasoningEffort = process.env.JEV_REASONING_EFFORT?.trim() || DEFAULT_REASONING_EFFORT;
    this.timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;
    this.retryDelayMs = opts.retryDelayMs ?? 500;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs <= 0 || this.timeoutMs > 2_147_483_647) {
      throw new Error("timeoutMs must be a positive integer no greater than 2147483647.");
    }
    if (!isNonnegative(this.retryDelayMs)) throw new Error("retryDelayMs must be finite and nonnegative.");
    if (opts.pricing !== undefined) {
      if (!opts.pricing || !isNonnegative(opts.pricing.inputPerMillion) || !isNonnegative(opts.pricing.outputPerMillion)) {
        throw new Error("pricing requires finite, nonnegative inputPerMillion and outputPerMillion USD rates.");
      }
      this.pricing = { ...opts.pricing };
    }
    if (this.provider === "mock") return;
    this.apiKey = (opts.apiKey ?? process.env[KEY_ENV[this.provider]])?.trim();
    this.endpoint = opts.baseUrl ?? litellmChatUrl(process.env.LITELLM_URL);
    if (!this.apiKey) {
      throw new Error(`Provider "${this.provider}" needs a nonblank apiKey or ${KEY_ENV[this.provider]}.`);
    }
  }

  get isLive(): boolean {
    return this.provider !== "mock";
  }

  /** Observe every request and response this client makes. */
  on(listener: (event: JevEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: JevEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  async systemOne(
    state: State,
    questions: Questions,
    opts: { model?: string; signal?: AbortSignal } = {}
  ): Promise<SystemOneResult> {
    opts.signal?.throwIfAborted();
    const requestedModel = opts.model ?? this.model ??
      (this.provider === "mock" ? this.mock.model : this.defaultModel);
    const body: SystemOneRequest = { model: requestedModel, state, questions };
    validateRequest(body);
    let requestText: string;
    try {
      requestText = JSON.stringify(body);
    } catch {
      throw new QuestionValidationError("Request must be JSON-serializable (no cycles or BigInt).");
    }
    const request: SystemOneRequest = JSON.parse(requestText);
    // Validate the actual wire snapshot too (e.g. user-defined toJSON methods).
    validateRequest(request);
    this.calls++;
    const started = performance.now();
    this.emit({ kind: "request", provider: this.provider, model: requestedModel, state, questions });

    if (this.provider === "mock") {
      opts.signal?.throwIfAborted();
      const response = this.mock.systemOne(request);
      const raw = { request, requestText, response, responseText: JSON.stringify(response) };
      const out = withMeta(raw, this.provider, requestedModel, started, 1, this.pricing);
      this.emit({ kind: "response", result: out });
      return out;
    }

    const deadline = new AbortController();
    const timer = setTimeout(() => {
      deadline.abort(new DOMException("Jev request timed out.", "TimeoutError"));
    }, this.timeoutMs);
    const signal = opts.signal ? AbortSignal.any([deadline.signal, opts.signal]) : deadline.signal;
    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        signal.throwIfAborted();
        const res = await fetch(this.endpoint!, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
          body: chatCompletionBody(requestedModel, requestText, this.reasoningEffort),
          signal,
          redirect: "error",
        });
        signal.throwIfAborted();
        if (RETRY_STATUSES.has(res.status) && attempt < MAX_ATTEMPTS) {
          const backoff = this.retryDelayMs * 2 ** (attempt - 1) * (1 + Math.random() * 0.2);
          const delay = Math.min(8000, Math.max(backoff, retryAfterMs(res.headers.get("retry-after"))));
          await res.body?.cancel();
          await sleep(delay, signal);
          continue;
        }
        if (!res.ok) {
          await res.body?.cancel();
          const hint = res.status === 401 ? ` Check the ${KEY_ENV[this.provider]} key.`
            : res.status === 402 ? " Check account credits." : "";
          throw new Error(`${this.provider} HTTP ${res.status}.${hint}`);
        }
        const responseText = await res.text();
        signal.throwIfAborted();
        const response = parseLiveBody(responseText, requestedModel);
        validateResponse(response, request.questions);
        const raw = { request, requestText, response, responseText };
        const out = withMeta(raw, this.provider, requestedModel, started, attempt, this.pricing);
        this.emit({ kind: "response", result: out });
        return out;
      }
      throw new Error(`${this.provider} retries exhausted`);
    } finally {
      clearTimeout(timer);
    }
  }
}

function selectProvider(explicit?: JevProvider): JevProvider {
  // node:test cannot accidentally use ambient live credentials/overrides.
  // Explicit opts.provider or the existing JEV_LIVE=1 opt-in bypass isolation.
  const isolated = process.env.NODE_TEST_CONTEXT && process.env.JEV_LIVE !== "1";
  const selected = explicit ?? (isolated ? "mock" : process.env.JEV_BACKEND?.trim() || undefined);
  if (selected !== undefined) {
    if (selected === "mock" || selected === "litellm") return selected;
    throw new Error(`Unknown JEV backend "${selected}"; use mock or litellm.`);
  }
  if (process.env.LITELLM_API_KEY?.trim()) return "litellm";
  throw new Error("No Jev credentials: set LITELLM_API_KEY, or explicitly select provider: mock / JEV_BACKEND=mock for offline use.");
}

/** Origin from LITELLM_URL, or the lab proxy. A full chat-completions URL is kept as given. */
function litellmChatUrl(origin: string | undefined): string {
  let raw = (origin?.trim() || DEFAULT_LITELLM_ORIGIN).replace(/\/$/, "");
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    raw = raw.slice(1, -1).trim().replace(/\/$/, "");
  }
  return raw.endsWith("/chat/completions") ? raw : `${raw}/chat/completions`;
}

function chatCompletionBody(model: string, requestText: string, reasoningEffort: string): string {
  return JSON.stringify({
    model,
    temperature: 0,
    reasoning_effort: reasoningEffort,
    messages: [
      { role: "system", content: DECISION_PROMPT },
      { role: "user", content: requestText },
    ],
  });
}

/**
 * LiteLLM returns a chat completion. A body that is already a System One envelope
 * (the contract tests, or a proxy that speaks it) is used unchanged.
 */
function parseLiveBody(responseText: string, requestedModel: string): SystemOneResponse {
  let body: unknown;
  try {
    body = JSON.parse(responseText);
  } catch {
    throw new ContractError("Invalid response JSON.");
  }
  if (isObject(body) && isObject(body.answers) && typeof body.model === "string") {
    return body as SystemOneResponse;
  }
  const content = chatMessageContent(body);
  if (content === undefined) throw new ContractError("Invalid response envelope: expected model and answers.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFence(content));
  } catch {
    throw new ContractError("Invalid response JSON.");
  }
  if (!isObject(parsed)) throw new ContractError("Invalid response envelope: expected model and answers.");
  if (typeof parsed.model !== "string" || !parsed.model.trim()) {
    parsed.model = (isObject(body) && typeof body.model === "string" && body.model.trim()) ? body.model : requestedModel;
  }
  if (!isObject(parsed.usage)) {
    const usage = isObject(body) && isObject((body as { usage?: unknown }).usage)
      ? (body as { usage: Record<string, unknown> }).usage
      : undefined;
    const input = usage?.prompt_tokens ?? usage?.input_tokens;
    const output = usage?.completion_tokens ?? usage?.output_tokens;
    parsed.usage = {
      input_tokens: input,
      output_tokens: output,
      ...(typeof usage?.cost === "number" ? { cost: usage.cost } : {}),
    };
  }
  return parsed as SystemOneResponse;
}

function chatMessageContent(body: unknown): string | undefined {
  if (!isObject(body) || !Array.isArray(body.choices) || !isObject(body.choices[0])) return undefined;
  const message = body.choices[0].message;
  if (!isObject(message) || typeof message.content !== "string") return undefined;
  return message.content;
}

function stripFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

function resultCost(response: SystemOneResponse, provider: JevProvider, pricing?: JevPricing): JevCost {
  if (provider === "mock") return { amount: 0, source: "mock" };
  if (isNonnegative(response.usage.cost)) return { amount: response.usage.cost, source: "reported" };
  if (pricing) {
    const amount = response.usage.input_tokens / 1_000_000 * pricing.inputPerMillion +
      response.usage.output_tokens / 1_000_000 * pricing.outputPerMillion;
    if (isNonnegative(amount)) return { amount, source: "estimated" };
  }
  return { amount: null, source: "unknown" };
}

function withMeta(
  raw: JevRawExchange,
  provider: JevProvider,
  requestedModel: string,
  started: number,
  attempts: number,
  pricing?: JevPricing
): SystemOneResult {
  return {
    // Separate nested answers/usage from raw; enrichment never edits provider data.
    ...structuredClone(raw.response),
    raw,
    meta: {
      provider,
      requestedModel,
      resolvedModel: raw.response.model,
      elapsedMs: Math.round(performance.now() - started),
      attempts,
      cost: resultCost(raw.response, provider, pricing),
    },
  };
}

/** Ignore malformed/negative values instead of letting NaN erase the backoff. */
function retryAfterMs(header: string | null): number {
  if (!header?.trim()) return 0;
  const value = header.trim();
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    const ms = Number(value) * 1000;
    return Number.isFinite(ms) ? ms : 0;
  }
  // HTTP-date forms begin with a weekday; Date.parse alone also accepts "-1".
  if (!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(value)) return 0;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

const isObject = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const isNonnegative = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x >= 0;
const isUnit = (x: unknown): x is number => isNonnegative(x) && x <= 1;
const isTokenCount = (x: unknown): x is number => isNonnegative(x) && Number.isSafeInteger(x);

/** Strict live contract; unknown payload fields are deliberately retained. */
export function validateResponse(response: unknown, questions: Questions): asserts response is SystemOneResponse {
  if (!isObject(response) || !isObject(response.answers) || typeof response.model !== "string" || !response.model.trim()) {
    throw new ContractError("Invalid response envelope: expected model and answers.");
  }
  if (!isObject(response.usage) || !isTokenCount(response.usage.input_tokens) || !isTokenCount(response.usage.output_tokens)) {
    throw new ContractError("Invalid response usage: expected nonnegative integer input_tokens and output_tokens.");
  }
  for (const [id, q] of Object.entries(questions)) {
    const answer = response.answers[id];
    if (!Object.hasOwn(response.answers, id) || !isObject(answer) || answer.type !== q.type) {
      throw new ContractError(`Missing or mismatched answer: ${id}`);
    }
    if (q.type === "noul") {
      if (!isUnit(answer.noul)) throw new ContractError(`Invalid noul: ${id}`);
      continue;
    }
    if (!isUnit(answer.confidence) || !isObject(answer.probabilities)) {
      throw new ContractError(`Invalid distribution: ${id}`);
    }
    const keys = q.type === "choice" ? Object.keys(q.criteria) : q.criteria.map((_, i) => String(i));
    const probs = answer.probabilities;
    if (Object.keys(probs).length !== keys.length || !keys.every((k) => Object.hasOwn(probs, k) && isUnit(probs[k]))) {
      throw new ContractError(`Distribution keys must match the declared criteria: ${id}`);
    }
    const sum = keys.reduce((acc, k) => acc + (probs[k] as number), 0);
    if (Math.abs(sum - 1) > 0.025) throw new ContractError(`Distribution does not sum to one: ${id} (${sum})`);
    if (q.type === "choice" && (typeof answer.choice !== "string" || !keys.includes(answer.choice))) {
      throw new ContractError(`Undeclared choice returned: ${id}`);
    }
    if (q.type === "score") {
      if (!isNonnegative(answer.score) || answer.score > keys.length - 1) {
        throw new ContractError(`Score out of range: ${id}`);
      }
      const legend = answer.legend;
      if (!isObject(legend) || Object.keys(legend).length !== keys.length ||
        !keys.every((k, i) => Object.hasOwn(legend, k) && legend[k] === q.criteria[i])) {
        throw new ContractError(`Score legend must match the declared criteria: ${id}`);
      }
    }
  }
}

let _shared: JevClient | undefined;

/** Lazily constructed; provider and credentials resolve only on first use. */
export function sharedJev(): JevClient {
  if (!_shared) _shared = new JevClient();
  return _shared;
}

/** Shared client for every level. Use JEV_BACKEND=mock for an offline demo. */
export const jev = new Proxy({} as JevClient, {
  get(_target, prop) {
    const value = (sharedJev() as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(sharedJev()) : value;
  },
});
