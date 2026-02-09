import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Errors } from '../utils/errors';
import { sendSuccess, sendPaginated } from '../utils/response';
import { uploadToS3, deleteFromS3 } from '../lib/storage';
import multer from 'multer';
import {
  createPropertySchema,
  updatePropertySchema,
  getPropertySchema,
  listPropertiesSchema,
  savePropertySchema,
  listSavedPropertiesSchema,
} from '../schemas/property.schema';

const router = Router();

// Multer config for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Helper to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100) + '-' + Date.now().toString(36);
}

// ==================== PROPERTY CRUD ====================

// Create property
router.post(
  '/',
  authenticate,
  validate(createPropertySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const data = req.body;

      // Generate slug
      const slug = generateSlug(data.title);

      // Calculate price per sqft
      const pricePerSqFt = data.squareFeet ? data.price / data.squareFeet : null;

      const property = await prisma.property.create({
        data: {
          ...data,
          slug,
          pricePerSqFt,
          ownerId: userId,
        },
        include: {
          images: true,
        },
      });

      return sendSuccess(res, { property }, 201);
    } catch (error) {
      next(error);
    }
  }
);

// List properties with filters and pagination
router.get(
  '/',
  validate(listPropertiesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';
      const status = req.query.status as string | undefined;
      const propertyType = req.query.propertyType as string | undefined;
      const listingType = req.query.listingType as string | undefined;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const city = req.query.city as string | undefined;
      const state = req.query.state as string | undefined;
      const zipCode = req.query.zipCode as string | undefined;
      const minBedrooms = req.query.minBedrooms ? parseInt(req.query.minBedrooms as string) : undefined;
      const maxBedrooms = req.query.maxBedrooms ? parseInt(req.query.maxBedrooms as string) : undefined;
      const minBathrooms = req.query.minBathrooms ? parseFloat(req.query.minBathrooms as string) : undefined;
      const maxBathrooms = req.query.maxBathrooms ? parseFloat(req.query.maxBathrooms as string) : undefined;
      const minSquareFeet = req.query.minSquareFeet ? parseInt(req.query.minSquareFeet as string) : undefined;
      const maxSquareFeet = req.query.maxSquareFeet ? parseInt(req.query.maxSquareFeet as string) : undefined;
      const search = req.query.search as string | undefined;
      const ownerId = req.query.ownerId as string | undefined;

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      // Only show active properties to public, or all to owner
      if (ownerId) {
        where.ownerId = ownerId;
      } else {
        where.status = 'active';
      }

      // Apply filters
      if (status) where.status = status;
      if (propertyType) where.propertyType = propertyType;
      if (listingType) where.listingType = listingType;
      if (city) where.city = { contains: city, mode: 'insensitive' };
      if (state) where.state = { contains: state, mode: 'insensitive' };
      if (zipCode) where.zipCode = zipCode;

      // Price range
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = minPrice;
        if (maxPrice) where.price.lte = maxPrice;
      }

      // Bedrooms range
      if (minBedrooms !== undefined || maxBedrooms !== undefined) {
        where.bedrooms = {};
        if (minBedrooms !== undefined) where.bedrooms.gte = minBedrooms;
        if (maxBedrooms !== undefined) where.bedrooms.lte = maxBedrooms;
      }

      // Bathrooms range
      if (minBathrooms !== undefined || maxBathrooms !== undefined) {
        where.bathrooms = {};
        if (minBathrooms !== undefined) where.bathrooms.gte = minBathrooms;
        if (maxBathrooms !== undefined) where.bathrooms.lte = maxBathrooms;
      }

      // Square feet range
      if (minSquareFeet !== undefined || maxSquareFeet !== undefined) {
        where.squareFeet = {};
        if (minSquareFeet !== undefined) where.squareFeet.gte = minSquareFeet;
        if (maxSquareFeet !== undefined) where.squareFeet.lte = maxSquareFeet;
      }

      // Search
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { neighborhood: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await prisma.property.count({ where });

      // Get properties
      const properties = await prisma.property.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: { favorites: true },
          },
        },
      });

      return sendPaginated(res, properties, page, limit, total);
    } catch (error) {
      next(error);
    }
  }
);

// Get single property
router.get(
  '/:id',
  validate(getPropertySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          documents: true,
          _count: {
            select: { favorites: true },
          },
        },
      });

      if (!property) {
        throw Errors.notFound('Property');
      }

      // Increment view count
      await prisma.property.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      return sendSuccess(res, { property });
    } catch (error) {
      next(error);
    }
  }
);

