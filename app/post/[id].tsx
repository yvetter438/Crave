import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import VideoPost from '../../components/VideoPost';
import { useActivePost } from '../../context/ActivePostContext';

interface Post {
  id: string;
  video_url: string;
  description: string;
  user: string;
  restaurant: number | null;
}

type FeedContext = 'profile' | 'restaurant' | 'search' | 'default';

export default function PostDetailScreen() {
  const { id, context, contextId } = useLocalSearchParams<{
    id: string;
    context?: string;
    contextId?: string;
  }>();
  
  const router = useRouter();
  const { activePostId, setActivePostId } = useActivePost();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreAfter, setHasMoreAfter] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [initialIndex, setInitialIndex] = useState(0);
  const [initialPost, setInitialPost] = useState<any>(null);

  const feedContext: FeedContext = (context as FeedContext) || 'default';

  useEffect(() => {
    loadInitialPost();
  }, [id]);

  const loadInitialPost = async () => {
    try {
      setLoading(true);

      // Fetch the initial post
      const { data: clickedPost, error: initialError } = await supabase
        .from('posts')
        .select('id, video_url, description, user, restaurant, created_at, status')
        .eq('id', id)
        .single();

      if (initialError || !clickedPost) {
        console.error('Error fetching initial post:', initialError);
        setLoading(false);
        return;
      }

      // Check if post is removed/rejected - block access
      if (clickedPost.status === 'removed') {
        console.log('Post is removed, redirecting back');
        router.back();
        return;
      }

      setInitialPost(clickedPost);

      // For profile/restaurant context, load videos before and after
      if (feedContext === 'profile' || feedContext === 'restaurant') {
        const allContextPosts = await fetchAllContextPosts(clickedPost);
        
        // Find the index of the clicked post
        const clickedIndex = allContextPosts.findIndex(p => p.id.toString() === id);
        
        if (clickedIndex !== -1) {
          setPosts(allContextPosts.map(p => ({ ...p, id: p.id.toString() })));
          setInitialIndex(clickedIndex);
          setActivePostId(id);
        }
      } else {
        // For default/search context, load clicked post + feed after
        const additionalPosts = await fetchContextualPosts(clickedPost, 0);
        const allPosts = [
          { ...clickedPost, id: clickedPost.id.toString() },
          ...additionalPosts.map(p => ({ ...p, id: p.id.toString() }))
        ];
        setPosts(allPosts);
        setInitialIndex(0);
        setActivePostId(id);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllContextPosts = async (clickedPost: any): Promise<any[]> => {
    try {
      let query;

      if (feedContext === 'profile') {
        query = supabase
          .from('posts')
          .select('id, video_url, description, user, restaurant, created_at')
          .eq('user', contextId || clickedPost.user)
          .neq('status', 'removed') // Exclude removed posts
          .order('created_at', { ascending: false })
          .limit(100); // Load more posts for scrolling
      } else if (feedContext === 'restaurant') {
        query = supabase
          .from('posts')
          .select('id, video_url, description, user, restaurant, created_at')
          .eq('restaurant', contextId || clickedPost.restaurant)
          .neq('status', 'removed') // Exclude removed posts
          .order('created_at', { ascending: false })
          .limit(100);
      }

      if (query) {
        const { data, error } = await query;
        if (error) {
          console.error('Error fetching context posts:', error);
          return [];
        }
        return data || [];
      }

      return [];
    } catch (error) {
      console.error('Error in fetchAllContextPosts:', error);
      return [];
    }
  };

  const fetchContextualPosts = async (initialPost: any, offset: number = 0): Promise<any[]> => {
    const limit = 10;

    try {
      let query;

      switch (feedContext) {
        case 'profile':
          // Fetch more posts from the same user
          query = supabase
            .from('posts')
            .select('id, video_url, description, user, restaurant')
            .eq('user', contextId || initialPost.user)
            .neq('id', initialPost.id)
            .neq('status', 'removed') // Exclude removed posts
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
          break;

        case 'restaurant':
          // Fetch more posts from the same restaurant
          query = supabase
            .from('posts')
            .select('id, video_url, description, user, restaurant')
            .eq('restaurant', contextId || initialPost.restaurant)
            .neq('id', initialPost.id)
            .neq('status', 'removed') // Exclude removed posts
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
          break;

        case 'search':
          // For search, fetch general feed (can be enhanced with search context later)
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          
          const { data, error } = await supabase.rpc('get_ranked_feed_offset', {
            p_user_id: user.id,
            p_limit: limit,
            p_offset: offset,
            p_seed: Math.random()
          });

          if (error) {
            console.error('Error fetching search feed:', error);
            return [];
          }

          return (data || []).filter((p: any) => p.id.toString() !== initialPost.id.toString());

        case 'default':
        default:
          // Fetch regular feed using the ranked algorithm
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) return [];
          
          const { data: feedData, error: feedError } = await supabase.rpc('get_ranked_feed_offset', {
            p_user_id: currentUser.id,
            p_limit: limit,
            p_offset: offset,
            p_seed: Math.random()
          });

          if (feedError) {
            console.error('Error fetching default feed:', feedError);
            return [];
          }

          return (feedData || []).filter((p: any) => p.id.toString() !== initialPost.id.toString());
      }

      if (query) {
        const { data, error } = await query;

        if (error) {
          console.error('Error fetching contextual posts:', error);
          return [];
        }

        return data || [];
      }

      return [];
    } catch (error) {
      console.error('Error in fetchContextualPosts:', error);
      return [];
    }
  };

  const loadMorePosts = async () => {
    // Only load more for default/search context (profile/restaurant already loaded all)
    if (feedContext === 'profile' || feedContext === 'restaurant') return;
    if (loadingMore || !hasMoreAfter || posts.length === 0 || !initialPost) return;

    setLoadingMore(true);

    try {
      const currentOffset = posts.length - 1;
      const morePosts = await fetchContextualPosts(initialPost, currentOffset);

      if (morePosts.length === 0) {
        setHasMoreAfter(false);
      } else {
        setPosts(prev => [...prev, ...morePosts.map(p => ({ ...p, id: p.id.toString() }))]);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const visiblePost = viewableItems[0];
      if (visiblePost?.item?.id) {
        setActivePostId(visiblePost.item.id);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    const isActive = item.id === activePostId;
    
    return (
      <View style={styles.postContainer}>
        <VideoPost 
          post={item} 
          activePostId={activePostId}
          shouldPlay={isActive}
          isFullScreen={true}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
      />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <View style={styles.backButtonCircle}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  postContainer: {
    height: screenHeight,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 1000,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

