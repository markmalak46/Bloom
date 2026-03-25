export interface Comment {
  _id: string;
  content: string;
  commentCreator: CommentCreator;
  post: string;
  image: string;
  parentComment: null;
  likes: any[];
  createdAt: string;
  repliesCount: number;
  likesCount?: number;
  isLiked?: boolean;
  isReply?: boolean;
  replies?: Comment[];
  showReplies?: boolean;
}

interface CommentCreator {
  _id: string;
  name: string;
  username: string;
  photo: string;
}