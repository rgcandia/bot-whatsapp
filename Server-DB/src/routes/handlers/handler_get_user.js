// Importo los modelos desde db.js
const { User } = require('../../db.js');

module.exports = async (req, res) => {
    try {
       const phoneString = req.query.phone; // Suponiendo que es una cadena
       const phone = parseInt(phoneString, 10); // Convierte a un entero decimal
        // Verifica si se proporcionó el número de teléfono
        if (!phone) {
            return res.status(400).json({
                status: false,
                value: null,
                error: 'Número de teléfono es requerido'
            });
        }

        // Busca el usuario en la base de datos
        const user = await User.findOne({ where: { phone: phone } });

        // Verifica si el usuario fue encontrado
        if (!user) {
            return res.status(404).json({
                status: false,
                value: null,
                error: 'Usuario no encontrado'
            });
        }

        // Envía una respuesta con la información del usuario encontrado
        return res.json({
            status: true,
            value: user
        });
    } catch (error) {
        // Manejo de errores
        console.error('Error al buscar el usuario:', error);
        return res.status(500).json({
            status: false,
            value: null,
            error: 'Error interno del servidor'
        });
    }
};
