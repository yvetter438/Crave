import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

type EndOfFeedCardProps = {
  onRewatch: () => void;
};

export default function EndOfFeedCard({ onRewatch }: EndOfFeedCardProps) {
  const { height } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const adjustedHeight = height - tabBarHeight;

  return (
    <View style={[styles.container, { height: adjustedHeight }]}>
      <LinearGradient 
        colors={['#000000', '#1a1a1a', '#000000']}
        style={StyleSheet.absoluteFill}
      >
        <View style={styles.content}>
          <Ionicons 
            name="checkmark-circle" 
            size={80} 
            color={Colors.primary} 
            style={styles.icon} 
          />
          
          <Text style={styles.title}>You're All Caught Up!</Text>
          <Text style={styles.subtitle}>
            You've seen all the spots nearby
          </Text>

          <TouchableOpacity 
            style={styles.rewatchButton}
            onPress={onRewatch}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.buttonText}>Rewatch Videos</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Videos will appear in a new order
          </Text>

          <View style={styles.stats}>
            <Ionicons name="restaurant-outline" size={20} color="rgba(255,255,255,0.5)" />
            <Text style={styles.statsText}>
              Come back later for new spots
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 40,
    textAlign: 'center',
  },
  rewatchButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

