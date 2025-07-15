const express = require('express');
const os = require('os');
const admin = require('firebase-admin');


admin.initializeApp({
  credential: admin.credential.applicationDefault(), // O usa .cert si tienes el JSON
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 5000;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const HOST = getLocalIp();

app.use(express.json());

app.post('/post-data', async (req, res) => {
  const { api_key, value1, value2 } = req.body;

  console.log('Datos recibidos:', req.body);

  try {
    const docRef = await db.collection("sensores").add({
      api_key,
      temperatura: parseFloat(value1),
      humedad: parseFloat(value2),
      timestamp: new Date()
    });

    console.log('Documento insertado con ID:', docRef.id);
    res.send('Datos guardados en Firebase');
  } catch (error) {
    console.error('Error guardando datos:', error);
    res.status(500).send('Error en el servidor');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
