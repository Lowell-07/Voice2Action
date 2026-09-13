export type User = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  avatar_url?: string;
  avatarUrl?: string;
  civic_points?: number;
  civicPoints?: number;
  idToken?: string;
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  department: string;
  issue_type: string;
  issueType?: string;
  status: string;
  address: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  media_images: string[];
  media_voicemail?: string;
  likes: number;
  dislikes: number;
  reported_by: string;
  reported_byId?: string;
  created_at: string;
};

export type IndianState = {
  code: string;
  name: string;
};
