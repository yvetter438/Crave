import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

interface Follower {
  user_id: string;
  username: string;
  displayname: string;
  avatar_url: string | null;
  followers_count: number;
  created_at: string;
}

export default function FollowersScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  useEffect(() => {
    fetchUsername();
    fetchFollowers(0);
  }, [id]);

  const fetchUsername = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', id)
      .single();
    
    if (data) setUsername(data.username);
  };

  const fetchFollowers = async (currentOffset: number) => {
    const isLoadingMore = currentOffset > 0;
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .rpc('get_followers', {
          p_user_id: id,
          p_limit: LIMIT,
          p_offset: currentOffset
        });

      if (error) {
        console.error('Error fetching followers:', error);
        setError('Unable to load followers. Please try again later.');
        return;
      }

      const newFollowers = data || [];
      
      if (isLoadingMore) {
        setFollowers(prev => [...prev, ...newFollowers]);
      } else {
        setFollowers(newFollowers);
      }
      
      // If we got less than the limit, there are no more results
      setHasMore(newFollowers.length === LIMIT);
      setOffset(currentOffset + newFollowers.length);
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !error) {
      fetchFollowers(offset);
    }
  };

  const renderFollowerItem = ({ item }: { item: Follower }) => {
    const avatarUrl = item.avatar_url
      ? supabase.storage.from('avatars').getPublicUrl(item.avatar_url).data.publicUrl
      : null;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => router.push(`/user/${item.user_id}`)}
        activeOpacity={0.7}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#bbb" />
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{item.username}</Text>
          <Text style={styles.displayname}>{item.displayname}</Text>
        </View>

        {item.followers_count > 0 && (
          <View style={styles.followersContainer}>
            <Text style={styles.followersCount}>{item.followers_count}</Text>
            <Text style={styles.followersLabel}>followers</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#ed4956" />
          <Text style={styles.emptyStateTitle}>Unable to Load</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setOffset(0);
              setHasMore(true);
              fetchFollowers(0);
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={64} color="#ddd" />
        <Text style={styles.emptyStateTitle}>No followers yet</Text>
        <Text style={styles.emptyStateText}>
          When people follow this account, they'll show up here
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#0095f6" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {username ? `@${username}` : 'Followers'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095f6" />
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderFollowerItem}
          keyExtractor={(item, index) => `${item.user_id}-${index}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
}

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
  listContainer: {
    paddingTop: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#efefef',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  displayname: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  followersContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  followersCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  followersLabel: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0095f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

