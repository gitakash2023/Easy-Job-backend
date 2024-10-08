import { Router } from 'express';
import { login ,createAdmin} from '../controllers/adminAuthentication.js';
import verifyAuthToken from '../middileware/JwtVerify.js';
const adminAuthRouter = Router();
adminAuthRouter.post("/login",login)
adminAuthRouter.post("/create-admin",createAdmin)
export default adminAuthRouter;