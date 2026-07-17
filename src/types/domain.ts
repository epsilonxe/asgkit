export interface Course {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface Workshop {
  id: number;
  course_id: number;
  name: string;
  slug: string;
  is_open: boolean;
  created_at: string;
}

export interface Submission {
  id: number;
  workshop_id: number;
  workshop_name: string;
  student_id: string;
  file_names: string[];
  submitted_at: string;
  device_id: string | null;
}
