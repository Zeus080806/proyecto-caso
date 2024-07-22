// importar modulos necesarios

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const mysql = require('mysql');


// crear una instancia de express

const app = express();
const port = 3000;

//configurar body-parser

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json()); //para manejar JSON en el cuerpo de la solicitud 

//servir archivos estaticos 
app.use(express.static(path.join(__dirname, '../view')));

//configurar EJS estaticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../view'));

// configuracion de la conexion a la base de datos

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'caso'
});

//conectar a la base de datos
conexion.connect((err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.stack);
        return;
    }
    console.log('Conexion exitosa a la base de datos');
});

//mostrar formulario

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../view', 'usuarios.html'));
});

//ruta para registrar un nuevo usuario (POST)
app.post('/regis', async (req, res) => {
    const {usuario, contrasena} = req.body;

    //validar datos de entrada
    if (!usuario || !contrasena) {
        return res.status(400).send('Usuario y contraseña son requeridos');
    }

    //Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    //guardar el nuevo usuario en la base de datos
    conexion.query('INSERT INTO usuarios (usuario, contrasena) VALUES (?, ?)', [usuario, hashedPassword], (err, results) => {
        if (err) {
            console.error('Error al registrar el usuario:', err.stack);
            return res.status(500).send('Error al registar el usuario');
        }
        res.send('Registro exitoso');
    });
});

//ruta para iniciar sesion (POST)
app.post('/login', (req, res) => {
    const {usuario, contrasena} = req.body;

    //validar datos de entrada
    if (!usuario || !contrasena) {
        return res.status(400).send('Usuario y contraseña son requeridos');
    }

    //Buscar el usuario en la base de datos
    conexion.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], async (err, results) => {
    if (err) {
        console.error('Error al buscar el usuario:', err.stack);
        return res.status(500).send('Error al  buscar el usuario');
    }
    

    if (results.length === 0) {
        return res.status(400).send('Usuario no encontrado');
    }

    const user = results[0];

    //Comparar las contrase ingresada con la almacenada 
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);

    if (!isMatch) {
        return res.status(400).send('Contraseña incorrecta');
    }

    res.send('Inicio de sesion exitoso');

    });

});

//Iniciar el sevidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