// Update property
router.put(
  '/:id',
  authenticate,
  validate(updatePropertySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const data = req.body;

      // Check ownership
      const existing = await prisma.property.findUnique({
        where: { id },
        select: { ownerId: true, price: true, squareFeet: true },
      });

      if (!existing) {
        throw Errors.notFound('Property');
      }

      if (existing.ownerId !== userId) {
        throw Errors.forbidden('Not authorized to update this property');
      }

      // Recalculate price per sqft if price or squareFeet changed
      let pricePerSqFt = undefined;
      if (data.price !== undefined || data.squareFeet !== undefined) {
        const price = data.price ?? Number(existing.price);
        const sqft = data.squareFeet ?? existing.squareFeet;

        if (sqft) {
          pricePerSqFt = price / sqft;
        }
      }

      const property = await prisma.property.update({
        where: { id },
        data: {
          ...data,
          ...(pricePerSqFt !== undefined && { pricePerSqFt }),
        },
        include: {
          images: true,
        },
      });

      return sendSuccess(res, { property });
    } catch (error) {
      next(error);
    }
  }
);

// Delete property
router.delete(
  '/:id',
  authenticate,
  validate(getPropertySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;

      // Check ownership
      const property = await prisma.property.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!property) {
        throw Errors.notFound('Property');
      }

      if (property.ownerId !== userId) {
        throw Errors.forbidden('Not authorized to delete this property');
      }

      // Delete images from S3
      for (const image of property.images) {
        try {
          await deleteFromS3(image.url);
          if (image.thumbnailUrl) {
            await deleteFromS3(image.thumbnailUrl);
          }
        } catch (e) {
          console.error('Failed to delete image from S3:', e);
        }
      }

      // Delete property (cascades to images, documents, favorites)
      await prisma.property.delete({ where: { id } });

      return sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== PROPERTY IMAGES ====================

// Upload property image
router.post(
  '/:id/images',
  authenticate,
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const { caption, isPrimary } = req.body || {};

      if (!req.file) {
        throw Errors.badRequest('No image file provided');
      }

      // Check ownership
      const property = await prisma.property.findUnique({
        where: { id },
        select: { ownerId: true },
      });

      if (!property) {
        throw Errors.notFound('Property');
      }

      if (property.ownerId !== userId) {
        throw Errors.forbidden('Not authorized to upload images to this property');
      }

      // Upload to S3
      const key = `properties/${id}/${Date.now()}-${req.file.originalname}`;
      const url = await uploadToS3(req.file.buffer, key, req.file.mimetype);

      // Get current max order
      const maxOrder = await prisma.propertyImage.aggregate({
        where: { propertyId: id },
        _max: { order: true },
      });

      // If isPrimary, unset other primary images
      if (isPrimary === 'true' || isPrimary === true) {
        await prisma.propertyImage.updateMany({
          where: { propertyId: id, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Create image record
      const image = await prisma.propertyImage.create({
        data: {
          propertyId: id,
          url,
          caption,
          isPrimary: isPrimary === 'true' || isPrimary === true,
          order: (maxOrder._max?.order || 0) + 1,
        },
      });

      return sendSuccess(res, { image }, 201);
    } catch (error) {
      next(error);
    }
  }
);

// Delete property image
router.delete(
  '/:id/images/:imageId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const imageId = req.params.imageId as string;
      const userId = req.user!.id;

      // Check ownership
      const property = await prisma.property.findUnique({
        where: { id },
        select: { ownerId: true },
      });

      if (!property) {
        throw Errors.notFound('Property');
      }

      if (property.ownerId !== userId) {
        throw Errors.forbidden('Not authorized to delete images from this property');
      }

      const image = await prisma.propertyImage.findUnique({
        where: { id: imageId },
      });

      if (!image || image.propertyId !== id) {
        throw Errors.notFound('Image');
      }

      // Delete from S3
      try {
        await deleteFromS3(image.url);
        if (image.thumbnailUrl) {
          await deleteFromS3(image.thumbnailUrl);
        }
      } catch (e) {
        console.error('Failed to delete image from S3:', e);
      }

      // Delete record
      await prisma.propertyImage.delete({ where: { id: imageId } });

      return sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== PROPERTY DOCUMENTS ====================

// Multer config for document uploads (PDF, DOC, DOCX, images)
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
    }
  },
});

