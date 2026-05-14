const optionValues = '{"Màu sắc": "Hồng", "RAM": "8GB"}';

function parseVariantAttributes(optionValues) {
  if (!optionValues) return {}

  return optionValues
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const splitCol = part.split(':')
      const [label, ...rest] = splitCol
      const key = label?.trim()
      const value = rest.join(':').trim()
      if (key && value) acc[key] = value
      return acc
    }, {})
}

console.log(parseVariantAttributes(optionValues));

const optionValues2 = '[{"label": "Màu sắc", "value": "Hồng"}, {"label": "RAM", "value": "8GB"}]';
console.log(parseVariantAttributes(optionValues2));

