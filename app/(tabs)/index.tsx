import VideoPost from '@/components/VideoPost';
import { View,  StyleSheet, FlatList  } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { runOnJS } from 'react-native-reanimated';


const dummyPosts = [{
  id: '2',
  video_url: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/2.mp4',
  description: "Timelapse of city"

},
{
  id: '1',
  video_url: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/1.mp4',
  description: "Hey There"

},
{
  id: '3',
  video_url: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/3.mp4',
  description: "Holla"

},
{
  id: '4',
  video_url: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/4.mp4',
  caption_description: "Piano practice"

},
{
  id: '5',
  video_url: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/5.mp4',
  description: "Post number 5"

},
];


export default function Tab() {
  const [activePostId, setActivePostId] = useState(dummyPosts[0].id);
  const [posts, setPosts] = useState<typeof dummyPosts>([]);

  


  useEffect(() => {
    const fetchPosts = async () => {
      // fetch posts from the server
      setPosts(dummyPosts);
    };
    fetchPosts();
  }, []);

  const onEndReached = () => {
    //fetch more posts from database
    setPosts((currentPosts) => [...currentPosts, ...dummyPosts]);
  };

  const viewabilityConfigCallbackPairs = useRef([
      {
        viewabilityConfig: { itemVisiblePercentThreshold: 50 },
      onViewableItemsChanged: ({ changed, viewableItems }) => {
        if (viewableItems.length > 0 && viewableItems[0].isViewable) {
          setActivePostId(viewableItems[0].item.id); 
        }
      },
    },
  ]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX(50) // Start detecting after 50px horizontal movement
    .onEnd((event) => {
    //  console.log('Swipe event:', event) //debug log
      if (event.velocityX > 500) { // Swipe right with good velocity
        runOnJS(router.push)(`/(tabs)/recipe?id=${activePostId}`);
      }
    });





  return (
    <GestureHandlerRootView style={{ flex: 1}}>
      <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        <FlatList
        data={posts} 
        renderItem={({ item }) => <VideoPost post={item} activePostId={activePostId} />}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        pagingEnabled
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={1}
      />
      </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
