// Replace with your deployed Render backend URL once you have it (e.g. https://portfolio-backend.onrender.com)
const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? `${location.protocol}//${location.host}`
  : 'https://YOUR-RENDER-APP.onrender.com';
