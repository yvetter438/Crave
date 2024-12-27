import VideoPost from '@/components/VideoPost';
import { View,  StyleSheet, FlatList  } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { runOnJS } from 'react-native-reanimated';


const dummyPosts = [{
  id: '2',
  video: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/2.mp4',
  caption: "Timelapse of city"

},
{
  id: '1',
  video: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/1.mp4',
  caption: "Hey There"

},
{
  id: '3',
  video: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/3.mp4',
  caption: "Holla"

},
{
  id: '4',
  video: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/4.mp4',
  caption: "Piano practice"

},
{
  id: '5',
  video: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/5.mp4',
  caption: "Post number 5"

},
];

const recipes = [
  {
    id: '1',
    title: 'Spaghetti Carbonara',
    description: 'A classic Italian pasta dish with eggs, cheese, pancetta, and pepper.',
    ingredients: ['Spaghetti', 'Eggs', 'Cheese', 'Pancetta', 'Pepper'],
    instructions: [
      'Cook the spaghetti according to the package instructions.',
      'In a separate pan, cook the pancetta until crispy.',
      'In a bowl, whisk together the eggs and cheese.',
      'Combine the cooked spaghetti with the pancetta, and mix in the egg mixture.',
      'Serve immediately with freshly ground pepper.',
    ],
  },
  {
    id: '2',
    title: 'Chicken Alfredo',
    description: 'Creamy pasta with grilled chicken, garlic, and parmesan cheese.',
    ingredients: ['Pasta', 'Chicken Breast', 'Garlic', 'Heavy Cream', 'Parmesan Cheese'],
    instructions: [
      'Cook the pasta according to the package instructions.',
      'Grill the chicken breast until fully cooked and slice it.',
      'In a pan, sauté the garlic in butter, then add the heavy cream.',
      'Mix in the parmesan cheese and let it melt into a creamy sauce.',
      'Combine the pasta and chicken with the sauce, and serve hot.',
    ],
  },
  {
    id: '3',
    title: 'Meat Loaf',
    description: 'Meat in form of a catloaf',
    ingredients: ['Ground Beef', 'Breadcrumbs', 'Garlic', 'Sale', 'Pepper'],
    instructions: [
      'lerem ipsum deez nuts',
      'chachi chachi chachi',
      'skibidi toilet',
      'ligma sigma kigma',
      'genuine potatoe chips',
    ],
  },
  {
    id: '4',
    title: 'Hamburger Soup',
    description: 'Your favorite american dish but in a soup',
    ingredients: ['hamburger', 'lettuce', 'tomamtoe', 'ketchup', 'mustard'],
    instructions: [
      'Dice that shi up',
      'skibidi toilet rizz',
      'ketchup',
      'squirt that sauce all over',
      'chachi chachi chachi',
    ],
  },
  {
    id: '5',
    title: 'Tater Tot Hotdish',
    description: 'Slice of the midwest but wit no deli',
    ingredients: ['Yeet', 'Ye ye', 'potatoes', 'Heavy Cream', 'thicness'],
    instructions: [
      'Lemme see dat boi',
      'lay up like ratatouille',
      'gawk gawk gawk',
    ],
  },
  {
    id: '6',
    title: 'Lebrons Meat',
    description: 'The goat of all basketball and his shenanigans',
    ingredients: ['meow', 'Lebronhenessy', 'seasoning', 'Kool aid'],
    instructions: [
      'sample it',
      'let it rip',
      'wing ling ling',
      'ching ching ching',
      'kaching kaching kaching',
    ],
  },

  // Add more recipes as needed
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
