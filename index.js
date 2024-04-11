const express = require('express')
const fs = require('fs')
const path = require('path');
const PDFDocument = require('pdfkit');
const Joi = require('joi');
const moment = require('moment');

const {leerArchivo, escribirArchivo} = require('./src/files')

const app = express()

app.use(express.json())

// RUTA PARA CREAR LA CARPETA ACCESS
const logFolderPath = path.join(__dirname, 'access');
const logFilePath = path.join(logFolderPath, 'access_log.txt');

// MIDDLEWARE PARA REGISTRAR SOLICITUDES
app.use((req, res, next) => {
    const fecha = moment().format('DD/MM/YYYY HH:mm:ss');
    const tipoMetodo = req.method;
    const url = req.originalUrl;
    const queryParams = JSON.stringify(req.query);
    const body = JSON.stringify(req.body);
    const ip = req.ip;

    const log = `${fecha} [${tipoMetodo}] ${url} ${queryParams} ${body} ${ip}\n`;

    if (!fs.existsSync(logFolderPath)) {
        fs.mkdirSync(logFolderPath, { recursive: true });
    }

    fs.appendFile(logFilePath, log, (err) => {
        if (err) console.error('Error al escribir en el archivo access_log.txt:', err);
    });

    next();
});

// DEFINICION DEL ESQUEMA DE VALIDACION CON JOI
const marvSchema = Joi.object({
    nombre: Joi.string().required(),
    edad: Joi.number().integer().min(1).required(),
    poderes: Joi.array().items(Joi.string()).required(),
    afiliacion: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).required(),
    vivo: Joi.boolean().required(),
    fechaNacimiento: Joi.string().isoDate().required(),
    nivelPeligrosidad: Joi.string().valid('Bajo', 'Moderado', 'Alto', 'Extremo').required(),
    relaciones: Joi.array().items(Joi.string()).required()
});

//RUTAS
app.get('/', (req, res) => {
    res.send('Welcome to the Marvel Universe')
})

//RUTA INDEX
// app.get('/marvel', (req, res) => {
//     res.send('Hello Mr. Stark')
// })

//RUTA POSTMAN INDEX
// app.get('/marvel', (req,res) => {
//     const personajes = leerArchivo('./db.json')
//     res.send(personajes)
// })

//RUTA POSTMAN CON FILTRO
app.get('/marvel', (req, res) => {
    // Filtrar por afiliación
    const { afiliacion } = req.query; 
    let personajes = leerArchivo('./db.json');

    if (afiliacion) {
        personajes = personajes.filter(personaje => personaje.afiliacion.includes(afiliacion));
    }
    res.json(personajes);
});

//RUTA SHOW
// app.get('/marvel/:id', (req, res) => {
//     res.send('Hello Capitan America ' + req.params.id)
// })

//RUTA POSTMAN SHOW
app.get('/marvel/:id', (req, res) => {
    const id = req.params.id
    const personajes = leerArchivo('./db.json')
    const marv = personajes.find(marv => marv.id === parseInt(id))

    //No existe 
    if( !marv )//( todo == undefined)
    {
        res.status(404).send('No existe el superheroe')
        return
    }
       Existe
    res.send(marv)
    console.log('Superhereo encontrado')
})

//RUTA STORE
// app.post('/marvel', (req, res) => {
//     console.log(req.body)
//     res.send('Hello Natasha Romanoff')
// })

//RUTA POSTMAN STORE
// app.post('/marvel', (req, res) => {
//     const marv = req.body
//     const personajes = leerArchivo('./db.json')
//     marv.id = personajes.length + 1
//     personajes.push(marv)

//     escribirArchivo('./db.json', personajes)
//     res.status(201).send(marv)
// })

// RUTA POSTMAN STORE VALIDACIÓN CON JOI
// app.post('/marvel', (req, res) => {
//     const marv = req.body;
//     const { error } = marvSchema.validate(marv);
//     if (error) {
//         return res.status(400).send(error.details[0].message);
//     }
//     const personajes = leerArchivo('./db.json');
//     marv.id = personajes.length + 1;
//     personajes.push(marv);

//     escribirArchivo('./db.json', personajes);
//     res.status(201).send(marv);
// });


// MIDDLEWARE PARA AGREGAR CREATED_AT
const agregarCreatedAt = (req, res, next) => {
    const fechaActual = moment().format('YYYY-MM-DD HH:mm');
    req.body.created_at = fechaActual;
    next();
};

// RUTA POSTMAN STORE CON MIDDLEWARE CREATED_AT
app.post('/marvel', agregarCreatedAt, (req, res) => {
    const marv = req.body;
    const personajes = leerArchivo('./db.json');
    marv.id = personajes.length + 1;
    personajes.push(marv);

    escribirArchivo('./db.json', personajes);

    res.status(201).send(marv);
});

