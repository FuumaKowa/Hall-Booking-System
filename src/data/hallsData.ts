import { Hall, AddonOption } from '../types';

const grandBallroomImg = '/src/assets/images/grand_ballroom_1785141625006.jpg';
const ballroomStageImg = '/src/assets/images/ballroom_stage_1785141650950.jpg';
const glasshouseHallImg = '/src/assets/images/glasshouse_hall_1785141637817.jpg';
const glasshouseGardenImg = '/src/assets/images/glasshouse_garden_1785141664159.jpg';

export const HALLS_DATA: Hall[] = [
  {
    id: 'hall-grand-horizon',
    name: 'Hall A',
    tagline: 'Fully Equipped Meeting, Seminar & Class Hall for up to 30 Guests',
    description: 'A comfortable, fully air-conditioned hall fitting around 30 people by Nilai Harta Consultant Sdn Bhd. Perfect for corporate meetings, small talks, classes, and training sessions. Complete with a normal whiteboard, prepared speaker & microphone system, normal projector, high-speed Wi-Fi, pantry with water dispenser, clean toilets, and a dedicated surau (prayer room).',
    maxCapacity: 30,
    minCapacity: 5,
    pricePerHour: 60,
    overtimeRatePerHour: 90,
    fullDayRate: 450,
    sizeSqFt: 550,
    primaryImage: grandBallroomImg,
    secondaryImages: [ballroomStageImg, grandBallroomImg],
    badgeText: 'Hall A • Up to 30 Pax',
    features: [
      'Normal HD Projector & Motorized Screen',
      'Prepared Speaker System & Handheld Wireless Mics',
      'Normal Whiteboard with Color Markers & Eraser',
      'Full Air Conditioning & High-Speed Wi-Fi',
      'Pantry Area with Hot & Cold Water Dispenser',
      'Clean On-Site Toilet & Surau (Prayer Room) Facilities'
    ],
    amenities: [
      {
        iconName: 'Tv',
        title: 'Normal Projector',
        description: 'HD projector with HDMI connection & projection screen'
      },
      {
        iconName: 'Volume2',
        title: 'Speaker & Mic Prepared',
        description: 'Crisp PA speaker system with wireless handheld microphones'
      },
      {
        iconName: 'Users',
        title: 'Normal Whiteboard',
        description: 'Whiteboard with marker pens, erasers & flipchart'
      },
      {
        iconName: 'Utensils',
        title: 'Pantry & Water Dispenser',
        description: 'Hot & cold purified water dispenser with complimentary tea/coffee'
      },
      {
        iconName: 'Sparkles',
        title: 'Toilet & Surau',
        description: 'Clean restrooms and dedicated surau (prayer room) on-site'
      },
      {
        iconName: 'Car',
        title: 'Air-Con & Wi-Fi',
        description: 'Quiet powerful air conditioning and high-speed Wi-Fi network'
      }
    ],
    floorPlanSpec: {
      dimensions: '25ft x 22ft',
      ceilingHeight: '10ft Standard Ceiling',
      stageDimensions: 'Presenter Podium & Speaker Desk Area',
      parkingCapacity: '25 Building Visitor Bays'
    },
    idealFor: [
      'Corporate Meetings & Board Discussions',
      'Public Talks & Keynote Presentations',
      'Educational Classes & Tutoring Sessions',
      'Training Workshops & Seminars',
      'Product Briefings & Team Meetings'
    ]
  },
  {
    id: 'hall-serenade-glasshouse',
    name: 'Hall B',
    tagline: 'Versatile Seminar & Training Hall for up to 35 Guests',
    description: 'Bright and spacious hall fitting up to 35 guests, ideal for workshops, classes, lectures, and corporate sessions. Fully equipped with an ultra-bright projector, 75" Smart TV, magnetic whiteboards, speaker and mic system, air conditioning, high-speed Wi-Fi, pantry with water dispenser, clean toilets, and surau access.',
    maxCapacity: 35,
    minCapacity: 5,
    pricePerHour: 75,
    overtimeRatePerHour: 115,
    fullDayRate: 550,
    sizeSqFt: 650,
    primaryImage: glasshouseHallImg,
    secondaryImages: [glasshouseGardenImg, glasshouseHallImg],
    badgeText: 'Hall B • Up to 35 Pax',
    features: [
      'Ultra-Bright Projector & 75-inch Smart TV Screen',
      'Prepared Speaker System & Clip-on / Handheld Mics',
      'Dual Whiteboards with Color Markers & Accessories',
      'Full Air Conditioning & High-Speed Wi-Fi Network',
      'Pantry Station with Hot & Cold Water Dispenser',
      'On-Site Clean Toilets & Surau (Prayer Room) Access'
    ],
    amenities: [
      {
        iconName: 'Sun',
        title: 'Projector & Smart TV',
        description: 'Dual display setup with projector + 75" Smart TV for slides & videos'
      },
      {
        iconName: 'Trees',
        title: 'Dual Whiteboards',
        description: 'Expansive whiteboards for teaching, diagrams, and brainstorming'
      },
      {
        iconName: 'Mic',
        title: 'Speaker & Mic System',
        description: 'Lecture audio system with wireless clip-on & handheld mics'
      },
      {
        iconName: 'Lightbulb',
        title: 'Air-Con & Wi-Fi',
        description: 'Silent high-capacity air conditioning & dedicated Wi-Fi'
      },
      {
        iconName: 'Wind',
        title: 'Pantry & Water Dispenser',
        description: 'Hot & cold water dispenser with instant tea & coffee'
      },
      {
        iconName: 'Coffee',
        title: 'Toilet & Surau Access',
        description: 'Clean building restrooms and quiet surau for prayer'
      }
    ],
    floorPlanSpec: {
      dimensions: '30ft x 22ft',
      ceilingHeight: '10ft Standard Ceiling',
      stageDimensions: 'Teacher Platform & Whiteboard Area',
      parkingCapacity: '30 Building Visitor Bays'
    },
    idealFor: [
      'Training Courses & Skill Workshops',
      'Educational Classes & Lectures',
      'Public Talks & Keynotes',
      'Exams & Certification Testing',
      'Community Meetings & Briefings'
    ]
  }
];

