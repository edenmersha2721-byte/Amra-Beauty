import { Router } from 'express';
import {
  listSubcategories,
  createSubcategory,
  deleteSubcategory,
} from '../controllers/subcategoryController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listSubcategories);
router.post('/', protect, requireAdmin, createSubcategory);
router.delete('/:id', protect, requireAdmin, deleteSubcategory);

export default router;
