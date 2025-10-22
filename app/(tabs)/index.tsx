import VideoPost from '@/components/VideoPost';
import EndOfFeedCard from '@/components/EndOfFeedCard';
import { View,  StyleSheet, FlatList, AppState, RefreshControl  } from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
// COMMENTED OUT: Gesture handler imports since we're not using swipe anymore
// import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
// COMMENTED OUT: runOnJS since it's only used in the swipe gesture
// import { runOnJS } from 'react-native-reanimated';
import { useActivePost } from '@/context/ActivePostContext';
import { useFocusEffect } from '@react-navigation/native';

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
      const { data, error } = await supabase.rpc('get_ranked_feed_offset', {
        p_user_id: user.id,
        p_limit: 10,
        p_offset: currentOffset,
        p_seed: currentSeed
      });

      if (error) {
        console.error('Error fetching ranked feed:', error);
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

      // Format the data
      const formattedData = data.map((item: any) => ({
        id: item.id.toString(),
        video_url: item.video_url,
        description: item.description,
        user: item.user_id,
        restaurant: item.restaurant,
      }));

      // DEBUG: Log post IDs to check for duplicates
      console.log('Fetched post IDs:', formattedData.map(p => p.id).join(', '));
      
      if (resetFeed) {
        // Replace posts with fresh feed
        setPosts(formattedData);
        setOffset(10); // Next offset
        console.log('RESET: Total posts in feed:', formattedData.length);
      } else {
        // Append to existing posts
        setPosts((currentPosts) => {
          const newPosts = [...currentPosts, ...formattedData];
          console.log('APPEND: Total posts in feed:', newPosts.length);
          
          // DEBUG: Check for duplicates
          const postIds = newPosts.map(p => p.id);
          const uniqueIds = new Set(postIds);
          if (postIds.length !== uniqueIds.size) {
            console.error('🚨 DUPLICATE DETECTED IN FEED!');
            console.error('Duplicate post IDs:', postIds.filter((id, idx) => postIds.indexOf(id) !== idx));
          }
          
          return newPosts;
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
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRewatch}
          tintColor="#fff"
        />
      }
    />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
