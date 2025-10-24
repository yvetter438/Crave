import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import Comment from './Comment';
import { Colors } from '@/constants/Colors';

type CommentData = {
  id: number;
  post_id: number;
  user_id: string;
  parent_comment_id: number | null;
  text: string;
  created_at: string;
  username: string;
  displayname: string | null;
  avatar_url: string | null;
  likes_count: number;
  replies_count?: number;
  is_liked_by_user: boolean;
};

type CommentRepliesProps = {
  commentId: number;
  currentUserId: string | null;
  onReply: (comment: CommentData) => void;
  parentComment: CommentData;
};

export default function CommentReplies({ commentId, currentUserId, onReply, parentComment }: CommentRepliesProps) {
  const [replies, setReplies] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReplies();
  }, [commentId]);

  const fetchReplies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_comment_replies', {
          p_comment_id: commentId,
          p_user_id: currentUserId
        });

      if (error) {
        console.error('Error fetching replies:', error);
        return;
      }

      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplyToReply = (reply: CommentData) => {
    // When replying to a reply, we want to reply to the parent comment
    // This keeps the thread flat (Instagram-style) rather than nested (Reddit-style)
    onReply(parentComment);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.repliesContainer}>
      {replies.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          onReply={handleReplyToReply}
          onLikeUpdate={fetchReplies}
          currentUserId={currentUserId}
          isReply
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  repliesContainer: {
    marginTop: 8,
    marginLeft: 48, // Indent replies
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#f0f0f0',
  },
  loadingContainer: {
    marginTop: 12,
    marginLeft: 48,
    paddingVertical: 8,
  },
});

