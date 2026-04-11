// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/components/VoiceCommandButton.tsx

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';

interface VoiceCommandButtonProps {
  isListening: boolean;
  onPress: () => void;
  size?: number;
  disabled?: boolean;
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  isListening,
  onPress,
  size = 80,
  disabled = false,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isListening) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={styles.container}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
            backgroundColor: isListening ? '#F44336' : '#2196F3',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <View style={styles.icon}>
          <Text style={styles.iconText}>{isListening ? '🎤' : '🎙️'}</Text>
        </View>

        {isListening && (
          <View style={styles.listeningIndicator}>
            <Text style={styles.listeningText}>Listening...</Text>
          </View>
        )}
      </Animated.View>

      <Text style={styles.label}>{isListening ? 'Tap to stop' : 'Voice command'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  listeningIndicator: {
    position: 'absolute',
    bottom: -25,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listeningText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
