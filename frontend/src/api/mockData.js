// 模拟的“地点时间胶囊”问题库
export const mockQuestions = [
  {
    id: 'q_001',
    city: '上海',
    location: '武康大楼',
    address: '上海市徐汇区淮海中路1850号',
    lat: 31.205,
    lng: 121.436,
    question: '这栋楼现在的游客还多吗？楼下那家冰淇淋店还在吗？',
    image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&q=80',
    createTime: '2024-05-01',
    targetDate: '2025-05-01',
    status: 'pending'
  },
  {
    id: 'q_002',
    city: '北京',
    location: '故宫角楼',
    address: '北京市东城区景山前街4号',
    lat: 39.928,
    lng: 116.397,
    question: '角楼前面的那棵老树还在吗？冬天有没有人在这里拍婚纱照？',
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80',
    createTime: '2024-06-15',
    targetDate: '2025-06-15',
    status: 'pending'
  },
  {
    id: 'q_003',
    city: '杭州',
    location: '西湖断桥',
    address: '浙江省杭州市西湖区北山街',
    lat: 30.259,
    lng: 120.148,
    question: '冬天断桥残雪的景色变了吗？现在人多不多？',
    image: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?w=400&q=80',
    createTime: '2024-08-20',
    targetDate: '2025-08-20',
    status: 'pending'
  }
]

// 模拟用户当前的行程
export const mockTrips = [
  { id: 't_001', city: '上海', startDate: '2025-04-01', endDate: '2025-04-03' },
  { id: 't_002', city: '北京', startDate: '2025-05-10', endDate: '2025-05-12' }
]