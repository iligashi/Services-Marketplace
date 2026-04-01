import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile, logout } from '../../store/authSlice';
import api from '../../api/axios.instance';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [radius, setRadius] = useState('25');

  useEffect(() => {
    dispatch(fetchProfile());
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setSkills(user.skills ? (Array.isArray(user.skills) ? user.skills.join(', ') : '') : '');
      setRadius(user.service_radius_km?.toString() || '25');
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const body = { name, phone };
      if (user.role === 'provider') {
        body.bio = bio;
        body.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
        body.service_radius_km = parseInt(radius, 10) || 25;
      }
      await api.put('/auth/profile', body);
      Alert.alert('Success', 'Profile updated');
      dispatch(fetchProfile());
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
      </View>
      <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />

      {user?.role === 'provider' && (
        <>
          <TextInput style={[styles.input, { height: 80 }]} placeholder="Bio" value={bio} onChangeText={setBio} multiline />
          <TextInput style={styles.input} placeholder="Skills (comma separated)" value={skills} onChangeText={setSkills} />
          <TextInput style={styles.input} placeholder="Service Radius (km)" value={radius} onChangeText={setRadius} keyboardType="numeric" />
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', backgroundColor: '#f8f9fa' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0984e3', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  role: { fontSize: 13, color: '#0984e3', fontWeight: '600', marginBottom: 4, letterSpacing: 1 },
  email: { fontSize: 14, color: '#636e72', marginBottom: 24 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, width: '100%', marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#dfe6e9' },
  saveBtn: { backgroundColor: '#0984e3', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutBtn: { marginTop: 20, padding: 16 },
  logoutText: { color: '#d63031', fontSize: 16, fontWeight: '500' },
});
