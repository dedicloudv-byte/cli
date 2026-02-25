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

  // Prepare contents (history + new message)
  // History is expected to be an array of { role, parts: [{ text: ... }] }
  const contents = Array.isArray(history) ? history.map(h => ({
      role: h.role,
      parts: h.parts.map((p: any) => ({ text: p.text || "" }))
  })) : [];

  contents.push({ role: "user", parts: [{ text: message }] });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      tools: tools
    });

    // Handle function calls
    const candidate = result.candidates?.[0];
    const callPart = candidate?.content?.parts?.find((p: any) => p.functionCall);

    if (callPart && callPart.functionCall) {
      const call = callPart.functionCall;
      const callArgs = call.args as any;

      if (call.name === "vps_write_file" || call.name === "vps_execute_command") {
        return Response.json({
          type: "approval_required",
          action: call.name,
          params: callArgs,
          message: `AI ingin ${call.name === "vps_write_file" ? "menulis ke file " + callArgs.path : "menjalankan perintah: " + callArgs.script}`,
          history: contents
        });
      }

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

      // Call back to AI with the tool result
      const secondContents = [
          ...contents,
          candidate.content,
          {
              role: "user",
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
          contents: secondContents,
          tools: tools
      });

      const secondCandidate = secondResult.candidates?.[0];
      return Response.json({
        type: "text",
        text: secondCandidate?.content?.parts?.[0]?.text || "No response.",
        history: [...secondContents, secondCandidate.content]
      });
    }

    // Use property .text if available, else try to find text part
    const textResponse = result.text || candidate?.content?.parts?.[0]?.text || "No response.";

    return Response.json({
      type: "text",
      text: textResponse,
      history: [...contents, candidate.content]
    });
  } catch (err: any) {
    console.error("AI Error:", err);
    return Response.json({
        type: "text",
        text: "Error AI: " + err.message,
        history: contents
    }, { status: 500 });
  }
}
