import { View, Text, StyleSheet, Pressable, useWindowDimensions, TouchableOpacity } from 'react-native';
import { AVPlaybackStatus, ResizeMode, Video, Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';

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
    };
    activePostId: string;
    shouldPlay: boolean;
};


export default function VideoPost({post, activePostId, shouldPlay }: VideoPost) {
  const video = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus>();
  const [isMuted, setIsMuted] = useState(false);
  const isPlaying = status?.isLoaded && status.isPlaying;
  const { height }= useWindowDimensions();
  const tabBarHeight: number = useBottomTabBarHeight();
  const adjustedHeight: number = height - tabBarHeight;


  useEffect(() => {
    if (!video.current) {
      return;
    }

    // Configure audio to play even when device is muted
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, // Corrected property name
      staysActiveInBackground: false,
      shouldDuckAndroid: true
    });

    // Check if device is in silent mode (iOS only)
    if (Platform.OS === 'ios') {
      // Remove the getIsMutedAsync check since it's not available
      setIsMuted(true); // Start muted on iOS silent mode
    }
  }, []);

// Handle volume button changes only when in silent mode
// Handle volume button changes only when in silent mode
useEffect(() => {
  if (status?.isLoaded && isMuted) {
    const playbackStatus = status as AVPlaybackStatusSuccess;
    // When volume is adjusted (volume will be > 0), unmute the video
    if (playbackStatus.volume > 0) {
      setIsMuted(false);
    }
  }
}, [status]);






  useEffect(() => {
    if (!video.current) {
      return;
    }

    const isActivePost = activePostId === post.id;

    if (isActivePost && shouldPlay) {
      video.current.playAsync();
    } else {
      video.current.pauseAsync();
    }
  }, [activePostId, post.id, shouldPlay]);





  useEffect(() => {
    if (!video.current) {
        return;
    }

    // Cleanup function to ensure video is unloaded when component unmounts
    return () => {
      if (video.current) {
        video.current.unloadAsync();
      }
    };
  }, []); // Empty dependency array to run only on mount/unmount

  useEffect(() => {
    if (!video.current) {
        return;
    }
    if (activePostId != post.id) {
        video.current.pauseAsync();
    }
    if (activePostId == post.id) {
        video.current.playAsync();
    }
  }, [activePostId, post.id]);
  
  const onPress = () => {
    if (!video.current) {
      return;
    }
    if (isPlaying) {
      video.current.pauseAsync();
    }
    else {
      video.current.playAsync();
    } 
  }

  const onRecipePress = () => {
    router.push(`/(tabs)/recipe?id=${post.id}`);
  }

  return (
    <View style={[styles.container, {height: adjustedHeight}]}>
      <Video 
        ref={video}
        source= {{uri: post.video_url }}
        style={[StyleSheet.absoluteFill, styles.video]}
        resizeMode={ResizeMode.COVER}
        onPlaybackStatusUpdate={setStatus}
        isLooping
        isMuted={false}
        volume={1.0}
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
            <Text style={styles.caption}>{post.description}</Text>
          </View>
          
          {/* Right side button stack */}
          <View style={styles.rightColumn}>
            {/* Shopping button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Ionicons name="bag-outline" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Recipe button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onRecipePress}
              activeOpacity={0.7}
            >
              <Ionicons name="restaurant" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Like button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Ionicons name="heart-outline" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Comments button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Share button */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
        </Pressable> 
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
});
