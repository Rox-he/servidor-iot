const express = require('express');
const os = require('os');
const admin = require('firebase-admin');

// Inicialización de Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para diagnóstico
app.use((req, res, next) => {
  console.log('\n📨 Nueva solicitud recibida:');
  console.log('🔹 Método:', req.method);
  console.log('🔹 URL:', req.originalUrl);
  console.log('🔹 Headers:', req.headers);
  console.log('🔹 Body:', req.body);
  next();
});

// Middleware para parsear JSON
app.use(express.json());

// Función para obtener IP local
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

// Endpoint principal para recibir datos
app.post('/post-data', async (req, res) => {
  try {
    console.log('📊 Datos crudos recibidos:', req.body);
    
    // Validación de datos
    if (!req.body.api_key) {
      console.error('❌ API key faltante');
      return res.status(400).json({ 
        error: "API key faltante",
        received_data: req.body 
      });
    }

    if (!req.body.value1 || !req.body.value2) {
      console.error('❌ Datos de sensor faltantes');
      return res.status(400).json({ 
        error: "Datos de sensor faltantes",
        required_fields: ["value1 (temperatura)", "value2 (humedad)"]
      });
    }

    // Conversión y validación de valores numéricos
    const temperatura = parseFloat(req.body.value1);
    const humedad = parseFloat(req.body.value2);
    
    if (isNaN(temperatura) || isNaN(humedad)) {
      console.error('❌ Valores inválidos:', { temperatura, humedad });
      return res.status(400).json({ 
        error: "Valores no válidos",
        details: {
          value1: req.body.value1,
          value2: req.body.value2,
          parsed: { temperatura, humedad }
        }
      });
    }

    // Guardar en Firebase
    const docRef = await db.collection("sensores").add({
      api_key: req.body.api_key,
      temperatura: temperatura,
      humedad: humedad,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      raw_data: req.body // Opcional: guardar datos crudos para diagnóstico
    });

    console.log('✅ Documento Firebase creado con ID:', docRef.id);
    
    res.json({
      success: true,
      id: docRef.id,
      timestamp: new Date().toISOString(),
      data: {
        temperatura,
        humedad
      }
    });
    
  } catch (error) {
    console.error('🔥 Error detallado:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Iniciar servidor
const HOST = getLocalIp();
app.listen(PORT, () => {
  console.log('\n🚀 Servidor iniciado:');
  console.log(`🔹 Local: http://localhost:${PORT}`);
  console.log(`🔹 Red: http://${HOST}:${PORT}`);
  console.log('📅', new Date().toLocaleString(), '\n');
});