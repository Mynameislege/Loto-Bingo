import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Typography } from '@/components/ui/tokens';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      Alert.alert('Attention', 'Merci de remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Attention', 'Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    try {
      await signUp(email, password, displayName);
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le compte. Cet email est peut-être déjà utilisé.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez la communauté Loto Seniors !</Text>

        <TextInput
          style={styles.input}
          placeholder="Votre prénom"
          placeholderTextColor="#999"
          value={displayName}
          onChangeText={setDisplayName}
          textContentType="givenName"
        />
        <TextInput
          style={styles.input}
          placeholder="Votre email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe (6 caractères minimum)"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
        />

        <TouchableOpacity
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>
            {isLoading ? 'Création...' : 'Créer mon compte'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => router.back()}>
          <Text style={styles.linkText}>Déjà inscrit ? Se connecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  title: { ...Typography.h1, color: Colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#1E5C30',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: Colors.text,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 17, color: Colors.orange },
});
