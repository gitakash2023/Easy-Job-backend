import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
});

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
