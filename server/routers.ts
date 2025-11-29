import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    // Get all conversations for the current user
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserConversations } = await import("./db");
      return getUserConversations(ctx.user.id);
    }),
    
    // Get messages for a specific conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const { getConversationMessages } = await import("./db");
        return getConversationMessages(input.conversationId);
      }),
    
    // Create a new conversation
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        mode: z.enum(["general", "code", "narrator"]).default("general"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createConversation } = await import("./db");
        const id = await createConversation(ctx.user.id, input.title, input.mode);
        return { id };
      }),
    
    // Send a message to AI and get response
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number().optional(),
        message: z.string(),
        mode: z.enum(["general", "code", "narrator"]).default("general"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createConversation, createMessage, getConversationMessages, getConversation } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        let conversationId = input.conversationId;
        
        // Create new conversation if needed
        if (!conversationId) {
          conversationId = await createConversation(ctx.user.id, "Nowa rozmowa", input.mode);
        }
        
        // Get conversation to check mode
        const conversation = await getConversation(conversationId);
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Save user message
        await createMessage(conversationId, "user", input.message);
        
        // Get conversation history
        const history = await getConversationMessages(conversationId);
        
        // Prepare system message based on mode
        let systemMessage = "";
        switch (conversation.mode) {
          case "code":
            systemMessage = "Jesteś ekspertem w programowaniu. Odpowiadaj zwięźle, używając bloków kodu i wyjaśniając tylko niezbędne detale.";
            break;
          case "narrator":
            systemMessage = "Jesteś kreatywnym narratorem. Odpowiadaj w rozbudowany, literacki sposób, używając bogatego słownictwa.";
            break;
          case "general":
          default:
            systemMessage = "Jesteś pomocnym asystentem AI. Odpowiadaj rzeczowo i na temat.";
            break;
        }
        
        // Build messages for LLM
        const llmMessages = [
          { role: "system" as const, content: systemMessage },
          ...history.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          })),
        ];
        
        // Call LLM
        const response = await invokeLLM({ messages: llmMessages });
        const messageContent = response.choices[0]?.message?.content;
        const aiResponse = typeof messageContent === "string" ? messageContent : "Przepraszam, nie mogę odpowiedzieć.";
        
        // Save AI response
        await createMessage(conversationId, "assistant", aiResponse);
        
        return {
          conversationId,
          response: aiResponse,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
