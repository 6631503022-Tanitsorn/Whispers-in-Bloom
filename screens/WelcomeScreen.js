import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ImageBackground } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  const pulseAnim = new Animated.Value(1);

  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])
  ).start();

  return (
    <ImageBackground
      source={require('../assets/welcome.png')} // ✅ NOTE: path is relative to this file
      style={styles.container}
    >
      <Text style={styles.title}>Whispers in Bloom</Text>
      <Animated.View style={[styles.button, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Garden')}>
          <Text style={styles.buttonText}>Enter Your Garden</Text>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5F4B8B',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    backgroundColor: '#F6A8B0',
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;
