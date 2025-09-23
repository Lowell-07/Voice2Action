import type { IndianState, Problem, User } from '@/lib/definitions';

export const indianStates: IndianState[] = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'HR', name: 'Haryana' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MN', name: 'Manipur' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UT', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
];

export const departments = [
    "Electric Department",
    "Municipal Department",
    "Water & Sewerage",
    "Roads & Transport",
];

// Note: mockUsers and mockProblems are no longer used for live data,
// but are kept for reference or testing purposes.

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Anjali Sharma',
    mobile: '9876543210',
    email: 'anjali.s@example.com',
    avatarUrl: 'https://picsum.photos/seed/avatar1/100/100',
    civicPoints: 2450,
  },
  {
    id: 'user-2',
    name: 'Rohan Verma',
    mobile: '8765432109',
    avatarUrl: 'https://picsum.photos/seed/avatar2/100/100',
    civicPoints: 1500,
  },
];


export const mockProblems: Problem[] = [
  {
    id: 'prob-1',
    title: 'Massive Pothole on Main St',
    description: 'A very large and dangerous pothole has formed in the middle of Main Street, causing traffic issues and potential vehicle damage. It has been there for over two weeks.',
    department: 'Roads & Transport',
    issueType: 'Roads & Streets',
    status: 'Resolved',
    location: {
      state: 'Maharashtra',
      city: 'Mumbai',
      address: 'Main Street, Mumbai',
      coordinates: { lat: 19.076, lng: 72.8777 },
    },
    media: {
      images: ['pothole-1'],
      videos: [],
    },
    likes: 15,
    dislikes: 2,
    reportedById: 'user-1',
    reportedBy: {
        id: 'user-1',
        name: 'Anjali Sharma',
        avatarUrl: 'https://picsum.photos/seed/avatar1/100/100'
    },
    createdAt: '2024-05-10T10:00:00Z',
  },
];
