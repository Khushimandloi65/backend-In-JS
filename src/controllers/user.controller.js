import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler ( async (req, res) => {
   
    // 1. get user details from frontend 
    // 2. validation - not empty 
    // 3. check if user already exists: username, email
    // 4. check for images , check for avatar 
    // 5. upload them to cloudinary , avatar 
    // 6. create user object - create entry in db 
    // 7. remove password and refresh token field from response 
    // 8. check for user creation 
    // 9. return response 

    // 1. taking user data 
    
    // console.log("req.body: ", req.body);

    const {fullName , email , username , password } = req.body
    
    // console.log("email: ", email);

    // 2. validations

    // if (fullname === ""){
    //     throw new ApiError(400,"fullname is required")
    // }

    // checking are fields empty 

    if (
        [fullName , email , username , password].some((field)=>field?.trim()==="")
    ){
         throw new ApiError(400,"All fields are required")
    }

    // 3. checking if user already exists

    const existedUser = await User.findOne({
    $or : [ { username } , { email } ]
    })

    if (existedUser){
        throw new ApiError(409,"user with username or email already exists")
    }

    // 4. check for images

    // console.log("req.files: ", req.files);
   
    const avatarLocalPath = req.files?.avatar[0]?.path;
     if (!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;              // check for coverimage
    }

    // check for avatar
   

    // 5. upload on cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //check for avatar
    
    if(!avatar){
         throw new ApiError(400,"avatar file is required")
    }

    // 6. create user object

    const user = await User.create({
        fullName , 
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // 7 check for user creation and removing password and refresh token field

    const createdUser = await User.findById(user._id).select(" -refreshToken");

    // 8 check for user creation

    if (!createdUser){
        throw new ApiError (500,"Something went wrong while registering user")
    }

    // 9 .return response

    return res.status(201).json (
        new ApiResponse (200, createdUser, "User registered Successfully")
    )





});

const generateAccessAndRefreshToken = async ( userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500,"something went wrong while generating refresh and access tokens");
    }
}

const loginUser = asyncHandler ( async (req, res) => {
    // req.body -> data
    // username or email 
    // find user
    //password check
    //access and refresh token 
    //send cookies 


    // get the data from user 

    const {email , username , password} = req.body

    // check username and email

    if (!username && !email){
        throw new ApiError(400,"username or email is required")
    }

    // find user 
    
    const user = await User.findOne({
        $or : [{username},{email}]
        })

    // check is user exist

    if (!user){
        throw new ApiError(404,"user does not exist")
    }

    // check is password correct 

    const isPasswordValid = await user.isPasswordCorrect(password)

    
    if (!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    //generate access and refresh token 

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    // removing refresh token and password 

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )


})

const logoutUser = asyncHandler ( async(req,res) => {``

     await User.findByIdAndUpdate(
      req.user._id, 
        {
            $set: {
                refreshToken : null
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly:true,
        secure:true
    }

   console.log

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))


})

const refreshAccessToken = asyncHandler(async(req,res)=>{

   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Access")
    }

   try {
     const decodeToken = jwt.verify(
         incomingRefreshToken, 
         process.env.REFRESH_TOKEN_SECRET
     )
 
     const user = await User.findById(decodeToken?._id)
 
      if (!user){
         throw new ApiError(401,"Invalid Refresh Token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw ApiError(401,"Refresh Token is expires or used")
     }
 
     const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
     const options ={
         httpOnly:true,
         secure:true
     }
 
     return res
     .status(200)
     .cookie("refreshToken", newRefreshToken, options)
     .cookie("accessToken", accessToken, options)
     .json(
         new ApiResponse(200,{accessToken,newRefreshToken},"Access token refreshed successfully")
     )
 
   } catch (error) {
        throw new ApiError(401,error.message || "Invalid Refresh Token")
   }



    
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};