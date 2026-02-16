import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function generateVideo(prompt: string): Promise<string> {
  const output = await replicate.run(
    "minimax/video-01-live",
    {
      input: {
        prompt,
        prompt_optimizer: true,
      },
    }
  );

  // Replicate returns a URL to the generated video
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return output[0] as string;
  throw new Error("Unexpected Replicate output format");
}

export async function generateVideoAsync(prompt: string) {
  const prediction = await replicate.predictions.create({
    model: "minimax/video-01-live",
    input: {
      prompt,
      prompt_optimizer: true,
    },
  });

  return prediction;
}

export async function getPredictionStatus(id: string) {
  return replicate.predictions.get(id);
}