// Upload property document
router.post(
  '/:id/documents',
  authenticate,
  documentUpload.single('document'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const { name, type = 'other' } = req.body || {};

      if (!req.file) {
        throw Errors.badRequest('No document file provided');
      }

      // Check ownership
      const property = await prisma.property.findUnique({
        where: { id },
        select: { ownerId: true },
      });

      if (!property) {
        throw Errors.notFound('Property');
      }

      if (property.ownerId !== userId) {
        throw Errors.forbidden('Not authorized to upload documents to this property');
      }

      // Upload to S3
      const key = `properties/${id}/documents/${Date.now()}-${req.file.originalname}`;
      const url = await uploadToS3(req.file.buffer, key, req.file.mimetype);

      // Create document record
      const document = await prisma.propertyDocument.create({
        data: {
          propertyId: id,
          name: name || req.file.originalname,
          type,
          url,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedBy: userId,
        },
      });

      return sendSuccess(res, { document }, 201);
    } catch (error) {
      next(error);
    }
  }
);

// List property documents
router.get(
  '/:id/documents',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const property = await prisma.property.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!property) {
        throw Errors.notFound('Property');
      }

      const documents = await prisma.propertyDocument.findMany({
        where: { propertyId: id },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, { documents });
    } catch (error) {
      next(error);
    }
  }
);

// Delete property document
router.delete(
  '/:id/documents/:documentId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const documentId = req.params.documentId as string;
      const userId = req.user!.id;

      // Check ownership
      const property = await prisma.property.findUnique({
        where: { id },
        select: { ownerId: true },
      });

      if (!property) {
        throw Errors.notFound('Property');
      }

      if (property.ownerId !== userId) {
        throw Errors.forbidden('Not authorized to delete documents from this property');
      }

      const document = await prisma.propertyDocument.findUnique({
        where: { id: documentId },
      });

      if (!document || document.propertyId !== id) {
        throw Errors.notFound('Document');
      }

      // Delete from S3
      try {
        await deleteFromS3(document.url);
      } catch (e) {
        console.error('Failed to delete document from S3:', e);
      }

      // Delete record
      await prisma.propertyDocument.delete({ where: { id: documentId } });

      return sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== SAVED PROPERTIES (FAVORITES) ====================

// Save/favorite a property
router.post(
  '/:id/save',
  authenticate,
  validate(savePropertySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const { notes } = req.body || {};

      // Check property exists
      const property = await prisma.property.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!property) {
        throw Errors.notFound('Property');
      }

      // Check if already saved
      const existing = await prisma.savedProperty.findUnique({
        where: { userId_propertyId: { userId, propertyId: id } },
      });

      if (existing) {
        // Update notes if provided
        if (notes !== undefined) {
          await prisma.savedProperty.update({
            where: { id: existing.id },
            data: { notes },
          });
        }
        return sendSuccess(res, { saved: true });
      }

      // Save property
      await prisma.savedProperty.create({
        data: {
          userId,
          propertyId: id,
          notes,
        },
      });

      // Increment favorite count
      await prisma.property.update({
        where: { id },
        data: { favoriteCount: { increment: 1 } },
      });

      return sendSuccess(res, { saved: true }, 201);
    } catch (error) {
      next(error);
    }
  }
);

// Unsave/unfavorite a property
router.delete(
  '/:id/save',
  authenticate,
  validate(getPropertySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;

      const saved = await prisma.savedProperty.findUnique({
        where: { userId_propertyId: { userId, propertyId: id } },
      });

      if (!saved) {
        throw Errors.notFound('Property not in saved list');
      }

      await prisma.savedProperty.delete({
        where: { id: saved.id },
      });

      // Decrement favorite count
      await prisma.property.update({
        where: { id },
        data: { favoriteCount: { decrement: 1 } },
      });

      return sendSuccess(res, { saved: false });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's saved properties
router.get(
  '/saved/list',
  authenticate,
  validate(listSavedPropertiesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const total = await prisma.savedProperty.count({
        where: { userId },
      });

      const savedProperties = await prisma.savedProperty.findMany({
        where: { userId },
        orderBy: { savedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          property: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      });

      return sendPaginated(res, savedProperties, page, limit, total);
    } catch (error) {
      next(error);
    }
  }
);

// Check if property is saved
router.get(
  '/:id/saved',
  authenticate,
  validate(getPropertySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;

      const saved = await prisma.savedProperty.findUnique({
        where: { userId_propertyId: { userId, propertyId: id } },
      });

      return sendSuccess(res, { saved: !!saved, notes: saved?.notes });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's own properties
router.get(
  '/my/list',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const total = await prisma.property.count({
        where: { ownerId: userId },
      });

      const properties = await prisma.property.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: { favorites: true },
          },
        },
      });

      return sendPaginated(res, properties, page, limit, total);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
