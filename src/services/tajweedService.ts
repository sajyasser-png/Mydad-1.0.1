export const TAJWEED_RULES = [
  { 
    id: 'ghunnah',
    name: 'الغنة',
    pattern: /([\u0646\u0645]\u0651)/g, 
    class: 'text-emerald-600 dark:text-emerald-400',
    description: 'صوت يخرج من الخيشوم بمقدار حركتين (نّ، مّ).'
  },
  { 
    id: 'qalqalah',
    name: 'القلقلة',
    pattern: /([\u0642\u0637\u0628\u062c\u062f][\u0652\u06df]?)/g, 
    class: 'text-sky-600 dark:text-sky-400',
    description: 'اضطراب مخرج الحرف عند النطق به ساكناً (ق، ط، ب، ج، د).'
  },
  { 
    id: 'madd',
    name: 'المدود',
    pattern: /([\u0627\u0648\u064a][\u0653\u0654\u0655]?)/g, 
    class: 'text-red-600 dark:text-red-400',
    description: 'إطالة الصوت بحرف المد (ا، و، ي) عند وجود علامة المد.'
  },
  { 
    id: 'idgham',
    name: 'الإدغام',
    pattern: /([\u064a\u0631\u0645\u0644\u0648\u0646][\u0651]?)/g, 
    class: 'text-orange-500 dark:text-orange-400',
    description: 'إدخال حرف ساكن في حرف متحرك (يرملون).'
  },
  { 
    id: 'ikhfa',
    name: 'الإخفاء',
    pattern: /([\u0635\u0630\u062b\u0643\u062c\u0634\u0642\u0633\u062f\u0637\u0632\u0641\u062a\u0636\u0638])/g, 
    class: 'text-purple-600 dark:text-purple-400',
    description: 'النطق بالحرف بصفة بين الإظهار والإدغام.'
  },
  { 
    id: 'iqlab',
    name: 'الإقلاب',
    pattern: /([\u0646][\u06e2]|[\u064b\u064c\u064d][\u0628])/g, 
    class: 'text-amber-500 dark:text-amber-400',
    description: 'قلب النون الساكنة أو التنوين ميماً عند ملاقاتها للباء.'
  }
];

export const applyTajweed = (text: string): string => {
  let processedText = text;
  const matches: { id: string, html: string }[] = [];
  
  TAJWEED_RULES.forEach((rule, ruleIdx) => {
    processedText = processedText.replace(rule.pattern, (match) => {
      const id = `__TAJWEED_${ruleIdx}_${matches.length}__`;
      matches.push({ id, html: `<span class="${rule.class} font-bold">${match}</span>` });
      return id;
    });
  });

  matches.forEach(match => {
    processedText = processedText.replace(match.id, match.html);
  });

  return processedText;
};
