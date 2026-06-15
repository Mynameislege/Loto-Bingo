import { hostContent, Phrase } from '@loto-seniors/host-content';
import { SelectionContext, EngineSession, SelectedPhrase } from './types';

/** Create a fresh session state */
export function createSession(windowSize = 5): EngineSession {
  return { recentPhraseIds: [], windowSize };
}

/**
 * Select the best phrase for the current context.
 * Priority order:
 *   1. Celebration (line/quine/bingo) — always wins
 *   2. Seasonal event (if active)
 *   3. Personal trigger (if present)
 *   4. Tension (if near milestone)
 *   5. Number-specific call (if available)
 *   6. Generic number call
 *   7. Filler
 *   8. Opening / Closing
 *   9. End no-win
 */
export function selectPhrase(
  ctx: SelectionContext,
  session: EngineSession,
): SelectedPhrase {
  const candidates = getCandidates(ctx);
  const filtered = filterRecent(candidates, session.recentPhraseIds);

  // Fall back to full candidate list if all were recently used
  const pool = filtered.length > 0 ? filtered : candidates;

  // Pick randomly from the pool
  const phrase = pool[Math.floor(Math.random() * pool.length)];

  if (!phrase) {
    // Ultimate fallback — should never happen with a populated content file
    return { id: 'fallback', text: 'Et on continue !', audioKey: 'audio/fallback.mp3' };
  }

  updateSession(session, phrase.id);
  return { id: phrase.id, text: phrase.text, audioKey: `audio/${phrase.id}.mp3` };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getCandidates(ctx: SelectionContext): Phrase[] {
  const all = hostContent.phrases;

  // 1. Celebration — highest priority
  if (ctx.celebrationEvent) {
    const event = ctx.isDailyBingo && ctx.celebrationEvent === 'bingo'
      ? 'bingo_daily'
      : ctx.celebrationEvent;
    const cel = all.filter(
      (p) => p.category === 'celebration' && p.celebrationEvent === event,
    );
    if (cel.length > 0) return cel;
  }

  // 2. Opening
  if (ctx.isOpening) {
    const op = all.filter((p) => p.category === 'opening');
    if (op.length > 0) return op;
  }

  // 3. Closing
  if (ctx.isClosing) {
    const cl = all.filter((p) => p.category === 'closing');
    if (cl.length > 0) return cl;
  }

  // 4. End no-win
  if (ctx.isEndNoWin) {
    const en = all.filter((p) => p.category === 'end_no_win');
    if (en.length > 0) return en;
  }

  // 5. Personal trigger
  if (ctx.personalTrigger) {
    const pers = all.filter(
      (p) => p.category === 'personal' && p.personalTrigger === ctx.personalTrigger,
    );
    if (pers.length > 0) return pers;
  }

  // 6. Seasonal
  if (ctx.seasonalEvent) {
    const sea = all.filter(
      (p) => p.category === 'seasonal' && p.seasonalEvent === ctx.seasonalEvent,
    );
    if (sea.length > 0) return sea;
  }

  // 7. Tension
  if (ctx.tensionLevel) {
    const ten = all.filter(
      (p) => p.category === 'tension' && p.tensionLevel === ctx.tensionLevel,
    );
    if (ten.length > 0) return ten;
  }

  // 8. Number-specific call
  if (ctx.ballDrawn !== undefined) {
    const specific = all.filter(
      (p) => p.category === 'number_call' && p.number === ctx.ballDrawn,
    );
    if (specific.length > 0) return specific;

    // 9. Generic number call
    const generic = all.filter(
      (p) => p.category === 'number_call' && p.number === undefined,
    );
    if (generic.length > 0) return generic;
  }

  // 10. Filler fallback
  return all.filter((p) => p.category === 'filler');
}

function filterRecent(phrases: Phrase[], recentIds: string[]): Phrase[] {
  const recentSet = new Set(recentIds);
  return phrases.filter((p) => !recentSet.has(p.id));
}

function updateSession(session: EngineSession, phraseId: string): void {
  session.recentPhraseIds.push(phraseId);
  if (session.recentPhraseIds.length > session.windowSize) {
    session.recentPhraseIds.shift();
  }
}
