import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';

const { width: screenWidth } = Dimensions.get('window');

interface Account {
  id: string;
  name: string;
  type: string;
  currentBalance: string | null;
  institutionName: string | null;
  mask: string | null;
}

interface Transaction {
  id: string;
  name: string;
  amount: string;
  date: string;
  category: string | null;
}

interface Budget {
  id: string;
  name: string;
  category: string;
  amount: string;
  spent: string;
}

interface FinancialSummary {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export default function FinancialDashboardScreen() {
  const navigation = useNavigation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch accounts
      const accountsRes = await api.get<{ accounts: Account[] }>('/api/accounts');
      if (accountsRes.success && accountsRes.data) {
        setAccounts(accountsRes.data.accounts);
        calculateSummary(accountsRes.data.accounts);
      }

      // Fetch recent transactions
      const transactionsRes = await api.get<{ transactions: Transaction[] }>('/api/transactions?limit=5');
      if (transactionsRes.success && transactionsRes.data) {
        setTransactions(transactionsRes.data.transactions);
      }

      // Fetch budgets
      const budgetsRes = await api.get<{ budgets: Budget[] }>('/api/budgets');
      if (budgetsRes.success && budgetsRes.data) {
        setBudgets(budgetsRes.data.budgets);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (accts: Account[]) => {
    let assets = 0;
    let liabilities = 0;

    accts.forEach(acc => {
      const balance = parseFloat(acc.currentBalance || '0');
      if (['checking', 'savings', 'investment'].includes(acc.type)) {
        assets += balance;
      } else if (['credit', 'loan'].includes(acc.type)) {
        liabilities += Math.abs(balance);
      }
    });

    setSummary(prev => ({
      ...prev,
      netWorth: assets - liabilities,
      totalAssets: assets,
      totalLiabilities: liabilities,
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
        return '🏦';
      case 'savings':
        return '💰';
      case 'credit':
        return '💳';
      case 'investment':
        return '📈';
      case 'loan':
        return '🏠';
      default:
        return '💵';
    }
  };

  const getBudgetProgress = (budget: Budget) => {
    const spent = parseFloat(budget.spent);
    const total = parseFloat(budget.amount);
    return Math.min((spent / total) * 100, 100);
  };

  const getBudgetColor = (budget: Budget) => {
    const progress = getBudgetProgress(budget);
    if (progress >= 100) return colors.rose;
    if (progress >= 80) return colors.gold;
    return colors.teal;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finances</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.rose} />
        }
      >
        {/* Net Worth Card */}
        <Card style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>Net Worth</Text>
          <Text style={styles.netWorthValue}>{formatCurrency(summary.netWorth)}</Text>
          <View style={styles.netWorthBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownValue}>{formatCurrency(summary.totalAssets)}</Text>
              <Text style={styles.breakdownLabel}>Assets</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownValue, styles.liabilityValue]}>
                {formatCurrency(summary.totalLiabilities)}
              </Text>
              <Text style={styles.breakdownLabel}>Liabilities</Text>
            </View>
          </View>
        </Card>

        {/* Accounts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {accounts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏦</Text>
              <Text style={styles.emptyText}>No accounts linked</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Link Account</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            accounts.slice(0, 4).map(account => (
              <TouchableOpacity key={account.id} style={styles.accountItem}>
                <View style={styles.accountIcon}>
                  <Text style={styles.accountIconText}>{getAccountIcon(account.type)}</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountInstitution}>
                    {account.institutionName || account.type} {account.mask && `••${account.mask}`}
                  </Text>
                </View>
                <Text style={styles.accountBalance}>
                  {formatCurrency(account.currentBalance || 0)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Budgets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budgets</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {budgets.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No budgets set</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Create Budget</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            budgets.slice(0, 3).map(budget => (
              <Card key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetName}>{budget.name}</Text>
                  <Text style={styles.budgetAmount}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${getBudgetProgress(budget)}%`,
                        backgroundColor: getBudgetColor(budget),
                      },
                    ]}
                  />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>No recent transactions</Text>
            </Card>
          ) : (
            transactions.map(transaction => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionIconText}>💳</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName} numberOfLines={1}>
                    {transaction.name}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category || 'Uncategorized'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    parseFloat(transaction.amount) < 0 && styles.positiveAmount,
                  ]}
                >
                  {parseFloat(transaction.amount) > 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.rose,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  netWorthCard: {
    backgroundColor: colors.lavender,
    marginBottom: spacing.lg,
  },
  netWorthLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  netWorthBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  breakdownValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  liabilityValue: {
    color: colors.rose + 'ee',
  },
  breakdownLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray900,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    color: colors.rose,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  addButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.rose + '10',
    borderRadius: borderRadius.full,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.rose,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountIconText: {
    fontSize: 20,
  },
  accountInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  accountName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray900,
  },
  accountInstitution: {
    fontSize: fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray900,
  },
  budgetCard: {
    marginBottom: spacing.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray900,
  },
  budgetAmount: {
    fontSize: fontSize.sm,
    color: colors.gray600,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  transactionName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.gray900,
  },
  transactionCategory: {
    fontSize: fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray900,
  },
  positiveAmount: {
    color: colors.teal,
  },
});
