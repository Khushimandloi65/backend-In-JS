import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// get token from user 

export const verifyJWT = asyncHandler(async(req,_,next)=>{

  try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
      
      // check for token 
      
        if (!token){
          throw new ApiError(401, "Unauthorized request")
        }
      
      // verify is token is real and taking payload from token 
      
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      
      // find the user and save the user data in user
      
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")
      
      //check for user
      
      if (!user){
          throw new ApiError(401, "inavlid Access Token")
      }
      
      req.user = user;
      next()
      
  } catch (error) {
      throw new ApiError(401, error?.message || "invalid access token")
  }
})