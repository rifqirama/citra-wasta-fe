export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
}

export interface Motif {
  id: string;
  name: string;
  description: string;
  image: string;
  region: string;
  province: string;
  tags: string[];
  createdAt: string;
}