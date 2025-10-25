import { View, Text, StyleSheet, Pressable, useWindowDimensions, TouchableOpacity, Image, AppState, ActionSheetIOS, Alert } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState, useEffect } from 'react';
import { Platform, Share } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import CommentSheet from './CommentSheet';
import ReportModal from './ReportModal';
import BlockUserModal from './BlockUserModal';

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
    isFullScreen?: boolean; // Optional prop to indicate full screen mode (no tab bar)
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


export default function VideoPost({post, activePostId, shouldPlay, isFullScreen = false }: VideoPost) {
  const player = useVideoPlayer(post.video_url, (player) => {
    player.loop = true;
    player.muted = false;
    
    // Add error handling
    player.addListener('error', (error) => {
      console.error('Video player error:', error);
      setHasError(true);
    });
    
    player.addListener('statusChange', (status) => {
      if (status === 'error') {
        console.error('Video player status error');
        setHasError(true);
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      } else if (status === 'readyToPlay') {
        setHasError(false);
        setRetryCount(0);
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      } else if (status === 'loading') {
        setIsLoading(true);
        // Set a timeout to detect stuck loading
        loadingTimeoutRef.current = setTimeout(() => {
          console.log('Video loading timeout - marking as error');
          setHasError(true);
          setIsLoading(false);
        }, 10000); // 10 second timeout
      }
    });
  });
  const [isMuted, setIsMuted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const { height }= useWindowDimensions();
  
  // In full screen mode (post detail), use full height. In tab mode, subtract tab bar height (90px)
  const tabBarHeight: number = isFullScreen ? 0 : 90;
  const adjustedHeight: number = height - tabBarHeight;
  
  // Track playing state manually
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const maxRetries = 3;
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restaurantFetchedRef = useRef<number | null>(null);
  
  // Double-tap to like
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);
  const doubleTapDelay = 300; // milliseconds
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Engagement tracking
  const watchStartTimeRef = useRef<number | null>(null);
  const impressionLoggedRef = useRef<Set<string>>(new Set());
  const watchEventLoggedRef = useRef<Set<string>>(new Set());

  // Recovery function to refresh the video player
  const recoverVideoPlayer = () => {
    if (retryCount < maxRetries) {
      console.log(`Attempting video recovery, attempt ${retryCount + 1}/${maxRetries}`);
      setRetryCount(prev => prev + 1);
      setHasError(false);
      
      // Force refresh by recreating the player
      // This will be handled by the parent component re-rendering
      setTimeout(() => {
        if (activePostId === post.id && shouldPlay) {
          player.play();
          setIsPlaying(true);
        }
      }, 1000);
    } else {
      console.log('Max retry attempts reached, video recovery failed');
    }
  };

  useEffect(() => {
    // Configure audio to play even when device is muted
    player.muted = false;

    // Check if device is in silent mode (iOS only)
    if (Platform.OS === 'ios') {
      setIsMuted(true); // Start muted on iOS silent mode
    }
    
    // Cleanup timers on unmount
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
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

    if (isActivePost && shouldPlay && !hasError) {
      try {
        player.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
        setHasError(true);
      }
    } else {
      try {
        player.pause();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing video:', error);
      }
    }
  }, [activePostId, post.id, shouldPlay, hasError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);



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

  // Fetch comment count
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const { data: postData, error } = await supabase
          .from('posts')
          .select('comments_count')
          .eq('id', post.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching comment count:', error);
          return;
        }

        setCommentCount(postData?.comments_count || 0);
      } catch (error) {
        console.error('Error fetching comment count:', error);
      }
    };

    fetchCommentCount();
  }, [post.id]);

  // Fetch restaurant data only once when post.restaurant changes
  useEffect(() => {
    // Skip if already fetched for this restaurant ID
    if (restaurantFetchedRef.current === post.restaurant) {
      return;
    }
    
    if (!post.restaurant) {
      setRestaurant(null);
      restaurantFetchedRef.current = null;
      return;
    }

    const fetchRestaurant = async () => {
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
          console.log('Restaurant data fetched:', restaurantData.name);
          setRestaurant(restaurantData);
          restaurantFetchedRef.current = post.restaurant;
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

  // Track impression when video becomes active
  useEffect(() => {
    const logImpression = async () => {
      if (activePostId === post.id && !impressionLoggedRef.current.has(post.id)) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Log impression using RPC function
          await supabase.rpc('log_impression', {
            p_user_id: user.id,
            p_post_id: parseInt(post.id)
          });

          impressionLoggedRef.current.add(post.id);
          console.log('Impression logged for post:', post.id);
        } catch (error) {
          console.error('Error logging impression:', error);
        }
      }
    };

    // Debounce impression logging by 500ms
    const timeoutId = setTimeout(logImpression, 500);
    return () => clearTimeout(timeoutId);
  }, [activePostId, post.id]);

  // Track watch time
  useEffect(() => {
    if (isPlaying) {
      // Start timer when video plays
      watchStartTimeRef.current = Date.now();
    } else {
      // When video pauses, check if watch duration >= 2s
      if (watchStartTimeRef.current && !watchEventLoggedRef.current.has(post.id)) {
        const watchDuration = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);
        
        if (watchDuration >= 2) {
          // Log watch event
          const logWatchEvent = async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('watch_events')
                .insert({
                  user_id: user.id,
                  post_id: parseInt(post.id),
                  watch_duration_seconds: watchDuration
                });

              if (!error) {
                watchEventLoggedRef.current.add(post.id);
                console.log(`Watch event logged: ${watchDuration}s for post ${post.id}`);
              }
            } catch (error) {
              console.error('Error logging watch event:', error);
            }
          };

          logWatchEvent();
        }
        
        watchStartTimeRef.current = null;
      }
    }
  }, [isPlaying, post.id]);
  
  const onPress = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    // Check for double-tap
    if (timeSinceLastTap < doubleTapDelay && timeSinceLastTap > 0) {
      // Double-tap detected - clear single tap timer and like the post
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      handleDoubleTap();
      lastTapRef.current = 0; // Reset
      return;
    }
    
    // Potential single tap - wait to see if double tap comes
    lastTapRef.current = now;
    
    // Clear any existing timer
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
    }
    
    // Wait for doubleTapDelay before executing single tap action
    singleTapTimerRef.current = setTimeout(() => {
      handleSingleTap();
      singleTapTimerRef.current = null;
    }, doubleTapDelay);
  };
  
  const handleSingleTap = () => {
    if (hasError) {
      // If there's an error, try to recover
      recoverVideoPlayer();
      return;
    }
    
    if (isPlaying) {
      try {
        player.pause();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing video on tap:', error);
        setHasError(true);
      }
    } else {
      try {
        player.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video on tap:', error);
        setHasError(true);
      }
    }
  };
  
  const handleDoubleTap = async () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Show heart animation
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
    
    // Like the post if not already liked
    if (!isLiked) {
      await toggleLike();
    }
  };

  // COMMENTED OUT FOR MVP
  // const onRecipePress = () => {
  //   router.push(`/(tabs)/recipe?id=${post.id}`);
  // }

  // const onShoppingPress = () => {
  //   router.push('/(tabs)/shopping');
  // }

  const onRestaurantPress = () => {
    if (restaurant) {
      router.push(`/restaurant/${restaurant.id}`);
    }
  }

  const onSharePress = async () => {
    try {
      // Pause video before sharing
      player.pause();
      setIsPlaying(false);
      
      // Create deep link to this specific video
      const deepLink = `crave://post/${post.id}`;
      const appStoreUrl = 'https://apps.apple.com/us/app/crave-discover-eat-share/id6740149234';
      
      // Get post description (truncate if too long)
      const description = post.description?.substring(0, 80) || 'Check out this video on Crave';
      const truncatedDescription = post.description && post.description.length > 80 
        ? `${description}...` 
        : description;
      
      // Create one unified message (like Instagram/TikTok)
      const shareMessage = `${truncatedDescription}\n\n🔗 ${deepLink}\n\n📱 Get Crave: ${appStoreUrl}`;
      
      await Share.share({
        message: shareMessage,
        // Don't use separate 'url' parameter - it creates multiple messages on iOS
        title: 'Check out this video on Crave!',
      });
      
      // Log share event
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('log_share_event', {
            p_post_id: parseInt(post.id),
            p_user_id: user.id
          });
        }
      } catch (error) {
        console.error('Error logging share event:', error);
      }
      
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
        // Haptic feedback for unlike (lighter)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
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
        // Haptic feedback for like (medium - only if not from double-tap)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Like with upsert to handle duplicates gracefully
        const { error } = await supabase
          .from('likes')
          .upsert(
            { user_id: user.id, post_id: post.id },
            { 
              onConflict: 'user_id,post_id',
              ignoreDuplicates: true 
            }
          );

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

  const onCommentPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComments(true);
  }

  const onReportPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Check if viewing own post
    const { data: { user } } = await supabase.auth.getUser();
    const isOwnPost = user?.id === post.user;
    
    if (isOwnPost) {
      // Show limited options for own post
      Alert.alert('Post Options', 'More options coming soon!');
      return;
    }
    
    if (Platform.OS === 'ios') {
      // iOS Action Sheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report Post', 'Block User'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: 'Post Options',
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
        'Post Options',
        'Choose an action',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report Post', onPress: () => setShowReportModal(true) },
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
    // Close the modal and let the feed refresh naturally
    // The feed will automatically filter out this user's posts
    setShowBlockModal(false);
    // Don't navigate back - just let the user continue watching
  };

  const handleCommentsClose = async () => {
    setShowComments(false);
    // Refresh comment count after closing
    try {
      const { data: postData, error } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', post.id)
        .single();

      if (!error && postData) {
        setCommentCount(postData.comments_count || 0);
      }
    } catch (error) {
      console.error('Error refreshing comment count:', error);
    }
  }

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
      {!isPlaying && (
        <Ionicons 
          style={{ position: 'absolute', alignSelf: 'center', top: '50%'}}
          name={hasError ? "refresh" : "play"}
          size={70} 
          color="rgba(255,255,255,0.7)" 
        />
      )}
      
      {/* Double-tap like animation */}
      {showLikeAnimation && (
        <Ionicons 
          style={{ 
            position: 'absolute', 
            alignSelf: 'center', 
            top: '50%',
            transform: [{ translateY: -50 }]
          }}
          name="heart"
          size={120} 
          color={Colors.primary}
        />
      )}
      
      <SafeAreaView style={{ flex: 1}}>
         <View style={styles.footer}>
          {/* bottom: caption */}
          <View style={styles.leftColumn}>
            {/* Glassmorphic restaurant button above profile */}
            {restaurant && restaurant.name && (
              <TouchableOpacity 
                style={styles.restaurantGlassButton}
                onPress={onRestaurantPress}
                activeOpacity={0.8}
                pointerEvents="auto"
              >
                <View style={styles.restaurantGlassContent}>
                  <Ionicons name="location" size={14} color="white" style={styles.locationIcon} />
                  <Text style={styles.restaurantGlassText} numberOfLines={1} ellipsizeMode="tail">
                    {restaurant.name}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            
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
                color={isLiked ? Colors.primary : "white"} 
              />
              {likeCount > 0 && (
                <Text style={styles.actionCount}>{likeCount}</Text>
              )}
            </TouchableOpacity>
            
            {/* Comment button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onCommentPress}
              activeOpacity={0.7}
              pointerEvents="auto"
            >
              <Ionicons 
                name="chatbubble-outline" 
                size={24} 
                color="white" 
              />
              {commentCount > 0 && (
                <Text style={styles.actionCount}>{commentCount}</Text>
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
                color={isSaved ? Colors.secondary : "white"} 
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
            
            {/* Report button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onReportPress}
              activeOpacity={0.7}
              pointerEvents="auto"
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
        </Pressable>

      {/* Comment Sheet */}
      <CommentSheet
        visible={showComments}
        onClose={handleCommentsClose}
        postId={post.id}
        initialCommentCount={commentCount}
      />

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetId={parseInt(post.id, 10)}
        targetDescription={`@${profile?.username || 'anonymous'}'s post`}
      />

      {/* Block User Modal */}
      {profile && (
        <BlockUserModal
          visible={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          userId={post.user}
          username={profile.username}
          onBlockSuccess={handleBlockSuccess}
        />
      )}
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
  restaurantGlassButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    backdropFilter: 'blur(10px)',
    maxWidth: '85%',
  },
  restaurantGlassContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 6,
  },
  restaurantGlassText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
