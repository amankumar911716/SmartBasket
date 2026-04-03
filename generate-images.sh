#!/bin/bash
# Generate product images sequentially with delays to avoid rate limiting

generate() {
  local prompt="$1"
  local output="$2"
  local retries=3
  
  for attempt in $(seq 1 $retries); do
    result=$(z-ai image -p "$prompt" -o "$output" -s 1024x1024 2>&1)
    if echo "$result" | grep -q "File saved"; then
      echo "✅ $output"
      return 0
    fi
    echo "⚠️ Retry $attempt for $output"
    sleep 5
  done
  echo "❌ FAILED: $output"
  return 1
}

echo "=== Generating remaining product images ==="

# Retry failed ones
generate "Crisp fresh red Shimla apples stacked on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/apple-shimla.png"
sleep 2
generate "Premium Alphonso mangoes golden ripe arranged on white surface, professional product photography, warm lighting, high quality, detailed, no text" "./public/products/mango-alphonso.png"
sleep 2
generate "Fresh watermelon sliced showing red flesh on white marble, professional product photography, bright lighting, high quality, detailed, no text" "./public/products/watermelon.png"
sleep 2
generate "Fresh green seedless grapes in bowl on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/grapes-green.png"
sleep 2

# Vegetables
generate "Fresh brown potatoes in basket on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/potato.png"
sleep 2
generate "Fresh green spinach leaves bunch on white marble surface, professional product photography, natural lighting, high quality, detailed, no text" "./public/products/spinach.png"
sleep 2
generate "Fresh green capsicum peppers on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/capsicum-green.png"
sleep 2
generate "Fresh orange carrots stacked on white marble, professional product photography, bright lighting, high quality, detailed, no text" "./public/products/carrot.png"
sleep 2

# Dairy
generate "Full cream milk bottle glass on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/full-cream-milk.png"
sleep 2
generate "Thick creamy curd dahi in ceramic bowl on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/curd.png"
sleep 2
generate "Farm fresh white eggs in carton on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/eggs.png"
sleep 2
generate "Fresh soft paneer cubes on white marble plate, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/paneer.png"
sleep 2
generate "Amul unsalted butter block on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/butter.png"
sleep 2

# Snacks
generate "Lays classic salted chips packet on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/lays-classic.png"
sleep 2
generate "Parle-G glucose biscuits packet on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/parle-g.png"
sleep 2
generate "Haldiram aloo bhujia packet on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/aloo-bhujia.png"
sleep 2
generate "Coca-Cola bottle and glass on white marble with ice, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/coca-cola.png"
sleep 2
generate "Maggi noodles 2-minute packet on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/maggi-noodles.png"
sleep 2

# Dry fruits
generate "Premium California almonds in wooden bowl on white marble, professional product photography, warm lighting, high quality, detailed, no text" "./public/products/almonds.png"
sleep 2
generate "Premium whole cashew nuts W240 grade in white bowl, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/cashew-w240.png"
sleep 2
generate "Sweet green raisins kishmish in glass jar on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/raisins.png"
sleep 2
generate "Premium roasted salted pistachios in shell on white marble, professional product photography, warm lighting, high quality, detailed, no text" "./public/products/pistachios.png"
sleep 2

# Household
generate "Surf Excel washing machine detergent box on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/surf-excel.png"
sleep 2
generate "Vim dishwash gel bottle on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/vim-dishwash.png"
sleep 2
generate "Harpic toilet cleaner bottle on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/harpic.png"
sleep 2

# Personal care
generate "Dove moisturizing body wash bottle on white marble with foam, professional product photography, soft lighting, high quality, detailed, no text" "./public/products/dove-body-wash.png"
sleep 2
generate "Colgate MaxFresh toothpaste tube on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/colgate-maxfresh.png"
sleep 2
generate "Head and Shoulders anti-dandruff shampoo bottle on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/h-s-shampoo.png"
sleep 2

# Staples
generate "India Gate premium basmati rice bag on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/basmati-rice.png"
sleep 2
generate "Tata Sampann toor dal packet on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/toor-dal.png"
sleep 2
generate "Aashirvaad whole wheat atta bag on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/atta.png"
sleep 2
generate "Fortune sunflower refined oil bottle on white background, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/refined-oil.png"
sleep 2
generate "White refined sugar crystals in glass jar on white marble, professional product photography, studio lighting, high quality, detailed, no text" "./public/products/sugar.png"
sleep 2

echo "=== All product images generated ==="
