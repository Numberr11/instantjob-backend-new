// Function to capitalize each word's first character in a string
const capitalizeTitle = (title) => {
    return title
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const capitalizeSentenceCase = (text) => {
    // Capitalize the first letter of the first word and each sentence after a period.
    return text
      .split(".") // Split the text into sentences
      .map((sentence, index) => {
        sentence = sentence.trim(); // Trim extra spaces
        if (sentence.length === 0) return ""; // Skip empty sentences
        // Capitalize the first letter of the sentence
        return sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase();
      })
      .join(". "); // Join sentences back with a period and space
  };
  
  module.exports = {
    capitalizeTitle,
    capitalizeSentenceCase
  };
  