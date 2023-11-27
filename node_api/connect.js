const bcrypt = require('bcrypt');
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bodyParser = require('body-parser');

const corsOptions = {
    origin: 'http://localhost:4200'  };

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');



const app = express();
app.use(cors((corsOptions))); // Configura CORS para permitir solicitudes desde tu aplicación Angular
app.use(express.json());
app.use(bodyParser.json());
require('dotenv').config({ path: 'gmail.env' });

var config = {
    server: "DESKTOP-HGI34O9",
    authentication: {
      type: "default",
      options: {
        userName: "jorge",
        password: "Jorge$10911"
      }
    },
    options: {
      port: 1433,
      database: "adoptPet",
      trustServerCertificate: true,
      connectTimeout: 60000,
    }
}

sql.connect(config, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Conexión exitosa a SQL Server');
  }
});



app.get('/api/datos', (req, res) => {
  const request = new sql.Request();
  request.query('SELECT * FROM Usuarios', (err, recordset) => {
    if (err) {
      console.log(err);
    } else {
      res.send(recordset.recordset);
    }
  });
});




let codigoVerificacionTemporal = '';

// app.post('/api/login', async (req, res) => {
//   const { emailLogin, username, password, rolLogin } = req.body;
//   const request = new sql.Request();

//   // Construye la consulta SQL dinámicamente
//   const query = `
//     SELECT * FROM usuarios
//     WHERE Email = '${emailLogin}' AND Usuario = '${username}' AND Contrasena = '${password}' AND Rol = '${rolLogin}'
//   `;

//   request.query(query, async (err, recordset) => {
//     if (err) {
//       console.log(err);
//       res.status(500).json({ error: 'Error al autenticar' });
//     } else {
//       if (recordset.recordset.length === 0) {
//         res.status(401).json({ error: 'Credenciales incorrectas' });
//       } else {

//         // Autenticación exitosa, puedes generar un token
//         const token = jwt.sign({ username, rolLogin }, 'secreto'); // Cambia 'secreto' por una clave segura

//         // Autenticación exitosa, puedes generar un código de verificación
//         const verificationCode = randomstring.generate({ length: 6, charset: 'numeric' });

//         // Guarda el código de verificación temporalmente en el servidor
//         codigoVerificacionTemporal = verificationCode;

//         // Envía el código de verificación al correo electrónico del usuario
//         const transporter = nodemailer.createTransport({
//           service: 'gmail',
//           auth: {
//             user: 'jorgetorres10911@gmail.com',
//             pass: 'drub kazj plyt nroh',
//           },
//         });

//         const mailOptions = {
//           from: 'jorgetorres10911@gmail.com',
//           to: emailLogin,
//           subject: 'Código de Verificación',
//           text: `Tu código de verificación es: ${verificationCode}`,
//         };
//         console.log(mailOptions);
//         console.log(transporter);
//         try {
//           await transporter.sendMail(mailOptions);
//           res.status(200).json({ message: 'Código de verificación enviado con éxito', token });
//         } catch (emailError) {
//           console.error(emailError);
//           res.status(500).json({ error: 'Error al enviar el código de verificación por correo' });
//         }
//       }
//     }
//   });
// });



app.post('/api/login', async (req, res) => {
  const { emailLogin, username, password } = req.body;
  const request = new sql.Request();

  // Construye la consulta SQL dinámicamente
  const query = `
    SELECT * FROM usuarios
    WHERE Email = '${emailLogin}' AND Usuario = '${username}';
  `;

  request.query(query, async (err, recordset) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: 'Error al autenticar' });
    } else {
      if (recordset.recordset.length === 0) {
        res.status(401).json({ error: 'Credenciales incorrectas' });
      } else {
        const storedHashedPassword = recordset.recordset[0].Contrasena;

        try {
          const passwordMatch = await bcrypt.compare(password, storedHashedPassword);

          if (passwordMatch) {
             // Asigna el rol del usuario obtenido de la base de datos
              const userRole = recordset.recordset[0].Rol;

            // Autenticación exitosa, puedes generar un token
            const token = jwt.sign({ username, rolLogin: userRole }, 'secreto'); // Cambia 'secreto' por una clave segura

            // Autenticación exitosa, puedes generar un código de verificación
            const verificationCode = randomstring.generate({ length: 6, charset: 'numeric' });

            // Guarda el código de verificación temporalmente en el servidor
            codigoVerificacionTemporal = verificationCode;

            // Envía el código de verificación al correo electrónico del usuario
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'jorgetorres10911@gmail.com',
                pass: 'drub kazj plyt nroh',
              },
            });

            const mailOptions = {
              from: 'jorgetorres10911@gmail.com',
              to: emailLogin,
              subject: 'Código de Verificación',
              text: `Tu código de verificación es: ${verificationCode}`,
            };

            try {
              await transporter.sendMail(mailOptions);
              res.status(200).json({ message: 'Código de verificación enviado con éxito', token });
            } catch (emailError) {
              console.error(emailError);
              res.status(500).json({ error: 'Error al enviar el código de verificación por correo' });
            }
          } else {
            res.status(401).json({ error: 'Credenciales incorrectas' });
          }
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Error al autenticar' });
        }
      }
    }
  });
});



