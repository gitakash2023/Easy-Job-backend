import { Router } from "express";
import { addBanner,getBanner,editBanner,deleteBanner } from "../controllers/BannerController.js";
const bannerRouter =  Router();
bannerRouter.post("/",addBanner);
bannerRouter.get("/get-banner",getBanner);
bannerRouter.put("/edit-banner",editBanner);
bannerRouter.delete("/delete-banner",deleteBanner);
export default bannerRouter;