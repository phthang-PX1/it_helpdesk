const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpload() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaGFuX3ZpZW5faWQiOjEsInRhaV9raG9hbiI6InRlc3QiLCJ2YWlfdHJvIjoiSVRfTDEiLCJpYXQiOjE3ODAwNzY0MzMsImV4cCI6MTc4MDA4MDAzM30.DwMGC7uaxbAdOPo6cxGeVeh7f28LoVl5bsiOcNikOms';
  
  const ticket = await prisma.phieuHoTro.findFirst({ where: { trang_thai: { not: 'DA_DONG' } } });
  if (!ticket) {
    console.log('No open ticket');
    return;
  }
  
  const form = new FormData();
  fs.writeFileSync('test.pdf', 'dummy pdf content');
  const fileBuffer = fs.readFileSync('test.pdf');
  form.append('files', new Blob([fileBuffer], { type: 'application/pdf' }), 'test.pdf');

  const res = await fetch(`http://localhost:3000/api/v1/attachments/tickets/${ticket.phieu_ho_tro_id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

testUpload();
