export const notFound = (req, res, next) => {
  console.log('❌ Route non trouvée:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path
  });
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};


const errorHandler = (err,req,res,next)=>{
  const statusCode = res.statusCode == 200? 500:res.statusCode;
  res.status(statusCode);
  res.json({message:err?.message,
    stack:err?.stack
  
  })
}

export default {notFound,errorHandler}