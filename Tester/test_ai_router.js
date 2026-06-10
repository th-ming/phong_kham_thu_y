const URL = 'http://127.0.0.1:8081/api/chat';

async function testQuery(query) {
  console.log(`\n========================================`);
  console.log(`INPUT: "${query}"`);
  
  const payload = {
    history: [
      {
        role: 'user',
        content: query
      }
    ]
  };

  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      return;
    }

    const data = await response.json();
    console.log(`RESPONSE:\n`, data.reply || data.response || data);
  } catch (error) {
    console.error(`Error sending request:`, error);
  }
}

async function run() {
  // Test clinical query (the user's main issue query)
  await testQuery("Bác sĩ nên ưu tiên ca khám thú y theo dấu hiệu nguy hiểm nào?");
  
  // Test doctor list query (which should list doctors from database)
  await testQuery("Cho mình xem danh sách bác sĩ của phòng khám");
  
  // Test price query (which should query service prices)
  await testQuery("Giá dịch vụ triệt sản chó mèo bao nhiêu?");
}

run();
