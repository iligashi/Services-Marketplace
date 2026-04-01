import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/authSlice';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleRegister = () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Name, email and password are required');
      return;
    }
    dispatch(registerUser({ name, email, password, phone, role }));
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.roleToggle}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
          onPress={() => setRole('customer')}
        >
          <Text style={[styles.roleBtnText, role === 'customer' && styles.roleBtnTextActive]}>Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'provider' && styles.roleBtnActive]}
          onPress={() => setRole('provider')}
        >
          <Text style={[styles.roleBtnText, role === 'provider' && styles.roleBtnTextActive]}>Provider</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up as {role === 'customer' ? 'Customer' : 'Provider'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  roleToggle: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#dfe6e9', borderRadius: 12, overflow: 'hidden' },
  roleBtn: { flex: 1, padding: 14, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#0984e3' },
  roleBtnText: { fontSize: 16, color: '#636e72', fontWeight: '500' },
  roleBtnTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#dfe6e9' },
  button: { backgroundColor: '#0984e3', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  linkText: { textAlign: 'center', marginTop: 20, color: '#0984e3', fontSize: 15 },
});
