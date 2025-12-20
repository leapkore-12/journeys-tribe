// Mock data for RoadTribe MVP

export interface UserStats {
  ytd: {
    trips: number;
    distance: number; // in km
    timeOnRoad: number; // in minutes
  };
  allTime: {
    trips: number;
    distance: number;
    timeOnRoad: number;
    longestTrip: number;
  };
}

export interface MutualFollowers {
  users: { id: string; username: string; avatar: string }[];
  total: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  tripsCount: number;
  followersCount: number;
  followingCount: number;
  vehiclesCount: number;
  mutuals: string[];
  mutualFollowers?: MutualFollowers;
  isFollowing?: boolean;
  isPrivate?: boolean;
  stats?: UserStats;
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
  distance: number; // in km
  duration: number; // in minutes
  vehicle: Vehicle;
  convoyMembers: User[];
  routeCoordinates: [number, number][];
  photos: string[];
  mapImage: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: Date;
  country: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'convoy_invite' | 'trip_complete';
  user: User;
  message: string;
  tripName?: string;
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
    vehiclesCount: 2,
    mutuals: ['Sarah', 'Mike', 'Chris'],
    mutualFollowers: {
      users: [
        { id: '2', username: '@sarahdrives', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
        { id: '3', username: '@mikeontour', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
        { id: '4', username: '@chris_r', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=face' },
      ],
      total: 94,
    },
    isFollowing: false,
    isPrivate: false,
    stats: {
      ytd: { trips: 48, distance: 2548, timeOnRoad: 5394 },
      allTime: { trips: 160, distance: 10886, timeOnRoad: 9066, longestTrip: 1200 },
    },
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
    vehiclesCount: 3,
    mutuals: ['Alex', 'Mike'],
    mutualFollowers: {
      users: [
        { id: '1', username: '@alexrides', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
        { id: '3', username: '@mikeontour', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
      ],
      total: 45,
    },
    isFollowing: true,
    isPrivate: false,
    stats: {
      ytd: { trips: 32, distance: 4200, timeOnRoad: 7200 },
      allTime: { trips: 89, distance: 15600, timeOnRoad: 12000, longestTrip: 980 },
    },
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
    vehiclesCount: 4,
    mutuals: ['Alex', 'Sarah', 'Chris'],
    mutualFollowers: {
      users: [
        { id: '1', username: '@alexrides', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
        { id: '2', username: '@sarahdrives', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
        { id: '4', username: '@chris_r', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=face' },
      ],
      total: 120,
    },
    isFollowing: true,
    isPrivate: false,
    stats: {
      ytd: { trips: 65, distance: 8900, timeOnRoad: 14400 },
      allTime: { trips: 156, distance: 45000, timeOnRoad: 36000, longestTrip: 2400 },
    },
  },
  {
    id: 'current',
    name: 'John Doe',
    username: '@roadtriber',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'RoadTribe member | Building memories one mile at a time 🛣️',
    tripsCount: 160,
    followersCount: 603,
    followingCount: 321,
    vehiclesCount: 3,
    mutuals: [],
    isPrivate: false,
    stats: {
      ytd: { trips: 48, distance: 2548, timeOnRoad: 5394 },
      allTime: { trips: 160, distance: 10886, timeOnRoad: 9066, longestTrip: 1200 },
    },
  },
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    name: 'Audi Q7',
    make: 'Audi',
    model: 'Q7',
    year: 2023,
    specs: '335hp | 8-speed Auto | AWD',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    ],
  },
  {
    id: '2',
    name: 'BMW M3',
    make: 'BMW',
    model: 'M3',
    year: 2023,
    specs: '473hp | 6-speed Manual | RWD',
    images: [
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop',
    ],
  },
  {
    id: '3',
    name: 'Mercedes AMG',
    make: 'Mercedes',
    model: 'AMG GT',
    year: 2022,
    specs: '523hp | 7-speed Auto | RWD',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
    ],
  },
];

// Mock Trip Posts
export const mockTripPosts: TripPost[] = [
  {
    id: '1',
    user: mockUsers[0],
    title: 'Mumbai → Goa',
    description: 'Breaking into the new tires',
    startLocation: 'Mumbai',
    endLocation: 'Goa',
    distance: 850,
    duration: 1190, // 19h 50m
    vehicle: mockVehicles[0],
    convoyMembers: [mockUsers[1], mockUsers[2]],
    routeCoordinates: [
      [72.8777, 19.0760],
      [73.8567, 15.2993],
    ],
    photos: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop',
    ],
    mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop',
    likes: 150,
    comments: 20,
    shares: 12,
    isLiked: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    country: 'India',
  },
  {
    id: '2',
    user: mockUsers[1],
    title: 'Berlin → Munich',
    description: 'Autobahn adventure with the crew',
    startLocation: 'Berlin',
    endLocation: 'Munich',
    distance: 585,
    duration: 360, // 6h
    vehicle: mockVehicles[1],
    convoyMembers: [mockUsers[0]],
    routeCoordinates: [
      [13.4050, 52.5200],
      [11.5820, 48.1351],
    ],
    photos: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop',
    ],
    mapImage: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=600&h=400&fit=crop',
    likes: 234,
    comments: 45,
    shares: 23,
    isLiked: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    country: 'Germany',
  },
  {
    id: '3',
    user: { ...mockUsers[3], id: 'current' },
    title: 'LA → San Francisco',
    description: 'Pacific Coast Highway sunset vibes',
    startLocation: 'Los Angeles',
    endLocation: 'San Francisco',
    distance: 615,
    duration: 420, // 7h
    vehicle: mockVehicles[2],
    convoyMembers: [],
    routeCoordinates: [
      [-118.2437, 34.0522],
      [-122.4194, 37.7749],
    ],
    photos: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    ],
    mapImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=400&fit=crop',
    likes: 89,
    comments: 12,
    shares: 5,
    isLiked: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    country: 'USA',
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
    isLiked: false,
  },
  {
    id: '2',
    user: mockUsers[2],
    text: 'The road conditions were perfect for this trip!',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    likes: 8,
    isLiked: true,
  },
  {
    id: '3',
    user: mockUsers[0],
    text: 'Great shots! What camera did you use?',
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    likes: 5,
    isLiked: false,
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'convoy_invite',
    user: mockUsers[0],
    message: 'has invited you to join their convoy',
    tripName: 'Breaking into the new tires',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    isRead: false,
  },
  {
    id: '2',
    type: 'like',
    user: mockUsers[1],
    message: 'liked your trip',
    tripName: 'Mumbai to Goa',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
  },
  {
    id: '3',
    type: 'comment',
    user: mockUsers[2],
    message: 'commented on your trip',
    tripName: 'Breaking into the new tires',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: true,
  },
  {
    id: '4',
    type: 'follow',
    user: mockUsers[0],
    message: 'started following you',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isRead: true,
  },
];

// Helper functions
export const formatDistance = (km: number) => {
  return `${km.toLocaleString()} km`;
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

export const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  return `${diffDays}d ago`;
};

export const formatTimestamp = (date: Date, country: string) => {
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return `Today at ${timeStr} • ${country}`;
  }
  return `${formatTimeAgo(date)} • ${country}`;
};

export const formatStatsTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const getCurrentUser = () => mockUsers.find(u => u.id === 'current')!;