// Ruta para la verificación del código
app.post('/api/verify', (req, res) => {
  const { verificationCode } = req.body;

  console.log('Código recibido en el servidor:', verificationCode);

  // Lógica para verificar el código temporal almacenado en el servidor
  if (verificationCode === codigoVerificacionTemporal) {
    res.status(200).json({ message: 'Verificación exitosa' });
  } else {
    res.status(401).json({ error: 'Código de verificación incorrecto' });
  }
});




// app.post('/api/register', bodyParser.json(), (req, res) => {
//   console.log(req.body);
//   const nombre = req.body.nombre;
//   const apellido = req.body.apellido;
//   const usuario = req.body.usuario;
//   const email = req.body.email;
//   const contrasena = req.body.contrasena;
//   const rol = req.body.rol;

//   const request = new sql.Request();
//   const query = `
//     INSERT INTO usuarios (Nombre, Apellido, Usuario, Email, Contrasena, Rol)
//     VALUES ('${nombre}', '${apellido}', '${usuario}', '${email}', '${contrasena}', '${rol}');
//   `;

//   request.query(query, (err, recordset) => {
//     if (err) {
//       console.log(err);
//       res.status(500).send({ error: 'Error al registrar el usuario' });
//     } else {
//       res.status(201).send({ message: 'Usuario registrado exitosamente' });
//     }
//   });
// });

const saltRounds = 10;

app.post('/api/register', bodyParser.json(), async (req, res) => {
  const { nombre, apellido, usuario, email, contrasena, rol } = req.body;
  const request = new sql.Request();

  // Verificar si el usuario ya existe
  const userQuery = `SELECT * FROM usuarios WHERE Usuario = '${usuario}'`;
  const userResult = await request.query(userQuery);

  if (userResult.recordset.length > 0) {
    return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
  }

  // Verificar si el correo electrónico ya existe
  const emailQuery = `SELECT * FROM usuarios WHERE Email = '${email}'`;
  const emailResult = await request.query(emailQuery);

  if (emailResult.recordset.length > 0) {
    return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
  }

  // Si no hay coincidencias, proceder con el registro

  // Si no hay coincidencias, proceder con el registro
  const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

  const insertQuery = `
    INSERT INTO usuarios (Nombre, Apellido, Usuario, Email, Contrasena, Rol)
    VALUES ('${nombre}', '${apellido}', '${usuario}', '${email}', '${hashedPassword}', '${rol}');
  `;

  request.query(insertQuery, (err, recordset) => {
    if (err) {
      console.log(err);
      res.status(500).send({ error: 'Error al registrar el usuario' });
    } else {
      res.status(201).send({ message: 'Usuario registrado exitosamente' });
    }
  });
});





// En tu archivo de servidor (app.js o index.js)
let tokenRecuperacionTemporal;
let emailTemporal;

