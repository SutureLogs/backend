function extractJsonSubstring(text) {
    let jsonStartIndex = text.indexOf("{");
    let jsonEndIndex = text.lastIndexOf("}");
  
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error("No valid JSON found in the text.");
    }
  
    let jsonString = text.slice(jsonStartIndex, jsonEndIndex + 1);
  
    try {
      let jsonData = JSON.parse(JSON.stringify(jsonString));
      return jsonData;
    } catch (error) {
      throw new Error("Invalid JSON found in the text.");
    }
  }
module.exports = extractJsonSubstring;