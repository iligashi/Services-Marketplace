import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios.instance';
import { Screen, IconTile, EmptyState, Appear, SectionHeader } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type, shadows } from '../../theme';
import { money } from '../../utils/categories';

export default function EarningsScreen() {
  const { colors, isDark } = useTheme();
  const [payments, setPayments] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/provider/earnings');
      setPayments(data.payments);
      setTotalEarnings(data.payments.reduce((sum, p) => sum + parseFloat(p.provider_payout), 0));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadEarnings(); }, []);

  const average = payments.length ? totalEarnings / payments.length : 0;

  const header = (
    <View>
      <Appear>
        <LinearGradient
          colors={colors.gradientMoney}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ marginHorizontal: 16, borderRadius: 28, padding: 22, overflow: 'hidden' }, shadows.glow(colors.success)]}
        >
          <View style={{ position: 'absolute', right: -40, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.14)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-down-circle" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={[type.footnote, { color: 'rgba(255,255,255,0.9)', fontWeight: '600' }]}>Paid out to you</Text>
          </View>
          <Text style={{ fontSize: 46, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginTop: 4 }}>
            {money(totalEarnings, { decimals: 2 })}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 12 }}>
              <Text style={[type.caption, { color: 'rgba(255,255,255,0.85)' }]}>Payments</Text>
              <Text style={[type.title3, { color: '#fff', fontWeight: '700' }]}>{payments.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 12 }}>
              <Text style={[type.caption, { color: 'rgba(255,255,255,0.85)' }]}>Average job</Text>
              <Text style={[type.title3, { color: '#fff', fontWeight: '700' }]}>{money(average)}</Text>
            </View>
          </View>
        </LinearGradient>
      </Appear>
      {payments.length > 0 ? <SectionHeader title="History" /> : null}
    </View>
  );

  return (
    <Screen
      title="Earnings"
      subtitle="Released payments after the platform fee"
      header={header}
      data={payments}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item, index }) => {
        const first = index === 0;
        const last = index === payments.length - 1;
        return (
          <Appear index={index}>
            <View style={{
              marginHorizontal: 16, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              borderTopLeftRadius: first ? 20 : 0, borderTopRightRadius: first ? 20 : 0,
              borderBottomLeftRadius: last ? 20 : 0, borderBottomRightRadius: last ? 20 : 0,
              borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.separator,
              ...(isDark || !first ? null : shadows.xs),
            }}>
              <IconTile icon="arrow-down" tone="success" size={38} variant="soft" style={{ borderRadius: 19 }} />
              <View style={{ flex: 1 }}>
                <Text style={[type.subhead, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>{item.job_title}</Text>
                <Text style={[type.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {new Date(item.released_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <Text style={[type.headline, { color: colors.success }]}>{`+${money(item.provider_payout, { decimals: 2 })}`}</Text>
            </View>
          </Appear>
        );
      }}
      refreshing={loading && payments.length > 0}
      onRefresh={loadEarnings}
      ListEmptyComponent={!loading ? (
        <EmptyState icon="cash" tone="success" title="No payouts yet" message="When a customer confirms a finished job, the money lands here." style={{ paddingTop: 32 }} />
      ) : null}
    />
  );
}
