import { Router } from 'express';
import  upload  from '../middleware/upload.js';
import { protect } from '../middleware/authMiddleware.js';
import Service from '../Controllers/Service.js';

const router = Router();

// Route publique
router.get('/public', Service.getPublicServices);
router.post('/request', protect, Service.serviceRequest);

// Routes protégées nécessitant une authentification
router.get('/get-all', protect, Service.getServices);
router.post('/create', protect, upload.array('images'), Service.createService);
router.get('/:serviceId', protect, Service.getServiceById);
router.put('/update/:serviceId', protect, upload.array('images'), Service.updateService);
router.delete('/:serviceId', protect, Service.deleteService);

export default router;
