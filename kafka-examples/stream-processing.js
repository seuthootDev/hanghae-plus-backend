const { Kafka } = require('kafkajs');

// 카프카 클라이언트 설정
const kafka = new Kafka({
  clientId: 'stream-processing-app',
  brokers: ['localhost:9092']
});

// 컨슈머 생성
const consumer = kafka.consumer({ 
  groupId: 'stream-processing-group',
  fromBeginning: true
});

// 메시지 스트림 처리
async function processMessageStream() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });
    
    console.log('=== 메시지 스트림 처리 시작 ===');
    console.log('test-topic에서 메시지를 수신하여 비즈니스 로직을 실행합니다.\n');
    
    // 메시지 통계를 위한 상태
    let totalMessages = 0;
    let userMessageCounts = {};
    let textAnalysis = {
      totalWords: 0,
      uniqueWords: new Set(),
      averageLength: 0
    };
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageData = JSON.parse(message.value.toString());
          
          console.log(`\n=== 메시지 스트림 처리 ===`);
          console.log(`메시지 ID: ${messageData.id}`);
          console.log(`사용자: ${messageData.user}`);
          console.log(`내용: ${messageData.text}`);
          console.log(`파티션: ${partition}, 오프셋: ${message.offset}`);
          
          // 통계 업데이트
          totalMessages++;
          userMessageCounts[messageData.user] = (userMessageCounts[messageData.user] || 0) + 1;
          
          // 텍스트 분석
          const words = messageData.text.split(' ');
          textAnalysis.totalWords += words.length;
          words.forEach(word => textAnalysis.uniqueWords.add(word));
          textAnalysis.averageLength = textAnalysis.totalWords / totalMessages;
          
          // 실시간 통계 출력
          console.log('\n--- 실시간 통계 ---');
          console.log(`총 메시지 수: ${totalMessages}`);
          console.log(`사용자별 메시지 수:`, userMessageCounts);
          console.log(`총 단어 수: ${textAnalysis.totalWords}`);
          console.log(`고유 단어 수: ${textAnalysis.uniqueWords.size}`);
          console.log(`평균 메시지 길이: ${textAnalysis.averageLength.toFixed(1)} 단어`);
          
          // 비즈니스 로직: 특정 조건에 따른 처리
          if (messageData.text.length > 10) {
            console.log('📝 긴 메시지 감지! 상세 분석 로직 실행');
          }
          
          if (userMessageCounts[messageData.user] > 2) {
            console.log('👤 활성 사용자! 우선 처리 로직 실행');
          }
          
          if (messageData.text.includes('카프카') || messageData.text.includes('kafka')) {
            console.log('🔍 카프카 관련 메시지! 전문가 모드 활성화');
          }
          
        } catch (error) {
          console.error('메시지 처리 실패:', error);
        }
      },
    });
    
    console.log('스트림 처리 실행 중... (Ctrl+C로 종료)');
    
  } catch (error) {
    console.error('스트림 처리 시작 실패:', error);
  }
}

// 스트림 처리 예제 실행
async function runStreamProcessingExample() {
  console.log('=== 카프카 스트림 처리 예제 ===\n');
  console.log('프로듀서가 test-topic에 메시지를 보내면');
  console.log('스트림 처리가 그 메시지들을 받아서 비즈니스 로직을 실행합니다.\n');
  
  // 스트림 처리 시작
  await processMessageStream();
}

// 스크립트 실행
if (require.main === module) {
  runStreamProcessingExample().catch(console.error);
}

module.exports = {
  processMessageStream
};