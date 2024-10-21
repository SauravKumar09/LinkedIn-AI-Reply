// API key setup
const apiKey =
  "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";

// Detect message boxes
const observer = new MutationObserver(() => {
  // Target LinkedIn message input boxes
  const messageBoxes = Array.from(
    document.querySelectorAll("[role='textbox']") // Update selector to match LinkedIn's current message box element
  );

  messageBoxes
    .filter((messageBox) => !messageBox.hasAttribute("data-mutated"))
    .forEach((messageBox) => {
      messageBox.setAttribute("data-mutated", "true");
      addSuggestionButton(messageBox);
    });
});

// Start observing DOM changes to detect new messages
observer.observe(document.body, { childList: true, subtree: true });

// Add suggestion button to the message box
const addSuggestionButton = (messageBox) => {
  const button = document.createElement("button");
  button.classList.add(
    "artdeco-button",
    "artdeco-button--muted",
    "artdeco-button--tertiary",
    "artdeco-button--circle"
  );
  button.type = "button";
  button.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lightbulb-fill" viewBox="0 0 16 16"><path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m3 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1-.5-.5"/></svg>';

  button.addEventListener("click", async () => {
    const suggestion = await fetchSuggestion(createPrompt(messageBox));
    messageBox.innerHTML = `<p>${suggestion}</p>`;
  });

  messageBox.parentNode.appendChild(button);
};

// Fetch AI-generated reply from OpenAI API
const fetchSuggestion = async (prompt) => {
  if (!apiKey) {
    alert("Please set your OpenAI API key.");
    return "";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that writes replies to LinkedIn messages. Be friendly, concise, and professional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 1,
        max_tokens: 256,
        top_p: 0.7,
        frequency_penalty: 2,
        presence_penalty: 2,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    // Handle invalid response from the API
    if (!data || !data.choices || !data.choices[0]) {
      console.error("Invalid response from the API");
      return "Sorry, I could not generate a suggestion.";
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error fetching suggestion from API:", error);
    return "Sorry, an error occurred while fetching the suggestion.";
  }
};

// Create prompt from the message conversation
const createPrompt = (messageBox) => {
  // Get conversation details
  const conversation = messageBox.closest(".msg-s-message-list__event");

  // Check if the conversation element exists
  if (!conversation) {
    console.error("Conversation element not found for the message box.");
    return "No conversation context available.";
  }

  const messages = conversation.querySelectorAll(".msg-s-event-listitem__body");

  // Handle case where no messages are found
  if (!messages || messages.length === 0) {
    console.error("No messages found in the conversation.");
    return "No messages found in this conversation.";
  }

  let prompt = "";
  messages.forEach((message) => {
    const senderName =
      message.querySelector(".msg-s-event-listitem__name")?.innerText ||
      "Unknown";
    const messageText =
      message.querySelector(".msg-s-event-listitem__message-bubble")
        ?.innerText || "No message content";
    prompt += `${senderName} wrote: ${messageText}\n`;
  });

  prompt += `\nPlease write a professional, concise reply to the above message.`;

  return prompt;
};
