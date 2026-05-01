export interface Student {
  id: string;
  name: string;
  points: number;
  qrCode: string;
  grade?: string;
  bio?: string;
  avatarUrl?: string;
  gallery?: string[];
  updatedAt?: any;
}

export interface CompetitionHistory {
  id: string;
  title: string;
  endedAt: string;
  results: {
    name: string;
    points: number;
    grade?: string;
    rank: number;
    avatarUrl?: string;
    bio?: string;
    gallery?: string[];
  }[];
}

export interface Admin {
  uid: string;
  email: string;
  name: string;
}
