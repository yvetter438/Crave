import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  onBlockSuccess?: () => void;
}

export default function BlockUserModal({
  visible,
  onClose,
  userId,
  username,
  onBlockSuccess,
}: BlockUserModalProps) {
  const [blocking, setBlocking] = useState(false);

  const handleBlock = async () => {
    setBlocking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to block users.');
        return;
      }

      if (user.id === userId) {
        Alert.alert('Error', 'You cannot block yourself.');
        return;
      }

      const { error } = await supabase
        .from('user_blocks')
        .insert([
          {
            blocker_id: user.id,
            blocked_id: userId,
          }
        ]);

      if (error) {
        // Check if already blocked
        if (error.code === '23505') {
          Alert.alert(
            'Already Blocked',
            'You have already blocked this user.',
            [{ text: 'OK', onPress: onClose }]
          );
        } else {
          throw error;
        }
        return;
      }

      Alert.alert(
        'User Blocked',
        `You won't see posts or comments from @${username} anymore.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              onBlockSuccess?.();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="ban" size={48} color="#FF6B6B" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Block @{username}?</Text>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              They won't be able to see your profile, posts, or comments.
            </Text>
            <Text style={styles.description}>
              You won't see their posts or comments in your feed.
            </Text>
            <Text style={styles.description}>
              They won't be notified that you blocked them.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.blockButton]}
              onPress={handleBlock}
              disabled={blocking}
            >
              {blocking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.blockButtonText}>Block User</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={blocking}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  descriptionContainer: {
    gap: 8,
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockButton: {
    backgroundColor: '#FF6B6B',
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

