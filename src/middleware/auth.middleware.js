const jwt = require("jwt");
const { User } = require("../models/user.models");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asycHandler");
const { ApiResponse } = require("../utils/ApiResponse");

const verifyJwt = asyncHandler(async (req, _, next) => {
  const token = req.cookies.accessToken;

  if (!token) throw new ApiError(400, "Unauthorized");

  try {
    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decode?._id).select(
      "-password -refreshToken"
    );
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(400, "decoding jwt error");
  }
});

module.exports = { verifyJwt };
