// Built-in demo data (Uzbek) used ONLY when the API is unreachable (flagged as "demo maʼlumot" in the UI).
const future = (days) => new Date(Date.now() + days * 86400000).toISOString()

export const SAMPLE_JOBS = [
  { id: 'demo-1', title: 'Gameplay dasturchi (stajyor)', company: 'Northwind Studios', location: 'Toshkent', type: 'Internship', workMode: 'Hybrid', level: 'Entry', stipend: '$25–30 / soat', deadline: future(21), status: 'open', featured: true, accent: '#00638E', skills: ['C++', 'Unreal Engine', 'Git'],
    description: 'Kooperativ action oʻyini ustida ishlayotgan kichik gameplay jamoasiga qoʻshilasiz. Oʻyinchi qobiliyatlarini yaratasiz va sozlaysiz, dizaynerlar bilan hissiyot va tezlik ustida ishlaysiz hamda ishlab chiqarishdagi C++ kod bazasini ichidan oʻrganasiz.',
    requirements: ['Zamonaviy C++ni bilish', 'Chiziqli algebra asoslari', 'Oʻynash mumkin boʻlgan loyiha yoki game jam ishtiroki'], benefits: ['Birinchi kundan mentor', 'Darslarga mos moslashuvchan ish vaqti', 'Pullik konferensiya safari'], companyAbout: 'Northwind — kompyuter va konsollar uchun kooperativ oʻyinlar yaratadigan 40 kishilik studiya.' },
  { id: 'demo-2', title: 'Flutter dasturchi (stajyor)', company: 'Orbit Labs', location: 'Masofaviy', type: 'Internship', workMode: 'Remote', level: 'Entry', stipend: '$18–22 / soat', deadline: future(14), status: 'open', featured: true, accent: '#8CB9CC', skills: ['Flutter', 'Dart', 'REST'],
    description: 'Minglab talabalar foydalanadigan fintech mahsulotining mobil qismini yaratishda yordam berasiz. Ekranlarni dizayn topshirilishidan to chiqarilishigacha oʻzingiz boshqarasiz.',
    requirements: ['Kamida bitta chiqarilgan Flutter yoki mobil ilova', 'State management tushunchasi', 'Yaxshi yozma ingliz tili'], benefits: ['Toʻliq masofaviy', 'Oʻqish uchun byudjet', 'Doimiy ishga oʻtish yoʻli'], companyAbout: 'Orbit Labs — endigina boshlayotgan odamlar uchun moliyaviy vositalar yaratadi.' },
  { id: 'demo-3', title: 'Maʼlumotlar tahlilchisi (co-op)', company: 'Helix Analytics', location: 'Samarqand', type: 'Co-op', workMode: 'On-site', level: 'Junior', stipend: '$20 / soat', deadline: future(30), status: 'open', featured: true, accent: '#BFD8E3', skills: ['Python', 'SQL', 'Pandas'],
    description: 'Chakana savdo tahlili jamoasi bilan olti oylik co-op: mintaqaviy mijozlar uchun boshqaruv panellari, kohort tahlili va tajriba xulosalari.',
    requirements: ['SQL’ni yaxshi bilish', 'Python maʼlumotlar steki', 'Tartibsiz maʼlumotlarga qiziqish'], benefits: ['Tushlik bepul', 'Jamoa loyihalari almashinuvi'], companyAbout: 'Helix Markaziy Osiyoda chakana savdo maʼlumotlarini qarorlarga aylantiradi.' },
  { id: 'demo-4', title: 'Mahsulot dizayneri (stajyor)', company: 'Plume', location: 'Toshkent', type: 'Internship', workMode: 'Hybrid', level: 'Entry', stipend: '$15–20 / soat', deadline: future(18), status: 'open', featured: true, accent: '#004A6B', skills: ['Figma', 'Prototyping', 'UX Research'],
    description: 'Iste’molchi ilovasi ustida ikki nafar senior dizayner bilan yonma-yon ishlaysiz. Kichik foydalanuvchanlik tadqiqotlarini oʻtkazasiz va haqiqiy interfeys yaxshilanishlarini chiqarasiz.',
    requirements: ['2 va undan ortiq keys-stadili portfolio', 'Figma’ni erkin bilish'], benefits: ['Haftalik dizayn muhokamalari', 'Uskunalar taqdim etiladi'], companyAbout: 'Plume — dizaynga yoʻnaltirilgan mahsulot studiyasi.' },
  { id: 'demo-5', title: 'Backend muhandis (stajyor)', company: 'Kite Systems', location: 'Masofaviy', type: 'Internship', workMode: 'Remote', level: 'Junior', stipend: '$22–28 / soat', deadline: future(9), status: 'open', featured: true, accent: '#8CB9CC', skills: ['Node.js', 'PostgreSQL', 'Docker'],
    description: 'Logistika platformasi uchun API va fon ishchilarini yaratasiz. Kod koʻrib chiqish, navbatchilikni kuzatish va real ishlab chiqarish trafigi sizni kutadi.',
    requirements: ['REST API tajribasi', 'Relyatsion maʼlumotlar bazasi asoslari', 'Git bilan ishlash'], benefits: ['Masofaviy ishlashga yoʻnaltirilgan', 'Mentorlik', 'Ochiq kod uchun pullik vaqt'], companyAbout: 'Kite Systems dasturiy taʼminot yordamida yuklarni chegaralar boʻylab yetkazadi.' },
  { id: 'demo-6', title: 'ML muhandis (stajyor)', company: 'Quanta Vision', location: 'Toshkent', type: 'Internship', workMode: 'On-site', level: 'Mid', stipend: '$30 / soat', deadline: future(26), status: 'open', featured: true, accent: '#00638E', skills: ['Python', 'PyTorch', 'OpenCV'],
    description: 'Sanoat tekshiruvi uchun kompyuter koʻrish modellarini oʻqitasiz va joriy qilasiz. Baholash jarayonini oʻzingiz boshqarasiz va natijalarni mijozlarga taqdim etasiz.',
    requirements: ['PyTorch loyihasi tajribasi', 'Matematika asoslarini puxta bilish'], benefits: ['GPU klasteriga ruxsat', 'Tadqiqot oʻqish guruhi'], companyAbout: 'Quanta Vision zavodlar uchun tekshiruv tizimlarini yaratadi.' },
  { id: 'demo-7', title: 'Veb dasturchi (yarim stavka)', company: 'Meridian Media', location: 'Masofaviy', type: 'Part-time', workMode: 'Remote', level: 'Entry', stipend: '$12–16 / soat', deadline: future(12), status: 'open', featured: true, accent: '#BFD8E3', skills: ['React', 'CSS', 'GSAP'],
    description: 'Harakat va animatsiyaga ishqibozlar jamoasi bilan kampaniya saytlari va interaktiv hikoyalar yaratasiz. Haftasiga 15–20 soat, ma’ruzalarga moslab.',
    requirements: ['React asoslari', 'Tafsilotlarga eʼtibor'], benefits: ['Moslashuvchan jadval', 'Portfolioga arziydigan ishlar'], companyAbout: 'Meridian brendlar va tahririyatlar uchun interaktiv hikoyalar yaratadi.' },
  { id: 'demo-8', title: 'QA avtomatlashtirish (stajyor)', company: 'Lattice Pay', location: 'Toshkent', type: 'Internship', workMode: 'Hybrid', level: 'Entry', stipend: '$14–18 / soat', deadline: future(16), status: 'open', featured: true, accent: '#004A6B', skills: ['Playwright', 'TypeScript', 'CI'],
    description: 'Toʻlov mahsuloti uchun end-to-end testlar toʻplamini kengaytirasiz va jamoaga xatolarni mijozlardan oldin topishda yordam berasiz.',
    requirements: ['Istalgan skript tili', 'Testlash hunariga qiziqish'], benefits: ['Tizimli onboarding', 'Mentor'], companyAbout: 'Lattice Pay mahalliy savdogarlar uchun toʻlov sahifasini taʼminlaydi.' },
].map((j) => ({ imageUrl: null, createdAt: new Date().toISOString(), ...j }))

export const SAMPLE_META = {
  types: ['Internship', 'Part-time', 'Full-time', 'Co-op'],
  workModes: ['Remote', 'Hybrid', 'On-site'],
  levels: ['Entry', 'Junior', 'Mid'],
  skills: [],
}
export const findSampleJob = (id) => SAMPLE_JOBS.find((j) => j.id === id) || null
