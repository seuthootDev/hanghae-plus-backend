const { Kafka } = require('kafkajs');

// 카프카 클라이언트 설정
const kafka = new Kafka({
  clientId: 'topic-management-app',
  brokers: ['localhost:9092']
});

// 어드민 클라이언트 생성
const admin = kafka.admin();

// 토픽 생성
async function createTopic(admin, topicName, numPartitions = 1, replicationFactor = 1) {
  try {
    console.log(`토픽 '${topicName}' 생성 중...`);
    
    await admin.createTopics({
      topics: [{
        topic: topicName,
        numPartitions: numPartitions,
        replicationFactor: replicationFactor,
        configEntries: [
          {
            name: 'cleanup.policy',
            value: 'delete'
          },
          {
            name: 'retention.ms',
            value: '86400000' // 24시간
          }
        ]
      }]
    });
    
    console.log(`토픽 '${topicName}' 생성 완료!`);
  } catch (error) {
    if (error.type === 'TOPIC_ALREADY_EXISTS') {
      console.log(`토픽 '${topicName}'은 이미 존재합니다.`);
    } else {
      console.error('토픽 생성 실패:', error);
    }
  }
}

// 토픽 목록 조회
async function listTopics(admin) {
  try {
    console.log('=== 토픽 목록 ===');
    const topics = await admin.listTopics();
    
    if (topics.length === 0) {
      console.log('생성된 토픽이 없습니다.');
    } else {
      topics.forEach((topic, index) => {
        console.log(`${index + 1}. ${topic}`);
      });
    }
    
    return topics;
  } catch (error) {
    console.error('토픽 목록 조회 실패:', error);
    return [];
  }
}

// 토픽 상세 정보 조회
async function describeTopic(admin, topicName) {
  try {
    console.log(`=== 토픽 '${topicName}' 상세 정보 ===`);
    
    const metadata = await admin.fetchTopicMetadata({
      topics: [topicName]
    });
    
    if (metadata.topics.length > 0) {
      const topic = metadata.topics[0];
      console.log(`토픽명: ${topic.name}`);
      console.log(`파티션 수: ${topic.partitions.length}`);
      console.log(`복제 팩터: ${topic.partitions[0]?.replicas?.length || 'N/A'}`);
      
      topic.partitions.forEach((partition, index) => {
        console.log(`  파티션 ${index}: 리더 ${partition.leader}, 복제본 ${partition.replicas.join(', ')}`);
      });
    } else {
      console.log(`토픽 '${topicName}'을 찾을 수 없습니다.`);
    }
  } catch (error) {
    console.error('토픽 정보 조회 실패:', error);
  }
}

// 토픽 삭제
async function deleteTopic(admin, topicName) {
  try {
    console.log(`토픽 '${topicName}' 삭제 중...`);
    
    await admin.deleteTopics({
      topics: [topicName]
    });
    
    console.log(`토픽 '${topicName}' 삭제 완료!`);
  } catch (error) {
    console.error('토픽 삭제 실패:', error);
  }
}

// 토픽 관리 예제 실행
async function runTopicManagementExample() {
  console.log('=== 카프카 토픽 관리 예제 ===\n');
  
  try {
    // admin 연결
    await admin.connect();
    console.log('카프카 어드민 연결 완료!\n');
    
    // 1. 토픽 목록 조회 (프로듀서가 생성한 토픽들 확인)
    const topics = await listTopics(admin);
    
    // 2. 사용자 토픽들의 상세 정보 조회
    const userTopics = topics.filter(topic => 
      !topic.startsWith('__') && // 시스템 토픽 제외
      topic !== 'example-topic-1' && 
      topic !== 'example-topic-2'
    );
    
    if (userTopics.length > 0) {
      console.log('\n=== 사용자 토픽 상세 정보 ===');
      for (const topic of userTopics) {
        await describeTopic(admin, topic);
        console.log(''); // 빈 줄 추가
      }
    } else {
      console.log('\n사용자 토픽이 없습니다.');
      console.log('프로듀서를 실행하여 토픽을 생성해보세요!');
    }
    
    // 3. 토픽 삭제 (선택사항 - 주석 해제하여 사용)
    // if (userTopics.length > 0) {
    //   console.log('토픽 삭제 테스트...');
    //   await deleteTopic(admin, userTopics[0]);
    // }
    
  } catch (error) {
    console.error('토픽 관리 예제 실행 실패:', error);
  } finally {
    // admin 연결 해제
    await admin.disconnect();
    console.log('\n카프카 어드민 연결 해제 완료!');
  }
}

// 스크립트 실행
if (require.main === module) {
  runTopicManagementExample().catch(console.error);
}

module.exports = {
  createTopic,
  listTopics,
  describeTopic,
  deleteTopic
};
