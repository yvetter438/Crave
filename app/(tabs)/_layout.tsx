import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { ActivePostProvider } from '@/context/ActivePostContext';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <ActivePostProvider>
    <Tabs screenOptions={{ 
      tabBarStyle: {
        backgroundColor: Colors.background,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: 90,
        paddingBottom: 20,
        paddingTop: 10,
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textSecondary,
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
      }
     }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          headerShown: false, //hides the header for tiktokfeed
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="home" color={color} />,
        }}
      />
      {/* <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="plus-square-o" color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user-o" color={color} />,
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



*/