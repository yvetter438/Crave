import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TextFieldEditorProps {
  visible: boolean;
  title: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  showAtPrefix?: boolean;
  onSave: (value: string) => void;
  onClose: () => void;
}

export default function TextFieldEditor({
  visible,
  title,
  value,
  placeholder = '',
  maxLength = 100,
  multiline = false,
  autoCapitalize = 'sentences',
  showAtPrefix = false,
  onSave,
  onClose,
}: TextFieldEditorProps) {
  const [text, setText] = useState(value);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (visible) {
      // Auto-focus when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const handleDone = () => {
    onSave(text);
    onClose();
  };

  const handleCancel = () => {
    setText(value); // Reset to original value
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleDone}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            {showAtPrefix ? (
              <View style={styles.prefixInputWrapper}>
                <Text style={styles.atPrefix}>@</Text>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, styles.inputWithPrefix]}
                  value={text}
                  onChangeText={setText}
                  placeholder={placeholder}
                  placeholderTextColor="#999"
                  maxLength={maxLength}
                  multiline={false}
                  autoCapitalize={autoCapitalize}
                  autoCorrect={false}
                />
              </View>
            ) : (
              <TextInput
                ref={inputRef}
                style={[styles.input, multiline && styles.multilineInput]}
                value={text}
                onChangeText={setText}
                placeholder={placeholder}
                placeholderTextColor="#999"
                maxLength={maxLength}
                multiline={multiline}
                autoCapitalize={autoCapitalize}
                autoCorrect={true}
                textAlignVertical={multiline ? 'top' : 'center'}
              />
            )}
            
            {/* Character Count */}
            {maxLength && (
              <Text style={styles.charCount}>
                {text.length}/{maxLength}
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095f6',
  },
  inputContainer: {
    padding: 16,
  },
  input: {
    fontSize: 16,
    color: '#000',
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 120,
    maxHeight: 300,
  },
  prefixInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    paddingLeft: 12,
    minHeight: 48,
  },
  atPrefix: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    marginRight: 4,
  },
  inputWithPrefix: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingLeft: 0,
  },
  charCount: {
    fontSize: 13,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
});

