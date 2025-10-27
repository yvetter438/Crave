import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.lastUpdated}>Last Updated: January 6, 2025</Text>

        <Text style={styles.intro}>
          This Privacy Policy describes how Crave collects, uses, and protects your information 
          when you use our app. We are committed to protecting your privacy and being transparent 
          about our data practices.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          
          <Text style={styles.subsectionTitle}>Personal Information</Text>
          <Text style={styles.paragraph}>
            When you create an account, we collect:
          </Text>
          <Text style={styles.bulletPoint}>• Email address</Text>
          <Text style={styles.bulletPoint}>• Username and display name</Text>
          <Text style={styles.bulletPoint}>• Profile information (bio, location, Instagram handle)</Text>
          <Text style={styles.bulletPoint}>• Profile photo/avatar</Text>

          <Text style={styles.subsectionTitle}>Content You Create</Text>
          <Text style={styles.paragraph}>
            We store content you upload to our app:
          </Text>
          <Text style={styles.bulletPoint}>• Videos and photos you post</Text>
          <Text style={styles.bulletPoint}>• Comments and replies</Text>
          <Text style={styles.bulletPoint}>• Restaurant reviews and ratings</Text>
          <Text style={styles.bulletPoint}>• User interactions (likes, saves, follows)</Text>

          <Text style={styles.subsectionTitle}>Usage Data</Text>
          <Text style={styles.paragraph}>
            We automatically collect information about how you use our app:
          </Text>
          <Text style={styles.bulletPoint}>• App usage patterns and session length</Text>
          <Text style={styles.bulletPoint}>• Videos watched and interactions</Text>
          <Text style={styles.bulletPoint}>• Search queries and preferences</Text>
          <Text style={styles.bulletPoint}>• Device information (type, operating system)</Text>
          <Text style={styles.bulletPoint}>• Crash reports and performance data</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          
          <Text style={styles.paragraph}>
            We use your information to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide and improve our app services</Text>
          <Text style={styles.bulletPoint}>• Show you personalized content and recommendations</Text>
          <Text style={styles.bulletPoint}>• Moderate content and ensure community safety</Text>
          <Text style={styles.bulletPoint}>• Analyze app usage to improve features</Text>
          <Text style={styles.bulletPoint}>• Provide customer support</Text>
          <Text style={styles.bulletPoint}>• Send important updates about our service</Text>
          <Text style={styles.bulletPoint}>• Track marketing campaign effectiveness</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Analytics and Tracking Services</Text>
          
          <Text style={styles.paragraph}>
            We use third-party services to understand how our app is used and improve your experience:
          </Text>

          <Text style={styles.subsectionTitle}>PostHog Analytics</Text>
          <Text style={styles.paragraph}>
            Tracks user behavior, app usage patterns, and engagement metrics to help us improve 
            the app experience. Data is anonymized and used for product development.
          </Text>

          <Text style={styles.subsectionTitle}>AppsFlyer Attribution</Text>
          <Text style={styles.paragraph}>
            Tracks how users discover and install our app from marketing campaigns. This helps 
            us understand which marketing efforts are most effective.
          </Text>

          <Text style={styles.subsectionTitle}>Sentry Error Tracking</Text>
          <Text style={styles.paragraph}>
            Collects crash reports and performance data to help us identify and fix technical 
            issues, improving app stability and reliability.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Opt-Out:</Text> You can opt out of analytics tracking 
            in your device settings, though this may limit our ability to improve the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Information Sharing</Text>
          
          <Text style={styles.paragraph}>
            We share your information only in these limited circumstances:
          </Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Analytics Providers:</Text> PostHog, AppsFlyer for app improvement and marketing attribution</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Technical Services:</Text> Sentry for crash reporting and technical support</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Cloud Storage:</Text> Supabase for secure data storage and app functionality</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Legal Requirements:</Text> When required by law or to protect our rights</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Business Transfers:</Text> In connection with a merger, acquisition, or sale of assets</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>We do not sell your personal information</Text> to third parties 
            for marketing purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          
          <Text style={styles.paragraph}>
            We implement appropriate security measures to protect your information:
          </Text>
          <Text style={styles.bulletPoint}>• Encryption of data in transit and at rest</Text>
          <Text style={styles.bulletPoint}>• Secure cloud storage with industry-standard security</Text>
          <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
          <Text style={styles.bulletPoint}>• Access controls and authentication</Text>
          <Text style={styles.bulletPoint}>• Content moderation and safety measures</Text>

          <Text style={styles.paragraph}>
            However, no method of transmission over the internet is 100% secure. While we strive 
            to protect your information, we cannot guarantee absolute security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Rights and Choices</Text>
          
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Access your personal information</Text>
          <Text style={styles.bulletPoint}>• Update or correct your information</Text>
          <Text style={styles.bulletPoint}>• Delete your account and data</Text>
          <Text style={styles.bulletPoint}>• Opt out of analytics tracking</Text>
          <Text style={styles.bulletPoint}>• Export your data</Text>
          <Text style={styles.bulletPoint}>• Report privacy concerns</Text>

          <Text style={styles.paragraph}>
            To exercise these rights, contact us at support@craveapp.com or use the settings 
            in our app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          
          <Text style={styles.paragraph}>
            Our app is not intended for children under 13. We do not knowingly collect 
            personal information from children under 13. If we become aware that we have 
            collected personal information from a child under 13, we will take steps to 
            delete such information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. International Users</Text>
          
          <Text style={styles.paragraph}>
            If you are using our app from outside the United States, please be aware that 
            your information may be transferred to, stored, and processed in the United States 
            where our servers are located.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
          
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any 
            material changes by posting the new Privacy Policy in the app and updating the 
            "Last Updated" date. Your continued use of our app after changes constitutes 
            acceptance of the updated policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy or our data practices, 
            please contact us:
          </Text>
          <Text style={styles.paragraph}>
            Email: support@craveapp.com
          </Text>
          <Text style={styles.paragraph}>
            We will respond to your inquiry within 30 days.
          </Text>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            By using Crave, you acknowledge that you have read and understood this Privacy Policy 
            and agree to our collection and use of your information as described herein.
          </Text>
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
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  intro: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  bulletPoint: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 6,
    marginLeft: 16,
  },
  footerSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
