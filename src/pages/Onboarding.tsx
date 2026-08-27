import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Vision Globale',
      description: 'Suivez vos actifs, vos dettes et vos créances en un seul endroit pour une clarté financière totale.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmIZA7Wf9Zf66edEmIbOooQ6Um1MWCUcMQ4xEq4oavbqtJwqYhEEExNrLmLFXqg24ft9SupCnGanqqOHK-z4TSCdT9L3WdxzjT-osu_2IvfZf4B5R_rBVfJDcWsbMDKKnZY_j5Oi_c4S5ksPQX2kpC7CmNpliFfS-02fjVA8du6gzcGm5RXXiLAyX9TcfZvQHS-Ok3tjIOZqWSPJVprNTxqYvZsXzmxcHyPsTToNEKohtwlEbtBuPo',
      alt: 'Illustration Vision Globale'
    },
    {
      title: 'Objectifs Financiers',
      description: 'Épargnez pour vos rêves avec un suivi détaillé de votre progression vers chaque objectif.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7qISX_ZOIuTvNfofeu7Oa9pd52J_fXCN0xfr7hI9Ljm9AgZCkEfye9iweqLUumSoKDC1aW9JbAeDLVwKqE6grnK-qAE4-sGiX7v_YLlPfucnlRwti6yYUciCrLYJ6mif8LPQ-NxKqPhIGjI89LF_h-X5wzFerTHpbvgydZOvGPUVOHm81uZ61HSdYotZbd-2yyn_14Nb-YdIVQ4gMC2IJ-H_53ahfuoL6SrsiI1T_RQyIzkAMLmaO',
      alt: 'Illustration Objectifs Financiers'
    },
    {
      title: 'Sécurité Totale',
      description: 'Vos données sont protégées par les dernières technologies de chiffrement et la biométrie.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvM6am_QSRX-ae_-vNyh-Ync9eDQv7CvaCGRKxqUebRrStFyA0MUkpJcfwnOWtGaIlx7aVMNmWDT0Tv3KgKXTZxh8V3zKXYmDjFcbTpIR4upIgJfqaT5ksnIehzUbWw8FFjb5jS7rvZzeImPMkz1oW7gTWMe1aWF0htEyjOhlubP3REoNaM6cqCM9Iig80wstNh4CmGsN5POPoyZos1r1bGB-L-i6Z1vRYyYj4q4Ewqf-SKZfSjUAY',
      alt: 'Illustration Sécurité'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/login');
    }
  };

  const handleSkip = () => {
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col font-body-lg antialiased overflow-hidden bg-background text-on-background">
      {/* Top App Bar */}
      <header className="w-full z-10 flex justify-center items-center px-container-padding h-16 pt-8">
        <h1 className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight">FINORA</h1>
      </header>

      {/* Main Content Carousel */}
      <main className="flex-1 flex flex-col justify-center items-center overflow-hidden relative px-container-padding pb-32">
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Image */}
          <div className="w-full mb-stack-lg rounded-xl overflow-hidden aspect-square border border-surface-container-high shadow-sm">
            <img 
              className="w-full h-full object-cover transition-all duration-500 ease-in-out transform" 
              src={steps[currentStep].image} 
              alt={steps[currentStep].alt} 
            />
          </div>
          
          {/* Title */}
          <h2 className="font-headline-md text-headline-md text-center mb-stack-sm text-primary transition-all duration-300">
            {steps[currentStep].title}
          </h2>
          
          {/* Description */}
          <p className="font-body-lg text-body-lg text-on-surface-variant text-center max-w-sm min-h-[72px] transition-all duration-300">
            {steps[currentStep].description}
          </p>
        </div>
      </main>

      {/* Bottom Area */}
      <div className="fixed bottom-0 w-full z-10 bg-background pb-8 px-container-padding pt-4 border-t border-surface-container-low">
        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-stack-md">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-secondary-container w-6' 
                  : 'bg-surface-variant'
              }`}
            ></div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-stack-sm w-full max-w-sm mx-auto">
          <button 
            onClick={handleNext}
            className="w-full h-[56px] bg-secondary-container text-primary-container rounded-xl font-label-caps text-label-caps flex items-center justify-center transition-transform active:scale-95 shadow-[0px_4px_20px_rgba(10,25,47,0.05)] font-bold text-sm"
          >
            {currentStep === steps.length - 1 ? 'Commencer' : 'Suivant'}
          </button>
          
          {currentStep < steps.length - 1 && (
            <button 
              onClick={handleSkip}
              className="w-full h-[56px] bg-transparent text-on-surface-variant rounded-xl font-label-caps text-label-caps flex items-center justify-center transition-colors active:bg-surface-container-low font-bold text-sm"
            >
              Passer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
