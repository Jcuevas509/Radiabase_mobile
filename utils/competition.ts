import type { CompetitionEvent, CompetitionRound } from 'types/manager.types';

export type CompetitionStatus = 'upcoming' | 'active' | 'ended';

function endOfDay(isoDate: string): number {
  return new Date(`${isoDate}T23:59:59`).getTime();
}

function startOfDay(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00`).getTime();
}

export function roundStatus(round: CompetitionRound, now: Date): CompetitionStatus {
  if (endOfDay(round.endDate) < now.getTime()) {
    return 'ended';
  }
  if (startOfDay(round.startDate) > now.getTime()) {
    return 'upcoming';
  }
  return 'active';
}

export function eventStatus(event: CompetitionEvent, now: Date): CompetitionStatus {
  const first = event.rounds[0];
  const last = event.rounds[event.rounds.length - 1];
  if (!first || !last) {
    return 'ended';
  }
  if (endOfDay(last.endDate) < now.getTime()) {
    return 'ended';
  }
  if (startOfDay(first.startDate) > now.getTime()) {
    return 'upcoming';
  }
  return 'active';
}

/** The round in play (or the next upcoming one between rounds); the final
 * round once the event has ended. */
export function currentRound(event: CompetitionEvent, now: Date): CompetitionRound {
  const active = event.rounds.find((round) => roundStatus(round, now) === 'active');
  if (active) {
    return active;
  }
  const upcoming = event.rounds.find((round) => roundStatus(round, now) === 'upcoming');
  return upcoming ?? event.rounds[event.rounds.length - 1];
}

export function daysLeft(round: CompetitionRound, now: Date): number {
  return Math.max(0, Math.ceil((endOfDay(round.endDate) - now.getTime()) / 86_400_000));
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const startText = `${MONTH_LABELS[start.getMonth()]} ${start.getDate()}`;
  const endText = start.getMonth() === end.getMonth()
    ? `${end.getDate()}`
    : `${MONTH_LABELS[end.getMonth()]} ${end.getDate()}`;
  return `${startText}–${endText}`;
}

export function scopeLabel(event: CompetitionEvent): string {
  if (event.officeScope.length === 0) {
    return 'All offices';
  }
  if (event.officeScope.length === 1) {
    return event.officeScope[0];
  }
  return `${event.officeScope.length} offices`;
}

export function advanceLabel(round: CompetitionRound): string | null {
  if (!round.advance) {
    return null;
  }
  const parts = Object.entries(round.advance)
    .filter(([, count]) => typeof count === 'number' && count > 0)
    .map(([division, count]) => `top ${count} ${division.toLowerCase()}`);
  return parts.length > 0 ? `${parts.join(' + ')} advance` : null;
}
