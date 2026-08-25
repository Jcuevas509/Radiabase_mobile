import type {
  Competition,
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
import {
  buildSampleRepPerformance,
  SAMPLE_COMPETITIONS,
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
      knocksChangePct: 0,
      appointmentsToday: today.leads,
      appointmentsChangePct: 0,
      dealsToday: today.customers,
      dealsChangePct: 0,
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
        return {
          repId: user.id,
          firstName: user.first_name ?? user.full_name?.split(' ')[0] ?? 'Rep',
          lastName: user.last_name ?? '',
          roleGroup,
          officeName: user.office_name ?? '—',
          activityState: (minutesAgo < 60 ? 'knocking' : minutesAgo < 480 ? 'idle' : 'offline') as TeamRosterEntry['activityState'],
          knocksToday: 0,
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
        return {
          id: office.id,
          name: office.name,
          city: flavor?.city ?? 'Dallas, TX',
          repsCount: repsByOffice.get(office.name) ?? 0,
          dealsThisMonth: 0,
          knocksThisWeek: 0,
          installsThisMonth: 0,
          cancelsThisMonth: 0,
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

// GET /competition/rounds (+ /competition/round-leaderboard for the live
// round's standings). Rounds are the org's real closes tournament.
export async function fetchCompetitions(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly Competition[]> {
  return realOrSample('competitions', async () => {
    const response = await apiClient.get<readonly ApiCompetitionRound[]>('/competition/rounds', {
      signal: input.signal,
    });
    const rounds = response.data ?? [];
    if (rounds.length === 0) {
      throw new Error('no rounds');
    }
    const now = new Date();
    const competitions = await Promise.all(rounds.map(async (round) => {
      const end = new Date(`${round.endDate}T23:59:59`);
      const isEnded = end.getTime() < now.getTime();
      const advanceCloser = round.advance?.closer ?? 0;
      const advanceSetter = round.advance?.setter ?? 0;
      let topThree: Competition['topThree'] = [];
      if (!isEnded) {
        try {
          const standings = await apiClient.get<{
            readonly data?: readonly { readonly salesRep?: string; readonly fullName?: string; readonly totalSales?: number; readonly total?: number }[];
          }>('/competition/round-leaderboard', {
            params: {
              startDate: round.startDate,
              endDate: round.endDate,
              division: 'closer',
              limit: 3,
            },
            signal: input.signal,
          });
          topThree = (standings.data?.data ?? [])
            .map((row) => ({
              name: row.salesRep ?? row.fullName ?? '',
              portrait: '',
              value: row.totalSales ?? row.total ?? 0,
            }))
            .filter((row) => row.name.length > 0)
            .slice(0, 3);
        } catch {
          // Standings are additive; the round list still renders without them.
        }
      }
      return {
        id: round.round,
        name: round.label,
        metric: 'Closes' as const,
        status: (isEnded ? 'ended' : 'active') as Competition['status'],
        officeScope: 'All offices',
        endsInDays: isEnded ? 0 : Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000)),
        participantsCount: advanceCloser + advanceSetter,
        prize: `Top ${advanceCloser} closers + ${advanceSetter} setters advance`,
        leaderName: topThree[0]?.name ?? '—',
        topThree,
      };
    }));
    return competitions;
  }, SAMPLE_COMPETITIONS);
}
