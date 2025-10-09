import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { ImageGallery } from './components/ImageGallery';
import { CollaboratorSelectionModal } from './components/CollaboratorSelectionModal';
import type { Message, Image, Conversations, DesignStep, ImagePart, Agent } from './types';
import { Author } from './types';
import { reasonAndPlan, generateImage as generateImageService, editImage as editImageService, allTools } from './services/geminiService';
import { agents } from './config/agents';
import { FunctionDeclaration } from '@google/genai';
import { WarningIcon } from './components/icons/WarningIcon';

const designSteps: DesignStep[] = ['task', 'inspiration', 'audience', 'quality', 'budget'];

const initialConversations: Conversations = agents.reduce((acc, agent) => {
  acc[agent.id] = {
    messages: [{ author: Author.AGENT, text: agent.initialMessage }],
    images: [],
    currentStep: 0,
    designBrief: {},
    isAwaitingCollaborationChoice: false,
  };
  return acc;
}, {} as Conversations);

const isValidUrl = (urlString: string) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

const getFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('api key')) {
      return "I'm having trouble connecting due to an API configuration issue. Please let the site administrator know.";
    }
    if (error.message.includes('429')) { // Rate limiting
      return "The service is currently experiencing high traffic. Please wait a moment before trying again.";
    }
    if (error.message.includes('500')) { // Server error
      return "A server error occurred on our end. We are looking into it. Please try again later.";
    }
    if (error.message.toLowerCase().includes('safety')) {
        return "Your request couldn't be processed due to the safety filter. Please try rephrasing your prompt.";
    }
    // A more generic but less scary message
    return "Sorry, I encountered an unexpected issue and couldn't complete your request.";
  }
  return "An unknown error occurred.";
};

