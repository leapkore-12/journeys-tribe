// Mock data for RoadTribe MVP

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  tripsCount: number;
  followersCount: number;
  followingCount: number;
  mutuals: string[];
  isFollowing?: boolean;
}

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  specs: string;
  images: string[];
}

export interface TripPost {
  id: string;
  user: User;
  title: string;
  description: string;
  startLocation: string;
  endLocation: string;
  distance: number; // in miles
  duration: number; // in minutes
  vehicle: Vehicle;
  convoyMembers: User[];
  routeCoordinates: [number, number][];
  photos: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  createdAt: Date;
  likes: number;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'convoy_invite' | 'trip_complete';
  user: User;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Thompson',
    username: '@alexrides',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Car enthusiast | Weekend road tripper | Coffee addict ☕',
    tripsCount: 47,
    followersCount: 1234,
    followingCount: 567,
    mutuals: ['Sarah', 'Mike', 'Chris'],
    isFollowing: false,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    username: '@sarahdrives',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    bio: 'Adventure seeker 🏔️ | JDM lover | Always on the road',
    tripsCount: 89,
    followersCount: 2456,
    followingCount: 432,
    mutuals: ['Alex', 'Mike'],
    isFollowing: true,
  },
  {
    id: '3',
    name: 'Mike Rodriguez',
    username: '@mikeontour',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Truck guy | Cross-country expert | 🚛',
    tripsCount: 156,
    followersCount: 5678,
    followingCount: 234,
    mutuals: ['Alex', 'Sarah', 'Chris'],
    isFollowing: true,
  },
  {
    id: 'current',
    name: 'You',
    username: '@roadtriber',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'RoadTribe member | Building memories one mile at a time 🛣️',
    tripsCount: 23,
    followersCount: 456,
    followingCount: 321,
    mutuals: [],
  },
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    name: 'Project Z',
    make: 'Nissan',
    model: '370Z',
    year: 2019,
    specs: '332hp | 6-speed Manual | RWD',
    images: [
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop',
    ],
  },
  {
    id: '2',
    name: 'Daily Driver',
    make: 'Honda',
    model: 'Civic Type R',
    year: 2023,
    specs: '315hp | 6-speed Manual | FWD',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    ],
  },
  {
    id: '3',
    name: 'Weekend Warrior',
    make: 'Ford',
    model: 'Mustang GT',
    year: 2022,
    specs: '450hp | 10-speed Auto | RWD',
    images: [
      'https://images.unsplash.com/photo-1584345604476-8ec5f82d718c?w=400&h=300&fit=crop',
    ],
  },
];

// Mock Trip Posts
export const mockTripPosts: TripPost[] = [
  {
    id: '1',
    user: mockUsers[0],
    title: 'Pacific Coast Highway Run',
    description: 'Amazing sunset drive along the PCH. The weather was perfect and the views were incredible. Definitely doing this again soon!',
    startLocation: 'Los Angeles, CA',
    endLocation: 'San Francisco, CA',
    distance: 382,
    duration: 420,
    vehicle: mockVehicles[0],
    convoyMembers: [mockUsers[1], mockUsers[2]],
    routeCoordinates: [
      [-118.2437, 34.0522],
      [-119.6982, 34.4208],
      [-120.6596, 35.2828],
      [-121.8947, 36.6002],
      [-122.4194, 37.7749],
    ],
    photos: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    ],
    likes: 234,
    comments: 45,
    shares: 12,
    isLiked: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    user: mockUsers[1],
    title: 'Mountain Pass Adventure',
    description: 'Tackled some serious elevation today. The twisties were incredible and the car handled like a dream.',
    startLocation: 'Denver, CO',
    endLocation: 'Aspen, CO',
    distance: 160,
    duration: 210,
    vehicle: mockVehicles[1],
    convoyMembers: [mockUsers[0]],
    routeCoordinates: [
      [-104.9903, 39.7392],
      [-105.7821, 39.5501],
      [-106.8175, 39.1911],
    ],
    photos: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop',
    ],
    likes: 567,
    comments: 89,
    shares: 34,
    isLiked: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '3',
    user: mockUsers[2],
    title: 'Texas BBQ Trail',
    description: 'Hit all the best BBQ spots from Austin to Houston. Gained 10 pounds but worth every bite! 🍖',
    startLocation: 'Austin, TX',
    endLocation: 'Houston, TX',
    distance: 165,
    duration: 180,
    vehicle: mockVehicles[2],
    convoyMembers: [],
    routeCoordinates: [
      [-97.7431, 30.2672],
      [-96.7970, 29.7604],
      [-95.3698, 29.7604],
    ],
    photos: [
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=400&fit=crop',
    ],
    likes: 890,
    comments: 123,
    shares: 56,
    isLiked: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

// Mock Comments
export const mockComments: Comment[] = [
  {
    id: '1',
    user: mockUsers[1],
    text: 'This looks amazing! I need to do this drive soon.',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    likes: 12,
  },
  {
    id: '2',
    user: mockUsers[2],
    text: 'The PCH is the best! Did you stop at Big Sur?',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    likes: 8,
  },
  {
    id: '3',
    user: mockUsers[0],
    text: 'Great shots! What camera did you use?',
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    likes: 5,
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: mockUsers[0],
    message: 'liked your trip to San Francisco',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    isRead: false,
  },
  {
    id: '2',
    type: 'comment',
    user: mockUsers[1],
    message: 'commented on your trip',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
  },
  {
    id: '3',
    type: 'follow',
    user: mockUsers[2],
    message: 'started following you',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: true,
  },
  {
    id: '4',
    type: 'convoy_invite',
    user: mockUsers[0],
    message: 'invited you to join their convoy',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isRead: true,
  },
];

// Helper functions
export const formatDistance = (miles: number) => {
  return `${miles.toLocaleString()} mi`;
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

export const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export const getCurrentUser = () => mockUsers.find(u => u.id === 'current')!;
