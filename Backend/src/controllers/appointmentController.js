import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { requireFields } from '../utils/validate.js';

const VALID_STATUS = ['pending', 'confirmed', 'completed', 'cancelled'];

const SELECT_FULL = `
  SELECT a.*,
         u.name  AS customer_name,
         u.email AS customer_email,
         u.phone AS customer_phone,
         s.name  AS service_name,
         s.duration_minutes,
         s.price AS service_price,
         c.name  AS category_name
  FROM appointments a
  JOIN users u ON u.id = a.customer_id
  LEFT JOIN services s ON s.id = a.service_id
  LEFT JOIN categories c ON c.id = s.category_id
`;

// POST /api/appointments  (guest or logged-in customer)
export const createAppointment = asyncHandler(async (req, res) => {
  requireFields(req.body, ['service_id', 'appointment_date', 'appointment_time']);
  const { service_id, appointment_date, appointment_time, notes } = req.body;

  const svc = await query('SELECT * FROM services WHERE id = $1 AND is_active = TRUE', [service_id]);
  if (!svc.rowCount) throw ApiError.badRequest('Selected service is not available');
  const service = svc.rows[0];

  // Cannot book in the past
  const when = new Date(`${appointment_date}T${appointment_time}`);
  if (isNaN(when.getTime())) throw ApiError.badRequest('Invalid date or time');
  if (when.getTime() < Date.now()) {
    throw ApiError.badRequest('Appointments cannot be booked in the past');
  }

  // Resolve the customer: logged-in user, or a guest identified by email.
  let customerId;
  if (req.user) {
    customerId = req.user.id;
  } else {
    requireFields(req.body, ['guest_name', 'guest_email', 'guest_phone']);
    const name = String(req.body.guest_name).trim();
    const email = String(req.body.guest_email).trim().toLowerCase();
    const phone = String(req.body.guest_phone).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw ApiError.badRequest('Please provide a valid email address');
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount) {
      customerId = existing.rows[0].id;
      // Backfill a phone number if the account doesn't have one yet.
      await query(
        `UPDATE users SET phone = COALESCE(NULLIF(phone, ''), $1), updated_at = NOW() WHERE id = $2`,
        [phone, customerId]
      );
    } else {
      // Create a lightweight guest customer account (random, unusable password).
      const randomHash = await bcrypt.hash(`guest:${email}:${Date.now()}`, 10);
      const created = await query(
        `INSERT INTO users (name, email, password_hash, phone, role)
         VALUES ($1,$2,$3,$4,'customer') RETURNING id`,
        [name, email, randomHash, phone]
      );
      customerId = created.rows[0].id;
    }
  }

  const { rows } = await query(
    `INSERT INTO appointments
       (customer_id, service_id, appointment_date, appointment_time, notes, status, price_snapshot, service_name_snapshot)
     VALUES ($1,$2,$3,$4,$5,'pending',$6,$7)
     RETURNING *`,
    [customerId, service_id, appointment_date, appointment_time, notes || null, service.price, service.name]
  );
  res.status(201).json({ success: true, data: rows[0] });
});

// GET /api/appointments/mine  (customer)
export const myAppointments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = [req.user.id];
  let where = 'WHERE a.customer_id = $1';
  if (status && VALID_STATUS.includes(status)) {
    params.push(status);
    where += ` AND a.status = $${params.length}`;
  }
  const { rows } = await query(
    `${SELECT_FULL} ${where} ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    params
  );
  res.json({ success: true, count: rows.length, data: rows });
});

// PUT /api/appointments/:id/cancel  (customer cancels own)
export const cancelMyAppointment = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM appointments WHERE id = $1 AND customer_id = $2',
    [req.params.id, req.user.id]
  );
  const appt = rows[0];
  if (!appt) throw ApiError.notFound('Appointment not found');
  if (['completed', 'cancelled'].includes(appt.status)) {
    throw ApiError.badRequest(`Cannot cancel a ${appt.status} appointment`);
  }
  const updated = await query(
    `UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  res.json({ success: true, data: updated.rows[0] });
});

// PUT /api/appointments/:id/reschedule  (customer requests a new slot)
export const requestReschedule = asyncHandler(async (req, res) => {
  requireFields(req.body, ['appointment_date', 'appointment_time']);
  const { appointment_date, appointment_time } = req.body;

  const { rows } = await query(
    'SELECT * FROM appointments WHERE id = $1 AND customer_id = $2',
    [req.params.id, req.user.id]
  );
  const appt = rows[0];
  if (!appt) throw ApiError.notFound('Appointment not found');
  if (['completed', 'cancelled'].includes(appt.status)) {
    throw ApiError.badRequest(`Cannot reschedule a ${appt.status} appointment`);
  }

  const when = new Date(`${appointment_date}T${appointment_time}`);
  if (isNaN(when.getTime())) throw ApiError.badRequest('Invalid date or time');
  if (when.getTime() < Date.now()) throw ApiError.badRequest('The new time cannot be in the past');

  const updated = await query(
    `UPDATE appointments SET reschedule_date = $1, reschedule_time = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [appointment_date, appointment_time, req.params.id]
  );
  res.json({ success: true, data: updated.rows[0] });
});

// PUT /api/appointments/:id/reschedule/approve  (admin) — apply requested slot
export const approveReschedule = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
  const appt = rows[0];
  if (!appt) throw ApiError.notFound('Appointment not found');
  if (!appt.reschedule_date) throw ApiError.badRequest('No reschedule request to approve');

  const updated = await query(
    `UPDATE appointments SET
       appointment_date = reschedule_date,
       appointment_time = reschedule_time,
       reschedule_date = NULL,
       reschedule_time = NULL,
       status = 'confirmed',
       updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  res.json({ success: true, data: updated.rows[0] });
});

// PUT /api/appointments/:id/reschedule/reject  (admin) — keep original slot
export const rejectReschedule = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
  const appt = rows[0];
  if (!appt) throw ApiError.notFound('Appointment not found');
  if (!appt.reschedule_date) throw ApiError.badRequest('No reschedule request to reject');

  const updated = await query(
    `UPDATE appointments SET reschedule_date = NULL, reschedule_time = NULL, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  res.json({ success: true, data: updated.rows[0] });
});

// ---------- Admin ----------

// GET /api/appointments  (admin) ?status=&search=&date=
export const listAppointments = asyncHandler(async (req, res) => {
  const { status, search, date } = req.query;
  const params = [];
  const where = [];
  if (status && VALID_STATUS.includes(status)) {
    params.push(status);
    where.push(`a.status = $${params.length}`);
  }
  if (date) {
    params.push(date);
    where.push(`a.appointment_date = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR s.name ILIKE $${params.length})`);
  }
  const sql = `${SELECT_FULL}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
  const { rows } = await query(sql, params);
  res.json({ success: true, count: rows.length, data: rows });
});

// PUT /api/appointments/:id/status  (admin)
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUS.includes(status)) {
    throw ApiError.badRequest(`Status must be one of: ${VALID_STATUS.join(', ')}`);
  }
  const { rows } = await query(
    `UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  if (!rows[0]) throw ApiError.notFound('Appointment not found');
  res.json({ success: true, data: rows[0] });
});

// GET /api/appointments/:id  (admin)
export const getAppointment = asyncHandler(async (req, res) => {
  const { rows } = await query(`${SELECT_FULL} WHERE a.id = $1`, [req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Appointment not found');
  res.json({ success: true, data: rows[0] });
});
