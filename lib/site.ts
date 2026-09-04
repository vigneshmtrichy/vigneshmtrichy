export const WHATSAPP_URL = 'https://wa.me/919585808590'

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Our Products', href: '/products' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
] as const

export type ProductCategory = 'kids' | 'adults'

export type Product = {
  slug: string
  name: string
  tagline: string
  descLines: [string, string]
  image: string
  category: ProductCategory
  badges: string[]
  
  description?: string
  ingredients?: string
  nutrition?: string[]
  preparation?: string
  packSize?: string
  price?: string
  allergen?: string
storage?: string
countryOfOrigin?: string
manufacturedBy?: string
}

/** Standard TENOO feature badges shown on every product card. */
export const PRODUCT_BADGES = [
  'Rich in Fiber',
  'Rich in Protein',
  'No Refined Sugar',
] as const

export const KIDS_PRODUCTS: Product[] = [
  {
  slug: 'millet-abc',
  name: 'Meltiva Nutrimix',
  tagline: 'Nuts, Seeds & Millets For Growing You',
  descLines: ['Nuts, Seeds & Millets', 'For Growing You'],
  image: '/products/millet-abc.png',
  category: 'kids',
  badges: [],
  description:
    'A thoughtfully crafted blend made with milk solids, barley malt, nuts, millets, fruits, vegetables and cardamom.',
  ingredients:
    'Brown sugar, Milk solids, Barley Malt Powder, Almond, Cashew, Ragi, Pearl Millet, Carrot, Apple, Beetroot and Cardamom.',
  nutrition: [
    'Energy: 386 kcal',
    'Carbohydrates: 79.90 g',
    'Sugars: 29.11 g',
    'Protein: 9.16 g',
    'Total Fat: 3.29 g',
    'Calcium: 68.14 mg',
    'Iron: 0.89 mg',
  ],
  preparation:
    'Add 1 tablespoon of Meltiva Nutrimix to 90 ml of warm milk. Just mix and enjoy.',
  packSize: '200g',
  price: '',
  allergen: 'Contains Milk, Nuts and Barley.',

storage:
  'Store in a dry place, away from direct sunlight. Keep in an airtight container.',

countryOfOrigin: 'India',

manufacturedBy:
  'Tiny Dot Foods Private Limited, 51, Kavarai Street, Athipet, Chennai - 600058.',
  },
  {
    slug: 'pink-abc',
    name: 'Rubyblend Nutrimix',
    tagline: 'Nuts, Seeds & Beetroot Mix For Stronger You',
    descLines: ['Nuts, Seeds & Beetroot Mix', 'For Stronger You'],
    image: '/products/pink-abc.png',
    category: 'kids',
    badges: [...PRODUCT_BADGES],

    description:
      'A thoughtfully crafted blend made with milk solids, beetroot, barley malt, nuts, apple, carrot and cardamom.',

    ingredients:
      'Milk solids, Beetroot, Brown sugar, Barley Malt Powder, Almond, Cashew, Apple, Carrot and Cardamom.',

    nutrition: [
      'Energy: 389 kcal',
      'Carbohydrates: 83.0 g',
      'Sugars: 44.6 g',
      'Protein: 9.14 g',
      'Total Fat: 2.32 g',
    ],

    preparation:
      'Add 1 tablespoon of Rubyblend Nutrimix to 90 ml of warm milk. Just mix and enjoy.',

    packSize: '250g',

    price: '',

    allergen: 'Contains Milk, Nuts and Barley.',

    storage:
      'Store in a dry place, away from direct sunlight. Keep in an airtight container.',

    countryOfOrigin: 'India',

    manufacturedBy:
      'Tiny Dot Foods Private Limited, 51, Kavarai Street, Athipet, Chennai - 600058.',
  },
  {
    slug: 'black-rice-milk-mix',
    name: 'Karuppu Kavuni Cocoa Mix',
    tagline: 'Natural & Creamy For Everyday Energy',
    descLines: ['Natural & Creamy', 'For Everyday Energy'],
    image: '/products/black-rice-milk-mix.png',
    category: 'kids',
    badges: [...PRODUCT_BADGES],

    description:
      'A wholesome cocoa mix made with black rice flakes, cocoa solids, milk solids and barley malt.',

    ingredients:
      'Brown sugar, Black rice flake, Cocoa solids, Milk solids, Barley malt.',

    nutrition: [
      'Energy: 389 kcal',
      'Carbohydrates: 83.50 g',
      'Sugars: 38.0 g',
      'Protein: 10.4 g',
      'Total Fat: 1.48 g',
      'Sodium: 182 mg',
      'Calcium: 218 mg',
      'Iron: 10.78 mg',
    ],

    preparation:
      'Add 1 tablespoon of Karuppu Kavuni Cocoa Mix to 90 ml of milk, cook for 3 minutes and enjoy.',

    packSize: '250g',

    price: '',

    allergen: 'Contains Milk and Barley.',

    storage:
      'Store in a dry place, away from direct sunlight. Keep in an airtight container.',

    countryOfOrigin: 'India',

    manufacturedBy:
      'Tiny Dot Foods Private Limited, 51, Kavarai Street, Athipet, Chennai - 600058.',
  },
  {
    slug: 'cotton-milk-mix',
    name: 'Cotton Seed Milk Mix',
    tagline: 'Natural & Nutritious For Everyday Wellness',
    descLines: ['Natural & Nutritious', 'For Everyday Wellness'],
    image: '/products/cotton-milk-mix.png',
    category: 'kids',
    badges: [...PRODUCT_BADGES],

    description:
      'A traditional cotton seed milk mix made with cotton seed, rice flour, nuts, barley malt, palm jaggery and warming spices.',

    ingredients:
      'Cotton seed, Raw rice flour, Brown sugar, Peanut flour, Almond powder, Barley malt powder, Crystal palm jaggery, Dry ginger powder, Pepper powder, Cardamom.',

    nutrition: [
      'Energy: 452 kcal',
      'Carbohydrates: 68 g',
      'Sugars: 28.11 g',
      'Protein: 13.8 g',
      'Total Fat: 13.9 g',
      'Calcium: 48.6 mg',
    ],

    preparation:
      'Add 1 tablespoon of Cotton Seed Mix to 90 ml of warm milk. Just mix and enjoy.',

    packSize: '200g',

    price: '',

    allergen: 'Contains Nuts and Barley.',

    storage:
      'Store in a dry place, away from direct sunlight. Keep in an airtight container.',

    countryOfOrigin: 'India',

    manufacturedBy:
      'Tiny Dot Foods Private Limited, 51, Kavarai Street, Athipet, Chennai - 600058.',
  },
]

