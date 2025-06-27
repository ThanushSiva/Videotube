const Router = require("router");
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  updateAccountDetails,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
} = require("../controllers/user.controllers");
const { verifyJwt } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/multer.middleware");

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/logout").post(verifyJwt, logoutUser);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/update-account-details").post(verifyJwt, updateAccountDetails);
router.route("/get-user").post(verifyJwt, getCurrentUser);
router.route("/update-avatar").post(verifyJwt, updateUserAvatar);
router.route("/update-cover").post(verifyJwt, updateUserCoverImage);

router.route("/login").post(loginUser);

module.exports = { router };
