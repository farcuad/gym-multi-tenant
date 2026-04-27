export interface ExerciseBody {
  id: number;
  gym_id: number;
  name: string;
  muscle_group: string | null;
  created_at: Date;
}