app.post('/api/forgotPassword', async (req, res) => {
  const { email } = req.body;
  const request = new sql.Request();

    // Verifica si el usuario existe en la base de datos
    const query = `SELECT * FROM usuarios WHERE Email = '${email}'`;
    

  request.query(query, async (err, recordset) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: 'Error al autenticar' });
    } else {
      if (recordset.recordset.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      } else {

    // Genera un token de recuperación (puedes utilizar una biblioteca como 'jsonwebtoken')
    const tokenRecuperacion = jwt.sign({ email }, 'secreto', { expiresIn: '1h' });

    // Almacena temporalmente el token en el servidor
    tokenRecuperacionTemporal = tokenRecuperacion;
    emailTemporal = email;

    // Envia el token al correo del usuario (puedes utilizar nodemailer)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jorgetorres10911@gmail.com',
        pass: 'drub kazj plyt nroh',
      },
    });

    const mailOptions = {
      from: 'jorgetorres10911@gmail.com',
      to: email,
      subject: 'Código de Verificación',
      text: `Tu código de verificación es: ${tokenRecuperacionTemporal}`,
    };
    // ...
    await transporter.sendMail(mailOptions);

    try {
          await transporter.sendMail(mailOptions);
          res.status(200).json({ message: 'Correo de recuperación enviado con éxito' });
        } catch (emailError) {
          console.error(emailError);
          res.status(500).json({ error: 'Error al procesar la solicitud' });
        }
      }
    }
  });
});

// En tu archivo de servidor (app.js o index.js)
// app.post('/api/resetPassword', async (req, res) => {
//   const { token, newPassword } = req.body;

//   try {
//     // Verifica si el token es válido
//     if (token !== tokenRecuperacionTemporal) {
//       return res.status(401).json({ error: 'Token inválido' });
//     }

//     // Lógica para restablecer la contraseña usando el token y la nueva contraseña
//     // ...

//     res.status(200).json({ message: 'Contraseña restablecida con éxito' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Error al restablecer la contraseña' });
//   }
// });

// app.post('/api/resetPassword', async (req, res) => {
//   const { token, newPassword } = req.body;
//   const query = `UPDATE usuarios SET Contrasena = ${newPassword} WHERE Email = ${email}`;
//   // Configurar la conexión a SQL Server
//   const request = new sql.Request();

//     request.query(query, async (err, recordset) => {
//       if (err) {
//         console.log(err);
//         res.status(500).json({ error: 'Error al autenticar' });
//       } else {
//         if (recordset.recordset.length === 0) {
//           return res.status(404).json({ error: 'Usuario no encontrado' });
//         } else {
          
//     // Verifica si el token es válido

//     if (token !== tokenRecuperacionTemporal) {
//       return res.status(401).json({ error: 'Token inválido' });
//     }

//     // Lógica para restablecer la contraseña usando el token y la nueva contraseña
//     const decodedToken = jwt.verify(token, 'secreto'); // Cambia 'secreto' por una clave segura

//     // Accede a la información del token, como el nombre de usuario y el rol
//     const { username, email } = decodedToken;

//     // Ejecutar la consulta para actualizar la contraseña
//     const result = await request.request()
//       .input('newPassword', sql.NVarChar, newPassword)
//       .input('email', sql.NVarChar, email)
//       .query(query);

//     // Verificar si se actualizó correctamente
//     if (result.rowsAffected[0] === 1) {
//       return res.status(200).json({ message: 'Contraseña restablecida con éxito' });
//     } else {
//       return res.status(500).json({ error: 'Error al restablecer la contraseña' });
//     }
//       }
//     }
//   });
// });
console.log(tokenRecuperacionTemporal);



// app.post('/api/resetPassword', async (req, res) => {
//   const { token, newPassword } = req.body;
// // Configurar la conexión a SQL Server
//     const request = new sql.Request();
    
//     // Ejecutar la consulta para actualizar la contraseña
//     const query = `UPDATE usuarios SET Contrasena = '${newPassword}' WHERE Email = '${emailTemporal}'`;

//     request.query(query, async (err, recordset) => {
//       if (err) {
//         console.log(err);
//         res.status(500).json({ error: 'Error al autenticar' });
//       } else {
//         if (recordset.recordset.length === 0) {
//           return res.status(404).json({ error: 'Correo no encontrado' });
//         } else {

//     // Verifica si el token es válido
//     if (token !== tokenRecuperacionTemporal) {
//       return res.status(401).json({ error: 'Token inválido' });
//     }

//      // Obtiene el email almacenado temporalmente
//      const email = emailTemporal;

