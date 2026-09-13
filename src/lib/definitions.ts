export type User = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  avatar_url?: string;
  civic_points?: number;
  idToken?: string;
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  department: string;
  issue_type: string;
  status: string;
  address: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  media_images: string[];
  likes: number;
  dislikes: number;
  reported_by: string;
  created_at: string;
};

export type IndianState = {
  code: string;
  name: string;
};
