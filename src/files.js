const fs = require('fs');

function leerArchivo(path){
    const data = fs.readFileSync(path);
    //Convertir la cadena de texto a Json
    const personajes = JSON.parse(data).personajes;
    return personajes;
}

function escribirArchivo(path,info){
    const data = JSON.stringify({'personajes':info});
    fs.writeFileSync(path, data);
}

//Permite exportar el archivo para usarlo en otro archivo
module.exports = {
    leerArchivo,
    escribirArchivo
}