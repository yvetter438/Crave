import VideoPost from '@/components/VideoPost';
import EndOfFeedCard from '@/components/EndOfFeedCard';
import { View, Text, StyleSheet, FlatList, AppState, RefreshControl  } from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
// COMMENTED OUT: Gesture handler imports since we're not using swipe anymore
// import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
// COMMENTED OUT: runOnJS since it's only used in the swipe gesture
// import { runOnJS } from 'react-native-reanimated';
import { useActivePost } from '@/context/ActivePostContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function Tab() {
  const { activePostId, setActivePostId}  = useActivePost();
  const [posts, setPosts] = useState([]);
  const [isAppActive, setIsAppActive] = useState(true);
  const [isFocused, setIsFocused] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [offset, setOffset] = useState(0);
  const [feedSeed, setFeedSeed] = useState(Math.random());

  const shouldPlay = isFocused && isAppActive;

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      setIsAppActive(nextAppState === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);


  
  // Fetch ranked feed with offset pagination
  const fetchRankedFeed = async (resetFeed: boolean = false) => {
    // Prevent double-fetching
    if (resetFeed && isRefreshing) return;
    if (!resetFeed && isLoading) return;
    
    try {
      if (resetFeed) {
        setIsRefreshing(true);
        setHasReachedEnd(false);
      } else {
        setIsLoading(true);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const currentOffset = resetFeed ? 0 : offset;
      const currentSeed = resetFeed ? Math.random() : feedSeed;
      
      if (resetFeed) {
        setFeedSeed(currentSeed); // Store new seed for this feed session
      }

      console.log(`📊 Fetching feed - Offset: ${currentOffset}, Seed: ${currentSeed.toFixed(6)}`);

      // Call the ranked feed RPC function with offset and seed
      // Use moderation-aware feed function that filters blocked users and only shows approved posts
      const { data, error } = await supabase.rpc('get_ranked_feed_with_moderation', {
        p_user_id: user.id,
        p_limit: 10,
        p_offset: currentOffset,
        p_seed: currentSeed
      });

      if (error) {
        console.error('Error fetching ranked feed:', error);
        
        // If network error and this is a refresh, try to keep old data
        if (error.message?.includes('Network') || error.message?.includes('fetch')) {
          console.log('Network error detected - keeping existing feed');
        }
        
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (!data || data.length === 0) {
        console.log('Reached end of feed');
        setHasReachedEnd(true);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Format the data and generate video URLs
      const formattedData = data.map((item: any) => {
        // Generate full video URL from storage path
        // If video_url is already a full URL (starts with http), use it as-is
        // Otherwise, determine which bucket and generate URL
        let videoUrl = item.video_url;
        if (!videoUrl.startsWith('http')) {
          // Check if it's in the new private bucket (videos) or old public bucket (posts-videos)
          // New uploads go to 'videos' bucket, old ones are in 'posts-videos'
          // If path contains userId folder structure, it's in 'videos' bucket
          const isNewVideo = videoUrl.includes('/');
          
          if (isNewVideo) {
            // New video in private 'videos' bucket - generate public URL
            const { data: urlData } = supabase.storage
              .from('videos')
              .getPublicUrl(videoUrl);
            videoUrl = urlData.publicUrl;
          } else {
            // Old video in public 'posts-videos' bucket
            const { data: urlData } = supabase.storage
              .from('posts-videos')
              .getPublicUrl(videoUrl);
            videoUrl = urlData.publicUrl;
          }
        }
        
        return {
          id: item.id.toString(),
          video_url: videoUrl,
          description: item.description,
          user: item.user_id,
          restaurant: item.restaurant,
        };
      });
      
      if (resetFeed) {
        // Replace posts with fresh feed
        setPosts(formattedData);
        setOffset(10); // Next offset
      } else {
        // Append to existing posts with deduplication
        setPosts((currentPosts) => {
          // Create a Set of existing post IDs for fast lookup
          const existingIds = new Set(currentPosts.map(p => p.id));
          
          // Filter out duplicates from new data
          const uniqueNewPosts = formattedData.filter(post => !existingIds.has(post.id));
          
          // Combine current posts with unique new posts
          return [...currentPosts, ...uniqueNewPosts];
        });
        setOffset(currentOffset + 10);
      }

      // Check if we got fewer posts than requested (last page)
      if (data.length < 10) {
        setHasReachedEnd(true);
      }

      // Set first post as active
      if (formattedData.length > 0 && (resetFeed || posts.length === 0)) {
        setActivePostId(formattedData[0].id);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      console.error('Unexpected error fetching ranked feed:', err);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial feed load
  useEffect(() => {
    fetchRankedFeed(true);
  }, []);
  

  // Load more posts when reaching the end
  const onEndReached = () => {
    if (!isLoading && !hasReachedEnd) {
      fetchRankedFeed(false);
    }
  };

  // Pull to refresh / Rewatch handler
  const handleRewatch = () => {
    // Only rewatch if not already loading
    if (isRefreshing) return;
    
    setPosts([]);
    setOffset(0);
    setHasReachedEnd(false);
    // Don't set seed here - let fetchRankedFeed generate it
    fetchRankedFeed(true);
  };
  
///previous activePostId does not get registered
  const viewabilityConfigCallbackPairs = useRef([
      {
        viewabilityConfig: { itemVisiblePercentThreshold: 50 },
      onViewableItemsChanged: ({ changed, viewableItems }) => {
        if (viewableItems.length > 0 && viewableItems[0].isViewable) {
        //  console.log('Previous activePostId:', activePostId); // Log previous activePostId
        //  console.log('New activePostId:', viewableItems[0].item.id); // Log new activePostId
          setActivePostId(viewableItems[0].item.id); 
        }
      },
    },
  ]);

  // COMMENTED OUT: Swipe gesture for recipe navigation
  // const swipeGesture = Gesture.Pan()
  //   .activeOffsetX(50) // Start detecting after 50px horizontal movement
  //   .onEnd((event) => {
  //   //  console.log('Swipe event:', event) //debug log
  //     if (event.velocityX > 500) { // Swipe right with good velocity
  //       runOnJS(router.push)(`/(tabs)/recipe?id=${activePostId}`);
  //     }
  //   });


  // Prepare data with end card if reached end
  const feedData = hasReachedEnd 
    ? [...posts, { id: 'end-of-feed', isEndCard: true }]
    : posts;

  // Empty state component
  const renderEmptyState = () => {
    if (isLoading || isRefreshing) {
      return null; // Don't show empty state while loading
    }

    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateContent}>
          <Ionicons name="restaurant-outline" size={80} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            New food content is being prepared!{'\n'}Check back soon to see delicious posts.
          </Text>
          <Text style={styles.emptyStateHint}>
            Pull down to refresh
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
      data={feedData} 
      renderItem={({ item }) => {
        if (item.isEndCard) {
          return <EndOfFeedCard onRewatch={handleRewatch} />;
        }
        return (
          <VideoPost 
            post={item} 
            activePostId={activePostId} 
            shouldPlay={shouldPlay}
          />
        );
      }}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      pagingEnabled
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={1}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRewatch}
          tintColor="#fff"
        />
      }
      removeClippedSubviews={true}
      maxToRenderPerBatch={3}
      windowSize={5}
      initialNumToRender={2}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  emptyStateContainer: {
    flex: 1,
    height: '100%',
    minHeight: 600,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 40,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
