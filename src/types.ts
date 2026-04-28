export interface Student {
  id: string;
  name: string;
  points: number;
  qrCode: string;
  grade?: string;
  updatedAt?: any;
}

export interface Admin {
  uid: string;
  email: string;
  name: string;
}
