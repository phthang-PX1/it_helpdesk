async function checkTicket() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaGFuX3ZpZW5faWQiOjEsInRhaV9raG9hbiI6InRlc3QiLCJ2YWlfdHJvIjoiSVRfTDEiLCJpYXQiOjE3ODAwNzY0MzMsImV4cCI6MTc4MDA4MDAzM30.DwMGC7uaxbAdOPo6cxGeVeh7f28LoVl5bsiOcNikOms';
  
  // Ticket 1 has my first test upload
  // Ticket 9 has the user's test uploads (Ch01...)
  const res = await fetch('http://localhost:3000/api/v1/tickets/9', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();
  console.log(JSON.stringify(data.data.danh_sach_file, null, 2));
}

checkTicket();
