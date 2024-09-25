const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
require('dotenv').config();
const { URL_SERVER ,URL_SERVER_PHONE} = process.env;
const {sendMessageToGemini,iniciarChatConGemini} = require('./geminiClient.js');
// Flow Registro
const flowRegistro = addKeyword(EVENTS.ACTION)
 // No se activa por una palabra clave directa
    .addAnswer('Tu número no está registrado.')
    .addAnswer('¿Deseas registrarte? Escribe SI o NO.',{ capture: true })
    .addAction(async (ctx, { gotoFlow, endFlow }) => {
        const respuesta = ctx.body.toLowerCase();
        if (respuesta === 'si') {
            // Código para registrar al usuario (si es necesario)
            console.log('El usuario ha decidido registrarse.');
            return gotoFlow(flowRegistroSuccess);
            // ... (aquí realizarías las acciones de registro)
         } else if (respuesta === 'no') {
            return gotoFlow(flowExit); // Redirigir al flow Exit
        } else {
            // Manejar respuestas inválidas
            return gotoFlow(flowInvalidResponse);
        }
    });
//Invalid Response
const flowInvalidResponse = addKeyword(EVENTS.ACTION)
    .addAnswer('Respuesta no válida. Por favor, responde SI o NO.')
    .addAnswer('¿Deseas registrarte? Escribe SI o NO.', { capture: true })
    .addAction(async (ctx, { gotoFlow }) => {
        const respuesta = ctx.body.toLowerCase();
        if (respuesta === 'si') {
            console.log('El usuario ha decidido registrarse.');
            return gotoFlow(flowRegistroSuccess);
            // Aquí realizarías las acciones de registro...

        } else if (respuesta === 'no') {
            return gotoFlow(flowExit); // Redirigir al flow Exit
        } else {
            return gotoFlow(flowInvalidResponse); // Continuar repitiendo la pregunta
        }
    });
    
    
// Flow Registro Success
const flowRegistroSuccess = addKeyword(EVENTS.ACTION)
    .addAnswer(
        'Ingresa tu nombre:', 
        { capture: true },
        async (ctx, { flowDynamic, state}) => {
            // Almacenar el nombre ingresado en el estado
            await state.update({ nombre: ctx.body });
            await flowDynamic('Gracias, tu nombre ha sido registrado.');
        }
    )
    .addAnswer(
        'Ahora, ingresa tu contraseña:', 
        { capture: true },
        async (ctx, { state }) => {
            // Almacenar la primera contraseña ingresada en el estado
            await state.update({ contraseña: ctx.body });
        }
    )
    .addAnswer(
        'Confirma tu contraseña:', 
        { capture: true },
        async (ctx, { flowDynamic, state,gotoFlow }) => {
            // Obtener el estado actual
            const myState = state.getMyState();

            // Verificar la confirmación de la contraseña
            if (ctx.body === myState.contraseña) {
                // Las contraseñas coinciden, proceder al registro
                const data = {
                    name: myState.nombre,
                    phone: ctx.from, // Usando ctx.from para obtener el número de teléfono
                    password: myState.contraseña,
                };

                try {
                    // Hacer una solicitud fetch de tipo POST
                    const response = await fetch(URL_SERVER, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });

                    // Manejar la respuesta de la API
                    if (response.ok) {
                        // Registro exitoso
                        await flowDynamic('¡Registro completado con éxito y datos enviados a la base de datos!');
                        return gotoFlow(flowLogin);//Se envia al Flow Home
                    } else {
                        // Error en el registro
                        const errorData = await response.json();
                        await flowDynamic(`Error al registrar: ${errorData.message || 'Error desconocido'}`);
                    }
                } catch (error) {
                    // Manejar errores de red o de servidor
                    await flowDynamic(`Error al conectar con el servidor: ${error.message}`);
                }

            } else {
                // Las contraseñas no coinciden, reiniciar el flujo
                await state.update({ nombre: null, contraseña: null });
                await flowDynamic('Las contraseñas no coinciden. Por favor, comienza de nuevo.');
                
                // Reiniciar el flujo pidiendo el nombre nuevamente
                await flowDynamic('Ingresa tu nombre:');
            }
        }
    );



// Flow Exit
const flowExit = addKeyword(EVENTS.ACTION)
 // No se activa por una palabra clave directa
    .addAnswer('¡Hasta Luego!');


