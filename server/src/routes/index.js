import { Router } from 'express'
import healthRoutes from './healthRoutes.js'

/** Mounted at /api. Resource routers are added here as each phase lands. */
const router = Router()

router.use('/health', healthRoutes)

export default router
