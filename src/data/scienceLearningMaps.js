import wavePropagationImage from '../assets/learning-maps/science/b3-ch3-sec1-wave-propagation.png'
import soundGenerationImage from '../assets/learning-maps/science/b3-ch3-sec2-sound-generation.png'
import soundReflectionImage from '../assets/learning-maps/science/b3-ch3-sec3-sound-reflection-ultrasound.png'
import soundVariationImage from '../assets/learning-maps/science/b3-ch3-sec4-sound-variation.png'
import lightPropagationImage from '../assets/learning-maps/science/b3-ch4-sec1-light-propagation.png'
import lightReflectionImage from '../assets/learning-maps/science/b3-ch4-sec2-light-reflection-mirrors.png'

const shared = {
  subjectCode: 'science',
  gradeLevel: 8,
  semester: 1,
  volumeNo: 3,
  creatorName: '陳少軍老師',
  sourceName: 'AI 輔助製作',
  sourceUrl: '',
  usageNote: '由陳少軍老師請 AI 生成，供學生登入學習系統後閱讀。',
  mimeType: 'image/png',
  status: 'published',
  isBundled: true,
}

const definitions = [
  {
    mapCode: 'science-b3-ch3-sec1-wave-propagation',
    chapterNo: 3,
    sectionNo: 1,
    title: '波的傳播',
    description: '認識波的產生、水波、聲波、橫波、縱波，以及週期與頻率的關係。',
    originalFileName: 'B3 3-1波的傳播心智圖.png',
    signedUrl: wavePropagationImage,
    displayOrder: 30310,
  },
  {
    mapCode: 'science-b3-ch3-sec2-sound-generation',
    chapterNo: 3,
    sectionNo: 2,
    title: '聲波的產生與傳播',
    description: '從音叉、水上芭蕾、抽氣鐘與桌面敲擊，理解振動產聲與介質傳聲。',
    originalFileName: 'B3 3-2聲波的產生與傳播心智圖.png',
    signedUrl: soundGenerationImage,
    displayOrder: 30320,
  },
  {
    mapCode: 'science-b3-ch3-sec3-sound-reflection-ultrasound',
    chapterNo: 3,
    sectionNo: 3,
    title: '聲波的反射與超聲波',
    description: '整理反射、回聲、超聲波、聲納及醫療超音波的原理與應用。',
    originalFileName: 'B3 3-3聲波的反射與超聲波心智圖.png',
    signedUrl: soundReflectionImage,
    displayOrder: 30330,
  },
  {
    mapCode: 'science-b3-ch3-sec4-sound-variation',
    chapterNo: 3,
    sectionNo: 4,
    title: '多變的聲音',
    description: '比較音調、音色與響度，並連結樂器、電話辨音及噪音防制。',
    originalFileName: 'B3 3-4多變的聲音心智圖.png',
    signedUrl: soundVariationImage,
    displayOrder: 30340,
  },
  {
    mapCode: 'science-b3-ch4-sec1-light-propagation',
    chapterNo: 4,
    sectionNo: 1,
    title: '光的傳播與光速',
    description: '從直線傳播、影子、光速與針孔成像，理解常見的光學現象。',
    originalFileName: 'B3 4-1光的直進性心智圖.png',
    signedUrl: lightPropagationImage,
    displayOrder: 30410,
  },
  {
    mapCode: 'science-b3-ch4-sec2-light-reflection-mirrors',
    chapterNo: 4,
    sectionNo: 2,
    title: '光的反射與面鏡',
    description: '整理反射定律、平面鏡成像，以及凹面鏡與凸面鏡的生活應用。',
    originalFileName: 'B3 4-2光的反射與面鏡心智圖.png',
    signedUrl: lightReflectionImage,
    displayOrder: 30420,
  },
]

export const scienceLearningMaps = definitions.map((item) => ({
  ...shared,
  ...item,
  id: `bundled-${item.mapCode}`,
  storagePath: `bundled/${item.originalFileName}`,
  publishedAt: '2026-11-02T00:00:00.000Z',
  updatedAt: '2026-11-02T00:00:00.000Z',
}))

export function bundledLearningMapsFor(subjectCode) {
  return subjectCode === 'science' ? scienceLearningMaps.map((item) => ({ ...item })) : []
}
