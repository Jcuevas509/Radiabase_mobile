import type {
  CompetitionEvent,
  OfficeTeam,
  GearItem,
  ManagerAlert,
  OfficeSummary,
  OnboardingRecruit,
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

export const SAMPLE_TURF_AREAS: readonly TurfAreaSummary[] = [
  { id: 501, name: 'Pecan Hollow', assignedRepName: 'Jake Morrison', doorsTotal: 420, doorsKnockedThisWeek: 311, lastWorkedDaysAgo: 0, conversionRatePct: 4.2 },
  { id: 502, name: 'Lakeview East', assignedRepName: 'Maria Santos', doorsTotal: 380, doorsKnockedThisWeek: 194, lastWorkedDaysAgo: 0, conversionRatePct: 3.1 },
  { id: 503, name: 'Firewheel North', assignedRepName: 'Isabella Reyes', doorsTotal: 512, doorsKnockedThisWeek: 88, lastWorkedDaysAgo: 1, conversionRatePct: 5.6 },
  { id: 504, name: 'Oakridge', assignedRepName: 'Tommy Nguyen', doorsTotal: 290, doorsKnockedThisWeek: 41, lastWorkedDaysAgo: 2, conversionRatePct: 2.4 },
  { id: 505, name: 'Duck Creek', assignedRepName: null, doorsTotal: 465, doorsKnockedThisWeek: 0, lastWorkedDaysAgo: 9, conversionRatePct: 3.8 },
  { id: 506, name: 'Club Hill Estates', assignedRepName: null, doorsTotal: 233, doorsKnockedThisWeek: 0, lastWorkedDaysAgo: null, conversionRatePct: 0 },
];

export const SAMPLE_OFFICES: readonly OfficeSummary[] = [
  {
    id: 1, name: 'Suntrappers', city: 'Garland, TX', repsCount: 14, dealsThisMonth: 21,
    knocksThisWeek: 1240, installsThisMonth: 8, cancelsThisMonth: 2,
    managerName: 'Marcus Rivera', managerPortrait: 'men/45',
    latitude: 32.9126, longitude: -96.6389, accentColor: '#00D1EA',
  },
  {
    id: 2, name: 'Kaos Cartel', city: 'Dallas, TX', repsCount: 9, dealsThisMonth: 12,
    knocksThisWeek: 730, installsThisMonth: 5, cancelsThisMonth: 1,
    managerName: 'Tyler Bennett', managerPortrait: 'men/12',
    latitude: 32.7767, longitude: -96.797, accentColor: '#8B5CF6',
  },
  {
    id: 3, name: 'Firewheel Squad', city: 'Richardson, TX', repsCount: 6, dealsThisMonth: 7,
    knocksThisWeek: 415, installsThisMonth: 3, cancelsThisMonth: 0,
    managerName: 'Adam Wolfson', managerPortrait: 'men/32',
    latitude: 32.9483, longitude: -96.7299, accentColor: '#22C55E',
  },
  {
    id: 4, name: 'Buckeye Blitz', city: 'Columbus, OH', repsCount: 8, dealsThisMonth: 9,
    knocksThisWeek: 620, installsThisMonth: 4, cancelsThisMonth: 1,
    managerName: 'Dana Whitfield', managerPortrait: 'women/68',
    latitude: 39.9612, longitude: -82.9988, accentColor: '#F59E0B',
  },
  {
    id: 5, name: 'Old Dominion', city: 'Richmond, VA', repsCount: 7, dealsThisMonth: 6,
    knocksThisWeek: 480, installsThisMonth: 2, cancelsThisMonth: 0,
    managerName: 'Jordan Kim', managerPortrait: 'men/76',
    latitude: 37.5407, longitude: -77.436, accentColor: '#EF4444',
  },
];

export const SAMPLE_OFFICE_TEAMS: readonly OfficeTeam[] = [
  // Suntrappers
  {
    id: 11, name: 'Solar Surge', officeName: 'Suntrappers', emblem: 'flash',
    accentColor: '#00D1EA', points: 1840, pointsThisWeek: 220,
    goalPoints: 2500, goalLabel: 'Topgolf night',
    members: [
      { name: 'Jake Morrison', portrait: 'men/45' },
      { name: 'Maria Santos', portrait: 'women/68' },
      { name: 'Devon Carter', portrait: 'men/23' },
      { name: 'Priya Shah', portrait: 'women/44' },
    ],
  },
  {
    id: 12, name: 'Panel Pushers', officeName: 'Suntrappers', emblem: 'rocket',
    accentColor: '#0E87CC', points: 1420, pointsThisWeek: 140,
    goalPoints: 2500, goalLabel: 'Topgolf night',
    members: [
      { name: 'Sarah Kim', portrait: 'women/12' },
      { name: 'Tommy Nguyen', portrait: 'men/61' },
      { name: 'Alexis Moreno', portrait: 'women/21' },
    ],
  },
  {
    id: 13, name: 'Ray Runners', officeName: 'Suntrappers', emblem: 'sunny',
    accentColor: '#06B6D4', points: 1180, pointsThisWeek: 190,
    goalPoints: 2500, goalLabel: 'Topgolf night',
    members: [
      { name: 'Jordan Kim', portrait: 'men/76' },
      { name: 'Sofia Delgado', portrait: 'women/33' },
      { name: 'Caleb Nguyen', portrait: 'men/37' },
      { name: 'Maya Thompson', portrait: 'women/57' },
    ],
  },
  {
    id: 14, name: 'Kilowatt Krew', officeName: 'Suntrappers', emblem: 'pulse',
    accentColor: '#38BDF8', points: 940, pointsThisWeek: 80,
    goalPoints: 2500, goalLabel: 'Topgolf night',
    members: [
      { name: 'Logan Price', portrait: 'men/85' },
      { name: 'Amara Osei', portrait: 'women/81' },
      { name: 'Isabella Reyes', portrait: 'women/24' },
    ],
  },
  // Kaos Cartel
  {
    id: 15, name: 'Watt Warriors', officeName: 'Kaos Cartel', emblem: 'flame',
    accentColor: '#8B5CF6', points: 1210, pointsThisWeek: 180,
    goalPoints: 2000, goalLabel: 'Steak dinner',
    members: [
      { name: 'Isabella Reyes', portrait: 'women/57' },
      { name: 'Marcus Webb', portrait: 'men/76' },
      { name: 'Jordan Blake', portrait: 'men/85' },
    ],
  },
  {
    id: 16, name: 'Grid Lords', officeName: 'Kaos Cartel', emblem: 'trophy',
    accentColor: '#6D28D9', points: 960, pointsThisWeek: 90,
    goalPoints: 2000, goalLabel: 'Steak dinner',
    members: [
      { name: 'Elena Vasquez', portrait: 'women/33' },
      { name: 'Logan Pierce', portrait: 'men/37' },
      { name: 'Nina Alvarez', portrait: 'women/90' },
      { name: 'Trey Coleman', portrait: 'men/52' },
    ],
  },
  {
    id: 17, name: 'Night Shift', officeName: 'Kaos Cartel', emblem: 'planet',
    accentColor: '#A855F7', points: 720, pointsThisWeek: 150,
    goalPoints: 2000, goalLabel: 'Steak dinner',
    members: [
      { name: 'Omar Haddad', portrait: 'men/29' },
      { name: 'Lena Fischer', portrait: 'women/65' },
      { name: 'Chris Dalton', portrait: 'men/14' },
    ],
  },
  // Firewheel Squad
  {
    id: 18, name: 'Circuit Breakers', officeName: 'Firewheel Squad', emblem: 'trending-up',
    accentColor: '#22C55E', points: 780, pointsThisWeek: 130,
    goalPoints: 1500, goalLabel: 'Team jackets',
    members: [
      { name: 'Sofia Delgado', portrait: 'women/12' },
      { name: 'Caleb Brooks', portrait: 'men/61' },
      { name: 'Maya Thompson', portrait: 'women/33' },
    ],
  },
  {
    id: 19, name: 'Green Machine', officeName: 'Firewheel Squad', emblem: 'leaf',
    accentColor: '#16A34A', points: 610, pointsThisWeek: 100,
    goalPoints: 1500, goalLabel: 'Team jackets',
    members: [
      { name: 'Wes Harmon', portrait: 'men/71' },
      { name: 'Talia Brooks', portrait: 'women/49' },
      { name: 'Ray Delacruz', portrait: 'men/8' },
    ],
  },
  {
    id: 20, name: 'Amp Alliance', officeName: 'Firewheel Squad', emblem: 'star',
    accentColor: '#4ADE80', points: 450, pointsThisWeek: 70,
    goalPoints: 1500, goalLabel: 'Team jackets',
    members: [
      { name: 'Ivy Sandoval', portrait: 'women/15' },
      { name: 'Grant Mercer', portrait: 'men/40' },
    ],
  },
  // Buckeye Blitz
  {
    id: 21, name: 'Buckeye Bolts', officeName: 'Buckeye Blitz', emblem: 'flash',
    accentColor: '#F59E0B', points: 890, pointsThisWeek: 160,
    goalPoints: 1500, goalLabel: 'Cedar Point trip',
    members: [
      { name: 'Dana Whitfield', portrait: 'women/68' },
      { name: 'Ethan Caldwell', portrait: 'men/37' },
      { name: 'Amara Osei', portrait: 'women/81' },
    ],
  },
  {
    id: 22, name: 'Scarlet Chargers', officeName: 'Buckeye Blitz', emblem: 'thunderstorm',
    accentColor: '#D97706', points: 730, pointsThisWeek: 120,
    goalPoints: 1500, goalLabel: 'Cedar Point trip',
    members: [
      { name: 'Noah Reiner', portrait: 'men/19' },
      { name: 'Josie Lang', portrait: 'women/72' },
      { name: 'Miles Turner', portrait: 'men/55' },
      { name: 'Bree Colton', portrait: 'women/38' },
    ],
  },
  {
    id: 23, name: 'High Voltage', officeName: 'Buckeye Blitz', emblem: 'pulse',
    accentColor: '#FBBF24', points: 540, pointsThisWeek: 60,
    goalPoints: 1500, goalLabel: 'Cedar Point trip',
    members: [
      { name: 'Owen Pratt', portrait: 'men/66' },
      { name: 'Cara Whitman', portrait: 'women/28' },
    ],
  },
  // Old Dominion
  {
    id: 24, name: 'Valley Voltage', officeName: 'Old Dominion', emblem: 'rocket',
    accentColor: '#EF4444', points: 640, pointsThisWeek: 110,
    goalPoints: 1500, goalLabel: 'Beach weekend',
    members: [
      { name: 'Jordan Kim', portrait: 'men/76' },
      { name: 'Dana Ortiz', portrait: 'women/21' },
      { name: 'Silas Monroe', portrait: 'men/33' },
    ],
  },
  {
    id: 25, name: 'Coastal Current', officeName: 'Old Dominion', emblem: 'compass',
    accentColor: '#DC2626', points: 520, pointsThisWeek: 90,
    goalPoints: 1500, goalLabel: 'Beach weekend',
    members: [
      { name: 'Harper Ellison', portrait: 'women/54' },
      { name: 'Reid Calloway', portrait: 'men/47' },
      { name: 'June Barlow', portrait: 'women/9' },
    ],
  },
  {
    id: 26, name: 'Blue Ridge Blitz', officeName: 'Old Dominion', emblem: 'trail-sign',
    accentColor: '#F87171', points: 380, pointsThisWeek: 50,
    goalPoints: 1500, goalLabel: 'Beach weekend',
    members: [
      { name: 'Knox Whitaker', portrait: 'men/3' },
      { name: 'Sadie Coleman', portrait: 'women/85' },
    ],
  },
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
  { id: 1, firstName: 'Cole', lastName: 'Bennett', portrait: 'men/11', officeName: 'Suntrappers', stage: 'Ready', daysInStage: 1 },
  { id: 2, firstName: 'Priya', lastName: 'Shah', portrait: 'women/44', officeName: 'Suntrappers', stage: 'Training', daysInStage: 3 },
  { id: 3, firstName: 'Marcus', lastName: 'Lee', portrait: 'men/52', officeName: 'Kaos Cartel', stage: 'Docs', daysInStage: 6 },
  { id: 4, firstName: 'Dana', lastName: 'Ortiz', portrait: 'women/21', officeName: 'Firewheel Squad', stage: 'Invited', daysInStage: 2 },
  { id: 5, firstName: 'Theo', lastName: 'Ramsey', portrait: 'men/64', officeName: 'Buckeye Blitz', stage: 'Invited', daysInStage: 1 },
  { id: 6, firstName: 'Lena', lastName: 'Fischer', portrait: 'women/65', officeName: 'Kaos Cartel', stage: 'Training', daysInStage: 8 },
  { id: 7, firstName: 'Ray', lastName: 'Delacruz', portrait: 'men/8', officeName: 'Firewheel Squad', stage: 'Docs', daysInStage: 2 },
  { id: 8, firstName: 'June', lastName: 'Barlow', portrait: 'women/9', officeName: 'Old Dominion', stage: 'Ready', daysInStage: 4 },
];

export const SAMPLE_COMPETITION_EVENTS: readonly CompetitionEvent[] = [
  {
    id: 90, name: 'Summer Slam', metric: 'Closes',
    divisions: ['Setters', 'Closers'], officeScope: [],
    grandPrize: 'Cabo trip for two', participantsCount: 44,
    rounds: [
      {
        roundNumber: 1, label: 'Round 1', startDate: '2026-06-28', endDate: '2026-07-18',
        advance: { Setters: 12, Closers: 12 }, prize: null,
        standings: [
          { name: 'Jake Morrison', portrait: 'men/45', value: 9 },
          { name: 'Maria Santos', portrait: 'women/68', value: 8 },
          { name: 'Devon Carter', portrait: 'men/23', value: 7 },
        ],
      },
      {
        roundNumber: 2, label: 'Round 2', startDate: '2026-07-19', endDate: '2026-08-08',
        advance: { Setters: 6, Closers: 9 }, prize: null,
        standings: [
          { name: 'Maria Santos', portrait: 'women/68', value: 6 },
          { name: 'Jake Morrison', portrait: 'men/45', value: 5 },
          { name: 'Priya Shah', portrait: 'women/44', value: 4 },
        ],
      },
      {
        roundNumber: 3, label: 'Round 3', startDate: '2026-08-09', endDate: '2026-08-29',
        advance: { Setters: 3, Closers: 3 }, prize: 'Steak dinner',
        standings: [
          { name: 'Jake Morrison', portrait: 'men/45', value: 4 },
          { name: 'Isabella Reyes', portrait: 'women/57', value: 3 },
          { name: 'Maria Santos', portrait: 'women/68', value: 3 },
        ],
      },
      {
        roundNumber: 4, label: 'Finals', startDate: '2026-08-30', endDate: '2026-09-19',
        advance: null, prize: null, standings: [],
      },
    ],
  },
  {
    id: 91, name: 'Blitz Weekend', metric: 'Knocks',
    divisions: ['Everyone'], officeScope: ['Suntrappers'],
    grandPrize: '$250 + steak dinner', participantsCount: 14,
    rounds: [{
      roundNumber: 1, label: 'Blitz Weekend', startDate: '2026-08-22', endDate: '2026-08-26',
      advance: null, prize: null,
      standings: [
        { name: 'Jake Morrison', portrait: 'men/45', value: 128 },
        { name: 'Maria Santos', portrait: 'women/68', value: 121 },
        { name: 'Devon Carter', portrait: 'men/23', value: 117 },
      ],
    }],
  },
  {
    id: 92, name: 'October Kickoff', metric: 'Appointments',
    divisions: ['Setters'], officeScope: [],
    grandPrize: 'Team dinner', participantsCount: 29,
    rounds: [{
      roundNumber: 1, label: 'October Kickoff', startDate: '2026-10-01', endDate: '2026-10-14',
      advance: null, prize: null, standings: [],
    }],
  },
  {
    id: 93, name: 'August Closers Derby', metric: 'Closes',
    divisions: ['Closers'], officeScope: [],
    grandPrize: 'Yeti cooler + bragging rights', participantsCount: 29,
    rounds: [{
      roundNumber: 1, label: 'August Closers Derby', startDate: '2026-07-25', endDate: '2026-08-15',
      advance: null, prize: null,
      standings: [
        { name: 'Maria Santos', portrait: 'women/68', value: 7 },
        { name: 'Jake Morrison', portrait: 'men/45', value: 6 },
        { name: 'Isabella Reyes', portrait: 'women/57', value: 4 },
      ],
    }],
  },
];
