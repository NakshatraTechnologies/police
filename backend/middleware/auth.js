export default function auth(req, res, next) {
    // Placeholder auth middleware
    // In a real app, verify JWT here
    console.log("Auth middleware executed");
    next();
}
