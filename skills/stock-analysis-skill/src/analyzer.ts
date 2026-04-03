/**
 * analyzer.ts — LLM/VLM Analysis Layer
 * Dashboard-style stock analysis + optional dividend insights (US stocks)
 */

import ZAI from "z-ai-web-dev-sdk";
import {
  StockData,
  AnalysisResult,
  OutputFormat,
  Market,
  Verdict,
  PositionInfo,
} from "./types";
import { validateStockData } from "./dataFetcher";
import { analyzeDividend, formatDividendMarkdown } from "./dividend";

const MARKET_LABEL: Record<Market, string> = {
  CN: "China A-Share",
  HK: "Hong Kong",
  US: "US Market",
};

// ── Dashboard Prompt ─────────────────────────────────────

function buildDashboardPrompt(
  data: StockData,
  position: PositionInfo | undefined,
  warnings: string[]
): string {
  const warningBlock =
    warnings.length > 0
      ? `⚠️ Data Warnings:\n${warnings.map((w) => `- ${w}`).join("\n")}\n\n`
      : "";

  const positionBlock = position
    ? position.status === "holding"
      ? `User Position: Holding, cost price ${position.cost ?? "unknown"}${
          position.shares ? `, ${position.shares} shares` : ""
        }. Provide profit/loss analysis and suggestions.`
      : `User Position: No holdings.`
    : `User Position: Not provided (give suggestions for both holding and no holding).`;

  return `${warningBlock}${positionBlock}

Stock Data:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

Generate a structured dashboard report:

---

## 📊 Stock Decision Dashboard · ${data.name} (${data.code}) · ${MARKET_LABEL[data.market]}

### 📰 Key Highlights
- Sentiment:
- Earnings outlook:
- Risks:
- Catalysts:

### 📌 Final Verdict
Choose one: Strong Buy / Buy / Hold / Sell

### 📈 Market Data
Include price, open, high, low, volume etc.

### 📊 Analysis
Technical + Fundamental + Capital flow

### 🎯 Strategy
Entry / Stop Loss / Target

---

*This is AI-generated and not financial advice.*
`;
}

// ── Report Prompt ───────────────────────────────────────

function buildReportPrompt(
  data: StockData,
  position: PositionInfo | undefined
): string {
  return `
Stock Report for ${data.name} (${data.code})

Data:
${JSON.stringify(data, null, 2)}

Generate structured report:
- Investment conclusion
- Key insights
- Risks
- Strategy
`;
}

// ── Extract Verdict ─────────────────────────────────────

function extractVerdict(text: string): Verdict {
  const patterns = [
    /Strong Buy|Buy|Hold|Sell/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0] as Verdict;
  }
  return "Hold";
}

// ── Main Analysis ───────────────────────────────────────

export async function analyzeStock(
  data: StockData,
  outputFormat: OutputFormat = "markdown",
  position?: PositionInfo,
  includeDividend = false
): Promise<AnalysisResult> {
  const { valid, warnings } = validateStockData(data);
  const name = data.name ?? data.code;

  if (!valid) {
    return {
      code: data.code,
      market: data.market,
      name,
      verdict: "Hold",
      analysis: `⚠️ Data fetch failed`,
      warnings,
      outputFormat,
      generatedAt: new Date().toISOString(),
    };
  }

  const zai = await ZAI.create();

  const prompt =
    outputFormat === "markdown"
      ? buildDashboardPrompt(data, position, warnings)
      : buildReportPrompt(data, position);

  let analysisText = "No response";

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a professional stock analyst. Do not hallucinate missing data.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    analysisText =
      completion.choices[0]?.message?.content ?? analysisText;
  } catch (err: any) {
    analysisText = `Error: ${err.message}`;
  }

  if (includeDividend && data.market === "US") {
    try {
      const dividend = await analyzeDividend(data.code);
      analysisText += "\n\n" + formatDividendMarkdown(dividend);
    } catch {}
  }

  return {
    code: data.code,
    market: data.market,
    name,
    verdict: extractVerdict(analysisText),
    analysis: analysisText,
    warnings,
    outputFormat,
    generatedAt: new Date().toISOString(),
  };
}

// ── Chart Analysis (FIXED) ───────────────────────────────

export async function analyzeChartImage(
  imageUrl: string,
  stockCode: string
): Promise<string> {
  try {
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a technical analyst expert. Analyze stock chart patterns.",
        },
        {
          role: "user",
          content: `Analyze the stock chart for ${stockCode}:
1. Current pattern
2. Trend direction
3. Support & resistance
4. Volume behavior
5. Trading suggestion`,
        },
      ],
    });

    return completion.choices[0]?.message?.content ?? "No response";
  } catch (err: any) {
    return `Chart analysis failed: ${err.message}`;
  }
}