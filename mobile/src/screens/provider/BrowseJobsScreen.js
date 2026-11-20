import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import api from '../../api/axios.instance';
import { getRecommendedJobs, getSavedJobs, saveJob, unsaveJob } from '../../api/users.api';
import JobCard from '../../components/JobCard';
import { JobListSkeleton } from '../../components/Skeleton';
import { Screen, Segmented, EmptyState, Appear } from '../../components/ui';

const TABS = [
  { key: 'recommended', label: 'For You' },
  { key: 'all', label: 'All Jobs' },
  { key: 'saved', label: 'Saved' },
];

const EMPTY = {
  recommended: { icon: 'sparkles', title: 'No matches yet', message: 'Add skills to your profile to get personalised job recommendations.' },
  all: { icon: 'briefcase', title: 'No open jobs', message: 'New jobs are posted all the time. Pull to refresh.' },
  saved: { icon: 'bookmark', title: 'Nothing saved', message: 'Tap the bookmark on any job to keep it here for later.' },
};

export default function BrowseJobsScreen({ navigation }) {
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
    // Optimistic update, reverted if the request fails
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(job.id) : next.add(job.id);
      return next;
    });
    try {
      isSaved ? await unsaveJob(job.id) : await saveJob(job.id);
      if (tab === 'saved' && isSaved) setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(job.id) : next.delete(job.id);
        return next;
      });
    }
  };

  const empty = EMPTY[tab];

  return (
    <Screen
      title="Find Work"
      subtitle={tab === 'recommended' && matched ? 'Hand-picked for your skills' : 'Every open job near you'}
      header={(
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Segmented options={TABS} value={tab} onChange={setTab} />
          {loading ? <View style={{ marginTop: 16, marginHorizontal: -16 }}><JobListSkeleton count={3} /></View> : null}
        </View>
      )}
      data={loading ? [] : jobs}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item, index }) => (
        <Appear index={index}>
          <JobCard
            job={item}
            onPress={() => navigation.navigate('SubmitBid', { job: item })}
            showDistance={!!item.distance}
            saved={savedIds.has(item.id)}
            onToggleSave={() => toggleSave(item)}
          />
        </Appear>
      )}
      refreshing={false}
      onRefresh={() => load(tab)}
      ListEmptyComponent={!loading ? <EmptyState icon={empty.icon} title={empty.title} message={empty.message} /> : null}
    />
  );
}