//     // Lógica para restablecer la contraseña usando el token y la nueva contraseña
//     const decodedToken = jwt.verify(token, 'secreto'); // Cambia 'secreto' por una clave segura
    

//     console.log(decodedToken);
//     try {
//       res.status(200).json({ message: 'Contraseña restablecida con éxito' });
//     } catch (emailError) {
//       console.error(emailError);
//       res.status(500).json({ error: 'Error al restablecer la contraseña' });
//     }
//   }
// }
// });
// });

app.post('/api/resetPassword', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verifica si el token es válido
    if (token !== tokenRecuperacionTemporal) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Obtiene el email almacenado temporalmente
    const email = emailTemporal;

    // Configurar la conexión a SQL Server
    const request = new sql.Request();

    // Verificar si el email existe en la base de datos
    const emailQuery = `SELECT * FROM usuarios WHERE Email = '${email}'`;

    request.query(emailQuery, async (emailErr, emailRecordset) => {
      if (emailErr) {
        console.log(emailErr);
        return res.status(500).json({ error: 'Error al verificar el email' });
      } else {
        if (emailRecordset.recordset.length === 0) {
          return res.status(404).json({ error: 'Correo no encontrado' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);


        // Ejecutar la consulta para actualizar la contraseña
        const updateQuery = `UPDATE usuarios SET Contrasena = '${hashedPassword}' WHERE Email = '${email}'`;

        request.query(updateQuery, async (updateErr, updateRecordset) => {
          if (updateErr) {
            console.log(updateErr);
            return res.status(500).json({ error: 'Error al restablecer la contraseña' });
          }

          // Lógica adicional después de restablecer la contraseña si es necesario

          res.status(200).json({ message: 'Contraseña restablecida con éxito' });
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Endpoint para obtener todos los usuarios
app.get('/usuarios', (req, res) => {
  const request = new sql.Request();

  request.query('SELECT * FROM usuarios', (error, result) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener usuarios de la base de datos' });
    } else {
      res.json(result.recordset);
    }
  });
});

// Endpoint para borrar un usuario por ID
app.delete('/api/usuarios/:id', (req, res) => {
  const idUsuario = parseInt(req.params.id);
  const request = new sql.Request();

  request.query(`DELETE FROM usuarios WHERE IdUsuarios = '${idUsuario}'`, (error) => {
    if (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error al borrar usuario' });
    } else {
      res.json({ success: true, message: 'Usuario borrado con éxito' });
    }
  });
});

// Endpoint para actualizar datos de usuario
app.put('/api/usuarios/:id', (req, res) => {
  const idUsuario = req.params.id;
  const { Nombre, Apellido, Rol } = req.body;
  const request = new sql.Request();

  request.query(
    `UPDATE usuarios SET Nombre = '${Nombre}', Apellido = '${Apellido}', Rol = '${Rol}' WHERE IdUsuarios = ${idUsuario}`,
    (error) => {
      if (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar datos de usuario' });
      } else {
        res.json({ success: true, message: 'Datos de usuario actualizados con éxito' });
      }
    }
  );
});

// Endpoint para registrar usuario
app.post('/api/usuarios', bodyParser.json(), async (req, res) => {
  const { Nombre, Apellido, Usuario, Email, Contrasena, Rol } = req.body;
  const request = new sql.Request();

   // Verificar si el usuario ya existe
  const userQuery = `SELECT * FROM usuarios WHERE Usuario = '${Usuario}'`;
  const userResult = await request.query(userQuery);

  if (userResult.recordset.length > 0) {
    return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
  }

  // Verificar si el correo electrónico ya existe
  const emailQuery = `SELECT * FROM usuarios WHERE Email = '${Email}'`;
  const emailResult = await request.query(emailQuery);

  if (emailResult.recordset.length > 0) {
    return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
  }

  try {
  

    // Hashear la contraseña antes de guardarla en la base de datos
    const hashedPassword = await bcrypt.hash(Contrasena, 10);
    
    const result = await request.query(
      `INSERT INTO usuarios (Nombre, Apellido, Usuario, Email, Contrasena, Rol) VALUES ('${Nombre}', '${Apellido}', '${Usuario}', '${Email}', '${hashedPassword}', '${Rol}')`
    );

    res.json({ success: true, message: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Node.js en ejecución en el puerto ${PORT}`);
});
