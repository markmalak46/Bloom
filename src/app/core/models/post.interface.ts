export interface Post {
  _id: string;
  body?: string;
  image?: string;
  privacy: string;
  user: User;
  sharedPost?: Post | null;
  likes: any[];
  createdAt: string;
  commentsCount: number;
  topComment?: any | null;
  sharesCount: number;
  likesCount: number;
  isShare: boolean;
  id: string;
  bookmarked: boolean;
  bookmarksCount?: number;
  isLiked?: boolean;
  _isOptimistic?: boolean;
}

export interface User {
  _id: string;
  name: string;
  username: string;
  photo: string;

}
