import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  PanResponder,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../lib/supabase';
import { Colors } from '@/constants/Colors';
import Comment from './Comment';
import * as Haptics from 'expo-haptics';
import { validateCommentText, containsSpam } from '@/utils/profanityFilter';

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

type CommentSheetProps = {
  visible: boolean;
  onClose: () => void;
  postId: string;
  initialCommentCount?: number;
};

export default function CommentSheet({ visible, onClose, postId, initialCommentCount = 0 }: CommentSheetProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<CommentData | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const panY = useRef(new Animated.Value(0)).current;

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Pan responder for drag-to-close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical drags
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down (positive dy)
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 150px, close the sheet
        if (gestureState.dy > 150) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          closeSheet();
        } else {
          // Snap back to original position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  // Animate sheet in/out
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      fetchComments();
      panY.setValue(0); // Reset pan position
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setReplyingTo(null);
      setCommentText('');
      panY.setValue(0);
    }
  }, [visible]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use the new moderation-aware RPC function that filters blocked users
      const { data, error } = await supabase
        .rpc('get_comments_with_moderation', {
          p_post_id: parseInt(postId),
          p_user_id: user?.id || null
        });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      // Filter out replies - only show top-level comments
      const topLevelComments = data?.filter((c: CommentData) => c.parent_comment_id === null) || [];
      setComments(topLevelComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || isPosting || !currentUserId) return;

    // Validate comment text for profanity and spam
    const validation = validateCommentText(commentText);
    if (!validation.isValid) {
      Alert.alert('Cannot Post Comment', validation.error);
      return;
    }

    // Check for spam patterns
    if (containsSpam(commentText)) {
      Alert.alert(
        'Potential Spam Detected',
        'Your comment appears to contain spam. Please revise and try again.',
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPosting(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: parseInt(postId),
          user_id: currentUserId,
          text: commentText.trim(),
          parent_comment_id: replyingTo?.id || null,
          status: 'visible', // Explicitly set status
        })
        .select()
        .single();

      if (error) {
        console.error('Error posting comment:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        Alert.alert('Error', `Failed to post comment: ${error.message || 'Please try again.'}`);
        return;
      }

      // Clear input and reply state
      setCommentText('');
      setReplyingTo(null);
      Keyboard.dismiss();

      // Refresh comments
      await fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReply = (comment: CommentData) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const closeSheet = () => {
    // Animate the sheet closing smoothly
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(panY, {
        toValue: 600,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call onClose after animation completes
      onClose();
    });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const combinedTranslateY = Animated.add(translateY, panY);

  const renderComment = useCallback(({ item }: { item: CommentData }) => (
    <Comment
      comment={item}
      onReply={handleReply}
      onLikeUpdate={fetchComments}
      currentUserId={currentUserId}
      onCommentRemoved={fetchComments}
    />
  ), [currentUserId]);

  const keyExtractor = useCallback((item: CommentData) => item.id.toString(), []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={closeSheet}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                { transform: [{ translateY: combinedTranslateY }] }
              ]}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
                {/* Header - Draggable */}
                <View style={styles.header} {...panResponder.panHandlers}>
                  <View style={styles.handle} />
                  <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>
                      {initialCommentCount > 0 
                        ? `${initialCommentCount} Comment${initialCommentCount !== 1 ? 's' : ''}`
                        : 'Comments'
                      }
                    </Text>
                    <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close" size={28} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Typing Preview - Shows when keyboard is visible */}
                {isKeyboardVisible && commentText.trim() && (
                  <View style={styles.typingPreview}>
                    <View style={styles.typingPreviewHeader}>
                      <Ionicons name="create-outline" size={16} color={Colors.primary} />
                      <Text style={styles.typingPreviewTitle}>
                        {replyingTo ? 'Replying...' : 'Commenting...'}
                      </Text>
                    </View>
                    <Text style={styles.typingPreviewText} numberOfLines={3}>
                      {commentText}
                    </Text>
                  </View>
                )}

                {/* Comments List */}
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                  </View>
                ) : comments.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No comments yet</Text>
                    <Text style={styles.emptySubtext}>Be the first to comment!</Text>
                  </View>
                ) : (
                  <FlatList
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.commentsList}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  />
                )}

                {/* Reply indicator */}
                {replyingTo && (
                  <View style={styles.replyIndicator}>
                    <View style={styles.replyIndicatorContent}>
                      <Ionicons name="return-down-forward" size={16} color={Colors.primary} />
                      <Text style={styles.replyIndicatorText}>
                        Replying to @{replyingTo.username}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={cancelReply}>
                      <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Input Area */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={inputRef}
                      style={styles.input}
                      placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                      placeholderTextColor="#999"
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline={false}
                      maxLength={500}
                      returnKeyType="send"
                      blurOnSubmit={true}
                      onSubmitEditing={postComment}
                      enablesReturnKeyAutomatically={true}
                    />
                    <TouchableOpacity
                      onPress={postComment}
                      disabled={!commentText.trim() || isPosting}
                      style={[
                        styles.sendButton,
                        (!commentText.trim() || isPosting) && styles.sendButtonDisabled
                      ]}
                    >
                      {isPosting ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Ionicons
                          name="send"
                          size={20}
                          color={commentText.trim() ? 'white' : '#999'}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  typingPreview: {
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  typingPreviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  typingPreviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  replyIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyIndicatorText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    height: 40,
    color: '#000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});

