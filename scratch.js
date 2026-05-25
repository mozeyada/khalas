const str = "٠١٠١٢٣٤٥٦٧٨";
console.log("Original:", str);
console.log("Replaced:", str.replace(/[^\d+]/g, ''));
