import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';
import {
  createComparableSchema,
  updateComparableSchema,
  listComparablesSchema,
  batchCreateComparablesSchema,
} from '../schemas/comparable.schema';

const router = Router();

// Helper to calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to calculate relevance score
function calculateRelevanceScore(
  distance: number,
  daysOld: number,
  bedroomDiff: number,
  bathroomDiff: number,
  sqftDiff: number
): number {
  let score = 100;

  // Distance penalty (farther = lower score)
  if (distance > 1) score -= Math.min(30, distance * 10);
  if (distance > 5) score -= 10;

  // Recency bonus (fresher = higher score)
  if (daysOld < 30) score += 20;
  else if (daysOld < 90) score += 10;
  else if (daysOld > 365) score -= 15;

  // Specs similarity penalty
  if (bedroomDiff > 2) score -= 15;
  else if (bedroomDiff === 1) score -= 5;

  if (bathroomDiff > 1) score -= 15;
  else if (bathroomDiff > 0.5) score -= 5;

  if (sqftDiff > 0.3) score -= 20; // 30% difference
  else if (sqftDiff > 0.15) score -= 10; // 15% difference

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ==================== COMPARABLE SALES CRUD ====================

// Create a comparable sale
router.post(
  '/properties/:propertyId/comparables',
  authenticate,
  validate(createComparableSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId as string;
      const userId = req.user!.id;
      const data = req.body;

      // Verify property exists and user is owner
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        return sendError(res, 'NOT_FOUND', 'Property not found', 404);
      }

      if (property.ownerId !== userId) {
        return sendError(res, 'FORBIDDEN', 'Not authorized to add comparables to this property', 403);
      }

      // Calculate distance if both coords provided
      let distanceFromSubject = null;
      if (
        property.latitude &&
        property.longitude &&
        data.latitude &&
        data.longitude
      ) {
        distanceFromSubject = calculateDistance(
          Number(property.latitude),
          Number(property.longitude),
          data.latitude,
          data.longitude
        );
      }

      // Calculate days since sale
      const saleRecency = Math.floor(
        (Date.now() - new Date(data.saleDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate relevance score
      let relevanceScore = null;
      if (
        distanceFromSubject !== null &&
        property.bedrooms &&
        data.bedrooms &&
        property.squareFeet &&
        data.squareFeet
      ) {
        const bedroomDiff = Math.abs(property.bedrooms - data.bedrooms);
        const bathroomDiff = Math.abs(
          Number(property.bathrooms || 0) - (data.bathrooms || 0)
        );
        const sqftDiff = Math.abs(property.squareFeet - data.squareFeet) / property.squareFeet;

        relevanceScore = calculateRelevanceScore(
          distanceFromSubject,
          saleRecency,
          bedroomDiff,
          bathroomDiff,
          sqftDiff
        );
      }

      // Calculate price per sqft if not provided
      const pricePerSqFt = data.pricePerSqFt ||
        (data.squareFeet ? data.salePrice / data.squareFeet : null);

      // Calculate adjusted price if adjustments provided
      const adjustedPrice = data.adjustedPrice ||
        (data.adjustmentTotal
          ? data.salePrice * (1 + data.adjustmentTotal / 100)
          : data.salePrice);

      const comparable = await prisma.comparableSale.create({
        data: {
          ...data,
          propertyId,
          pricePerSqFt,
          adjustedPrice,
          distanceFromSubject,
          saleRecency,
          relevanceScore,
        },
      });

      return sendSuccess(res, { comparable }, 201);
    } catch (error) {
      next(error);
    }
  }
);

// Get comparable sales for a property
router.get(
  '/properties/:propertyId/comparables',
  validate(listComparablesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || 'saleDate';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      // Verify property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        return sendError(res, 'NOT_FOUND', 'Property not found', 404);
      }

      const skip = (page - 1) * limit;

      const [comparables, total] = await Promise.all([
        prisma.comparableSale.findMany({
          where: { propertyId },
          orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
          skip,
          take: limit,
        }),
        prisma.comparableSale.count({ where: { propertyId } }),
      ]);

      return sendPaginated(res, comparables, page, limit, total);
    } catch (error) {
      next(error);
    }
  }
);

// Get single comparable sale
router.get(
  '/properties/:propertyId/comparables/:comparableId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId as string;
      const comparableId = req.params.comparableId as string;

      const comparable = await prisma.comparableSale.findUnique({
        where: { id: comparableId },
      });

      if (!comparable || comparable.propertyId !== propertyId) {
        return sendError(res, 'NOT_FOUND', 'Comparable sale not found', 404);
      }

      return sendSuccess(res, { comparable });
    } catch (error) {
      next(error);
    }
  }
);

// Update comparable sale
router.put(
  '/properties/:propertyId/comparables/:comparableId',
  authenticate,
  validate(updateComparableSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId as string;
      const comparableId = req.params.comparableId as string;
      const userId = req.user!.id;
      const data = req.body;

      // Verify property exists and user is owner
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property || property.ownerId !== userId) {
        return sendError(res, 'FORBIDDEN', 'Not authorized', 403);
      }

      const comparable = await prisma.comparableSale.findUnique({
        where: { id: comparableId },
      });

      if (!comparable || comparable.propertyId !== propertyId) {
        return sendError(res, 'NOT_FOUND', 'Comparable sale not found', 404);
      }

      const updated = await prisma.comparableSale.update({
        where: { id: comparableId },
        data: {
          ...data,
          pricePerSqFt:
            data.pricePerSqFt ||
            (data.squareFeet
              ? Number(data.salePrice || comparable.salePrice) / data.squareFeet
              : comparable.pricePerSqFt),
        },
      });

      return sendSuccess(res, { comparable: updated });
    } catch (error) {
      next(error);
    }
  }
);

