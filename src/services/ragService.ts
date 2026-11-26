import { callAI } from './aiService';

export const analyzeIslamicIntent = async (query: string): Promise<{
  needsQuran: boolean;
  quranQuery?: string;
  needsHadith: boolean;
  hadithQuery?: string;
}> => {
  try {
    const prompt = `Analyze the following user query in Arabic. Determine if we need to search the Quran or Hadith to answer it accurately.
Query: "${query}"
Output ONLY valid JSON with no markdown in this format:
{
  "needsQuran": boolean,
  "quranQuery": "specific keyword to search in Quran, optional",
  "needsHadith": boolean,
  "hadithQuery": "specific keyword to search in Hadith, optional"
}`;
    
    // Use high-quota lite model for background intent classification so we don't drain gemini-3-flash-preview's 20/day free quota
    const response = await callAI('gemini', [{ role: 'user', content: prompt }], 'gemini-3.1-flash-lite', { temperature: 0.1 });
    let text = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Intent analysis failed", e);
    return { needsQuran: false, needsHadith: false };
  }
};

export const searchQuran = async (query: string, edition: string = 'ar.warsh') => {
  try {
    // Determine edition mapping
    let editionKey = 'ar.warsh';
    if (edition.includes('حفص')) editionKey = 'ar.quran-uthmani';
    else if (edition.includes('قالون')) editionKey = 'ar.qaloon';

    const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/${editionKey}`);
    const data = await response.json();
    if (data.code === 200 && data.data.count > 0) {
      return data.data.matches.slice(0, 5).map((m: any) => ({
        surah: m.surah.name,
        ayah: m.numberInSurah,
        text: m.text
      }));
    }
  } catch (e) {
    console.error("Search Quran failed", e);
  }
  return [];
};