// Flujo principal
const flowPrincipal = addKeyword(['boti'])
    .addAnswer(['Verificando número de teléfono...'])
    .addAction(async (ctx, { gotoFlow }) => {
        const numeroDeWhatsapp = ctx.from;
        console.log('Se conectó el número:', numeroDeWhatsapp);

        // Verificar en la base de datos si está registrado el número de teléfono
        try {
            const response = await fetch(`${URL_SERVER_PHONE}${numeroDeWhatsapp}`);
            const estaRegistrado = await response.json();

            if (estaRegistrado.status) {
                // Si el número está registrado, enviar al flujo Home
                return gotoFlow(flowLogin);
            } else {
                // Si el número no está registrado, enviar al flujo de Registro
                return gotoFlow(flowRegistro);
            }
        } catch (error) {
            console.error('Error al verificar el número de teléfono:', error);
            // Opcionalmente, podrías redirigir a un flujo de error o enviar un mensaje de error.
        }
    });
    
//FLOW Login
const flowLogin = addKeyword(EVENTS.ACTION)
    .addAnswer('Estoy buscando tu información...')
    .addAction(async (ctx, { flowDynamic, state,flowHome }) => {
        // Obtener el número de teléfono desde ctx.from
        const numeroDeWhatsapp = ctx.from;

        if (!numeroDeWhatsapp) {
            // Si no hay número de teléfono en ctx.from, informar al usuario
            await flowDynamic('No se encontró el número de teléfono. Por favor, proporciona tu número de teléfono primero.');
            return; // Asegurarse de salir de la función
        }

        try {
            // Realizar la solicitud a la API para buscar el usuario
            const response = await fetch(`${URL_SERVER_PHONE}${numeroDeWhatsapp}`);
            const data = await response.json();
            console.log('Datos de usuario registrado:', data);

            // Verificar si la solicitud fue exitosa y si el usuario está registrado
            if (data.status && data.value) {
                // Obtener el nombre y la contraseña del usuario del objeto `value`
                const nombreUsuario = data.value.name;
                const contraseñaUsuario = data.value.password;

                // Guardar nombre y contraseña en el estado
                await state.update({ nombreUsuario, contraseñaUsuario });
                // Enviar un saludo al usuario con su nombre
               await flowDynamic(`¡Hola, ${nombreUsuario}! Por favor, ingresa tu contraseña:`);
                
            
            } else {
                // El usuario no está registrado o ocurrió un error
                await flowDynamic('No se encontró ningún usuario registrado con ese número. Por favor, verifica e inténtalo de nuevo.');
            }
        } catch (error) {
            // Manejar cualquier error en la solicitud
            console.error('Error al buscar el usuario:', error);
            await flowDynamic('Hubo un problema al intentar acceder a la base de datos. Por favor, inténtalo más tarde.');
        }
    })
    .addAnswer(
        'Conectado...',
        { capture: true },
        async (ctx, { flowDynamic, state, gotoFlow }) => {
            // Obtener la contraseña ingresada por el usuario
            const contraseñaIngresada = ctx.body;

            // Obtener la contraseña almacenada en el estado
            const { contraseñaUsuario } = state.getMyState();

            // Validar la contraseña ingresada
            if (contraseñaIngresada === contraseñaUsuario) {
                // Contraseña correcta, ir al flujo flowHome
                await flowDynamic('¡Contraseña correcta!');
                return gotoFlow(flowHome);
            } else {
                // Contraseña incorrecta, informar y volver al flujo de inicio
                await flowDynamic('Contraseña incorrecta. Volviendo al inicio...');
                return gotoFlow(flowLogin);
            }
        }
    );

//FlowHome
const flowHome = addKeyword(EVENTS.ACTION)
	.addAnswer('¿En qué puedo ayudarte? ')
    .addAnswer('Escribe "salir" para terminar la conversación.', { capture: true }, async (ctx, { flowDynamic, fallBack }) => {
        // Crear una instancia del modelo generativo de Google
        const chat = await iniciarChatConGemini();

        let continuarConversacion = true; // Variable para controlar el bucle

        while (continuarConversacion) {
            const pregunta = ctx.body.toLowerCase();

            // Condición para salir de la conversación
            if (pregunta === 'salir') {
                continuarConversacion = false;
                await flowDynamic('Gracias por conversar. ¡Hasta luego!'); // Mensaje de despedida
                return; // Salir de la función
            }

            // Verificar con IA lo que necesita el usuario
            const prompt = 'Sos el asistente virtual de Alejandro, tenés que responder a todo tipo de preguntas, y si es algo personal para Alejandro informar que en este momento está ocupado y que a la brevedad va a responder.';
            const respuesta = await sendMessageToGemini(chat, prompt + pregunta);

            // Envía la respuesta de la IA al usuario
            await flowDynamic(respuesta);

            // Esperar una nueva respuesta del usuario
            return fallBack(async (newCtx) => {
                // Actualizar el contexto con el nuevo mensaje
                ctx.body = newCtx.body;
            });
        }
    });



// Creación del bot
const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal, flowRegistro, flowExit,flowRegistroSuccess,flowInvalidResponse,flowLogin,flowHome]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
}

main();

