import { Hall, AddonOption } from '../types';

const hallAlphaImg = '/images/hall_alpha.jpeg';
const hallAlpha2Img = '/images/hall_alpha2.jpeg';
const hallB1Img = '/images/hall_b_view_one.jpeg';
const hallB2Img = '/images/hall_b_view_two.jpeg';
const hallBPanoramicImg = '/images/hall_b_panoramic.jpeg';
const surauFacilityImg = '/images/surau.jpeg';

export const HALLS_DATA: Hall[] = [
  {
    id: 'hall-alpha',
    name: 'ALPHA HALL',
    tagline: 'Equipped space for seminars, meetings & classes',
    description: 'Fully equipped hall with AV system, projector, air conditioning, and surau access.',
    maxCapacity: 53,
    minCapacity: 1,
    pricePerHour: 40,
    overtimeRatePerHour: 60,
    halfDayRate: 149,
    fullDayRate: 299,
    sizeSqFt: 650,
    primaryImage: hallAlphaImg,
    secondaryImages: [hallAlpha2Img, surauFacilityImg],
    badgeText: 'ALPHA HALL • RM149 Half Day / RM299 Full Day',
    features: [
      '13 Tables & 53 Chairs',
      '1 Projector & 1 Television',
      '3 Microphones & Speaker System',
      'Air-Conditioned & Surau Access'
    ],
    amenities: [
      {
        iconName: 'Tv',
        title: 'Projector & TV',
        description: '1 projector and 1 TV for slides and visual media'
      },
      {
        iconName: 'Mic',
        title: '3 Mics & Sound System',
        description: '3 microphones with clear speaker system'
      },
      {
        iconName: 'Users',
        title: '13 Tables & 53 Chairs',
        description: 'Arranged setup for seminars and classes'
      },
      {
        iconName: 'Wind',
        title: 'Air-Con & Surau Access',
        description: 'Air-conditioned space with nearby surau and toilets'
      }
    ],
    floorPlanSpec: {
      dimensions: '30ft x 22ft',
      ceilingHeight: '10ft Ceiling',
      stageDimensions: 'Presenter Area',
      parkingCapacity: 'Visitor Parking'
    },
    idealFor: [
      'Seminars & Meetings',
      'Workshops & Training',
      'Classes & Recordings'
    ]
  },
  {
    id: 'hall-b',
    name: 'HALL B',
    tagline: 'Ideal for small gatherings, private events & meetings',
    description: 'Comfortable event space with dining setups, lounge seating, air conditioning, and surau access.',
    maxCapacity: 31,
    minCapacity: 1,
    pricePerHour: 40,
    overtimeRatePerHour: 60,
    halfDayRate: 149,
    fullDayRate: 299,
    sizeSqFt: 750,
    primaryImage: hallBPanoramicImg,
    secondaryImages: [hallB1Img, hallB2Img, surauFacilityImg],
    badgeText: 'HALL B • RM149 Half Day / RM299 Full Day',
    features: [
      '31 Chairs & 7 Round Tables',
      'Dining & Food Serving Tables',
      'Lounge Sofas & Coffee Table',
      '3 Microphones & Speaker System',
      'Air-Conditioned & Surau Access'
    ],
    amenities: [
      {
        iconName: 'Armchair',
        title: 'Lounge Seating',
        description: 'Sofas, lounge chairs, and coffee table'
      },
      {
        iconName: 'Utensils',
        title: 'Dining Setup',
        description: '7 round tables, dining table, and serving table'
      },
      {
        iconName: 'Mic',
        title: '3 Mics & Sound System',
        description: '3 microphones with clear speaker system'
      },
      {
        iconName: 'Wind',
        title: 'Air-Con & Surau Access',
        description: 'Air-conditioned space with nearby surau and toilets'
      }
    ],
    floorPlanSpec: {
      dimensions: '32ft x 24ft',
      ceilingHeight: '10ft Ceiling',
      stageDimensions: 'Discussion Zone',
      parkingCapacity: 'Visitor Parking'
    },
    idealFor: [
      'Small Gatherings & Celebrations',
      'Private Meetings & Discussions',
      'Workshops & Networking'
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
