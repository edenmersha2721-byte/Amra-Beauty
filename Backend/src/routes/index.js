import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import subcategoryRoutes from './subcategory.routes.js';
import serviceRoutes from './service.routes.js';
import appointmentRoutes from './appointment.routes.js';
import customerRoutes from './customer.routes.js';
import galleryRoutes from './gallery.routes.js';
import promotionRoutes from './promotion.routes.js';
import reviewRoutes from './review.routes.js';
import contactRoutes from './contact.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/services', serviceRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/customers', customerRoutes);
router.use('/gallery', galleryRoutes);
router.use('/promotions', promotionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/contact', contactRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/upload', uploadRoutes);

export default router;
