const { asyncHandler } = require("../utils/asycHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { User } = require("../models/user.models");
const { uploadOnCloudinary } = require("../utils/cloudinary");

const registerUser = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new ApiError(400, "missing body");
  }

  const { fullname, email, username, password } = req.body;

  if (fullname?.trim() === "") {
    throw new ApiError(400, "all fields are required");
  }

  const userExist = await User.findOne({ $or: [{ username, email }] });

  if (userExist) {
    throw new ApiError(401, "user already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath || !coverLocalPath) {
    throw new ApiError(402, "avatar is missing");
  }

  console.log(avatarLocalPath, coverLocalPath);

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const cover = await uploadOnCloudinary(coverLocalPath);

  const user = await User.create({
    fullname,
    avatar,
    coverImage: cover || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(403, "user not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "user registered"));
});

module.exports = { registerUser };
