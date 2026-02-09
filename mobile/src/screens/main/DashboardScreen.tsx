import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

interface DashboardStats {
  totalInvested: number;
  portfolioValue: number;
  monthlyReturn: number;
  activeInvestments: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvested: 0,
    portfolioValue: 0,
    monthlyReturn: 0,
    activeInvestments: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      // In real app, fetch from API
      // For now, use mock data
      setStats({
        totalInvested: 25000,
        portfolioValue: 28500,
        monthlyReturn: 3.2,
        activeInvestments: 3,
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.rose} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.firstName || 'Investor'} 👋</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
        </View>

        {/* Portfolio Summary Card */}
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
          <Text style={styles.portfolioValue}>{formatCurrency(stats.portfolioValue)}</Text>
          <View style={styles.portfolioChange}>
            <Text style={styles.portfolioChangeText}>
              ↑ {stats.monthlyReturn}% this month
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.totalInvested)}</Text>
            <Text style={styles.statLabel}>Total Invested</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={styles.statValue}>{stats.activeInvestments}</Text>
            <Text style={styles.statLabel}>Active Investments</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>🏠</Text>
              <Text style={styles.actionText}>Browse Properties</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Co-Invest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Finances</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>🎓</Text>
              <Text style={styles.actionText}>Learn</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Opportunities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Opportunities</Text>
          <View style={styles.opportunityCard}>
            <View style={styles.opportunityHeader}>
              <Text style={styles.opportunityBadge}>🔥 Hot</Text>
              <Text style={styles.opportunityReturn}>12% Est. Return</Text>
            </View>
            <Text style={styles.opportunityTitle}>Austin Multi-Family Complex</Text>
            <Text style={styles.opportunityDescription}>
              4-unit property in growing tech hub. $50K minimum investment.
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '68%' }]} />
              </View>
              <Text style={styles.progressText}>68% funded</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  portfolioCard: {
    backgroundColor: colors.rose,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  portfolioLabel: {
    color: colors.white,
    fontSize: fontSize.sm,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  portfolioValue: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  portfolioChange: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  portfolioChangeText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  opportunityCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  opportunityBadge: {
    backgroundColor: colors.errorLight,
    color: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  opportunityReturn: {
    color: colors.success,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  opportunityTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  opportunityDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.rose,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