// Delete comparable sale
router.delete(
  '/properties/:propertyId/comparables/:comparableId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId as string;
      const comparableId = req.params.comparableId as string;
      const userId = req.user!.id;

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property || property.ownerId !== userId) {
        return sendError(res, 'FORBIDDEN', 'Not authorized', 403);
      }

      const comparable = await prisma.comparableSale.findUnique({
        where: { id: comparableId },
      });

      if (!comparable || comparable.propertyId !== propertyId) {
        return sendError(res, 'NOT_FOUND', 'Comparable sale not found', 404);
      }

      await prisma.comparableSale.delete({ where: { id: comparableId } });

      return sendSuccess(res, { message: 'Comparable sale deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// Batch create comparable sales
router.post(
  '/properties/:propertyId/comparables/batch',
  authenticate,
  validate(batchCreateComparablesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId as string;
      const userId = req.user!.id;
      const { comparables } = req.body;

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property || property.ownerId !== userId) {
        return sendError(res, 'FORBIDDEN', 'Not authorized', 403);
      }

      const created = await Promise.all(
        comparables.map(async (data: any) => {
          let distanceFromSubject = null;
          if (
            property.latitude &&
            property.longitude &&
            data.latitude &&
            data.longitude
          ) {
            distanceFromSubject = calculateDistance(
              Number(property.latitude),
              Number(property.longitude),
              data.latitude,
              data.longitude
            );
          }

          const saleRecency = Math.floor(
            (Date.now() - new Date(data.saleDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          let relevanceScore = null;
          if (distanceFromSubject !== null && property.bedrooms && data.bedrooms) {
            const bedroomDiff = Math.abs(property.bedrooms - data.bedrooms);
            const bathroomDiff = Math.abs(
              Number(property.bathrooms || 0) - (data.bathrooms || 0)
            );
            const sqftDiff =
              property.squareFeet && data.squareFeet
                ? Math.abs(property.squareFeet - data.squareFeet) / property.squareFeet
                : 0;

            relevanceScore = calculateRelevanceScore(
              distanceFromSubject,
              saleRecency,
              bedroomDiff,
              bathroomDiff,
              sqftDiff
            );
          }

          return prisma.comparableSale.create({
            data: {
              ...data,
              propertyId,
              pricePerSqFt:
                data.pricePerSqFt ||
                (data.squareFeet ? data.salePrice / data.squareFeet : null),
              adjustedPrice:
                data.adjustedPrice ||
                (data.adjustmentTotal
                  ? data.salePrice * (1 + data.adjustmentTotal / 100)
                  : data.salePrice),
              distanceFromSubject,
              saleRecency,
              relevanceScore,
            },
          });
        })
      );

      return sendSuccess(res, { comparables: created }, 201);
    } catch (error) {
      next(error);
    }
  }
);

// Get comparable sales analysis/summary for a property
router.get(
  '/properties/:propertyId/comparables/analysis/summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId as string;

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        return sendError(res, 'NOT_FOUND', 'Property not found', 404);
      }

      const comparables = await prisma.comparableSale.findMany({
        where: { propertyId },
      });

      if (comparables.length === 0) {
        return sendSuccess(res, { analysis: null, message: 'No comparable sales found' });
      }

      // Sort by relevance score (highest first)
      const sorted = [...comparables].sort(
        (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
      );

      // Use top 3 most relevant comps for valuation
      const topComps = sorted.slice(0, 3);

      // Calculate average adjusted price from top comps
      const avgAdjustedPrice =
        topComps.reduce((sum, c) => sum + Number(c.adjustedPrice), 0) / topComps.length;

      // Calculate price per sqft average
      const avgPricePerSqFt =
        topComps
          .filter((c) => c.pricePerSqFt)
          .reduce((sum, c) => sum + Number(c.pricePerSqFt || 0), 0) /
        topComps.filter((c) => c.pricePerSqFt).length;

      const suggestedValuation = property.squareFeet
        ? avgPricePerSqFt * property.squareFeet
        : avgAdjustedPrice;

      return sendSuccess(res, {
        analysis: {
          totalComparables: comparables.length,
          topComps: topComps.length,
          avgAdjustedPrice: Math.round(avgAdjustedPrice),
          avgPricePerSqFt: Math.round(avgPricePerSqFt * 100) / 100,
          suggestedValuation: Math.round(suggestedValuation),
          valueRange: {
            min: Math.min(...topComps.map((c) => Number(c.adjustedPrice))),
            max: Math.max(...topComps.map((c) => Number(c.adjustedPrice))),
          },
          topCompsDetails: topComps.map((c) => ({
            id: c.id,
            address: c.address,
            city: c.city,
            state: c.state,
            salePrice: c.salePrice,
            adjustedPrice: c.adjustedPrice,
            pricePerSqFt: c.pricePerSqFt,
            distanceFromSubject: c.distanceFromSubject,
            relevanceScore: c.relevanceScore,
            saleDate: c.saleDate,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
