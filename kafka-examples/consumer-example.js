const { Kafka } = require('kafkajs');

// 환경변수에서 카프카 브로커 설정 가져오기 (Docker 환경 지원)
const KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092';

// 카프카 클라이언트 설정
const kafka = new Kafka({
  clientId: 'my-consumer-app',
  brokers: KAFKA_BROKERS.split(',').map(broker => broker.trim())
});

// 컨슈머 생성
const consumer = kafka.consumer({ 
  groupId: 'test-consumer-group',
  // 처음부터 메시지를 읽기 위한 설정
  fromBeginning: true
});

// 메시지 소비 함수
async function consumeMessages(topic) {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: topic, fromBeginning: true });
    
    console.log(`토픽 '${topic}' 구독 시작...`);
    console.log(`연결 브로커: ${KAFKA_BROKERS}`);
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log('=== 새 메시지 수신 ===');
        console.log(`토픽: ${topic}`);
        console.log(`파티션: ${partition}`);
        console.log(`오프셋: ${message.offset}`);
        console.log(`키: ${message.key ? message.key.toString() : '없음'}`);
        console.log(`값: ${message.value.toString()}`);
        console.log(`타임스탬프: ${new Date(Number(message.timestamp)).toLocaleString()}`);
        console.log('=====================\n');
        
        try {
          const parsedMessage = JSON.parse(message.value.toString());
          console.log('파싱된 메시지:', parsedMessage);
        } catch (error) {
          console.log('메시지 파싱 실패 (JSON이 아님)');
        }
      },
    });
    
    console.log('컨슈머 실행 중... (Ctrl+C로 종료)');
    
  } catch (error) {
    console.error('컨슈머 실행 실패:', error);
  }
}

// 특정 토픽의 메시지 소비
async function runConsumerExample() {
  console.log('=== 카프카 컨슈머 예제 ===');
  console.log(`연결 브로커: ${KAFKA_BROKERS}`);
  
  const topic = 'test-topic';
  await consumeMessages(topic);
}

// 스크립트 실행
if (require.main === module) {
  runConsumerExample().catch(console.error);
}

module.exports = { consumeMessages };
