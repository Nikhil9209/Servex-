import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { fonts } from '../theme/tokens';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  hasError = false,
  disabled = false,
}) => {
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Focus first empty box on mount
    const timer = setTimeout(() => {
      if (!disabled) {
        inputsRef.current[0]?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [disabled]);

  const handleChangeText = (text: string, index: number) => {
    if (disabled) return;

    // Handle paste of multiple characters
    const cleanNumbers = text.replace(/\D/g, '');
    if (cleanNumbers.length > 1) {
      const pasted = cleanNumbers.slice(0, length);
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, length - 1);
      inputsRef.current[nextFocus]?.focus();
      if (pasted.length === length && onComplete) {
        onComplete(pasted);
      }
      return;
    }

    const newDigits = [...digits];
    const singleDigit = cleanNumbers.slice(-1);
    newDigits[index] = singleDigit;
    const combined = newDigits.join('');
    onChange(combined);

    if (singleDigit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const isFocused = focusedIndex === index;
        const digit = digits[index];
        const isFilled = Boolean(digit);

        return (
          <Pressable
            key={index}
            onPress={() => {
              if (!disabled) {
                inputsRef.current[index]?.focus();
                setFocusedIndex(index);
              }
            }}
            style={[
              styles.box,
              isFocused && styles.boxFocused,
              isFilled && styles.boxFilled,
              hasError && styles.boxError,
            ]}
          >
            <TextInput
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              style={[styles.input, hasError && styles.inputError]}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!disabled}
              textAlign="center"
              accessibilityLabel={`OTP digit ${index + 1}`}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 18,
    width: '100%',
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#111318',
    borderWidth: 1.5,
    borderColor: '#222630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: '#1A73E8',
    backgroundColor: '#141824',
    shadowColor: '#1A73E8',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  boxFilled: {
    borderColor: '#303744',
    backgroundColor: '#13161D',
  },
  boxError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  input: {
    width: '100%',
    height: '100%',
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  inputError: {
    color: '#EF4444',
  },
});
