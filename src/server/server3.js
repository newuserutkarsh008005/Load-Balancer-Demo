import express from "express"
import  dotenv  from "dotenv"
dotenv.config()
const app=express()
app.use(express.json())
const PORT=process.env.PORT_S3
const api=`/s3${process.env.BASE_URL_API}`
console.log(PORT)
app.get(`/s3${api}`,(req,res)=>{
    res.status(200).json({
        "message":"Server-3"
    })
})
app.get(`${api}/user/det`,(req,res)=>{
    res.status(200).json({
        "message":"Server-3 userdet"
    })
})
app.post(`${api}`,(req,res)=>{
    return res.status(201).json({
        "message":"Created by Server-3",
        "data":req.body
    })
})
app.put(`${api}`,(req,res)=>{
    return res.status(200).json({
        "message":"Updated by Server-3",
        "data":req.body
    })
})
app.patch(`${api}`,(req,res)=>{
    return res.status(200).json({
        "message":"Patched by Server-3",
        "data":req.body
    })
})
app.delete(`${api}`,(req,res)=>{
    return res.status(200).json({
        "message":"Deleted by Server-3"
    })
})
app.get(`${api}/health`,(req,res)=>{
    return res.status(200).json({
        "message":"Healthy Server-3"
    })
})
app.listen(PORT,()=>{
    console.log(`Server is Runnign on Port ${PORT} and on http://localhost:${PORT}${api}` )
})
