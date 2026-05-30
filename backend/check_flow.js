async function fullFlow() {
  // 1. Login để lấy token thật
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tai_khoan: 'itstaff1', mat_khau: 'Password@1' })
  });
  const loginData = await loginRes.json();
  console.log('=== LOGIN ===');
  console.log('Status:', loginRes.status);
  if (!loginData.data?.token) {
    console.log('FAIL: No token. Response:', JSON.stringify(loginData, null, 2));
    return;
  }
  const token = loginData.data.token;
  console.log('Role from response:', loginData.data.user?.vai_tro);
  console.log('Token (first 50):', token.substring(0, 50));

  // 2. Tạo ticket mới để test upload
  const createRes = await fetch('http://localhost:3000/api/v1/tickets', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tieu_de: 'Test ticket upload file',
      mo_ta_chi_tiet: 'Mô tả chi tiết ít nhất 10 ký tự',
      muc_do_anh_huong: 'TRUNG_BINH',
      muc_do_khan_cap: 'TRUNG_BINH'
    })
  });
  const createData = await createRes.json();
  console.log('\n=== CREATE TICKET ===');
  console.log('Status:', createRes.status);
  console.log('Response:', JSON.stringify(createData, null, 2));
}

fullFlow();
