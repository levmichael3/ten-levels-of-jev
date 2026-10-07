/**
 * DevOps Level 5, option C: log analysis router.
 * Route log dumps to automated regex parsing vs. LLM anomaly detection.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";

export type LogRoute = "regex_parser" | "llm_anomaly" | "both";

export type LogRouter = {
  route: LogRoute;
  confidence: number;
  reason: string;
};

/** C: route log analysis to regex or LLM. */
export async function routeLogAnalysis(logSource: string, sampleLines: string, knownPatterns: boolean): Promise<LogRouter> {
  const { answers } = await jev.systemOne({ source: logSource, sample: sampleLines, knownPatterns: knownPatterns.toString() }, {
    structured: noul("Are the logs structured (JSON, CSV, key=value) with known field names?"),
    known_errors: noul("Are the error patterns well-known and documented in existing runbooks?"),
    complexity: choice("What is the complexity of the log analysis needed?", {
      simple: "Count errors, filter by status code, or time-range aggregation",
      medium: "Correlation across services, tracing request IDs, or latency bucketing",
      complex: "Novel failure mode, unknown root cause, or requires cross-reference with code",
    }),
  });

  const structured = answers.structured as NoulAnswer;
  const known = answers.known_errors as NoulAnswer;
  const complexity = answers.complexity as ChoiceAnswer;

  const useRegex = structured.noul > 0.7 && known.noul > 0.7 && complexity.choice === "simple";
  const useLLM = complexity.choice === "complex" || known.noul < 0.3;

  const route: LogRoute = useRegex ? "regex_parser" : useLLM ? "llm_anomaly" : "both";

  return {
    route,
    confidence: complexity.confidence,
    reason: `Structured ${structured.noul.toFixed(2)}, known patterns ${known.noul.toFixed(2)}, complexity ${complexity.choice}`,
  };
}
