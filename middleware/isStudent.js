// middleware/isStudent.js
const isStudent = (req, res, next) => {
    if (!req.user || req.user.role !== 'estudiante') {
      return res.status(403).json({ error: 'Acceso denegado: solo para estudiantes' });
    }
    next();
  };
  
  export default isStudent;
  