export function buildCartoonPrompt({
  personaSeed,
  destinationCity,
  destinationRegionOrCountry,
  interests,
  styleNotes = ""
}: {
  personaSeed: string;
  destinationCity: string;
  destinationRegionOrCountry: string;
  interests: string[];
  styleNotes?: string;
}) {
  const interestsCsv = interests.filter(Boolean).join(", ");
  return `
Create a stylized, human-in-cartoon-form travel portrait using the attached reference image for facial likeness.

Persona:
- Core idea: ${personaSeed}
- Destination: ${destinationCity}, ${destinationRegionOrCountry}
- Top interests: ${interestsCsv}
- Optional notes: ${styleNotes}

Art Direction:
- Style: clean, semi-realistic cartoon (cel-shaded), soft gradients, light outlines; NOT photorealistic
- Pose & crop: centered, 3/4 view, head-and-shoulders to mid-torso, friendly expression
- Wardrobe/props: infer tasteful items that reflect interests & destination (non-branded)
- Background: subtle, iconic cues from the destination (no logos or text)
- Color & lighting: vibrant but natural; gentle golden-hour vibe

Requirements:
- Preserve the person's key facial structure, skin tone, and gender presentation from the reference
- Maintain the same gender identity and physical characteristics as shown in the reference image
- Keep content PG-13, respectful, and culturally sensitive
- No text, watermarks, or brand logos
- Single subject only; no extra people
- Output: 1024×1024 PNG

If the reference image is low quality or occluded, approximate respectfully while keeping the same overall vibe and attributes.
`.trim();
}