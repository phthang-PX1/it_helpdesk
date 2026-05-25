import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRoutes from './routes/auth.routes';
import ticketRoutes from './routes/ticket.routes';
import { errorHandler } from './middlewares/errorHandler';
import cors from 'cors';



const app = express();
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH SWAGGER ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Hệ thống IT Helpdesk - Map Pacific Singapore',
      version: '1.0.0',
      description: 'Tài liệu API chính thức phục vụ vận hành và phân quyền hệ thống',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // Áp dụng nút khóa cho tất cả các endpoint hiển thị
    security: [{ BearerAuth: [] }],
    servers: [
      {
        url: 'http://localhost:3000', // Sửa lại port nếu bạn chạy port khác
        description: 'Development Server',
      },
    ],
  },
  // Đường dẫn đến các file chứa comment Swagger (quét tất cả file trong thư mục routes)
  apis: ['./src/routes/*.ts', './routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
// Tạo đường dẫn giao diện test: http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// --- ĐĂNG KÝ ROUTES ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tickets', ticketRoutes);

// --- MIDDLEWARE XỬ LÝ LỖI TRUNG TÂM (LUÔN ĐỂ CUỐI CÙNG) ---
app.use(errorHandler);

// --- KÍCH HOẠT MỞ CỔNG SERVER ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`SERVER ĐÃ KHỞI ĐỘNG!`);
  console.log(`🔗 Link test API Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`====================================================`);
});

export default app;