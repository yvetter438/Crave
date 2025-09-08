// COMMENTED OUT FOR MVP - SHOPPING SCREEN
// This file has been simplified for MVP. The original shopping functionality is preserved below.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ShoppingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Shopping feature coming soon!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  text: {
    fontSize: 18,
    color: '#666',
  },
});

export default ShoppingScreen;

/*
ORIGINAL SHOPPING SCREEN CODE - PRESERVED FOR FUTURE USE:

import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image, Linking, Alert } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 30) / 2; // 30px for margins and spacing

// Real product data with Amazon affiliate links
const realProducts = [
  // Kitchen Tools
  { 
    id: '1', 
    name: 'Butcher Knife', 
    price: '$24.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/81qbYfQVIRL._AC_SX679_.jpg', 
    affiliateLink: 'https://amzn.to/46lnnMM', 
    category: 'Kitchen Tools',
    height: 280 
  },
  { 
    id: '2', 
    name: 'Stainless Steel Pan', 
    price: '$89.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/61oJafdHwXS._AC_SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/46iv6v4', 
    category: 'Kitchen Tools',
    height: 320 
  },
  { 
    id: '3', 
    name: 'Wok', 
    price: '$45.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/71emkWTryEL._AC_SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/4ne4JMy', 
    category: 'Kitchen Tools',
    height: 280 
  },
  { 
    id: '4', 
    name: 'Damascus Knives', 
    price: '$129.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/71rMbEKBqNL._AC_SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/4lXpDyk', 
    category: 'Kitchen Tools',
    height: 300 
  },
  { 
    id: '5', 
    name: 'Wooden Skewers', 
    price: '$12.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/71llH6F+ZAL._AC_SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/4p7vh3S', 
    category: 'Kitchen Tools',
    height: 200 
  },
  { 
    id: '6', 
    name: 'Steamer', 
    price: '$34.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/71Cklldr-gL._AC_SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/42bAQEo', 
    category: 'Kitchen Tools',
    height: 250 
  },
  
  // Ingredients
  { 
    id: '7', 
    name: 'Tortillas', 
    price: '$4.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/71yosT1fChL._SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/4pbrEtS', 
    category: 'Ingredients',
    height: 220 
  },
  { 
    id: '8', 
    name: 'Pasta', 
    price: '$8.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/81jt7fcDJNL._SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/4gangHi', 
    category: 'Ingredients',
    height: 240 
  },
  { 
    id: '9', 
    name: 'Sichuan Peppercorns', 
    price: '$15.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/71U3CTRUjKL._SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/464fppU', 
    category: 'Ingredients',
    height: 180 
  },
  { 
    id: '10', 
    name: 'Sea Salt Flakes', 
    price: '$18.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/81AA2FkCA0L._SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/46jWHMm', 
    category: 'Ingredients',
    height: 200 
  },
  
  // Appliances
  { 
    id: '11', 
    name: 'StoveTop Espresso Maker', 
    price: '$79.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/71lGXxjwVEL._AC_SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/4ga9X9Z', 
    category: 'Appliances',
    height: 260 
  },
  { 
    id: '12', 
    name: 'Air Fryer', 
    price: '$149.99', 
    imageUrl: 'https://m.media-amazon.com/images/I/81lTKYX5LNL._AC_SL1500_.jpg', 
    affiliateLink: 'https://amzn.to/4805GUh', 
    category: 'Appliances',
    height: 290 
  },
];

const ShoppingScreen = () => {
  const handleProductPress = async (affiliateLink: string, productName: string) => {
    try {
      // Check if the link can be opened
      const supported = await Linking.canOpenURL(affiliateLink);
      
      if (supported) {
        await Linking.openURL(affiliateLink);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open product link');
      console.error('Error opening affiliate link:', error);
    }
  };

  const renderProduct = ({ item }: { item: typeof realProducts[0] }) => (
    <TouchableOpacity 
      style={[styles.productCard, { height: item.height }]} 
      activeOpacity={0.8}
      onPress={() => handleProductPress(item.affiliateLink, item.name)}
    >
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productOverlay}>
        <Text style={styles.productTitle}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.affiliateDisclaimer}>Amazon Affiliate</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={realProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  listContainer: {
    padding: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: COLUMN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  productTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productCategory: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  affiliateDisclaimer: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '400',
    marginTop: 2,
    fontStyle: 'italic',
  },
  separator: {
    height: 10,
  },
});

export default ShoppingScreen;
*/