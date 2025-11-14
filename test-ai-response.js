// Test script to debug AI responses using fetch to Next.js API
const { default: fetch } = require('node-fetch');

async function testAIResponse() {
  console.log('🧪 Testing FitChat AI via webhook...');
  
  const testPayload = {
    entry: [
      {
        id: "test",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "447397235771",
                phone_number_id: "727457617115015"
              },
              contacts: [
                {
                  profile: {
                    name: "Test User"
                  },
                  wa_id: "447397235771"
                }
              ],
              messages: [
                {
                  context: {
                    from: "447397235771",
                    id: "test123"
                  },
                  from: "447397235771",
                  id: `test_message_${Date.now()}`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: {
                    body: "My weight is 82kg and height 171"
                  },
                  type: "text"
                }
              ]
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    console.log('✅ Webhook response:', result);
    
    if (!response.ok) {
      console.error('❌ Webhook failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAIResponse();