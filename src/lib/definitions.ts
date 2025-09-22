
export type User = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  avatarUrl?: string;
  civicPoints?: number;
  idToken?: string; // To be used for authenticated API calls
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  department: string;
  issueType: string;
  status: 'Pending' | 'Awaiting Approval' | 'Registered' | 'In Progress' | 'Resolved' | 'Rejected';
  location: {
    address: string;
    state: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  media: {
    images: string[];
    videos: string[];
    voicemail?: string;
  };
  likes: number;
  dislikes: number;
  reportedById: string; // For improved querying and security rules
  reportedBy: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  createdAt: string;
};

export type IndianState = {
  code: string;
  name: string;
};
