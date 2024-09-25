// Importar las bibliotecas necesarias
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const { API_KEY_GEMINI } = process.env;

// Función para iniciar el chat con el modelo Gemini sin historial predefinido
async function iniciarChatConGemini() {
    try {
        // Crear una instancia del modelo generativo de Google
        const genAI = new GoogleGenerativeAI(API_KEY_GEMINI);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Iniciar el chat sin historial predefinido
        const chat = model.startChat({
            history: [] // No hay historial predefinido
        });
       

        return chat; // Retornar el objeto chat para su uso
    } catch (error) {
        console.error("Error al iniciar el chat con Gemini:", error);
        throw error; // Lanzar el error para manejarlo externamente si es necesario
    }
}

// Función para enviar un mensaje al modelo y obtener una respuesta
async function sendMessageToGemini(chat, userMessage) {
    try {
        // Enviar el mensaje al chat y esperar la respuesta
        let result = await chat.sendMessage(userMessage);
        console.log(result.response.text()); // Imprimir la respuesta del modelo en la consola
        return result.response.text(); // Devolver la respuesta del modelo
    } catch (error) {
        console.error("Error al enviar el mensaje a Gemini:", error);
        throw error; // Lanzar el error para manejarlo externamente
    }
}

module.exports = { sendMessageToGemini, iniciarChatConGemini };