export const ADULT_PRODUCTS: Product[] = [
{
  slug: 'pirandai-rice-mix',
  name: 'Pirandai Rice Mix',
  tagline: 'Traditional Taste. Modern Convenience.',
  descLines: ['Traditional Taste', 'Modern Convenience'],
  image: '/products/pirandai-rice-mix.png',
  category: 'adults',
  badges: [...PRODUCT_BADGES],

  description:
    'A traditional Pirandai rice mix made with Pirandai, lentils, spices, tamarind and rice. A convenient blend that brings traditional flavour to rice, idli and dosa.',

  ingredients:
    'Pirandai, Toor dal, Green gram, Urad dal, Chana dal, Asafoetida, Tamarind, Pepper, Chilli, Coriander, Cumin, Salt, Rice.',

  nutrition: [
    'Carbohydrates: 68.53 kcals',
    'Protein: 15.51 g',
    'Total Fiber: 1.83 g',
    'Sodium: 2.73 g',
    'Calcium: 164.41 mg',
    'Potassium: 69.95 mg',
    'Phosphorus: 23.30 mg',
    'Iron: 1.98 mg',
  ],

  preparation:
    'Add 2–3 tablespoons of Pirandai Rice Mix to a portion of cooked rice. Add edible oil or ghee, mix well and enjoy. It can also be used as a side dish for idli or dosa.',

  packSize: '200g',

  price: '',

  allergen: 'Please check the ingredient list for possible allergens.',

  storage:
    'Once opened, transfer the contents to an airtight container. Store in a cool, dry place. As no preservatives are added, the product may be vulnerable to microorganisms or pests.',

  countryOfOrigin: 'India',

  manufacturedBy:
    'Veetoon, No. 68/B2, Erode Main Road, Muthur, Tiruppur Dt, Tamil Nadu, India - 638105.',
},
{
  slug: 'mudavattu-kilangu-rice-mix',
  name: 'Mudavattu Kilangu Rice Mix',
  tagline: 'Traditional Taste. Simple & Convenient.',
  descLines: ['Traditional Taste', 'Simple & Convenient'],
  image: '/products/mudavatu-rice-mix.png',
  category: 'adults',
  badges: [...PRODUCT_BADGES],

  description:
    'A traditional Mudavattu Kizhanghu rice mix blended with toor dal, green gram, urad dal, coriander, cumin seeds, pepper, chilli, tamarind, asafoetida and salt.',

  ingredients:
    'Mudavaattu Kizhanghu, Toor dal, Green gram, Urad dal, Coriander, Cumin seeds, Pepper, Chilli, Tamarind, Asafoetida, Salt.',

  nutrition: [
    'Energy: 353.75 Kcals',
    'Carbohydrates: 72.24 g',
    'Total Protein: 5.12 g',
    'Total Fat: 4.42 g',
    'Dietary Fiber: 1.85 g',
    'Cholesterol: 0 mg',
  ],

  preparation:
    'Add enough quantity of Mudavattu Kizhanghu Rice Mix to cooked rice, add edible oil, mix and eat.',

  packSize: '200g',

  price: '',

  allergen:
    'Please check the ingredient list for possible allergens.',

  storage:
    'Store in a cool and dry place. Keep it airtight.',

  countryOfOrigin: 'India',

  manufacturedBy:
    'Veetoon, 68/B2, Erode Road (West), Muthur Post, Tiruppur Dt - 638105, Tamil Nadu, India.',
},
   {
     slug: 'mudavaattu-kizhangu-soup-mix',
     name: 'Mudavaattu Kizhangu Soup Mix',
     tagline: 'Traditional & Wholesome Soup For Everyday Wellness',
     descLines: ['Traditional & Wholesome Soup', 'For Everyday Wellness'],
     image: '/products/mudavatu-soup-mix.png',
     category: 'adults',
     badges: [...PRODUCT_BADGES],

     description:
       'A traditional soup mix made with Mudavaattu Kizhangu, lentils, seeds, herbs and warming spices for a wholesome everyday soup.',

     ingredients:
       'Mudavaattu Kizhangu, Pepper, Fennel Seeds, Black Urad Dal, Toor Dal, Chana Dal, Cumin Seeds, Coriander, Dried Ginger, Garlic, Cinnamon, Curry Leaves, Salt, Clove, Turmeric & Bay Leaf.',

     nutrition: [
       'Energy: 394.43 kcal',
       'Carbohydrates: 77.24 g',
       'Total Fibre: 8.42 g',
       'Total Fat: 6.99 g',
       'Total Protein: 4.53 g',
       'Calcium: 2596 mg',
       'Potassium: 495 mg',
       'Cholesterol: 0 mg',
     ],

     preparation:
       'Mix 1 teaspoon of Mudavaattu Kizhangu Soup Mix in 2 glasses of water. Boil for 5–7 minutes and consume warm.',

     packSize: '150g',

     price: '',

     allergen:
       'May contain nuts, wheat/gluten or sesame. Check the ingredient list before use if you have any food allergies.',

     storage:
       'Store in a cool and dry place. Keep the pack airtight after opening.',

     countryOfOrigin: 'India',

     manufacturedBy:
       'Veetoon, No. 68/B2, Erode Main Rd, Muthur Post, Tiruppur Dt - 638105, Tamil Nadu, India.',
   },
]

export const ALL_PRODUCTS: Product[] = [...KIDS_PRODUCTS, ...ADULT_PRODUCTS]

export function getProductBySlug(slug: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.slug === slug)
}

export function whatsAppOrderUrl(productName: string): string {
  const message = `Hi TENOO, I would like to order ${productName}.`
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`
}