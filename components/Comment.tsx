import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../lib/supabase';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import CommentReplies from './CommentReplies';
import ReportModal from './ReportModal';
import BlockUserModal from './BlockUserModal';
import { useAnalytics, trackUserEvents } from '../utils/analytics';

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
  replies_count: number;
  is_liked_by_user: boolean;
};

type CommentProps = {
  comment: CommentData;
  onReply: (comment: CommentData) => void;
  onLikeUpdate: () => void;
  currentUserId: string | null;
  isReply?: boolean;
  onCommentRemoved?: () => void; // Callback when comment is hidden due to user block
};

export default function Comment({ comment, onReply, onLikeUpdate, currentUserId, isReply = false, onCommentRemoved }: CommentProps) {
  // Analytics
  const analytics = useAnalytics();
  
  const [isLiked, setIsLiked] = useState(comment.is_liked_by_user);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [isLiking, setIsLiking] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Get avatar URL
  useEffect(() => {
    if (comment.avatar_url) {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(comment.avatar_url);
      setAvatarUrl(data.publicUrl);
    }
  }, [comment.avatar_url]);

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiking(true);

    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

    // Optimistic update
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);

    try {
      if (newIsLiked) {
        // Like - use upsert to handle duplicates gracefully
        const { error } = await supabase
          .from('comment_likes')
          .upsert({
            comment_id: comment.id,
            user_id: currentUserId,
          }, {
            onConflict: 'comment_id,user_id'
          });

        if (error) {
          console.error('Error liking comment:', error);
          // Revert on error
          setIsLiked(!newIsLiked);
          setLikesCount(likesCount);
        } else {
          // Track comment liked
          analytics.track(trackUserEvents.commentLiked(comment.id.toString(), currentUserId).event, {
            ...trackUserEvents.commentLiked(comment.id.toString(), currentUserId).properties,
            commentId: comment.id,
            userId: currentUserId,
            postId: comment.post_id,
          });
        }
      } else {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', currentUserId);

        if (error) {
          console.error('Error unliking comment:', error);
          // Revert on error
          setIsLiked(!newIsLiked);
          setLikesCount(likesCount);
        } else {
          // Track comment unliked
          analytics.track(trackUserEvents.commentUnliked(comment.id.toString(), currentUserId).event, {
            ...trackUserEvents.commentUnliked(comment.id.toString(), currentUserId).properties,
            commentId: comment.id,
            userId: currentUserId,
            postId: comment.post_id,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikesCount(likesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const displayName = comment.displayname || comment.username;

  const handleMoreOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (Platform.OS === 'ios') {
      // iOS Action Sheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report Comment', 'Block User'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: 'Comment Options',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setShowReportModal(true);
          } else if (buttonIndex === 2) {
            setShowBlockModal(true);
          }
        }
      );
    } else {
      // Android - use Alert with buttons
      Alert.alert(
        'Comment Options',
        'Choose an action',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report Comment', onPress: () => setShowReportModal(true) },
          {
            text: 'Block User',
            onPress: () => setShowBlockModal(true),
            style: 'destructive',
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleBlockSuccess = () => {
    // Notify parent that comment should be removed from view
    onCommentRemoved?.();
  };

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <View style={styles.commentContent}>
        {/* Avatar */}
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color="#999" />
          </View>
        )}

        {/* Comment body */}
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.timeAgo}>{getTimeAgo(comment.created_at)}</Text>
          </View>

          <Text style={styles.commentText}>{comment.text}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleLike}
              disabled={isLiking}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isLiking ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={16}
                    color={isLiked ? Colors.primary : "#666"}
                  />
                  {likesCount > 0 && (
                    <Text style={[styles.actionText, isLiked && styles.likedText]}>
                      {likesCount}
                    </Text>
                  )}
                </>
              )}
            </TouchableOpacity>

            {!isReply && (
              <TouchableOpacity
                onPress={() => onReply(comment)}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.actionText}>Reply</Text>
              </TouchableOpacity>
            )}

            {!isReply && comment.replies_count > 0 && (
              <TouchableOpacity
                onPress={() => setShowReplies(!showReplies)}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showReplies ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#666"
                />
                <Text style={styles.actionText}>
                  {showReplies ? 'Hide' : `View ${comment.replies_count}`} {comment.replies_count === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>
            )}

            {/* More options button - only show if not own comment */}
            {currentUserId !== comment.user_id && (
              <TouchableOpacity
                onPress={handleMoreOptions}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Replies */}
      {!isReply && showReplies && (
        <CommentReplies
          commentId={comment.id}
          currentUserId={currentUserId}
          onReply={onReply}
          parentComment={comment}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="comment"
        targetId={comment.id}
        targetDescription={`@${comment.username}'s comment`}
      />

      {/* Block User Modal */}
      <BlockUserModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        userId={comment.user_id}
        username={comment.username}
        onBlockSuccess={handleBlockSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  replyContainer: {
    marginLeft: 0,
    marginBottom: 12,
  },
  commentContent: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: Colors.primary,
  },
});

