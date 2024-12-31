import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { ActivePostProvider } from '@/context/ActivePostContext';

export default function TabLayout() {
  return (
    <ActivePostProvider>
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="recipe"
        options={{
          title: 'Recipe',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="bars" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          headerShown: false, //hides the header for tiktokfeed
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user-o" color={color} />,
        }}
      />
    </Tabs>
    </ActivePostProvider>
  );
}



/*
<Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="search" color={color} />,
        }}
      />


<Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="plus-square-o" color={color} />,
        }}
      />
*/