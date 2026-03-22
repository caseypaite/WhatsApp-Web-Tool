const axios = require('axios');
const settingsService = require('../services/settings.service');

/**
 * Service to handle AI-powered interactions.
 * Supports Gemini and Mistral AI with dynamic model selection.
 */
class AiService {
  /**
   * Generates a response using the configured LLM provider.
   */
  async generateResponse(query, context = '') {
    const isEnabled = (await settingsService.get('ai_enabled')) === 'true';
    if (!isEnabled) {
      return null;
    }

    const provider = (await settingsService.get('ai_provider')) || 'gemini';
    const model = await settingsService.get('ai_model');
    
    if (provider === 'mistral') {
      return this.generateMistralResponse(query, context, model || 'mistral-tiny');
    } else {
      return this.generateGeminiResponse(query, context, model || 'gemini-1.5-flash');
    }
  }

  async generateGeminiResponse(query, context, model) {
    const apiKey = await settingsService.get('gemini_api_key');
    if (!apiKey) return null;

    const customPrompt = await settingsService.get('ai_custom_prompt') || 
      'You are a helpful community assistant for WhatsApp Web Tool. Keep responses concise and professional.';

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: `${customPrompt}
                     Context: ${context}
                     User Query: ${query}`
            }]
          }]
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.error('[AI-GEMINI] Error:', err.message);
      return `Gemini (${model}) is currently unavailable.`;
    }
  }

  async generateMistralResponse(query, context, model) {
    const apiKey = await settingsService.get('mistral_api_key');
    if (!apiKey) return null;

    const customPrompt = await settingsService.get('ai_custom_prompt') || 
      'You are a helpful community assistant for WhatsApp Web Tool. Keep responses concise and professional.';

    try {
      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: `${customPrompt} Context: ${context}`
            },
            {
              role: 'user',
              content: query
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (err) {
      console.error('[AI-MISTRAL] Error:', err.message);
      return `Mistral (${model}) is currently unavailable.`;
    }
  }
}

module.exports = new AiService();
