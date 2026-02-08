import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";


// get token from user 

export const verifyJWT = asyncHandler(async(req,_,next)=>{

  try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
      
        console.log("token from user", token)

      // check for token 
      
        if (!token){
          throw new ApiError(401, "Unauthorized request")
        }
      
      // verify is token is real and taking payload from token 
      
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        console.log("decodeToken: ", decodeToken);
      
      // find the user and save the user data in user
      
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")

        console.log("user from verifyJWT: ", user);
      
      //check for user
      
      if (!user){
          throw new ApiError(401, "invalid Access Token")
      }
      
      req.user = user;
      next()
      
  } catch (error) {
      throw new ApiError(401, error?.message || "invalid access token")
  }
})