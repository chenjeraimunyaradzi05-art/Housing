import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { api } from '../../lib/api';

interface Investment {
  id: string;
  pool: {
    name: string;
    status: string;
    expectedReturn: number;
    location: string;
  };
  shares: number;
  amountInvested: number;
  currentValue: number;
  status: string;
}

export default function InvestmentsScreen() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const fetchInvestments = async () => {
    try {
      const response = await api.get<{ investments: Investment[] }>('/api/co-invest/my-investments');
      if (response.success && response.data) {
        setInvestments(response.data.investments);
      }
    } catch (error) {
      console.error('Investments fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvestments();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredInvestments = investments.filter((inv) =>
    activeTab === 'active'
      ? ['confirmed', 'active'].includes(inv.status)
      : inv.status === 'completed'
  );

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amountInvested || 0), 0);
  const totalValue = investments.reduce((sum, inv) => sum + Number(inv.currentValue || inv.amountInvested || 0), 0);

  const renderInvestment = ({ item }: { item: Investment }) => {
    const returnPercent = item.pool.expectedReturn || 0;
    return (
      <TouchableOpacity style={styles.investmentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.returnText}>+{returnPercent}%</Text>
        </View>
        <Text style={styles.poolName}>{item.pool.name}</Text>
        <Text style={styles.poolLocation}>📍 {item.pool.location}</Text>
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.footerLabel}>Invested</Text>
            <Text style={styles.footerValue}>{formatCurrency(Number(item.amountInvested))}</Text>
          </View>
          <View>
            <Text style={styles.footerLabel}>Shares</Text>
            <Text style={styles.footerValue}>{item.shares}</Text>
          </View>
          <View>
            <Text style={styles.footerLabel}>Current</Text>
            <Text style={[styles.footerValue, styles.currentValue]}>
              {formatCurrency(Number(item.currentValue || item.amountInvested))}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Investments</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Invested</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalInvested)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Current Value</Text>
          <Text style={[styles.summaryValue, styles.valueGreen]}>{formatCurrency(totalValue)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Investments List */}
      <FlatList
        data={filteredInvestments}
        renderItem={renderInvestment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.rose} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No investments yet</Text>
            <Text style={styles.emptyText}>
              Start building your portfolio by exploring co-investment opportunities
            </Text>
            <TouchableOpacity style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>Explore Opportunities</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.gray200,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  valueGreen: {
    color: colors.success,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.rose,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  investmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.success,
    textTransform: 'capitalize',
  },
  returnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.success,
  },
  poolName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  poolLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
  },
  footerLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  footerValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentValue: {
    color: colors.success,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  exploreButton: {
    backgroundColor: colors.rose,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  exploreButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});
