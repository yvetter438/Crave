import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 30) / 2; // 30px for margins and spacing

// Dummy product data with varying heights
const dummyProducts = [
  { id: '1', height: 200, imageUrl: 'https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=Kitchen+Tool' },
  { id: '2', height: 300, imageUrl: 'https://via.placeholder.com/200x300/4ECDC4/FFFFFF?text=Cooking+Book' },
  { id: '3', height: 250, imageUrl: 'https://via.placeholder.com/200x250/45B7D1/FFFFFF?text=Ingredient' },
  { id: '4', height: 180, imageUrl: 'https://via.placeholder.com/200x180/96CEB4/FFFFFF?text=Utensil' },
  { id: '5', height: 320, imageUrl: 'https://via.placeholder.com/200x320/FFEAA7/FFFFFF?text=Recipe+Book' },
  { id: '6', height: 220, imageUrl: 'https://via.placeholder.com/200x220/DDA0DD/FFFFFF?text=Spice+Set' },
  { id: '7', height: 280, imageUrl: 'https://via.placeholder.com/200x280/98D8C8/FFFFFF?text=Kitchen+Gadget' },
  { id: '8', height: 190, imageUrl: 'https://via.placeholder.com/200x190/F7DC6F/FFFFFF?text=Cookware' },
  { id: '9', height: 260, imageUrl: 'https://via.placeholder.com/200x260/BB8FCE/FFFFFF?text=Food+Storage' },
  { id: '10', height: 240, imageUrl: 'https://via.placeholder.com/200x240/85C1E9/FFFFFF?text=Baking+Tool' },
  { id: '11', height: 200, imageUrl: 'https://via.placeholder.com/200x200/F8C471/FFFFFF?text=Cutting+Board' },
  { id: '12', height: 290, imageUrl: 'https://via.placeholder.com/200x290/82E0AA/FFFFFF?text=Meal+Prep' },
];

const ShoppingScreen = () => {
  const renderProduct = ({ item }: { item: typeof dummyProducts[0] }) => (
    <TouchableOpacity 
      style={[styles.productCard, { height: item.height }]} 
      activeOpacity={0.8}
      onPress={() => {
        // TODO: Handle product tap - could open Amazon affiliate link
        console.log('Product tapped:', item.id);
      }}
    >
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productOverlay}>
        <Text style={styles.productTitle}>Product {item.id}</Text>
        <Text style={styles.productPrice}>$19.99</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={dummyProducts}
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
  },
  separator: {
    height: 10,
  },
});

export default ShoppingScreen;
