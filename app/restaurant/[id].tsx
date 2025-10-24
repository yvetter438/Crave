import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking,
  SafeAreaView,
  FlatList,
  Dimensions,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  address: string;
  phone: string;
  website: string | null;
}

interface Post {
  id: number;
  created_at: string;
  video_url: string;
  description: string;
  thumbnail_url: string | null;
}

export default function RestaurantPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurant();
    fetchRestaurantPosts();
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching restaurant:', error);
        return;
      }

      setRestaurant(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, video_url, description, created_at, thumbnail_url')
        .eq('restaurant', id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching restaurant posts:', error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openPhone = async (phoneNumber: string) => {
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      console.error('Error opening phone:', error);
    }
  };

  const openMaps = async (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `http://maps.apple.com/?q=${encodedAddress}`;
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  const openWebsite = async (website: string) => {
    try {
      let url = website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening website:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Restaurant</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Restaurant</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Restaurant not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postContainer}
      onPress={() => router.push(`/post/${item.id}?context=restaurant&contextId=${id}`)}
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
          <Ionicons name="restaurant" size={40} color="rgba(255,255,255,0.3)" />
        </View>
      )}
      <View style={styles.playIconOverlay}>
        <Ionicons name="play" size={20} color="rgba(255,255,255,0.9)" />
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{restaurant.name}</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        ListHeaderComponent={() => (
          <>
            {/* Restaurant Name */}
            <Text style={styles.restaurantName}>{restaurant.name}</Text>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openPhone(restaurant.phone)}
              >
                <Ionicons name="call" size={20} color="white" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openMaps(restaurant.address)}
              >
                <Ionicons name="navigate" size={20} color="white" />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>

              {restaurant.website && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openWebsite(restaurant.website!)}
                >
                  <Ionicons name="globe" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Website</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Posts Section Header */}
            <View style={styles.postsSectionHeader}>
              <Text style={styles.sectionTitle}>Posts</Text>
              <Text style={styles.postCount}>{posts.length}</Text>
            </View>
          </>
        )}
        contentContainerStyle={styles.postsContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  postsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  postCount: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
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
});

