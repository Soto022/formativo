import Usuario from '../modelos/usuario.js';
import jwt from 'jsonwebtoken';
import config from '../configuracion/index.js';

// @desc    Registrar un nuevo usuario
// @route   POST /api/autenticacion/registro
// @access  Public
const registrarUsuario = async (req, res) => {
  const { nombreUsuario, contrasena } = req.body;

  // Validación básica
  if (!nombreUsuario || !contrasena) {
    return res.status(400).json({ mensaje: 'Por favor, introduce un nombre de usuario y una contraseña.' });
  }

  try {
    const usuarioExiste = await Usuario.findOne({ nombreUsuario });

    if (usuarioExiste) {
      return res.status(400).json({ mensaje: 'El nombre de usuario ya está registrado.' });
    }

    const usuario = await Usuario.create({
      nombreUsuario,
      contrasena,
    });

    // Generar token JWT
    const token = jwt.sign({ id: usuario._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });

    res.status(201).json({
      _id: usuario._id,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuario.rol,
      token,
      mensaje: 'Usuario registrado exitosamente.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor al registrar usuario.' });
  }
};

// @desc    Autenticar usuario y obtener token
// @route   POST /api/autenticacion/login
// @access  Public
const iniciarSesion = async (req, res) => {
  const { nombreUsuario, contrasena } = req.body;

  // Validación básica
  if (!nombreUsuario || !contrasena) {
    return res.status(400).json({ mensaje: 'Por favor, introduce un nombre de usuario y una contraseña.' });
  }

  try {
    // Buscar usuario y seleccionar la contraseña
    const usuario = await Usuario.findOne({ nombreUsuario }).select('+contrasena');

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // Comparar contraseña
    const esCorrecta = await usuario.compararContrasenas(contrasena);

    if (!esCorrecta) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // Generar token JWT
    const token = jwt.sign({ id: usuario._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });

    res.status(200).json({
      _id: usuario._id,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuario.rol,
      token,
      mensaje: 'Inicio de sesión exitoso.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor al iniciar sesión.' });
  }
};

// @desc    Cerrar sesión de usuario (manejo en el cliente)
// @route   POST /api/autenticacion/logout
// @access  Private (para consistencia, aunque la lógica es del cliente)
const cerrarSesion = (req, res) => {
    // En un sistema con JWTs, el "logout" se maneja principalmente eliminando el token en el cliente.
    // Este endpoint podría usarse para invalidar tokens en el servidor si se implementa una lista negra de JWTs,
    // o simplemente para confirmar la acción de logout al cliente.
    // Por ahora, simplemente enviamos una respuesta de éxito.
    res.status(200).json({ mensaje: 'Sesión cerrada exitosamente (token debe ser eliminado por el cliente).' });
};


// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/autenticacion/perfil
// @access  Private
const obtenerPerfilUsuario = async (req, res) => {
  try {
    // req.usuario es adjuntado por el middleware protegerRuta
    const usuario = await Usuario.findById(req.usuario._id).select('-contrasena');

    if (usuario) {
      res.status(200).json({
        _id: usuario._id,
        nombreUsuario: usuario.nombreUsuario,
        rol: usuario.rol,
        fechaRegistro: usuario.fechaRegistro
      });
    } else {
      res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor al obtener perfil.' });
  }
};


export { registrarUsuario, iniciarSesion, cerrarSesion, obtenerPerfilUsuario };
