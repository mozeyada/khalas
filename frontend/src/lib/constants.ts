export const GOVERNORATES = [
  { en: 'Cairo', ar: 'القاهرة' },
  { en: 'Giza', ar: 'الجيزة' },
  { en: 'Alexandria', ar: 'الإسكندرية' },
  { en: 'Dakahlia', ar: 'الدقهلية' },
  { en: 'Beheira', ar: 'البحيرة' },
  { en: 'Fayoum', ar: 'الفيوم' },
  { en: 'Gharbia', ar: 'الغربية' },
  { en: 'Ismailia', ar: 'الإسماعيلية' },
  { en: 'Menofia', ar: 'المنوفية' },
  { en: 'Minya', ar: 'المنيا' },
  { en: 'Qalyubia', ar: 'القليوبية' },
  { en: 'Suez', ar: 'السويس' },
  { en: 'Aswan', ar: 'أسوان' },
  { en: 'Assiut', ar: 'أسيوط' },
  { en: 'Beni Suef', ar: 'بني سويف' },
  { en: 'Port Said', ar: 'بورسعيد' },
  { en: 'Damietta', ar: 'دمياط' },
  { en: 'Sharkia', ar: 'الشرقية' },
  { en: 'Luxor', ar: 'الأقصر' },
  { en: 'Qena', ar: 'قنا' },
  { en: 'Sohag', ar: 'سوهاج' }
];

export const SPECIALTIES = [
  { en: 'Cardiology', ar: 'أمراض القلب' },
  { en: 'Dentistry', ar: 'طب الأسنان' },
  { en: 'Dermatology', ar: 'الأمراض الجلدية' },
  { en: 'Orthopedics', ar: 'جراحة العظام' },
  { en: 'Pediatrics', ar: 'طب الأطفال' },
  { en: 'Internal Medicine', ar: 'الباطنة' },
  { en: 'Ophthalmology', ar: 'طب العيون' },
  { en: 'Neurology', ar: 'المخ والأعصاب' },
  { en: 'Psychiatry', ar: 'الطب النفسي' },
  { en: 'General Surgery', ar: 'الجراحة العامة' },
  { en: 'Obstetrics and Gynecology', ar: 'النساء والتوليد' },
  { en: 'Ear, Nose and Throat', ar: 'الأنف والأذن والحنجرة' },
  { en: 'Urology', ar: 'المسالك البولية' },
  { en: 'Pulmonology', ar: 'الأمراض الصدرية' },
  { en: 'Gastroenterology', ar: 'الجهاز الهضمي' },
  { en: 'Oncology', ar: 'الأورام' },
  { en: 'Nutrition and Dietetics', ar: 'التغذية العلاجية' },
  { en: 'Physiotherapy', ar: 'العلاج الطبيعي' },
  { en: 'Plastic Surgery', ar: 'جراحة التجميل' },
  { en: 'Endocrinology', ar: 'الغدد الصماء' }
];

export function getSpecialtyName(cat: string, locale: string) {
  const spec = SPECIALTIES.find(s => s.en.toLowerCase() === cat.toLowerCase());
  if (spec) return locale === 'ar' ? spec.ar : spec.en;
  return cat;
}
