import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary.js";

const quizStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "orbitoncx/quizzes",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const uploadQuiz = multer({
  storage: quizStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
});

export default uploadQuiz;