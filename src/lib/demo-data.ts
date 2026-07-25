export type UserRole = "current" | "friend";

export type DemoProfile = {
  id: string;
  displayName: string;
  initials: string;
  role: UserRole;
  avatarUrl?: string;
  accent: "cyan" | "violet";
  joinedAt: string;
};

export type WorkoutPoint = {
  label: string;
  current: number;
  friend: number;
  volume: number;
};

export type WorkoutSummary = {
  id: string;
  userId: string;
  userRole: UserRole;
  title: string;
  type: string;
  date: string;
  durationMinutes: number;
  exerciseCount: number;
  totalSets: number;
  totalReps: number;
  difficulty: number;
  isPersonalRecord?: boolean;
};

export type SkillStatus =
  | "not_started"
  | "learning"
  | "developing"
  | "achieved"
  | "mastered";

export type SkillSummary = {
  id: string;
  userId: string;
  name: string;
  category: "push" | "pull" | "core" | "balance" | "legs";
  progression: string;
  target: string;
  completedStages: number;
  totalStages: number;
  bestLabel: string;
  confidence: number;
  technique: number;
  status: SkillStatus;
  updatedAt: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  milestones: Array<{
    label: string;
    date?: string;
    complete: boolean;
  }>;
};

export type MeasurementPoint = {
  date: string;
  weight: number | null;
  bodyFat?: number;
  waist?: number;
  chest?: number;
  shoulders?: number;
  upperArm?: number;
  forearm?: number;
  thigh?: number;
  calf?: number;
};

export type PersonalRecord = {
  id: string;
  userId: string;
  userRole: UserRole;
  exercise: string;
  value: number;
  unit: "reps" | "sec" | "kg" | "m";
  date: string;
  delta?: number;
};

export type ActivityKind =
  | "workout"
  | "record"
  | "skill"
  | "goal"
  | "challenge"
  | "encouragement";

export type ActivityItem = {
  id: string;
  userId: string;
  userRole: UserRole;
  userName: string;
  userInitials: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  recordMetric?: Pick<PersonalRecord, "value" | "unit">;
  createdAt: string;
  reactions: Array<{
    label: Encouragement;
    count: number;
    reacted?: boolean;
  }>;
};

export type GoalSummary = {
  id: string;
  title: string;
  type: "repetitions" | "hold" | "frequency" | "milestone" | "weight";
  currentValue: number;
  targetValue: number;
  unit: string;
  targetDate: string;
  status: "active" | "completed" | "paused";
  tracking: "automatic" | "manual";
  visibility: "private" | "friend";
};

export type ChallengeSummary = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  currentUserProgress: number;
  friendProgress: number;
  target: number;
  unit: string;
  members: number;
};

export type Encouragement =
  | "Strong work"
  | "New record"
  | "Keep going"
  | "Respect";

export const currentUser: DemoProfile = {
  id: "10000000-0000-4000-8000-000000000001",
  displayName: "Maya Chen",
  initials: "MC",
  role: "current",
  accent: "cyan",
  joinedAt: "2026-02-04",
};

export const friendUser: DemoProfile = {
  id: "10000000-0000-4000-8000-000000000002",
  displayName: "Noah Williams",
  initials: "NW",
  role: "friend",
  accent: "violet",
  joinedAt: "2026-02-11",
};

export const workoutTrend: WorkoutPoint[] = [
  { label: "Mon", current: 1, friend: 1, volume: 820 },
  { label: "Tue", current: 0, friend: 1, volume: 0 },
  { label: "Wed", current: 1, friend: 0, volume: 1040 },
  { label: "Thu", current: 1, friend: 1, volume: 760 },
  { label: "Fri", current: 0, friend: 0, volume: 0 },
  { label: "Sat", current: 1, friend: 1, volume: 1210 },
  { label: "Sun", current: 0, friend: 1, volume: 0 },
];