export const ADDON_OPTIONS: AddonOption[] = [
  {
    id: 'addon-projector-extra',
    name: 'Extra HD Projector & Presenter Clicker',
    category: 'av_tech',
    price: 40,
    priceUnit: 'flat',
    description: 'Includes HDMI cable, wireless presenter laser clicker, and technical assistance.',
    iconName: 'Video'
  },
  {
    id: 'addon-catering-standard',
    name: 'Bento Box / Snack Catering (Per Pax)',
    category: 'catering',
    price: 18,
    priceUnit: 'per_guest',
    description: 'Individual bento lunch or tea break set with drink, sandwich/pastry, and fruit.',
    iconName: 'Utensils'
  },
  {
    id: 'addon-sound-dj',
    name: 'Wireless Microphone Set (2 Mics)',
    category: 'av_tech',
    price: 30,
    priceUnit: 'flat',
    description: 'Dual handheld wireless microphones with receiver and fresh batteries.',
    iconName: 'Music'
  },
  {
    id: 'addon-whiteboard-pack',
    name: 'Extra Flipchart Stand & Marker Pack',
    category: 'decor',
    price: 25,
    priceUnit: 'flat',
    description: 'Mobile flipchart tripod stand with 50 sheets of paper and 4 color markers.',
    iconName: 'Flower2'
  },
  {
    id: 'addon-coffee-station',
    name: 'Premium Coffee & Tea Free-Flow Station',
    category: 'catering',
    price: 8,
    priceUnit: 'per_guest',
    description: 'Unlimited brewed coffee, tea varieties, biscuits, and bottled mineral water.',
    iconName: 'GlassWater'
  },
  {
    id: 'addon-assistant-service',
    name: 'On-Site Event & Reception Assistant',
    category: 'service',
    price: 80,
    priceUnit: 'flat',
    description: 'Dedicated staff to assist with participant registration, room setup, and technical support.',
    iconName: 'Car'
  }
];
