import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList
} from "react-native";
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { VideoView, useVideoPlayer } from 'expo-video';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  address: string;
}

// Separate component for video preview to avoid hook ordering issues
function VideoPreview({ videoUri, onChangeVideo }: { videoUri: string; onChangeVideo: () => void }) {
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.muted = false;
  });

  return (
    <View style={styles.videoPreview}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
      />
      <Pressable 
        style={styles.changeVideoButton}
        onPress={onChangeVideo}
      >
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.changeVideoText}>Change Video</Text>
      </Pressable>
    </View>
  );
}

export default function UploadScreen() {
  // Video state
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  
  // Form state
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  
  // UI state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  
  // User state
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    getCurrentUser();
  }, []);

  // Search restaurants when modal opens or search query changes
  useEffect(() => {
    if (showRestaurantModal) {
      searchRestaurants(restaurantSearchQuery);
    }
  }, [restaurantSearchQuery, showRestaurantModal]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const searchRestaurants = async (query: string) => {
    setLoadingRestaurants(true);
    try {
      let queryBuilder = supabase
        .from('restaurants')
        .select('id, name, cuisine, address')
        .order('name', { ascending: true })
        .limit(50);

      if (query.trim()) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,cuisine.ilike.%${query}%,address.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error searching restaurants:', error);
        return;
      }

      setRestaurants(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const pickVideo = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library permissions to upload videos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 180, // 3 minutes max
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (limit to 100MB)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size) {
          const sizeMB = fileInfo.size / (1024 * 1024);
          if (sizeMB > 100) {
            Alert.alert(
              'File Too Large',
              `Video size is ${sizeMB.toFixed(1)}MB. Please select a video under 100MB.`,
              [{ text: 'OK' }]
            );
            return;
          }
        }

        setVideoUri(asset.uri);
        setVideoFileName(asset.uri.split('/').pop() || 'video.mp4');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const uploadVideo = async () => {
    if (!videoUri) {
      Alert.alert('No Video', 'Please select a video to upload.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not authenticated. Please log in.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please add a description to your video.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileExtension = videoFileName.split('.').pop() || 'mp4';
      const storageFileName = `${userId}/${timestamp}_${random}.${fileExtension}`;

      console.log('📤 Starting video upload...');
      setUploadProgress(10);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(videoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      setUploadProgress(30);

      // Convert base64 to Uint8Array
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      setUploadProgress(50);
      console.log('📤 Uploading to Supabase Storage...');

      // Upload to Supabase Storage
      // Upload to private 'videos' bucket for moderation
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(storageFileName, byteArray, {
          contentType: `video/${fileExtension}`,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Video uploaded to storage');
      setUploadProgress(70);

      // Create post in database with status='pending'
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            user: userId,
            video_url: storageFileName,
            description: description.trim(),
            restaurant: selectedRestaurant?.id || null,
            status: 'pending', // UGC moderation - starts as pending
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (postError) {
        console.error('Post creation error:', postError);
        
        // If post creation fails, try to delete the uploaded video
        await supabase.storage.from('videos').remove([storageFileName]);
        
        throw postError;
      }

      console.log('✅ Post created with ID:', postData.id);
      setUploadProgress(100);

      // Success!
      Alert.alert(
        'Upload Successful! 🎉',
        'Your video has been uploaded and is pending moderation. You can view it on your profile.',
        [
          {
            text: 'View on Profile',
            onPress: () => {
              resetForm();
              router.push('/(tabs)/profile');
            }
          },
          {
            text: 'Upload Another',
            onPress: () => resetForm()
          }
        ]
      );

    } catch (error: any) {
      console.error('Upload failed:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setVideoUri(null);
    setVideoFileName('');
    setDescription('');
    setTags('');
    setLocation('');
    setSelectedRestaurant(null);
    setUploadProgress(0);
  };

  const renderRestaurantModal = () => (
    <Modal
      visible={showRestaurantModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowRestaurantModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Restaurant</Text>
          <Pressable onPress={() => setShowRestaurantModal(false)}>
            <Ionicons name="close" size={28} color="#333" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
            value={restaurantSearchQuery}
            onChangeText={setRestaurantSearchQuery}
            autoFocus
          />
        </View>

        {loadingRestaurants ? (
          <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
        ) : (
          <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.restaurantItem}
                onPress={() => {
                  setSelectedRestaurant(item);
                  setShowRestaurantModal(false);
                }}
              >
                <View style={styles.restaurantIcon}>
                  <Ionicons name="restaurant" size={24} color="#FF6B6B" />
                </View>
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <Text style={styles.restaurantCuisine}>{item.cuisine}</Text>
                  <Text style={styles.restaurantAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No restaurants found</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Upload Video</Text>
            <Text style={styles.headerSubtitle}>Share your food experience</Text>
          </View>

          {/* Video Preview */}
          <View style={styles.videoContainer}>
            {videoUri ? (
              <VideoPreview videoUri={videoUri} onChangeVideo={pickVideo} />
            ) : (
              <Pressable style={styles.uploadPlaceholder} onPress={pickVideo}>
                <Ionicons name="videocam" size={48} color="#999" />
                <Text style={styles.uploadPlaceholderText}>Tap to select video</Text>
                <Text style={styles.uploadPlaceholderSubtext}>Max 3 min, 100MB</Text>
              </Pressable>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Tell us about this dish..."
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.characterCount}>{description.length}/500</Text>
            </View>

            {/* Restaurant */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Restaurant</Text>
              <Pressable 
                style={styles.selectButton}
                onPress={() => setShowRestaurantModal(true)}
              >
                <Ionicons name="restaurant" size={20} color="#666" />
                <Text style={[
                  styles.selectButtonText,
                  selectedRestaurant && styles.selectButtonTextSelected
                ]}>
                  {selectedRestaurant ? selectedRestaurant.name : 'Select restaurant (optional)'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </Pressable>
              {selectedRestaurant && (
                <View style={styles.selectedRestaurant}>
                  <Text style={styles.selectedRestaurantCuisine}>
                    {selectedRestaurant.cuisine}
                  </Text>
                  <Pressable 
                    onPress={() => setSelectedRestaurant(null)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="location" size={20} color="#666" />
                <TextInput
                  style={styles.textInputWithIcon}
                  placeholder="City or neighborhood (optional)"
                  placeholderTextColor="#999"
                  value={location}
                  onChangeText={setLocation}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Tags */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="pricetag" size={20} color="#666" />
                <TextInput
                  style={styles.textInputWithIcon}
                  placeholder="e.g., spicy, vegetarian, dessert (optional)"
                  placeholderTextColor="#999"
                  value={tags}
                  onChangeText={setTags}
                  maxLength={100}
                />
              </View>
              <Text style={styles.helperText}>Separate tags with commas</Text>
            </View>
          </View>

          {/* Upload Progress */}
          {uploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
            </View>
          )}

          {/* Moderation Notice */}
          <View style={styles.noticeContainer}>
            <Ionicons name="information-circle" size={20} color="#FF6B6B" />
            <Text style={styles.noticeText}>
              Your video will be reviewed before appearing in the public feed. 
              You can view it on your profile while it's pending approval.
            </Text>
          </View>

          {/* Upload Button */}
          <Pressable
            style={[styles.uploadButton, (!videoUri || uploading) && styles.uploadButtonDisabled]}
            onPress={uploadVideo}
            disabled={!videoUri || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>
                  {videoUri ? 'Upload Video' : 'Select Video First'}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderRestaurantModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  videoContainer: {
    marginBottom: 24,
  },
  videoPreview: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  changeVideoButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeVideoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadPlaceholder: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  uploadPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  uploadPlaceholderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#FF6B6B',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    gap: 10,
  },
  textInputWithIcon: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    gap: 10,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  selectButtonTextSelected: {
    color: '#333',
    fontWeight: '500',
  },
  selectedRestaurant: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  selectedRestaurantCuisine: {
    fontSize: 14,
    color: '#666',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
  },
  progressContainer: {
    marginTop: 20,
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noticeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  loader: {
    marginTop: 40,
  },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  restaurantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 2,
  },
  restaurantAddress: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

