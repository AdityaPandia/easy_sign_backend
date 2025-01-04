const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract the token from the Authorization header

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        req.user = { id: decoded.id }; // Attach user ID to the request object
        next(); // Proceed to the next middleware or route
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};

module.exports = authenticateUser;
