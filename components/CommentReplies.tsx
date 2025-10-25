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
      // Use original reply fetching method (revert to working version)
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          parent_comment_id,
          text,
          created_at,
          profiles!inner(username, displayname, avatar_url)
        `)
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching replies:', error);
        return;
      }

      // Transform data to match expected format
      const transformedReplies = data?.map(comment => ({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_comment_id: comment.parent_comment_id,
        text: comment.text,
        created_at: comment.created_at,
        username: comment.profiles.username,
        displayname: comment.profiles.displayname,
        avatar_url: comment.profiles.avatar_url,
        likes_count: 0,
        replies_count: 0,
        is_liked_by_user: false
      })) || [];

      setReplies(transformedReplies);
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
          onCommentRemoved={fetchReplies}
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

