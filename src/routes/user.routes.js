const Router = require("router");
const { registerUser } = require("../controllers/user.controllers");
const { upload } = require("../middleware/multer.middleware");

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

module.exports = { router };
