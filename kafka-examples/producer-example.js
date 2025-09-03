const { Kafka } = require('kafkajs');

// 환경변수에서 카프카 브로커 설정 가져오기 (Docker 환경 지원)
const KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092';

// 카프카 클라이언트 설정
const kafka = new Kafka({
  clientId: 'my-producer-app',
  brokers: KAFKA_BROKERS.split(',').map(broker => broker.trim())
});

// 프로듀서 생성
const producer = kafka.producer();

// 메시지 전송 함수
async function sendMessage(topic, message) {
  try {
    await producer.connect();
    
    console.log(`메시지 전송 중: ${JSON.stringify(message)}`);
    console.log(`브로커: ${KAFKA_BROKERS}`);
    
    await producer.send({
      topic: topic,
      messages: [
        { 
          value: JSON.stringify(message),
          timestamp: Date.now()
        }
      ]
    });
    
    console.log('메시지 전송 완료!');
  } catch (error) {
    console.error('메시지 전송 실패:', error);
  } finally {
    await producer.disconnect();
  }
}

// 토픽 생성 및 메시지 전송 예제
async function runProducerExample() {
  console.log('=== 카프카 프로듀서 예제 ===');
  console.log(`연결 브로커: ${KAFKA_BROKERS}`);
  
  // 여러 메시지 전송
  const messages = [
    { id: 1, text: '안녕하세요!', user: 'user1' },
    { id: 2, text: '카프카 연습 중입니다', user: 'user2' },
    { id: 3, text: '메시지 큐 시스템', user: 'user3' },
    { id: 4, text: '비동기 처리', user: 'user1' },
    { id: 5, text: '이벤트 기반 아키텍처', user: 'user2' }
  ];
  
  for (const message of messages) {
    await sendMessage('test-topic', message);
    // 메시지 간 간격
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 스크립트 실행
if (require.main === module) {
  runProducerExample().catch(console.error);
}

module.exports = { sendMessage };
