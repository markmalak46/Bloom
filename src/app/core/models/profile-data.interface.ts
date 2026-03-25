export interface Follower {
  _id?: string;
  id?: string;
  name?: string;
  photo?: string;
  followersCount?: number;
  isFollowing?: boolean;
}
export interface ProfileData {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  createdAt?: string;
  cover?: string;
  photo?: string;
  isFollowing?: boolean;
  followers?: Follower[];
  followersCount?: number;
  followingCount?: number;
  bookmarksCount?: number;
}