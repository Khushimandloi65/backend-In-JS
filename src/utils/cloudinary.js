import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINIARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        
        //upload the file on cloudinary
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        
        // file has been uploaded successfull
        // console.log("file is uploaded on cloudinary ", response.url);

        fs.unlinkSync(localFilePath) // jb file succfully iupload ho chuki h cloudinary pr to local server ki temporary stored file ko delete kr do
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary};