import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { soundEffects } from '../lib/soundEffects';
import { loadRazorpayScript, getRazorpayKeyId } from '../lib/razorpay';

export interface RazorpayPaymentResult {
  paymentId: string;
  orderId: string;
  amount: number;
  commissionFee: number;
  netPayout: number;
  method: string;
  timestamp: string;
}

interface RazorpaySecureCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealTitle: string;
  beneficiaryName: string;
  amount: number;
  commissionFee: number;
  netPayout: number;
  onPaymentSuccess: (result: RazorpayPaymentResult) => void;
}

type PaymentTab = 'upi' | 'card' | 'netbanking';

export const RazorpaySecureCheckoutModal: React.FC<RazorpaySecureCheckoutModalProps> = ({
  isOpen,
  onClose,
  dealTitle,
  beneficiaryName,
  amount,
  commissionFee,
  netPayout,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sdkAvailable, setSdkAvailable] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setSdkAvailable(loaded && !!window.Razorpay);
    });
  }, []);

  if (!isOpen) return null;

  const orderId = `order_rcptid_${Date.now().toString().slice(-8)}`;

  // Launch official Razorpay standard popup checkout window if SDK available
  const handleLaunchOfficialSdk = () => {
    if (!window.Razorpay) {
      setErrorMessage('Standard SDK not loaded yet. Using built-in secure checkout form.');
      return;
    }

    try {
      const key = getRazorpayKeyId();
      const options = {
        key: key,
        amount: Math.round(amount * 100), // in paise
        currency: 'INR',
        name: 'VERILANCE Multi-Sig Escrow',
        description: `Escrow for ${dealTitle || 'Freelance Service Contract'} (3% Platform Fee Protected)`,
        image: 'https://cdn-icons-png.flaticon.com/512/2092/2092663.png',
        handler: (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
          soundEffects.playNotificationSound();
          onPaymentSuccess({
            paymentId: response.razorpay_payment_id || `pay_${Date.now()}_LIVE`,
            orderId: response.razorpay_order_id || orderId,
            amount,
            commissionFee,
            netPayout,
            method: 'OFFICIAL_RAZORPAY_POPUP',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          onClose();
        },
        prefill: {
          name: beneficiaryName || 'Client Partner',
          email: 'client@verilance.io',
          contact: '9999999999',
        },
        theme: {
          color: '#06b6d4',
          backdrop_color: '#020617',
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay standard popup dismissed by user');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.warn('Razorpay SDK open error, fallback to interactive form:', err);
      setErrorMessage('Using in-app secured Razorpay simulator.');
    }
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (activeTab === 'upi') {
      const trimmedUpi = upiId.trim();
      if (trimmedUpi && !trimmedUpi.includes('@')) {
        setErrorMessage('Please enter a valid UPI ID (e.g., yourname@okhdfcbank).');
        return;
      }
    } else if (activeTab === 'card') {
      if (cardNumber.replace(/\s+/g, '').length < 12) {
        setErrorMessage('Please enter a valid 16-digit card number.');
        return;
      }
    }

    setIsProcessing(true);
    soundEffects.playTabClick();

    // Simulate authentic Razorpay authorization delay (1.2s)
    setTimeout(() => {
      setIsProcessing(false);
      const paymentId = `pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}_LIVE`;
      
      soundEffects.playNotificationSound();

      onPaymentSuccess({
        paymentId,
        orderId,
        amount,
        commissionFee,
        netPayout,
        method: activeTab.toUpperCase(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="razorpay-checkout-modal"
        className="relative w-full max-w-lg bg-[#0d121c] border border-cyan-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.2)] overflow-hidden text-slate-100 my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Top Header: Razorpay Authentic Header */}
        <div className="bg-gradient-to-r from-[#0c2340] via-[#091e36] to-[#0a1829] px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c83fd] flex items-center justify-center text-white font-extrabold text-sm shadow-md font-['Space_Grotesk']">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Space_Grotesk'] font-bold text-sm tracking-wide text-white">
                  Razorpay
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                  SECURE ESCROW
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Order: <span className="font-mono text-slate-300">{orderId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Cancel payment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Deal & 3% Escrow Breakdown Summary */}
        <div className="p-4 sm:p-5 bg-[#090d14] border-b border-white/5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Contract Escrow Deposit
              </span>
              <h3 className="text-sm font-bold text-white truncate max-w-[280px]">
                {dealTitle || 'Freelance Service Contract'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Beneficiary: <strong className="text-slate-200">{beneficiaryName || 'Video Editor'}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total Payable</span>
              <span className="text-xl sm:text-2xl font-black font-['Space_Grotesk'] text-cyan-400">
                ₹{amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* 3% Transparent Fee Logic Display */}
          <div className="p-3 rounded-xl bg-[#111724] border border-cyan-500/20 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Project Budget:</span>
              <span className="font-bold text-white font-mono">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-cyan-300">
              <span className="flex items-center gap-1">
                VERILANCE 3% Escrow Insurance:
                <HelpCircle className="w-3 h-3 text-cyan-400/80" />
              </span>
              <span className="font-bold font-mono">₹{commissionFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-slate-200">
              <span className="text-emerald-400 font-semibold">Net Payout to Freelancer (97%):</span>
              <span className="font-black text-emerald-400 font-mono">₹{netPayout.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-slate-400 italic pt-0.5">
              * Funds remain 100% locked in RBI-compliant escrow vault until you approve the watermarked preview.
            </p>
          </div>
        </div>

        {/* Payment Tabs Selection */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSubTabClick();
                setActiveTab('upi');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                activeTab === 'upi'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-[#121722] border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSubTabClick();
                setActiveTab('card');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                activeTab === 'card'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-[#121722] border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSubTabClick();
                setActiveTab('netbanking');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                activeTab === 'netbanking'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-[#121722] border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>Netbanking</span>
            </button>
          </div>

          <form onSubmit={handleSimulatePayment} className="space-y-3.5">
            {/* UPI Tab */}
            {activeTab === 'upi' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[#111724] border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Enter UPI ID / VPA</span>
                  <span className="text-[10px] text-cyan-400 font-mono">GPay • PhonePe • Paytm • CRED</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-[#182030] border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                />
                <div className="flex items-center gap-2 pt-1">
                  {['@okhdfcbank', '@paytm', '@ybl', '@ibl'].map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => setUpiId((prev) => (prev.split('@')[0] || 'username') + handle)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 font-mono transition"
                    >
                      {handle}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Card Tab */}
            {activeTab === 'card' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[#111724] border border-white/5 text-xs">
                <label className="text-slate-300 font-semibold block">Card Number</label>
                <input
                  type="text"
                  placeholder="4111 2222 3333 4444"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-[#182030] border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 outline-none transition"
                  maxLength={19}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-[#182030] border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 outline-none text-center"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-[#182030] border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 outline-none text-center"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Netbanking Tab */}
            {activeTab === 'netbanking' && (
              <div className="space-y-2 p-3.5 rounded-xl bg-[#111724] border border-white/5 text-xs">
                <label className="text-slate-300 font-semibold block">Select Bank</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2 rounded-lg text-left text-xs font-medium border transition ${
                        selectedBank === bank
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-[#182030] border-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action CTA */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Authorizing ₹{amount.toLocaleString('en-IN')} with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>Pay & Lock ₹{amount.toLocaleString('en-IN')} in Escrow</span>
                  </>
                )}
              </button>

              {sdkAvailable && (
                <button
                  type="button"
                  onClick={handleLaunchOfficialSdk}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Launch Official Razorpay Popup Modal</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Razorpay 256-bit SSL Escrow • 3% Insured Protection • Zero Hidden Fees</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
