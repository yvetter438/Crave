import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Dimensions, Modal, TouchableOpacity, Alert } from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
//post type
interface Post {
  id: number;
  created_at: string;
  video_url: string;
  description: string;
  recipe: string;
}

//profile type
interface Profile {
  id: number;
  user_id: string;
  username: string;
  displayname: string;
  avatar_url: string | null;
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

  const fetchUserPosts = async (userId: string) => {
    try {  
    //  console.log('Fetching posts for user:', userId) //debug log
      
      // First try to get all posts
      const { data: allPosts, error: allPostsError } = await supabase
        .from('posts')
        .select('*');
      
    //  console.log('All posts:', allPosts) //debug log
  
      // Then try with the user filter
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user', userId)
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Supabase error:', error) //debug log
        throw error;
      }
  
      if (data) {
      //  console.log('Filtered posts:', data) //debug log
        setPosts(data);
        setPostCount(data.length); //counts the number of posts
      }
    } catch (error) {
      Alert.alert('Error fetching posts');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <Video
        source={{ uri: item.video_url }}
        style={styles.postThumbnail}
        resizeMode="cover"
        shouldPlay={false}
        isLooping
      />
      
    </View>
  );


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
        <View style={{ flex: 1}} /> 
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {/* <TouchableOpacity onPress={() => setModalVisible(true)}> */}
        <Image source={{ uri: image }} style={styles.profileImage} />
      {/* </TouchableOpacity> */}
      <Text style={styles.username}>
        {profile?.username ? `@${profile.username}` : (session?.user?.email || 'Not logged in')}
      </Text>
      {profile?.displayname && (
        <Text style={styles.displayname}>
          {profile.displayname}
        </Text>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.stats}>
          <Text style={styles.statNumber}>{postCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        {/*
        <View style={styles.stats}>
          <Text style={styles.statNumber}>1.2K</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statNumber}>200</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        */}
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsContainer}
        refreshing={loading}
        onRefresh={() => session?.user && fetchUserPosts(session.user.id)}
      />

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
const postHeight = postSize * 1.5;

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
  postThumbnail: {
    width: postSize,
    height: postHeight,
    margin: 2,
    backgroundColor: '#000',
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
    justifyContent: 'flex-end',
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
});
