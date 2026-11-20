import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { getJobById } from '../../api/jobs.api';
import { confirmCompletion } from '../../api/payments.api';
import JobStatusTimeline from '../../components/JobStatusTimeline';
import Avatar from '../../components/Avatar';
import { Screen, Card, Button, IconTile, StatusPill, Section, Row, EmptyState, Stat, Appear } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import { mediaUrl } from '../../config';
import { confirmAction } from '../../utils/dialogs';
import { categoryMeta, money } from '../../utils/categories';
import { successFeedback } from '../../utils/haptics';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const { colors } = useTheme();
  const [job, setJob] = useState(null);
  const [failed, setFailed] = useState(false);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => { loadJob(); }, [jobId]);

  const loadJob = async () => {
    setFailed(false);
    try {
      const { data } = await getJobById(jobId);
      setJob(data.job);
    } catch {
      setFailed(true);
    }
  };

  const doConfirmCompletion = async () => {
    try {
      await confirmCompletion(jobId);
      successFeedback();
      Alert.alert('Done!', 'Payment released successfully');
      loadJob();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    }
  };

  const handleConfirmCompletion = async () => {
    if (await confirmAction('Confirm Completion', 'This will mark the job as complete and release payment to the provider. Are you sure?', { confirmText: 'Yes, release payment' })) {
      doConfirmCompletion();
    }
  };

  if (!job) {
    return (
      <Screen title="Job" large={false}>
        {failed ? (
          <EmptyState icon="cloud-offline" tone="textSecondary" title="Couldn't load this job" message="Check your connection and try again." actionLabel="Try again" onAction={loadJob} style={{ marginTop: 80 }} />
        ) : (
          <View style={{ paddingTop: 120, alignItems: 'center' }}><ActivityIndicator color={colors.textSecondary} /></View>
        )}
      </Screen>
    );
  }

  const photos = typeof job.photos === 'string' ? JSON.parse(job.photos) : job.photos || [];
  const isOwner = user?.id === job.customer_id;
  const isActive = ['assigned', 'in_progress'].includes(job.status);
  const cat = categoryMeta(job.category_slug || job.category_name);

  let footer = null;
  if (isOwner && job.status === 'open') {
    footer = <Button title={`View Bids (${job.bid_count})`} icon="people" onPress={() => navigation.navigate('Bids', { jobId: job.id })} />;
  } else if (isOwner && isActive) {
    footer = (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Message" icon="chatbubble" variant="tinted" onPress={() => navigation.navigate('Chat', { jobId: job.id })} flex />
        <Button title="Confirm & Pay" icon="checkmark-circle" tone="success" onPress={handleConfirmCompletion} style={{ flex: 1.4 }} />
      </View>
    );
  } else if (isOwner && job.status === 'completed' && job.provider_id) {
    footer = (
      <Button
        title="Leave a Review"
        icon="star"
        tone="gold"
        onPress={() => navigation.navigate('Review', { jobId: job.id, revieweeId: job.provider_id, revieweeName: job.provider_name || 'Provider' })}
      />
    );
  }

  return (
    <Screen title={job.title} large={false} titleOnScroll footer={footer}>
      {/* Title block */}
      <Appear style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <IconTile icon={cat.icon} tone={cat.tone} size={34} />
          <Text style={[type.subhead, { color: colors.textSecondary, flex: 1 }]}>{job.category_name || 'General'}</Text>
          <StatusPill status={job.status} />
        </View>
        <Text style={[type.title1, { color: colors.text }]}>{job.title}</Text>
        <Text style={[type.footnote, { color: colors.textSecondary, marginTop: 6 }]}>
          {`Posted by ${job.customer_name} · ${new Date(job.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`}
        </Text>
      </Appear>

      {/* Key numbers */}
      <Appear index={1}>
        <Card style={{ marginHorizontal: 16, marginTop: 20, flexDirection: 'row', paddingVertical: 4 }}>
          <Stat value={job.budget ? money(job.budget) : '—'} label="Budget" />
          <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: 14 }} />
          <Stat value={String(job.bid_count ?? 0)} label="Bids" tone="primary" />
          <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: 14 }} />
          <Stat value={job.deadline ? new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'} label="Deadline" />
        </Card>
      </Appear>

      {/* Progress */}
      <Appear index={2}>
        <Text style={[type.footnote, { color: colors.textSecondary, textTransform: 'uppercase', marginLeft: 32, marginTop: 24, marginBottom: 7 }]}>Progress</Text>
        <Card style={{ marginHorizontal: 16 }}>
          <JobStatusTimeline job={job} />
        </Card>
      </Appear>

      {/* Description */}
      <Text style={[type.footnote, { color: colors.textSecondary, textTransform: 'uppercase', marginLeft: 32, marginTop: 24, marginBottom: 7 }]}>Details</Text>
      <Card style={{ marginHorizontal: 16 }}>
        <Text style={[type.body, { color: colors.text }]}>{job.description}</Text>
      </Card>

      {job.location_address || job.provider_name ? (
        <Section separatorInset={58}>
          {job.location_address ? <Row icon="location" iconTone="error" title={job.location_address} subtitle="Location" /> : null}
          {job.provider_name ? (
            <Row
              icon="person"
              iconTone="indigo"
              title={job.provider_name}
              subtitle="Your pro"
              chevron
              right={<Avatar name={job.provider_name} size={30} />}
              onPress={() => navigation.navigate('ProviderProfile', { userId: job.provider_id, name: job.provider_name })}
            />
          ) : null}
        </Section>
      ) : null}

      {photos.length > 0 ? (
        <>
          <Text style={[type.footnote, { color: colors.textSecondary, textTransform: 'uppercase', marginLeft: 32, marginTop: 24, marginBottom: 7 }]}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri: mediaUrl(uri) }} style={{ width: 200, height: 150, borderRadius: 18 }} />
            ))}
          </ScrollView>
        </>
      ) : null}
    </Screen>
  );
}
