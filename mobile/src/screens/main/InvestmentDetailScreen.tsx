import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { api } from '../../lib/api';
import { RootStackParamList } from '../../navigation/types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const { width: screenWidth } = Dimensions.get('window');

interface Pool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  targetAmount: string;
  raisedAmount: string;
  minInvestment: string;
  maxInvestment: string | null;
  sharePrice: string;
  totalShares: number;
  availableShares: number;
  expectedReturn: string | null;
  holdPeriod: number | null;
  distributionFrequency: string;
  status: string;
  riskLevel: string;
  investmentType: string;
  propertyType: string | null;
  location: string | null;
  highlights: string[] | null;
  images: string[] | null;
  managementFee: string;
  startDate: string | null;
  fundingDeadline: string | null;
}

type InvestmentDetailRouteProp = RouteProp<RootStackParamList, 'InvestmentDetail'>;

export default function InvestmentDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<InvestmentDetailRouteProp>();
  const { id } = route.params;

  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [shares, setShares] = useState(1);

  useEffect(() => {
    fetchPool();
  }, [id]);

  const fetchPool = async () => {
    try {
      const res = await api.get<{ pool: Pool }>(`/api/co-invest/${id}`);
      if (res.success && res.data) {
        setPool(res.data.pool);
      }
    } catch (error) {
      console.error('Error fetching pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const calculateProgress = () => {
    if (!pool) return 0;
    const raised = parseFloat(pool.raisedAmount);
    const target = parseFloat(pool.targetAmount);
    return Math.min((raised / target) * 100, 100);
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return colors.teal;
      case 'moderate':
        return colors.gold;
      case 'high':
        return colors.rose;
      default:
        return colors.gray500;
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'default' | 'primary' => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'funded':
        return 'success';
      case 'seeking':
        return 'primary';
      case 'completed':
        return 'default';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.rose} />
      </SafeAreaView>
    );
  }

  if (!pool) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Investment opportunity not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const progress = calculateProgress();
  const investmentAmount = shares * parseFloat(pool.sharePrice);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          {pool.images && pool.images.length > 0 ? (
            <Image source={{ uri: pool.images[0] }} style={styles.mainImage} resizeMode="cover" />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Text style={styles.noImageText}>📈</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Badges */}
          <View style={styles.badges}>
            <Badge variant={getStatusVariant(pool.status)}>{pool.status.toUpperCase()}</Badge>
            <Badge variant="default">{pool.investmentType.toUpperCase()}</Badge>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(pool.riskLevel) + '20' }]}>
              <Text style={[styles.riskText, { color: getRiskColor(pool.riskLevel) }]}>
                {pool.riskLevel.toUpperCase()} RISK
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{pool.name}</Text>
          {pool.location && <Text style={styles.location}>📍 {pool.location}</Text>}

          {/* Progress Card */}
          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.raisedAmount}>{formatCurrency(pool.raisedAmount)}</Text>
              <Text style={styles.targetAmount}>of {formatCurrency(pool.targetAmount)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{progress.toFixed(0)}%</Text>
                <Text style={styles.progressStatLabel}>Funded</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{pool.availableShares}</Text>
                <Text style={styles.progressStatLabel}>Shares Left</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{pool.expectedReturn || '--'}%</Text>
                <Text style={styles.progressStatLabel}>Target Return</Text>
              </View>
            </View>
          </Card>

          {/* Key Metrics */}
          <Card style={styles.metricsCard}>
            <Text style={styles.sectionTitle}>Investment Details</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Minimum Investment</Text>
                <Text style={styles.metricValue}>{formatCurrency(pool.minInvestment)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Share Price</Text>
                <Text style={styles.metricValue}>{formatCurrency(pool.sharePrice)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Hold Period</Text>
                <Text style={styles.metricValue}>{pool.holdPeriod ? `${pool.holdPeriod} months` : 'TBD'}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Distributions</Text>
                <Text style={styles.metricValue}>{pool.distributionFrequency}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Management Fee</Text>
                <Text style={styles.metricValue}>{pool.managementFee}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Property Type</Text>
                <Text style={styles.metricValue}>{pool.propertyType || 'Various'}</Text>
              </View>
            </View>
          </Card>

          {/* Description */}
          {pool.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Investment</Text>
              <Text style={styles.description}>{pool.description}</Text>
            </View>
          )}

          {/* Highlights */}
          {pool.highlights && pool.highlights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              {pool.highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightItem}>
                  <Text style={styles.highlightBullet}>✓</Text>
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Important Dates */}
          {(pool.startDate || pool.fundingDeadline) && (
            <Card style={styles.datesCard}>
              <Text style={styles.sectionTitle}>Important Dates</Text>
              {pool.fundingDeadline && (
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Funding Deadline</Text>
                  <Text style={styles.dateValue}>
                    {new Date(pool.fundingDeadline).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {pool.startDate && (
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Investment Start</Text>
                  <Text style={styles.dateValue}>
                    {new Date(pool.startDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {pool.status === 'seeking' && pool.availableShares > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.shareSelector}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => shares > 1 && setShares(shares - 1)}
            >
              <Text style={styles.shareButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.shareCount}>{shares} share{shares > 1 ? 's' : ''}</Text>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => shares < pool.availableShares && setShares(shares + 1)}
            >
              <Text style={styles.shareButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Button
            title={`Invest ${formatCurrency(investmentAmount)}`}
            onPress={() => {}}
            variant="primary"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.gray600,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray900,
  },
  shareButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  shareButtonText: {
    fontSize: fontSize.xl,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: colors.gray100,
  },
  mainImage: {
    width: screenWidth,
    height: 250,
  },
  noImagePlaceholder: {
    width: screenWidth,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lavender + '20',
  },
  noImageText: {
    fontSize: 60,
  },
  content: {
    padding: spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  riskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  riskText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: fontSize.md,
    color: colors.gray600,
    marginBottom: spacing.lg,
  },
  progressCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.lavender + '10',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  raisedAmount: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.lavender,
  },
  targetAmount: {
    fontSize: fontSize.md,
    color: colors.gray600,
    marginLeft: spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.lavender,
    borderRadius: borderRadius.full,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
  },
  progressStatLabel: {
    fontSize: fontSize.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  metricsCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricItem: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  metricLabel: {
    fontSize: fontSize.sm,
    color: colors.gray500,
  },
  metricValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray900,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.gray700,
    lineHeight: 24,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  highlightBullet: {
    fontSize: fontSize.md,
    color: colors.teal,
    marginRight: spacing.sm,
  },
  highlightText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.gray700,
  },
  datesCard: {
    marginBottom: spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  dateLabel: {
    fontSize: fontSize.md,
    color: colors.gray600,
  },
  dateValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray900,
  },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  shareSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  shareCount: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray900,
    marginHorizontal: spacing.lg,
  },
});
