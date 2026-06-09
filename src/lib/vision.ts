import Anthropic from '@anthropic-ai/sdk';
import { ExtractedMatchData, SetScore } from '@/types';

const client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY ?? '').trim() });

export async function extractMatchFromScreenshot(
  imageBase64: string,
  playerNames: string[],
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<ExtractedMatchData> {
  const prompt = `You are reading a Playtomic padel match result screenshot. The 4 players in this match are: ${playerNames.join(', ')}.

IMPORTANT INSTRUCTIONS FOR READING SCORES:
- Playtomic shows scores as sets. Each set has two numbers separated by a dash or slash, e.g. "6-3" means team1 scored 6, team2 scored 3.
- The left/top team is team1 and the right/bottom team is team2.
- Read ALL sets shown (usually 2, sometimes 3).
- The winner is the team that won MORE sets. If each team won 1 set (e.g. 6-3, 3-6), it's a DRAW (winnerTeam = 0).
- Do NOT guess — only use what is clearly visible in the image.
- Match scores in Playtomic look like: "6 / 3" or "6-3" per set.
- Player names in the screenshot may be shortened. Match them to the closest name from the list: ${playerNames.join(', ')}.

Extract:
1. Which 2 players are on team 1 (left/top side) and which 2 are on team 2 (right/bottom side)
2. The set scores as an array — each set is {team1: <games won by team1>, team2: <games won by team2>}
3. Which team won: 1 if team1 won more sets, 2 if team2 won more sets, 0 if it's a draw (equal sets each)
4. The match date and time (use ISO format, e.g. "2024-01-15T18:00:00.000Z")

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "team1PlayerNames": ["Exact Name 1", "Exact Name 2"],
  "team2PlayerNames": ["Exact Name 3", "Exact Name 4"],
  "sets": [{"team1": 6, "team2": 3}, {"team1": 4, "team2": 6}],
  "winnerTeam": 1,
  "matchDate": "2024-01-15T18:00:00.000Z",
  "confidence": 0.95,
  "rawText": "paste any score text you can see in the image here"
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
