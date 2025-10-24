import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'user';
  targetId: number | string;
  targetDescription?: string; // e.g., "John's post" or "Jane Doe"
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', description: 'Commercial content or repetitive posts' },
  { id: 'harassment', label: 'Harassment', description: 'Bullying or threatening behavior' },
  { id: 'hate_speech', label: 'Hate Speech', description: 'Attacks based on identity' },
  { id: 'violence', label: 'Violence', description: 'Graphic or threatening content' },
  { id: 'sexual_content', label: 'Sexual Content', description: 'Inappropriate sexual material' },
  { id: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
  { id: 'copyright', label: 'Copyright', description: 'Unauthorized use of content' },
  { id: 'other', label: 'Other', description: 'Something else' },
];

export default function ReportModal({
  visible,
  onClose,
  targetType,
  targetId,
  targetDescription = 'this content',
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select why you are reporting this content.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to report content.');
        return;
      }

      // Convert targetId to number if it's a string
      const numericTargetId = typeof targetId === 'string' ? parseInt(targetId, 10) : targetId;

      const { error } = await supabase
        .from('reports')
        .insert([
          {
            reporter_id: user.id,
            target_type: targetType,
            target_id: numericTargetId,
            reason: selectedReason,
            description: additionalInfo.trim() || null,
            status: 'pending',
          }
        ]);

      if (error) {
        // Check if it's a duplicate report
        if (error.code === '23505') {
          Alert.alert(
            'Already Reported',
            'You have already reported this content. Our moderators will review it soon.',
            [{ text: 'OK', onPress: onClose }]
          );
        } else {
          throw error;
        }
        return;
      }

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep Crave safe. Our moderators will review this report.',
        [{ text: 'OK', onPress: onClose }]
      );

      // Reset form
      setSelectedReason(null);
      setAdditionalInfo('');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setAdditionalInfo('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Report {targetType}</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={28} color="#333" />
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* Description */}
          <Text style={styles.description}>
            Why are you reporting {targetDescription}?
          </Text>

          {/* Reason Options */}
          <View style={styles.reasonsContainer}>
            {REPORT_REASONS.map((reason) => (
              <Pressable
                key={reason.id}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.id && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View style={styles.reasonContent}>
                  <View style={styles.reasonHeader}>
                    <Text style={[
                      styles.reasonLabel,
                      selectedReason === reason.id && styles.reasonLabelSelected,
                    ]}>
                      {reason.label}
                    </Text>
                    <View style={[
                      styles.radioButton,
                      selectedReason === reason.id && styles.radioButtonSelected,
                    ]}>
                      {selectedReason === reason.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </View>
                  <Text style={styles.reasonDescription}>{reason.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Additional Information */}
          {selectedReason && (
            <View style={styles.additionalInfoContainer}>
              <Text style={styles.additionalInfoLabel}>
                Additional Information (Optional)
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Provide more details about why you're reporting this..."
                placeholderTextColor="#999"
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.characterCount}>{additionalInfo.length}/500</Text>
            </View>
          )}

          {/* Notice */}
          <View style={styles.notice}>
            <Ionicons name="shield-checkmark" size={20} color="#666" />
            <Text style={styles.noticeText}>
              Reports are confidential. The person won't know you reported them.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.button,
              styles.submitButton,
              (!selectedReason || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  reasonsContainer: {
    gap: 12,
  },
  reasonOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  reasonOptionSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  reasonContent: {
    gap: 6,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reasonLabelSelected: {
    color: '#FF6B6B',
  },
  reasonDescription: {
    fontSize: 14,
    color: '#666',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FF6B6B',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
  },
  additionalInfoContainer: {
    marginTop: 24,
    gap: 8,
  },
  additionalInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