export const monthlyWorkoutTrend = [
  { label: "Feb", current: 9, friend: 8 },
  { label: "Mar", current: 13, friend: 11 },
  { label: "Apr", current: 15, friend: 14 },
  { label: "May", current: 12, friend: 16 },
  { label: "Jun", current: 17, friend: 15 },
  { label: "Jul", current: 14, friend: 16 },
];

export const exerciseTrend = [
  { label: "Mar 02", pullUps: 5, dips: 8, hold: 9, addedWeight: 0 },
  { label: "Mar 23", pullUps: 7, dips: 10, hold: 12, addedWeight: 2.5 },
  { label: "Apr 13", pullUps: 8, dips: 11, hold: 14, addedWeight: 5 },
  { label: "May 04", pullUps: 9, dips: 13, hold: 17, addedWeight: 7.5 },
  { label: "May 25", pullUps: 10, dips: 14, hold: 18, addedWeight: 10 },
  { label: "Jun 15", pullUps: 11, dips: 15, hold: 21, addedWeight: 12.5 },
  { label: "Jul 20", pullUps: 12, dips: 17, hold: 24, addedWeight: 15 },
];

export const workouts: WorkoutSummary[] = [
  {
    id: "workout-001",
    userId: currentUser.id,
    userRole: "current",
    title: "Pull strength + front lever",
    type: "Pull",
    date: "2026-07-22T18:10:00.000Z",
    durationMinutes: 58,
    exerciseCount: 6,
    totalSets: 24,
    totalReps: 86,
    difficulty: 8,
    isPersonalRecord: true,
  },
  {
    id: "workout-002",
    userId: friendUser.id,
    userRole: "friend",
    title: "Handstand flow",
    type: "Skill",
    date: "2026-07-22T11:35:00.000Z",
    durationMinutes: 43,
    exerciseCount: 5,
    totalSets: 18,
    totalReps: 54,
    difficulty: 7,
  },
  {
    id: "workout-003",
    userId: currentUser.id,
    userRole: "current",
    title: "Push volume",
    type: "Push",
    date: "2026-07-20T16:20:00.000Z",
    durationMinutes: 64,
    exerciseCount: 7,
    totalSets: 27,
    totalReps: 143,
    difficulty: 8,
  },
  {
    id: "workout-004",
    userId: friendUser.id,
    userRole: "friend",
    title: "Legs + Nordic work",
    type: "Legs",
    date: "2026-07-19T15:10:00.000Z",
    durationMinutes: 52,
    exerciseCount: 6,
    totalSets: 22,
    totalReps: 98,
    difficulty: 8,
    isPersonalRecord: true,
  },
];

export const skills: SkillSummary[] = [
  {
    id: "skill-001",
    userId: currentUser.id,
    name: "Front lever",
    category: "pull",
    progression: "Advanced tuck",
    target: "Full front lever",
    completedStages: 3,
    totalStages: 5,
    bestLabel: "12 sec",
    confidence: 7,
    technique: 8,
    status: "developing",
    updatedAt: "2026-07-22",
    milestones: [
      { label: "Tuck", date: "2026-03-02", complete: true },
      { label: "Strong tuck", date: "2026-04-09", complete: true },
      { label: "Advanced tuck", date: "2026-06-21", complete: true },
      { label: "Straddle", complete: false },
      { label: "Full", complete: false },
    ],
  },
  {
    id: "skill-002",
    userId: currentUser.id,
    name: "L-sit",
    category: "core",
    progression: "Full L-sit",
    target: "30 second L-sit",
    completedStages: 4,
    totalStages: 5,
    bestLabel: "24 sec",
    confidence: 9,
    technique: 8,
    status: "achieved",
    updatedAt: "2026-07-20",
    milestones: [
      { label: "One-leg", date: "2026-02-22", complete: true },
      { label: "Tuck", date: "2026-03-12", complete: true },
      { label: "Full 5s", date: "2026-04-02", complete: true },
      { label: "Full 15s", date: "2026-05-28", complete: true },
      { label: "Full 30s", complete: false },
    ],
  },
  {
    id: "skill-003",
    userId: currentUser.id,
    name: "Handstand",
    category: "balance",
    progression: "Freestanding",
    target: "Freestanding 45 sec",
    completedStages: 4,
    totalStages: 6,
    bestLabel: "31 sec",
    confidence: 7,
    technique: 7,
    status: "developing",
    updatedAt: "2026-07-18",
    milestones: [
      { label: "Wall hold", date: "2026-02-15", complete: true },
      { label: "Chest-to-wall", date: "2026-02-28", complete: true },
      { label: "Toe pulls", date: "2026-03-27", complete: true },
      { label: "Freestanding", date: "2026-05-18", complete: true },
      { label: "30 sec", complete: false },
      { label: "45 sec", complete: false },
    ],
  },
  {
    id: "skill-004",
    userId: currentUser.id,
    name: "Muscle-up",
    category: "pull",
    progression: "Band-assisted",
    target: "Strict muscle-up",
    completedStages: 2,
    totalStages: 5,
    bestLabel: "Light band × 3",
    confidence: 6,
    technique: 6,
    status: "learning",
    updatedAt: "2026-07-16",
    milestones: [
      { label: "Chest-to-bar", date: "2026-04-14", complete: true },
      { label: "Band transition", date: "2026-06-08", complete: true },
      { label: "Light band", complete: false },
      { label: "Jumping", complete: false },
      { label: "Strict", complete: false },
    ],
  },
];

