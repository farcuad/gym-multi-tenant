export interface RoutineBody {
  id: number;
  gym_id: number;
  trainer_id: number | null;
  name: string;
  description: string | null;
  created_at: Date;
}

export interface RoutineExerciseBody {
  id: number;
  gym_id: number;
  routine_id: number;
  exercise_id: number;
  sets: number;
  reps: string;
  rest_time_seconds: number;
  sort_order: number;
  created_at: Date;
}

export interface ClientRoutineBody {
  id: number;
  gym_id: number;
  client_id: number;
  routine_id: number;
  start_date: Date;
  end_date: Date | null;
  is_active: boolean;
  created_at: Date;
}
