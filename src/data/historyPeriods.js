export const historyPeriodTracksByVolume = {
  3: [
    {
      id: 'china-central',
      region: 'china',
      label: '中國中央政權',
      periods: [
        ['shang', '商', -1600, -1046],
        ['western-zhou', '西周', -1046, -771],
        ['spring-autumn', '春秋', -770, -476],
        ['warring-states', '戰國', -475, -221],
        ['qin', '秦', -221, -206],
        ['western-han', '西漢', -202, 8],
        ['xin', '新', 9, 23],
        ['eastern-han', '東漢', 25, 220],
        ['three-kingdoms', '三國', 220, 280],
        ['western-jin', '西晉', 265, 316],
        ['eastern-jin', '東晉', 317, 420],
        ['southern-northern', '南北朝', 420, 589],
        ['sui', '隋', 581, 618],
        ['tang', '唐', 618, 907],
        ['five-dynasties', '五代十國', 907, 960],
        ['northern-song', '北宋', 960, 1127],
        ['southern-song', '南宋', 1127, 1279],
        ['yuan', '元', 1271, 1368],
        ['ming', '明', 1368, 1644],
        ['qing', '清', 1644, 1912],
      ],
    },
    {
      id: 'northern-a',
      region: 'china',
      label: '北方政權（一）',
      periods: [
        ['liao', '遼', 916, 1125],
        ['mongol', '蒙古帝國', 1206, 1279],
      ],
    },
    {
      id: 'northern-b',
      region: 'china',
      label: '北方政權（二）',
      periods: [
        ['western-xia', '西夏', 1038, 1227],
      ],
    },
    {
      id: 'northern-c',
      region: 'china',
      label: '北方政權（三）',
      periods: [
        ['jin', '金', 1115, 1234],
      ],
    },
    {
      id: 'japan',
      region: 'japan',
      label: '日本',
      periods: [
        ['asuka', '飛鳥', 592, 710],
        ['nara', '奈良', 710, 794],
        ['heian', '平安', 794, 1185],
        ['kamakura', '鎌倉', 1185, 1333],
        ['muromachi', '室町', 1336, 1467],
        ['sengoku', '戰國', 1467, 1603],
        ['edo', '江戶', 1603, 1868],
        ['meiji', '明治', 1868, 1912],
      ],
    },
    {
      id: 'korea',
      region: 'korea',
      label: '朝鮮半島',
      periods: [
        ['unified-silla', '統一新羅', 668, 935],
        ['goryeo', '高麗', 918, 1392],
        ['joseon', '朝鮮王朝', 1392, 1897],
        ['korean-empire', '大韓帝國', 1897, 1910],
      ],
    },
  ],
  4: [
    {
      id: 'china-modern',
      region: 'china',
      label: '中國',
      periods: [
        ['republic-mainland', '中華民國（大陸時期）', 1912, 1949],
        ['prc', '中華人民共和國', 1949, null],
      ],
    },
    {
      id: 'taiwan-modern',
      region: 'taiwan',
      label: '臺灣',
      periods: [
        ['taiwan-japanese', '日本統治時期', 1895, 1945],
        ['roc-taiwan', '中華民國政府遷臺後', 1949, null],
      ],
    },
    {
      id: 'japan-modern',
      region: 'japan',
      label: '日本',
      periods: [
        ['meiji-modern', '明治', 1895, 1912],
        ['taisho', '大正', 1912, 1926],
        ['showa', '昭和', 1926, 1989],
        ['heisei', '平成', 1989, 2019],
        ['reiwa', '令和', 2019, null],
      ],
    },
    {
      id: 'korea-south',
      region: 'korea',
      label: '朝鮮半島（南）',
      periods: [
        ['korea-japanese-south', '日本統治時期', 1910, 1945],
        ['south-korea', '大韓民國', 1948, null],
      ],
    },
    {
      id: 'korea-north',
      region: 'korea',
      label: '朝鮮半島（北）',
      periods: [
        ['korea-japanese-north', '日本統治時期', 1910, 1945],
        ['north-korea', '朝鮮民主主義人民共和國', 1948, null],
      ],
    },
    {
      id: 'world-modern',
      region: 'world',
      label: '世界局勢',
      periods: [
        ['world-war-one', '第一次世界大戰', 1914, 1918],
        ['interwar', '戰間期', 1919, 1939],
        ['world-war-two', '第二次世界大戰', 1939, 1945],
        ['cold-war', '冷戰', 1947, 1991],
        ['post-cold-war', '後冷戰時代', 1991, null],
      ],
    },
  ],
}

export function getHistoryPeriodTracks(volumeNo, currentYear = new Date().getFullYear()) {
  return (historyPeriodTracksByVolume[Number(volumeNo)] || []).map((track) => ({
    ...track,
    periods: track.periods.map(([id, label, startYear, endYear]) => ({
      id,
      label,
      startYear,
      endYear: endYear ?? currentYear,
      isOngoing: endYear == null,
    })),
  }))
}