export const measurements: MeasurementPoint[] = [
  { date: "2026-02-07", weight: 63.8, bodyFat: 19.4, waist: 71.8, chest: 87.2 },
  { date: "2026-03-08", weight: 63.3, bodyFat: 19.0, waist: 71.1, chest: 87.8 },
  { date: "2026-04-06", weight: 62.9, bodyFat: 18.6, waist: 70.5, chest: 88.4 },
  { date: "2026-05-05", weight: 63.1, bodyFat: 18.3, waist: 70.2, chest: 89.0 },
  { date: "2026-06-04", weight: 62.7, bodyFat: 17.9, waist: 69.8, chest: 89.5 },
  {
    date: "2026-07-03",
    weight: 62.5,
    bodyFat: 17.6,
    waist: 69.4,
    chest: 90.1,
    shoulders: 105.2,
    upperArm: 29.8,
    forearm: 25.6,
    thigh: 53.4,
    calf: 35.1,
  },
  {
    date: "2026-07-21",
    weight: 62.4,
    bodyFat: 17.4,
    waist: 69.2,
    chest: 90.4,
    shoulders: 105.8,
    upperArm: 30.1,
    forearm: 25.8,
    thigh: 53.7,
    calf: 35.2,
  },
];

export const personalRecords: PersonalRecord[] = [
  {
    id: "pr-001",
    userId: currentUser.id,
    userRole: "current",
    exercise: "Strict pull-up",
    value: 12,
    unit: "reps",
    date: "2026-07-22",
    delta: 1,
  },
  {
    id: "pr-002",
    userId: currentUser.id,
    userRole: "current",
    exercise: "L-sit",
    value: 24,
    unit: "sec",
    date: "2026-07-20",
    delta: 3,
  },
  {
    id: "pr-003",
    userId: friendUser.id,
    userRole: "friend",
    exercise: "Nordic curl",
    value: 6,
    unit: "reps",
    date: "2026-07-19",
    delta: 1,
  },
  {
    id: "pr-004",
    userId: currentUser.id,
    userRole: "current",
    exercise: "Weighted dip",
    value: 20,
    unit: "kg",
    date: "2026-07-14",
    delta: 2.5,
  },
];

