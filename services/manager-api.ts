import type {
  CompetitionEvent,
  CompetitionStanding,
  GearItem,
  ManagerAlert,
  OfficeSummary,
  OfficeTeam,
  OnboardingRecruit,
  RepPerformance,
  TeamRosterEntry,
  TeamSnapshot,
  TurfAreaSummary,
} from 'types/manager.types';
import { apiClient } from 'services/api-client';
import { DEMO_STATS_ENABLED, demoInt, demoOfficeStats } from 'services/demo-stats';
import {
  buildSampleRepPerformance,
  SAMPLE_COMPETITION_EVENTS,
  SAMPLE_GEAR,
  SAMPLE_MANAGER_ALERTS,
  SAMPLE_OFFICES,
  SAMPLE_OFFICE_TEAMS,
  SAMPLE_ONBOARDING,
  SAMPLE_TEAM_ROSTER,
  SAMPLE_TEAM_SNAPSHOT,
  SAMPLE_TURF_AREAS,
} from 'services/sample-team';

/**
 * Real staging calls with sample fallback: every fetcher tries the live
 * Radiabase API first and falls back to its sample payload when the call
 * fails (offline, logged-out preview, endpoint not deployed). Aborts are
 * re-thrown so screens can ignore stale requests.
 */
async function realOrSample<T>(label: string, real: () => Promise<T>, sample: T): Promise<T> {
  try {
    return await real();
  } catch (error) {
    const name = (error as Error)?.name;
    const code = (error as { code?: string })?.code;
    if (name === 'AbortError' || name === 'CanceledError' || code === 'ERR_CANCELED') {
      throw error;
    }
    if (__DEV__) {
      console.log(`[manager-api] ${label}: sample fallback (${(error as Error)?.message})`);
    }
    return sample;
  }
}

function daysBetween(fromIso: string | null | undefined, to: Date): number {
  if (!fromIso) {
    return 0;
  }
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) {
    return 0;
  }
  return Math.max(0, Math.floor((to.getTime() - from) / 86_400_000));
}

/** Brand accents cycled across offices that have no stored color yet. */
const OFFICE_ACCENTS = ['#00D1EA', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#0E87CC', '#A855F7', '#16A34A'] as const;

/** Metro anchors for offices the API doesn't geocode yet (design flavor). */
const OFFICE_FLAVOR: Record<string, { readonly city: string; readonly latitude: number; readonly longitude: number }> = {
  Suntrappers: { city: 'Garland, TX', latitude: 32.9126, longitude: -96.6389 },
  'Kaos Cartel': { city: 'Dallas, TX', latitude: 32.7767, longitude: -96.797 },
  'Dallas Dawgs': { city: 'Dallas, TX', latitude: 32.7867, longitude: -96.808 },
  'OKC West': { city: 'Oklahoma City, OK', latitude: 35.4676, longitude: -97.5164 },
  Louisville: { city: 'Louisville, KY', latitude: 38.2527, longitude: -85.7585 },
};

type ApiOffice = {
  readonly id: number;
  readonly name: string;
  readonly is_office?: boolean;
  readonly status?: string;
  readonly director_name?: string | null;
};

type ApiUser = {
  readonly id: number;
  readonly first_name?: string | null;
  readonly last_name?: string | null;
  readonly full_name?: string | null;
  readonly office_name?: string | null;
  readonly sales_role?: string | null;
  readonly status?: string | null;
  readonly last_login?: string | null;
};

async function fetchAllOfficesRaw(signal?: AbortSignal): Promise<readonly ApiOffice[]> {
  const response = await apiClient.get<readonly ApiOffice[]>('/offices/all', { signal });
  return (response.data ?? []).filter((office) => office.is_office !== false && office.status !== 'inactive');
}

async function fetchAllUsersRaw(signal?: AbortSignal): Promise<readonly ApiUser[]> {
  const response = await apiClient.get<readonly ApiUser[]>('/users/all', { signal });
  return response.data ?? [];
}

/** Simulated network latency so loading states behave like real fetches. */
const SAMPLE_LATENCY_MS = 350;

function sampleResponse<T>(data: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(data), SAMPLE_LATENCY_MS);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      // Hermes has no DOMException; a named Error matches axios' abort shape.
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      reject(abortError);
    });
  });
}

