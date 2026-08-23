import type {
  Competition,
  GearItem,
  ManagerAlert,
  OfficeSummary,
  OnboardingRecruit,
  PendingDealApproval,
  RepPerformance,
  TeamRosterEntry,
  TeamSnapshot,
  TurfAreaSummary,
} from 'types/manager.types';

const ROSTER_SEED: ReadonlyArray<
  readonly [string, string, TeamRosterEntry['roleGroup'], TeamRosterEntry['activityState'], number, number, string | null]
> = [
  ['Jake', 'Morrison', 'Setters', 'knocking', 46, 4, 'Pecan Hollow'],
  ['Maria', 'Santos', 'Closers', 'knocking', 31, 11, 'Lakeview East'],
  ['Isabella', 'Reyes', 'Self Gens', 'idle', 27, 74, 'Firewheel North'],
  ['Devon', 'Carter', 'Setters', 'knocking', 22, 2, 'Pecan Hollow'],
  ['Tommy', 'Nguyen', 'Setters', 'idle', 18, 128, 'Oakridge'],
  ['Sarah', 'Kim', 'Closers', 'knocking', 15, 7, 'Lakeview East'],
  ['Marcus', 'Webb', 'Self Gens', 'offline', 9, 214, null],
  ['Elena', 'Vasquez', 'Setters', 'offline', 0, 388, null],
];

export const SAMPLE_TEAM_ROSTER: readonly TeamRosterEntry[] = ROSTER_SEED.map(
  ([firstName, lastName, roleGroup, activityState, knocksToday, lastActivityMinutesAgo, currentAreaName], index) => ({
    repId: 100 + index,
    firstName,
    lastName,
    roleGroup,
    officeName: index % 3 === 2 ? 'Kaos Cartel' : 'Suntrappers',
    activityState,
    knocksToday,
    lastActivityMinutesAgo,
    currentAreaName,
  }),
);

export const SAMPLE_TEAM_SNAPSHOT: TeamSnapshot = {
  knocksToday: 168,
  knocksChangePct: 12,
  appointmentsToday: 14,
  appointmentsChangePct: -8,
  dealsToday: 3,
  dealsChangePct: 50,
  repsActive: 5,
  repsTotal: 8,
};

export const SAMPLE_MANAGER_ALERTS: readonly ManagerAlert[] = [
  { id: 1, kind: 'inactivity', message: 'Tommy Nguyen has not logged a knock in 2 hours', minutesAgo: 8 },
  { id: 2, kind: 'appointment', message: "Maria Santos' 4:30 appointment has no confirmation", minutesAgo: 22 },
  { id: 3, kind: 'aging-lead', message: '3 leads assigned to Marcus Webb aging past 48h with no follow-up', minutesAgo: 51 },
  { id: 4, kind: 'inactivity', message: 'Elena Vasquez has been offline since yesterday', minutesAgo: 190 },
];

export function buildSampleRepPerformance(repId: number): RepPerformance {
  const entry = SAMPLE_TEAM_ROSTER.find((rep) => rep.repId === repId) ?? SAMPLE_TEAM_ROSTER[0];
  const scale = 1 + ((entry.repId % 5) * 0.18);
  return {
    repId: entry.repId,
    firstName: entry.firstName,
    lastName: entry.lastName,
    roleGroup: entry.roleGroup,
    officeName: entry.officeName,
    weekFunnel: {
      knocks: Math.round(210 * scale),
      conversations: Math.round(64 * scale),
      appointments: Math.round(11 * scale),
      closes: Math.round(2.4 * scale),
    },
    teamAverageFunnel: { knocks: 236, conversations: 71, appointments: 12, closes: 3 },
    pipelineValue: Math.round(41_500 * scale),
    weeklyGoalKnocks: 250,
    trend: [3, 5, 4, 7, 6, 9, 8].map((value) => Math.round(value * scale)),
  };
}

export const SAMPLE_APPROVAL_QUEUE: readonly PendingDealApproval[] = [
  {
    id: 9001, customerName: 'Rosa Delgado', address: '412 Pecan Hollow Dr, Garland, TX 75043',
    repName: 'Maria Santos', systemSizeKw: 12.3, grossPricePerWatt: 3.42, netPricePerWatt: 2.87,
    submittedHoursAgo: 2, status: 'pending',
  },
  {
    id: 9002, customerName: 'Hank Porter', address: '318 Lakeview Ct, Garland, TX 75043',
    repName: 'Sarah Kim', systemSizeKw: 9.72, grossPricePerWatt: 3.95, netPricePerWatt: 3.40,
    submittedHoursAgo: 5, status: 'pending',
  },
  {
    id: 9003, customerName: 'Iris Chen', address: '77 Firewheel Pkwy, Garland, TX 75040',
    repName: 'Jake Morrison', systemSizeKw: 14.2, grossPricePerWatt: 3.28, netPricePerWatt: 2.73,
    submittedHoursAgo: 26, status: 'pending',
  },
];