export const activities: ActivityItem[] = [
  {
    id: "activity-001",
    userId: currentUser.id,
    userRole: "current",
    userName: currentUser.displayName,
    userInitials: currentUser.initials,
    kind: "record",
    title: "New pull-up record",
    detail: "Hit 12 strict reps during Pull strength + front lever.",
    createdAt: "2026-07-22T19:08:00.000Z",
    reactions: [
      { label: "New record", count: 1, reacted: true },
      { label: "Strong work", count: 1 },
    ],
  },
  {
    id: "activity-002",
    userId: friendUser.id,
    userRole: "friend",
    userName: friendUser.displayName,
    userInitials: friendUser.initials,
    kind: "workout",
    title: "Finished Handstand flow",
    detail: "43 minutes · 18 sets · technique focus",
    createdAt: "2026-07-22T12:22:00.000Z",
    reactions: [{ label: "Respect", count: 1 }],
  },
  {
    id: "activity-003",
    userId: currentUser.id,
    userRole: "current",
    userName: currentUser.displayName,
    userInitials: currentUser.initials,
    kind: "skill",
    title: "L-sit milestone",
    detail: "Extended the best hold from 21 to 24 seconds.",
    createdAt: "2026-07-20T17:02:00.000Z",
    reactions: [
      { label: "Strong work", count: 1 },
      { label: "Keep going", count: 1 },
    ],
  },
  {
    id: "activity-004",
    userId: friendUser.id,
    userRole: "friend",
    userName: friendUser.displayName,
    userInitials: friendUser.initials,
    kind: "goal",
    title: "Goal completed",
    detail: "Completed 12 workouts this month with nine days to spare.",
    createdAt: "2026-07-19T16:20:00.000Z",
    reactions: [{ label: "Strong work", count: 2 }],
  },
];

export const goals: GoalSummary[] = [
  {
    id: "goal-001",
    title: "15 strict pull-ups",
    type: "repetitions",
    currentValue: 12,
    targetValue: 15,
    unit: "reps",
    targetDate: "2026-09-15",
    status: "active",
    tracking: "automatic",
    visibility: "friend",
  },
  {
    id: "goal-002",
    title: "30 second L-sit",
    type: "hold",
    currentValue: 24,
    targetValue: 30,
    unit: "sec",
    targetDate: "2026-08-31",
    status: "active",
    tracking: "automatic",
    visibility: "friend",
  },
  {
    id: "goal-003",
    title: "Train four times weekly",
    type: "frequency",
    currentValue: 4,
    targetValue: 4,
    unit: "sessions",
    targetDate: "2026-07-26",
    status: "completed",
    tracking: "automatic",
    visibility: "private",
  },
];

export const challenges: ChallengeSummary[] = [
  {
    id: "challenge-001",
    title: "July consistency",
    description: "Complete 16 well-logged training sessions before month end.",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    currentUserProgress: 14,
    friendProgress: 16,
    target: 16,
    unit: "workouts",
    members: 2,
  },
  {
    id: "challenge-002",
    title: "Five-minute handstand bank",
    description: "Accumulate five minutes of quality freestanding holds.",
    startDate: "2026-07-15",
    endDate: "2026-08-15",
    currentUserProgress: 188,
    friendProgress: 241,
    target: 300,
    unit: "seconds",
    members: 2,
  },
];

export const consistencyCalendar = Array.from({ length: 84 }, (_, index) => {
  const intensityPattern = [0, 1, 0, 2, 1, 0, 3, 0, 1, 2, 0, 0, 1, 3];
  return {
    day: index + 1,
    intensity: intensityPattern[index % intensityPattern.length],
  };
});

export const accountability = {
  explanation:
    "40% planned sessions completed, 25% weekly consistency, 20% skill practice, and 15% complete workout logging.",
  current: {
    score: 92,
    planned: 100,
    consistency: 75,
    skillPractice: 90,
    logging: 100,
  },
  friend: {
    score: 92,
    planned: 100,
    consistency: 100,
    skillPractice: 75,
    logging: 80,
  },
};

export const dashboardDemo = {
  currentUser,
  friend: friendUser,
  stats: {
    streak: 6,
    workoutsThisWeek: 4,
    totalWorkouts: 80,
    currentWeight: 62.4,
    weeklyVolume: 3830,
    skillProgress: 68,
  },
  upcomingWorkout: {
    title: "Handstand + push strength",
    dateLabel: "Tomorrow · 6:30 PM",
    durationLabel: "55 min",
  },
  workoutTrend,
  workouts,
  skills,
  records: personalRecords,
  activities,
};
