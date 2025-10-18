const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
const cajonesRoutes = require('./routes/cajones');
const ticketsRoutes = require('./routes/tickets');
const usuariosRoutes = require('./routes/usuarios');
const syncRoutes = require('./routes/sync');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/cajones', cajonesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '🚗 API ParkPay funcionando correctamente',
    endpoints: {
      auth: '/api/auth',
      cajones: '/api/cajones',
      tickets: '/api/tickets',
      usuarios: '/api/usuarios'
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
