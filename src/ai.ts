import { GoogleGenAI } from "@google/genai";

export async function handleAiChat(apiKey: string, message: string, history: any[], vpsBridge: any) {
  const ai = new GoogleGenAI({ apiKey });

  const tools = [
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
  ];

  // Prepare contents with history
  const contents = [...history, { role: 'user', parts: [{ text: message }] }];

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: { tools }
  });

  const part = result.candidates?.[0]?.content?.parts?.find(p => p.functionCall);
  const call = part?.functionCall;

  if (call) {
    const callArgs = call.args as any;
    // Check if it's a dangerous action that needs approval
    if (call.name === "vps_write_file" || call.name === "vps_execute_command") {
      return Response.json({
        type: "approval_required",
        action: call.name,
        params: callArgs,
        message: `AI wants to ${call.name === "vps_write_file" ? "write to " + callArgs.path : "execute command: " + callArgs.script}`
      });
    }

    // Safe actions: execute immediately and return result to AI
    let toolResult;
    if (call.name === "vps_list_files") {
      const vpsRes = await vpsBridge.fetch(new Request('http://do/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'ls', params: { path: callArgs.path } })
      }));
      toolResult = await vpsRes.json();
    } else if (call.name === "vps_read_file") {
      const vpsRes = await vpsBridge.fetch(new Request('http://do/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'read', params: { path: callArgs.path } })
      }));
      toolResult = await vpsRes.json();
    }

    // Send tool result back to Gemini to get final text
    const updatedContents = [
      ...contents,
      result.candidates![0].content, // The assistant's call
      {
        role: 'user',
        parts: [{
          functionResponse: {
            name: call.name,
            response: { content: toolResult }
          }
        }]
      }
    ];

    const secondResult = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: updatedContents,
      config: { tools }
    });

    return Response.json({
      type: "text",
      text: secondResult.text,
      history: [
        ...updatedContents,
        secondResult.candidates![0].content
      ]
    });
  }

  return Response.json({
    type: "text",
    text: result.text,
    history: [
      ...contents,
      result.candidates![0].content
    ]
  });
}