export default function App() {
  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<Conversations>(initialConversations);
  const [currentAgentId, setCurrentAgentId] = useState<string>(agents[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChoosingCollaborator, setIsChoosingCollaborator] = useState(false);
  const [savedImages, setSavedImages] = useState<Image[]>([]);
  const [currentView, setCurrentView] = useState<'agent' | 'gallery'>('agent');

  useEffect(() => {
    // Defer the check until the component mounts to ensure it runs client-side.
    // This is a robust way to check for environment variables that might be
    // injected at build time, without crashing on the server or in environments
    // where `process` is not defined.
    const keyExists = typeof process !== 'undefined' &&
                      process.env &&
                      !!process.env.API_KEY;
    setApiKeyExists(keyExists);
  }, []);

  const currentAgent = agents.find(agent => agent.id === currentAgentId)!;
  const currentConversation = conversations[currentAgentId];
  const currentStepKey = designSteps[currentConversation.currentStep];
  const savedImageIds = useMemo(() => new Set(savedImages.map(img => img.id)), [savedImages]);

  const appendMessage = useCallback((agentId: string, message: Message) => {
    setConversations(prev => ({
      ...prev,
      [agentId]: { ...prev[agentId], messages: [...prev[agentId].messages, message] },
    }));
  }, []);

  const processAgentResponse = useCallback(async (
    prompt: string,
    agentId: string,
    tools: FunctionDeclaration[],
    imagePart: ImagePart | null = null
  ) => {
    const agent = agents.find(a => a.id === agentId)!;
    try {
      const response = await reasonAndPlan(prompt, agent.systemInstruction, tools, imagePart);
      let newMessages: Message[] = [];

      if (response.text) {
        newMessages.push({ author: Author.AGENT, text: response.text });
      }

      if (newMessages.length > 0) {
        setConversations(prev => ({
          ...prev,
          [currentAgentId]: { ...prev[currentAgentId], messages: [...prev[currentAgentId].messages, ...newMessages] }
        }));
      }

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const funcCall of response.functionCalls) {
          if (funcCall.name === 'generateImage' && funcCall.args.prompt) {
            const imagePrompt = funcCall.args.prompt as string;
            appendMessage(currentAgentId, { author: Author.AGENT, text: `Generating an image with the prompt: "${imagePrompt}"...` });
            const base64Image = await generateImageService(imagePrompt);
            if (base64Image) {
              const newImage: Image = {
                id: crypto.randomUUID(),
                url: `data:image/png;base64,${base64Image}`,
                prompt: imagePrompt,
              };
              setConversations(prev => ({
                ...prev,
                [currentAgentId]: {
                  ...prev[currentAgentId],
                  images: [newImage, ...prev[currentAgentId].images],
                  messages: [...prev[currentAgentId].messages, { author: Author.AGENT, text: `I've finished the design! You can see the new image in the gallery. Let's start a new project! What's the first task?` }],
                  currentStep: 0,
                  designBrief: {},
                }
              }));
            }
          } else if (funcCall.name === 'consultAgent' && funcCall.args.agentId && funcCall.args.request) {
            const { agentId: collaboratorId, request } = funcCall.args;
            const collaborator = agents.find(a => a.id === collaboratorId)!;
            if (!collaborator) continue;

            appendMessage(currentAgentId, { author: Author.AGENT, text: `Consulting with ${collaborator.name}...` });

            const consultationPrompt = `You are being consulted. The original design brief is: ${JSON.stringify(currentConversation.designBrief, null, 2)}. The specific request is: "${request}". Please provide your feedback as a direct text response.`;
            const consultationResponse = await reasonAndPlan(consultationPrompt, collaborator.systemInstruction, []);
            const feedback = consultationResponse.text;

            appendMessage(currentAgentId, { author: Author.AGENT, text: `Feedback from ${collaborator.name}:\n\n"${feedback}"` });

            const finalPrompt = `You have received feedback from ${collaborator.name}: "${feedback}". Please synthesize the original brief and this feedback into a final, masterful prompt and call generateImage.`;
            await processAgentResponse(finalPrompt, currentAgentId, allTools);
          }
        }
      }
    } catch (error) {
      console.error("Error processing agent response:", error);
      const friendlyMessage = getFriendlyErrorMessage(error);
      
      setConversations(prev => {
        const prevConversation = prev[agentId];
        return {
          ...prev,
          [agentId]: {
            ...prevConversation,
            messages: [
              ...prevConversation.messages,
              { author: Author.AGENT, text: friendlyMessage },
              { author: Author.AGENT, text: `Let's start over. ${agent.initialMessage}` },
            ],
            currentStep: 0,
            designBrief: {},
            isAwaitingCollaborationChoice: false,
          }
        };
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentAgentId, currentConversation.designBrief, appendMessage]);
  
  const handleProceedToGeneration = useCallback(async () => {
    setIsLoading(true);
    setConversations(prev => ({ ...prev, [currentAgentId]: { ...prev[currentAgentId], isAwaitingCollaborationChoice: false }}));
    
    const brief = conversations[currentAgentId].designBrief;
    let briefForAgent = { ...brief };
    let inspirationImagePart: ImagePart | null = null;
    const inspiration = brief.inspiration;

    if (inspiration?.startsWith('data:image/')) {
        const [meta, base64Data] = inspiration.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        inspirationImagePart = { inlineData: { mimeType, data: base64Data } };
        briefForAgent.inspiration = "[User has provided an inspiration image]";
    } else if (inspiration && isValidUrl(inspiration)) {
        briefForAgent.inspiration = `[User has provided this URL for inspiration: ${inspiration}]`;
    }

    const finalPrompt = `Synthesize this design brief into a creative prompt for an image generator. Design Brief: ${JSON.stringify(briefForAgent, null, 2)}`;
    await processAgentResponse(finalPrompt, currentAgentId, allTools, inspirationImagePart);
  }, [conversations, currentAgentId, processAgentResponse]);

  const handleStartCollaboration = useCallback(() => {
    setIsChoosingCollaborator(true);
  }, []);

  const handleSelectCollaborator = useCallback(async (collaboratorId: string) => {
    setIsChoosingCollaborator(false);
    setIsLoading(true);
    setConversations(prev => ({ ...prev, [currentAgentId]: { ...prev[currentAgentId], isAwaitingCollaborationChoice: false }}));

    const collaborator = agents.find(a => a.id === collaboratorId)!;
    const brief = conversations[currentAgentId].designBrief;
    
    const userMessage: Message = { author: Author.USER, text: `Great, let's get a second opinion from ${collaborator.name}.` };
    appendMessage(currentAgentId, userMessage);
    
    const prompt = `I'd like to consult the ${collaborator.name}. Please formulate a concise request for them based on this design brief, asking for their expert feedback to improve the final result. Then call the consultAgent function with an 'agentId' of '${collaborator.id}'. Design Brief: ${JSON.stringify(brief, null, 2)}`;
    await processAgentResponse(prompt, currentAgentId, allTools);

  }, [conversations, currentAgentId, processAgentResponse, appendMessage]);

  const handleSendInspiration = useCallback(async (base64DataUrl: string) => {
    if (isLoading || currentStepKey !== 'inspiration') return;

    const userMessage: Message = { author: Author.USER, text: 'Here is my inspiration image.', imageUrl: base64DataUrl };
    const updatedBrief = { ...currentConversation.designBrief, inspiration: base64DataUrl };

    setConversations(prev => ({
      ...prev,
      [currentAgentId]: { ...prev[currentAgentId], messages: [...prev[currentAgentId].messages, userMessage], designBrief: updatedBrief }
    }));

    const nextStepIndex = currentConversation.currentStep + 1;
    const nextStepKey = designSteps[nextStepIndex];
    const nextQuestion = currentAgent.questions[nextStepKey];
    const agentQuestionMessage: Message = { author: Author.AGENT, text: nextQuestion };

    setConversations(prev => ({
      ...prev,
      [currentAgentId]: { ...prev[currentAgentId], messages: [...prev[currentAgentId].messages, agentQuestionMessage], currentStep: nextStepIndex }
    }));
  }, [isLoading, currentAgentId, currentAgent, currentConversation, currentStepKey]);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    if (currentAgent.id === 'image-segmentation') {
        setIsLoading(true);
        const userMessage: Message = { author: Author.USER, text: prompt };
        appendMessage(currentAgentId, userMessage);
    
        const sourceImageMsg = [...currentConversation.messages, userMessage]
            .reverse()
            .find(msg => msg.imageUrl);
    
        if (!sourceImageMsg || !sourceImageMsg.imageUrl) {
            appendMessage(currentAgentId, { author: Author.AGENT, text: "I can't find an image to edit. Please start by using the 'Edit' button on an image in the gallery." });
            setIsLoading(false);
            return;
        }

        try {
            const [meta, base64Data] = sourceImageMsg.imageUrl.split(',');
            const mimeType = meta.split(':')[1].split(';')[0];
            const imagePart = { inlineData: { mimeType, data: base64Data } };

            const { newImageBase64, textResponse } = await editImageService(prompt, imagePart);
    
            if (textResponse) {
                appendMessage(currentAgentId, { author: Author.AGENT, text: textResponse });
            }
    
            if (newImageBase64) {
                const newImage: Image = {
                    id: crypto.randomUUID(),
                    url: `data:image/png;base64,${newImageBase64}`,
                    prompt: `Edit of a previous image with prompt: "${prompt}"`,
                };
                setConversations(prev => ({
                    ...prev,
                    [currentAgentId]: {
                        ...prev[currentAgentId],
                        images: [newImage, ...prev[currentAgentId].images],
                    }
                }));
                const followUpMessage: Message = {
                    author: Author.AGENT,
                    text: "Here is the edited image! You can continue editing it with a new instruction, or use the 'Edit' button in the gallery to start with a different image.",
                    imageUrl: newImage.url, // Show the new image in the chat
                };
                appendMessage(currentAgentId, followUpMessage);
            } else if (!textResponse) {
                appendMessage(currentAgentId, { author: Author.AGENT, text: "I wasn't able to edit the image based on that description. Please try rephrasing your request." });
            }
        } catch (error) {
            const friendlyMessage = getFriendlyErrorMessage(error);
            appendMessage(currentAgentId, { author: Author.AGENT, text: friendlyMessage });
        } finally {
            setIsLoading(false);
        }
        return;
    }

    let userMessage: Message = { author: Author.USER, text: prompt };
    const currentStepIndex = currentConversation.currentStep;
    const currentStepKey = designSteps[currentStepIndex];

    if (currentStepKey === 'inspiration' && isValidUrl(prompt)) {
      userMessage.imageUrl = prompt;
    }

    const updatedBrief = { ...currentConversation.designBrief, [currentStepKey]: prompt };

    setConversations(prev => ({
      ...prev,
      [currentAgentId]: { ...prev[currentAgentId], messages: [...prev[currentAgentId].messages, userMessage], designBrief: updatedBrief }
    }));

    if (currentStepIndex < designSteps.length - 1) {
      const nextStepIndex = currentStepIndex + 1;
      const nextStepKey = designSteps[nextStepIndex];
      const nextQuestion = currentAgent.questions[nextStepKey];
      appendMessage(currentAgentId, { author: Author.AGENT, text: nextQuestion });
      setConversations(prev => ({ ...prev, [currentAgentId]: { ...prev[currentAgentId], currentStep: nextStepIndex }}));
      return;
    }

    const summary = `Great, the design brief is complete! Here's a summary:\n\n- **Task**: ${updatedBrief.task}\n- **Inspiration**: ${updatedBrief.inspiration}\n- **Audience**: ${updatedBrief.audience}\n- **Quality**: ${updatedBrief.quality}\n- **Budget**: ${updatedBrief.budget}\n\nShall I generate the image now, or would you like to consult another agent for feedback?`;
    appendMessage(currentAgentId, { author: Author.AGENT, text: summary });
    setConversations(prev => ({ ...prev, [currentAgentId]: { ...prev[currentAgentId], isAwaitingCollaborationChoice: true }}));

  }, [isLoading, currentAgentId, currentAgent, currentConversation, appendMessage]);

  const handleSaveImage = useCallback((imageToSave: Image) => {
    setSavedImages(prev => {
      const isSaved = prev.some(image => image.id === imageToSave.id);
      if (isSaved) {
        return prev.filter(image => image.id !== imageToSave.id);
      } else {
        return [imageToSave, ...prev];
      }
    });
  }, []);

  const handleStartEditing = useCallback((imageToEdit: Image) => {
    const segmenterId = 'image-segmentation';
    setCurrentAgentId(segmenterId);
    
    setConversations(prev => ({
        ...prev,
        [segmenterId]: {
            ...initialConversations[segmenterId],
            messages: [
                { author: Author.AGENT, text: "I've loaded the image. What would you like to change?" },
                { author: Author.USER, text: '', imageUrl: imageToEdit.url, } 
            ],
        }
    }));

    setCurrentView('agent');
  }, []);

  if (apiKeyExists === null) {
    // Render a blank screen while the key is being checked to allow the server to start.
    return <div className="h-screen bg-brand-primary" />;
  }
  
  if (!apiKeyExists) {
    return (
      <div className="flex flex-col h-screen bg-brand-primary text-brand-text-primary items-center justify-center p-8">
        <div className="bg-brand-secondary p-8 rounded-lg shadow-2xl border border-red-500/50 text-center max-w-lg">
          <WarningIcon />
          <h1 className="text-2xl font-bold text-red-400 font-display tracking-widest uppercase mb-4">Configuration Error</h1>
          <p className="text-brand-text-secondary">
            The application cannot connect to the backend services because the <code className="bg-brand-primary px-1 py-0.5 rounded-md text-amber-400 font-mono">API_KEY</code> is missing.
          </p>
          <p className="text-brand-text-secondary mt-2">
            Please ensure the <code className="bg-brand-primary px-1 py-0.5 rounded-md text-amber-400 font-mono">API_KEY</code> environment variable is set correctly in your deployment configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-brand-primary text-brand-text-primary">
      <Header
        agents={agents}
        currentAgent={currentAgent}
        onSelectAgent={(agentId) => {
          setIsLoading(false);
          setCurrentAgentId(agentId);
          setCurrentView('agent');
        }}
        currentView={currentView}
        onToggleView={() => setCurrentView(prev => prev === 'agent' ? 'gallery' : 'agent')}
        savedImageCount={savedImages.length}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'agent' ? (
          <>
            <ImageGallery
              galleryType="agent"
              images={currentConversation.images}
              agent={currentAgent}
              isLoading={isLoading}
              onSaveImage={handleSaveImage}
              savedImageIds={savedImageIds}
              onStartEditing={handleStartEditing}
            />
            <ChatPanel
              messages={currentConversation.messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onSendInspiration={handleSendInspiration}
              currentStep={currentStepKey}
              isAwaitingCollaborationChoice={currentConversation.isAwaitingCollaborationChoice}
              onProceedToGeneration={handleProceedToGeneration}
              onStartCollaboration={handleStartCollaboration}
              currentAgentId={currentAgentId}
            />
          </>
        ) : (
          <ImageGallery
            galleryType="saved"
            images={savedImages}
            isLoading={false}
            onSaveImage={handleSaveImage}
            savedImageIds={savedImageIds}
            onStartEditing={handleStartEditing}
          />
        )}
      </main>
      {isChoosingCollaborator && (
        <CollaboratorSelectionModal
          agents={agents.filter(a => a.id !== currentAgentId)}
          onSelect={handleSelectCollaborator}
          onClose={() => setIsChoosingCollaborator(false)}
        />
      )}
    </div>
  );
}