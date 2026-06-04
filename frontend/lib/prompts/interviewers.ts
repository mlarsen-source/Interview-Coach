export interface Interviewer {
  voice: string;
  name: string;
  title: string;
}

export const INTERVIEWERS: Interviewer[] = [
  { voice: "hannah", name: "Hannah", title: "Senior Engineering Manager" },
  { voice: "autumn", name: "Autumn", title: "Lead Software Engineer" },
  { voice: "diana", name: "Diana", title: "Director of Engineering" },
  { voice: "austin", name: "Austin", title: "Staff Engineer" },
  { voice: "daniel", name: "Daniel", title: "Engineering Team Lead" },
  { voice: "troy", name: "Troy", title: "Principal Engineer" },
];

export const DEFAULT_INTERVIEWER = INTERVIEWERS[0];
