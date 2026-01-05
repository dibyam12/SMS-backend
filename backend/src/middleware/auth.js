import jwt from 'jsonwebtoken';

const authMiddleware = (req,res,next)=>{
    // Get token from request header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if token exists
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded_access = jwt.verify(token, process.env.JWT_SECRET_ACCESS);

        // Add user from payload to request object
        req.user = decoded_access;
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }


}


const generateToken = (userId,time,type) => {
    const secret = type === 'access' ? process.env.JWT_SECRET_ACCESS : process.env.JWT_SECRET_REFRESH;
    return jwt.sign({ userId }, secret, { expiresIn: time });
};

export { authMiddleware, generateToken };
