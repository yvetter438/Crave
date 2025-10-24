import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { CraveTabIcon } from '@/components/CraveTabIcon';

export default function TabLayout() {
  return (
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
          title: 'Crave',
          headerShown: false, //hides the header for tiktokfeed
          tabBarIcon: ({ focused }) => (
            <CraveTabIcon focused={focused} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={26} name={focused ? 'search' : 'search-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={26} name={focused ? 'add-circle' : 'add-circle-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user-o" color={color} />,
        }}
      />
    </Tabs>
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