import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image,
  ActivityIndicator,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

interface UserProfile {
  id: number;
  user_id: string;
  username: string;
  displayname: string;
  avatar_url: string | null;
  bio?: string;
  followers_count?: number;
}

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  address: string;
}

type SearchResult = 
  | { type: 'user'; data: UserProfile }
  | { type: 'restaurant'; data: Restaurant };

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery.trim());
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      // Search users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, user_id, username, displayname, avatar_url, bio, followers_count')
        .or(`username.ilike.%${query}%,displayname.ilike.%${query}%`)
        .order('followers_count', { ascending: false })
        .limit(50);

      if (usersError) {
        console.error('User search error:', usersError);
      }

      // Search restaurants (by name or cuisine type)
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name, cuisine, address')
        .or(`name.ilike.%${query}%,cuisine.ilike.%${query}%`)
        .limit(50);

      if (restaurantsError) {
        console.error('Restaurant search error:', restaurantsError);
      }

      // Combine results
      const combinedResults: SearchResult[] = [
        ...(usersData || []).map(user => ({ type: 'user' as const, data: user })),
        ...(restaurantsData || []).map(restaurant => ({ type: 'restaurant' as const, data: restaurant }))
      ];

      setResults(combinedResults);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    Keyboard.dismiss();
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const handleRestaurantPress = (restaurantId: number) => {
    router.push(`/restaurant/${restaurantId}`);
  };

  const renderUserItem = (item: UserProfile) => {
    const avatarUrl = item.avatar_url 
      ? supabase.storage.from('avatars').getPublicUrl(item.avatar_url).data.publicUrl
      : null;

    return (
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => handleUserPress(item.user_id)}
        activeOpacity={0.7}
      >
        <View style={styles.userCardContent}>
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
            {item.bio && (
              <Text style={styles.bio} numberOfLines={1}>
                {item.bio}
              </Text>
            )}
          </View>

          {item.followers_count !== undefined && item.followers_count > 0 && (
            <View style={styles.followersContainer}>
              <Text style={styles.followersCount}>
                {item.followers_count}
              </Text>
              <Text style={styles.followersLabel}>followers</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRestaurantItem = (item: Restaurant) => {
    return (
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => handleRestaurantPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.userCardContent}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="restaurant" size={24} color="#FF6B6B" />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.name}</Text>
            <Text style={styles.displayname}>{item.cuisine}</Text>
            <Text style={styles.bio} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
    if (item.type === 'user') {
      return renderUserItem(item.data);
    } else {
      return renderRestaurantItem(item.data);
    }
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color="#ddd" />
          <Text style={styles.emptyStateTitle}>Search for people & restaurants & cuisines</Text>
          <Text style={styles.emptyStateText}>
            Find friends or discover restaurants by name or cuisine
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="person-outline" size={64} color="#ddd" />
        <Text style={styles.emptyStateTitle}>No results found</Text>
        <Text style={styles.emptyStateText}>
          Try searching for a different name
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#8e8e8e" style={styles.searchIcon} />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#8e8e8e"
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="#8e8e8e" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0095f6" />
          </View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.type}-${item.data.id}`}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#efefef',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    paddingTop: 8,
  },
  userCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#efefef',
    backgroundColor: '#fff',
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
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
    marginBottom: 2,
  },
  bio: {
    fontSize: 13,
    color: '#8e8e8e',
    marginTop: 2,
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
});

