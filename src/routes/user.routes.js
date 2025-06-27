const Router = require("router");
const { registerUser, loginUser } = require("../controllers/user.controllers");
const { upload } = require("../middleware/multer.middleware");

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

module.exports = { router };
