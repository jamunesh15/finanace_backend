require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerUiDist = require('swagger-ui-dist');

const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Security & utilities
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// API Docs
const swaggerUiAssetPath = swaggerUiDist.absolutePath();
const swaggerDocsHandler = swaggerUi.setup(swaggerSpec);
app.use('/api-docs', express.static(swaggerUiAssetPath));
app.get('/api-docs', swaggerDocsHandler);
app.get('/api-docs/', swaggerDocsHandler);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route for deployment checks
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance backend API is live.',
    health: '/health',
    docs: '/api-docs',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
