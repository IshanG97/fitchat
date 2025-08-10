export interface PromptsConfig {
  fitness_coach_system: string;
  video_form_analysis: string;
  video_analysis_followup: string;
  video_processing_error: string;
  whatsapp_templates: {
    fitchat_welcome: {
      name: string;
      language: string;
      components: Array<{
        type: string;
        text: string;
      }>;
    };
  };
}

declare const prompts: PromptsConfig;
export default prompts;