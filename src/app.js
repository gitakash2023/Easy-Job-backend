import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import db from './config/dbConfig.js';
import fileUpload from 'express-fileupload';
import userRouter from './router/authenticationRouter.js';
import jobRouter from './router/jobRouter.js';
import adminAuthRouter from './router/adminAuthenticationRouter.js';
import reportJobRouter from './router/reportJobRouter.js';
import messageRouter from './router/messageRoutes.js';
import bannerRouter from './router/bannerRouter.js';
const app = express();
app.use(fileUpload());
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});
app.use("/images",express.static("uploads"))
app.get('/images/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const imageUrl = `/images/${fileName}`;
  res.redirect(imageUrl);
});
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/api", userRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/job", jobRouter);
app.use('/api/message',messageRouter);
app.use("/api/report",reportJobRouter);
app.use("/api/banner",bannerRouter);
app.use((err,res) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
