import { View, Text, StyleSheet, Pressable, useWindowDimensions, TouchableOpacity, Image, Modal, Linking, ScrollView, AppState } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState, useEffect } from 'react';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Platform, Share } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

// Add this interface to handle the status type properly
type AVPlaybackStatusSuccess = AVPlaybackStatus & {
  isLoaded: true;
  volume: number;
};

type VideoPost = {
    post: {
        id: string;
        video_url: string;
        description: string;
        user: string;
        restaurant: number | null;
    };
    activePostId: string;
    shouldPlay: boolean;
};

type Profile = {
    id: number;
    user_id: string;
    username: string;
    displayname: string;
    avatar_url: string | null;
};

type Restaurant = {
    id: number;
    name: string;
    cuisine: string;
    address: string;
    phone: string;
    website: string | null;
};


export default function VideoPost({post, activePostId, shouldPlay }: VideoPost) {
  const player = useVideoPlayer(post.video_url, (player) => {
    player.loop = true;
    player.muted = false;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const { height }= useWindowDimensions();
  const tabBarHeight: number = useBottomTabBarHeight();
  const adjustedHeight: number = height - tabBarHeight;
  
  // Track playing state manually
  const [isPlaying, setIsPlaying] = useState(false);


  useEffect(() => {
    // Configure audio to play even when device is muted
    player.muted = false;

    // Check if device is in silent mode (iOS only)
    if (Platform.OS === 'ios') {
      setIsMuted(true); // Start muted on iOS silent mode
    }
  }, []);

// Handle volume button changes only when in silent mode
useEffect(() => {
  if (isMuted) {
    // When volume is adjusted, unmute the video
    player.muted = false;
    setIsMuted(false);
  }
}, [isMuted]);






  useEffect(() => {
    const isActivePost = activePostId === post.id;

    if (isActivePost && shouldPlay) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [activePostId, post.id, shouldPlay]);





  // Handle app state changes - just pause/resume, no refresh
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Pause video when app goes to background
        player.pause();
        setIsPlaying(false);
      } else if (nextAppState === 'active') {
        // Resume video when app comes back to foreground (only if this is the active post)
        if (activePostId === post.id && shouldPlay) {
          player.play();
          setIsPlaying(true);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [activePostId, post.id, shouldPlay]);

  // No video player refreshing - just pause/resume like TikTok

  // Fetch profile data for the post author
  useEffect(() => {
    const fetchProfile = async () => {
      if (!post.user) return;
      
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', post.user)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching profile:', error);
          return;
        }

        if (profileData) {
          setProfile(profileData);
          // Get avatar URL if it exists
          if (profileData.avatar_url) {
            const { data } = supabase.storage
              .from('avatars')
              .getPublicUrl(profileData.avatar_url);
            setAvatarUrl(data.publicUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [post.user]);

  // Check like status and count
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if current user liked this post
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .single();

        setIsLiked(!!likeData);

        // Get like count for this post
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        setLikeCount(count || 0);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [post.id]);

  // Check save status and count
  useEffect(() => {
    const checkSaveStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if current user saved this post
        const { data: saveData } = await supabase
          .from('saves')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .single();

        setIsSaved(!!saveData);

        // Get save count for this post
        const { count } = await supabase
          .from('saves')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        setSaveCount(count || 0);
      } catch (error) {
        console.error('Error checking save status:', error);
      }
    };

    checkSaveStatus();
  }, [post.id]);

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!post.restaurant) return;

      try {
        const { data: restaurantData, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', post.restaurant)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching restaurant:', error);
          return;
        }

        if (restaurantData) {
          setRestaurant(restaurantData);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      }
    };

    fetchRestaurant();
  }, [post.restaurant]);

  useEffect(() => {
    if (activePostId != post.id) {
        player.pause();
        setIsPlaying(false);
    }
    if (activePostId == post.id) {
        player.play();
        setIsPlaying(true);
    }
  }, [activePostId, post.id]);
  
  const onPress = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    }
    else {
      player.play();
      setIsPlaying(true);
    } 
  }

  // COMMENTED OUT FOR MVP
  // const onRecipePress = () => {
  //   router.push(`/(tabs)/recipe?id=${post.id}`);
  // }

  // const onShoppingPress = () => {
  //   router.push('/(tabs)/shopping');
  // }

  const onRestaurantPress = () => {
    if (restaurant) {
      setRestaurantModalVisible(true);
    }
  }

  const onSharePress = async () => {
    try {
      // Pause video before sharing
      player.pause();
      setIsPlaying(false);
      
      const shareUrl = 'https://apps.apple.com/us/app/crave-discover-eat-share/id6740149234';
      await Share.share({
        message: `Check out Crave - Discover new eats in your city! ${shareUrl}`,
        url: shareUrl,
        title: 'Crave: Discover, Eat, Share',
      });
      
      // Resume video after sharing if this is still the active post
      setTimeout(() => {
        if (activePostId === post.id && shouldPlay) {
          player.play();
          setIsPlaying(true);
        }
      }, 500); // Give time for share modal to fully close
    } catch (e) {
      console.warn('Share failed', e);
      // Resume video even if share failed
      setTimeout(() => {
        if (activePostId === post.id && shouldPlay) {
          player.play();
          setIsPlaying(true);
        }
      }, 500);
    }
  }

  const toggleLike = async () => {
    try {
      console.log('toggleLike called');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user?.id);
      
      if (!user) {
        console.log('No user found, cannot like');
        return;
      }

      if (isLiked) {
        console.log('Unliking post');
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (!error) {
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
          console.log('Successfully unliked');
        } else {
          console.error('Error unliking:', error);
        }
      } else {
        console.log('Liking post');
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: post.id });

        if (!error) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
          console.log('Successfully liked');
        } else {
          console.error('Error liking:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  const toggleSave = async () => {
    try {
      console.log('toggleSave called');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user?.id);
      
      if (!user) {
        console.log('No user found, cannot save');
        return;
      }

      if (isSaved) {
        console.log('Unsaving post');
        // Unsave
        const { error } = await supabase
          .from('saves')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (!error) {
          setIsSaved(false);
          setSaveCount(prev => prev - 1);
          console.log('Successfully unsaved');
        } else {
          console.error('Error unsaving:', error);
        }
      } else {
        console.log('Saving post');
        // Save
        const { error } = await supabase
          .from('saves')
          .insert({ user_id: user.id, post_id: post.id });

        if (!error) {
          setIsSaved(true);
          setSaveCount(prev => prev + 1);
          console.log('Successfully saved');
        } else {
          console.error('Error saving:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  }

  const openPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openWebsite = (website: string) => {
    Linking.openURL(website);
  };

  const openMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
  };

  return (
    <View style={[styles.container, {height: adjustedHeight}]}>
      <VideoView 
        player={player}
        style={[StyleSheet.absoluteFill, styles.video]}
        contentFit="cover"
      />

       <Pressable onPress={onPress} style={styles.content}>
      <LinearGradient 
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={[StyleSheet.absoluteFill, styles.overlay]}
      />
      {!isPlaying && (<Ionicons style={{ position: 'absolute', alignSelf: 'center', top: '50%'}}
        name="play"
        size={70} 
        color="rgba(255,255,255,0.7)" /> )}
      <SafeAreaView style={{ flex: 1}}>
         <View style={styles.footer}>
          {/* bottom: caption */}
          <View style={styles.leftColumn}>
            {/* Profile picture */}
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicture}>
                <Ionicons name="person" size={16} color="rgba(255, 255, 255, 0.7)" />
              </View>
            )}
            
            {/* Username */}
            <Text style={styles.username}>
              {profile?.username ? `@${profile.username}` : '@anonymous'}
            </Text>
            
            {/* Description */}
            <Text style={styles.caption}>{post.description}</Text>
          </View>
          
          {/* Right side button stack */}
          <View style={styles.rightColumn}>
            {/* Shopping button - COMMENTED OUT FOR MVP */}
            {/* <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onShoppingPress}
              activeOpacity={0.7}
            >
              <Ionicons name="bag-outline" size={24} color="white" />
            </TouchableOpacity> */}
            
            {/* Restaurant button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onRestaurantPress}
              activeOpacity={0.7}
              pointerEvents="auto"
            >
              <Ionicons name="storefront-outline" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Recipe button - COMMENTED OUT FOR MVP */}
            {/* <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onRecipePress}
              activeOpacity={0.7}
            >
              <Ionicons name="restaurant" size={24} color="white" />
            </TouchableOpacity> */}
            
            {/* Like button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={toggleLike}
              activeOpacity={0.7}
              pointerEvents="auto"
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#ff3040" : "white"} 
              />
              {likeCount > 0 && (
                <Text style={styles.actionCount}>{likeCount}</Text>
              )}
            </TouchableOpacity>
            
            {/* Save button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={toggleSave}
              activeOpacity={0.7}
              pointerEvents="auto"
            >
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isSaved ? "#ffa500" : "white"} 
              />
              {saveCount > 0 && (
                <Text style={styles.actionCount}>{saveCount}</Text>
              )}
            </TouchableOpacity>
            
            {/* Share button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onSharePress}
              activeOpacity={0.7}
              pointerEvents="auto"
            >
              <Ionicons name="share-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
        </Pressable>

        {/* Restaurant Modal */}
        <Modal
          visible={restaurantModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setRestaurantModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.restaurantModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{restaurant?.name}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setRestaurantModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.restaurantInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="restaurant" size={20} color="#666" />
                    <Text style={styles.infoText}>{restaurant?.cuisine}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={20} color="#666" />
                    <Text style={styles.infoText}>{restaurant?.address}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="call" size={20} color="#666" />
                    <Text style={styles.infoText}>{restaurant?.phone}</Text>
                  </View>

                  {restaurant?.website && (
                    <View style={styles.infoRow}>
                      <Ionicons name="globe" size={20} color="#666" />
                      <Text style={styles.infoText}>{restaurant.website}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButtonModal}
                    onPress={() => openPhone(restaurant?.phone || '')}
                  >
                    <Ionicons name="call" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButtonModal}
                    onPress={() => openMaps(restaurant?.address || '')}
                  >
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Directions</Text>
                  </TouchableOpacity>

                  {restaurant?.website && (
                    <TouchableOpacity
                      style={styles.actionButtonModal}
                      onPress={() => openWebsite(restaurant.website!)}
                    >
                      <Ionicons name="globe" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
  },
  content: {
    flex: 1,
    padding: 10,
  },
  video: {},
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  caption: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  rightColumn: {
    gap: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  leftColumn: {
    flex: 1,
  },
  profilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    marginBottom: 6,
  },

  overlay: {
    top: '50%',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 10,
  },
  actionCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  restaurantInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButtonModal: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
