import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';


interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
}



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





const RecipeScreen = () => {
  const { width, height } = Dimensions.get('window');
  const { id } = useLocalSearchParams(); /// access the recipe ID passed to the screen
  console.log('Reveived ID:', id); //debug log
  const recipe = recipes.find(r => r.id === id); // Find the corresponding recipe

  if (!recipe) {
    return <Text>Recipe not found.</Text>; // Handle case where recipe is not found
  }


  {/*const renderItem = ({ item }: { item: Recipe }) => (
    <ScrollView style={[styles.recipeContainer, { width, height }]}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {item.ingredients.map((ingredient: string, index: number) => (
          <Text key={index} style={styles.ingredient}>
            - {ingredient}
          </Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        {item.instructions.map((instruction: string, index: number) => (
          <Text key={index} style={styles.instruction}>
            {index + 1}. {instruction}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
*/}
  return (
    <ScrollView style={[styles.recipeContainer, { width, height }]}>
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.description}>{recipe.description}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ingredient: string, index: number) => (
          <Text key={index} style={styles.ingredient}>
            - {ingredient}
          </Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions.map((instruction: string, index: number) => (
          <Text key={index} style={styles.instruction}>
            {index + 1}. {instruction}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  recipeContainer: {
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 5,
  },
  instruction: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default RecipeScreen;

//old code

//<FlatList
  //    data={filteredRecipes}
    //  renderItem={renderItem}
      //keyExtractor={(item) => item.id}
   //   horizontal
   //   pagingEnabled
   //   showsHorizontalScrollIndicator={false}
   //   initialScrollIndex={filteredRecipes.findIndex(recipe => recipe.id === id)}  // set the initial position based on ID
  //  />