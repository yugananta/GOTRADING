export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
  followingCount?: number;
  country?: string;
  experienceLevel?: string;
  assets?: string[];
  online?: boolean;
}
