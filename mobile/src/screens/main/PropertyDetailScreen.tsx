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

interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Property {
  id: string;
  title: string;
  description: string | null;
  propertyType: string;
  listingType: string;
  status: string;
  price: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number | null;
  bathrooms: string | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  features: string[];
  amenities: string[];
  images: PropertyImage[];
  isInvestment: boolean;
  capRate: string | null;
  monthlyRent: string | null;
}

type PropertyDetailRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>;

export default function PropertyDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PropertyDetailRouteProp>();
  const { id } = route.params;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const res = await api.get<{ property: Property }>(`/api/properties/${id}`);
      if (res.success && res.data) {
        setProperty(res.data.property);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await api.delete(`/api/properties/${id}/save`);
      } else {
        await api.post(`/api/properties/${id}/save`);
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving property:', error);
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

  const formatPropertyType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.rose} />
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Property not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const primaryImage = property.images.find(img => img.isPrimary) || property.images[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {property.images.length > 0 ? (
            <>
              <Image
                source={{ uri: property.images[activeImageIndex]?.url || primaryImage?.url }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              {property.images.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnailContainer}
                >
                  {property.images.map((img, index) => (
                    <TouchableOpacity
                      key={img.id}
                      onPress={() => setActiveImageIndex(index)}
                      style={[
                        styles.thumbnail,
                        activeImageIndex === index && styles.thumbnailActive,
                      ]}
                    >
                      <Image source={{ uri: img.url }} style={styles.thumbnailImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Text style={styles.noImageText}>🏠</Text>
            </View>
          )}
        </View>

        {/* Property Info */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.badges}>
              <Badge variant="primary">{formatPropertyType(property.propertyType)}</Badge>
              <Badge variant={property.status === 'active' ? 'success' : 'default'}>
                {property.status.toUpperCase()}
              </Badge>
            </View>
          </View>

          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.address}>
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </Text>
          <Text style={styles.price}>{formatCurrency(property.price)}</Text>

          {/* Quick Stats */}
          <Card style={styles.statsCard}>
            <View style={styles.statsGrid}>
              {property.bedrooms && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{property.bedrooms}</Text>
                  <Text style={styles.statLabel}>Beds</Text>
                </View>
              )}
              {property.bathrooms && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{property.bathrooms}</Text>
                  <Text style={styles.statLabel}>Baths</Text>
                </View>
              )}
              {property.squareFeet && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{property.squareFeet.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Sq Ft</Text>
                </View>
              )}
              {property.yearBuilt && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{property.yearBuilt}</Text>
                  <Text style={styles.statLabel}>Built</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Investment Info */}
          {property.isInvestment && (
            <Card style={styles.investmentCard}>
              <Text style={styles.sectionTitle}>Investment Metrics</Text>
              <View style={styles.investmentGrid}>
                {property.capRate && (
                  <View style={styles.investmentItem}>
                    <Text style={styles.investmentLabel}>Cap Rate</Text>
                    <Text style={styles.investmentValue}>{property.capRate}%</Text>
                  </View>
                )}
                {property.monthlyRent && (
                  <View style={styles.investmentItem}>
                    <Text style={styles.investmentLabel}>Monthly Rent</Text>
                    <Text style={styles.investmentValue}>{formatCurrency(property.monthlyRent)}</Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Description */}
          {property.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          )}

          {/* Features */}
          {property.features.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.featureGrid}>
                {property.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureText}>✓ {feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.featureGrid}>
                {property.amenities.map((amenity, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureText}>• {amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.bottomPrice}>{formatCurrency(property.price)}</Text>
            <Text style={styles.bottomLabel}>
              {property.listingType === 'rent' ? '/month' : 'listing price'}
            </Text>
          </View>
          <Button title="Contact Agent" onPress={() => {}} variant="primary" />
        </View>
      </View>
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
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  saveButtonText: {
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
    height: 300,
  },
  thumbnailContainer: {
    padding: spacing.sm,
  },
  thumbnail: {
    marginRight: spacing.sm,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: colors.rose,
  },
  thumbnailImage: {
    width: 60,
    height: 60,
  },
  noImagePlaceholder: {
    width: screenWidth,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  noImageText: {
    fontSize: 60,
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  address: {
    fontSize: fontSize.md,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.rose,
    marginBottom: spacing.lg,
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  investmentCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.lavender + '10',
  },
  investmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  investmentItem: {
    alignItems: 'center',
  },
  investmentLabel: {
    fontSize: fontSize.sm,
    color: colors.gray600,
  },
  investmentValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.lavender,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.gray700,
    lineHeight: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    width: '50%',
    paddingVertical: spacing.xs,
  },
  featureText: {
    fontSize: fontSize.md,
    color: colors.gray700,
  },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPrice: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
  },
  bottomLabel: {
    fontSize: fontSize.sm,
    color: colors.gray500,
  },
});
