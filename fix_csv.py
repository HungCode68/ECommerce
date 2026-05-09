import csv

input_file = 'products_template.csv'
output_file = 'products_template_fixed.csv'

with open(input_file, 'r', encoding='utf-8') as f:
    # We can't use csv.reader directly because the input is broken
    lines = f.readlines()

header = "Name,Slug,MinPrice,DiscountPercent,ShortDescription,Description,Brand,Status,CategoryIDs"

# Correct products (9 fields)
products = []

for line in lines:
    line = line.strip()
    if not line or line.startswith("Name,Slug"):
        continue
    
    # Try to parse manually by splitting from the ends
    # 1. Name
    # 2. Slug
    # 3. MinPrice
    # 4. DiscountPercent
    # 5. ShortDescription (Variable)
    # 6. Description (Variable)
    # 7. Brand
    # 8. Status
    # 9. CategoryIDs
    
    parts = line.split(',')
    
    if len(parts) == 9:
        products.append(parts)
    else:
        # Broken line due to commas in descriptions
        # We know the first 4 fields and the last 3 fields are usually fixed (no commas)
        # So fields 0, 1, 2, 3 and fields -3, -2, -1 are safe
        name = parts[0]
        slug = parts[1]
        min_price = parts[2]
        discount = parts[3]
        
        brand = parts[-3]
        status = parts[-2]
        cat_id = parts[-1]
        
        # The middle part is ShortDescription and Description
        # This is tricky because we don't know where ShortDescription ends and Description starts
        # But looking at my generator, ShortDescription was usually the 5th field
        # Let's try to assume ShortDescription is the 5th field (parts[4])
        # And the rest is Description
        
        short_desc = parts[4]
        # Everything from parts[5] to the one before brand is the description
        description = ",".join(parts[5:-3])
        
        products.append([name, slug, min_price, discount, short_desc, description, brand, status, cat_id])

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerow(header.split(','))
    writer.writerows(products)
