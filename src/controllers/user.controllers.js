const { asyncHandler } = require("../utils/asycHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { User } = require("../models/user.models");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const jwt = require("jwt");

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ ValidateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("error creating access and refresh token", error);
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new ApiError(400, "body is empty");
  }

  const { username, email, password } = req.body;

  if (!email || !password || !username) {
    throw new ApiError(400, "fields cannot be empty");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  console.log(user.username);

  if (!user) {
    throw new ApiError(400, "user not found");
  }

  try {
    const passwordCheck = await user.isPasswordCorrect(password);
    if (!passwordCheck) {
      throw new ApiError(400, "Incorrect password");
    }
  } catch (error) {
    throw new ApiError(500, "Password verification failed", error);
  }

  console.log(user._id);

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(400, "user not logged in");
  }

  const option = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(new ApiResponse(200, loggedInUser, "user logged in successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = eq.cookie.refreshToken;

  if (!incomingRefreshToken)
    throw new ApiError(400, "refresh token is requred");

  try {
    const decodeToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = User.findById(decodeToken?.id);
    if (!user) throw new ApiError(400, "Invalid refresh token");
    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(400, "Invalid refresh token");
    const option = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, "refresh token creation error");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: {
        refreshToken: "",
      },
    },
    { new: true }
  );

  const option = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie(accessToken, option)
    .clearCookie(refreshToken, option)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) throw new ApiError(400, "incorrect old password");

  user.password = newPassword;

  await user.save({ ValidateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user details"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email)
    throw new ApiError(400, "email and fullname is required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user details updated"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.path;

  if (!avatarLocalPath) throw new ApiError(400, "avatar file missing");

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) throw new ApiError(400, "avatar url missing");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, user, "avatar updated"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.files?.path;

  if (!coverLocalPath) throw new ApiError(400, "cover file missing");

  const cover = await uploadOnCloudinary(coverLocalPath);

  if (!cover) throw new ApiError(400, "avatar url missing");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: cover,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, user, "cover updated"));
});

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  updateAccountDetails,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
};
