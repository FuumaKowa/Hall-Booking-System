import { Hall, AddonOption } from '../types';

const hallAlphaImg = '/images/Hall Alpha.png';
const hallB1Img = '/images/hall_b_view_one_1785735363397.jpg';
const hallB2Img = '/images/hall_b_view_two_1785735375099.jpg';
const hallBPanoramicImg = '/images/Hall B Panoramic.png';
const surauFacilityImg = '/images/surau.jpeg';

export const HALLS_DATA: Hall[] = [
  {
    id: 'hall-grand-horizon',
    name: 'ALPHA HALL',
    tagline: 'Affordable & fully equipped space for seminars, meetings & classes',
    description: 'Affordable, comfortable and fully equipped space at I-Madina Event Space. Ideal for seminars, corporate meetings, talks, briefings, workshops, podcast recordings, classes, tuition sessions, and training programmes.',
    maxCapacity: 53,
    minCapacity: 1,
    pricePerHour: 40,
    overtimeRatePerHour: 60,
    halfDayRate: 149,
    fullDayRate: 299,
    sizeSqFt: 650,
    primaryImage: hallAlphaImg,
    secondaryImages: [hallAlphaImg, surauFacilityImg],
    badgeText: 'ALPHA HALL • Half Day RM149 / Full Day RM299',
    features: [
      '13 Tables & 53 Chairs',
      '1 Projector & 1 Television',
      '3 Microphones & 1 Speaker System',
      'Fully Air-Conditioned',
      'Surau & Toilet Access',
      'Optional Catering (Price to be discussed)'
    ],
    amenities: [
      {
        iconName: 'Tv',
        title: '1 Projector & 1 TV',
        description: '1 projector and 1 television provided for visual media & slides'
      },
      {
        iconName: 'Mic',
        title: '3 Mics & Speaker System',
        description: '3 microphones and 1 audio speaker system'
      },
      {
        iconName: 'Users',
        title: '13 Tables & 53 Chairs',
        description: '13 setup tables and 53 comfortable chairs'
      },
      {
        iconName: 'Wind',
        title: 'Air-Con & Facilities',
        description: 'Fully air-conditioned with surau and clean toilet access'
      }
    ],
    floorPlanSpec: {
      dimensions: '30ft x 22ft',
      ceilingHeight: '10ft Ceiling',
      stageDimensions: 'Speaker & Presenter Area',
      parkingCapacity: 'Visitor Parking Available'
    },
    idealFor: [
      'Seminars & Corporate Meetings',
      'Talks and Briefings',
      'Workshops & Training Programmes',
      'Podcast Recordings',
      'Classes & Tuition Sessions'
    ]
  },
  {
    id: 'hall-serenade-glasshouse',
    name: 'HALL B',
    tagline: 'Comfortable space for small gatherings, family events & meetings',
    description: 'Comfortable and affordable event space at I-Madina Event Space. Suitable for small gatherings, birthday or anniversary celebrations, family events, private meetings, discussion sessions, networking events, and casual workshops.',
    maxCapacity: 31,
    minCapacity: 1,
    pricePerHour: 40,
    overtimeRatePerHour: 60,
    halfDayRate: 149,
    fullDayRate: 299,
    sizeSqFt: 750,
    primaryImage: hallBPanoramicImg,
    secondaryImages: [hallB1Img, hallB2Img, surauFacilityImg],
    badgeText: 'HALL B • Half Day RM149 / Full Day RM299',
    features: [
      '31 Chairs & 7 Round Tables',
      '1 Dining & 1 Food-Serving Table',
      '1 Coffee Table & Sofas / Lounge Chairs',
      '3 Microphones & 1 Speaker System',
      'Fully Air-Conditioned',
      'Surau & Toilet Access',
      'Optional Catering (Price to be discussed)'
    ],
    amenities: [
      {
        iconName: 'Armchair',
        title: 'Lounge Seating & Sofas',
        description: '2 lounge chairs, 1 two-seater sofa, 1 single-seater sofa & coffee table'
      },
      {
        iconName: 'Utensils',
        title: 'Dining & Serving Setup',
        description: '7 round tables, 1 dining table, 1 food-serving table & 31 chairs'
      },
      {
        iconName: 'Mic',
        title: '3 Mics & Speaker System',
        description: '3 microphones and 1 audio speaker system'
      },
      {
        iconName: 'Wind',
        title: 'Air-Con & Facilities',
        description: 'Fully air-conditioned with surau and clean toilet access'
      }
    ],
    floorPlanSpec: {
      dimensions: '32ft x 24ft',
      ceilingHeight: '10ft Ceiling',
      stageDimensions: 'Discussion / Presentation Zone',
      parkingCapacity: 'Visitor Parking Available'
    },
    idealFor: [
      'Small Gatherings & Family Events',
      'Birthday & Anniversary Celebrations',
      'Private Meetings & Discussions',
      'Networking Events',
      'Casual Workshops'
    ]
  }
];

export const ADDON_OPTIONS: AddonOption[] = [
  {
    id: 'addon-catering-service',
    name: 'Optional Catering Service',
    category: 'catering',
    price: 0,
    priceUnit: 'flat',
    description: 'Custom catering available upon request (bento box, tea break, buffet). Final price will be discussed with manager.',
    iconName: 'Utensils'
  },
  {
    id: 'addon-projector-extra',
    name: 'Presenter Clicker & Extra HDMI Cables',
    category: 'av_tech',
    price: 15,
    priceUnit: 'flat',
    description: 'Wireless presenter laser clicker and extra HDMI extension cables.',
    iconName: 'Video'
  },
  {
    id: 'addon-whiteboard-pack',
    name: 'Flipchart Stand & Marker Set',
    category: 'decor',
    price: 15,
    priceUnit: 'flat',
    description: 'Flipchart stand with paper pad and color markers.',
    iconName: 'Flower2'
  }
];
