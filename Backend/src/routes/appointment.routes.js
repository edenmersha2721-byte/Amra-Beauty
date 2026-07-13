import { Router } from 'express';
import {
  createAppointment,
  myAppointments,
  cancelMyAppointment,
  requestReschedule,
  approveReschedule,
  rejectReschedule,
  listAppointments,
  updateAppointmentStatus,
  getAppointment,
} from '../controllers/appointmentController.js';
import { protect, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Booking — open to guests and logged-in customers
router.post('/', optionalAuth, createAppointment);

// Customer
router.get('/mine', protect, myAppointments);
router.put('/:id/cancel', protect, cancelMyAppointment);
router.put('/:id/reschedule', protect, requestReschedule);

// Admin
router.get('/', protect, requireAdmin, listAppointments);
router.get('/:id', protect, requireAdmin, getAppointment);
router.put('/:id/status', protect, requireAdmin, updateAppointmentStatus);
router.put('/:id/reschedule/approve', protect, requireAdmin, approveReschedule);
router.put('/:id/reschedule/reject', protect, requireAdmin, rejectReschedule);

export default router;
