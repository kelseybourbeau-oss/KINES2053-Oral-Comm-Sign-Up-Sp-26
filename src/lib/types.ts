export const EVALUATORS = ["kelsey", "jon", "sean", "thomsen"] as const;
export const CLASS_TIMES = ["8:00", "9:00", "10:00"] as const;

export type EvaluatorId = (typeof EVALUATORS)[number];
export type ClassTime = (typeof CLASS_TIMES)[number];

export type BookingRecord = {
  studentName: string;
  classTime: ClassTime;
  assignedEvaluator: EvaluatorId | null;
  updatedAt: string;
};

export type ScheduleStore = {
  availability: Record<EvaluatorId, string[]>;
  bookings: Record<string, BookingRecord>;
};

export type SlotView = {
  id: string;
  dateKey: string;
  dateLabel: string;
  timeLabel: string;
  status: "open" | "unavailable" | "booked";
  studentName: string | null;
  classTime: ClassTime | null;
  assignedEvaluator: EvaluatorId | null;
  availableEvaluators: EvaluatorId[];
};
