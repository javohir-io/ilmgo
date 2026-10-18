import { useRef } from 'react'
import CountUp from '../../components/CountUp'
import Icon from '../../components/Icon'
import MatchRing from '../../components/MatchRing'
import StatusPill from '../../components/StatusPill'
import { useReveal } from '../../lib/motion'

const STAGES = ['submitted', 'reviewing', 'interview', 'offer']

export default function Bento() {
  const root = useRef(null)
  useReveal(root)
  return (
    <section id="features" ref={root} className="section" aria-labelledby="feat-title">
      <div className="container">
        <p className="eyebrow" data-reveal>Imkoniyatlar</p>
        <h2 id="feat-title" className="h-section" data-reveal>Talabalar <span className="grad-text">haqiqatan ariza beradigan</span> tarzda yaratilgan.</h2>
        <div className="bento" data-reveal="group">
          <article className="bento__card bento__card--match glass glass--lg">
            <MatchRing value={87} size={104} />
            <div><h3>Koʻnikma moslik balli</h3><p className="muted">Har bir vakansiya sizning koʻnikmalaringiz uni qanchalik qoplashini va keyin qaysi koʻnikmalarni oʻrganish kerakligini koʻrsatadi.</p></div>
          </article>
          <article className="bento__card bento__card--pipe glass glass--lg">
            <h3>Jonli ariza jarayoni</h3>
            <p className="muted">Yuborilgan, koʻrib chiqilmoqda, intervyu, taklif — bitta vaqt chizigʻi, doim dolzarb.</p>
            <ol className="pipe" aria-label="Jarayon namunasi">
              {STAGES.map((s, i) => (<li key={s} className="pipe__node" style={{ '--i': i }}><StatusPill status={s} /></li>))}
            </ol>
          </article>
          <article className="bento__card glass glass--lg">
            <h3>Aqlli intervyu vaqtlari</h3>
            <p className="muted">Faqat boʻsh vaqtlar. Dam olish kunlari va oʻtib ketgan vaqtlar hech qachon taklif qilinmaydi, bir vaqtni ikki marta band qilib boʻlmaydi.</p>
            <div className="slots-demo" aria-hidden="true">{['09:00', '09:30', '10:00', '13:30', '14:00', '15:00'].map((t, i) => <span key={t} className={`chip ${i === 4 ? 'is-on' : ''} ${i === 1 ? 'is-off' : ''}`}>{t}</span>)}</div>
          </article>
          <article className="bento__card glass glass--lg">
            <span className="bento__ico"><Icon name="bell" size={22} /></span>
            <h3>Tezkor bildirishnomalar</h3>
            <p className="muted">Holat oʻzgarishi yoki belgilangan intervyu sodir boʻlgan zahoti qutingizga tushadi.</p>
            <span className="badge-demo" aria-hidden="true">3</span>
          </article>
          <article className="bento__card glass glass--lg">
            <h3>Profil toʻliqligi</h3>
            <p className="muted">Ish beruvchilar haqiqatan ochib koʻradigan profilni yaratishga yoʻnaltiruvchi bosqichma-bosqich roʻyxat.</p>
            <div className="meter" aria-hidden="true"><i style={{ '--w': '78%' }} /></div>
            <p className="faint"><CountUp to={78} suffix="% toʻldirilgan" /></p>
          </article>
          <article className="bento__card bento__card--admin glass glass--lg">
            <h3>Uy vazifasiga oʻxshamaydigan admin paneli</h3>
            <p className="muted">Karyera markazlari sudrab-tashlanadigan kanban, vakansiyalarni boshqarish, CSV eksport va jonli grafiklarga ega boʻladi.</p>
            <div className="kb" aria-hidden="true">{[3, 2, 4, 1].map((n, c) => <div key={c} className="kb__col">{Array.from({ length: n }, (_, k) => <i key={k} style={{ '--c': `var(--st-${STAGES[c]})` }} />)}</div>)}</div>
          </article>
        </div>
        <ul className="stats" data-reveal="group" aria-label="Ilmgo raqamlarda">
          <li><strong><CountUp to={2400} suffix="+" /></strong><span className="muted">talaba qoʻshildi</span></li>
          <li><strong><CountUp to={180} suffix="+" /></strong><span className="muted">hamkor kompaniya</span></li>
          <li><strong><CountUp to={92} suffix="%" /></strong><span className="muted">bir hafta ichida javob oladi</span></li>
          <li><strong><CountUp to={4} suffix=" daqiqa" /></strong><span className="muted">ariza topshirishning oʻrtacha vaqti</span></li>
        </ul>
        <p className="faint stats__note">Raqamlar demo mahsulot uchun misol sifatida keltirilgan.</p>
      </div>
    </section>
  )
}
