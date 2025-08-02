import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.title}>🗳️ Voting App</Text>
        <Text style={styles.subtitle}>Welcome to the Voting Platform</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>✅ Backend Status</Text>
          <Text style={styles.infoText}>API: Connected</Text>
          <Text style={styles.infoText}>Auth: Cognito Ready</Text>
          <Text style={styles.infoText}>Database: DynamoDB Active</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button title="Sign In" onPress={() => console.log('Sign in')} />
          <View style={styles.spacer} />
          <Button title="Register" onPress={() => console.log('Register')} />
        </View>
        
        <Text style={styles.footer}>
          Ready for development • AWS Amplify Gen 2
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  infoBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
    minWidth: 300,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  spacer: {
    width: 20,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    position: 'absolute',
    bottom: 30,
  },
});