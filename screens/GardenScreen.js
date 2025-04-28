import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// Flower images for different thought types
const FLOWER_IMAGES = {
  default: require('../assets/default.png'),
  happy: require('../assets/happy.png'),
  peaceful: require('../assets/peaceful.png'),
  hopeful: require('../assets/hopeful.png'),
};

const GardenScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [thoughts, setThoughts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [tomorrowMessage, setTomorrowMessage] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(100))[0];
  const swayAnim = useState(new Animated.Value(0))[0];
  const inputRef = useRef(null);

  // Gentle swaying animation for garden elements
  useEffect(() => {
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    sway.start();
    return () => sway.stop();
  }, []);

  useEffect(() => {
    console.log('Component mounted, fetching thoughts...');
    fetchThoughts();
  }, []);

  useEffect(() => {
    console.log('Setting up focus listener...');
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, fetching thoughts...');
      fetchThoughts();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchThoughts = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in');
        setThoughts([]);
        setIsLoading(false);
        return;
      }

      console.log('Current user:', user.uid);
      
      // Get the user document
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data:', userData);
        
        // Get thoughts array from user document
        const userThoughts = userData.thoughts || [];
        console.log('Thoughts found:', userThoughts);
        
        // Sort thoughts by createdAt timestamp (newest first)
        const sortedThoughts = userThoughts.sort((a, b) => {
          const timeA = new Date(a.createdAt);
          const timeB = new Date(b.createdAt);
          return timeB - timeA;
        });
        
        console.log('Setting thoughts in state:', sortedThoughts);
        setThoughts(sortedThoughts);
      } else {
        console.log('No user document found');
        setThoughts([]);
      }
    } catch (error) {
      console.error('Error fetching thoughts:', error);
      Alert.alert(
        'Error',
        'Failed to fetch thoughts. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getFlowerType = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('happy') || lowerText.includes('joy')) return 'happy';
    if (lowerText.includes('peace') || lowerText.includes('calm')) return 'peaceful';
    if (lowerText.includes('hope') || lowerText.includes('dream')) return 'hopeful';
    return 'default';
  };

  const handlePlantThought = async () => {
    if (!inputText.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in');
        Alert.alert('Error', 'You must be logged in to plant thoughts');
        return;
      }

      console.log('Current user:', user.uid);
      const flowerType = getFlowerType(inputText);
      const newThought = {
        id: Date.now().toString(), // Generate a unique ID
        text: inputText.trim(),
        createdAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp
        type: 'thought',
        flowerType: flowerType,
      };

      console.log('Attempting to add thought:', newThought);
      
      // Get the user document reference
      const userRef = doc(db, 'users', user.uid);
      
      // Update the user document to add the new thought to the thoughts array
      await updateDoc(userRef, {
        thoughts: arrayUnion(newThought)
      });
      
      console.log('Thought added successfully');
      
      // Update local state with the new thought
      setThoughts([newThought, ...thoughts]);
      setInputText('');
      setShowInput(false);

      // Show success message
      Alert.alert('Success', 'Your thought has been planted!', [
        { text: 'OK' }
      ]);

    } catch (error) {
      console.error('Detailed error planting thought:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to plant thought. ';
      if (error.code === 'permission-denied') {
        errorMessage += 'You do not have permission to write to the database.';
      } else if (error.code === 'unavailable') {
        errorMessage += 'Network error. Please check your internet connection.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSetTomorrowMessage = async () => {
    if (!tomorrowMessage.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const newMessage = {
        text: tomorrowMessage.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
        type: 'tomorrow',
      };

      await addDoc(collection(db, 'thoughts'), newMessage);
      setThoughts([{ id: 'temp', ...newMessage }, ...thoughts]);
      setTomorrowMessage('');
      setShowInput(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to set message for tomorrow');
    }
  };

  const handleDeleteThought = async (thoughtId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get the user document
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedThoughts = userData.thoughts.filter(thought => thought.id !== thoughtId);
        
        // Update the user document with the filtered thoughts array
        await updateDoc(userRef, {
          thoughts: updatedThoughts
        });
        
        // Update local state
        setThoughts(thoughts.filter(thought => thought.id !== thoughtId));
        
        Alert.alert('Success', 'Thought deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting thought:', error);
      Alert.alert('Error', 'Failed to delete thought. Please try again.');
    }
  };

  const toggleInput = () => {
    setShowInput(!showInput);
    if (!showInput) {
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      setInputText('');
    }
  };

  const getRandomAffirmation = () => {
    const affirmations = [
      "You are enough.",
      "You are growing at your own pace.",
      "Your journey is unique and beautiful.",
      "Every small step is progress.",
      "You are worthy of love and kindness.",
    ];
    return affirmations[Math.floor(Math.random() * affirmations.length)];
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <LinearGradient
        colors={theme.background}
        style={styles.background}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.primary }]}>Whispers in Bloom</Text>
            <Text style={styles.subtitle}>Your Garden of Thoughts</Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: theme.secondary[0] }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={32} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView 
            style={styles.gardenContainer}
            contentContainerStyle={styles.gardenContent}
          >
            {thoughts && thoughts.length > 0 ? (
              thoughts.map((thought) => (
                <View
                  key={thought.id}
                  style={styles.thoughtWrapper}
                >
                  <View style={styles.thoughtContent}>
                    <Image 
                      source={FLOWER_IMAGES[thought.flowerType || 'default']} 
                      style={styles.flowerImage}
                    />
                    <View style={styles.thoughtTextContainer}>
                      <Text style={styles.thoughtText}>{thought.text}</Text>
                      <Text style={styles.thoughtDate}>
                        {new Date(thought.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Delete Thought',
                          'Are you sure you want to delete this thought?',
                          [
                            {
                              text: 'Cancel',
                              style: 'cancel'
                            },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => handleDeleteThought(thought.id)
                            }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyGarden}>
                <Text style={styles.emptyText}>Your garden is empty</Text>
                <Text style={styles.emptySubtext}>Plant your first thought to see it bloom here</Text>
              </View>
            )}
          </ScrollView>
        )}

        {showInput && (
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Plant a thought or message for tomorrow..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handlePlantThought}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={styles.plantButton}
                onPress={handlePlantThought}
              >
                <Ionicons name="leaf-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.affirmationContainer}>
          <Text style={styles.affirmationText}>{getRandomAffirmation()}</Text>
        </View>

        <TouchableOpacity
          style={styles.fab}
          onPress={toggleInput}
        >
          <Ionicons
            name={showInput ? 'close' : 'add'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gardenContainer: {
    flex: 1,
  },
  gardenContent: {
    padding: 20,
    paddingBottom: 100,
  },
  thoughtWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  thoughtContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thoughtTextContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  thoughtText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  thoughtDate: {
    fontSize: 12,
    color: '#999',
  },
  flowerImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  emptyGarden: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: '#333',
    minHeight: 40,
    maxHeight: 100,
  },
  plantButton: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  affirmationContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  affirmationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButton: {
    padding: 8,
  },
});

export default GardenScreen;
