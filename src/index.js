// require('dotenv').config({path: './env'})

import dotenv from 'dotenv';
import express from "express";
import connectDB from "./db/index.js";

dotenv.config({
  path: '/.env'
})

connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000 , () => {
    console.log(`Server is running at port: ${process.env.PORT}`)
  })
  app.on("error",(error)=>{
    console.log("Server error: ", error);
  })
})
.catch((err)=>{
    console.log("MINGO db connection failed !!! ", err);
})