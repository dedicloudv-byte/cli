import { GoogleGenAI } from "@google/genai";

export async function handleAiChat(apiKey: string, message: string, history: any[], vpsBridge: any) {
  const genAI = new GoogleGenAI({ apiKey });
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    tools: [
      {
        functionDeclarations: [
          {
            name: "vps_list_files",
            description: "List files in a directory on the VPS",
            parameters: {
              type: "OBJECT",
              properties: {
                path: { type: "STRING", description: "The directory path" }
              },
              required: ["path"]
            }
          },
          {
            name: "vps_read_file",
            description: "Read a file's content from the VPS",
            parameters: {
              type: "OBJECT",
              properties: {
                path: { type: "STRING", description: "The file path" }
              },
              required: ["path"]
            }
          },
          {
            name: "vps_write_file",
            description: "Write content to a file on the VPS. REQUIRES USER APPROVAL.",
            parameters: {
              type: "OBJECT",
              properties: {
                path: { type: "STRING", description: "The file path" },
                content: { type: "STRING", description: "The content to write" }
              },
              required: ["path", "content"]
            }
          },
          {
            name: "vps_execute_command",
            description: "Execute a shell command on the VPS. REQUIRES USER APPROVAL.",
            parameters: {
              type: "OBJECT",
              properties: {
                script: { type: "STRING", description: "The shell script or command to execute" }
              },
              required: ["script"]
            }
          }
        ]
      }
    ]
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(message);
  const response = result.response;

  const call = response.functionCalls()?.[0];

  if (call) {
    // Check if it's a dangerous action that needs approval
    if (call.name === "vps_write_file" || call.name === "vps_execute_command") {
      return Response.json({
        type: "approval_required",
        action: call.name,
        params: call.args,
        message: `AI wants to ${call.name === "vps_write_file" ? "write to " + call.args.path : "execute command: " + call.args.script}`
      });
    }

    // Safe actions: execute immediately and return result to AI
    let toolResult;
    if (call.name === "vps_list_files") {
      const vpsRes = await vpsBridge.fetch(new Request('http://do/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'ls', params: { path: call.args.path } })
      }));
      toolResult = await vpsRes.json();
    } else if (call.name === "vps_read_file") {
      const vpsRes = await vpsBridge.fetch(new Request('http://do/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'read', params: { path: call.args.path } })
      }));
      toolResult = await vpsRes.json();
    }

    // Send tool result back to Gemini to get final text
    const secondResult = await chat.sendMessage([
      {
        functionResponse: {
          name: call.name,
          response: { content: toolResult }
        }
      }
    ]);

    return Response.json({
      type: "text",
      text: secondResult.response.text(),
      history: await chat.getHistory()
    });
  }

  return Response.json({
    type: "text",
    text: response.text(),
    history: await chat.getHistory()
  });
}
