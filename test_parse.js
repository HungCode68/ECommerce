const option_values = '{"Màu sắc": "Hồng", "RAM": "8GB"}';
const parts = option_values.split(',');
parts.forEach(part => {
  const splitCol = part.split(':');
  const key = splitCol[0].trim();
  const value = splitCol.slice(1).join(':').trim();
  console.log(`Key: ${key}, Value: ${value}`);
});