// GET /area-management/field-stats + /users/all (change% needs a history
// endpoint that does not exist yet, so it reads 0 on live data).
export async function fetchTeamSnapshot(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<TeamSnapshot> {
  return realOrSample('team-snapshot', async () => {
    const [statsResponse, users] = await Promise.all([
      apiClient.get<{
        readonly today: { readonly leads: number; readonly knocks: number; readonly customers: number };
      }>('/area-management/field-stats', { signal: input.signal }),
      fetchAllUsersRaw(input.signal),
    ]);
    const today = statsResponse.data?.today ?? { leads: 0, knocks: 0, customers: 0 };
    const activeUsers = users.filter((user) => user.status === 'active' && user.sales_role);
    const now = new Date();
    const activeToday = activeUsers.filter((user) => daysBetween(user.last_login, now) < 1);
    return {
      knocksToday: today.knocks,
      // Change % needs a stats-history endpoint; demo deltas until then.
      knocksChangePct: DEMO_STATS_ENABLED ? demoInt('kc', -9, 24) : 0,
      appointmentsToday: today.leads,
      appointmentsChangePct: DEMO_STATS_ENABLED ? demoInt('ac', -12, 18) : 0,
      dealsToday: today.customers,
      dealsChangePct: DEMO_STATS_ENABLED ? demoInt('dc', -10, 30) : 0,
      repsActive: activeToday.length,
      repsTotal: activeUsers.length,
    };
  }, SAMPLE_TEAM_SNAPSHOT);
}

// GET /users/all mapped to the roster. Per-rep knock counts need a
// team-activity endpoint that does not exist yet, so knocksToday is 0 on
// live data; activity state derives from last_login recency.
export async function fetchTeamRoster(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly TeamRosterEntry[]> {
  return realOrSample('team-roster', async () => {
    const users = await fetchAllUsersRaw(input.signal);
    const now = Date.now();
    const reps = users.filter((user) => user.status === 'active' && user.sales_role);
    if (reps.length === 0) {
      throw new Error('empty roster');
    }
    return reps
      .map((user) => {
        const lastLogin = user.last_login ? new Date(user.last_login).getTime() : 0;
        const minutesAgo = lastLogin > 0 ? Math.max(0, Math.floor((now - lastLogin) / 60_000)) : 999_999;
        const roleGroup: TeamRosterEntry['roleGroup'] =
          user.sales_role === 'closer' ? 'Closers' : user.sales_role === 'setter' ? 'Setters' : 'Self Gens';
        const activityState = (minutesAgo < 60 ? 'knocking' : minutesAgo < 480 ? 'idle' : 'offline') as TeamRosterEntry['activityState'];
        return {
          repId: user.id,
          firstName: user.first_name ?? user.full_name?.split(' ')[0] ?? 'Rep',
          lastName: user.last_name ?? '',
          roleGroup,
          officeName: user.office_name ?? '—',
          activityState,
          // Per-rep knock counts need a team-activity endpoint; demo
          // numbers for non-offline reps keep the roster reviewable.
          knocksToday: DEMO_STATS_ENABLED && activityState !== 'offline' ? demoInt(`kn${user.id}`, 8, 52) : 0,
          lastActivityMinutesAgo: minutesAgo,
          currentAreaName: null,
        };
      })
      .sort((a, b) => a.lastActivityMinutesAgo - b.lastActivityMinutesAgo)
      .slice(0, 12);
  }, SAMPLE_TEAM_ROSTER);
}

// Seam: GET /team/alerts?managerId=
export async function fetchManagerAlerts(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly ManagerAlert[]> {
  return sampleResponse(SAMPLE_MANAGER_ALERTS, input.signal);
}

// Seam: GET /team/reps/:repId/performance?period=week
export async function fetchRepPerformance(input: {
  readonly repId: number;
  readonly signal?: AbortSignal;
}): Promise<RepPerformance> {
  return sampleResponse(buildSampleRepPerformance(input.repId), input.signal);
}

// Seam: PUT /team/reps/:repId/goals body={weeklyGoalKnocks}
export async function saveRepWeeklyGoal(input: {
  readonly repId: number;
  readonly weeklyGoalKnocks: number;
}): Promise<void> {
  return sampleResponse(undefined);
}

// Seam: GET /area-management/turf-summary?managerId=
export async function fetchTurfSummary(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly TurfAreaSummary[]> {
  return sampleResponse(SAMPLE_TURF_AREAS, input.signal);
}

// Seam: PUT /area-management/areas/:areaId/assign body={repId}
export async function assignTurfArea(input: {
  readonly areaId: number;
  readonly repId: number;
}): Promise<void> {
  return sampleResponse(undefined);
}

// GET /offices/all + /users/all. Deals / installs / cancels per office
// need reporting endpoints that are not wired yet, so they read 0 on live
// data; city/coordinates/accent are client-side flavor until stored.
export async function fetchOffices(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly OfficeSummary[]> {
  return realOrSample('offices', async () => {
    const [offices, users] = await Promise.all([
      fetchAllOfficesRaw(input.signal),
      fetchAllUsersRaw(input.signal),
    ]);
    if (offices.length === 0) {
      throw new Error('no offices');
    }
    const repsByOffice = new Map<string, number>();
    for (const user of users) {
      if (user.status === 'active' && user.sales_role && user.office_name) {
        repsByOffice.set(user.office_name, (repsByOffice.get(user.office_name) ?? 0) + 1);
      }
    }
    return offices
      .map((office, index) => {
        const flavor = OFFICE_FLAVOR[office.name];
        const repsCount = repsByOffice.get(office.name) ?? 0;
        // Deal/knock metrics have no reporting endpoint yet; demo numbers
        // keep offices reviewable (services/demo-stats.ts).
        const stats = DEMO_STATS_ENABLED
          ? demoOfficeStats(office.id, repsCount)
          : { knocksThisWeek: 0, dealsThisMonth: 0, installsThisMonth: 0, cancelsThisMonth: 0 };
        return {
          id: office.id,
          name: office.name,
          city: flavor?.city ?? 'Dallas, TX',
          repsCount,
          dealsThisMonth: stats.dealsThisMonth,
          knocksThisWeek: stats.knocksThisWeek,
          installsThisMonth: stats.installsThisMonth,
          cancelsThisMonth: stats.cancelsThisMonth,
          managerName: office.director_name ?? '—',
          managerPortrait: '',
          latitude: flavor?.latitude ?? 32.7767 + (index % 5) * 0.03,
          longitude: flavor?.longitude ?? -96.797 - (index % 7) * 0.04,
          accentColor: OFFICE_ACCENTS[index % OFFICE_ACCENTS.length],
        };
      })
      .sort((a, b) => b.repsCount - a.repsCount);
  }, SAMPLE_OFFICES);
}

// Seam: GET /teams?managerId= (teams grouped client-side by officeName)
export async function fetchOfficeTeams(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly OfficeTeam[]> {
  return sampleResponse(SAMPLE_OFFICE_TEAMS, input.signal);
}

// Seam: GET /gear/catalog
export async function fetchGearCatalog(input: {
  readonly signal?: AbortSignal;
}): Promise<readonly GearItem[]> {
  return sampleResponse(SAMPLE_GEAR, input.signal);
}

type ApiInvitedUser = {
  readonly id: number;
  readonly first_name?: string | null;
  readonly last_name?: string | null;
  readonly full_name?: string | null;
  readonly office_id?: number | null;
  readonly status?: string | null;
  readonly sent_at?: string | null;
};

type ApiDirectRecruit = {
  readonly id: number;
  readonly full_name?: string | null;
  readonly status?: string | null;
  readonly office?: { readonly name?: string | null } | null;
};

// GET /onboarding/invited-users + /onboarding/direct-recruits. Invites map
// to the Invited stage; signed-up recruits map to Training (pending) or
// Ready (active). Docs/Training granularity needs its own tracking later.
export async function fetchOnboardingRecruits(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly OnboardingRecruit[]> {
  return realOrSample('onboarding', async () => {
    const now = new Date();
    const [invitedResponse, recruitsResponse, offices] = await Promise.all([
      apiClient.get<{ readonly data?: readonly ApiInvitedUser[] }>('/onboarding/invited-users', {
        params: { limit: 50 },
        signal: input.signal,
      }),
      apiClient.get<{ readonly data?: readonly ApiDirectRecruit[] }>('/onboarding/direct-recruits', {
        params: { limit: 50 },
        signal: input.signal,
      }),
      fetchAllOfficesRaw(input.signal),
    ]);
    const officeNames = new Map(offices.map((office) => [office.id, office.name]));
    const invited = (invitedResponse.data?.data ?? []).map((invite) => {
      const [first, ...rest] = (invite.full_name ?? `${invite.first_name ?? ''} ${invite.last_name ?? ''}`).trim().split(' ');
      return {
        id: invite.id,
        firstName: invite.first_name ?? first ?? 'Recruit',
        lastName: invite.last_name ?? rest.join(' '),
        portrait: '',
        officeName: officeNames.get(invite.office_id ?? -1) ?? '—',
        stage: 'Invited' as const,
        daysInStage: daysBetween(invite.sent_at, now),
      };
    });
    const recruits = (recruitsResponse.data?.data ?? []).map((recruit) => {
      const [first, ...rest] = (recruit.full_name ?? 'Recruit').trim().split(' ');
      return {
        id: 1_000_000 + recruit.id,
        firstName: first,
        lastName: rest.join(' '),
        portrait: '',
        officeName: recruit.office?.name ?? '—',
        stage: (recruit.status === 'active' ? 'Ready' : 'Training') as OnboardingRecruit['stage'],
        daysInStage: 0,
      };
    });
    const combined = [...invited, ...recruits];
    if (combined.length === 0) {
      throw new Error('no recruits');
    }
    return combined;
  }, SAMPLE_ONBOARDING);
}

// POST /onboarding/invite — real direct invite into the org.
export async function inviteOnboardingRecruit(input: {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly officeId: number;
  readonly salesOrgId: number;
  readonly invitedByUserId: number;
}): Promise<void> {
  await apiClient.post('/onboarding/invite', {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    sales_org_id: input.salesOrgId,
    office_id: input.officeId,
    invited_by_user_id: input.invitedByUserId,
    invite_type: 'direct',
    user_type: 'recruit',
  });
}

// Seam: PUT /onboarding/recruits/:id/advance — moves a recruit one stage
// forward; the sample layer is a no-op and the screen updates local state.
export async function advanceOnboardingRecruit(input: {
  readonly recruitId: number;
}): Promise<void> {
  return sampleResponse(undefined);
}

type ApiCompetitionRound = {
  readonly round: number;
  readonly label: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly advance?: { readonly closer?: number; readonly setter?: number };
};

async function fetchRoundStandings(
  round: ApiCompetitionRound,
  signal: AbortSignal | undefined,
): Promise<readonly CompetitionStanding[]> {
  try {
    const response = await apiClient.get<{
      readonly data?: readonly { readonly salesRep?: string; readonly fullName?: string; readonly totalSales?: number; readonly total?: number }[];
    }>('/competition/round-leaderboard', {
      params: { startDate: round.startDate, endDate: round.endDate, division: 'closer', limit: 3 },
      signal,
    });
    return (response.data?.data ?? [])
      .map((row) => ({
        name: row.salesRep ?? row.fullName ?? '',
        portrait: '',
        value: row.totalSales ?? row.total ?? 0,
      }))
      .filter((row) => row.name.length > 0)
      .slice(0, 3);
  } catch {
    // Standings are additive; rounds still render without them.
    return [];
  }
}

function demoStandings(roundNumber: number, users: readonly ApiUser[]): readonly CompetitionStanding[] {
  // No deals on staging yet: rank real closers with demo values so the
  // bracket is reviewable (services/demo-stats.ts).
  return users
    .filter((user) => user.status === 'active' && user.sales_role === 'closer' && user.full_name)
    .sort((a, b) => demoInt(`cv${roundNumber}-${b.id}`, 1, 9) - demoInt(`cv${roundNumber}-${a.id}`, 1, 9))
    .slice(0, 3)
    .map((user, index) => ({
      name: user.full_name as string,
      portrait: '',
      value: demoInt(`cv${roundNumber}-${user.id}`, 1, 9) + (2 - index),
    }));
}

// GET /competition/rounds + /competition/round-leaderboard, folded into ONE
// event: the server stores a flat round list today, but the product model
// is a main event that owns its rounds. Seam: replace with GET /events once
// the competitions backend is rebuilt.
export async function fetchCompetitionEvents(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly CompetitionEvent[]> {
  return realOrSample('competition-events', async () => {
    const response = await apiClient.get<readonly ApiCompetitionRound[]>('/competition/rounds', {
      signal: input.signal,
    });
    const apiRounds = response.data ?? [];
    if (apiRounds.length === 0) {
      throw new Error('no rounds');
    }
    const now = new Date();
    const users = DEMO_STATS_ENABLED ? await fetchAllUsersRaw(input.signal) : [];
    const rounds = await Promise.all(apiRounds.map(async (round, index) => {
      const isLast = index === apiRounds.length - 1;
      const hasStarted = new Date(`${round.startDate}T00:00:00`).getTime() <= now.getTime();
      let standings: readonly CompetitionStanding[] = hasStarted
        ? await fetchRoundStandings(round, input.signal)
        : [];
      if (standings.length === 0 && hasStarted && DEMO_STATS_ENABLED) {
        standings = demoStandings(round.round, users);
      }
      return {
        roundNumber: round.round,
        label: isLast ? 'Finals' : round.label,
        startDate: round.startDate,
        endDate: round.endDate,
        advance: isLast ? null : {
          ...(round.advance?.setter ? { Setters: round.advance.setter } : {}),
          ...(round.advance?.closer ? { Closers: round.advance.closer } : {}),
        },
        prize: null,
        standings,
      };
    }));
    const closers = users.filter((user) => user.status === 'active' && user.sales_role).length;
    // The server has no event entity yet; the org's configured round list
    // is presented as its one live tournament.
    const liveEvent: CompetitionEvent = {
      id: 1,
      name: 'Closer Cup',
      metric: 'Closes',
      divisions: ['Setters', 'Closers'],
      officeScope: [],
      grandPrize: 'Grand prize TBA',
      participantsCount: closers,
      rounds,
    };
    return [liveEvent, ...SAMPLE_COMPETITION_EVENTS.filter((event) => event.rounds.length === 1)];
  }, SAMPLE_COMPETITION_EVENTS);
}
