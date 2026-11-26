import { safeLocalStorageGet } from "../lib/utils";

export const downloadAudio = (data: Uint8Array, fileName: string, mimeType: string) => {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const shareAudio = async (data: Uint8Array, fileName: string, mimeType: string) => {
  const blob = new Blob([data], { type: mimeType });
  const file = new File([blob], fileName, { type: mimeType });
  if (navigator.share) {
    try {
      await navigator.share({
        files: [file],
        title: 'Share Audio',
        text: 'Check out this audio',
      });
    } catch (error) {
      console.error('Error sharing audio:', error);
      downloadAudio(data, fileName, mimeType);
    }
  } else {
    downloadAudio(data, fileName, mimeType);
  }
};

export const generateAudioId = (surah: number, ayah: number, reciterId: string) => {
  return `audio_${surah}_${ayah}_${reciterId}`;
};

export const getCachedAudio = (id: string) => {
  const cached = safeLocalStorageGet(id);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
};
