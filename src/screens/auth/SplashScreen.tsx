/**
 * Splash Screen - Rentverse Style
 * 
 * Background gradient Indigo → Dark
 * Logo tengah dengan animasi fade-in
 * Loading bar animation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../theme';

const { height, width } = Dimensions.get('window');

type SplashScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { isLoading } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(-width * 0.16)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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

    // Loading bar animation
    Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: width * 0.16,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    // Navigate after delay
    const timer = setTimeout(() => {
      if (!isLoading) {
        navigation.replace('Login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, navigation, fadeAnim, scaleAnim, pulseAnim, loadingAnim]);

  return (
    <LinearGradient
      colors={['#2a267a', '#5048e5', '#0f172a']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Blur Effects */}
      <View style={styles.blurCircle1} />
      <View style={styles.blurCircle2} />
      
      <View style={styles.spacer} />
      
      {/* Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.logo}>
            <Ionicons name="business" size={64} color={Colors.white} />
          </View>
        </Animated.View>
        
        <Text style={styles.appName}>RENTVERSE</Text>
        <Text style={styles.tagline}>Your Key to Living</Text>
      </Animated.View>
      
      {/* Loading Section */}
      <View style={styles.loadingSection}>
        <View style={styles.loadingBar}>
          <Animated.View 
            style={[
              styles.loadingProgress,
              { transform: [{ translateX: loadingAnim }] }
            ]} 
          />
        </View>
        <Text style={styles.versionText}>v2.0.1</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blurCircle1: {
    position: 'absolute',
    top: -height * 0.15,
    left: -width * 0.15,
    width: height * 0.5,
    height: height * 0.5,
    borderRadius: height * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  blurCircle2: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.2,
    width: height * 0.6,
    height: height * 0.6,
    borderRadius: height * 0.3,
    backgroundColor: 'rgba(80, 72, 229, 0.4)',
  },
  spacer: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  logoWrapper: {
    marginBottom: Spacing.md,
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  appName: {
    fontSize: 40,
    fontWeight: FontWeight.black,
    color: Colors.white,
    letterSpacing: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: FontSize.md,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: FontWeight.medium,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  loadingSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
  },
  loadingBar: {
    width: 64,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  loadingProgress: {
    width: 32,
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  versionText: {
    fontSize: FontSize.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 2,
  },
});

export default SplashScreen;
