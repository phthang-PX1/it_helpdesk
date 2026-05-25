// src/libs/socket.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: '*', // Trong dự án thực tế chạy Production sẽ thay bằng domain frontend
      methods: ['GET', 'POST', 'PUT']
    }
  });

  io.on('connection', (socket: Socket) => {
    // Thuật toán gán phòng ngầm: Nhân sự IT kết nối lên sẽ gửi nhom_ho_tro_id để tự động join phòng
    const nhomHoTroId = socket.handshake.query.nhom_ho_tro_id;
    if (nhomHoTroId) {
      socket.join(`group_${nhomHoTroId}`);
    }

    // Nhân viên (Nguoi_yeu_cau) join vào phòng của chính ticket để nhận cập nhật comment realtime
    socket.on('join_ticket_room', (ticketId: string | number) => {
      socket.join(`ticket_${ticketId}`);
    });

    socket.on('disconnect', () => {
      // Tự động dọn dẹp kết nối vật lý ngầm
    });
  });

  return io;
};

export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.IO chưa được khởi tạo thông qua initSocket(server)!');
  }
  return io;
};