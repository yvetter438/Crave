/**
 * Moderator Dashboard
 * Manual review and approval of user-generated content
 * 
 * Access: Only for moderators (you'll need to add yourself to the moderators table)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { supabase } from '@/lib/supabase';
import { getPendingPosts, approvePostAndMoveVideo, removePost } from '@/utils/moderationUtils';

interface PendingPost {
  id: number;
  created_at: string;
  description: string;
  video_url: string;
  status: string;
  user: string;
}

export default function ModeratorScreen() {
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkModeratorStatus();
  }, []);

  const checkModeratorStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        Alert.alert('Not Authorized', 'Please log in to access this page.');
        router.back();
        return;
      }

      // Check if user is a moderator
      const { data, error } = await supabase
        .from('moderators')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      if (error || !data) {
        Alert.alert(
          'Not Authorized',
          'You do not have moderator permissions. Contact an admin to grant access.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      setIsAuthorized(true);
      fetchPendingPosts();
    } catch (error) {
      console.error('Error checking moderator status:', error);
      Alert.alert('Error', 'Failed to verify moderator status.');
      router.back();
    }
  };

  const fetchPendingPosts = async () => {
    setLoading(true);
    const { posts, error } = await getPendingPosts(100);
    
    if (error) {
      Alert.alert('Error', 'Failed to fetch pending posts.');
    } else {
      setPendingPosts(posts);
    }
    
    setLoading(false);
  };

  const handleApprove = async (postId: number) => {
    Alert.alert(
      'Approve Post',
      'This will move the video to the public bucket and make it visible to all users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setProcessingId(postId);
            
            const result = await approvePostAndMoveVideo(postId);
            
            if (result.success) {
              Alert.alert('Success', result.message);
              // Remove from pending list
              setPendingPosts(prev => prev.filter(p => p.id !== postId));
            } else {
              Alert.alert('Error', result.message);
            }
            
            setProcessingId(null);
          },
        },
      ]
    );
  };

  const handleReject = (post: PendingPost) => {
    setSelectedPost(post);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedPost || !rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection.');
      return;
    }

    setShowRejectModal(false);
    setProcessingId(selectedPost.id);

    const result = await removePost(selectedPost.id, rejectReason);

    if (result.success) {
      Alert.alert('Success', 'Post rejected and removed.');
      setPendingPosts(prev => prev.filter(p => p.id !== selectedPost.id));
    } else {
      Alert.alert('Error', result.message);
    }

    setProcessingId(null);
    setRejectReason('');
    setSelectedPost(null);
  };

  const renderPost = ({ item }: { item: PendingPost }) => {
    const isProcessing = processingId === item.id;
    
    return (
      <View style={styles.postCard}>
        <VideoPreview videoUrl={item.video_url} />
        
        <View style={styles.postInfo}>
          <Text style={styles.postDescription} numberOfLines={3}>
            {item.description || 'No description'}
          </Text>
          
          <Text style={styles.postMeta}>
            Post ID: {item.id} • User: {item.user.substring(0, 8)}...
          </Text>
          
          <Text style={styles.postDate}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleApprove(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-done-circle" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>All Caught Up!</Text>
      <Text style={styles.emptyText}>
        No pending posts to review at the moment.
      </Text>
    </View>
  );

  if (!isAuthorized && !loading) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Moderation</Text>
        <TouchableOpacity onPress={fetchPendingPosts} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {pendingPosts.length} post{pendingPosts.length !== 1 ? 's' : ''} pending review
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading pending posts...</Text>
        </View>
      ) : (
        <FlatList
          data={pendingPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
          refreshing={loading}
          onRefresh={fetchPendingPosts}
        />
      )}

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Post</Text>
            <Text style={styles.modalDescription}>
              Please provide a reason for rejecting this post:
            </Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Inappropriate content, spam, etc."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedPost(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmReject}
              >
                <Text style={styles.confirmButtonText}>Reject Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Separate component for video preview to handle player lifecycle
function VideoPreview({ videoUrl }: { videoUrl: string }) {
  // Generate signed URL for private bucket access
  const [signedUrl, setSignedUrl] = useState<string>('');

  useEffect(() => {
    const getSignedUrl = async () => {
      if (videoUrl.startsWith('http')) {
        setSignedUrl(videoUrl);
        return;
      }

      // Generate signed URL for private bucket
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(videoUrl, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      } else {
        console.error('Error generating signed URL:', error);
      }
    };

    getSignedUrl();
  }, [videoUrl]);

  const player = useVideoPlayer(signedUrl, (player) => {
    player.loop = true;
    player.muted = true;
  });

  if (!signedUrl) {
    return (
      <View style={styles.videoPlaceholder}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsBar: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  videoPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postInfo: {
    padding: 16,
  },
  postDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  postMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

