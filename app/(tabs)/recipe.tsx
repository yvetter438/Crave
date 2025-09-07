import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useActivePost } from '@/context/ActivePostContext';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  user: string;
}

interface Profile {
  id: number;
  user_id: string;
  username: string;
  displayname: string;
  avatar_url: string | null;
}


const RecipeScreen = () => {
  const { width, height } = Dimensions.get('window');
  const { id } = useLocalSearchParams(); /// access the recipe ID passed to the screen
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading]= useState(true);
  const { activePostId } = useActivePost();
  const [activeTab, setActiveTab] = useState('info');


 // console.log('Active Post ID on Recipe Screen:', activePostId);// Add this console log to debug
 // console.log('Recipe Screen - Current activePostId:', activePostId);
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
      //  console.log('Fetching recipe for ID:', activePostId);
        const recipeId = String(activePostId);
        // Fetch recipe data based on the post's recipe_id
        const { data, error } = await supabase
          .from('recipes')
          .select('id, title, description, ingredients, instructions, user')
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
          user: data.user,
        });

        // Fetch profile data for the recipe author
        if (data.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching profile:', profileError);
          } else if (profileData) {
            setProfile(profileData);
          }
        }
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

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.description}>{recipe?.description}</Text>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {recipe?.ingredients.map((ingredient: string, index: number) => (
                <Text key={index} style={styles.ingredient}>
                  - {ingredient}
                </Text>
              ))}
            </View>
          </View>
        );
      case 'instructions':
        return (
          <View style={styles.tabContent}>
            {recipe?.instructions.map((instruction: string, index: number) => (
              <View key={index} style={styles.instructionContainer}>
                <Text style={styles.stepNumber}>Step {index + 1}</Text>
                <Text style={styles.instruction}>{instruction}</Text>
                {index < recipe.instructions.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        );
      // case 'nutrition':
      //   return (
      //     <View style={styles.tabContent}>
      //       <Text style={styles.placeholder}>Nutrition information coming soon...</Text>
      //     </View>
      //   );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe?.title}</Text>
        <Text style={styles.username}>
          by {profile?.username ? `@${profile.username}` : '@anonymous'}
        </Text>
      </View>

      <View style={styles.tabs}>
        {['info', 'instructions'/*, 'nutrition'*/].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  username: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontSize: 16,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
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
  instructionContainer: {
    marginBottom: 24,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 17,
    lineHeight: 24,
    color: '#333',
    paddingHorizontal: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 20,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default RecipeScreen;
