import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Dimensions, Modal, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

const posts = [
  { id: '1', uri: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/2.mp4' },
  { id: '2', uri: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/1.mp4' },
  { id: '3', uri: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/vertical-videos/3.mp4' },
  // Add more videos as needed
];

export default function Profile() {
  const [modalVisible, setModalVisible] = useState(false);
  const [image, setImage] = useState('https://notjustdev-dummy.s3.us-east-2.amazonaws.com/images/1.jpg');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setModalVisible(false); // Close modal after selecting an image
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image source={{ uri: image }} style={styles.profileImage} />
      </TouchableOpacity>
      <Text style={styles.username}>username</Text>

      <View style={styles.statsContainer}>
        <View style={styles.stats}>
          <Text style={styles.statNumber}>50</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statNumber}>1.2K</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statNumber}>200</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <Video
            source={{ uri: item.uri }}
            style={styles.postThumbnail}
            resizeMode="cover"
            isLooping
            shouldPlay={false}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsContainer}
      />

      <Modal
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
      </Modal>
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
    paddingHorizontal: 2,
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
});
