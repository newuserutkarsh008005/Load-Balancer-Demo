import express from "express"
import  dotenv  from "dotenv"
dotenv.config()
const app=express()
app.use(express.json())
const PORT=process.env.PORT_S1
const api=`/s1${process.env.BASE_URL_API}`
console.log(PORT)
app.get(`${api}`,(req,res)=>{
    res.status(200).json({
        "message":"Server-1"
    })
})
app.get("/s1/req/user/check/slow", async (req, res) => {
    console.log("SERVER 1: SLOW REQUEST STARTED");

    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log("SERVER 1: SLOW REQUEST FINISHED");

    res.status(200).json({
        message: "Slow response completed"
    });
});
app.get(`${api}/get`,(req,res)=>{
    res.status(200).json({
        "message":"Server-1 userdet"
    })
})
app.post(`${api}`,(req,res)=>{
    return res.status(201).json({
        "message":"Created by Server-1",
        "data":req.body
    })
})
app.put(`${api}`,(req,res)=>{
    return res.status(200).json({
        "message":"Updated by Server-1",
        "data":req.body
    })
})
app.patch(`${api}`,(req,res)=>{
    return res.status(200).json({
        "message":"Patched by Server-1",
        "data":req.body
    })
})
app.delete(`${api}`,(req,res)=>{
    return res.status(200).json({
        "message":"Deleted by Server-1"
    })
})
app.get(`${api}/health`,(req,res)=>{
    return res.status(200).json({
        "message":"Healthy Server-1"
    })
})

app.listen(PORT,()=>{
    console.log(`Server is Runnign on Port ${PORT} and on http://localhost:${PORT}${api}` )
})
