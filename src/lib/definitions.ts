export type User = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  avatarUrl?: string;
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  department: string;
  issueType: string;
  status: 'Pending' | 'Awaiting Approval' | 'In Progress' | 'Resolved' | 'Rejected';
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
  reportedBy: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  createdAt: string;
};

export type IndianState = {
  code: string;
  name: string;
};

    