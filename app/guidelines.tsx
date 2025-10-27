import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function CommunityGuidelines() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Guidelines</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <Ionicons name="people" size={48} color="#FF6B6B" />
          <Text style={styles.heroTitle}>Building a Positive Community</Text>
          <Text style={styles.heroText}>
            Crave is a place to share your love of food and discover new restaurants. 
            These guidelines help us maintain a welcoming community for everyone.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>What We Encourage</Text>
          </View>
          <View style={styles.encouragedItem}>
            <Ionicons name="restaurant" size={20} color="#4CAF50" />
            <Text style={styles.itemText}>
              <Text style={styles.bold}>Authentic Food Content</Text> - Share genuine experiences 
              at restaurants and showcase delicious food
            </Text>
          </View>
          <View style={styles.encouragedItem}>
            <Ionicons name="star" size={20} color="#4CAF50" />
            <Text style={styles.itemText}>
              <Text style={styles.bold}>Helpful Reviews</Text> - Provide honest, constructive 
              feedback about your dining experiences
            </Text>
          </View>
          <View style={styles.encouragedItem}>
            <Ionicons name="heart" size={20} color="#4CAF50" />
            <Text style={styles.itemText}>
              <Text style={styles.bold}>Respectful Engagement</Text> - Be kind and courteous in 
              comments and interactions with others
            </Text>
          </View>
          <View style={styles.encouragedItem}>
            <Ionicons name="bulb" size={20} color="#4CAF50" />
            <Text style={styles.itemText}>
              <Text style={styles.bold}>Food Tips & Recommendations</Text> - Share what you loved 
              and help others discover great food
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="close-circle" size={24} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>What's Not Allowed</Text>
          </View>

          <View style={styles.prohibitedItem}>
            <Ionicons name="ban" size={20} color="#FF6B6B" />
            <View style={styles.prohibitedContent}>
              <Text style={styles.prohibitedTitle}>Hate Speech & Harassment</Text>
              <Text style={styles.prohibitedText}>
                No attacks based on race, religion, gender, sexual orientation, disability, 
                or any other protected characteristic. Bullying and harassment are not tolerated.
              </Text>
            </View>
          </View>

          <View style={styles.prohibitedItem}>
            <Ionicons name="warning" size={20} color="#FF6B6B" />
            <View style={styles.prohibitedContent}>
              <Text style={styles.prohibitedTitle}>Violence & Graphic Content</Text>
              <Text style={styles.prohibitedText}>
                Don't post content depicting violence, gore, or anything that promotes 
                dangerous activities.
              </Text>
            </View>
          </View>

          <View style={styles.prohibitedItem}>
            <Ionicons name="shield" size={20} color="#FF6B6B" />
            <View style={styles.prohibitedContent}>
              <Text style={styles.prohibitedTitle}>Sexual Content</Text>
              <Text style={styles.prohibitedText}>
                Crave is focused on food. Sexually explicit or suggestive content is not appropriate.
              </Text>
            </View>
          </View>

          <View style={styles.prohibitedItem}>
            <Ionicons name="copy" size={20} color="#FF6B6B" />
            <View style={styles.prohibitedContent}>
              <Text style={styles.prohibitedTitle}>Spam & Misleading Content</Text>
              <Text style={styles.prohibitedText}>
                No spam, scams, or misleading information. Don't impersonate others or 
                spread misinformation about restaurants or food.
              </Text>
            </View>
          </View>

          <View style={styles.prohibitedItem}>
            <Ionicons name="alert" size={20} color="#FF6B6B" />
            <View style={styles.prohibitedContent}>
              <Text style={styles.prohibitedTitle}>Copyright Violations</Text>
              <Text style={styles.prohibitedText}>
                Only post content you have the right to share. Don't steal others' videos 
                or use copyrighted music without permission.
              </Text>
            </View>
          </View>

          <View style={styles.prohibitedItem}>
            <Ionicons name="megaphone" size={20} color="#FF6B6B" />
            <View style={styles.prohibitedContent}>
              <Text style={styles.prohibitedTitle}>Unsolicited Commercial Content</Text>
              <Text style={styles.prohibitedText}>
                Don't use Crave solely for advertising or promotional purposes without 
                providing genuine value to the community.
              </Text>
            </View>
          </View>

          <View style={styles.prohibitedItem}>
            <Ionicons name="medkit" size={20} color="#FF6B6B" />
            <View style={styles.prohibitedContent}>
              <Text style={styles.prohibitedTitle}>Dangerous Misinformation</Text>
              <Text style={styles.prohibitedText}>
                Don't spread false health claims or misleading information that could 
                harm others (e.g., fake allergy advice, dangerous food challenges).
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>How We Enforce These Guidelines</Text>
          </View>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Pre-Moderation:</Text> All videos are reviewed before 
            appearing in the public feed to ensure they meet our guidelines.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Community Reports:</Text> You can report content that 
            violates our guidelines. Each report is reviewed by our moderation team.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Content Removal:</Text> Content that violates these 
            guidelines will be removed. Repeat violations may result in account suspension.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Transparency:</Text> We'll notify you if your content 
            is removed and explain why.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="analytics" size={24} color="#9C27B0" />
            <Text style={styles.sectionTitle}>Privacy & Data Collection</Text>
          </View>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Respect Privacy:</Text> Respect other users' privacy and 
            personal information. Do not share personal details in comments or posts.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Data Usage:</Text> We collect anonymous usage data to improve 
            the app experience. This includes analytics (PostHog, AppsFlyer) and crash reporting (Sentry).
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Content for Improvement:</Text> Your content may be used 
            anonymously for app improvement and feature development.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Report Privacy Violations:</Text> If you see someone sharing 
            personal information or violating privacy, report it immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="flag" size={24} color="#FF9800" />
            <Text style={styles.sectionTitle}>How to Report Violations</Text>
          </View>
          <Text style={styles.paragraph}>
            If you see content that violates these guidelines:
          </Text>
          <Text style={styles.stepItem}>
            1. Tap the three dots (•••) on the post or comment
          </Text>
          <Text style={styles.stepItem}>
            2. Select "Report"
          </Text>
          <Text style={styles.stepItem}>
            3. Choose the reason for your report
          </Text>
          <Text style={styles.stepItem}>
            4. Our team will review it within 24-48 hours
          </Text>
          <Text style={[styles.paragraph, { marginTop: 12 }]}>
            Reports are confidential. The person won't know you reported them.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="hand-right" size={24} color="#9C27B0" />
            <Text style={styles.sectionTitle}>Blocking Users</Text>
          </View>
          <Text style={styles.paragraph}>
            You can block users to prevent them from seeing your content or interacting 
            with you. To block someone:
          </Text>
          <Text style={styles.stepItem}>
            1. Go to their profile
          </Text>
          <Text style={styles.stepItem}>
            2. Tap the three dots (•••) next to the Follow button
          </Text>
          <Text style={styles.stepItem}>
            3. Select "Block User"
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="help-circle" size={24} color="#607D8B" />
            <Text style={styles.sectionTitle}>Questions or Appeals</Text>
          </View>
          <Text style={styles.paragraph}>
            If you have questions about these guidelines or want to appeal a content 
            removal decision, please contact us at:
          </Text>
          <Text style={styles.contactText}>support@craveapp.com</Text>
        </View>

        <View style={styles.footerSection}>
          <Ionicons name="heart" size={32} color="#FF6B6B" style={{ marginBottom: 12 }} />
          <Text style={styles.footerTitle}>Thank You!</Text>
          <Text style={styles.footerText}>
            By following these guidelines, you're helping us build a positive community 
            where everyone can share their love of food. We appreciate your cooperation!
          </Text>
        </View>

        <View style={styles.updatedSection}>
          <Text style={styles.updatedText}>Last Updated: January 6, 2025</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  encouragedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
    paddingLeft: 8,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  prohibitedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
    paddingLeft: 8,
  },
  prohibitedContent: {
    flex: 1,
  },
  prohibitedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  prohibitedText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  paragraph: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  stepItem: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    marginLeft: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
    marginTop: 8,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 16,
    padding: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
  updatedSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  updatedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

