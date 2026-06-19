import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Phone,
  ArrowRight,
  Star,
  MessageSquare,
  MessageCircle,
  Calendar,
  MapPin,
  Clock,
  ArrowUpRight,
  Brain,
  CheckCircle,
  Zap,
  ShieldCheck,
  Award,
  Droplets,
  Send,
  Menu,
  Play,
  ExternalLink,
  ClipboardList,
  Activity,
  Target,
  Scan,
  Heart,
  Syringe
} from 'lucide-react'
import { submitBooking } from './api'
import './App.css'

const TypewriterText = ({ text, speed = 25 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

const useInView = (threshold = 0.15) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    }, { threshold })
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, inView]
}

const CountUp = ({ end, suffix = '', decimals = 0, duration = 2000 }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const startTime = performance.now()
        const startVal = 0

        const animate = (now) => {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(startVal + (end - startVal) * eased)
          if (progress < 1) requestAnimationFrame(animate)
        }

        requestAnimationFrame(animate)
        observer.disconnect()
      }
    }, { threshold: 0.5 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count.toFixed(decimals)}{suffix}</span>
}

function App() {
  // --- STATE MANAGEMENT ---
  const [announcementVisible, setAnnouncementVisible] = useState(true)
  const [treatmentFilter, setTreatmentFilter] = useState('All')
  const [activeTreatmentIndex, setActiveTreatmentIndex] = useState(0)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [activeCompareCategory, setActiveCompareCategory] = useState('skin')
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [activeJourneyStep, setActiveJourneyStep] = useState(1)
  const [expandedReviews, setExpandedReviews] = useState({})
  const [techBarAnimated, setTechBarAnimated] = useState(false)

  // Skin Quiz State
  const [quizStep, setQuizStep] = useState(1)
  const [selectedConcern, setSelectedConcern] = useState(null)
  const [selectedSkinType, setSelectedSkinType] = useState(null)
  const [quizResult, setQuizResult] = useState(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Initializing skin diagnostics...')
  const [quizLang, setQuizLang] = useState('en') // 'en' or 'te'
  const [quizCustomInput, setQuizCustomInput] = useState('') // free-text concern input
  const [quizImageBase64, setQuizImageBase64] = useState(null)
  const [quizImagePreview, setQuizImagePreview] = useState(null)

  // Booking Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    treatment: '',
    date: '',
    notes: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [formTouched, setFormTouched] = useState({})
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)

  // Interactive Video Modal State
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // References
  const bookingFormRef = useRef(null)
  const quizRef = useRef(null)
  const treatmentsRef = useRef(null)
  const sliderRef = useRef(null)
  const reviewsScrollRef = useRef(null)

  // --- HANDLERS & HELPERS ---

  // Smooth Scroll Helper
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Handle FAQ Toggle
  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  // Handle Before/After Slider Drag (mouse + touch)
  const draggingRef = useRef(false)

  const handleSliderStart = (e) => {
    e.preventDefault()
    draggingRef.current = true
    const rect = sliderRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const pos = Math.round(((clientX - rect.left) / rect.width) * 100)
    setSliderPosition(Math.min(100, Math.max(0, pos)))

    const handleMove = (ev) => {
      if (!draggingRef.current) return
      const r = sliderRef.current.getBoundingClientRect()
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX
      const p = Math.round(((cx - r.left) / r.width) * 100)
      setSliderPosition(Math.min(100, Math.max(0, p)))
    }

    const handleEnd = () => {
      draggingRef.current = false
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)
  }

  // AI Quiz Logic
  const handleQuizConcern = (concern) => {
    setSelectedConcern(concern)
    setQuizStep(2)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setQuizImageBase64(reader.result)
        setQuizImagePreview(URL.createObjectURL(file))
        setSelectedConcern("Image Analysis")
        setQuizStep(2)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleQuizSkinType = async (skinType) => {
    const startTime = Date.now()
    setSelectedSkinType(skinType)
    setQuizStep('loading')

    let recommended = ''
    let details = ''
    let startingPrice = ''
    let slug = ''
    let layer = ''
    let sessions = ''
    let downtime = ''

    // 1. Calculate static fallbacks first
    if (selectedConcern === 'Acne Scars' || selectedConcern === 'మొటిమల మచ్చలు & అసమతలం') {
      recommended = 'Pico Hollywood Carbon Laser & Skin Resurfacing'
      details = 'Dr. Yamini recommends our dual-action approach. The Carbon Peel purifies active pores, while skin resurfacing stimulates fresh collagen to level out scar depth.'
      startingPrice = '₹5,000'
      slug = 'Pico Hollywood Carbon Laser'
      layer = 'Dermal Collagen Layer'
      sessions = '3–5 Sessions'
      downtime = '1–2 Days (Mild Redness)'
    } else if (selectedConcern === 'Pigmentation' || selectedConcern === 'వర్ణద్రవ్యం & మెలాస్మా') {
      recommended = 'Q-Switched Laser Toning'
      details = 'To break down deep melasma or hyperpigmentation, Dr. Yamini recommends Q-switched laser toning. It targets melanin without peeling or heating the outer skin layer.'
      startingPrice = '₹3,000'
      slug = 'Laser Toning'
      layer = 'Epidermal Melanin'
      sessions = '4–6 Sessions'
      downtime = 'None (Immediate Glow)'
    } else {
      recommended = 'Clinical Skin Resurfacing'
      details = 'For overall skin texture improvement and rejuvenation, Dr. Yamini recommends Clinical Skin Resurfacing to stimulate collagen production and reveal healthier skin.'
      startingPrice = '₹4,000'
      slug = 'Clinical Skin Resurfacing'
      layer = 'Epidermal & Dermal Layers'
      sessions = '4–6 Sessions'
      downtime = '1–2 Days (Mild Redness)'
    }

    let details_te = quizLang === 'te' ? 'మీ సమస్యకు తగిన సరైన చికిత్సను అందించడానికి డా. యమిని తగిన చికిత్సను సిఫార్సు చేస్తున్నారు.' : undefined;

    // 2. Call backend API for real-time analysis
    try {
      const response = await fetch('http://localhost:3001/api/assess-skin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          concern: selectedConcern,
          skinType: skinType,
          lang: quizLang,
          image: quizImageBase64
        })
      });

      if (response.ok) {
        const aiResult = await response.json();
        if (aiResult.recommended && aiResult.details) {
          recommended = aiResult.recommended;
          details = aiResult.details;
          details_te = aiResult.details_te || details_te;
          startingPrice = aiResult.startingPrice || startingPrice;
          slug = aiResult.slug || slug;
          layer = aiResult.layer || layer;
          sessions = aiResult.sessions || sessions;
          downtime = aiResult.downtime || downtime;
        }
      }
    } catch (err) {
      console.warn("Backend AI assessment failed, using local fallback diagnostic.", err);
    }

    setQuizResult({ recommended, details, details_te, startingPrice, slug, layer, sessions, downtime })

    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, 2200 - elapsed)
    setTimeout(() => {
      setQuizStep(3)
    }, remaining)
  }

  // Simulated AI diagnostics timer
  useEffect(() => {
    if (quizStep !== 'loading') {
      setLoadingProgress(0)
      return
    }

    const msg = {
      init: quizLang === 'te' ? 'చర్మ నిర్ధారణ ప్రారంభిస్తోంది...' : 'Initializing skin diagnostics...',
      analyzing: quizLang === 'te'
        ? `${selectedConcern} కోసం చర్మ అనుకూలత విశ్లేషిస్తోంది...`
        : `Analyzing epidermal compatibility for ${selectedConcern}...`,
      crossMatch: quizLang === 'te'
        ? `${selectedSkinType} చర్మ ప్రొఫైల్‌తో సరిపోల్చుతోంది...`
        : `Cross-matching with ${selectedSkinType} skin profile...`,
      formulating: quizLang === 'te'
        ? 'డా. యమిని చికిత్స సిఫారసు రూపొందిస్తోంది...'
        : "Formulating Dr. Yamini's treatment recommendations..."
    }
    setLoadingText(msg.init)

    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setLoadingProgress(progress)

      if (progress === 30) setLoadingText(msg.analyzing)
      else if (progress === 60) setLoadingText(msg.crossMatch)
      else if (progress === 90) setLoadingText(msg.formulating)

      if (progress >= 100) clearInterval(interval)
    }, 200)

    return () => clearInterval(interval)
  }, [quizStep, selectedConcern, selectedSkinType, quizLang])

  const resetQuiz = () => {
    setQuizStep(1)
    setSelectedConcern(null)
    setSelectedSkinType(null)
    setQuizResult(null)
    setLoadingProgress(0)
    setLoadingText('Initializing skin diagnostics...')
    setQuizCustomInput('')
    setQuizImageBase64(null)
    setQuizImagePreview(null)
  }

  const toggleReviewExpand = (idx) => {
    setExpandedReviews(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }


  const applyQuizRecommendation = () => {
    if (quizResult) {
      setFormData(prev => ({
        ...prev,
        treatment: quizResult.slug
      }))
      scrollToSection(bookingFormRef)
    }
  }

  // Booking Form Validation
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (/\d/.test(value)) return 'Name should not contain numbers'
        return ''
      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        if (!/^\d{10}$/.test(value.trim())) return 'Please enter a valid 10-digit phone number'
        return ''
      case 'treatment':
        if (!value) return 'Please select a treatment'
        return ''
      case 'date':
        if (!value) return 'Please select a preferred date'
        const selected = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selected < today) return 'Date cannot be in the past'
        return ''
      default:
        return ''
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formTouched[name]) {
      const error = validateField(name, value)
      setFormErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setFormTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setFormErrors(prev => ({ ...prev, [name]: error }))
  }

  const getFieldClass = (name) => {
    if (!formTouched[name]) return 'form-control'
    return formErrors[name] ? 'form-control error' : 'form-control valid'
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    const fields = ['name', 'phone', 'treatment', 'date']
    const touched = {}
    fields.forEach(f => {
      touched[f] = true
      const err = validateField(f, formData[f])
      if (err) errors[f] = err
    })
    setFormTouched(prev => ({ ...prev, ...touched }))

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setEmailSending(true)

    try {
      await submitBooking({
        name: formData.name,
        phone: formData.phone,
        treatment: formData.treatment,
        date: formData.date,
        notes: formData.notes
      })
      setFormSubmitted(true)
    } catch {
      alert('Failed to submit booking. Please try again or call us at 7998777666.')
    } finally {
      setEmailSending(false)
    }
  }

  // Reset Booking Form
  const resetBookingForm = () => {
    setFormData({
      name: '',
      phone: '',
      treatment: '',
      date: '',
      notes: ''
    })
    setFormSubmitted(false)
  }

  // Newsletter Submit
  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (newsletterEmail.trim() && newsletterEmail.includes('@')) {
      setNewsletterSubscribed(true)
      setNewsletterEmail('')
      setTimeout(() => setNewsletterSubscribed(false), 5000)
    }
  }

  // --- DATA SOURCE CONFIGURATIONS ---

  const treatments = [
    {
      id: 'pico',
      title: 'Pico Hollywood Carbon Laser',
      category: 'Skin Laser & Glow',
      badge: 'Most Advanced',
      desc: 'Achieve instant glow, deep cleansing and brighter skin with advanced carbon laser technology.',
      bullets: [
        'Deep Cleansing & Oil Control',
        'Instant Glow & Skin Brightening',
        'Reduces Open Pores',
        'Improves Skin Texture',
        'Stimulates Collagen Production'
      ],
      price: '₹3,000',
      range: '₹3,000 - ₹7,000 / Session',
      offer: 'Up To 40% OFF',
      image: '/carbon-peel.jpg'
    },
    {
      id: 'resurfacing',
      title: 'Skin Resurfacing Treatment',
      category: 'Scar & Texture',
      badge: 'Dermal Renewal',
      desc: 'Advanced laser resurfacing helps improve damaged skin and promotes smoother texture.',
      bullets: [
        'Reduces Fine Lines',
        'Improves Skin Texture',
        'Enhances Skin Tone',
        'Stimulates New Collagen',
        'Younger Looking Skin'
      ],
      price: '₹6,000',
      range: '₹6,000 - ₹9,000',
      image: '/laser-uhr3.jpg'
    },
    {
      id: 'acne-scar',
      title: 'Acne Scar Treatment',
      category: 'Scar & Texture',
      badge: 'Texture Revision',
      desc: 'Advanced laser treatments designed to reduce acne scars and improve skin smoothness.',
      bullets: [
        'Reduces Acne Scars',
        'Smoothens Skin Surface',
        'Improves Texture',
        'Boosts Confidence',
        'Long-Term Results'
      ],
      price: '₹5,500',
      range: '₹5,500 - ₹8,500',
      image: '/laser-uhr1.jpg'
    },
    {
      id: 'pigmentation',
      title: 'Pigmentation Treatment',
      category: 'Pigmentation & Glow',
      badge: 'Tone Correction',
      desc: 'Target unwanted pigmentation, tanning and uneven skin tone effectively.',
      bullets: [
        'Reduces Pigmentation',
        'Even Skin Tone',
        'Brighter Complexion',
        'Improves Skin Clarity',
        'Safe & Effective Results'
      ],
      price: '₹3,000',
      range: '₹3,000 - ₹7,000',
      image: '/laser-toning.jpg'
    },
    {
      id: 'open-pores',
      title: 'Open Pores Treatment',
      category: 'Skin Laser & Glow',
      badge: 'Pore Tightening',
      desc: 'Minimize enlarged pores and achieve refined skin texture.',
      bullets: [
        'Tighter Looking Skin',
        'Reduced Pore Visibility',
        'Improved Texture',
        'Oil Control',
        'Enhanced Glow'
      ],
      price: '₹4,500',
      range: '₹4,000 - ₹6,000',
      image: '/carbonpeel1.jpg'
    },
    {
      id: 'rejuvenation',
      title: 'Skin Rejuvenation',
      category: 'Pigmentation & Glow',
      badge: 'Premium Glow',
      desc: 'Restore youthful, healthy and radiant skin.',
      bullets: [
        'Collagen Stimulation',
        'Improved Elasticity',
        'Natural Glow',
        'Hydrated Appearance',
        'Younger Looking Skin'
      ],
      price: '₹4,000',
      range: '₹4,000 - ₹6,500',
      image: '/pmu-lip1.jpg'
    },
    {
      id: 'laser-hair-reduction',
      title: 'Laser Hair Reduction',
      category: 'Hair & Scalp',
      badge: 'Permanent Reduction',
      desc: 'Long term hair reduction with no ingrown hair or skin darkening. Saves time and effort.',
      bullets: [
        'Long Term Hair Reduction',
        'No Ingrown Hair or Skin Darkening',
        'Saves Time and Effort',
        'Safe for All Skin Types',
        'Smooth & Hair-Free Skin'
      ],
      price: '₹1,000',
      range: '₹1,000 - ₹30,000 / Session',
      offer: 'Up To 40% OFF',
      image: '/laser-uhr2.jpg'
    },
    {
      id: 'hair-gfc',
      title: 'Hair GFC Therapy',
      category: 'Hair & Scalp',
      badge: 'Growth Factor',
      desc: 'Safe and natural treatment that reduces hair fall and promotes hair regrowth and density.',
      bullets: [
        'Reduces Hair Fall',
        'Promotes Hair Regrowth & Density',
        'Safe & Natural Treatment',
        'Stimulates Hair Follicles',
        'Non-Surgical Solution'
      ],
      price: '₹5,000',
      range: '₹5,000 - ₹10,000 / Session',
      offer: 'Up To 40% OFF',
      image: '/hair-gfc.jpg'
    },
    {
      id: 'pmu-eyebrows',
      title: 'PMU Eyebrows',
      category: 'PMU & Permanent Makeup',
      badge: 'Perfect Shape',
      desc: 'Saves time everyday with perfect shape, symmetry and long-lasting smudgeproof results.',
      bullets: [
        'Saves Time Everyday',
        'Perfect Shape & Symmetry',
        'Long Lasting & Smudgeproof',
        'Microblading/Ombre/Combination',
        'Natural Looking Results'
      ],
      price: '₹20,000',
      range: '₹20,000 - ₹40,000',
      offer: 'Up To 25% OFF',
      image: '/pmu-eyebrows1.jpg'
    },
    {
      id: 'pmu-lipblush',
      title: 'PMU Lipblush',
      category: 'PMU & Permanent Makeup',
      badge: 'Lip Enhancement',
      desc: 'Defines lip borders and enhances natural lip colour for a long lasting and low maintenance look.',
      bullets: [
        'Defines Lip Borders',
        'Enhances Natural Lip Colour',
        'Long Lasting & Low Maintenance',
        'Pigmentation Correction',
        'Natural Finish'
      ],
      price: '₹20,000',
      range: '₹20,000 - ₹40,000',
      offer: 'Up To 25% OFF',
      image: '/pmu-lip1.jpg'
    },
    {
      id: 'scalp-micropigmentation',
      title: 'Scalp Micropigmentation',
      category: 'Hair & Scalp',
      badge: 'Non-Surgical',
      desc: 'Instant fuller hair look with quick results. Non-surgical, low maintenance and long lasting.',
      bullets: [
        'Instant Fuller Hair Look',
        'Quick Results, Non-Surgical',
        'Low Maintenance & Long Lasting',
        'Customized Treatment',
        'Natural Appearance'
      ],
      price: '₹20,000',
      range: '₹20,000 - ₹1,00,000',
      offer: '',
      image: '/hair-transplant.jpg'
    }
  ]

  const beforeAfterImages = {
    skin: {
      before: '/before_face.png',
      after: '/after_face.png',
      title: 'Carbon Laser Resurfacing (Acne Scars & Glow)',
      text: 'After 3 sessions: Clean pores, normalized sebum, and 85% improvement in texture.'
    }
  }

  const faqList = [
    {
      q: 'Is Carbon Laser safe?',
      a: 'Yes, Carbon Laser is a safe, FDA-approved non-invasive procedure. It uses a layer of carbon lotion applied to the skin, which is then gently targeted by a Q-switched ND:YAG laser. The laser energy is absorbed by the carbon particles, removing dead skin cells, excess oil, and impurities without damaging the surrounding tissue. At Kairavam, every session is performed under the direct supervision of our experienced medical team. We conduct a thorough skin assessment before treatment to ensure it is right for your skin type and condition.'
    },
    {
      q: 'How many sessions are required?',
      a: 'The number of sessions depends on your specific skin concerns, the severity of the condition, and your desired outcome. For most patients, a series of 4 to 6 sessions spaced 2 to 3 weeks apart delivers optimal results. Acne scars and pigmentation may require additional sessions for maximum improvement. During your initial consultation at Kairavam, our specialist will evaluate your skin and design a customized treatment plan with a clear session roadmap. Maintenance sessions every few months help sustain the results long-term.'
    },
    {
      q: 'Is there any downtime?',
      a: 'Carbon Laser is a lunchtime procedure with virtually zero downtime. You may experience mild redness or a slight tingling sensation immediately after the session, which typically subsides within a few hours. There is no peeling, crusting, or recovery period, so you can apply makeup and return to work or social activities right away. We recommend avoiding direct sun exposure and using a gentle sunscreen for a few days post-treatment. This makes it one of the most convenient laser treatments for busy individuals.'
    },
    {
      q: 'Can pigmentation be permanently removed?',
      a: 'While results depend on the type and cause of pigmentation, advanced laser treatments at Kairavam can deliver long-lasting and significant clearance. Melasma, sun spots, post-inflammatory hyperpigmentation, and freckles all respond well to targeted laser therapy. Multiple sessions are typically needed, and ongoing sun protection plays a critical role in preventing recurrence. Our specialists combine laser treatment with medical-grade skincare to maximize and prolong results. A personalized approach ensures the best possible outcome for your unique pigmentation concern.'
    },
    {
      q: 'Is consultation necessary?',
      a: 'Yes, a consultation is essential before any laser or aesthetic treatment. During your visit to Kairavam, our expert will perform a detailed skin analysis using advanced diagnostic tools to assess your skin type, concerns, and medical history. This allows us to recommend the most effective and safest treatment options tailored specifically to you. We also discuss expected outcomes, number of sessions, preparation steps, and aftercare in detail. Your consultation ensures that you receive a fully customized plan designed for your unique needs and goals.'
    }
  ]

  const googleReviews = [
    {
      author: "Swathi Komakula (swathikomakula24)",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjXVH1IijQteqyI8awHOzPLQxJA4kl2otblwIbjr-T5_cQK0aKU=w90-h90-p-rp-mo-ba12-br100",
      stars: 5,
      role: "Local Guide · 15 reviews · 4 photos",
      date: "a year ago",
      text: "✨ Amazing Hair Botox Experience at Kairavaram Salon! ✨\n\nI recently had a Hair Botox treatment at Kairavaram Salon, and I couldn't be happier with the results! From start to finish, the experience was absolutely fantastic. The team was professional, attentive, and made sure I was comfortable throughout the process.\n\nMy hair feels silky smooth, frizz-free, and healthier than ever! The shine and softness are truly unbelievable, and I can already feel the long-lasting benefits of the treatment. The salon ambiance was relaxing, and the service was top-notch.\n\nIf you're looking for expert hair care and a transformation that makes you fall in love with your hair again, I highly recommend Kairavaram Salon! Thank you for the incredible service! ✨",
      services: ["Hairstyling"],
      requestedStyle: "Permanent hair Botox treatment",
      hairType: "My hair before the botox treatment it is frezz",
      photos: [
        "https://lh3.googleusercontent.com/grass-cs/ANxoTn3HjMozC75nTEVvysL4PN__CSQ76sBYNCZJ0g1s03KMJauZKKOLh0kyaU57eXCsksN4bfUe80YYAvVXsKjOqLyf02wLzARlaBEPgF5rI64440nHmUm-GRNmCj2ujXr6NIbfLGDR=s157-p-k-rw",
        "https://lh3.googleusercontent.com/grass-cs/ANxoTn2bYrlpX_fkYIPYN_84yk-DdiBHwtmFMVEYNg-7c_dzP0NBEknHhb6b1f5x_8ItfwmhAmHIrwUs0e983YxlocwFv4eLdyJy2HEmcv4r3Lc2uUpb-SdJRpzuO2mMUBOaFyzGcKKm=s157-p-k-rw"
      ],
      source: "Google Maps"
    },
    {
      author: "Dr.Arshad Shaik",
      avatar: null,
      stars: 5,
      role: "1 review · 3 photos",
      date: "10 months ago",
      text: "Mr Reehan..\nHad done a very good styling with a decent look\nVery much satisfied with the service\nMust visit",
      services: ["Shampoo & conditioning", "Shaving", "Hairstyling"],
      photos: [
        "https://lh3.googleusercontent.com/grass-cs/ANxoTn3gAlWC-VwcQGLQZ8LqGUzgWQu_DAVtUUKWlm-goSmB4SnmOHIDQgRuY5-XSnd-o6z5MuskTcd0jIe0Wgny-WoDvJf4XlYPh_q-ObtX5hE5pLrNzW7ms5YsytL-V-FmUanYIz1Nv0hpLwya=s157-p-k-rw",
        "https://lh3.googleusercontent.com/grass-cs/ANxoTn1cEc-XjP4-lo9vdxKppQbECGMlaQbH7Zml1HHuR0KGcUIp_rXCpJ9K2hG7aYSA3HuAAwetSMyMROwWC2RQ2R36TKF2ax2MEdVG9eogwYvp1MIfKITFVKSvypFvmEKtmi6xAmCLguhavcY=s157-p-k-rw",
        "https://lh3.googleusercontent.com/grass-cs/ANxoTn2gGKGfxs4jLlpRSfNEp_nDmG-DBqIwMLp-vq5WkebKbMxNQ__KdXV-X8nbjNN4Nr1HzL5kAeDQHNFqnR6lgscU6Mh_fPICySrKAXtwk8V1kZ50i-cCUavImXsk-JTqmwMhfcZGXgT6Jx3m=s157-p-k-rw"
      ],
      source: "Google Maps"
    },
    {
      author: "saiprakash tirupati",
      avatar: null,
      stars: 5,
      role: "3 reviews · 1 photo",
      date: "a year ago",
      text: "Wonderful Facial Treatment,Super relaxing thinking about details such as Lighting,Soft music.....staff are well trained and professional...and my skin was silky soft afterwards 💕... Haircut and Beard was done Greatly.....\n\nWorthy for every single rupee..\n\nHere you can VIP Rooms...I took that one only.. I'm posting my review and Photo.... Definately Biggest salon in Andhra Pradesh",
      services: ["Haircut", "Manicure", "Shampoo & conditioning", "Blowouts", "Shaving"],
      link: "https://maps.app.goo.gl/BTTjxbWby2cxPYUG9",
      source: "Google Maps"
    },
    {
      author: "chandu sapparapu",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjWtXvJ8R-qyqlW51fZua2at-fnE13rU1bedsTY-eBiOw4oGSaBr=w45-h45-p-rp-mo-br100",
      stars: 5,
      role: "4 reviews",
      date: "a year ago",
      text: "Best experience in this salon me and my family have visited they doing kids haircut also and my kid was not crying at all....Very happy after the haircut..for kids and ladies best Salon in Vijayawada.....\n\nThey are offering VIP Rooms Also for Premium Customers and Kitty parties also there for Ladies package....",
      services: ["Haircut", "Manicure", "Shampoo & conditioning", "Eyebrow beautification", "Blowouts", "Body waxing", "Hairstyling", "Pedicure", "Waxing", "Facials"],
      source: "Google Maps"
    },
    {
      author: "Bharath Gupta",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjUsQDvwQSBCy32xfp91tlArUjFkTuJE93TsAkhgwiFpqJk9wvFZjg=w45-h45-p-rp-mo-ba12-br100",
      stars: 5,
      role: "Local Guide · 139 reviews · 201 photos",
      date: "a year ago",
      text: "Amazing experience\nWorth every penny\n\nHad de tan treatment and shaving.\nThe staff is extremely professional and well versed in their crafts\n\nHighly recommended",
      photos: [
        "https://lh3.googleusercontent.com/grass-cs/ANxoTn2jT5PvI_Ir9lZc437dYgv9pWKt9aoMr2NZ9ECUl3JpR89v3_2aRUDjuJuZHaG99v2rYE-d6lxcdJpvVOVjkZmE3VV6WyfA4NYkze_D8oySNz0EV123fYPtLb6_8aWW1cZAJz3W=s157-p-k-rw"
      ],
      source: "Google Maps"
    },
    {
      author: "Pavan Naidu",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjUew5R_S0awCUNddFiJqpyArLktQ9GzXhCOSFOIqiq9rzKnH1iX=w90-h90-p-rp-mo-br100",
      stars: 5,
      role: "1 review",
      date: "a month ago",
      text: "I had a really nice experience at this place. The atmosphere was pleasant, the staff were friendly and helpful, and everything was well maintained. I truly enjoyed my time here and would definitely recommend it to others.",
      source: "Google Maps"
    },
    {
      author: "BOBBY .08",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjUgZjFjbbyAU_bK4O8xLowj-sdFWL0ia4VDbryrOl2Onpzqqt1KWA=w90-h90-p-rp-mo-ba12-br100",
      stars: 5,
      role: "Local Guide · 7 reviews · 34 photos",
      date: "10 months ago",
      text: "Recently visited Kairavam Hair Saloon and was impressed from start to finish. The ambience is modern, clean, and relaxing & also a place where you instantly feel comfortable. The service was attentive and professional, with the staff ensuring every detail was taken care of. Pricing is reasonable for the quality, and the friendly team makes you feel like a valued guest. Their membership plan is genuinely worth it, offering great savings and perks. I especially appreciated the free, expert guidance on hair care, which felt personalised and genuinely helpful. Definitely a must visit place.",
      source: "Google Maps"
    },
    {
      author: "AKSHARA VUMMITI",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjVlLW7n5oRqjhGFOcSmHqduQLVaBdqM_4hjQUp4IGHYo33AdTw2=w90-h90-p-rp-mo-br100",
      stars: 5,
      role: "7 reviews",
      date: "10 months ago",
      text: "Really good service! They did my eyebrows very nicely, waxing was smooth, and the hair spa made my hair feel soft and healthy. The place looks nice and has a relaxing vibe. I liked it a lot.\nHighly recommend!",
      source: "Google Maps"
    },
    {
      author: "Venkataapparao Yandrapu",
      avatar: null,
      stars: 5,
      role: "1 review · 1 photo",
      date: "a year ago",
      text: "Services are next level and Hospitality is another next level...They are greeting customers in a Good way....If any problem is there they are telling us before the service then they are doing the Services...",
      services: ["Haircut", "Manicure", "Shampoo & conditioning", "Pedicure", "Online beauty salon booking"],
      source: "Google Maps"
    },
    {
      author: "SRAVYA KODATI",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjUbSLAaSRLxDHFrhnsH5wlVcAnH8qt8G0vk-NKJ2zjobfrVU1Y=w90-h90-p-rp-mo-br100",
      stars: 5,
      role: "2 reviews",
      date: "a year ago",
      text: "Recently, I have undergone hair spa and hair cut service. It was good and done by Sameer. The ambience is nice. One of the premium salons in vijayawada.",
      services: ["Spa services"],
      source: "Google Maps"
    }
  ]

  // Filter treatments
  const filteredTreatments = treatmentFilter === 'All'
    ? treatments
    : treatments.filter(t => t.category === treatmentFilter)

  useEffect(() => {
    setActiveTreatmentIndex(0)
  }, [treatmentFilter])

  // Automatic scrolling for reviews
  useEffect(() => {
    const container = reviewsScrollRef.current;
    if (!container) return;

    let animationId;
    let scrollSpeed = 0.55; // slow, smooth scrolling speed (pixels per frame)
    let isHovered = false;

    const handleMouseEnter = () => {
      isHovered = true;
    };
    const handleMouseLeave = () => {
      isHovered = false;
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleMouseEnter, { passive: true });
    container.addEventListener('touchend', handleMouseLeave, { passive: true });

    const scroll = () => {
      if (!isHovered) {
        container.scrollLeft += scrollSpeed;

        // Loop when reaching the midpoint
        const halfWidth = container.scrollWidth / 2;
        if (container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleMouseEnter);
      container.removeEventListener('touchend', handleMouseLeave);
    };
  }, [expandedReviews]);

  const [techGridRef, techGridInView] = useInView(0.3);
  useEffect(() => {
    if (techGridInView && !techBarAnimated) {
      setTechBarAnimated(true);
    }
  }, [techGridInView, techBarAnimated]);

  const [tlCard1Ref, tlCard1In] = useInView(0.2)
  const [tlCard2Ref, tlCard2In] = useInView(0.2)
  const [tlCard3Ref, tlCard3In] = useInView(0.2)

  const handlePrevTreatment = () => {
    setActiveTreatmentIndex((prev) => (prev === 0 ? filteredTreatments.length - 1 : prev - 1))
  }

  const handleNextTreatment = () => {
    setActiveTreatmentIndex((prev) => (prev === filteredTreatments.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="landing-page-root">



      {/* 2. STICKY NAV */}
      <header className="sticky-header" style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        background: 'var(--color-bg-navbar)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border-primary)',
        padding: '12px 0',
        transition: 'var(--transition-smooth)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {/* Logo / Brand Brand */}
          <a href="#" style={{ textDecoration: 'none' }} className="row">
            <img
              src="/kairavamfinallogo.png"
              alt="Kairavam Logo"
              style={{ height: '52px', objectFit: 'contain' }}
            />
          </a>

          {/* Navigation Links - Desktop */}
          <nav className="desktop-nav" style={{ gap: '26px' }}>
            <a href="#treatments" onClick={(e) => { e.preventDefault(); scrollToSection(treatmentsRef); }} style={{ fontSize: '13px', fontWeight: '500', textDecoration: 'none', color: 'var(--color-text-secondary)' }} className="nav-link-hover">Treatments</a>
            <a href="#before-after" style={{ fontSize: '13px', fontWeight: '500', textDecoration: 'none', color: 'var(--color-text-secondary)' }} className="nav-link-hover">Before & After</a>
            <a href="#reviews" style={{ fontSize: '13px', fontWeight: '500', textDecoration: 'none', color: 'var(--color-text-secondary)' }} className="nav-link-hover">Reviews</a>
            <a href="#faq" style={{ fontSize: '13px', fontWeight: '500', textDecoration: 'none', color: 'var(--color-text-secondary)' }} className="nav-link-hover">FAQs</a>
            <a href="#contact" style={{ fontSize: '13px', fontWeight: '500', textDecoration: 'none', color: 'var(--color-text-secondary)' }} className="nav-link-hover">Contact</a>
          </nav>

          {/* Header Actions - Desktop */}
          <div className="header-desktop-actions row" style={{ gap: '16px' }}>
            <div className="header-contact row" style={{ gap: '6px', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: '600' }}>
              <Phone size={13} style={{ color: 'var(--color-theme-secondary)' }} />
              <a href="tel:7998777666" style={{ textDecoration: 'none', color: 'inherit' }}>7998777666</a>
            </div>
            <a
              href="https://wa.me/918478060606"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{ padding: '9px 18px', fontSize: '11px', borderRadius: '8px', textDecoration: 'none' }}
            >
              WhatsApp Now
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-toggle"
            aria-label="Toggle Navigation Menu"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--color-bg-navbar)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--color-border-primary)',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            zIndex: 89,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <a href="#treatments" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); scrollToSection(treatmentsRef); }} style={{ fontSize: '15px', fontWeight: '600', textDecoration: 'none', color: 'var(--color-text-primary)' }}>Treatments</a>
              <a href="#before-after" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '600', textDecoration: 'none', color: 'var(--color-text-primary)' }}>Before & After</a>
              <a href="#reviews" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '600', textDecoration: 'none', color: 'var(--color-text-primary)' }}>Reviews</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '600', textDecoration: 'none', color: 'var(--color-text-primary)' }}>FAQs</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: '600', textDecoration: 'none', color: 'var(--color-text-primary)' }}>Contact</a>
            </nav>

            <div style={{ width: '100%', height: '1px', background: 'var(--color-border-primary)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'stretch' }}>
              <div className="row" style={{ gap: '8px', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '600', justifyContent: 'center' }}>
                <Phone size={15} style={{ color: 'var(--color-theme-secondary)' }} />
                <a href="tel:7998777666" style={{ textDecoration: 'none', color: 'inherit' }}>7998777666</a>
              </div>
              <a
                href="https://wa.me/918478060606"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{ padding: '12px', fontSize: '13px', width: '100%', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}
              >
                WhatsApp Now
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO - Advanced Skin & Laser Clinic */}
      <section className="hero-kv" style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Background layers */}
        <div className="hero-kv-bg-grain"></div>
        <div className="hero-kv-bg-orbe"></div>
        <div className="hero-kv-accent-line"></div>

        {/* Decorative shapes */}
        <div className="hero-kv-shape hero-kv-shape-ring"></div>
        <div className="hero-kv-shape hero-kv-shape-ring-2"></div>
        <div className="hero-kv-shape hero-kv-shape-dot"></div>
        <div className="hero-kv-shape hero-kv-shape-dot-2"></div>
        <div className="hero-kv-shape hero-kv-shape-glow"></div>

        {/* Floating decorative leaves (inspired by kairavamindia.com) */}
        <div className="hero-kv-float-leaf hero-kv-float-leaf-1">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 C60 20 85 25 90 40 C95 55 80 70 70 80 C60 90 40 95 25 85 C10 75 5 55 15 35 C25 15 40 10 50 5Z" fill="#A68263" opacity="0.6" />
            <path d="M50 15 C55 25 70 30 75 40 C80 50 70 60 60 68 C50 76 40 78 30 72 C20 66 15 50 22 36 C29 22 42 18 50 15Z" fill="#344F39" opacity="0.4" />
          </svg>
        </div>
        <div className="hero-kv-float-leaf hero-kv-float-leaf-2">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10 C65 25 75 40 70 55 C65 70 50 85 35 80 C20 75 10 60 15 40 C20 20 35 10 50 10Z" fill="#A68263" opacity="0.5" />
            <path d="M50 22 C58 32 65 42 62 52 C59 62 50 70 42 68 C34 66 28 56 30 44 C32 32 40 24 50 22Z" fill="#DBC1AC" opacity="0.6" />
          </svg>
        </div>
        <div className="hero-kv-float-leaf hero-kv-float-leaf-3">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" stroke="#A68263" strokeWidth="2" opacity="0.5" fill="none" />
            <circle cx="50" cy="50" r="30" stroke="#344F39" strokeWidth="1.5" opacity="0.3" fill="none" />
            <circle cx="50" cy="50" r="10" fill="#A68263" opacity="0.3" />
          </svg>
        </div>
        <div className="hero-kv-float-leaf hero-kv-float-leaf-4">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 50 C20 30 35 15 55 15 C75 15 85 30 80 50 C75 70 60 85 40 85 C25 85 20 70 20 50Z" fill="#DBC1AC" opacity="0.5" />
          </svg>
        </div>
        <div className="hero-kv-float-leaf hero-kv-float-leaf-5">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 L65 40 L95 50 L65 60 L50 95 L35 60 L5 50 L35 40Z" fill="#A68263" opacity="0.4" />
          </svg>
        </div>

        {/* Sparkle accents */}
        <div className="hero-kv-sparkle hero-kv-sparkle-1"></div>
        <div className="hero-kv-sparkle hero-kv-sparkle-2"></div>
        <div className="hero-kv-sparkle hero-kv-sparkle-3"></div>

        {/* Large background text */}
        <div className="hero-kv-big-text">Aesthetics</div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-kv-grid">

            {/* Left: Text */}
            <div className="hero-kv-text">
              <div className="hero-kv-subtitle" style={{ animation: 'heroKvFadeIn 0.7s ease forwards' }}>
                <span className="hero-kv-subtitle-bar"></span>
                Kairavam Advanced Skin &amp; Laser Clinic
              </div>

              <h1 className="hero-kv-title">
                <span className="hero-kv-title-line1" style={{ animation: 'heroKvFadeIn 0.7s ease forwards 0.15s' }}>
                  Advanced Skin &amp; Laser Treatments
                </span>
                <span className="hero-kv-title-line2" style={{ animation: 'heroKvFadeIn 0.7s ease forwards 0.3s' }}>
                  for Clear, Healthy &amp; <em>Glowing Skin</em>
                </span>
              </h1>

              <p className="hero-kv-desc" style={{ animation: 'heroKvFadeIn 0.7s ease forwards 0.5s' }}>
                Transform your skin with advanced laser technology and personalized aesthetic treatments at Kairavam Advanced Skin &amp; Laser Clinic, Vijayawada.
              </p>

              <div className="hero-kv-list" style={{ animation: 'heroKvFadeIn 0.7s ease forwards 0.55s' }}>
                <div className="hero-kv-list-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#a68263" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  FDA Approved Technologies
                </div>
                <div className="hero-kv-list-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#a68263" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Experienced Aesthetic Specialists
                </div>
                <div className="hero-kv-list-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#a68263" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Personalized Treatment Plans
                </div>
                <div className="hero-kv-list-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#a68263" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Minimal Downtime Procedures
                </div>
                <div className="hero-kv-list-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#a68263" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Safe &amp; Hygienic Environment
                </div>
              </div>

              <div className="hero-kv-offer-badge" style={{ animation: 'heroKvFadeIn 0.7s ease forwards 0.6s', marginTop: '16px', marginBottom: '16px' }}>
                <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #a68263, #c9a96e)', color: '#fff', padding: '8px 20px', borderRadius: '50px', fontSize: '13px', fontWeight: '700', letterSpacing: '0.02em' }}>
                  Up To 40% OFF On Selected Treatments
                </span>
              </div>

              <div className="hero-kv-actions" style={{ animation: 'heroKvFadeIn 0.7s ease forwards 0.65s' }}>
                <button onClick={() => scrollToSection(bookingFormRef)} className="hero-kv-btn">
                  Book Your Consultation Today
                  <ArrowRight size={14} />
                </button>
                <a
                  href="https://wa.me/918478060606"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-kv-btn-ghost"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <MessageCircle size={14} />
                  WhatsApp Now
                </a>
              </div>


            </div>

            {/* Right: Image */}
            <div className="hero-kv-image-col" style={{ animation: 'heroKvReveal 1s ease forwards 0.3s' }}>
              <div className="hero-kv-image-frame">
                <div className="hero-kv-image" style={{ backgroundImage: `url('/cosmetologist-yamini.jpg')` }}></div>
                <div className="hero-kv-image-gradient"></div>
                <div className="hero-kv-image-border"></div>
                <div className="hero-kv-image-accent"></div>
              </div>

              {/* Desktop Floating Badges */}
              <div className="hero-desktop-stats-only">
                <div className="hero-kv-float-badge-1">
                  <div className="hero-badge-icon-wrapper">
                    <Award size={16} />
                  </div>
                  <div className="hero-kv-float-card-text">
                    <span><CountUp end={10} suffix="+" /></span>
                    <small>Years Experience</small>
                  </div>
                </div>

                <div className="hero-kv-float-badge-2">
                  <div className="hero-badge-icon-wrapper">
                    <Heart size={16} fill="var(--color-theme-secondary)" style={{ color: 'var(--color-theme-secondary)' }} />
                  </div>
                  <div className="hero-kv-float-card-text">
                    <span><CountUp end={15} suffix="K+" /></span>
                    <small>Happy Patients</small>
                  </div>
                </div>

                <div className="hero-kv-float-badge-3">
                  <div className="hero-badge-icon-wrapper">
                    <Star size={16} fill="var(--color-theme-primary)" style={{ color: 'var(--color-theme-primary)' }} />
                  </div>
                  <div className="hero-kv-float-card-text">
                    <span><CountUp end={4.9} decimals={1} /></span>
                    <small>Google Rating</small>
                  </div>
                </div>
              </div>

              {/* Mobile Layout Badges Stack */}
              <div className="hero-mobile-stats-container">
                <div className="hero-kv-float-badge-1">
                  <div className="hero-badge-icon-wrapper">
                    <Award size={16} />
                  </div>
                  <div className="hero-kv-float-card-text">
                    <span>10+ Years</span>
                    <small>Clinical Experience</small>
                  </div>
                </div>

                <div className="hero-kv-float-badge-2">
                  <div className="hero-badge-icon-wrapper">
                    <Heart size={16} fill="var(--color-theme-secondary)" style={{ color: 'var(--color-theme-secondary)' }} />
                  </div>
                  <div className="hero-kv-float-card-text">
                    <span>15K+ Patients</span>
                    <small>Happy Cases</small>
                  </div>
                </div>

                <div className="hero-kv-float-badge-3">
                  <div className="hero-badge-icon-wrapper">
                    <Star size={16} fill="var(--color-theme-primary)" style={{ color: 'var(--color-theme-primary)' }} />
                  </div>
                  <div className="hero-kv-float-card-text">
                    <span>4.9 Google Rating</span>
                    <small>Loved by patients</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE KAIRAVAM SECTION */}
      <section className="section-padding" style={{ background: '#ffffff', borderBottom: '1px solid var(--color-border-primary)', overflow: 'hidden' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '50px' }}>
            <span className="section-subtitle">Why Choose Kairavam</span>
            <h2 className="section-title">Your Trusted Advanced Skin & Laser Clinic in <span>Vijayawada</span></h2>
            <p className="section-desc" style={{ maxWidth: '700px', margin: '0 auto' }}>
              At Kairavam, every treatment begins with a detailed consultation and skin analysis to ensure optimal results.
            </p>
          </div>
        </div>

        {/* Marquee Animation */}
        <div className="marquee-container">
          <div className="marquee-content">
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <div className="marquee-item"><CheckCircle size={18} /> Advanced Skin Analysis</div>
                <div className="marquee-item"><CheckCircle size={18} /> FDA Approved Technology</div>
                <div className="marquee-item"><CheckCircle size={18} /> 10+ Years Clinical Experience</div>
                <div className="marquee-item"><CheckCircle size={18} /> Customized Treatment Protocols</div>
                <div className="marquee-item"><CheckCircle size={18} /> Proven Results</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>





      {/* 4. TREATMENT GRID */}
      <section ref={treatmentsRef} id="treatments" className="section-padding" style={{
        borderBottom: '1px solid var(--color-border-primary)',
        position: 'relative',
        background: 'linear-gradient(180deg, var(--color-bg-main) 0%, rgba(244, 237, 230, 0.4) 50%, var(--color-bg-main) 100%)'
      }}>
        {/* Ambient Glow Orbs */}
        <div className="ambient-glow-circle" style={{
          position: 'absolute',
          top: '25%',
          left: '5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(166, 130, 99, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
          zIndex: 0
        }} />
        <div className="ambient-glow-circle" style={{
          position: 'absolute',
          bottom: '15%',
          right: '5%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(52, 79, 57, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(60px)',
          zIndex: 0
        }} />

        <img src="/leaves_6.png" className="floating-asset" style={{ bottom: '10%', right: '3%', width: '90px', opacity: 0.12 }} alt="" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center">
            <span className="section-subtitle">Aesthetic Treatments</span>
            <h2 className="section-title">Clinically Proven <span>Transformations</span></h2>
            <p className="section-desc">
              We offer customizable non-invasive procedures for skin glow, acne scar revision, pigmentation clearing, and permanent makeup brows & lips.
            </p>
          </div>

          {/* Filters Bar Wrapper */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div className="filter-tabs">
              {['All', 'Skin Laser & Glow', 'Scar & Texture', 'Pigmentation & Glow', 'Hair & Scalp', 'PMU & Permanent Makeup'].map((tab) => (
                <button
                  key={tab}
                  className={`filter-tab ${treatmentFilter === tab ? 'active' : ''}`}
                  onClick={() => setTreatmentFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Treatment Coverflow Carousel */}
          <div className="treatment-carousel-wrapper">
            {/* Left Nav Arrow */}
            <button
              className="carousel-nav-btn carousel-nav-prev"
              onClick={handlePrevTreatment}
              aria-label="Previous Treatment"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Track Container */}
            <div className="treatment-carousel-track treatment-carousel-track-animate" key={treatmentFilter}>
              {filteredTreatments.map((t, idx) => {
                let offset = idx - activeTreatmentIndex;
                if (filteredTreatments.length >= 3) {
                  const len = filteredTreatments.length;
                  if (offset < -1) offset += len;
                  if (offset > 1) offset -= len;
                }

                let positionClass = '';
                if (offset === 0) {
                  positionClass = 'active-slide';
                } else if (offset === -1) {
                  positionClass = 'left-slide';
                } else if (offset === 1) {
                  positionClass = 'right-slide';
                } else {
                  positionClass = 'hidden-slide';
                }

                return (
                  <div
                    key={t.id}
                    className={`carousel-slide-card luxury-spa-card ${positionClass}`}
                    onClick={() => setActiveTreatmentIndex(idx)}
                    style={{ gap: '16px', background: '#ffffff' }}
                  >
                    {/* Zoom Image Container */}
                    <div className="zoom-container" style={{ height: '190px', border: '1px solid var(--color-border-primary)', position: 'relative' }}>
                      <img src={t.image} alt={t.title} className="zoom-img" />
                      <span className="badge-premium" style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        fontSize: '9px',
                        padding: '4px 12px',
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 2,
                        border: '1px solid var(--color-border-primary)'
                      }}>
                        {t.badge}
                      </span>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 100%)',
                        pointerEvents: 'none'
                      }} />
                    </div>

                    <div className="col" style={{ gap: '4px' }}>
                      <h3 style={{ fontSize: '18px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)', fontWeight: '600' }}>{t.title}</h3>
                      <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', minHeight: '56px' }}>{t.desc}</p>
                    </div>

                    {/* Bullets */}
                    <div style={{ borderTop: '1px solid var(--color-border-primary)', paddingTop: '12px' }} className="col">
                      {t.bullets.map((b, i) => (
                        <div key={i} className="row treatment-bullet-item" style={{ gap: '6px', alignItems: 'flex-start', transition: 'transform 0.3s ease' }}>
                          <Check size={12} style={{ color: 'var(--color-theme-primary)', marginTop: '3px', flexShrink: 0 }} />
                          <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>{b}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Pricing & CTA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                      <div className="col" style={{ gap: '2px' }}>
                        <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Starting from</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-theme-secondary)', fontFamily: 'var(--font-serif)' }}>{t.price}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, treatment: t.title }))
                          scrollToSection(bookingFormRef)
                        }}
                        className="btn-gold"
                        style={{ padding: '8px 16px', fontSize: '9px', borderRadius: '8px' }}
                      >
                        Book <ArrowUpRight size={10} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right Nav Arrow */}
            <button
              className="carousel-nav-btn carousel-nav-next"
              onClick={handleNextTreatment}
              aria-label="Next Treatment"
            >
              <ChevronRight size={20} />
            </button>
          </div>

        </div>
      </section>

      {/* 5. TREATMENT TIMELINE DEEP DIVE */}
      <section className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff' }}>
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Clinical Deep Dive</span>
            <h2 className="section-title">Detailed <span>Procedure Insights</span></h2>
            <p className="section-desc">
              Understand the science behind our clinic procedures. We prioritize patient education so you make informed aesthetic choices.
            </p>
          </div>

          <div className="timeline" style={{ marginTop: '40px' }}>

            {/* ── Timeline Item 1: Pico Hollywood Carbon Laser (left) ── */}
            <div ref={tlCard1Ref} className={`timeline-item${tlCard1In ? ' in-view' : ''}`}>
              <div className="timeline-marker"></div>
              <div className={`timeline-card${tlCard1In ? ' in-view' : ''}`}>
                <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
                  <div className="timeline-card-icon">
                    <Zap size={18} style={{ color: 'var(--color-theme-secondary)' }} />
                  </div>
                  <div className="col" style={{ gap: '2px' }}>
                    <h3>Pico Hollywood Carbon Laser</h3>
                    <span className="insight-subtitle">Active Sebum Reduction, Clogged Pore Refinement & Radiance</span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  The procedure begins with the application of a thin layer of carbon lotion onto the face. The carbon absorbs debris, oils, and dead skin cells from deep within the pores. When the Pico laser is swept over the treatment area, its light is highly attracted to the carbon particles. The laser vaporizes the carbon instantly, pulling out the impurities with it. The micro-acoustic waves generated by the Pico laser also penetrate deep into the dermis, sparking collagen remodeling and cellular rejuvenation without damaging the outer skin.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="stat-card"><div className="stat-value">89%</div><span className="stat-label">Pores Tightened & Clog Refined</span></div>
                  <div className="stat-card"><div className="stat-value">+92%</div><span className="stat-label">Overall Skin Radiance Glow</span></div>
                </div>
                <div className="col" style={{ gap: '8px' }}>
                  <span className="section-label">Before vs After Snapshot</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                    <div className="ba-box ba-box-before"><strong style={{ color: 'var(--color-text-primary)' }}>Before:</strong> Dull complexion, clogged pores, excess sebum, and minor pigment shadows.</div>
                    <div className="ba-box ba-box-after"><strong style={{ color: 'var(--color-theme-secondary)' }}>After:</strong> Purified pores, reduced sebum, instant skin luminosity, and refined skin texture.</div>
                  </div>
                </div>
                <div className="media-grid">
                  <div className="media-item"><div className="media-img" style={{ backgroundImage: `url('/carbonpeel1.jpg')` }}></div><span className="media-caption">Carbon Mask Applied</span></div>
                  <div className="media-item"><div className="media-img" style={{ backgroundImage: `url('/carbon-peel.jpg')` }}></div><span className="media-caption">Laser Clearing Glow</span></div>
                </div>
                <div className="progress-card">
                  <span className="progress-title">Procedure Success Markers</span>
                  <div className="col" style={{ gap: '10px' }}>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}><span>Pores Tightened & Cleared</span><span>89% Success</span></div><div className="premium-progress-bar"><div className="premium-progress-fill premium-progress-fill-gold" style={{ width: '89%' }}></div></div></div>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}><span>Skin Radiance Increase</span><span>+92% Boost</span></div><div className="premium-progress-bar"><div className="premium-progress-fill premium-progress-fill-gold" style={{ width: '92%' }}></div></div></div>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}><span>Sebum Oil Control</span><span>74% Regulation</span></div><div className="premium-progress-bar"><div className="premium-progress-fill premium-progress-fill-gold" style={{ width: '74%' }}></div></div></div>
                  </div>
                </div>
                <button onClick={() => { setFormData(prev => ({ ...prev, treatment: 'Pico Hollywood Carbon Laser' })); scrollToSection(bookingFormRef); }} className="btn-gold" style={{ padding: '12px 24px', fontSize: '11px', alignSelf: 'flex-start' }}>
                  Book This Treatment <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

            {/* ── Timeline Item 2: Q-Switched Laser Toning (right) ── */}
            <div ref={tlCard2Ref} className={`timeline-item${tlCard2In ? ' in-view' : ''}`}>
              <div className="timeline-marker"></div>
              <div className={`timeline-card${tlCard2In ? ' in-view' : ''}`}>
                <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
                  <div className="timeline-card-icon">
                    <Sparkles size={18} style={{ color: 'var(--color-theme-secondary)' }} />
                  </div>
                  <div className="col" style={{ gap: '2px' }}>
                    <h3>Q-Switched Laser Toning</h3>
                    <span className="insight-subtitle">Pigmentation, Melasma clearing, & Uneven Skin Tone Correction</span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  Our Q-Switched Nd:YAG laser emits high-energy light pulses targeted at melanin pigments. The pigment absorbs the energy and shatters into microscopic particles, which are then naturally metabolized by the body's immune system, fading dark patches and revealing a unified, bright skin tone.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="stat-card"><div className="stat-value">85%</div><span className="stat-label">Pigmentation Cleared</span></div>
                  <div className="stat-card"><div className="stat-value">+90%</div><span className="stat-label">Overall Tone Uniformity</span></div>
                </div>
                <div className="col" style={{ gap: '8px' }}>
                  <span className="section-label">Before vs After Snapshot</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                    <div className="ba-box ba-box-before"><strong style={{ color: 'var(--color-text-primary)' }}>Before:</strong> Uneven skin tone, dark melasma spots, sun freckles, and localized discoloration.</div>
                    <div className="ba-box ba-box-after"><strong style={{ color: 'var(--color-theme-secondary)' }}>After:</strong> Brighter complexion, unified skin tone, significantly faded dark patches, and cleared pigmentation.</div>
                  </div>
                </div>
                <div className="media-grid">
                  <div className="media-item"><div className="media-img" style={{ backgroundImage: `url('/laser-toning.jpg')` }}></div><span className="media-caption">Toning Session</span></div>
                  <div className="media-item"><div className="media-img" style={{ backgroundImage: `url('/carbonpeel-after.png')` }}></div><span className="media-caption">Radiance Result</span></div>
                </div>
                <div className="progress-card">
                  <span className="progress-title">Procedure Success Markers</span>
                  <div className="col" style={{ gap: '10px' }}>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}><span>Pigmentation Fading</span><span>85% Success</span></div><div className="premium-progress-bar"><div className="premium-progress-fill premium-progress-fill-gold" style={{ width: '85%' }}></div></div></div>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}><span>Tone Uniformity</span><span>90% Uniformity</span></div><div className="premium-progress-bar"><div className="premium-progress-fill premium-progress-fill-gold" style={{ width: '90%' }}></div></div></div>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}><span>Melasma Reduction</span><span>78% Clearance</span></div><div className="premium-progress-bar"><div className="premium-progress-fill premium-progress-fill-gold" style={{ width: '78%' }}></div></div></div>
                  </div>
                </div>
                <button onClick={() => { setFormData(prev => ({ ...prev, treatment: 'Laser Toning' })); scrollToSection(bookingFormRef); }} className="btn-gold" style={{ padding: '12px 24px', fontSize: '11px', alignSelf: 'flex-start' }}>
                  Book This Treatment <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

            {/* ── Timeline Item 3: Clinical Skin Resurfacing (left) ── */}
            <div ref={tlCard3Ref} className={`timeline-item${tlCard3In ? ' in-view' : ''}`}>
              <div className="timeline-marker"></div>
              <div className={`timeline-card${tlCard3In ? ' in-view' : ''}`}>
                <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
                  <div className="timeline-card-icon">
                    <Award size={18} style={{ color: 'var(--color-theme-secondary)' }} />
                  </div>
                  <div className="col" style={{ gap: '2px' }}>
                    <h3>Clinical Skin Resurfacing</h3>
                    <span className="insight-subtitle">Dermal Renewal, Fine Lines, & Overall Texture Improvement</span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  Non-surgical laser resurfacing to sweep away dry, textured layers and trigger deep cell mitosis to smooth out age lines and minor wrinkles. This treatment promotes immediate cellular turnover and soft finish, revealing fresher, younger-looking skin.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="stat-card"><div className="stat-value">87%</div><span className="stat-label">Texture Smoothness Improved</span></div>
                  <div className="stat-card"><div className="stat-value">+84%</div><span className="stat-label">Fine Line Reduction</span></div>
                </div>
                <div className="col" style={{ gap: '8px' }}>
                  <span className="section-label">Before vs After Snapshot</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                    <div className="ba-box ba-box-before"><strong style={{ color: 'var(--color-text-primary)' }}>Before:</strong> Dull texture, fine lines, rough patches, and uneven surface.</div>
                    <div className="ba-box ba-box-after"><strong style={{ color: 'var(--color-theme-secondary)' }}>After:</strong> Smooth, plump, refreshed skin with visibly reduced fine lines.</div>
                  </div>
                </div>
                <div className="media-grid">
                  <div className="media-item"><div className="media-img" style={{ backgroundImage: `url('/laser-uhr3.jpg')` }}></div><span className="media-caption">Resurfacing Session</span></div>
                  <div className="media-item"><div className="media-img" style={{ backgroundImage: `url('/laser-uhr1.jpg')` }}></div><span className="media-caption">Skin Renewal Result</span></div>
                </div>
                <div className="progress-card">
                  <span className="progress-title">Procedure Success Markers</span>
                  <div className="col" style={{ gap: '10px' }}>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}><span>Texture Smoothness</span><span>87% Improvement</span></div><div className="premium-progress-bar"><div className="premium-progress-fill premium-progress-fill-gold" style={{ width: '87%' }}></div></div></div>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}><span>Fine Line Fading</span><span>84% Reduction</span></div><div className="premium-progress-bar"><div className="premium-progress-fill premium-progress-fill-gold" style={{ width: '84%' }}></div></div></div>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}><span>Collagen Stimulation</span><span>91% Activation</span></div><div className="premium-progress-bar"><div className="premium-progress-fill premium-progress-fill-gold" style={{ width: '91%' }}></div></div></div>
                  </div>
                </div>
                <button onClick={() => { setFormData(prev => ({ ...prev, treatment: 'Clinical Skin Resurfacing' })); scrollToSection(bookingFormRef); }} className="btn-gold" style={{ padding: '12px 24px', fontSize: '11px', alignSelf: 'flex-start' }}>
                  Book This Treatment <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Interactive BEFORE/AFTER COMPARISON PANEL */}
      <section id="before-after" className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', position: 'relative' }}>
        <img src="/leaves_14.png" className="floating-asset" style={{ top: '8%', left: '3%', width: '100px', opacity: 0.12 }} alt="" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid32" style={{ alignItems: 'center' }}>

            {/* Left Column: Interactive Slider Widget */}
            <div className="col" style={{ gap: '16px' }}>
              <div
                className="ba-slider-container"
                ref={sliderRef}
                onMouseDown={handleSliderStart}
                onTouchStart={handleSliderStart}
                style={{ touchAction: 'none', position: 'relative' }}
              >
                <div
                  className="ba-image ba-image-after"
                  style={{
                    backgroundImage: `url('${beforeAfterImages[activeCompareCategory].after}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                ></div>

                <div
                  className="ba-image ba-image-before"
                  style={{
                    backgroundImage: `url('${beforeAfterImages[activeCompareCategory].before}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                    WebkitClipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
                  }}
                ></div>

                <div
                  className="ba-handle"
                  style={{ left: `${sliderPosition}%` }}
                  role="slider"
                  aria-label="Drag to compare before and after images"
                  aria-valuenow={sliderPosition}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') setSliderPosition(p => Math.max(0, p - 5));
                    if (e.key === 'ArrowRight') setSliderPosition(p => Math.min(100, p + 5));
                  }}
                >
                  <div className="ba-handle-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="10 18 4 12 10 6" />
                      <polyline points="14 18 20 12 14 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Case Controls & Testimonials */}
            <div className="col" style={{ gap: '28px' }}>
              <div className="results-heading fade-in-up" key={activeCompareCategory}>
                <span className="section-subtitle">Real transformations</span>
                <h2>Patient Results</h2>
                <p>
                  <TypewriterText text={`${beforeAfterImages[activeCompareCategory].text} Select a category below to explore verified transformations.`} speed={25} />
                </p>
              </div>

              {/* Selector buttons */}
              <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setActiveCompareCategory('skin'); setSliderPosition(50); }}
                  className={`filter-tab ${activeCompareCategory === 'skin' ? 'active' : ''}`}
                >
                  Carbon Laser (Skin)
                </button>
              </div>

              {/* Patient Testimonial Review */}
              <div className="luxury-spa-card" style={{ gap: '14px', background: '#ffffff' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="row" style={{ gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--color-theme-cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: 'var(--color-theme-secondary)'
                    }}>
                      S
                    </div>
                    <div className="col" style={{ gap: '0' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Swathi K.</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Vijayawada Patient</span>
                    </div>
                  </div>
                  <span className="badge-verified">
                    <CheckCircle size={10} /> Verified Patient
                  </span>
                </div>

                <div className="row" style={{ gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} fill="var(--color-theme-primary)" style={{ color: 'var(--color-theme-primary)' }} />
                  ))}
                </div>

                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic', lineHeight: '1.55' }}>
                  "I was extremely self-conscious about my deep acne scars and uneven skin tone. After consulting Dr. Yamini, she recommended a combination of Skin Resurfacing and Laser Toning. The change after just 4 sessions is unbelievable. My skin feels smooth and looks bright. Highly recommend Kairavam!"
                </p>

                <div className="row" style={{ gap: '6px' }}>
                  <span className="badge-premium" style={{ fontSize: '8px', padding: '2px 8px' }}>Skin Resurfacing</span>
                  <span className="badge-premium" style={{ fontSize: '8px', padding: '2px 8px' }}>4 Sessions</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 7. TECHNOLOGY SHOWCASE */}
      <section id="technology" className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff' }}>
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Clinical Infrastructure</span>
            <h2 className="section-title">Precision <span>Laser Technologies</span></h2>
            <p className="section-desc">
              We invest in state-of-the-art US-FDA approved laser platforms. Higher precision technology guarantees clinical efficacy, fewer sessions, and maximum patient safety.
            </p>
          </div>

          <div className="grid3" ref={techGridRef}>

            {/* Flagship Laser Tech */}
            <div className="tech-card-animate luxury-spa-card premium-card-highlight" style={{ gap: '24px', animationDelay: '0s' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  border: '1px solid var(--color-theme-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} style={{ color: 'var(--color-theme-primary)' }} />
                </div>
                <span className="badge-premium" style={{ border: '1px solid var(--color-theme-secondary)', background: 'var(--color-theme-secondary)', color: '#ffffff' }}>Flagship Tech</span>
              </div>

              <div className="col" style={{ gap: '6px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Pico & Q-Switched Laser Platforms</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>FDA-Approved Cool-Tip Active Laser</span>
              </div>

              <div className="col" style={{ gap: '14px' }}>
                <div className="premium-progress-container">
                  <div className="premium-progress-info">
                    <span className="premium-progress-label">Melanin Target Precision</span>
                    <span className="premium-progress-value">{techBarAnimated ? <><CountUp end={98} suffix="%" duration={2000} /></> : '0%'}</span>
                  </div>
                  <div className="premium-progress-bar">
                    <div className="premium-progress-fill premium-progress-fill-gold" style={{ width: techBarAnimated ? '98%' : '0%' }}></div>
                  </div>
                </div>

                <div className="premium-progress-container">
                  <div className="premium-progress-info">
                    <span className="premium-progress-label">Patient Pain Management</span>
                    <span className="premium-progress-value">{techBarAnimated ? <><CountUp end={95} suffix="%" duration={2000} /> Cool-Tip</> : '0%'}</span>
                  </div>
                  <div className="premium-progress-bar">
                    <div className="premium-progress-fill premium-progress-fill-gold" style={{ width: techBarAnimated ? '95%' : '0%' }}></div>
                  </div>
                </div>

                <div className="premium-progress-container">
                  <div className="premium-progress-info">
                    <span className="premium-progress-label">Recovery Downtime Speed</span>
                    <span className="premium-progress-value">{techBarAnimated ? <><CountUp end={92} suffix="%" duration={2000} /> Immediate</> : '0%'}</span>
                  </div>
                  <div className="premium-progress-bar">
                    <div className="premium-progress-fill premium-progress-fill-gold" style={{ width: techBarAnimated ? '92%' : '0%' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--color-theme-primary)', paddingTop: '12px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                ⭐ Requires 40% fewer sessions compared to older laser platforms.
              </div>
            </div>

            {/* Advanced Laser Tech */}
            <div className="tech-card-animate luxury-spa-card" style={{ gap: '24px', animationDelay: '0.15s' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--color-bg-main)',
                  border: '1px solid var(--color-border-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={20} style={{ color: 'var(--color-theme-primary)' }} />
                </div>
                <span className="badge-premium">Advanced Tier</span>
              </div>

              <div className="col" style={{ gap: '6px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Diode Cooling Laser Systems</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Semi-Focused Thermal Delivery</span>
              </div>

              <div className="col" style={{ gap: '14px' }}>
                <div className="premium-progress-container">
                  <div className="premium-progress-info">
                    <span className="premium-progress-label">Melanin Target Precision</span>
                    <span className="premium-progress-value">{techBarAnimated ? <><CountUp end={80} suffix="%" duration={2000} /></> : '0%'}</span>
                  </div>
                  <div className="premium-progress-bar">
                    <div className="premium-progress-fill premium-progress-fill-silver" style={{ width: techBarAnimated ? '80%' : '0%' }}></div>
                  </div>
                </div>

                <div className="premium-progress-container">
                  <div className="premium-progress-info">
                    <span className="premium-progress-label">Patient Pain Management</span>
                    <span className="premium-progress-value">{techBarAnimated ? <><CountUp end={75} suffix="%" duration={2000} /> Contact cooling</> : '0%'}</span>
                  </div>
                  <div className="premium-progress-bar">
                    <div className="premium-progress-fill premium-progress-fill-silver" style={{ width: techBarAnimated ? '75%' : '0%' }}></div>
                  </div>
                </div>

                <div className="premium-progress-container">
                  <div className="premium-progress-info">
                    <span className="premium-progress-label">Recovery Downtime Speed</span>
                    <span className="premium-progress-value">{techBarAnimated ? <><CountUp end={70} suffix="%" duration={2000} /> Moderate</> : '0%'}</span>
                  </div>
                  <div className="premium-progress-bar">
                    <div className="premium-progress-fill premium-progress-fill-silver" style={{ width: techBarAnimated ? '70%' : '0%' }}></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Standard Laser Tech */}
            <div className="tech-card-animate luxury-spa-card" style={{ gap: '24px', animationDelay: '0.3s' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--color-bg-main)',
                  border: '1px solid var(--color-border-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Award size={20} style={{ color: 'var(--color-theme-primary)' }} />
                </div>
                <span className="badge-premium">Standard Tier</span>
              </div>

              <div className="col" style={{ gap: '6px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Traditional IPL / Nd:YAG lasers</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Broad Spectrum Light Systems</span>
              </div>

              <div className="col" style={{ gap: '14px' }}>
                <div className="premium-progress-container">
                  <div className="premium-progress-info">
                    <span className="premium-progress-label">Melanin Target Precision</span>
                    <span className="premium-progress-value">{techBarAnimated ? <><CountUp end={60} suffix="%" duration={2000} /></> : '0%'}</span>
                  </div>
                  <div className="premium-progress-bar">
                    <div className="premium-progress-fill premium-progress-fill-silver" style={{ width: techBarAnimated ? '60%' : '0%' }}></div>
                  </div>
                </div>

                <div className="premium-progress-container">
                  <div className="premium-progress-info">
                    <span className="premium-progress-label">Patient Pain Management</span>
                    <span className="premium-progress-value">{techBarAnimated ? <><CountUp end={60} suffix="%" duration={2000} /> Fan-cooled</> : '0%'}</span>
                  </div>
                  <div className="premium-progress-bar">
                    <div className="premium-progress-fill premium-progress-fill-silver" style={{ width: techBarAnimated ? '60%' : '0%' }}></div>
                  </div>
                </div>

                <div className="premium-progress-container">
                  <div className="premium-progress-info">
                    <span className="premium-progress-label">Recovery Downtime Speed</span>
                    <span className="premium-progress-value">{techBarAnimated ? <><CountUp end={58} suffix="%" duration={2000} /> Slow</> : '0%'}</span>
                  </div>
                  <div className="premium-progress-bar">
                    <div className="premium-progress-fill premium-progress-fill-silver" style={{ width: techBarAnimated ? '58%' : '0%' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-secondary)', paddingTop: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                ⚠️ Older standard machines with wider thermal spreads and higher session counts.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. JOURNEY STEPS (How it Works) */}
      <section className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff', position: 'relative' }}>
        <img src="/flower_2_7.png" className="floating-asset" style={{ top: '6%', right: '3%', width: '80px', opacity: 0.12 }} alt="" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center">
            <span className="section-subtitle">Your Aesthetic Roadmap</span>
            <h2 className="section-title">The Kairavam <span>Patient Journey</span></h2>
            <p className="section-desc">
              From your initial self-assessment to long-term clinical aftercare reviews, we design a transparent and systematic process to ensure natural results.
            </p>
          </div>

          <div style={{ position: 'relative', marginTop: '40px' }}>
            {/* Connection Line Desktop */}
            <div className="journey-line" style={{
              position: 'absolute',
              top: '25px',
              left: '10%',
              right: '10%',
              height: '1px',
              borderTop: '1.5px dashed var(--color-border-accent)',
              zIndex: 1
            }}></div>
            <div className="journey-line-active" style={{
              position: 'absolute',
              top: '25px',
              left: '10%',
              width: `${((activeJourneyStep - 1) / 4) * 80}%`,
              height: '2px',
              background: 'linear-gradient(90deg, var(--color-theme-secondary), var(--color-theme-primary))',
              zIndex: 1,
              transition: 'width 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
            }}>
              {/* Glowing tip at the leading edge of the active line */}
              {activeJourneyStep > 1 && (
                <div
                  className="timeline-pulse-dot"
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '-5px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--color-theme-primary)',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 12px var(--color-theme-primary)',
                    zIndex: 2
                  }}
                />
              )}
            </div>

            <div className="journey-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', position: 'relative', zIndex: 2 }}>
              {[
                { num: 1, title: 'Skin Quiz', desc: 'Spend 2 minutes sharing your concerns and goals online.' },
                { num: 2, title: 'Consultation', desc: 'Meet Dr. Yamini for an in-depth clinical evaluation of skin/hair.' },
                { num: 3, title: 'Customized Plan', desc: 'Receive a personalized treatment blueprint matching your biology.' },
                { num: 4, title: 'Treatment Session', desc: 'Experience comfortable, expert care using our FDA-approved systems.' },
                { num: 5, title: 'Follow-up Care', desc: 'Follow our custom homecare roadmap and visit for scheduled checks.' }
              ].map((step) => {
                const isActive = step.num <= activeJourneyStep;
                return (
                  <div
                    key={step.num}
                    className="col journey-step-container"
                    onMouseEnter={() => setActiveJourneyStep(step.num)}
                    onClick={() => setActiveJourneyStep(step.num)}
                    style={{ alignItems: 'center', textAlign: 'center', gap: '14px' }}
                  >
                    <div
                      className="journey-step-circle"
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: isActive ? 'var(--color-bg-card)' : 'var(--color-bg-main)',
                        border: isActive ? '2px solid var(--color-theme-primary)' : '1px solid var(--color-border-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: isActive ? 'var(--color-theme-secondary)' : 'var(--color-text-muted)',
                        boxShadow: isActive ? '0 0 15px rgba(166, 130, 99, 0.3)' : 'none',
                      }}
                    >
                      {step.num}
                    </div>
                    <div className="col" style={{ gap: '4px' }}>
                      <h4 style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: '600' }}>{step.title}</h4>
                      <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 10. REAL-TIME AI ANALYSIS WIDGET */}
      <section ref={quizRef} className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', position: 'relative', background: 'linear-gradient(160deg, #fafaf8 0%, #f5f3ee 100%)' }}>
        <img src="/flower_2_6.png" className="floating-asset" style={{ bottom: '5%', left: '4%', width: '120px', opacity: 0.10 }} alt="" />
        <img src="/flower_2_6.png" className="floating-asset" style={{ top: '8%', right: '3%', width: '90px', opacity: 0.08, transform: 'scaleX(-1) rotate(30deg)' }} alt="" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center">
            <span className="section-subtitle" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.25)', animation: 'pulse 2s infinite' }} />
              {quizLang === 'te' ? 'తక్షణ AI విశ్లేషణ' : 'Real-Time AI Analysis'}
            </span>
            <h2 className="section-title">
              {quizLang === 'te'
                ? <>Dr. యమిని యొక్క <span>చర్మ నిర్ధారణ</span></>
                : <>AI-Powered <span>Skin Assessment</span></>}
            </h2>
            <p className="section-desc">
              {quizLang === 'te'
                ? 'మీ ప్రాధమిక సమస్యల ఆధారంగా తక్షణ క్లినికల్ సిఫారసు పొందండి — డా. యమిని యొక్క నిర్ధారణ ఫ్రేమ్‌వర్క్ ద్వారా విశ్లేషించబడింది.'
                : "Get an instant clinical recommendation based on your primary concerns, analyzed live under Dr. Yamini's diagnostic framework."}
            </p>
          </div>

          <div style={{ width: '100%' }}>
            <div className="quiz-widget" style={{ background: '#ffffff', border: '1px solid rgba(183,156,97,0.18)', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', borderRadius: '20px' }}>

              {/* Language Toggle + Stepper Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                {/* Language Toggle */}

                {/* Stepper */}
                <div className="quiz-stepper" style={{ margin: 0 }}>
                  {[
                    { step: 1, label: quizLang === 'te' ? 'సమస్య' : 'Concern' },
                    { step: 2, label: quizLang === 'te' ? 'ప్రొఫైల్' : 'Profile' },
                    { step: 3, label: quizLang === 'te' ? 'ఫలితాలు' : 'Results' }
                  ].map((s, idx) => {
                    const stepMap = { 1: 0, 2: 1, 'loading': 2, 3: 3 };
                    const current = stepMap[quizStep] ?? 0;
                    const isActive = current === s.step - 1;
                    const isCompleted = current > s.step - 1;
                    return (
                      <React.Fragment key={s.step}>
                        <div className={`quiz-step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                          <div className="quiz-step-circle">
                            {isCompleted ? <Check size={14} /> : s.step}
                          </div>
                          <span className="quiz-step-label">{s.label}</span>
                        </div>
                        {idx < 2 && (
                          <div className={`quiz-step-line ${current > idx ? 'completed' : ''}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Step 1: Concern selection */}
              {quizStep === 1 && (
                <div className="col" style={{ gap: '20px', animation: 'slideDown 0.3s ease-out' }}>
                  <div className="row" style={{ gap: '10px' }}>
                    <Brain className="pulse-animation" style={{ color: 'var(--color-theme-primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-theme-secondary)' }}>
                      {quizLang === 'te' ? 'మీకు ఏ సమస్య ఉంది?' : 'What concerns you most?'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {quizLang === 'te'
                      ? 'మీ ప్రాధమిక సమస్యను ఎంచుకోండి. డా. యమిని యొక్క నిర్ధారణ వ్యవస్థ దాన్ని అత్యుత్తమ చికిత్స ప్రోటోకాల్‌కు సరిపోల్చుతుంది.'
                      : "Select your primary aesthetic concern. Dr. Yamini's diagnostic system will match it to the ideal treatment protocol."}
                  </p>

                  <div className="quiz-card-grid">
                    {[
                      {
                        concern: 'Acne Scars',
                        label: quizLang === 'te' ? 'మొటిమల మచ్చలు & అసమతలం' : 'Acne Scars & Texture',
                        desc: quizLang === 'te' ? 'అసమాన చర్మం, చిన్న గుంతలు, అతిపెద్ద రంధ్రాలు' : 'Uneven surface, rolling or boxcar scars, enlarged pores',
                        icon: Activity
                      },
                      {
                        concern: 'Pigmentation',
                        label: quizLang === 'te' ? 'వర్ణద్రవ్యం & మెలాస్మా' : 'Pigmentation & Melasma',
                        desc: quizLang === 'te' ? 'నల్లటి మచ్చలు, సూర్యుని మచ్చలు, అసమాన చర్మ టోన్' : 'Dark patches, sun spots, uneven skin tone, freckles',
                        icon: Target
                      },
                      {
                        concern: 'Open Pores',
                        label: quizLang === 'te' ? 'విస్తరించిన రంధ్రాలు' : 'Open Pores & Oiliness',
                        desc: quizLang === 'te' ? 'పెద్ద రంధ్రాలు, అధిక నూనె' : 'Enlarged pores, excess sebum, congested skin',
                        icon: Droplets
                      },
                      {
                        concern: 'Skin Rejuvenation',
                        label: quizLang === 'te' ? 'చర్మ పునరుద్ధరణ' : 'Skin Rejuvenation & Glow',
                        desc: quizLang === 'te' ? 'నీరసమైన చర్మం, అకాల ముడతలు' : 'Dull skin, premature ageing, loss of elasticity',
                        icon: Sparkles
                      }
                    ].map((item) => {
                      const IconEl = item.icon;
                      const isSelected = selectedConcern === item.concern;
                      return (
                        <div
                          key={item.concern}
                          onClick={() => handleQuizConcern(item.concern)}
                          className={`quiz-card-option ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="quiz-card-icon-frame">
                            <IconEl size={22} />
                          </div>
                          <div className="col" style={{ gap: '4px', flex: 1 }}>
                            <span className="quiz-card-title">{item.label}</span>
                            <span className="quiz-card-desc">{item.desc}</span>
                          </div>
                          <ArrowRight size={14} className="arrow-hover" style={{ opacity: 0, transform: 'translateX(-8px)', transition: 'all 0.3s ease', color: 'var(--color-theme-primary)', flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Free-text input */}
                  <div className="quiz-custom-input-wrap">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <MessageCircle size={14} style={{ color: 'var(--color-theme-primary)' }} />
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {quizLang === 'te' ? 'లేదా మీ సమస్యను వివరించండి' : 'Or describe your concern in your own words'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                      <input
                        type="text"
                        className="quiz-text-input"
                        placeholder={quizLang === 'te' ? 'ఉదా: నా ముఖంపై నల్లటి మచ్చలు ఉన్నాయి...' : 'e.g. I have dark spots on my cheeks and oily skin...'}
                        value={quizCustomInput}
                        onChange={e => setQuizCustomInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && quizCustomInput.trim()) {
                            handleQuizConcern(quizCustomInput.trim())
                          }
                        }}
                      />
                      <button
                        className="btn-gold"
                        style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '10px', whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={() => {
                          if (quizCustomInput.trim()) handleQuizConcern(quizCustomInput.trim())
                        }}
                        disabled={!quizCustomInput.trim()}
                      >
                        {quizLang === 'te' ? 'విశ్లేషించు' : 'Analyze'} <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Skin Profile selection */}
              {quizStep === 2 && (
                <div className="col" style={{ gap: '20px', animation: 'slideDown 0.3s ease-out' }}>
                  <div className="row" style={{ gap: '10px' }}>
                    <Activity style={{ color: 'var(--color-theme-primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-theme-secondary)' }}>
                      {quizLang === 'te' ? 'మీ చర్మ రకాన్ని వివరించండి' : 'Describe Your Skin Profile'}
                    </span>
                  </div>

                  {/* Selected concern badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(183,156,97,0.1)', border: '1px solid rgba(183,156,97,0.3)', borderRadius: '20px', padding: '4px 12px', alignSelf: 'flex-start' }}>
                    <CheckCircle size={12} style={{ color: 'var(--color-theme-primary)' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-theme-secondary)' }}>
                      {quizLang === 'te' ? 'ఎంచుకున్న సమస్య:' : 'Concern:'} <strong>{selectedConcern}</strong>
                    </span>
                  </div>

                  {/* Image Preview Thumbnail */}
                  {quizImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={quizImagePreview} alt="Uploaded" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--color-theme-primary)' }} />
                    </div>
                  )}

                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {quizLang === 'te'
                      ? 'ఇది లేజర్ తీవ్రత మరియు మీ జీవశాస్త్రానికి ఉత్పత్తి అనుకూలతను కాలిబ్రేట్ చేయడానికి సహాయపడుతుంది.'
                      : 'This helps calibrate laser intensity and product compatibility for your unique biology.'}
                  </p>

                  <div className="quiz-card-grid">
                    {[
                      {
                        type: 'Oily / Acne-Prone',
                        label: quizLang === 'te' ? 'నూనె / మొటిమలు ప్రోన్' : 'Oily / Acne-Prone',
                        desc: quizLang === 'te' ? 'అదనపు సీబమ్, మెరిసే T-జోన్, తరచుగా మొటిమలు' : 'Excess sebum, shiny T-zone, frequent breakouts, large pores',
                        icon: Droplets
                      },
                      {
                        type: 'Dry / Flaky',
                        label: quizLang === 'te' ? 'పొడి / పొరలు వచ్చే చర్మం' : 'Dry / Flaky',
                        desc: quizLang === 'te' ? 'బిగుతు, కరుకు పాచ్‌లు, నిస్తేజ సంక్లిష్టత' : 'Tightness, rough patches, dull complexion, fine dehydration lines',
                        icon: Sparkles
                      },
                      {
                        type: 'Normal / Combination',
                        label: quizLang === 'te' ? 'సాధారణ / మిశ్రమ' : 'Normal / Combination',
                        desc: quizLang === 'te' ? 'సమతుల్య చెంపలు, T-జోన్‌లో కొంచెం నూనె' : 'Balanced cheeks, slight oil on T-zone, generally even texture',
                        icon: Activity
                      },
                      {
                        type: 'Sensitive / Prone to Redness',
                        label: quizLang === 'te' ? 'సున్నితమైన / ఎరుపు ప్రోన్' : 'Sensitive / Prone to Redness',
                        desc: quizLang === 'te' ? 'సులభంగా చిరాకుపడుతుంది, ఉత్పత్తులకు ప్రతిస్పందిస్తుంది' : 'Easily irritated, visible capillaries, reactive to products',
                        icon: Heart
                      }
                    ].map((item) => {
                      const IconEl = item.icon;
                      const isSelected = selectedSkinType === item.type;
                      return (
                        <div
                          key={item.type}
                          onClick={() => handleQuizSkinType(item.type)}
                          className={`quiz-card-option ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="quiz-card-icon-frame">
                            <IconEl size={22} />
                          </div>
                          <div className="col" style={{ gap: '4px', flex: 1 }}>
                            <span className="quiz-card-title">{item.label}</span>
                            <span className="quiz-card-desc">{item.desc}</span>
                          </div>
                          <ArrowRight size={14} className="arrow-hover" style={{ opacity: 0, transform: 'translateX(-8px)', transition: 'all 0.3s ease', color: 'var(--color-theme-primary)', flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={() => setQuizStep(1)} className="btn-outline" style={{ alignSelf: 'flex-start', padding: '8px 18px', fontSize: '11px' }}>
                    ← {quizLang === 'te' ? 'వెనుకకు' : 'Back'}
                  </button>
                </div>
              )}

              {/* Loading: Clinical Analysis Scanner */}
              {quizStep === 'loading' && (
                <div className="col" style={{ gap: '24px', alignItems: 'center', padding: '10px 0', animation: 'fadeIn 0.3s ease-out' }}>
                  <div className="quiz-scanner">
                    <div className="quiz-scanner-inner">
                      <Scan size={36} style={{ color: 'var(--color-theme-primary)' }} />
                      <div className="scanner-pulse-ring"></div>
                    </div>
                    <div className="scanner-line"></div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-theme-secondary)', fontFamily: 'var(--font-serif)' }}>
                      {quizLang === 'te' ? 'క్లినికల్ విశ్లేషణ జరుగుతోంది' : 'Clinical Analysis in Progress'}
                    </span>
                  </div>

                  <div className="quiz-progress-block">
                    <div className="premium-progress-bar" style={{ height: '8px', background: 'var(--color-border-primary)', borderRadius: '4px' }}>
                      <div
                        className="premium-progress-fill premium-progress-fill-gold"
                        style={{ width: `${loadingProgress}%`, transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                      ></div>
                    </div>
                    <div className="quiz-progress-text">
                      <span className="quiz-loading-message">{loadingText}</span>
                      <span className="quiz-progress-pct">{loadingProgress}%</span>
                    </div>
                  </div>

                  <div className="quiz-loading-log">
                    <div className="quiz-log-entry" style={{ opacity: loadingProgress >= 10 ? 1 : 0.3 }}><Check size={11} /> {quizLang === 'te' ? 'రోగి ప్రొఫైల్ గుర్తించబడింది' : 'Patient profile identified'}</div>
                    <div className="quiz-log-entry" style={{ opacity: loadingProgress >= 30 ? 1 : 0.3 }}><Check size={11} /> {quizLang === 'te' ? 'చర్మ అనుకూలత విశ్లేషించబడింది' : 'Analyzing epidermal compatibility'}</div>
                    <div className="quiz-log-entry" style={{ opacity: loadingProgress >= 60 ? 1 : 0.3 }}><Check size={11} /> {quizLang === 'te' ? 'చర్మ ప్రొఫైల్‌తో సరిపోల్చబడింది' : 'Cross-matching with skin profile'}</div>
                    <div className="quiz-log-entry" style={{ opacity: loadingProgress >= 90 ? 1 : 0.3 }}><Check size={11} /> {quizLang === 'te' ? 'చికిత్స ప్రోటోకాల్ రూపొందించబడింది' : 'Formulating treatment protocol'}</div>
                  </div>
                </div>
              )}

              {/* Step 3: Clinical Diagnostic Docket */}
              {quizStep === 3 && quizResult && (
                <div className="col" style={{ gap: '24px', animation: 'slideDown 0.4s ease-out' }}>
                  <div className="clinical-docket-header">
                    <div className="row" style={{ gap: '10px' }}>
                      <ClipboardList size={20} style={{ color: 'var(--color-theme-secondary)' }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-theme-secondary)' }}>
                        {quizLang === 'te' ? 'క్లినికల్ నిర్ధారణ నివేదిక' : 'Clinical Diagnostic Docket'}
                      </span>
                    </div>
                    <span className="badge-verified" style={{ fontSize: '9px' }}>
                      <CheckCircle size={10} /> {quizLang === 'te' ? 'AI-సహాయ విశ్లేషణ' : 'AI-Assisted Analysis'}
                    </span>
                  </div>

                  {/* Diagnostic Stats */}
                  <div className="docket-stats-grid">
                    <div className="docket-stat">
                      <div className="docket-stat-icon"><Target size={16} /></div>
                      <span className="docket-stat-label">{quizLang === 'te' ? 'లక్ష్య పొర' : 'Target Layer'}</span>
                      <span className="docket-stat-value">{quizResult.layer}</span>
                    </div>
                    <div className="docket-stat">
                      <div className="docket-stat-icon"><Calendar size={16} /></div>
                      <span className="docket-stat-label">{quizLang === 'te' ? 'సెషన్‌లు' : 'Est. Sessions'}</span>
                      <span className="docket-stat-value">{quizResult.sessions}</span>
                    </div>
                    <div className="docket-stat">
                      <div className="docket-stat-icon"><Clock size={16} /></div>
                      <span className="docket-stat-label">{quizLang === 'te' ? 'నయం కావడానికి సమయం' : 'Healing Time'}</span>
                      <span className="docket-stat-value">{quizResult.downtime}</span>
                    </div>
                    <div className="docket-stat">
                      <div className="docket-stat-icon"><Sparkles size={16} /></div>
                      <span className="docket-stat-label">{quizLang === 'te' ? 'ప్రారంభ ధర' : 'Starting From'}</span>
                      <span className="docket-stat-value" style={{ color: 'var(--color-theme-secondary)', fontWeight: '700' }}>{quizResult.startingPrice}</span>
                    </div>
                  </div>

                  {/* Treatment Recommendation */}
                  <div className="docket-treatment-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                      <div className="docket-recommend-badge">
                        <Heart size={18} style={{ color: '#ffffff' }} />
                      </div>
                      <div className="col" style={{ gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-theme-primary)', fontWeight: '700' }}>
                          {quizLang === 'te' ? 'డా. యమిని సిఫారసు' : "Dr. Yamini's Recommendation"}
                        </span>
                        <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)', fontWeight: '600', lineHeight: '1.3' }}>
                          {quizResult.recommended}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                          {quizResult.details}
                        </p>
                        {/* Telugu translation of details if available */}
                        {quizLang === 'te' && quizResult.details_te && (
                          <p style={{ fontSize: '13px', color: 'var(--color-theme-secondary)', lineHeight: '1.6', borderTop: '1px solid rgba(183,156,97,0.2)', paddingTop: '8px', fontStyle: 'italic' }}>
                            🇮🇳 {quizResult.details_te}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Matching Summary */}
                  <div className="docket-matching-summary">
                    <div className="docket-match-item">
                      <CheckCircle size={14} style={{ color: 'var(--color-emerald)', flexShrink: 0 }} />
                      <span>{quizLang === 'te' ? 'సమస్య:' : 'Concern:'} <strong>{selectedConcern}</strong></span>
                    </div>
                    <div className="docket-match-item">
                      <CheckCircle size={14} style={{ color: 'var(--color-emerald)', flexShrink: 0 }} />
                      <span>{quizLang === 'te' ? 'చర్మ ప్రొఫైల్:' : 'Skin Profile:'} <strong>{selectedSkinType}</strong></span>
                    </div>
                    <div className="docket-match-item">
                      <CheckCircle size={14} style={{ color: 'var(--color-emerald)', flexShrink: 0 }} />
                      <span>{quizLang === 'te' ? 'ప్రోటోకాల్:' : 'Protocol:'} <strong>{quizLang === 'te' ? 'FDA ఆమోదించిన లేజర్ వ్యవస్థ' : 'FDA-Approved Laser System'}</strong></span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={applyQuizRecommendation} className="btn-gold" style={{ flex: 1, minWidth: '200px' }}>
                      {quizLang === 'te' ? 'ఈ చికిత్స బుక్ చేయండి' : 'Book This Treatment'} <ArrowUpRight size={14} />
                    </button>
                    <button onClick={resetQuiz} className="btn-outline" style={{ minWidth: '120px' }}>
                      {quizLang === 'te' ? 'మళ్ళీ ప్రయత్నించండి' : 'Retake Quiz'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* 11. PRICING tiered PACKAGES TABLE */}
      <section id="pricing" className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff' }}>
        <div className="container">
          <div className="text-center">
            <span className="section-subtitle">Transparent Costing</span>
            <h2 className="section-title">Aesthetic <span>Treatment Tiers</span></h2>
            <p className="section-desc">
              Choose the package level matching your cosmetic targets. No hidden fees. Every session is executed under strict clinical protocols.
            </p>
          </div>

          <div className="grid3">

            {/* Tier 1 */}
            <div className="luxury-spa-card" style={{ gap: '20px', background: 'var(--color-bg-main)' }}>
              <div className="col" style={{ gap: '4px' }}>
                <span className="badge-premium" style={{ alignSelf: 'flex-start' }}>Tier 01</span>
                <h3 style={{ fontSize: '22px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Essential Rejuvenation</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Entry-level maintenance & cleansing</p>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-primary)', padding: '16px 0' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>₹3,000</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}> / session</span>
              </div>

              {/* Features list */}
              <div className="col" style={{ gap: '10px', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-primary)' }} /> Laser Toning or Clinical Chemical Peel</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-primary)' }} /> Detailed Skin Scan Analysis</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-primary)' }} /> Post-Treatment Hydrating Soothing Pack</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-primary)' }} /> Standard Aftercare Guideline Sheet</div>
              </div>

              <button onClick={() => {
                setFormData(prev => ({ ...prev, treatment: 'Laser Toning' }))
                scrollToSection(bookingFormRef)
              }} className="btn-outline" style={{ marginTop: 'auto', display: 'block', width: '100%', background: '#ffffff' }}>
                Select Essential Plan
              </button>
            </div>

            {/* Tier 2 */}
            <div className="luxury-spa-card premium-card-highlight" style={{ gap: '20px' }}>
              <div className="col" style={{ gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge-premium" style={{ border: '1px solid var(--color-theme-secondary)', background: 'var(--color-theme-secondary)', color: '#ffffff' }}>Tier 02</span>
                  <span className="badge-premium" style={{ fontSize: '9px', background: '#ffffff', color: 'var(--color-theme-secondary)' }}>Most Popular</span>
                </div>
                <h3 style={{ fontSize: '22px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Advanced Transform</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Flagship laser and skin treatments</p>
              </div>

              <div style={{ borderTop: '1px solid var(--color-theme-primary)', padding: '16px 0' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-theme-secondary)', fontFamily: 'var(--font-serif)' }}>₹7,500</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}> / session</span>
              </div>

              {/* Features list */}
              <div className="col" style={{ gap: '10px', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-secondary)' }} /> Pico Hollywood Carbon Laser</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-secondary)' }} /> Customized Treatment Blueprint by Dr. Yamini</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-secondary)' }} /> Advanced Hydration Collagen Boosting Mask</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-secondary)' }} /> 24/7 WhatsApp Post-Care Priority Support</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-secondary)' }} /> 1 Free Follow-up Review Session</div>
              </div>

              <button onClick={() => {
                setFormData(prev => ({ ...prev, treatment: 'Pico Hollywood Carbon Laser' }))
                scrollToSection(bookingFormRef)
              }} className="btn-gold" style={{ marginTop: 'auto', display: 'block', width: '100%' }}>
                Select Advanced Plan <ArrowUpRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            {/* Tier 3 */}
            <div className="luxury-spa-card" style={{ gap: '20px', background: 'var(--color-bg-main)' }}>
              <div className="col" style={{ gap: '4px' }}>
                <span className="badge-premium" style={{ alignSelf: 'flex-start' }}>Tier 03</span>
                <h3 style={{ fontSize: '22px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Ultimate Radiance</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Premium skin remodelling & rejuvenation</p>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-primary)', padding: '16px 0' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>₹22,000</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}> / session</span>
              </div>

              {/* Features list */}
              <div className="col" style={{ gap: '10px', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-primary)' }} /> Combo Pico Laser + Skin Resurfacing</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-primary)' }} /> Direct VIP Doctor WhatsApp Consultation Access</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-primary)' }} /> Premium Dermocosmetics Take-Home Aftercare Kit</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-primary)' }} /> Lifetime Beauty Progress Tracking & Reviews</div>
                <div className="row" style={{ gap: '8px' }}><Check size={14} style={{ color: 'var(--color-theme-primary)' }} /> Unlimited Follow-up Checks for 6 Months</div>
              </div>

              <button onClick={() => {
                setFormData(prev => ({ ...prev, treatment: 'Skin Resurfacing' }))
                scrollToSection(bookingFormRef)
              }} className="btn-outline" style={{ marginTop: 'auto', display: 'block', width: '100%', background: '#ffffff' }}>
                Select Ultimate Plan
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 11.5 GOOGLE REVIEWS SECTION */}
      <section id="reviews" className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff' }}>
        <div className="container">

          {/* Header Row: Title & Google Badge */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px', marginBottom: '48px', borderBottom: '1.5px solid var(--color-border-primary)', paddingBottom: '32px' }}>
            <div className="col" style={{ gap: '6px', maxWidth: '600px' }}>
              <span className="section-subtitle">Patient Testimonials</span>
              <h2 className="section-title" style={{ margin: 0 }}>What Our <span>Patients Say</span></h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Real transformations and real confidence. Hear from our patients about their journey at Kairavam.
              </p>
            </div>

            {/* Google Reviews Badge */}
            <div className="glass-card" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px 24px',
              borderRadius: 'var(--border-radius-lg)',
              background: 'var(--color-bg-main)',
              border: '1.5px solid rgba(166, 130, 99, 0.25)',
              boxShadow: 'var(--shadow-premium)',
              minWidth: '280px'
            }}>
              <div style={{
                background: '#ffffff',
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                flexShrink: 0
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
              </div>
              <div className="col" style={{ gap: '2px' }}>
                <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-text-primary)' }}>4.8</span>
                  <div className="row" style={{ gap: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill="var(--color-theme-primary)" style={{ color: 'var(--color-theme-primary)' }} />
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Google Customer Rating</span>
                <a
                  href="https://www.google.com/search?q=Kairavam+Reviews"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '9px', color: 'var(--color-theme-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', textDecoration: 'underline' }}
                >
                  98 Verified Reviews
                </a>
              </div>
            </div>
          </div>

          {/* Horizontally Scrollable Track of Reviews (Auto-scrolling) */}
          <div className="reviews-scroll-container" ref={reviewsScrollRef}>
            {(() => {
              const reviewsList = googleReviews;
              const doubledReviews = [...reviewsList, ...reviewsList];
              return doubledReviews.map((review, idx) => {
                const originalIdx = idx % reviewsList.length;
                const isExpanded = expandedReviews[originalIdx];
                const isLongText = review.text.length > 120;
                const displayText = isLongText && !isExpanded
                  ? `${review.text.slice(0, 120)}...`
                  : review.text;

                return (
                  <div
                    key={idx}
                    className="review-card-scroll-item luxury-spa-card"
                    style={{ gap: '12px', background: '#ffffff', justifyContent: 'space-between' }}
                  >
                    <div className="col" style={{ gap: '12px' }}>
                      {/* Header Row: Avatar, Name, Google Icon */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                          {review.avatar ? (
                            <img
                              src={review.avatar}
                              alt={review.author}
                              referrerPolicy="no-referrer"
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1.5px solid var(--color-border-primary)'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: 'var(--color-theme-cream)',
                              border: '1px solid var(--color-border-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '800',
                              fontSize: '14px',
                              color: 'var(--color-theme-secondary)'
                            }}>
                              {review.author.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="col" style={{ gap: '1px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-text-primary)', lineHeight: '1.2' }}>{review.author}</span>
                            <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', fontWeight: '500', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                              {review.role && <span>{review.role}</span>}
                              {review.role && <span style={{ opacity: 0.5 }}>•</span>}
                              <span>{review.date}</span>
                            </span>
                          </div>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', background: 'rgba(66, 133, 244, 0.06)', border: '1px solid rgba(66, 133, 244, 0.15)', color: '#4285F4', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          <svg viewBox="0 0 24 24" width="10" height="10" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                          </svg>
                          Google
                        </span>
                      </div>

                      {/* Stars Row */}
                      <div className="row" style={{ gap: '2px' }}>
                        {[...Array(review.stars)].map((_, i) => (
                          <Star key={i} size={12} fill="var(--color-theme-primary)" style={{ color: 'var(--color-theme-primary)' }} />
                        ))}
                      </div>

                      {/* Testimonial Text with Read More */}
                      <div className="col" style={{ gap: '3px' }}>
                        <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-line', fontStyle: 'normal' }}>
                          "{displayText}"
                        </p>
                        {isLongText && (
                          <button
                            onClick={() => toggleReviewExpand(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-theme-primary)',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              padding: 0,
                              textAlign: 'left',
                              marginTop: '2px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}
                          >
                            {isExpanded ? 'Read Less' : 'Read More'}
                          </button>
                        )}
                      </div>

                      {/* Services & Treatment Meta Badges Section */}
                      {(review.services || review.requestedStyle || review.hairType) && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                          padding: '8px 10px',
                          background: 'rgba(52, 79, 57, 0.03)',
                          borderLeft: '2.5px solid var(--color-theme-primary)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          margin: '2px 0'
                        }}>
                          {review.services && (
                            <div>
                              <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>Services: </span>
                              <span style={{ color: 'var(--color-text-secondary)' }}>{review.services.join(', ')}</span>
                            </div>
                          )}
                          {review.requestedStyle && (
                            <div>
                              <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>Requested style: </span>
                              <span style={{ color: 'var(--color-text-secondary)' }}>{review.requestedStyle}</span>
                            </div>
                          )}
                          {review.hairType && (
                            <div>
                              <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>Hair type: </span>
                              <span style={{ color: 'var(--color-text-secondary)' }}>{review.hairType}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Photo Attachments Grid */}
                      {review.photos && review.photos.length > 0 && (
                        <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {review.photos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              className="review-photo-container"
                              onClick={() => setLightboxImage(photo)}
                              style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: '1.5px solid var(--color-border-primary)',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                              }}
                            >
                              <img
                                src={photo}
                                alt={`Review attach ${pIdx + 1}`}
                                referrerPolicy="no-referrer"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease'
                                }}
                                className="review-photo-img"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Meta */}
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                      <span className="badge-verified" style={{ fontSize: '8px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={8} /> Verified Reviewer
                      </span>
                      {review.link && (
                        <a
                          href={review.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-theme-primary)', textDecoration: 'underline' }}
                        >
                          View on Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

        </div>
      </section>

      {/* INSTAGRAM REELS SECTION */}
      <section className="section-padding instagram-section" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff', position: 'relative' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>

          {/* Instagram Profile Header */}
          <div className="insta-profile-header">
            <div className="insta-avatar-ring">
              <div className="insta-avatar">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--color-theme-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </div>
            </div>
            <div className="insta-profile-info">
              <h3 className="insta-username">@kairavam_</h3>
              <p className="insta-bio">Behind-the-Scenes · Short Reels · Clinic Life</p>
            </div>
            <a
              href="https://www.instagram.com/kairavam_/"
              target="_blank"
              rel="noopener noreferrer"
              className="insta-follow-btn"
            >
              Follow
            </a>
          </div>

          {/* Reels Grid */}
          <div className="insta-reels-grid">
            {[
              {
                src: '/instgram-videos/hollywood-peel.mp4',
                label: 'Watch Procedure',
                brand: 'Kairavam'
              },
              {
                src: '/instgram-videos/luxury-salon.mp4',
                label: 'Watch Procedure',
                brand: 'Kairavam'
              },
              {
                src: '/instgram-videos/pmu-eyebrows.mp4',
                label: 'Watch Procedure',
                brand: 'Kairavam'
              },
              {
                src: '/instgram-videos/new-look.mp4',
                label: 'Watch Procedure',
                brand: 'Kairavam'
              }
            ].map((reel, idx) => (
              <div key={idx} className="insta-reel-card">
                <div
                  className="insta-reel-video-wrap"
                  onClick={() => {
                    const videoEl = document.querySelectorAll('.insta-reel-video')[idx]
                    if (videoEl) {
                      if (videoEl.paused) {
                        videoEl.muted = false
                        videoEl.play()
                      } else {
                        videoEl.pause()
                      }
                    }
                  }}
                >
                  <video
                    className="insta-reel-video"
                    preload="metadata"
                    playsInline
                    muted
                    loop
                  >
                    <source src={reel.src} type="video/mp4" />
                  </video>
                  <div className="insta-reel-play-overlay">
                    <div className="insta-reel-play-btn">
                      <Play size={20} fill="white" style={{ color: 'white' }} />
                    </div>
                  </div>
                  <div className="insta-reel-label">{reel.label}</div>
                </div>
                <div className="insta-reel-footer">
                  <span className="insta-reel-brand">{reel.brand}</span>
                  <button
                    className="insta-reel-watch"
                    onClick={() => {
                      const videoEl = document.querySelectorAll('.insta-reel-video')[idx]
                      if (videoEl) {
                        if (videoEl.paused) {
                          videoEl.play()
                        } else {
                          videoEl.pause()
                        }
                      }
                    }}
                  >
                    Watch
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 12. FAQ ACCORDION */}
      <section id="faq" className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="text-center">
            <span className="section-subtitle">Common Queries</span>
            <h2 className="section-title">Frequently Asked <span>Questions</span></h2>
            <p className="section-desc">
              Get clear, professional answers to your most common questions about our treatments and procedures.
            </p>
          </div>

          <div className="accordion-wrapper" style={{ marginTop: '24px' }}>
            {faqList.map((faq, index) => (
              <div
                key={index}
                className={`accordion-item ${expandedFaq === index ? 'accordion-item-expanded' : ''}`}
                style={{ borderRadius: 'var(--border-radius-md)' }}
              >
                <div
                  className="accordion-header"
                  onClick={() => toggleFaq(index)}
                  style={{ padding: '14px 20px' }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{faq.q}</span>
                  {expandedFaq === index ? <ChevronUp size={14} style={{ color: 'var(--color-theme-primary)' }} /> : <ChevronDown size={14} />}
                </div>
                {expandedFaq === index && (
                  <div className="accordion-content" style={{ padding: '16px 20px', fontSize: '13px', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 14. BOOKING FORM & CONTACT CARD */}
      <section ref={bookingFormRef} id="contact" className="section-padding" style={{ borderBottom: '1px solid var(--color-border-primary)', background: '#ffffff' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <span className="section-subtitle">Contact Us</span>
            <h2 className="section-title">Book Your <span>Appointment Today</span></h2>
            <p className="section-desc">Get Expert Skin Consultation &amp; Exclusive Offers</p>
          </div>
          <div className="grid2" style={{ gap: '48px', alignItems: 'stretch' }}>

            {/* Left Column: Form */}
            <div className="luxury-spa-card" style={{ gap: '20px', height: '100%' }}>
              <div className="col" style={{ gap: '6px' }}>
                <span className="badge-premium" style={{ alignSelf: 'flex-start' }}>Priority Booking</span>
                <h3 style={{ fontSize: '24px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)', fontWeight: '600' }}>Book Your Appointment Today</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Get Expert Skin Consultation &amp; Exclusive Offers
                </p>
                <p style={{ fontSize: '11px', color: 'var(--color-theme-secondary)', fontWeight: '600' }}>
                  Up To 40% OFF On Selected Treatments &bull; Limited Slots Available
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Submit the form below and Dr. Yamini's patient coordinators will call you back within 15 minutes to confirm.
                </p>
              </div>

              {formSubmitted ? (
                <div className="col" style={{
                  gap: '16px',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '30px 10px',
                  background: 'var(--color-emerald-bg)',
                  border: '1px solid var(--color-emerald-border)',
                  borderRadius: 'var(--border-radius-md)',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(14, 159, 110, 0.1)',
                    border: '1px solid rgba(14, 159, 110, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-emerald)'
                  }}>
                    <CheckCircle size={24} />
                  </div>
                  <div className="col" style={{ gap: '4px' }}>
                    <h4 style={{ color: 'var(--color-text-primary)', fontSize: '18px', fontWeight: '600' }}>Booking Request Received!</h4>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '280px' }}>
                      Thank you <strong>{formData.name}</strong>. A clinical coordinator will reach out to you on <strong>{formData.phone}</strong> shortly to align on your preferred date of <strong>{formData.date}</strong>.
                    </p>
                  </div>
                  <button onClick={resetBookingForm} className="btn-outline" style={{ fontSize: '10px', padding: '6px 14px' }}>
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="col" style={{ gap: '16px' }}>

                  {/* Name field */}
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Enter your full name"
                      className={getFieldClass('name')}
                    />
                    {formTouched.name && formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    {formTouched.name && !formErrors.name && formData.name && <span className="field-success">Looks good</span>}
                  </div>

                  {/* Phone field */}
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Enter your 10-digit mobile number"
                      className={getFieldClass('phone')}
                      maxLength={10}
                    />
                    {formTouched.phone && formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                    {formTouched.phone && !formErrors.phone && formData.phone && <span className="field-success">Valid number</span>}
                  </div>

                  {/* Chosen treatment */}
                  <div className="form-group">
                    <label className="form-label">Preferred Treatment</label>
                    <select
                      name="treatment"
                      value={formData.treatment}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={getFieldClass('treatment')}
                    >
                      <option value="">Select Treatment Type</option>
                      <option value="Pico Hollywood Carbon Laser">Pico Hollywood Carbon Laser</option>
                      <option value="Laser Toning">Q-Switched Laser Toning</option>
                      <option value="Clinical Skin Resurfacing">Clinical Skin Resurfacing</option>
                      <option value="Acne Scar Treatment">Acne Scar Treatment</option>
                      <option value="Open Pore Treatment">Open Pore Treatment</option>
                      <option value="Not Sure (Consultation First)">Not Sure (Consultation First)</option>
                    </select>
                    {formTouched.treatment && formErrors.treatment && <span className="field-error">{formErrors.treatment}</span>}
                    {formTouched.treatment && !formErrors.treatment && formData.treatment && <span className="field-success">Treatment selected</span>}
                  </div>

                  {/* Date selection */}
                  <div className="form-group">
                    <label className="form-label">Preferred Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={getFieldClass('date')}
                    />
                    {formTouched.date && formErrors.date && <span className="field-error">{formErrors.date}</span>}
                    {formTouched.date && !formErrors.date && formData.date && <span className="field-success">Valid date</span>}
                  </div>

                  {/* Notes */}
                  <div className="form-group">
                    <label className="form-label">Your Concerns (Optional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Tell us briefly about your skin or hair targets..."
                      className="form-control"
                      style={{ height: '70px', resize: 'none' }}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn-gold" style={{ width: '100%', padding: '12px 0' }}>
                    Confirm Booking Request <ArrowUpRight size={14} />
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Contact info & map graphic */}
            <div className="col" style={{ gap: '20px', justifyContent: 'space-between' }}>
              {/* Google Maps Embed with Animation */}
              <div className="map-wrapper animate-map">
                <div className="map-overlay-top"></div>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.426187571828!2d80.64465607460865!3d16.504568027637607!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35fb1531f3efc5%3A0xf99a9d5c3d3ccae6!2sKairavam!5e0!3m2!1sen!2sin!4v1781679412808!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: 'var(--border-radius-lg)' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Kairavam Clinic Location"
                />
                <div className="map-pin-overlay">
                  <MapPin size={22} style={{ color: 'var(--color-theme-primary)' }} />
                </div>
              </div>

              {/* Clinic details card */}
              <div className="col" style={{ gap: '8px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--color-text-primary)', fontWeight: '700' }}>Kairavam Advanced Skin &amp; Laser Clinic</h3>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>Clinic Hours: 10:00 AM – 8:00 PM</p>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: '#ffffff',
                border: '1px solid var(--color-border-primary)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '20px 24px',
                boxShadow: 'var(--shadow-premium)'
              }}>
                <div className="row" style={{ gap: '10px', alignItems: 'flex-start' }}>
                  <MapPin size={15} style={{ color: 'var(--color-theme-primary)', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Fortune Murali Park Road,<br />
                    Above Apollo Pharmacy, 3rd Floor,<br />
                    Moghalrajpuram,<br />
                    Vijayawada – 520010
                  </span>
                </div>

                <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                  <Clock size={15} style={{ color: 'var(--color-theme-primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    10:00 AM - 8:00 PM (Monday to Sunday)
                  </span>
                </div>

                <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                  <Phone size={15} style={{ color: 'var(--color-theme-primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Callback Hotline: <a href="tel:7998777666" style={{ textDecoration: 'none', color: 'var(--color-text-primary)', fontWeight: '600' }}>7998777666</a>
                  </span>
                </div>

                <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                  <MessageSquare size={15} style={{ color: '#25d366', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    WhatsApp Help: <a href="https://wa.me/918478060606" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--color-text-primary)', fontWeight: '600' }}>8478060606</a>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>





      {/* 14. FOOTER */}
      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid var(--color-border-primary)',
        padding: '60px 0 20px',
        color: 'var(--color-text-secondary)'
      }}>
        <div className="container">

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr',
            gap: '32px',
            marginBottom: '40px',
            flexWrap: 'wrap'
          }} className="footer-grid">

            {/* Col 1: Brand */}
            <div className="col" style={{ gap: '14px' }}>
              <img
                src="/kairavamfinallogo.png"
                alt="Kairavam Logo"
                style={{ height: '48px', objectFit: 'contain', alignSelf: 'flex-start', marginBottom: '4px' }}
              />
              <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
                Kairavam is Vijayawada's premier advanced skin and laser clinic. Combining expert-led cosmetic medicine with FDA-approved laser technology, we craft customized treatments that enhance your natural beauty safely and effectively.
              </p>
            </div>

            {/* Col 2: Treatments */}
            <div className="col" style={{ gap: '10px' }}>
              <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-primary)', fontWeight: '600' }}>Treatments</h4>
              <div className="col" style={{ gap: '8px', fontSize: '12px' }}>
                <a href="#treatments" style={{ textDecoration: 'none', color: 'inherit' }}>Pico Hollywood Carbon Laser</a>
                <a href="#treatments" style={{ textDecoration: 'none', color: 'inherit' }}>Q-Switched Laser Toning</a>
                <a href="#treatments" style={{ textDecoration: 'none', color: 'inherit' }}>Clinical Skin Resurfacing</a>
                <a href="#treatments" style={{ textDecoration: 'none', color: 'inherit' }}>Acne Scar Treatment</a>
                <a href="#treatments" style={{ textDecoration: 'none', color: 'inherit' }}>Open Pore Treatment</a>
                <a href="#treatments" style={{ textDecoration: 'none', color: 'inherit' }}>Skin Rejuvenation</a>
              </div>
            </div>

            {/* Col 3: Clinic */}
            <div className="col" style={{ gap: '10px' }}>
              <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-primary)', fontWeight: '600' }}>Clinic</h4>
              <div className="col" style={{ gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'inherit' }}>Dr. Yamini Kiran Pasupuleti</span>
                <a href="#before-after" style={{ textDecoration: 'none', color: 'inherit' }}>Patient Results</a>
                <a href="#faq" style={{ textDecoration: 'none', color: 'inherit' }}>FAQs</a>
                <a href="#contact" style={{ textDecoration: 'none', color: 'inherit' }}>Contact Us</a>
              </div>
            </div>

            {/* Col 4: Social */}
            <div className="col" style={{ gap: '12px' }}>
              <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-primary)', fontWeight: '600' }}>Stay Updated</h4>
              <p style={{ fontSize: '12px' }}>
                Subscribe for skincare advice from Dr. Yamini and priority access to clinical offers.
              </p>
              <div className="row" style={{ gap: '16px', marginTop: '4px' }}>
                <a href="https://www.instagram.com/kairavam_/" target="_blank" rel="noopener noreferrer" className="footer-social-icon instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a href="https://wa.me/918478060606" target="_blank" rel="noopener noreferrer" className="footer-social-icon whatsapp">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div style={{
            borderTop: '1px solid var(--color-border-primary)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span>© 2026 Kairavam Advanced Skin &amp; Laser Clinic. All rights reserved.</span>
            <span>Powered by Digital Verto</span>
            <div className="row" style={{ gap: '16px' }}>
              <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span style={{ cursor: 'pointer' }}>Terms of Service</span>
              <span style={{ cursor: 'pointer' }}>Clinic Guidelines</span>
            </div>
          </div>

        </div>
      </footer>



      {/* VIDEO MODAL — Instagram reel (header cropped with CSS) */}
      {videoModalOpen && (
        <div className="video-modal-overlay" onClick={() => setVideoModalOpen(false)}>
          <div className="video-modal-container" onClick={e => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setVideoModalOpen(false)}>
              <X size={22} />
            </button>
            <div className="video-modal-crop">
              <div className="video-modal-embed">
                <iframe
                  src="https://www.instagram.com/reel/DYkQKrpDCY4/embed/?hidecaption=true"
                  title="Instagram Reel"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR REVIEW IMAGES */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            background: 'rgba(26, 38, 29, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => setLightboxImage(null)}
        >
          <button
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setLightboxImage(null)}
            className="lightbox-close-btn"
          >
            <X size={24} />
          </button>

          <div
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '80%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Review Attachment Zoomed"
              referrerPolicy="no-referrer"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                borderRadius: '8px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                objectFit: 'contain',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                background: '#000000'
              }}
            />
            <span style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '11px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'rgba(0,0,0,0.4)',
              padding: '4px 12px',
              borderRadius: '20px'
            }}>
              Click anywhere outside to close
            </span>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
