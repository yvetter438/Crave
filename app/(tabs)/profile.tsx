import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Dimensions, Modal, TouchableOpacity, Alert, Linking } from 'react-native';
// import { Video } from 'expo-av'; // Removed - using Image for thumbnails
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
//post type
interface Post {
  id: number;
  created_at: string;
  video_url: string;
  description: string;
  recipe?: string;
  thumbnail_url: string | null;
  status: string;
}

//profile type
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


export default function Profile() {
  const [modalVisible, setModalVisible] = useState(false);
  const [image, setImage] = useState('https://notjustdev-dummy.s3.us-east-2.amazonaws.com/images/1.jpg');
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [ postCount, setPostCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
      //  console.log('Session user ID:', session.user.id);
     // console.log('ID match:', session.user.id === 'cdc73b26-3030-42aa-9745-3e9254add7bf');
        fetchUserPosts(session.user.id);
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserPosts(session.user.id);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refresh profile when screen comes into focus (e.g., returning from settings)
  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    }, [session])
  );

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        return;
      }

      if (profileData) {
        setProfile(profileData);
        // Update the profile image if avatar_url exists
        if (profileData.avatar_url) {
          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(profileData.avatar_url);
          setImage(data.publicUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserPosts = async (userId: string, limit: number = 20, offset: number = 0) => {
    try {  
      // OPTIMIZED: Direct user filter query with pagination
      const { data, error } = await supabase
        .from('posts')
        .select('id, video_url, description, created_at, thumbnail_url, status')
        .eq('user', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
  
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
  
      if (data) {
        if (offset === 0) {
          // First load - replace posts
          setPosts(data);
        } else {
          // Load more - append posts
          setPosts(prevPosts => [...prevPosts, ...data]);
        }
        setPostCount(data.length);
      }
    } catch (error) {
      Alert.alert('Error fetching posts');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postContainer}
      onPress={() => {
        // Only navigate if post is approved
        if (item.status === 'approved' && session?.user?.id) {
          router.push(`/post/${item.id}?context=profile&contextId=${session.user.id}`);
        } else if (item.status !== 'approved') {
          Alert.alert(
            'Post Under Review',
            'This video is currently being reviewed and will be available once approved.',
            [{ text: 'OK' }]
          );
        }
      }}
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
      
      {/* Status overlay */}
      {item.status !== 'approved' ? (
        <View style={styles.pendingOverlay}>
          <View style={styles.pendingContent}>
            <Ionicons name="time" size={24} color="#FF6B6B" />
            <Text style={styles.pendingText}>Pending{'\n'}Approval</Text>
          </View>
        </View>
      ) : (
        <View style={styles.playIconOverlay}>
          <Ionicons name="play" size={20} color="rgba(255,255,255,0.8)" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStatePlusContainer}>
        <Ionicons name="add" size={60} color="#bbb" />
      </View>
      <Text style={styles.emptyStateText}>Post videos</Text>
    </View>
  );

  const openInstagram = async (handle: string) => {
    const instagramUrl = `https://instagram.com/${handle}`;
    const instagramAppUrl = `instagram://user?username=${handle}`;
    
    try {
      // Try to open Instagram app first
      const canOpenApp = await Linking.canOpenURL(instagramAppUrl);
      if (canOpenApp) {
        await Linking.openURL(instagramAppUrl);
      } else {
        // Fall back to web browser
        await Linking.openURL(instagramUrl);
      }
    } catch (error) {
      console.error('Error opening Instagram:', error);
      Alert.alert('Error', 'Could not open Instagram');
    }
  };


  // const pickImage = async () => {
  //   let result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [4, 3],
  //     quality: 1,
  //   });

  //   if (!result.canceled) {
  //     setImage(result.assets[0].uri);
  //     setModalVisible(false); // Close modal after selecting an image
  //   }
  // };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      
      {/* <TouchableOpacity onPress={() => setModalVisible(true)}> */}
        {session?.user ? (
          <Image source={{ uri: image }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
            <Ionicons name="person-outline" size={40} color="#bbb" />
          </View>
        )}
      {/* </TouchableOpacity> */}
      <Text style={styles.username}>
        {profile?.username ? `@${profile.username}` : (session?.user?.email || 'Not logged in')}
      </Text>
      {profile?.displayname && (
        <Text style={styles.displayname}>
          {profile.displayname}
        </Text>
      )}

      {/* Bio Section */}
      {profile?.bio && (
        <Text style={styles.bio}>
          {profile.bio}
        </Text>
      )}

      {/* Location */}
      {profile?.location && (
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText}>{profile.location}</Text>
        </View>
      )}

      {/* Instagram Link */}
      {profile?.instagram_handle && (
        <TouchableOpacity 
          style={styles.socialLinkContainer}
          onPress={() => openInstagram(profile.instagram_handle!)}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-instagram" size={16} color="#E4405F" />
          <Text style={styles.socialLinkText}>@{profile.instagram_handle}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.stats}
          onPress={() => session?.user && router.push(`/followers/${session.user.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{profile?.followers_count || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.stats}
          onPress={() => session?.user && router.push(`/following/${session.user.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{profile?.following_count || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        <View style={styles.stats}>
          <Text style={styles.statNumber}>{profile?.likes_count || 0}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>

      {session?.user ? (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsContainer}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          refreshing={loading}
          onRefresh={() => session?.user && fetchUserPosts(session.user.id, 20, 0)}
          onEndReached={() => {
            // Load more posts when reaching the end
            if (session?.user && posts.length > 0) {
              fetchUserPosts(session.user.id, 20, posts.length);
            }
          }}
          onEndReachedThreshold={0.5}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
        />
      ) : (
        <View style={{ height: 20 }} />
      )}

      {/* <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Image source={{ uri: image }} style={styles.enlargedProfileImage} />
            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.changePictureText}>Change Picture</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal> */}
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const postSize = screenWidth / 3 - 4;
const postHeight = postSize * (16 / 9); // 9:16 aspect ratio for vertical videos

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  displayname: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
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
  postsContainer: {
    paddingHorizontal: 0,
    marginTop: screenHeight * 0.05,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
  },
  enlargedProfileImage: {
    width: 250,
    height: 250,
    borderRadius: 125,
    marginBottom: 20,
  },
  changePictureText: {
    color: '#fff',
    fontSize: 18,
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    paddingTop: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  settingsButton: {
    padding: 4,
    marginRight: 10,
    marginTop: 0,
  },
  headerSpacer: {
    flex: 1,
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
  pendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  pendingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
});