export const SAMPLE_TURF_AREAS: readonly TurfAreaSummary[] = [
  { id: 501, name: 'Pecan Hollow', assignedRepName: 'Jake Morrison', doorsTotal: 420, doorsKnockedThisWeek: 311, lastWorkedDaysAgo: 0, conversionRatePct: 4.2 },
  { id: 502, name: 'Lakeview East', assignedRepName: 'Maria Santos', doorsTotal: 380, doorsKnockedThisWeek: 194, lastWorkedDaysAgo: 0, conversionRatePct: 3.1 },
  { id: 503, name: 'Firewheel North', assignedRepName: 'Isabella Reyes', doorsTotal: 512, doorsKnockedThisWeek: 88, lastWorkedDaysAgo: 1, conversionRatePct: 5.6 },
  { id: 504, name: 'Oakridge', assignedRepName: 'Tommy Nguyen', doorsTotal: 290, doorsKnockedThisWeek: 41, lastWorkedDaysAgo: 2, conversionRatePct: 2.4 },
  { id: 505, name: 'Duck Creek', assignedRepName: null, doorsTotal: 465, doorsKnockedThisWeek: 0, lastWorkedDaysAgo: 9, conversionRatePct: 3.8 },
  { id: 506, name: 'Club Hill Estates', assignedRepName: null, doorsTotal: 233, doorsKnockedThisWeek: 0, lastWorkedDaysAgo: null, conversionRatePct: 0 },
];

export const SAMPLE_OFFICES: readonly OfficeSummary[] = [
  { id: 1, name: 'Suntrappers', city: 'Garland, TX', repsCount: 14, dealsThisMonth: 21, knocksThisWeek: 1240 },
  { id: 2, name: 'Kaos Cartel', city: 'Dallas, TX', repsCount: 9, dealsThisMonth: 12, knocksThisWeek: 730 },
  { id: 3, name: 'Firewheel Squad', city: 'Richardson, TX', repsCount: 6, dealsThisMonth: 7, knocksThisWeek: 415 },
];

export const SAMPLE_GEAR: readonly GearItem[] = [
  { id: 1, name: 'Suntapped polo', category: 'Apparel', priceUsd: 32, inStock: true },
  { id: 2, name: 'Sun hoodie', category: 'Apparel', priceUsd: 48, inStock: true },
  { id: 3, name: 'Dad hat', category: 'Apparel', priceUsd: 22, inStock: false },
  { id: 4, name: 'Door hangers (500)', category: 'Print', priceUsd: 65, inStock: true },
  { id: 5, name: 'Yard signs (25)', category: 'Print', priceUsd: 110, inStock: true },
  { id: 6, name: 'Tablet chest rig', category: 'Field kit', priceUsd: 74, inStock: true },
  { id: 7, name: 'Battery bank', category: 'Field kit', priceUsd: 39, inStock: true },
];

export const SAMPLE_ONBOARDING: readonly OnboardingRecruit[] = [
  { id: 1, firstName: 'Cole', lastName: 'Bennett', officeName: 'Suntrappers', stage: 'Ready', daysInStage: 1 },
  { id: 2, firstName: 'Priya', lastName: 'Shah', officeName: 'Suntrappers', stage: 'Training', daysInStage: 3 },
  { id: 3, firstName: 'Marcus', lastName: 'Lee', officeName: 'Kaos Cartel', stage: 'Docs', daysInStage: 6 },
  { id: 4, firstName: 'Dana', lastName: 'Ortiz', officeName: 'Firewheel Squad', stage: 'Invited', daysInStage: 2 },
];

export const SAMPLE_COMPETITIONS: readonly Competition[] = [
  { id: 71, name: 'Blitz Weekend', metric: 'Knocks', endsInDays: 2, prize: '$250 + steak dinner', leaderName: 'Jake Morrison' },
  { id: 72, name: 'September Setters Cup', metric: 'Appointments', endsInDays: 18, prize: 'Top-of-leaderboard banner', leaderName: 'Devon Carter' },
];
