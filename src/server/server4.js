import express from "express"
import  dotenv  from "dotenv"
dotenv.config()
const app=express()
app.use(express.json())
const PORT=process.env.PORT_S4
const api=`/s4${process.env.BASE_URL_API}`
console.log(PORT)
app.get(`/s4${api}`,(req,res)=>{
    res.status(200).json({
        "message":"Server-4"
    })
})
app.get(`${api}/user/det`,(req,res)=>{
    res.status(200).json({
        "message":"Server-4 userdet"
    })
})
app.post(`${api}`,(req,res)=>{
    return res.status(201).json({
        "message":"Created by Server-4",
        "data":req.body
    })
})
app.put(`${api}`,(req,res)=>{
    return res.status(200).json({
        "message":"Updated by Server-4",
        "data":req.body
    })
})
app.patch(`${api}`,(req,res)=>{
    return res.status(200).json({
        "message":"Patched by Server-4",
        "data":req.body
    })
})
app.delete(`${api}`,(req,res)=>{
    return res.status(200).json({
        "message":"Deleted by Server-4"
    })
})
app.get(`${api}/health`,(req,res)=>{
    return res.status(200).json({
        "message":"Healthy Server-4"
    })
})
app.listen(PORT,()=>{
    console.log(`Server is Runnign on Port ${PORT} and on http://localhost:${PORT}${api}` )
})
