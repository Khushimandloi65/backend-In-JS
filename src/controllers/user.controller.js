import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req, res) => {
   
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
    
    const {fullname , email , username , password } = req.body
    console.log("email: ", email);

    // 2. validations

    // if (fullname === ""){
    //     throw new ApiError(400,"fullname is required")
    // }

    // checking are fields empty 

    if (
        [fullname , email , username , password].some((field)=>field?.trim()==="")
    ){
         throw new ApiError(400,"All fields are required")
    }

    // 3. checking if user already exists

    const existedUser = User.findOne({
    $or : [ { username } , { error } ]
    })

    if (existedUser){
        throw new ApiError(409,"user with username or email already exists")
    }

    // 4. check for images

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // check for avatar
    if (!avatarLocalPath){
        throw new ApiError(400,"avatar file is required")
    }

    // 5. upload on cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //check for avatar
    
    if(!avatar){
         throw new ApiError(400,"avatar file is required")
    }

    // 6. create user object

    const user = await User.create({
        fullname , 
        avatar : avatar.url,
        coverimage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // 7 check for user creation and removing password and refresh token field

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    // 8 check for user creation

    if (!createdUser){
        throw new ApiError (500,"Something went wrong while registering user")
    }

    // 9 .return response

    return res.status(201).json (
        new ApiResponse (200, createdUser, "User registered Successfully")
    )


});




export {registerUser};