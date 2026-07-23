import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

export async function POST(req: NextRequest) {
  try {
      const { question, tenantId, department } = await req.json();

          if (!question || !tenantId) {
                return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
                    }

                        const embeddingResponse = await openai.embeddings.create({
                              model: 'text-embedding-3-small',
                                    input: question,
                                        });
                                            const queryEmbedding = embeddingResponse.data.embedding;

                                                const index = pc.index('enterprise-knowledge-engine');
                                                    const queryResponse = await index.query({
                                                          vector: queryEmbedding,
                                                                topK: 3,
                                                                      includeMetadata: true,
                                                                            filter: {
                                                                                    tenant_id: { $eq: tenantId },
                                                                                            department: { $eq: department },
                                                                                                  },
                                                                                                      });

                                                                                                          const context = queryResponse.matches
                                                                                                                .map((match) => match.metadata?.content || '')
                                                                                                                      .join('\n\n');

                                                                                                                          const systemPrompt = `You are an elite enterprise AI data assistant. 
                                                                                                                              Answer the question truthfully using only the context provided below. 
                                                                                                                                  If the answer cannot be found in the context, say "Data unavailable in system files."
                                                                                                                                      
                                                                                                                                          CONTEXT:\n${context}`;

                                                                                                                                              const responseStream = await openai.chat.completions.create({
                                                                                                                                                    model: 'gpt-4o-mini',
                                                                                                                                                          stream: true,
                                                                                                                                                                messages: [
                                                                                                                                                                        { role: 'system', content: systemPrompt },
                                                                                                                                                                                { role: 'user', content: question },
                                                                                                                                                                                      ],
                                                                                                                                                                                          });

                                                                                                                                                                                              const encoder = new TextEncoder();
                                                                                                                                                                                                  const readableStream = new ReadableStream({
                                                                                                                                                                                                        async start(controller) {
                                                                                                                                                                                                                for await (const chunk of responseStream) {
                                                                                                                                                                                                                          const content = chunk.choices?.delta?.content || '';
                                                                                                                                                                                                                                    if (content) {
                                                                                                                                                                                                                                                controller.enqueue(encoder.encode(content));
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                          controller.close();
                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                    });

                                                                                                                                                                                                                                                                                        return new NextResponse(readableStream, {
                                                                                                                                                                                                                                                                                              headers: {
                                                                                                                                                                                                                                                                                                      'Content-Type': 'text/event-stream',
                                                                                                                                                                                                                                                                                                              'Cache-Control': 'no-cache',
                                                                                                                                                                                                                                                                                                                      'Connection': 'keep-alive',
                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                });
                                                                                                                                                                                                                                                                                                                                  } catch (error: any) {
                                                                                                                                                                                                                                                                                                                                      return NextResponse.json({ error: `Streaming Pipeline Error: ${error.message}` }, { status: 500 });
                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                        }