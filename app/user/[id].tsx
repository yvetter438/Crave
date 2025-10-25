import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import BlockUserModal from '../../components/BlockUserModal';

interface Profile {
  id: number;
  user_id: string;
  username: string;
  displayname: string;
  avatar_url: string | null;
  bio?: string;
  location?: string;
  instagram_handle?: string;
  followers_count?: number;
  following_count?: number;
  likes_count?: number;
}

interface Post {
  id: number;
  created_at: string;
  video_url: string;
  description: string;
  thumbnail_url: string | null;
}

export default function UserProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const initializeProfile = async () => {
      await fetchCurrentUser();
      await fetchProfile();
      await checkBlockStatus();
      // Only fetch posts if not blocked
      if (!isBlocked) {
        await fetchUserPosts();
      } else {
        setLoading(false);
      }
    };
    
    initializeProfile();
  }, [id, currentUserId]);

  // Separate useEffect to handle posts when block status changes
  useEffect(() => {
    if (currentUserId && id && !isBlocked) {
      fetchUserPosts();
    } else if (isBlocked) {
      setPosts([]);
      setPostCount(0);
      setLoading(false);
    }
  }, [isBlocked, currentUserId, id]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
      
      // Check if current user is following this profile
      if (currentUserId && id !== currentUserId) {
        checkFollowStatus();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserPosts = async () => {
    // Don't fetch posts if user is blocked
    if (isBlocked) {
      setPosts([]);
      setPostCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, video_url, description, created_at, thumbnail_url')
        .eq('user', id)
        .eq('status', 'approved') // Only show approved posts
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(data || []);
      setPostCount(data?.length || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUserId) return;

    try {
      const { data } = await supabase
        .rpc('is_following', {
          p_follower_id: currentUserId,
          p_following_id: id
        });

      setIsFollowing(data || false);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const checkBlockStatus = async () => {
    if (!currentUserId || !id) return;

    try {
      const { data } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', id)
        .single();

      setIsBlocked(!!data);
    } catch (error) {
      // If no block found, error is expected
      setIsBlocked(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', id);

        if (!error) {
          setIsFollowing(false);
          // Update local count
          if (profile) {
            setProfile({
              ...profile,
              followers_count: (profile.followers_count || 0) - 1
            });
          }
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUserId,
            following_id: id
          });

        if (!error) {
          setIsFollowing(true);
          // Update local count
          if (profile) {
            setProfile({
              ...profile,
              followers_count: (profile.followers_count || 0) + 1
            });
          }
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const openInstagram = async (handle: string) => {
    const instagramUrl = `https://instagram.com/${handle}`;
    const instagramAppUrl = `instagram://user?username=${handle}`;
    
    try {
      const canOpenApp = await Linking.canOpenURL(instagramAppUrl);
      if (canOpenApp) {
        await Linking.openURL(instagramAppUrl);
      } else {
        await Linking.openURL(instagramUrl);
      }
    } catch (error) {
      console.error('Error opening Instagram:', error);
    }
  };

  const handleBlockSuccess = () => {
    // Update block status and close modal
    setIsBlocked(true);
    setShowBlockModal(false);
  };

  const handleUnblock = async () => {
    if (!currentUserId || !id) return;

    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', id);

      if (!error) {
        setIsBlocked(false);
        // Refresh posts after unblocking
        await fetchUserPosts();
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postContainer}
      onPress={() => router.push(`/post/${item.id}?context=profile&contextId=${id}`)}
      activeOpacity={0.8}
    >
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={styles.postThumbnail}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.postThumbnail, styles.placeholderThumbnail]}>
          <Ionicons name="videocam" size={40} color="rgba(255,255,255,0.3)" />
        </View>
      )}
      <View style={styles.playIconOverlay}>
        <Ionicons name="play" size={20} color="rgba(255,255,255,0.8)" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStatePlusContainer}>
        <Ionicons name="grid-outline" size={60} color="#bbb" />
      </View>
      <Text style={styles.emptyStateText}>No posts yet</Text>
    </View>
  );

  const renderBlockedState = () => (
    <View style={styles.blockedStateContainer}>
      <View style={styles.blockedIconContainer}>
        <Ionicons name="ban-outline" size={60} color="#ff6b6b" />
      </View>
      <Text style={styles.blockedTitle}>User Blocked</Text>
      <Text style={styles.blockedMessage}>
        You have blocked this user. Their posts and comments will not be visible to you.
      </Text>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={handleUnblock}
        activeOpacity={0.7}
      >
        <Text style={styles.unblockButtonText}>Unblock User</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{profile?.username || 'Profile'}</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUrl = profile.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{profile.username}</Text>
        <View style={{ width: 28 }} />
      </View>

      {isBlocked ? (
        // Show blocked state instead of posts
        <View style={styles.blockedProfileContainer}>
          {/* Profile Info */}
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
              <Ionicons name="person-outline" size={40} color="#bbb" />
            </View>
          )}

          <Text style={styles.username}>@{profile.username}</Text>
          {profile.displayname && (
            <Text style={styles.displayname}>{profile.displayname}</Text>
          )}

          {/* Bio */}
          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          {/* Location */}
          {profile.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          )}

          {/* Instagram Link */}
          {profile.instagram_handle && (
            <TouchableOpacity 
              style={styles.socialLinkContainer}
              onPress={() => openInstagram(profile.instagram_handle!)}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-instagram" size={16} color="#E4405F" />
              <Text style={styles.socialLinkText}>@{profile.instagram_handle}</Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stats}>
              <Text style={styles.statNumber}>{profile.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stats}>
              <Text style={styles.statNumber}>{profile.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.stats}>
              <Text style={styles.statNumber}>{profile.likes_count || 0}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          {/* Blocked State */}
          {renderBlockedState()}
        </View>
      ) : (
        // Show normal profile with posts
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          ListHeaderComponent={() => (
            <>
              {/* Profile Info */}
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <Ionicons name="person-outline" size={40} color="#bbb" />
                </View>
              )}

              <Text style={styles.username}>@{profile.username}</Text>
              {profile.displayname && (
                <Text style={styles.displayname}>{profile.displayname}</Text>
              )}

              {/* Bio */}
              {profile.bio && (
                <Text style={styles.bio}>{profile.bio}</Text>
              )}

              {/* Location */}
              {profile.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.locationText}>{profile.location}</Text>
                </View>
              )}

              {/* Instagram Link */}
              {profile.instagram_handle && (
                <TouchableOpacity 
                  style={styles.socialLinkContainer}
                  onPress={() => openInstagram(profile.instagram_handle!)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-instagram" size={16} color="#E4405F" />
                  <Text style={styles.socialLinkText}>@{profile.instagram_handle}</Text>
                </TouchableOpacity>
              )}

              {/* Stats */}
              <View style={styles.statsContainer}>
                <TouchableOpacity 
                  style={styles.stats}
                  onPress={() => router.push(`/followers/${id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statNumber}>{profile.followers_count || 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.stats}
                  onPress={() => router.push(`/following/${id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statNumber}>{profile.following_count || 0}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </TouchableOpacity>
                <View style={styles.stats}>
                  <Text style={styles.statNumber}>{profile.likes_count || 0}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>
              </View>

              {/* Follow and Block Buttons */}
              {currentUserId && id !== currentUserId && (
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.followButton, isFollowing && styles.followingButton]}
                    onPress={handleFollowToggle}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.blockButton}
                    onPress={() => setShowBlockModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
          contentContainerStyle={styles.postsContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Block User Modal */}
      {profile && (
        <BlockUserModal
          visible={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          userId={profile.user_id}
          username={profile.username}
          onBlockSuccess={handleBlockSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get('window').width;
const postSize = screenWidth / 3 - 4;
const postHeight = postSize * (16 / 9); // 9:16 aspect ratio for vertical videos

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginTop: 20,
    alignSelf: 'center',
  },
  profileImagePlaceholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  displayname: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  socialLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  socialLinkText: {
    fontSize: 14,
    color: '#E4405F',
    marginLeft: 6,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  stats: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 20,
    gap: 8,
  },
  followButton: {
    backgroundColor: '#0095f6',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
  },
  blockButton: {
    width: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  postsContainer: {
    paddingHorizontal: 0,
  },
  postContainer: {
    position: 'relative',
  },
  postThumbnail: {
    width: postSize,
    height: postHeight,
    margin: 2,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStatePlusContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '500',
  },
  blockedStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  blockedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffe6e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  blockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 12,
    textAlign: 'center',
  },
  blockedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  unblockButton: {
    backgroundColor: '#0095f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  blockedProfileContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
});

