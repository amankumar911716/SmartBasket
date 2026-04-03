import { db } from './src/lib/db';

const productImageMap: Record<string, string> = {
  'banana': '/products/banana.png',
  'apple-shimla': '/products/apple-shimla.png',
  'mango-alphonso': '/products/mango-alphonso.png',
  'orange-nagpur': '/products/orange-nagpur.png',
  'watermelon': '/products/watermelon.png',
  'grapes-green': '/products/grapes-green.png',
  'tomato': '/products/tomato.png',
  'onion': '/products/onion.png',
  'potato': '/products/potato.png',
  'spinach': '/products/spinach.png',
  'capsicum-green': '/products/capsicum-green.png',
  'carrot': '/products/carrot.png',
  'full-cream-milk': '/products/full-cream-milk.png',
  'curd': '/products/curd.png',
  'eggs': '/products/eggs.png',
  'paneer': '/products/paneer.png',
  'butter': '/products/butter.png',
  'lays-classic': '/products/lays-classic.png',
  'parle-g': '/products/parle-g.png',
  'aloo-bhujia': '/products/aloo-bhujia.png',
  'coca-cola': '/products/coca-cola.png',
  'maggi-noodles': '/products/maggi-noodles.png',
  'almonds': '/products/almonds.png',
  'cashew-w240': '/products/cashew-w240.png',
  'raisins': '/products/raisins.png',
  'pistachios': '/products/pistachios.png',
  'surf-excel': '/products/surf-excel.png',
  'vim-dishwash': '/products/vim-dishwash.png',
  'harpic': '/products/harpic.png',
  'dove-body-wash': '/products/dove-body-wash.png',
  'colgate-maxfresh': '/products/colgate-maxfresh.png',
  'h-s-shampoo': '/products/h-s-shampoo.png',
  'basmati-rice': '/products/basmati-rice.png',
  'toor-dal': '/products/toor-dal.png',
  'atta': '/products/atta.png',
  'refined-oil': '/products/refined-oil.png',
  'sugar': '/products/sugar.png',
};

const categoryImageMap: Record<string, string> = {
  'fruits': '/cat-fruits.png',
  'vegetables': '/cat-vegetables.png',
  'dairy': '/cat-dairy.png',
  'snacks': '/cat-snacks.png',
  'dry-fruits': '/cat-dryfruits.png',
  'household': '/cat-household.png',
  'personal-care': '/cat-personal.png',
  'staples': '/cat-staples.png',
};

async function main() {
  console.log('🖼️  Updating product images...');

  for (const [slug, image] of Object.entries(productImageMap)) {
    try {
      const result = await db.product.updateMany({
        where: { slug },
        data: { image },
      });
      console.log(`  ✅ ${slug}: ${result.count} product(s) updated`);
    } catch (e) {
      console.log(`  ❌ ${slug}: failed`);
    }
  }

  console.log('🖼️  Updating category images...');

  for (const [slug, image] of Object.entries(categoryImageMap)) {
    try {
      const result = await db.category.updateMany({
        where: { slug },
        data: { image },
      });
      console.log(`  ✅ ${slug}: ${result.count} category(ies) updated`);
    } catch (e) {
      console.log(`  ❌ ${slug}: failed`);
    }
  }

  console.log('✅ All images updated!');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
