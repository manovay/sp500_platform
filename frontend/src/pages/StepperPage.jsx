import React, { useState } from 'react';
import Stepper from '../components/Stepper';
import Step1_SearchStock from '../components/Step1_SearchStock';
import Step2_ShowInfo from '../components/Step2_ShowInfo';
import Step3_PromptReview from '../components/Step3_PromptReview';
import Step4_ShowResult from '../components/Step4_ShowResult';

const steps = [
  'Search Stock',
  'Show Info',
  'Review Prompt',
  'Show Result'
];

export default function StepperPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleReset = () => {
    setActiveStep(0);
    setSelectedStock(null);
    setStockInfo(null);
    setPrompt('');
    setResult(null);
  };

  return (
    <div>
      <div className="card mb-lg">
        <Stepper steps={steps} activeStep={activeStep} />
      </div>
      
      {activeStep === 0 && (
        <Step1_SearchStock onSelect={stock => { setSelectedStock(stock); handleNext(); }} />
      )}
      {activeStep === 1 && (
        <Step2_ShowInfo stock={selectedStock} onInfoLoaded={info => { setStockInfo(info); handleNext(); }} onBack={handleBack} />
      )}
      {activeStep === 2 && (
        <Step3_PromptReview info={stockInfo} onPromptReady={prompt => { setPrompt(prompt); handleNext(); }} onBack={handleBack} />
      )}
      {activeStep === 3 && (
        <Step4_ShowResult 
          prompt={prompt}
          onResult={setResult}
          result={result}
          onBack={handleBack}
          onReset={handleReset}
          stock={selectedStock}
        />
      )}
    </div>
  );
} 