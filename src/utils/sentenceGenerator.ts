import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface SentenceData {
  chinese: string;
  english: string;
}

export async function generateSentence(hanzi: string, english: string): Promise<SentenceData> {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates simple Chinese sentences using specific characters. Always respond with a JSON object containing 'chinese' and 'english' fields. The Chinese sentence should use the given character naturally, and the English should be a clear translation."
        },
        {
          role: "user",
          content: `Create a simple Chinese sentence using the character "${hanzi}" (which means "${english}"). Make it natural and easy to understand. Respond with JSON format: {"chinese": "your sentence", "english": "translation"}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const content = response.choices[0].message.content;
    
    // Try to parse the JSON response
    let sentenceData: SentenceData;
    try {
      sentenceData = JSON.parse(content || '{}');
    } catch (parseError) {
      // If JSON parsing fails, create a fallback response
      sentenceData = {
        chinese: `${hanzi}是一个很好的词。`,
        english: `${english} is a good word.`
      };
    }

    // Validate the response has the required fields
    if (!sentenceData.chinese || !sentenceData.english) {
      sentenceData = {
        chinese: `${hanzi}是一个很好的词。`,
        english: `${english} is a good word.`
      };
    }

    return sentenceData;

  } catch (error) {
    console.error('Error generating sentence:', error);
    
    // Return fallback data on error
    return {
      chinese: `${hanzi}是一个很好的词。`,
      english: `${english} is a good word.`
    };
  }
}
