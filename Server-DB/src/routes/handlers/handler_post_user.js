// Importo los modelos desde db.js
const { User } = require('../../db.js');

module.exports = async (req, res) => {
    try {
        // Extrayendo los datos del cuerpo de la solicitud
        const { name, phone,password } = req.body;

        // Verifica si se proporcionaron los datos requeridos
        if (!name || !phone || !password) {
            return res.status(400).json({
                status: false,
                value: null,
                error: 'Nombre y número de teléfono son requeridos'
            });
        }

        // Intentar crear el nuevo usuario en la base de datos
        const newUser = await User.create({ 
        name, 
        phone: parseInt(phone, 10), // Parsear el número de teléfono a entero,
        password });

        // Envía una respuesta con la información del usuario creado
        return res.status(201).json({
            status: true,
            value: newUser
        });
    } catch (error) {
        // Manejo de errores (por ejemplo, si el usuario ya existe)
        console.error('Error al crear el usuario:', error);
        
        // Si el error es por una clave primaria duplicada (usuario ya existe)
        if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
            return res.status(409).json({
                status: false,
                value: null,
                error: 'Ya existe un usuario con ese número de teléfono'
            });
        }

        // Otros errores
        return res.status(500).json({
            status: false,
            value: null,
            error: 'Error interno del servidor'
        });
    }
};
