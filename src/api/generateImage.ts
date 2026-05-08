export async function generateImage(prompt: string) {
  const response = await fetch("http://localhost:3000/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate image');
  }

  const data = await response.json();
  return data.image;
}
