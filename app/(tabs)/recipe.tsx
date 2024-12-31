import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useActivePost } from '@/context/ActivePostContext';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
}


const RecipeScreen = () => {
  const { width, height } = Dimensions.get('window');
  const { id } = useLocalSearchParams(); /// access the recipe ID passed to the screen
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading]= useState(true);
  const { activePostId } = useActivePost();


  console.log('Active Post ID on Recipe Screen:', activePostId);// Add this console log to debug
  console.log('Recipe Screen - Current activePostId:', activePostId);
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        console.log('Fetching recipe for ID:', activePostId);
        const recipeId = String(activePostId);
        // Fetch recipe data based on the post's recipe_id
        const { data, error } = await supabase
          .from('recipes')
          .select('id, title, description, ingredients, instructions')
          .eq('id', recipeId)
          .single();

        if (error) {
          console.error('Error fetching recipe:', error);
          return;
        }

        // Update state with the fetched recipe
        setRecipe({
          id: data.id,
          title: data.title,
          description: data.description,
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
        });
      } catch (err) {
        console.error('Unexpected error fetching recipe:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, activePostId]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!recipe) {
    return <Text>Recipe not found.</Text>;
  }


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
