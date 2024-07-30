// auth.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://<your-database-name>.firebaseio.com'
});

const verifyToken = async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    next(new Error('Authentication error'));
  }
};

module.exports = { verifyToken };
