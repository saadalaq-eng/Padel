import Anthropic from '@anthropic-ai/sdk';
import { ExtractedMatchData, SetScore } from '@/types';

const client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY ?? '').trim() });

export async function extractMatchFromScreenshot(
  imageBase64: string,
  playerNames: string[],
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<ExtractedMatchData> {
  const prompt = `You are reading a Playtomic padel match result screenshot. The 4 players in this match are: ${playerNames.join(', ')}.

PLAYTOMIC LAYOUT — read it exactly like this:
- The screen is split into TWO horizontal rows. TOP row = Team 1. BOTTOM row = Team 2.
- On the LEFT of each row: player photos and names side by side.
- On the RIGHT: the scores for each SET, arranged in COLUMNS. Left column = Set 1, next column = Set 2, etc.
  - The number in the TOP row for a column = Team 1's games in that set.
  - The number in the BOTTOM row for that same column = Team 2's games in that set.
- A TROPHY icon 🏆 appears on the winning team's row. That team is the winner.
- If no trophy is visible, compare total sets won to decide (or mark as draw if equal).
- The date/time appears in the top-right corner. "Today" means the current date.

EXAMPLE from a real screenshot:
  Top row:    Yazeed M  Abdullah  🏆  2  7  6
  Bottom row: Saad      moham...      6  6  4
  → team1=[Yazeed M, Abdullah], team2=[Saad, moham...], sets=[{team1:2,team2:6},{team1:7,team2:6},{team1:6,team2:4}], winnerTeam=1

PLAYER NAMES: Match screenshot names to the closest player from this list: ${playerNames.join(', ')}. Names may be shortened in the screenshot (e.g. "moham..." = Abdulmohsen).

Return ONLY valid JSON — no markdown, no explanation:
{
  "team1PlayerNames": ["Exact Name 1", "Exact Name 2"],
  "team2PlayerNames": ["Exact Name 3", "Exact Name 4"],
  "sets": [{"team1": 2, "team2": 6}, {"team1": 7, "team2": 6}, {"team1": 6, "team2": 4}],
  "winnerTeam": 1,
  "matchDate": "2024-01-15T06:00:00.000Z",
  "confidence": 0.95,
  "rawText": "paste the raw score numbers you read from the image, e.g. top row: 2 7 6, bottom row: 6 6 4"
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response received from Claude vision API');
  }

  const rawText = textBlock.text.trim();

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Failed to extract JSON from Claude response. Raw response: ${rawText.slice(0, 500)}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from Claude response: ${err instanceof Error ? err.message : String(err)}. Raw JSON: ${jsonMatch[0].slice(0, 500)}`,
    );
  }

  const data = parsed as Record<string, unknown>;

  if (
    !Array.isArray(data.team1PlayerNames) ||
    !Array.isArray(data.team2PlayerNames) ||
    !Array.isArray(data.sets) ||
    (data.winnerTeam !== 0 && data.winnerTeam !== 1 && data.winnerTeam !== 2) ||
    typeof data.matchDate !== 'string' ||
    typeof data.confidence !== 'number'
  ) {
    throw new Error(
      `Extracted JSON is missing required fields or has invalid types. Parsed: ${JSON.stringify(data).slice(0, 500)}`,
    );
  }

  const sets: SetScore[] = (data.sets as Array<Record<string, unknown>>).map((set, index) => {
    if (typeof set.team1 !== 'number' || typeof set.team2 !== 'number') {
      throw new Error(`Set at index ${index} has invalid score values: ${JSON.stringify(set)}`);
    }
    return { team1: set.team1 as number, team2: set.team2 as number };
  });

  return {
    team1PlayerNames: data.team1PlayerNames as string[],
    team2PlayerNames: data.team2PlayerNames as string[],
    sets,
    winnerTeam: data.winnerTeam as 0 | 1 | 2,
    matchDate: data.matchDate as string,
    confidence: data.confidence as number,
    rawText: typeof data.rawText === 'string' ? data.rawText : undefined,
  };
}
