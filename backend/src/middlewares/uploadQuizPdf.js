import multer from "multer";

const uploadQuizPdf = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      String(file.originalname || "").toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      const error = new Error("Only PDF files are supported for import.");
      error.statusCode = 400;
      return cb(error);
    }

    cb(null, true);
  },
});

export default uploadQuizPdf;
