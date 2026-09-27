import { encode } from "gpt-tokenizer/encoding/o200k_base";

/** Comparison set from the model-stack board, expensive to cheap, then Jev. USD per 1M tokens. */
export interface PricedModel {
  name: string;
  inPerM: number;
  outPerM: number;
  jev?: boolean;
}

export const MODELS: PricedModel[] = [
  { name: "Fable 5.1", inPerM: 10, outPerM: 50 },
  { name: "Opus 5", inPerM: 5, outPerM: 25 },
  { name: "GPT 5.6 Sol", inPerM: 4, outPerM: 20 },
  { name: "Grok 4.7", inPerM: 2, outPerM: 6 },
  { name: "Gemini 3.8 Flash", inPerM: 0.75, outPerM: 3.75 },
  { name: "DeepSeek V4 Flash", inPerM: 0.14, outPerM: 0.28 },
  { name: "Jev", inPerM: 0.042, outPerM: 0, jev: true },
];

export const VOLUMES = [1, 10, 100, 1_000, 10_000, 100_000, 1_000_000];

/** Token count with the o200k tokenizer (the GPT family's), on the exact text. */
export const countTokens = (text: string): number => encode(text).length;

export interface CostRow {
  model: PricedModel;
  inTokens: number;
  outTokens: number;
  perCall: number;
  atVolume: number[];
  timesJev: number;
}

export interface JevUsage {
  input_tokens: number;
  output_tokens: number;
  /** Present when the endpoint reports it. Used as the measured cost when available. */
  cost?: number;
}

/**
 * One row per model. LLM rows are priced on the tokenized Sent and Received bodies:
 * the same request in, the same JSON out. The Jev row uses the usage the endpoint returned.
 */
export function costRows(sent: string, received: string, usage: JevUsage): CostRow[] {
  const inTok = countTokens(sent);
  const outTok = countTokens(received);
  // Jev output is free, so only input tokens are billed when the endpoint reports no cost.
  const jevPerCall = usage.cost ?? (usage.input_tokens * 0.042) / 1_000_000;
  return MODELS.map((model) => {
    const inTokens = model.jev ? usage.input_tokens : inTok;
    const outTokens = model.jev ? usage.output_tokens : outTok;
    const perCall = model.jev ? jevPerCall : (inTokens * model.inPerM + outTokens * model.outPerM) / 1_000_000;
    return {
      model,
      inTokens,
      outTokens,
      perCall,
      atVolume: VOLUMES.map((v) => perCall * v),
      timesJev: jevPerCall > 0 ? perCall / jevPerCall : 0,
    };
  });
}

/** Money that stays readable from a ten-thousandth of a cent to millions. */
export function money(v: number): string {
  if (v === 0) return "$0";
  if (v >= 1) return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (v >= 0.01) return "$" + v.toFixed(3);
  return "$" + v.toPrecision(2).replace(/e-(\d+)$/, (_, e) => "e-" + e);
}

/** Written out in full so the scale is felt: 1,000,000x, not 1Mx. */
export const volumeLabel = (v: number): string => v.toLocaleString("en-US") + "x";
