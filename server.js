const express = require('express');
const os = require('os');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

const firebaseConfig = {
  apiKey: "AIzaSyAdzmiurz2tNKbMgxeMSkp62IM0Ac_f9AM",
  authDomain: "practica07-72fb3.firebaseapp.com",
  projectId: "practica07-72fb3",
  storageBucket: "practica07-72fb3.firebasestorage.app",
  messagingSenderId: "399077174446",
  appId: "1:399077174446:web:03d0d8b25c1022799a513f"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/post-data', async (req, res) => {
  const { api_key, value1, value2} = req.body;

  console.log('Datos recibidos:', req.body);

  try {
    const docRef = await addDoc(collection(db, "sensores"), {
      api_key,
      temperatura: parseFloat(value1),
      humedad: parseFloat(value2),
      timestamp: new Date()
    });

    console.log('Documento insertado con ID:', docRef.id);
    res.send('Datos recibidos y guardados en Firebase');
  } catch (error) {
    console.error('Error guardando en Firestore:', error);
    res.status(500).send('Error guardando datos');
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});
