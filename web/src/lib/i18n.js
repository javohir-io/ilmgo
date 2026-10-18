// Uzbek (Latin) labels and date words. API values (enums, statuses) stay English; the UI translates them here.
export const TYPE_LABEL = { Internship: 'Stajirovka', 'Part-time': 'Yarim stavka', 'Full-time': 'Toʻliq stavka', 'Co-op': 'Co-op dasturi' }
export const WORK_MODE_LABEL = { Remote: 'Masofaviy', Hybrid: 'Gibrid', 'On-site': 'Ofisda' }
export const LEVEL_LABEL = { Entry: 'Boshlangʻich', Junior: 'Junior', Mid: 'Middle' }
export const SKILL_LEVEL_LABEL = { Beginner: 'Boshlangʻich', Intermediate: 'Oʻrta', Advanced: 'Yuqori' }
export const STATUS_LABEL = {
  submitted: 'Yuborilgan', reviewing: 'Koʻrib chiqilmoqda', interview: 'Intervyu', offer: 'Taklif',
  rejected: 'Rad etilgan', withdrawn: 'Bekor qilingan', scheduled: 'Rejalashtirilgan', completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan', open: 'Ochiq', closed: 'Yopiq',
}
export const ROLE_LABEL = { admin: 'Administrator', student: 'Talaba' }

/** label(TYPE_LABEL, 'Remote') -> 'Masofaviy'; unknown values pass through. */
export const label = (map, value) => map[value] || value

export const MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']
export const MONTHS_LONG = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
export const WEEKDAYS_SHORT = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan']
export const WEEKDAYS_LONG = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba']