// //RUTA PARA CREAR EL PDF
app.post('/marvel', async (req, res) => {
    const marv = req.body;
    const personajes = leerArchivo('./db.json');
    marv.id = personajes.length + 1;
    personajes.push(marv);

    escribirArchivo('./db.json', personajes);

    try {
        const pdfDoc = new PDFDocument();
        pdfDoc.pipe(fs.createWriteStream(`./pdfs/${marv.id}.pdf`)); 

        pdfDoc.fontSize(20).text('INFORMACIÓN DEL NUEVO SUPERHEROE:', { align: 'center' });
        pdfDoc.moveDown();
        pdfDoc.fontSize(14).text(`Nombre: ${marv.nombre}`);
        pdfDoc.moveDown(); 
        pdfDoc.fontSize(14).text(`Poder: ${marv.poderes}`);
        pdfDoc.moveDown(); 
        pdfDoc.fontSize(14).text(`Está vivo: ${marv.vivo}`);
        pdfDoc.moveDown(); 
        pdfDoc.fontSize(14).text(`Nivel de Peligrosidad: ${marv.nivelPeligrosidad}`);
        pdfDoc.moveDown();
        pdfDoc.moveDown();
        pdfDoc.moveDown();
        pdfDoc.fontSize(10).text('Copyright © 2024, Valentina Velez Castrillon', { align: 'center' });

        pdfDoc.end();

        res.status(201).send(marv);
    } catch (error) {
        console.error('Error al generar el PDF:', error);
        res.status(500).send('Error interno del servidor');
    }
});

//RUTA UPDATE
// app.put('/marvel/:id', (req, res) => {
//     res.send('Hello Peter Parker')
// })

//RUTA POSTMAN UPDATE
// app.put('/marvel/:id', (req, res) => {
//     const id = req.params.id;
//     const newData = req.body;
//     const personajes = leerArchivo('./db.json');
//     const index = personajes.findIndex(marv => marv.id === parseInt(id));

//     if (index === -1) {
//         res.status(404).send('No existe el superhéroe con el ID proporcionado');
//         return;
//     }
//     personajes[index] = { ...personajes[index], ...newData };
//     escribirArchivo('./db.json', personajes);
//     res.send(personajes[index]);
// });

// RUTA POSTMAN UPDATE VALIDACIÓN CON JOI
// app.put('/marvel/:id', (req, res) => {
//     const id = req.params.id;
//     const newData = req.body;
//     const { error } = marvSchema.validate(newData);
//     if (error) {
//         return res.status(400).send(error.details[0].message);
//     }
//     let personajes = leerArchivo('./db.json');
//     const index = personajes.findIndex(marv => marv.id === parseInt(id));
//     if (index === -1) {
//         return res.status(404).send('No existe el superhéroe con el ID proporcionado');
//     }
//     personajes[index] = { ...personajes[index], ...newData };
//     escribirArchivo('./db.json', personajes);
//     res.send(personajes[index]);
// });

// RUTA POSTMAN UPDATE CAMPO UPDATED_AT
// app.put('/marvel', (req, res) => {
//     const newData = req.body;
//     const personajes = leerArchivo('./db.json');
//     const updatedPersonajes = personajes.map(marv => {
//         if (!marv.updated_at) {
//             marv.updated_at = moment().format('YYYY-MM-DD HH:mm');
//         }
//         return { ...marv, ...newData };
//     });

//     escribirArchivo('./db.json', updatedPersonajes);
//     res.send(updatedPersonajes);
// });

// RUTA POSTMAN UPDATE CON MIDDLEWARE DE ACTUALIZAR CREATED_AT Y UPDATED_AT
app.put('/marvel/:id', agregarCreatedAt, (req, res) => {
    const id = req.params.id;
    const newData = req.body;
    newData.updated_at = moment().format('YYYY-MM-DD HH:mm');

    const personajes = leerArchivo('./db.json');
    const index = personajes.findIndex(marv => marv.id === parseInt(id));

    if (index === -1) {
        res.status(404).send('No existe el superhéroe con el ID proporcionado');
        return;
    }
    personajes[index] = { ...personajes[index], ...newData };
    escribirArchivo('./db.json', personajes);
    res.send(personajes[index]);
});

//RUTA DESTROY
// app.delete('/marvel/:id', (req, res) => {
//     res.send('Hello Dr. Bruce Banner')
// })

//RUTA POSTMAN DESTROY
app.delete('/marvel/:id', (req, res) => {
    let personajes = leerArchivo('./db.json');
    personajes = personajes.filter(marv => marv.id !== parseInt(id));
    escribirArchivo('./db.json', personajes);
    res.send(`Se ha eliminado el superhéroe con el ID ${id}`);
});

// MODULO BUILT-IN DE FILESYSTEM
// app.get('/marvel', (req, res) => {
//     const marvel = fs.readFileSync('db.json')
//     const marvelJSON = JSON.parse(marvel)
//     res.send(marvelJSON)
// })

//Levantando el servidor para escuchar por el puerto 3000
app.listen(3000, () => {
    console.log('Listening on port 3000');
}
)