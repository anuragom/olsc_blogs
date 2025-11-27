import { Request, Response, NextFunction } from "express";

export const notFound = (_req:Request,res:Response,_next:NextFunction) =>{
    res.status(404).json({message:"Resource Not Found"});
}

export const errorHandler = (err:any,_req:Request,res:Response,_next:NextFunction)=>{
    const status = err.status || 500;
    const message = err.message;
    res.status(status).json({message});
}
