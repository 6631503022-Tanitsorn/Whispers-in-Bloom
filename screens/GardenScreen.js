import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ScrollView, Animated } from 'react-native';

const GardenScreen = () => {
  const [thoughts, setThoughts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [growthAnim] = useState(new Animated.Value(0));

  const handlePlantThought = () => {
    if (inputText.trim()) {
      setThoughts([...thoughts, inputText]);
      setInputText('');

      Animated.spring(growthAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Garden of Thoughts</Text>
      <ScrollView style={styles.gardenContainer}>
        {thoughts.map((thought, index) => (
          <Animated.View
            key={index}
            style={[styles.thoughtWrapper, { transform: [{ scale: growthAnim }] }]}>
            <Text style={styles.thoughtText}>{thought}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      <TextInput
        style={styles.input}
        placeholder="Plant a thought..."
        value={inputText}
        onChangeText={setInputText}
      />
      <Button title="Plant Thought" onPress={handlePlantThought} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F8FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5A5A5A',
    textAlign: 'center',
    marginVertical: 20,
  },
  gardenContainer: {
    flex: 1,
    marginBottom: 20,
  },
  thoughtWrapper: {
    marginVertical: 10,
    backgroundColor: '#E6E6FA',
    padding: 10,
    borderRadius: 10,
  },
  thoughtText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3A3A3A',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
  },
});

export default GardenScreen;
