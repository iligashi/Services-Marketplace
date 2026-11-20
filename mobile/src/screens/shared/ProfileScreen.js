import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile, logoutUser } from '../../store/authSlice';
import { confirmAction } from '../../utils/dialogs';
import api from '../../api/axios.instance';
import Avatar from '../../components/Avatar';
import { Screen, Section, Row, Button, Pill, Appear } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import { successFeedback } from '../../utils/haptics';

/** Settings-style row with the label on the left and an inline text field. */
function InputRow({ label, multiline, ...props }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: multiline ? 'column' : 'row', alignItems: multiline ? 'stretch' : 'center', paddingHorizontal: 16, paddingVertical: multiline ? 12 : 0, minHeight: 50 }}>
      <Text style={[type.body, { color: colors.text, width: multiline ? undefined : 110, marginBottom: multiline ? 6 : 0 }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
        style={[type.body, {
          flex: multiline ? undefined : 1, color: colors.textSecondary, paddingVertical: multiline ? 0 : 14,
          textAlign: multiline ? 'left' : 'right', minHeight: multiline ? 72 : undefined, outlineStyle: 'none',
        }]}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user } = useSelector((state) => state.auth);
  const { colors, isDark, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [serviceRadius, setServiceRadius] = useState('25');
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(fetchProfile()); }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setSkills(user.skills ? (Array.isArray(user.skills) ? user.skills.join(', ') : '') : '');
      setServiceRadius(user.service_radius_km?.toString() || '25');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      const body = { name: name.trim(), phone: phone.trim() || undefined };
      if (user?.role === 'provider') {
        body.bio = bio;
        body.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
        body.service_radius_km = parseInt(serviceRadius, 10) || 25;
      }
      await api.put('/auth/profile', body);
      successFeedback();
      Alert.alert('Saved!', 'Your profile has been updated.');
      dispatch(fetchProfile());
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    if (await confirmAction('Log Out', 'Are you sure you want to log out?', { confirmText: 'Log Out', destructive: true })) {
      dispatch(logoutUser());
    }
  };

  const isProvider = user?.role === 'provider';

  return (
    <Screen title="Profile">
      {/* Identity card */}
      <Appear style={{ alignItems: 'center', marginTop: 4 }}>
        <View style={{ borderRadius: 48, shadowColor: colors.indigo, shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } }}>
          <Avatar name={user?.name} uri={user?.avatar_url} size={96} />
        </View>
        <Text style={[type.title2, { color: colors.text, marginTop: 14 }]}>{user?.name}</Text>
        <Text style={[type.subhead, { color: colors.textSecondary, marginTop: 2 }]}>{user?.email}</Text>
        <Pill
          label={isProvider ? 'Service Provider' : 'Customer'}
          icon={isProvider ? 'construct' : 'home'}
          tone={isProvider ? 'accent' : 'primary'}
          style={{ alignSelf: 'center', marginTop: 10 }}
        />
      </Appear>

      <Section title="Personal information">
        <InputRow label="Name" placeholder="Your full name" value={name} onChangeText={setName} />
        <InputRow label="Phone" placeholder="Add a number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </Section>

      {isProvider ? (
        <Section title="Provider details" footer="Separate skills with commas. They power your job recommendations.">
          <InputRow label="Bio" placeholder="Tell customers about your experience…" value={bio} onChangeText={setBio} multiline />
          <InputRow label="Skills" placeholder="Plumbing, Repairs" value={skills} onChangeText={setSkills} />
          <InputRow label="Radius (km)" placeholder="25" value={serviceRadius} onChangeText={setServiceRadius} keyboardType="numeric" />
        </Section>
      ) : null}

      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <Button title="Save Changes" icon="checkmark-circle" loading={saving} onPress={handleSave} />
      </View>

      <Section title="Preferences" separatorInset={58}>
        <Row
          icon={isDark ? 'moon' : 'sunny'}
          iconTone={isDark ? 'indigo' : 'accent'}
          title="Dark Mode"
          right={(
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.fillStrong, true: colors.success }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.fillStrong}
              activeThumbColor="#FFFFFF"
            />
          )}
        />
        <Row icon="notifications" iconTone="error" title="Notifications" chevron onPress={() => navigation.navigate('Notifications')} />
      </Section>

      <Section title="Account" separatorInset={58}>
        <Row icon="mail" iconTone="info" title="Email" value={user?.email} />
        <Row icon="shield-checkmark" iconTone="success" title="Account type" value={isProvider ? 'Pro' : 'Customer'} />
      </Section>

      <Section>
        <Row title="Log Out" destructive center onPress={handleLogout} />
      </Section>

      <Text style={[type.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: 20 }]}>Services Marketplace · v1.0.0</Text>
    </Screen>
  );
}
