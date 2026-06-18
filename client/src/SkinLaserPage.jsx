import React from 'react'
import { ArrowRight, Check } from 'lucide-react'

function SkinLaserPage({ scrollToSection, bookingFormRef }) {
  const concerns = [
    'Acne scars and post-acne marks',
    'Pigmentation and dark spots',
    'Melasma',
    'Sun damage and tanning',
    'Enlarged pores',
    'Oily skin',
    'Uneven skin tone',
    'Uneven skin texture',
    'Fine lines and early signs of ageing',
    'Dull and dehydrated skin',
    'Loss of skin elasticity',
  ]

  const treatments = [
    {
      title: 'Pico Hollywood Carbon Laser',
      description: 'A popular laser skin treatment that deeply cleanses pores, controls excess oil, improves skin texture, and enhances overall skin brightness. Ideal for individuals looking for refreshed, clearer, and healthier-looking skin.',
      benefits: ['Deep pore cleansing', 'Reduced oiliness', 'Brighter complexion', 'Refined pores', 'Improved skin texture'],
    },
    {
      title: 'Skin Resurfacing Treatment',
      description: 'Designed to improve rough skin texture, acne marks, fine lines, and early signs of ageing by encouraging healthy skin renewal and collagen support.',
      benefits: ['Smoother skin texture', 'Improved skin tone', 'Enhanced skin renewal', 'Refreshed appearance'],
    },
    {
      title: 'Acne Scar Treatment',
      description: 'Personalized acne scar treatments designed to improve skin texture, reduce visible scarring, and support collagen production for healthier-looking skin.',
      suitableFor: ['Acne scars', 'Post-acne marks', 'Boxcar scars', 'Rolling scars', 'Uneven skin texture'],
    },
    {
      title: 'Pigmentation Treatment',
      description: 'Customized solutions for melasma, sunspots, tanning, and uneven skin tone designed to improve skin clarity and create a more balanced complexion.',
      benefits: ['Reduced discoloration', 'More even skin tone', 'Enhanced skin brightness', 'Improved skin clarity'],
    },
    {
      title: 'Open Pore Treatment',
      description: 'Advanced treatments designed to reduce the appearance of enlarged pores and improve overall skin texture.',
      benefits: ['Reduced pore visibility', 'Better oil control', 'Smoother complexion', 'Improved skin quality'],
    },
    {
      title: 'Skin Rejuvenation Treatment',
      description: 'Refresh tired, dull, and ageing skin with treatments designed to improve hydration, elasticity, and overall skin health.',
      benefits: ['Improved hydration', 'Better skin texture', 'Enhanced radiance', 'Healthier-looking skin'],
    },
  ]

  const faqs = [
    {
      q: 'Which treatment is right for my skin concern?',
      a: 'The most suitable treatment depends on your skin type, concerns, and goals. A consultation allows our specialists to recommend a personalized treatment plan.',
    },
    {
      q: 'Is Pico Hollywood Carbon Laser suitable for oily skin?',
      a: 'Yes. It is commonly recommended for oily skin, enlarged pores, and dull complexion concerns.',
    },
    {
      q: 'Can acne scars be treated effectively?',
      a: 'Yes. Treatment plans are customized based on the type and severity of acne scarring to improve texture and overall skin appearance.',
    },
    {
      q: 'How many sessions will I need?',
      a: 'The number of sessions varies depending on your concern and treatment plan.',
    },
    {
      q: 'Is there downtime after laser treatments?',
      a: 'Many treatments involve minimal downtime, although recovery periods vary depending on the procedure performed.',
    },
    {
      q: 'Are these treatments suitable for all skin types?',
      a: 'Most treatments can be customized for different skin types after a professional skin assessment.',
    },
  ]

  return (
    <>
      {/* HERO */}
      <section className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', position: 'relative', background: 'linear-gradient(180deg, var(--color-bg-main) 0%, rgba(244, 237, 230, 0.4) 100%)' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <span className="section-subtitle">Expert Skin & Laser Treatments for Acne Scars, Pigmentation, Open Pores, Skin Resurfacing & Rejuvenation</span>
            <h1 className="section-title" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '24px' }}>
              Advanced Skin & Laser Treatments in Vijayawada for Acne Scars, Pigmentation & Skin Rejuvenation
            </h1>
            <p className="section-desc" style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '16px' }}>
              Healthy, confident skin starts with the right treatment approach. At Kairavam, we offer advanced skin and laser treatments designed to address common concerns such as acne scars, pigmentation, enlarged pores, uneven skin texture, dullness, and early signs of ageing.
            </p>
            <p className="section-desc" style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '24px' }}>
              Combining advanced technology with personalized care, our specialists create customized treatment plans based on your skin type, concerns, and goals.
            </p>
            <p className="section-desc" style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '32px' }}>
              Whether you're looking to improve skin clarity, restore radiance, or maintain long-term skin health, we're here to help you achieve healthier, naturally beautiful skin.
            </p>
            <button onClick={() => scrollToSection(bookingFormRef)} className="btn-gold" style={{ padding: '16px 40px', fontSize: '13px' }}>
              Book Your Consultation Today <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE KAIRAVAM */}
      <section className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff' }}>
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Why Choose Kairavam?</span>
            <h2 className="section-title">Your skin deserves more than a <span>one-size-fits-all</span> solution.</h2>
            <p className="section-desc">
              At Kairavam, every treatment begins with a detailed skin assessment to understand your concerns and recommend the most suitable treatment plan.
            </p>
          </div>

          <div style={{ marginTop: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', textAlign: 'center', color: 'var(--color-text-primary)' }}>What Makes Us Different?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {['Experienced Skin Specialists', 'Advanced FDA-Approved Technologies', 'Personalized Treatment Protocols', 'Thousands of Successful Treatments', 'Comprehensive Skin Assessments'].map((item, i) => (
                <div key={i} className="luxury-spa-card" style={{ padding: '24px', textAlign: 'center', gap: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-theme-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <Check size={18} style={{ color: 'var(--color-theme-primary)' }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SKIN CONCERNS WE TREAT */}
      <section className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', position: 'relative' }}>
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Skin Concerns We Treat</span>
            <h2 className="section-title">Our advanced skin clinic in Vijayawada <span>helps address</span>:</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
            {concerns.map((concern, i) => (
              <div key={i} className="row" style={{ gap: '10px', padding: '12px 16px', background: 'var(--color-bg-main)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-primary)' }}>
                <Check size={14} style={{ color: 'var(--color-theme-primary)', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{concern}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR ADVANCED SKIN & LASER TREATMENTS */}
      <section className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff' }}>
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Our Advanced Skin & Laser Treatments</span>
            <h2 className="section-title">Comprehensive solutions for <span>every skin concern</span></h2>
          </div>

          <div className="grid3" style={{ marginTop: '16px' }}>
            {treatments.map((t, i) => (
              <div key={i} className="luxury-spa-card" style={{ gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{t.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>{t.description}</p>
                {t.benefits && (
                  <div style={{ borderTop: '1px solid var(--color-border-primary)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-theme-secondary)', marginBottom: '8px', display: 'block' }}>Benefits:</span>
                    <div className="col" style={{ gap: '6px' }}>
                      {t.benefits.map((b, j) => (
                        <div key={j} className="row" style={{ gap: '8px' }}>
                          <Check size={12} style={{ color: 'var(--color-theme-primary)', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {t.suitableFor && (
                  <div style={{ borderTop: '1px solid var(--color-border-primary)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-theme-secondary)', marginBottom: '8px', display: 'block' }}>Suitable For:</span>
                    <div className="col" style={{ gap: '6px' }}>
                      {t.suitableFor.map((s, j) => (
                        <div key={j} className="row" style={{ gap: '8px' }}>
                          <Check size={12} style={{ color: 'var(--color-theme-primary)', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY PATIENTS TRUST KAIRAVAM */}
      <section className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Why Patients Trust Kairavam</span>
            <h2 className="section-title">Care that puts <span>you first</span></h2>
          </div>
          <div className="luxury-spa-card" style={{ maxWidth: '800px', margin: '0 auto', gap: '16px', padding: '40px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
              At Kairavam, we believe healthy skin begins with understanding your individual concerns. Rather than recommending generic solutions, we create personalized treatment plans designed around your skin's needs and long-term goals.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
              Our focus is on providing safe, professional, and result-oriented treatments while ensuring a comfortable and supportive experience throughout your journey.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff' }}>
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Frequently Asked Questions</span>
            <h2 className="section-title">Common <span>questions</span></h2>
          </div>

          <div className="accordion-wrapper" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {faqs.map((faq, i) => (
              <div key={i} className="accordion-item" style={{ borderRadius: 'var(--border-radius-md)' }}>
                <details style={{ cursor: 'pointer' }}>
                  <summary className="accordion-header" style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {faq.q}
                    <span style={{ fontSize: '12px', color: 'var(--color-theme-primary)' }}>+</span>
                  </summary>
                  <div className="accordion-content" style={{ padding: '16px 20px', fontSize: '13px', lineHeight: '1.6', borderTop: '1px solid var(--color-border-primary)' }}>
                    {faq.a}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOK YOUR CONSULTATION */}
      <section className="section-padding" style={{ position: 'relative', background: 'var(--color-theme-secondary)', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <span className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>Book Your Consultation at Kairavam</span>
            <h2 className="section-title" style={{ color: '#ffffff' }}>Looking for advanced skin treatments in <span style={{ color: 'var(--color-theme-light)' }}>Vijayawada</span>?</h2>
            <p className="section-desc" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>
              Whether your concern is acne scars, pigmentation, open pores, uneven texture, or skin rejuvenation, our specialists can help you identify the right treatment approach for your skin.
            </p>
            <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#ffffff', marginBottom: '24px' }}>Schedule Your Consultation Today</h3>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => scrollToSection(bookingFormRef)} className="btn-gold" style={{ padding: '14px 32px', fontSize: '12px', background: '#ffffff', color: 'var(--color-theme-secondary)' }}>
                Book an Appointment <ArrowRight size={14} />
              </button>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '24px', justifyContent: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '13px', flexWrap: 'wrap' }}>
              <span>Call Us | WhatsApp Us | Book an Appointment</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default SkinLaserPage
