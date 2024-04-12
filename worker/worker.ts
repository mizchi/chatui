// WIP
import OpenAI from 'openai';
type Env = {
  OPENAI_API_KEY: string;
};
type ExecutionContext = {};
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });

    // make our request to the OpenAI API
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Tell me a story' }],
      stream: true,
    });

    // Using our readable and writable to handle streaming data
    let { readable, writable } = new TransformStream()

    let writer = writable.getWriter()
    const textEncoder = new TextEncoder();

    // loop over the data as it is streamed from OpenAI and write it using our writeable
    for await (const part of stream) {
      console.log(part.choices[0]?.delta?.content || '');
      writer.write(textEncoder.encode(part.choices[0]?.delta?.content || ''));
    }

    writer.close();

    // Send readable back to the browser so it can read the stream content
    return new Response(readable);
  },
};