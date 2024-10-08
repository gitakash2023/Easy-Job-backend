import { Router } from 'express';
import verifyAuthToken from '../middileware/JwtVerify.js';
import { createReport ,getReportJob,deleteReportJobs} from '../controllers/ReportController.js';
const reportJobRouter = Router();
reportJobRouter.post("/report-job",verifyAuthToken,createReport)
reportJobRouter.get("/get-report-job",getReportJob)
reportJobRouter.delete("/delete-report-job",deleteReportJobs)
export default reportJobRouter;