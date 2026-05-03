import Anthropic from '@anthropic-ai/sdk';
import { ExtractedMatchData, SetScore } from '@/types';

const client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY ?? '').trim() });

export async function extractMatchFromScreenshot(
  imageBase64: string,
  playerNames: string[],
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<ExtractedMatchData> {
  const prompt = `This is a Playtomic padel match result screenshot. The 4 players in this match are: ${playerNames.join(', ')}.

Extract the following information from the screenshot:
1. Which 2 players are on team 1 and which 2 are on team 2
2. The set scores (e.g. [{team1: 6, team2: 3}, {team1: 6, team2: 4}])
3. Which team won (1 or 2)
4. The match date and time

Return ONLY valid JSON with this exact structure (no markdown, no explanation, just the JSON object):
{
  "team1PlayerNames": ["Player Name 1", "Player Name 2"],
  "team2PlayerNames": ["Player Name 3", "Player Name 4"],
  "sets": [{"team1": 6, "team2": 3}, {"team1": 6, "team2": 4}],
  "winnerTeam": 1,
  "matchDate": "2024-01-15T18:00:00.000Z",
  "confidence": 0.95,
  "rawText": "any relevant raw text extracted from the image"
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
    (data.winnerTeam !== 1 && data.winnerTeam !== 2) ||
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
    winnerTeam: data.winnerTeam as 1 | 2,
    matchDate: data.matchDate as string,
    confidence: data.confidence as number,
    rawText: typeof data.rawText === 'string' ? data.rawText : undefined,
  };
}
