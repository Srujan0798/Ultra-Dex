import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODELS, ChatMessage, estimateTokens } from "@/lib/openai";
import { ratelimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting
    const { success: rateLimitSuccess } = await ratelimit.chat.limit(
      session.user.id
    );

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user || user.credits <= 0) {
      return NextResponse.json(
        { success: false, error: "Insufficient credits. Please upgrade your plan." },
        { status: 403 }
      );
    }

    const { messages, model = AI_MODELS.GPT35_TURBO, conversationId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Create or get conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          title: messages[0]?.content?.slice(0, 50) || "New Conversation",
          model,
        },
      });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: messages[messages.length - 1].content,
        tokensUsed: estimateTokens(messages[messages.length - 1].content),
      },
    });

    // Estimate cost and check credits
    const estimatedCost = Math.ceil(estimateTokens(messages[messages.length - 1].content) / 10);
    if (user.credits < estimatedCost) {
      return NextResponse.json(
        { success: false, error: "Insufficient credits for this request" },
        { status: 403 }
      );
    }

    // Prepare messages for OpenAI
    const chatMessages: ChatMessage[] = [
      { role: "system", content: "You are a helpful AI assistant." },
      ...messages.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model,
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    let fullResponse = "";
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Save assistant message
          const tokensUsed = estimateTokens(fullResponse);
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: "assistant",
              content: fullResponse,
              tokensUsed,
            },
          });

          // Deduct credits
          const cost = Math.ceil(tokensUsed / 10);
          await prisma.$transaction([
            prisma.user.update({
              where: { id: session.user.id },
              data: { credits: { decrement: cost } },
            }),
            prisma.creditTransaction.create({
              data: {
                userId: session.user.id,
                amount: -cost,
                type: "USAGE",
                description: `Chat usage - ${tokensUsed} tokens`,
              },
            }),
          ]);

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
