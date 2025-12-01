import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { HazardType, Severity } from '../types';

// Types for audio processing
interface AudioBlob {
  data: string;
  mimeType: string;
}

// Tools Definition
const reportHazardTool: FunctionDeclaration = {
  name: 'reportHazard',
  parameters: {
    type: Type.OBJECT,
    description: 'Report a new road hazard based on user description. Use this when user says "There is a pothole", "Accident ahead", etc.',
    properties: {
      type: {
        type: Type.STRING,
        enum: Object.values(HazardType),
        description: 'The type of hazard reported.',
      },
      severity: {
        type: Type.STRING,
        enum: Object.values(Severity),
        description: 'The severity of the hazard. Infer from user tone and description (e.g. "Huge" = HIGH/CRITICAL).',
      },
      description: {
        type: Type.STRING,
        description: 'A brief 5-10 word description of the hazard.',
      },
    },
    required: ['type', 'description'],
  },
};

const getHazardsTool: FunctionDeclaration = {
  name: 'getHazardsNearby',
  parameters: {
    type: Type.OBJECT,
    description: 'Get a list of existing hazards nearby to read out to the user. Use when user asks "Is the road safe?", "Any alerts?", "What\'s ahead?".',
    properties: {},
  },
};

// Helper: Decode Base64 to ArrayBuffer
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Encode ArrayBuffer to Base64
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Create PCM Blob for Gemini
function createBlob(data: Float32Array): AudioBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Helper: Decode raw PCM from Gemini to AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private sessionPromise: Promise<any> | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(
    onToolCall: (name: string, args: any) => Promise<any>,
    onStatusChange: (status: 'connected' | 'disconnected' | 'error') => void
  ) {
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Get Microphone
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            onStatusChange('connected');
            this.startAudioInput();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext) {
               this.playAudio(base64Audio);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              this.stopAudioPlayback();
            }

            // Handle Tool Calls
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                const result = await onToolCall(fc.name, fc.args);
                this.sessionPromise?.then(session => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: result }
                    }
                  });
                });
              }
            }
          },
          onclose: () => {
             onStatusChange('disconnected');
          },
          onerror: (e) => {
             console.error('Gemini Live Error', e);
             onStatusChange('error');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are 'SafeTravel AI', India's road safety companion.
          
          MISSION:
          Your goal is to help Indian drivers navigate safely by collecting hazard reports and warning them of dangers.
          
          PERSONA:
          - Friendly, professional, and concise (drivers are busy).
          - Use Indian English context (understand 'pothole', 'gadda', 'jam', 'breakdown').
          - If a user reports something serious (Accident), be empathetic but quick to log it.
          
          TOOLS:
          1. reportHazard(type, severity, description): Use this when user describes a problem.
             - Infer severity: "Huge pothole" -> HIGH. "Small crack" -> LOW. "Car crash" -> CRITICAL.
          2. getHazardsNearby(): Use this when user asks for status updates.
             - After calling this, summarize the hazards returned by the tool to the user vocally.
             
          BEHAVIOUR:
          - Keep responses short (under 10 seconds).
          - Confirm actions: "Reported the pothole."
          - If user says "Hello", greet them and ask if they see any hazards.
          `,
          tools: [{ functionDeclarations: [reportHazardTool, getHazardsTool] }],
        },
      });

    } catch (err) {
      console.error('Connection failed', err);
      onStatusChange('error');
    }
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.stream || !this.sessionPromise) return;

    this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.sourceNode.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async playAudio(base64Str: string) {
    if (!this.outputAudioContext) return;
    
    // Ensure accurate timing
    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

    const audioBuffer = await decodeAudioData(
      decode(base64Str),
      this.outputAudioContext
    );

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);
    
    source.onended = () => {
      this.sources.delete(source);
    };

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
  }

  private stopAudioPlayback() {
    for (const source of this.sources) {
      source.stop();
    }
    this.sources.clear();
    this.nextStartTime = 0;
  }

  async disconnect() {
    // Clean up Audio
    if (this.sourceNode) this.sourceNode.disconnect();
    if (this.processor) this.processor.disconnect();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    
    this.stopAudioPlayback();

    if (this.inputAudioContext) await this.inputAudioContext.close();
    if (this.outputAudioContext) await this.outputAudioContext.close();

    // Note: session.close() isn't strictly exposed in the simplified client, 
    // but stopping streams essentially kills the session loop.
    this.sessionPromise = null;
  }
}