import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios.instance';
import { getRecommendedJobs, getSavedJobs, saveJob, unsaveJob } from '../../api/users.api';
import JobCard from '../../components/JobCard';
import { JobListSkeleton } from '../../components/Skeleton';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme';

const TABS = [
  { key: 'recommended', label: 'For You', icon: 'sparkles-outline' },
  { key: 'all', label: 'All Jobs', icon: 'grid-outline' },
  { key: 'saved', label: 'Saved', icon: 'bookmark-outline' },
];

export default function BrowseJobsScreen({ navigation }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState('recommended');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [matched, setMatched] = useState(true);

  const loadSavedIds = useCallback(async () => {
    try {
      const { data } = await getSavedJobs();
      setSavedIds(new Set(data.jobs.map((j) => j.id)));
    } catch {}
  }, []);

  const load = useCallback(async (which) => {
    setLoading(true);
    try {
      if (which === 'recommended') {
        const { data } = await getRecommendedJobs();
        setJobs(data.jobs);
        setMatched(data.matched);
      } else if (which === 'saved') {
        const { data } = await getSavedJobs();
        setJobs(data.jobs);
        setSavedIds(new Set(data.jobs.map((j) => j.id)));
      } else {
        const { data } = await api.get('/jobs', { params: { status: 'open' } });
        setJobs(data.jobs);
      }
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSavedIds(); }, []);
  useEffect(() => { load(tab); }, [tab]);

  const toggleSave = async (job) => {
    const isSaved = savedIds.has(job.id);
    // optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(job.id) : next.add(job.id);
      return next;
    });
    try {
      isSaved ? await unsaveJob(job.id) : await saveJob(job.id);
      if (tab === 'saved' && isSaved) setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch {
      // revert on failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(job.id) : next.delete(job.id);
        return next;
      });
    }
  };

  const emptyConfig = {
    recommended: { icon: 'sparkles-outline', title: 'No matches yet', desc: 'Add skills to your profile to get personalized job recommendations' },
    all: { icon: 'briefcase-outline', title: 'No open jobs', desc: 'Check back soon — new jobs are posted regularly' },
    saved: { icon: 'bookmark-outline', title: 'No saved jobs', desc: 'Tap the bookmark on any job to save it for later' },
  }[tab];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />

      {/* Header */}
      <View style={{ backgroundColor: colors.gradientStart, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Find Work</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
          {tab === 'recommended' && matched ? 'Matched to your skills' : 'Browse available jobs'}
        </Text>
      </View>

      {/* Segmented tabs */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.bg }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                paddingVertical: 10, borderRadius: radius.full,
                backgroundColor: active ? colors.primary : colors.card,
                borderWidth: 1.5, borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Ionicons name={t.icon} size={14} color={active ? '#fff' : colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : colors.textSecondary }}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <JobListSkeleton count={4} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => navigation.navigate('SubmitBid', { job: item })}
              showDistance={!!item.distance}
              saved={savedIds.has(item.id)}
              onToggleSave={() => toggleSave(item)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => load(tab)} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Ionicons name={emptyConfig.icon} size={36} color={colors.textTertiary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8, textAlign: 'center' }}>{emptyConfig.title}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>{emptyConfig.desc}</Text>
            </View>
          }
          contentContainerStyle={jobs.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
