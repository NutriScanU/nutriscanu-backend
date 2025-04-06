const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: solo para administradores' });
    }
  
    next();
  };
  
  export default isAdmin;
  