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

export default function TermsOfService() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.lastUpdated}>Last Updated: January 6, 2025</Text>

        <Text style={styles.intro}>
          Welcome to Crave! By using our app, you agree to these Terms of Service. 
          Please read them carefully.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using Crave, you agree to be bound by these Terms of Service 
            and all applicable laws and regulations. If you do not agree with any part of 
            these terms, you may not use our service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            Crave is a social media platform for sharing and discovering food and restaurant 
            experiences through video content. We provide tools for users to upload, share, 
            and engage with food-related content.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            • You must be at least 13 years old to use Crave
          </Text>
          <Text style={styles.paragraph}>
            • You are responsible for maintaining the security of your account
          </Text>
          <Text style={styles.paragraph}>
            • You are responsible for all activities that occur under your account
          </Text>
          <Text style={styles.paragraph}>
            • You must not share your account credentials with others
          </Text>
          <Text style={styles.paragraph}>
            • You must provide accurate and complete information when creating your account
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User-Generated Content</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Content Ownership:</Text> You retain ownership of content 
            you post on Crave. By posting content, you grant Crave a worldwide, non-exclusive, 
            royalty-free license to use, display, and distribute your content.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Content Moderation:</Text> All uploaded content is subject 
            to moderation before appearing publicly. We reserve the right to remove content that 
            violates our Community Guidelines.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Responsibility:</Text> You are solely responsible for the 
            content you post. You must not post content that:
          </Text>
          <Text style={styles.bulletPoint}>• Violates any laws or regulations</Text>
          <Text style={styles.bulletPoint}>• Infringes on intellectual property rights</Text>
          <Text style={styles.bulletPoint}>• Contains hate speech or harassment</Text>
          <Text style={styles.bulletPoint}>• Depicts violence or illegal activities</Text>
          <Text style={styles.bulletPoint}>• Contains explicit or sexual content</Text>
          <Text style={styles.bulletPoint}>• Spreads misinformation</Text>
          <Text style={styles.bulletPoint}>• Constitutes spam or commercial solicitation</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Content Moderation & Enforcement</Text>
          <Text style={styles.paragraph}>
            • All videos are reviewed before appearing in the public feed
          </Text>
          <Text style={styles.paragraph}>
            • Content that violates our guidelines will be removed
          </Text>
          <Text style={styles.paragraph}>
            • Repeat violations may result in account suspension or termination
          </Text>
          <Text style={styles.paragraph}>
            • Users can report inappropriate content for review
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Prohibited Activities</Text>
          <Text style={styles.paragraph}>You agree not to:</Text>
          <Text style={styles.bulletPoint}>
            • Use automated systems (bots) to access the service
          </Text>
          <Text style={styles.bulletPoint}>
            • Harass, threaten, or intimidate other users
          </Text>
          <Text style={styles.bulletPoint}>
            • Impersonate any person or entity
          </Text>
          <Text style={styles.bulletPoint}>
            • Attempt to gain unauthorized access to our systems
          </Text>
          <Text style={styles.bulletPoint}>
            • Interfere with the proper functioning of the service
          </Text>
          <Text style={styles.bulletPoint}>
            • Collect user information without consent
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            The Crave app, including its design, features, and branding, is protected by 
            intellectual property laws. You may not copy, modify, or distribute any part 
            of our service without permission.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Privacy & Data Collection</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. Our collection and use of personal information 
            is governed by our Privacy Policy. By using Crave, you consent to our data practices.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Analytics and Tracking:</Text> We use analytics services to understand how you use our app and improve your experience:
          </Text>
          <Text style={styles.bulletPoint}>• PostHog: Tracks app usage, user behavior, and engagement patterns</Text>
          <Text style={styles.bulletPoint}>• AppsFlyer: Tracks app installs and attribution from marketing campaigns</Text>
          <Text style={styles.bulletPoint}>• Sentry: Collects crash reports and performance data to improve app stability</Text>
          <Text style={styles.paragraph}>
            These services collect anonymous usage data and do not identify you personally. You can opt out of analytics in your device settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Data Sharing</Text>
          <Text style={styles.paragraph}>
            We share data with trusted third-party services to provide and improve our app:
          </Text>
          <Text style={styles.bulletPoint}>• Analytics providers (PostHog, AppsFlyer) for app improvement and marketing attribution</Text>
          <Text style={styles.bulletPoint}>• Crash reporting service (Sentry) for technical support and app stability</Text>
          <Text style={styles.bulletPoint}>• Cloud storage providers (Supabase) for secure data storage and app functionality</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal data to third parties. All data sharing is for legitimate business purposes and app functionality.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your account at any time for violations 
            of these Terms of Service or our Community Guidelines. You may also terminate your 
            account at any time by contacting us.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Disclaimers</Text>
          <Text style={styles.paragraph}>
            Crave is provided "as is" without warranties of any kind. We do not guarantee that 
            the service will be uninterrupted, secure, or error-free. We are not responsible 
            for user-generated content or third-party links.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, Crave shall not be liable for any indirect, 
            incidental, special, or consequential damages arising from your use of the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may update these Terms of Service from time to time. We will notify you of 
            significant changes by posting a notice in the app or via email. Your continued 
            use of Crave after changes constitute acceptance of the new terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.paragraph}>
            Email: support@craveapp.com
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms of Service shall be governed by and construed in accordance with 
            the laws of the United States, without regard to its conflict of law provisions.
          </Text>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            By using Crave, you acknowledge that you have read, understood, and agree to be 
            bound by these Terms of Service and our Community Guidelines.
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

