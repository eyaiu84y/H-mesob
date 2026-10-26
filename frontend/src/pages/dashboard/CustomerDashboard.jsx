import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import QueueManagement from '../../components/dashboard/QueueManagement';
import FeedbackRating from '../../components/dashboard/FeedbackRating';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { useApplications } from '../../context/ApplicationContext';
import { useAnnouncements } from '../../context/AnnouncementContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useServices } from '../../context/ServiceContext';
import { useApp } from '../../context/AppContext';


// ─── Plain Language Status Helper for Customers ─────────────────────
function getPlainLanguageStatusInfo(status, lang) {
  const norm = String(status || '').toUpperCase();
  if (norm.includes('SUBMIT')) {
    return {
      badge: lang === 'am' ? 'ደርሷል' : 'Submitted',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-[#1e3a8a] dark:text-blue-300 border-blue-200 dark:border-blue-800',
      description: lang === 'am' ? 'ማመልከቻዎ ደርሷል፤ በቅርቡ ይመደባል' : 'Your application has been received.',
      actionText: lang === 'am' ? 'ሁኔታ ተመልከት' : 'View Details',
      actionClass: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-[#314ea1] dark:text-blue-300 border border-blue-200 dark:border-blue-700'
    };
  }
  if (norm.includes('REVIEW') || norm.includes('PROGRESS')) {
    return {
      badge: lang === 'am' ? 'በግምገማ ላይ' : 'Under Review',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      description: lang === 'am' ? 'ባለሙያዎች ማመልከቻዎን እየፈተሹ ነው' : 'Staff are checking your application.',
      actionText: lang === 'am' ? 'ሂደት ተከታተል' : 'Track Review',
      actionClass: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
    };
  }
  if (norm.includes('NEED') || norm.includes('DOC') || norm.includes('INFO')) {
    return {
      badge: lang === 'am' ? 'እርምጃ ያስፈልጋል' : 'Action Needed',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse',
      description: lang === 'am' ? 'እባክዎ የተጠየቀውን ተጨማሪ መረጃ ይስቀሉ' : 'Please provide requested information.',
      actionText: lang === 'am' ? 'ሰነድ ይስቀሉ' : 'Provide Info',
      actionClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs font-bold'
    };
  }
  if (norm.includes('APPROV')) {
    return {
      badge: lang === 'am' ? 'ጸድቋል' : 'Approved',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      description: lang === 'am' ? 'ማመልከቻዎ ጸድቋል፤ ወደ አገልግሎት መስኮት መሄድ ይችላሉ' : 'Approved — follow next steps.',
      actionText: lang === 'am' ? 'ቀጣይ ደረጃዎች' : 'Next Steps',
      actionClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-bold'
    };
  }
  if (norm.includes('COMPLET')) {
    return {
      badge: lang === 'am' ? 'ተጠናቋል' : 'Completed',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      description: lang === 'am' ? 'አገልግሎትዎ በተሳካ ሁኔታ ተጠናቋል' : 'Your service has been completed.',
      actionText: lang === 'am' ? 'ግብረመልስ ስጥ' : 'Rate Service',
      actionClass: 'bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/40 dark:hover:bg-violet-900/60 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-700'
    };
  }
  if (norm.includes('REJECT')) {
    return {
      badge: lang === 'am' ? 'ውድቅ ተደርጓል' : 'Rejected',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      description: lang === 'am' ? 'አልጸደቀም፤ ምክንያቱን ለማንበብ ይጫኑ' : 'Not approved. Read reason provided.',
      actionText: lang === 'am' ? 'ምክንያት ተመልከት' : 'View Reason',
      actionClass: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700 font-semibold'
    };
  }
  return {
    badge: status || 'Pending',
    badgeClass: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600',
    description: lang === 'am' ? 'በሂደት ላይ' : 'Application processing.',
    actionText: lang === 'am' ? 'ዝርዝር ይመልከቱ' : 'View Details',
    actionClass: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
  };
}

// Helper to normalize phone number for Ethiopian display (e.g. 2519... -> 09...)
const toLocalEthiopianPhone = (phone) => {
  if (!phone) return '';
  const str = String(phone).trim();
  if (str.includes('@')) return ''; // never allow email in phone!
  if (str.startsWith('+251')) return '0' + str.substring(4);
  if (str.startsWith('251') && str.length === 12) return '0' + str.substring(3);
  return str;
};

export default function CustomerDashboard() {
  const { user, updateUser, changePassword, verifyEmail, resendVerification, sendPhoneOTP, verifyPhoneOTP } = useAuth();
  const { t, lang } = useApp();
  const { getActiveTickets } = useQueue();
  const { applications, getActiveApplications, getCompletedApplications } = useApplications();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [applyKey, setApplyKey] = useState(0);
  const [selectedApp, setSelectedApp] = useState(null);
  const firstName = user?.name?.split(' ')[0] || t.customer || (lang === 'am' ? 'ደንበኛ' : 'Customer');
  const activeQueueCount = getActiveTickets().length;
  
  // Get application counts
  const activeApplications = getActiveApplications().length;
  const completedApplications = getCompletedApplications().length;

  // ── Verification States ─────────────────────────────────────
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [emailVerifyCode, setEmailVerifyCode] = useState('');
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailVerifyMsg, setEmailVerifyMsg] = useState(null);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);

  // Phone OTP States
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpMsg, setPhoneOtpMsg] = useState(null);
  const [phoneOtpCooldown, setPhoneOtpCooldown] = useState(0);

  // ── Profile & Documents State ──────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: toLocalEthiopianPhone(user?.phone || user?.metadata?.phone || user?.metadata?.phone_verification?.phone || ''),
    dob: user?.metadata?.dob || '',
    address: user?.metadata?.address || ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Uploaded Documents State
  const defaultDocs = [
    {
      id: 'doc-national-id',
      name: 'National_ID.pdf',
      type: 'pdf',
      category: 'National ID',
      size: '245 KB',
      uploadedAt: '2026-10-12',
      status: 'Verified'
    },
    {
      id: 'doc-photo',
      name: 'Photo.jpg',
      type: 'image',
      category: 'Passport Photo',
      size: '1.2 MB',
      uploadedAt: '2026-10-14',
      status: 'Verified'
    },
    {
      id: 'doc-birth-cert',
      name: 'Birth_Certificate.pdf',
      type: 'pdf',
      category: 'Birth Certificate',
      size: '189 KB',
      uploadedAt: '2026-10-15',
      status: 'Verified'
    }
  ];

  const [documents, setDocuments] = useState(() => {
    if (Array.isArray(user?.metadata?.documents) && user.metadata.documents.length > 0) {
      return user.metadata.documents;
    }
    return defaultDocs;
  });

  // Sync profile & documents when user context updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: toLocalEthiopianPhone(user.phone || user.metadata?.phone || user.metadata?.phone_verification?.phone || ''),
        dob: user.metadata?.dob || '',
        address: user.metadata?.address || ''
      });
      if (Array.isArray(user.metadata?.documents) && user.metadata.documents.length > 0) {
        setDocuments(user.metadata.documents);
      }
    }
  }, [user]);

  // Document Modals State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('National ID');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFilePreview, setUploadFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState(null);

  // Profile Save Handler
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (profileForm.phone && profileForm.phone.includes('@')) {
      setProfileMsg({
        type: 'error',
        text: lang === 'am' ? 'እባክዎ በስልክ ቁጥር ቦታ ትክክለኛ ስልክ ቁጥር ያስገቡ' : 'Please enter a valid phone number, not an email address.'
      });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await updateUser(user.id, {
        name: profileForm.name,
        phone: profileForm.phone,
        metadata: {
          dob: profileForm.dob,
          address: profileForm.address,
          documents: documents
        }
      });
      if (res && res.success) {
        setProfileMsg({
          type: 'success',
          text: lang === 'am' ? 'የመገለጫ መረጃዎ በተሳካ ሁኔታ ተዘምኗል!' : 'Profile information updated successfully!'
        });
        setTimeout(() => setProfileMsg(null), 5000);
      } else {
        setProfileMsg({
          type: 'error',
          text: res?.message || (lang === 'am' ? 'መገለጫ ማዘመን አልተሳካም።' : 'Failed to update profile.')
        });
      }
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err?.response?.data?.message || err?.message || (lang === 'am' ? 'መገለጫ ማዘመን አልተሳካም።' : 'Failed to update profile.')
      });
    } finally {
      setProfileSaving(false);
    }
  };

  // Profile Cancel Handler
  const handleCancelProfile = () => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || user?.metadata?.phone || '',
      dob: user?.metadata?.dob || '',
      address: user?.metadata?.address || ''
    });
    setProfileMsg(null);
  };

  // ── Verification Handlers ──────────────────────────────────
  const handleVerifyEmail = async (e) => {
    if (e) e.preventDefault();
    if (!emailVerifyCode.trim()) {
      setEmailVerifyMsg({
        type: 'error',
        text: lang === 'am' ? 'እባክዎ ባለ 6-አሃዝ የማረጋገጫ ኮድ ያስገቡ' : 'Please enter the 6-digit verification code.'
      });
      return;
    }
    setEmailVerifyLoading(true);
    setEmailVerifyMsg(null);
    try {
      const res = await verifyEmail(user?.email, emailVerifyCode.trim());
      if (res.success) {
        setEmailVerifyMsg({
          type: 'success',
          text: res.message || (lang === 'am' ? 'ኢሜይል በተሳካ ሁኔታ ተረጋግጧል!' : 'Email verified successfully!')
        });
        setTimeout(() => {
          setIsVerifyEmailModalOpen(false);
          setEmailVerifyCode('');
          setEmailVerifyMsg(null);
          window.location.reload();
        }, 1500);
      } else {
        setEmailVerifyMsg({
          type: 'error',
          text: res.message || 'Verification failed. Please try again.'
        });
      }
    } catch (err) {
      setEmailVerifyMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Verification failed.'
      });
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const handleResendEmailVerification = async () => {
    if (emailResendCooldown > 0) return;
    setEmailVerifyLoading(true);
    setEmailVerifyMsg(null);
    try {
      const res = await resendVerification(user?.email);
      if (res.success) {
        setEmailVerifyMsg({
          type: 'success',
          text: res.message || 'A new verification code has been sent to your email.'
        });
        setEmailResendCooldown(60);
      } else {
        setEmailVerifyMsg({
          type: 'error',
          text: res.message || 'Failed to resend code.'
        });
      }
    } catch (err) {
      setEmailVerifyMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to resend code.'
      });
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  // Cooldown timer for email
  useEffect(() => {
    if (emailResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailResendCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailResendCooldown]);

  // Phone OTP Handlers
  const handleSendPhoneOTP = async () => {
    const rawPhone = (profileForm.phone || user?.phone || '').trim();
    if (!rawPhone) {
      setPhoneOtpMsg({
        type: 'error',
        text: lang === 'am' ? 'እባክዎ በመጀመሪያ ስልክ ቁጥር ያስገቡ' : 'Please enter a valid phone number first.'
      });
      return;
    }
    if (rawPhone.includes('@')) {
      setPhoneOtpMsg({
        type: 'error',
        text: lang === 'am'
          ? 'በስልክ ቁጥር ቦታ ኢሜይል ገብቷል። እባክዎ ትክክለኛ የኢትዮጵያ ሞባይል ስልክ ቁጥር ያስገቡ (ለምሳሌ፡ 09... ወይም 07...)'
          : 'An email address is entered in the phone field. Please enter a valid Ethiopian mobile number (e.g. 09... or 07...).'
      });
      return;
    }

    // Client-side Ethiopian mobile check
    const cleaned = rawPhone.replace(/[\s\-()]/g, '');
    const isEthPhone = /^(?:\+?251|0)?(?:9|7)\d{8}$/.test(cleaned);
    if (!isEthPhone) {
      setPhoneOtpMsg({
        type: 'error',
        text: lang === 'am'
          ? 'ትክክለኛ ያልሆነ የኢትዮጵያ ስልክ ቁጥር። እባክዎ ትክክለኛ የኢትዮ ቴሌኮም ወይም የሳፋሪኮም ቁጥር ያስገቡ (ለምሳሌ፡ 09... ወይም 07...)'
          : 'Invalid Ethiopian mobile phone number. Please enter a valid Ethio Telecom or Safaricom number (e.g., 09... or 07...).'
      });
      return;
    }

    setPhoneOtpLoading(true);
    setPhoneOtpMsg(null);
    try {
      const res = await sendPhoneOTP(rawPhone);
      if (res.success) {
        setPhoneOtpSent(true);
        setPhoneOtpMsg({
          type: 'success',
          text: res.message || 'Verification code sent to your phone via SMS.'
        });
        if (res.verificationCode) {
          setPhoneOtpCode(res.verificationCode);
        }
        setPhoneOtpCooldown(60);
      } else {
        setPhoneOtpMsg({
          type: 'error',
          text: res.message || 'Failed to send SMS OTP.'
        });
      }
    } catch (err) {
      setPhoneOtpMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to send SMS OTP.'
      });
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (e) => {
    if (e) e.preventDefault();
    if (!phoneOtpCode.trim()) {
      setPhoneOtpMsg({
        type: 'error',
        text: lang === 'am' ? 'እባክዎ ባለ 6-አሃዝ የማረጋገጫ ኮድ ያስገቡ' : 'Please enter the 6-digit OTP.'
      });
      return;
    }
    setPhoneOtpLoading(true);
    setPhoneOtpMsg(null);
    try {
      const res = await verifyPhoneOTP(phoneOtpCode.trim());
      if (res.success) {
        setPhoneOtpMsg({
          type: 'success',
          text: res.message || (lang === 'am' ? 'ስልክ ቁጥር በተሳካ ሁኔታ ተረጋግጧል!' : 'Phone verified successfully!')
        });
        setPhoneOtpSent(false);
        setPhoneOtpCode('');
      } else {
        setPhoneOtpMsg({
          type: 'error',
          text: res.message || 'Failed to verify phone OTP.'
        });
      }
    } catch (err) {
      setPhoneOtpMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to verify phone OTP.'
      });
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // Cooldown timer for phone
  useEffect(() => {
    if (phoneOtpCooldown <= 0) return;
    const timer = setInterval(() => {
      setPhoneOtpCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phoneOtpCooldown]);

  // Change Password Handler
  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    setPasswordMsg(null);
    if (!passwordForm.current) {
      setPasswordMsg({
        type: 'error',
        text: lang === 'am' ? 'እባክዎ አሁን ያለዎትን የይለፍ ቃል ያስገቡ።' : 'Please enter your current password.'
      });
      return;
    }
    if (!passwordForm.newPass || passwordForm.newPass.length < 8) {
      setPasswordMsg({
        type: 'error',
        text: lang === 'am' ? 'አዲሱ የይለፍ ቃል ቢያንስ 8 ፊደላት መሆን አለበት።' : 'New password must be at least 8 characters.'
      });
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMsg({
        type: 'error',
        text: lang === 'am' ? 'አዲሶቹ የይለፍ ቃሎች አይመሳሰሉም።' : 'New passwords do not match.'
      });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changePassword(passwordForm.current, passwordForm.newPass, passwordForm.confirm);
      if (res && res.success) {
        setPasswordMsg({
          type: 'success',
          text: lang === 'am' ? 'የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል!' : 'Password updated successfully!'
        });
        setPasswordForm({ current: '', newPass: '', confirm: '' });
        setTimeout(() => setPasswordMsg(null), 5000);
      } else {
        setPasswordMsg({
          type: 'error',
          text: res?.message || (lang === 'am' ? 'የይለፍ ቃል መቀየር አልተሳካም።' : 'Failed to change password.')
        });
      }
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err?.response?.data?.message || err?.message || (lang === 'am' ? 'የይለፍ ቃል መቀየር አልተሳካም።' : 'Failed to change password.')
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  // File Select Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(lang === 'am' ? 'የፋይሉ መጠን ከ 5MB መብለጥ የለበትም።' : 'File size cannot exceed 5MB.');
      return;
    }
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Document Upload Handler
  const handleUploadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!uploadFile) {
      setUploadError(lang === 'am' ? 'እባክዎ የሚሰቀል ፋይል ይምረጡ።' : 'Please select a file to upload.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const isImg = uploadFile.type.startsWith('image/');
      const newDoc = {
        id: 'doc-' + Date.now(),
        name: uploadFile.name,
        type: isImg ? 'image' : 'pdf',
        category: uploadCategory,
        size: uploadFile.size > 1024 * 1024 
          ? (uploadFile.size / (1024 * 1024)).toFixed(1) + ' MB'
          : Math.max(1, Math.round(uploadFile.size / 1024)) + ' KB',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'Under Review',
        dataUrl: uploadFilePreview
      };

      const updatedDocs = [newDoc, ...documents];
      setDocuments(updatedDocs);

      // Persist to user metadata
      await updateUser(user.id, {
        metadata: {
          documents: updatedDocs
        }
      });

      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadFilePreview(null);
      setUploadSuccessMsg(lang === 'am' ? 'ሰነዱ በተሳካ ሁኔታ ተሰቅሏል!' : 'Document uploaded and attached successfully!');
      setTimeout(() => setUploadSuccessMsg(null), 5000);
    } catch (err) {
      setUploadError(err?.message || (lang === 'am' ? 'ሰነድ መጫን አልተሳካም።' : 'Failed to upload document.'));
    } finally {
      setUploading(false);
    }
  };

  // Document Delete Handler
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm(lang === 'am' ? 'ይህንን ሰነድ ማስወገድ እርግጠኛ ነዎት?' : 'Are you sure you want to remove this document?')) {
      return;
    }
    const updatedDocs = documents.filter(d => d.id !== docId);
    setDocuments(updatedDocs);
    try {
      await updateUser(user.id, {
        metadata: {
          documents: updatedDocs
        }
      });
    } catch (err) {
      console.error('Failed to sync document removal:', err);
    }
  };

  const handleNavClick = (section) => {
    if (section === 'apply') {
      setApplyKey(k => k + 1);
    }
    setActiveSection(section);
  };

  const navLinks = [
    { label: t.my_dashboard, section: 'dashboard' },
    { label: t.my_applications, section: 'applications' },
    { label: t.my_feedback, section: 'feedback' },
    { label: t.my_queue, section: 'queue' },
    { label: t.apply_for_service, section: 'apply' },
    { label: t.announcements, section: 'announcements' },
    { label: t.profile_documents, section: 'profile' },
  ];

  return (
    <DashboardLayout
      title={t.my_account}
      onNavigate={handleNavClick}
      navLinks={navLinks.map(link => ({
        label: link.label,
        href: '#',
        active: activeSection === link.section,
        onClick: (e) => {
          e.preventDefault();
          handleNavClick(link.section);
        }
      }))}
      letter="C"
      subtitle={t.customer_portal || (lang === 'am' ? 'የደንበኛ መግቢያ' : 'Customer Portal')}
    >
      {/* My Dashboard Section */}
      {activeSection === 'dashboard' && (
        <div className="space-y-8">
          {/* A. Welcome Banner (Section 2.A) */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#2563eb] rounded-2xl p-6 sm:p-7 text-white shadow-sm border border-blue-900/40">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f4b51a] via-[#f59e0b] to-[#f4b51a]" />
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#f4b51a] border border-[#f4b51a]/30 text-xs font-semibold mb-3 backdrop-blur-xs">
                  <span>Hawassa MESOB Portal</span>
                  <span>•</span>
                  <span className="text-blue-100 font-normal">
                    {lang === 'am' ? 'የህዝብ አገልግሎቶች' : 'Public Services'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {t.welcome_back}, {firstName}!
                </h2>
                <p className="text-blue-100 text-sm sm:text-base mt-1.5 max-w-xl leading-relaxed">
                  {lang === 'am' 
                    ? 'አገልግሎቶችን ያመልክቱ፣ ማመልከቻዎችን ይከታተሉ እና የወረፋ ሁኔታዎን በአንድ ቦታ ያረጋግጡ።' 
                    : 'Apply for public services, track your applications, and check your queue status in one place.'}
                </p>
              </div>

              <div className="flex flex-col sm:items-end justify-center gap-2.5 sm:self-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-blue-100 backdrop-blur-xs">
                  {user?.emailVerified !== false ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-white">
                        {t.verified_account || (lang === 'am' ? 'የተረጋገጠ መለያ' : 'Verified Customer Account')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="font-semibold text-amber-200">
                        {lang === 'am' ? 'ኢሜይል ማረጋገጫ ይጠብቃል' : 'Email Verification Pending'}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{lang === 'am' ? 'ሃዋሳ፣ ሲዳማ' : 'Hawassa, Sidama'}</span>
                </div>
                <p className="text-xs text-blue-100 font-medium">
                  {lang === 'am' ? 'በቀላሉ ከታች ያሉትን ዋና ተግባራት ይምረጡ' : 'Select an action below to get started'}
                </p>
              </div>
            </div>
          </div>

          {/* Unverified Email Warning Banner */}
          {user?.emailVerified === false && (
            <div className="p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 dark:text-amber-100 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">⚠️</span>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-amber-900 dark:text-amber-100">
                    {lang === 'am' ? 'የኢሜይል ማረጋገጫ ያስፈልጋል' : 'Email Verification Required'}
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 mt-0.5">
                    {lang === 'am' 
                      ? 'የህዝብ አገልግሎቶችን ለማመልከት እና ወረፋ ለመያዝ እባክዎ ኢሜይልዎን ያረጋግጡ። የማረጋገጫ ኮድ ወደ ተመዘገበው Gmail ተልኳል።' 
                      : 'To submit public service applications and join queues, please verify your email address. A verification link and code was sent to your registered Gmail address.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsVerifyEmailModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {lang === 'am' ? 'አሁን አረጋግጥ' : 'Verify Email Now'}
                </button>
              </div>
            </div>
          )}

          {/* E. Active Queue Notification Banner (Section 2.E) */}
          {(() => {
            const activeTickets = getActiveTickets();
            const currentTicket = activeTickets.length > 0 ? activeTickets[0] : null;
            if (!currentTicket) return null;

            if (currentTicket.status === 'called') {
              return (
                <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl shadow-lg border-2 border-emerald-400 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0 shadow-xs">
                      📢
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                          {lang === 'am' ? 'የእርስዎ ተራ ደርሷል!' : "It's your turn!"}
                        </span>
                        <span className="text-xs text-emerald-100 font-mono">
                          Ticket #{currentTicket.token}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold mt-1 text-white">
                        {lang === 'am'
                          ? `እባክዎ ወዲያውኑ ወደ መስኮት ${currentTicket.counterNumber || currentTicket.counter || '1'} ይሂዱ`
                          : `Please go to Counter #${currentTicket.counterNumber || currentTicket.counter || '1'}`}
                      </h3>
                      <p className="text-emerald-100/90 text-xs mt-0.5">
                        {currentTicket.serviceName || 'Public Service Counter'} • {currentTicket.institutionName || 'MESOB Center'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('queue')}
                    className="px-5 py-2.5 bg-white text-emerald-800 rounded-xl font-bold text-xs hover:bg-emerald-50 transition cursor-pointer shrink-0 shadow-sm"
                  >
                    {lang === 'am' ? 'የወረፋ ማያ ይመልከቱ →' : 'View Queue Screen →'}
                  </button>
                </div>
              );
            }

            return (
              <div className="p-5 bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-transparent dark:from-amber-950/40 dark:via-blue-950/30 border border-amber-300 dark:border-amber-700/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                    🎫
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                        {lang === 'am' ? 'ንቁ የወረፋ ትኬት' : 'Active Queue Ticket'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        #{currentTicket.token}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentTicket.serviceName || (lang === 'am' ? 'የህዝብ አገልግሎት' : 'Public Service')}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {lang === 'am'
                        ? `ከእርስዎ በፊት ${currentTicket.peopleAhead || 0} ሰዎች አሉ። የተገመተ የጥበቃ ጊዜ: ${currentTicket.estimatedWaitMinutes ? `ወደ ${currentTicket.estimatedWaitMinutes} ደቂቃ` : 'ጥቂት ደቂቃዎች'}`
                        : `People ahead of you: ${currentTicket.peopleAhead || 0} • Estimated wait: ${currentTicket.estimatedWaitMinutes ? `About ${currentTicket.estimatedWaitMinutes} minutes` : 'A few minutes'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveSection('queue')}
                    className="px-4 py-2 bg-[#314ea1] hover:bg-[#253d82] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{lang === 'am' ? 'የወረፋዬን ሁኔታ ተመልከት' : 'Check My Queue'}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* B. Main Action Buttons (Section 2.B) */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {lang === 'am' ? 'ዋና ተግባራት' : 'What would you like to do?'}
              </h3>
              <span className="text-xs text-slate-400">
                {lang === 'am' ? 'ፈጣን አገልግሎቶች' : 'Quick Actions'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Apply for Service */}
              <button
                onClick={() => setActiveSection('apply')}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs hover:border-[#314ea1] dark:hover:border-blue-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#314ea1] dark:text-blue-300 flex items-center justify-center mb-3 group-hover:bg-[#314ea1] group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-[#314ea1] dark:group-hover:text-blue-400 transition-colors">
                    {lang === 'am' ? 'አገልግሎት ያመልክቱ' : 'Apply for a Service'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {lang === 'am' ? 'አዲስ የህዝብ አገልግሎት ማመልከቻ በቀላሉ ይጀምሩ' : 'Start a new service application'}
                  </p>
                </div>
                <span className="mt-3 text-xs font-bold text-[#314ea1] dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {lang === 'am' ? 'ማመልከቻ ጀምር' : 'Start Application'} →
                </span>
              </button>

              {/* 2. Check My Applications */}
              <button
                onClick={() => setActiveSection('applications')}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                    {lang === 'am' ? 'ማመልከቻዎቼን ይከታተሉ' : 'Check My Applications'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {lang === 'am' ? 'የገመገማ ሂደትን፣ የውሳኔ ሁኔታን እና ደረጃዎችን ይከታተሉ' : 'See progress of submitted applications'}
                  </p>
                </div>
                <span className="mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {lang === 'am' ? 'ሁኔታን ፈትሽ' : 'View Progress'} ({activeApplications}) →
                </span>
              </button>

              {/* 3. Check My Queue */}
              <button
                onClick={() => setActiveSection('queue')}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    {lang === 'am' ? 'የቀጥታ ወረፋዬን ይመልከቱ' : 'Check My Queue'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {lang === 'am' ? 'ትኬትዎን፣ ከፊትዎ ያሉ ሰዎችን እና የሚጠበቅ ጊዜ ይመልከቱ' : 'View ticket, people ahead & waiting time'}
                  </p>
                </div>
                <span className="mt-3 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {lang === 'am' ? 'ወረፋ ይክፈቱ' : 'Live Ticket Status'} →
                </span>
              </button>

              {/* 4. View My Feedback */}
              <button
                onClick={() => setActiveSection('feedback')}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs hover:border-violet-500 dark:hover:border-violet-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center mb-3 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                    {lang === 'am' ? 'የአገልግሎት ግብረመልስ' : 'View My Feedback'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {lang === 'am' ? 'የተጠናቀቁ አገልግሎቶችን ይገምግሙ ወይም አስተያየት ይስጡ' : 'Review or submit feedback when eligible'}
                  </p>
                </div>
                <span className="mt-3 text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {lang === 'am' ? 'ግብረመልስ ስጥ' : 'Rate & Review'} →
                </span>
              </button>
            </div>
          </div>

          {/* C. Summary Cards (Section 2.C) */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {lang === 'am' ? 'የአገልግሎት ሁኔታ ማጠቃለያ' : 'Summary of Your Account'}
              </h3>
              <span className="text-xs text-slate-400">
                {lang === 'am' ? 'ቅጽበታዊ ሁኔታ' : 'Live Counts'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Applications in Progress */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700 border-t-3 border-t-blue-500 shadow-xs hover:border-blue-400 transition-all relative overflow-hidden">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    {lang === 'am' ? 'በሂደት ላይ ያሉ' : 'Applications in Progress'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#314ea1] dark:text-blue-300 border border-blue-100 dark:border-blue-800 flex items-center justify-center">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#1e3a8a] dark:text-blue-400">{activeApplications}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>{lang === 'am' ? 'በማዘጋጃ ቤት ባለሙያዎች በግምገማ ላይ ያሉ' : 'Currently being processed or reviewed'}</span>
                </p>
              </div>

              {/* 2. Completed Services */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700 border-t-3 border-t-emerald-500 shadow-xs hover:border-emerald-400 transition-all relative overflow-hidden">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    {lang === 'am' ? 'የተጠናቀቁ አገልግሎቶች' : 'Completed Services'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{completedApplications}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{lang === 'am' ? 'በተሳካ ሁኔታ የተጠናቀቁ ማመልከቻዎች' : 'Confirmed as completed services'}</span>
                </p>
              </div>

              {/* 3. My Active Queue */}
              <button
                onClick={() => setActiveSection('queue')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700 border-t-3 border-t-amber-500 shadow-xs hover:border-amber-400 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {lang === 'am' ? 'የእኔ ንቁ ወረፋ' : 'My Active Queue'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400">{activeQueueCount}</p>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-1.5 flex items-center justify-between">
                  <span>
                    {activeQueueCount > 0 
                      ? (lang === 'am' ? `${activeQueueCount} ትኬት በመጠባበቅ ላይ` : `${activeQueueCount} ticket waiting`)
                      : (lang === 'am' ? 'አሁን ንቁ ወረፋ የለም' : 'No active queue entry')}
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </p>
              </button>

              {/* 4. Total Applications */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700 border-t-3 border-t-indigo-500 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all relative overflow-hidden">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    {lang === 'am' ? 'ጠቅላላ ማመልከቻዎች' : 'Total Applications'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{applications.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  <span>{lang === 'am' ? 'በዚህ መለያ የተደረጉ አጠቃላይ ጥያቄዎች' : 'All-time submitted applications'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* D. Application Tracking (Section 2.D) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'am' ? 'የቅርብ ጊዜ ማመልከቻዎች' : 'Track Recent Applications'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-[#1e3a8a] dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                  {applications.length}
                </span>
              </div>
              <button
                onClick={() => setActiveSection('applications')}
                className="text-xs sm:text-sm font-semibold text-[#2563eb] dark:text-blue-400 hover:underline flex items-center gap-1 group cursor-pointer"
              >
                <span>{lang === 'am' ? 'ሁሉንም ይመልከቱ' : 'View All Applications'}</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 border border-blue-100 dark:border-blue-800 flex items-center justify-center shadow-xs">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  {lang === 'am' ? 'እስካሁን የቀረበ ማመልከቻ የለም' : 'No applications submitted yet'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  {lang === 'am' 
                    ? 'ለማዘጋጃ ቤት አገልግሎቶች በመስመር ላይ ያመልክቱ እና እያንዳንዱን ደረጃ ይከታተሉ።' 
                    : 'Submit an application online and track each review step in real time without visiting in person.'}
                </p>
                <button
                  onClick={() => setActiveSection('apply')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{lang === 'am' ? 'አሁን አገልግሎት ያመልክቱ' : 'Apply for a Service Now'}</span>
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="data-table w-full">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-900/60 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-700">
                        <th className="px-5 py-3.5 text-left">{lang === 'am' ? 'የአገልግሎት ስም' : 'Service & Reference'}</th>
                        <th className="px-5 py-3.5 text-left">{lang === 'am' ? 'ተቋም' : 'Institution'}</th>
                        <th className="px-5 py-3.5 text-left">{lang === 'am' ? 'የቀረበበት ቀን' : 'Application Date'}</th>
                        <th className="px-5 py-3.5 text-left">{lang === 'am' ? 'የአሁኑ ሁኔታ' : 'Current Status'}</th>
                        <th className="px-5 py-3.5 text-right">{lang === 'am' ? 'ቀጣይ እርምጃ' : 'Next Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {applications.slice(0, 5).map(app => {
                        const displayService = lang === 'am' ? (app.serviceName_am || app.service_am || app.service) : app.service;
                        const displayInstitution = lang === 'am' ? (app.institutionName_am || app.institution_am || app.institution) : app.institution;
                        const statusInfo = getPlainLanguageStatusInfo(app.status, lang);
                        const cleanRef = app.id ? `#${String(app.id).replace(/-/g, '').slice(0, 8).toUpperCase()}` : '#APP-REF';

                        return (
                          <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                                {displayService}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/70 px-1.5 py-0.5 rounded" title={app.id}>
                                  {cleanRef}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 text-sm">
                              {displayInstitution}
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">
                              {app.submittedDate || 'Recent'}
                            </td>
                            <td className="px-5 py-3.5">
                              <div>
                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
                                  {statusInfo.badge}
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-tight">
                                  {statusInfo.description}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedApp(app.id);
                                  setActiveSection('applications');
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1 ${statusInfo.actionClass}`}
                              >
                                <span>{statusInfo.actionText}</span>
                                <span>→</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700 p-3 space-y-3">
                  {applications.slice(0, 5).map(app => {
                    const displayService = lang === 'am' ? (app.serviceName_am || app.service_am || app.service) : app.service;
                    const displayInstitution = lang === 'am' ? (app.institutionName_am || app.institution_am || app.institution) : app.institution;
                    const statusInfo = getPlainLanguageStatusInfo(app.status, lang);
                    const cleanRef = app.id ? `#${String(app.id).replace(/-/g, '').slice(0, 8).toUpperCase()}` : '#APP-REF';

                    return (
                      <div key={app.id} className="p-3 bg-slate-50/60 dark:bg-slate-700/30 rounded-xl space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {displayService}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {displayInstitution}
                            </p>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-200/80 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            {cleanRef}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
                              {statusInfo.badge}
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {statusInfo.description}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedApp(app.id);
                              setActiveSection('applications');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${statusInfo.actionClass}`}
                          >
                            {statusInfo.actionText}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* F. Helpful Guidance: How MESOB Works (Section 2.F) */}
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800 border border-blue-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-[#314ea1] dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                💡
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'am' ? 'የመሶብ የህዝብ አገልግሎቶች እንዴት ይሰራሉ?' : 'How Hawassa MESOB Services Work (3 Simple Steps)'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'am' ? 'ለደንበኞች የቀለለ እና ግልጽ የአገልግሎት አሰጣጥ' : 'Simple, transparent, and queue-free municipal public services'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-white dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-slate-700">
                <div className="font-bold text-[#314ea1] dark:text-blue-400 mb-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-[11px]">1</span>
                  <span>{lang === 'am' ? 'አገልግሎት ይምረጡ' : 'Choose a Service'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'am' 
                    ? 'ከመጀመርዎ በፊት አስፈላጊ መስፈርቶችን፣ ሰነዶችን እና የክፍያ መጠኖችን በቀላሉ ይመልከቱ።' 
                    : 'Browse official requirements, documents, and fees before applying.'}
                </p>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-slate-700">
                <div className="font-bold text-[#314ea1] dark:text-blue-400 mb-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-[11px]">2</span>
                  <span>{lang === 'am' ? 'በመስመር ላይ ይከታተሉ' : 'Track Online'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'am' 
                    ? 'የማመልከቻዎን ሁኔታ በማንኛውም ጊዜ ይከታተሉ፤ ባለሙያዎች ማብራሪያ ከጠየቁ ወዲያውኑ ያስገቡ።' 
                    : 'Check your application status anytime; staff will review and update each milestone live.'}
                </p>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-slate-700">
                <div className="font-bold text-[#314ea1] dark:text-blue-400 mb-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-[11px]">3</span>
                  <span>{lang === 'am' ? 'ተራዎ ሲደርስ ብቻ ይሂዱ' : 'Go to Counter When Called'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'am' 
                    ? 'በሰልፍ መቆም አያስፈልግም፤ ትኬትዎ ሲጠራ ወይም ሲጸድቅ በቀጥታ ወደ ተመደበው መስኮት ይሂዱ።' 
                    : 'No need to stand in long queues; receive a live ticket and proceed only when your counter is ready.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Applications Section */}
      {activeSection === 'applications' && (
        <MyApplicationsSection applications={applications} setActiveSection={setActiveSection} selectedApp={selectedApp} setSelectedApp={setSelectedApp} />
      )}

      {/* My Feedback Section */}
      {activeSection === 'feedback' && (
        <MyFeedbackSection />
      )}

      {/* My Queue Section */}
      {activeSection === 'queue' && (
        <QueueManagement />
      )}

      {/* Apply for Service Section */}
      {activeSection === 'apply' && (
        <ApplyForServiceSection key={applyKey} user={user} setActiveSection={setActiveSection} />
      )}

      {/* Announcements Section */}
      {activeSection === 'announcements' && (
        <CustomerAnnouncements />
      )}

      {/* Profile & Documents Section */}
      {activeSection === 'profile' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {t.profile_documents || (lang === 'am' ? 'መገለጫ እና ሰነዶች' : 'Profile & Documents')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {lang === 'am' ? 'የግል መረጃዎን እና የተሰቀሉ ሰነዶችን ያስተዳድሩ።' : 'Manage your personal information and uploaded documents.'}
            </p>
          </div>

          {/* Success toast for document upload */}
          {uploadSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{uploadSuccessMsg}</span>
              </div>
              <button onClick={() => setUploadSuccessMsg(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800">×</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information & Password Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#314ea1]" />
                    <span>{t.personal_information || (lang === 'am' ? 'የግል መረጃ' : 'Personal Information')}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
                    {lang === 'am' ? 'የተረጋገጠ መታወቂያ' : 'Verified ID'}
                  </span>
                </h3>

                {/* Profile Message Banner */}
                {profileMsg && (
                  <div className={`p-3.5 mb-4 rounded-xl border text-sm font-medium flex items-center justify-between ${
                    profileMsg.type === 'success' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {profileMsg.type === 'success' ? (
                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span>{profileMsg.text}</span>
                    </div>
                    <button onClick={() => setProfileMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-2">×</button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                        {t.full_name || (lang === 'am' ? 'ሙሉ ስም' : 'Full Name')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 dark:text-slate-100 text-sm transition"
                        placeholder="e.g. Abebe Bikila"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          {t.email || (lang === 'am' ? 'ኢሜይል' : 'Email')}
                        </label>
                        <div className="flex items-center gap-1.5">
                          {user?.emailVerified !== false ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                              <span>✓</span> {lang === 'am' ? 'የተረጋገጠ' : 'Verified'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsVerifyEmailModalOpen(true)}
                              className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full hover:bg-amber-100 transition cursor-pointer"
                            >
                              <span>⚠</span> {lang === 'am' ? 'አረጋግጥ' : 'Verify Now'}
                            </button>
                          )}
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            {lang === 'am' ? 'የማይቀየር' : 'Read-only'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed select-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          {t.phone || (lang === 'am' ? 'ስልክ ቁጥር' : 'Phone Number')}
                        </label>
                        {user?.phoneVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                            <span>✓</span> {lang === 'am' ? 'የተረጋገጠ' : 'Verified'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                            <span>⚠</span> {lang === 'am' ? 'ያልተረጋገጠ' : 'Unverified'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          name="customer_phone_number"
                          id="customer-phone-number"
                          autoComplete="off"
                          inputMode="tel"
                          value={profileForm.phone}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val.includes('@')) {
                              setPhoneOtpMsg({
                                type: 'error',
                                text: lang === 'am'
                                  ? 'በስልክ ቁጥር ቦታ ኢሜይል አይፈቀድም። እባክዎ ትክክለኛ የሞባይል ስልክ ቁጥር ያስገቡ (ለምሳሌ፡ 09... ወይም 07...)'
                                  : 'Email addresses are not allowed in the phone field. Please enter a valid Ethiopian mobile phone number (e.g. 09... or 07...).'
                              });
                              return;
                            }
                            val = val.replace(/[^\d+\s-]/g, '');
                            setProfileForm(f => ({ ...f, phone: val }));
                            if (phoneOtpMsg?.text?.includes('email') || phoneOtpMsg?.text?.includes('ኢሜይል')) {
                              setPhoneOtpMsg(null);
                            }
                          }}
                          placeholder="0911 234 567 or 0711 234 567"
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 dark:text-slate-100 text-sm transition"
                        />
                        {!user?.phoneVerified && (
                          <button
                            type="button"
                            onClick={handleSendPhoneOTP}
                            disabled={phoneOtpLoading || phoneOtpCooldown > 0}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {phoneOtpLoading ? 'Sending...' : phoneOtpCooldown > 0 ? `${phoneOtpCooldown}s` : (lang === 'am' ? 'በSMS አረጋግጥ' : 'Verify SMS')}
                          </button>
                        )}
                      </div>

                      {/* Phone OTP Verification Inline Form */}
                      {phoneOtpSent && !user?.phoneVerified && (
                        <div className="mt-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-slate-900/60 border border-blue-200/80 dark:border-slate-700 space-y-2">
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {lang === 'am' ? 'ባለ 6-አሃዝ የSMS ማረጋገጫ ኮድ ያስገቡ:' : 'Enter 6-digit SMS verification code:'}
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={phoneOtpCode}
                              onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-center tracking-widest text-sm font-bold text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyPhoneOTP}
                              disabled={phoneOtpLoading || phoneOtpCode.length < 6}
                              className="px-4 py-1.5 bg-[#1e3a8a] text-white rounded-lg text-xs font-bold hover:bg-[#172554] transition disabled:opacity-50 cursor-pointer"
                            >
                              {phoneOtpLoading ? 'Verifying...' : (lang === 'am' ? 'አረጋግጥ' : 'Verify')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Phone OTP Message Banner */}
                      {phoneOtpMsg && (
                        <p className={`text-xs mt-1.5 font-medium ${phoneOtpMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {phoneOtpMsg.text}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                        {t.date_of_birth || (lang === 'am' ? 'የትውልድ ቀን' : 'Date of Birth')}
                      </label>
                      <input
                        type="date"
                        value={profileForm.dob}
                        onChange={(e) => setProfileForm(f => ({ ...f, dob: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 dark:text-slate-100 text-sm transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      {t.address || (lang === 'am' ? 'አድራሻ' : 'Address')}
                    </label>
                    <textarea
                      rows="2"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(f => ({ ...f, address: e.target.value }))}
                      placeholder={lang === 'am' ? 'ሀዋሳ፣ ክፍለ ከተማ፣ ቀበሌ...' : 'Hawassa, Subcity, Kebele, House No...'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 dark:text-slate-100 text-sm transition"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2"
                    >
                      {profileSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>{lang === 'am' ? 'በመመዝገብ ላይ...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <span>{t.save_changes || (lang === 'am' ? 'ለውጦችን መዝግብ' : 'Save Changes')}</span>
                      )}
                    </button>
                    <button
                      onClick={handleCancelProfile}
                      disabled={profileSaving}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition text-sm font-medium cursor-pointer"
                    >
                      {t.cancel || (lang === 'am' ? 'ሰርዝ' : 'Cancel')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Change Password Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-6 shadow-xs">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f4b51a]" />
                  <span>{t.change_password || (lang === 'am' ? 'የይለፍ ቃል ቀይር' : 'Change Password')}</span>
                </h3>

                {/* Password Message Banner */}
                {passwordMsg && (
                  <div className={`p-3.5 mb-4 rounded-xl border text-sm font-medium flex items-center justify-between ${
                    passwordMsg.type === 'success' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {passwordMsg.type === 'success' ? (
                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span>{passwordMsg.text}</span>
                    </div>
                    <button onClick={() => setPasswordMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-2">×</button>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      {t.current_password || (lang === 'am' ? 'አሁን ያለው የይለፍ ቃል' : 'Current Password')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm(f => ({ ...f, current: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 dark:text-slate-100 text-sm transition"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                        {t.new_password || (lang === 'am' ? 'አዲስ የይለፍ ቃል' : 'New Password')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPass}
                        onChange={(e) => setPasswordForm(f => ({ ...f, newPass: e.target.value }))}
                        placeholder={lang === 'am' ? 'ቢያንስ 8 ፊደላት' : 'Min. 8 characters'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 dark:text-slate-100 text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                        {t.confirm_password || (lang === 'am' ? 'አዲሱን የይለፍ ቃል ያረጋግጡ' : 'Confirm New Password')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
                        placeholder={lang === 'am' ? 'አዲሱን ይለፍ ቃል ይድገሙ' : 'Repeat new password'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 dark:text-slate-100 text-sm transition"
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={passwordSaving}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2"
                    >
                      {passwordSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>{lang === 'am' ? 'በማዘመን ላይ...' : 'Updating Password...'}</span>
                        </>
                      ) : (
                        <span>{lang === 'am' ? 'የይለፍ ቃል አዘምን' : 'Update Password'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Documents & Stats Column */}
            <div className="space-y-6">
              {/* Uploaded Documents Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#314ea1]" />
                    <span>{lang === 'am' ? 'የተሰቀሉ ሰነዶች' : 'Uploaded Documents'}</span>
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#314ea1] dark:text-blue-300">
                    {documents.length} {lang === 'am' ? 'ሰነዶች' : 'files'}
                  </span>
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {lang === 'am' ? 'ምንም የተሰቀለ ሰነድ የለም' : 'No documents uploaded yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => {
                      const isPdf = doc.type === 'pdf' || (doc.name && doc.name.toLowerCase().endsWith('.pdf'));
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-700/40 border border-slate-200/70 dark:border-slate-700 rounded-xl transition hover:border-[#314ea1]/40 hover:bg-slate-100/70 dark:hover:bg-slate-700/70"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                            isPdf
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-[#314ea1] dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}>
                            {isPdf ? 'PDF' : 'IMG'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={doc.name}>
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>{doc.size || '150 KB'}</span>
                              <span>•</span>
                              <span className="truncate">{doc.category || (isPdf ? 'Document' : 'Photo')}</span>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{doc.status || 'Verified'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 text-xs font-semibold text-[#314ea1] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition cursor-pointer"
                              title="View Document"
                            >
                              {lang === 'am' ? 'ይመልከቱ' : 'View'}
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="Remove Document"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsUploadModalOpen(true);
                    setUploadError(null);
                  }}
                  className="w-full mt-4 px-4 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:border-[#314ea1] hover:text-[#314ea1] dark:hover:border-blue-400 dark:hover:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition text-sm font-semibold cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-[#314ea1] dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{lang === 'am' ? '+ አዲስ ሰነድ ይስቀሉ' : '+ Upload New Document'}</span>
                </button>
              </div>

              {/* Account Stats */}
              <div className="bg-gradient-to-br from-[#172554] via-[#1e3a8a] to-[#314ea1] rounded-2xl p-6 text-white shadow-xs relative overflow-hidden border border-[#1e3a8a]/40">
                {/* Signature gold accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f4b51a] via-[#f59e0b] to-[#f4b51a]" />
                
                <div className="flex items-center gap-3.5 mb-4 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#f4b51a] shadow-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-wide">
                      {lang === 'am' ? 'የመለያ ሁኔታ' : 'Account Status'}
                    </p>
                    <p className="text-lg font-bold text-white">
                      {t.active_customer_account || (lang === 'am' ? 'ንቁ የደንበኛ መለያ' : 'Active Customer Account')}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100/90 text-xs">
                      {t.registration_status || (lang === 'am' ? 'የምዝገባ ሁኔታ:' : 'Registration:')}
                    </span>
                    <span className="font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md text-xs border border-emerald-400/30">
                      {t.verified || (lang === 'am' ? 'የተረጋገጠ' : 'Verified')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100/90 text-xs">
                      {t.total_applications || (lang === 'am' ? 'ጠቅላላ ማመልከቻዎች:' : 'Total Applications:')}
                    </span>
                    <span className="font-bold text-white text-xs">{applications.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100/90 text-xs">
                      {t.completed_apps || (lang === 'am' ? 'የተጠናቀቁ:' : 'Completed:')}
                    </span>
                    <span className="font-bold text-emerald-300 text-xs">{completedApplications}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Document Preview Modal ────────────────────────────── */}
          {previewDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                      previewDoc.type === 'pdf' || previewDoc.name?.endsWith('.pdf')
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-blue-100 text-[#314ea1] dark:bg-blue-950/60 dark:text-blue-300'
                    }`}>
                      {previewDoc.type === 'pdf' || previewDoc.name?.endsWith('.pdf') ? 'PDF' : 'IMG'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                        {previewDoc.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {previewDoc.category || 'Official Document'} • {previewDoc.size || 'Standard'} • {previewDoc.uploadedAt || 'Uploaded'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body / Viewer */}
                <div className="p-6 overflow-y-auto flex-1">
                  {previewDoc.dataUrl ? (
                    previewDoc.type === 'image' || (!previewDoc.name?.endsWith('.pdf') && previewDoc.dataUrl.startsWith('data:image')) ? (
                      <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/70 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <img
                          src={previewDoc.dataUrl}
                          alt={previewDoc.name}
                          className="max-h-[50vh] rounded-lg shadow-sm object-contain"
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <iframe
                          src={previewDoc.dataUrl}
                          title={previewDoc.name}
                          className="w-full h-[50vh]"
                        />
                      </div>
                    )
                  ) : (
                    /* Official Government Document Simulated Viewer */
                    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-inner">
                      {/* Ethiopian Government / MESOB Ribbon */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-[#f4b51a] font-black flex items-center justify-center text-base border border-amber-400/40 shadow-sm">
                            M
                          </div>
                          <div>
                            <p className="text-xs uppercase font-bold tracking-wider text-[#314ea1] dark:text-blue-400">
                              Hawassa City Administration
                            </p>
                            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                              MESOB Public Service Information Center
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 rounded-full border border-emerald-300 dark:border-emerald-700">
                          ✓ {previewDoc.status || 'VERIFIED ARCHIVE'}
                        </span>
                      </div>

                      {/* Document Details Grid */}
                      <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-400 block mb-1 uppercase font-semibold">Document Title</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{previewDoc.name}</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-400 block mb-1 uppercase font-semibold">Category</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{previewDoc.category || 'General'}</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-400 block mb-1 uppercase font-semibold">Record Holder</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{user?.name || 'Customer'}</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-400 block mb-1 uppercase font-semibold">Security Hash / Ref</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">HAW-MESOB-{previewDoc.id.toUpperCase().slice(-8)}</span>
                        </div>
                      </div>

                      {/* Official Verification Watermark Stamp */}
                      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#314ea1] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          ✓
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-[#1e3a8a] dark:text-blue-300">
                            Officially Authenticated Electronic Record
                          </p>
                          <p className="text-slate-600 dark:text-slate-400">
                            This document has been verified against the Hawassa MESOB customer database and is valid for all municipal public service applications.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (previewDoc.dataUrl) {
                          const a = document.createElement('a');
                          a.href = previewDoc.dataUrl;
                          a.download = previewDoc.name;
                          a.click();
                        } else {
                          const blob = new Blob([
                            `Hawassa MESOB Public Service System\nDocument: ${previewDoc.name}\nCategory: ${previewDoc.category}\nHolder: ${user?.name}\nStatus: Verified`
                          ], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = previewDoc.name + '.txt';
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      }}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>{lang === 'am' ? 'አውርድ' : 'Download'}</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>{lang === 'am' ? 'አትም' : 'Print'}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="px-5 py-2 bg-[#314ea1] hover:bg-[#253d82] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    {lang === 'am' ? 'ዝጋ' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Upload New Document Modal ────────────────────────────── */}
          {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {lang === 'am' ? 'አዲስ ሰነድ ይስቀሉ' : 'Upload New Document'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'am' ? 'ሰነድዎን ከመገለጫዎ ጋር ያያይዙ' : 'Attach supporting documents to your customer profile.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setUploadFile(null);
                      setUploadFilePreview(null);
                      setUploadError(null);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    ✕
                  </button>
                </div>

                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      {lang === 'am' ? 'የሰነድ ዓይነት' : 'Document Category'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none"
                    >
                      <option value="National ID">National ID / Kebele ID</option>
                      <option value="Passport Photo">Passport Photo</option>
                      <option value="Birth Certificate">Birth Certificate</option>
                      <option value="Proof of Residence">Proof of Residence</option>
                      <option value="Educational Certificate">Educational Certificate</option>
                      <option value="Power of Attorney">Power of Attorney</option>
                      <option value="Other Document">Other Document</option>
                    </select>
                  </div>

                  {/* File Dropzone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      {lang === 'am' ? 'ፋይል ይምረጡ' : 'Select File'} <span className="text-rose-500">*</span>
                    </label>
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[#314ea1] dark:hover:border-blue-400 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/30 transition text-center group">
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {uploadFile ? (
                        <div className="space-y-1">
                          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            ✓
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                            {uploadFile.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {(uploadFile.size / 1024).toFixed(0)} KB • {lang === 'am' ? 'ለመቀየር ይጫኑ' : 'Click to change file'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <svg className="w-8 h-8 mx-auto text-slate-400 group-hover:text-[#314ea1] transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {lang === 'am' ? 'ፋይል ለመምረጥ እዚህ ይጫኑ' : 'Click to choose file or drag & drop'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            PDF, PNG, JPG (Max 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setUploadFile(null);
                      setUploadFilePreview(null);
                      setUploadError(null);
                    }}
                    disabled={uploading}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer"
                  >
                    {lang === 'am' ? 'ሰርዝ' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleUploadSubmit}
                    disabled={uploading || !uploadFile}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>{lang === 'am' ? 'በመጫን ላይ...' : 'Uploading & Saving...'}</span>
                      </>
                    ) : (
                      <span>{lang === 'am' ? 'ሰነድ ጫን' : 'Upload Document'}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email Verification Modal */}
      {isVerifyEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#314ea1] via-[#1e3a8a] to-[#f4b51a]" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1e3a8a] flex items-center justify-center font-bold text-base">
                    ✉️
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {lang === 'am' ? 'የኢሜይል ማረጋገጫ' : 'Verify Your Email'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVerifyEmailModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                {lang === 'am'
                  ? 'ባለ 6-አሃዝ የማረጋገጫ ኮድ ወደ ተመዘገበው Gmail ተልኳል። እባክዎ ኮዱን ከታች ያስገቡ።'
                  : 'A 6-digit verification code was sent to your registered Gmail address. Enter it below to activate all customer services.'}
              </p>

              {emailVerifyMsg && (
                <div className={`p-3 rounded-xl mb-4 text-xs font-semibold ${
                  emailVerifyMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
                }`}>
                  {emailVerifyMsg.text}
                </div>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    {lang === 'am' ? 'የማረጋገጫ ኮድ (6 አሃዞች)' : '6-Digit Verification Code'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailVerifyCode}
                    onChange={(e) => setEmailVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-center tracking-widest text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResendEmailVerification}
                    disabled={emailVerifyLoading || emailResendCooldown > 0}
                    className="text-xs font-semibold text-[#314ea1] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {emailResendCooldown > 0
                      ? `Resend in ${emailResendCooldown}s`
                      : (lang === 'am' ? 'አዲስ ኮድ ላክ' : 'Resend Code')}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsVerifyEmailModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      {lang === 'am' ? 'ዝጋ' : 'Close'}
                    </button>
                    <button
                      type="submit"
                      disabled={emailVerifyLoading || emailVerifyCode.length < 6}
                      className="px-5 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:from-[#253d82] hover:to-[#172554] transition shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {emailVerifyLoading ? (lang === 'am' ? 'በማረጋገጥ ላይ...' : 'Verifying...') : (lang === 'am' ? 'አረጋግጥ' : 'Verify')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── My Applications Section Component ───────────────────────────
function MyApplicationsSection({ applications, setActiveSection, selectedApp: externalSelectedApp, setSelectedApp: externalSetSelectedApp }) {
  const { t, lang, getStatusLabel, getStaffNotes } = useApp();
  const { resubmitApplication } = useApplications();
  const [internalSelectedApp, setInternalSelectedApp] = useState(null);
  const selectedApp = externalSelectedApp !== undefined ? externalSelectedApp : internalSelectedApp;
  const setSelectedApp = externalSetSelectedApp !== undefined ? externalSetSelectedApp : setInternalSelectedApp;
  const [statusFilter, setStatusFilter] = useState('All');
  const [resubmitting, setResubmitting] = useState(false);

  const handleResubmit = async (app) => {
    const docName = window.prompt(
      lang === 'am' ? 'እባክዎ የተስተካከለውን ሰነድ ስም ወይም ፋይል መግለጫ ያስገቡ:' : 'Enter corrected document name or description (e.g. National_ID_Corrected.pdf):',
      'Corrected_Document.pdf'
    );
    if (!docName || !docName.trim()) return;

    const notes = window.prompt(
      lang === 'am' ? 'ተጨማሪ ማብራሪያ (አማራጭ):' : 'Additional resubmission note (optional):',
      'Corrected documents uploaded by customer'
    ) || '';

    setResubmitting(true);
    try {
      const result = await resubmitApplication(
        app.id,
        [{ name: docName.trim(), fileName: docName.trim(), uploadedAt: new Date().toISOString() }],
        notes.trim()
      );
      if (result.success) {
        alert(lang === 'am' ? 'ማመልከቻዎ በተሳካ ሁኔታ እንደገና ቀርቧል!' : 'Application resubmitted successfully!');
      } else {
        alert(result.message || 'Failed to resubmit application');
      }
    } catch (err) {
      console.error('Resubmit error:', err);
      alert('An error occurred during resubmission');
    } finally {
      setResubmitting(false);
    }
  };

  const filteredApps = statusFilter === 'All' 
    ? applications 
    : applications.filter(app => {
        if (statusFilter === 'All') return true;
        const normStatus = String(app.status).toUpperCase();
        if (statusFilter === 'Submitted') return normStatus.includes('SUBMIT');
        if (statusFilter === 'Under Review') return normStatus.includes('REVIEW');
        if (statusFilter === 'Approved') return normStatus.includes('APPROV') || normStatus.includes('ACKNOW');
        if (statusFilter === 'Completed') return normStatus.includes('COMPLET');
        if (statusFilter === 'Rejected') return normStatus.includes('REJECT');
        return app.status === statusFilter;
      });

  const filterOptions = [
    { key: 'All', label: t.all || (lang === 'am' ? 'ሁሉም' : 'All') },
    { key: 'Submitted', label: t.status_submitted || (lang === 'am' ? 'ቀርቧል' : 'Submitted') },
    { key: 'Under Review', label: t.status_under_review || (lang === 'am' ? 'በግምገማ ላይ' : 'Under Review') },
    { key: 'Approved', label: t.status_approved || (lang === 'am' ? 'ጸድቋል' : 'Approved') },
    { key: 'Completed', label: t.status_completed || (lang === 'am' ? 'ተጠናቋል' : 'Completed') },
    { key: 'Rejected', label: t.status_rejected || (lang === 'am' ? 'ውድቅ ተደርጓል' : 'Rejected') },
  ];

  // Application detail view
  if (selectedApp) {
    const app = applications.find(a => a.id === selectedApp);
    if (!app) {
      setSelectedApp(null);
      return null;
    }

    const displayService = lang === 'am' ? (app.serviceName_am || app.service_am || app.service) : app.service;
    const displayInstitution = lang === 'am' ? (app.institutionName_am || app.institution_am || app.institution) : app.institution;
    const isNeedsInfo = String(app.status).toUpperCase().includes('NEED') || String(app.status).toUpperCase().includes('PENDING_DOC');
    const isRejected = String(app.status).toUpperCase().includes('REJECT');

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedApp(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t.back_to_applications || (lang === 'am' ? 'ወደ ማመልከቻዎች ተመለስ' : 'Back to Applications')}
          </button>
        </div>

        {/* Missing Documents Warning Banner */}
        {isNeedsInfo && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-50 border-l-4 border-amber-500 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="text-2xl mt-0.5">⚠️</div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900 mb-1">
                  {t.status_needs_information || (lang === 'am' ? 'ተጨማሪ መረጃ ያስፈልጋል' : 'Needs Information')}
                </h4>
                <p className="text-sm text-amber-800 leading-relaxed font-medium">
                  {app.reviewNotes || app.notes || t.missing_docs_warning}
                </p>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleResubmit(app)}
                    disabled={resubmitting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    {resubmitting ? (lang === 'am' ? 'በማስገባት ላይ...' : 'Submitting...') : (lang === 'am' ? 'የተስተካከለ ሰነድ አስገባ' : 'Upload Required Documents')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Decision Banner */}
        {isRejected && (
          <div className="mb-6 p-5 rounded-2xl bg-rose-50 border-l-4 border-rose-500 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="text-2xl mt-0.5">🛑</div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-900 mb-1">
                  {lang === 'am' ? 'ማመልከቻው ውድቅ ተደርጓል' : 'Application Decision: Rejected'}
                </h4>
                <p className="text-sm text-rose-800 leading-relaxed font-medium">
                  <strong>{lang === 'am' ? 'ምክንያት:' : 'Reason:'}</strong> {app.reviewNotes || app.notes || app.rejectionReason || 'Application rejected by reviewing staff.'}
                </p>
                <p className="text-xs text-rose-700 mt-2">
                  {lang === 'am'
                    ? 'ውድቅ የተደረገ ማመልከቻ እንደ ተጠናቀቀ አይቆጠርም። ሰነዶችን አስተካክለው እንደገና ማስገባት ወይም አዲስ ማመልከቻ መጀመር ይችላሉ።'
                    : 'A rejected application does not count as completed. You may correct your documents and resubmit, or submit a replacement application.'}
                </p>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleResubmit(app)}
                    disabled={resubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    {resubmitting ? (lang === 'am' ? 'በማስገባት ላይ...' : 'Submitting...') : (t.resubmit_application || (lang === 'am' ? 'ማመልከቻውን እንደገና አስገባ' : 'Resubmit Application'))}
                  </button>
                  <button
                    onClick={() => setActiveSection('apply')}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    {lang === 'am' ? 'አዲስ ምትክ ማመልከቻ ጀምር' : 'New Replacement Application'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/80">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{displayService}</h2>
                <p className="text-sm text-slate-600">{displayInstitution}</p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                String(app.status).toUpperCase().includes('SUBMIT') ? 'bg-blue-50 text-[#1e3a8a] border-blue-200' :
                String(app.status).toUpperCase().includes('REVIEW') ? 'bg-amber-50 text-amber-800 border-amber-200' :
                String(app.status).toUpperCase().includes('NEED') ? 'bg-orange-50 text-orange-800 border-orange-200' :
                String(app.status).toUpperCase().includes('APPROV') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                String(app.status).toUpperCase().includes('COMPLET') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {getStatusLabel(app.status)}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {t.app_number_col || (lang === 'am' ? 'የማመልከቻ መለያ' : 'Application ID')}
                </p>
                <p className="font-semibold text-slate-900 font-mono text-sm">{app.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {t.reference_number || (lang === 'am' ? 'የማመልከቻ ቁጥር' : 'Reference Number')}
                </p>
                <p className="font-semibold text-[#1e3a8a] font-mono text-sm">{app.referenceNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {t.submitted_date || (lang === 'am' ? 'የቀረበበት ቀን' : 'Submitted Date')}
                </p>
                <p className="font-medium text-slate-800 text-sm">{app.submittedDate}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {t.last_updated || (lang === 'am' ? 'የመጨረሻ ማሻሻያ' : 'Last Updated')}
                </p>
                <p className="font-medium text-slate-800 text-sm">{app.lastUpdated}</p>
              </div>
            </div>

            {/* Staff Review Notes (Bilingual / Explicit handling) */}
            {(app.notes || app.rejectionReason || app.reviewNotes || app.feedback) && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>{t.staff_review_notes || (lang === 'am' ? 'የሰራተኛ ግምገማ ማስታወሻዎች' : 'Staff Review Notes')}</span>
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed font-mono">
                  {getStaffNotes(app.notes || app.rejectionReason || app.reviewNotes || app.feedback)}
                </div>
              </div>
            )}

            {app.applicantDetails && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-4 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#314ea1]" />
                  <span>{t.applicant_details || (lang === 'am' ? 'የአመልካች ዝርዝር መረጃ' : 'Applicant Details')}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t.full_name || (lang === 'am' ? 'ሙሉ ስም' : 'Full Name')}</p>
                    <p className="font-medium text-slate-900 text-sm">{app.applicantDetails.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t.email || (lang === 'am' ? 'ኢሜይል' : 'Email')}</p>
                    <p className="font-medium text-slate-900 text-sm">{app.applicantDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t.phone || (lang === 'am' ? 'ስልክ ቁጥር' : 'Phone')}</p>
                    <p className="font-medium text-slate-900 text-sm">{app.applicantDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t.address || (lang === 'am' ? 'አድራሻ' : 'Address')}</p>
                    <p className="font-medium text-slate-900 text-sm">{app.applicantDetails.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {app.additionalInfo && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f4b51a]" />
                  <span>{t.additional_information || (lang === 'am' ? 'ተጨማሪ መረጃ' : 'Additional Information')}</span>
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">{app.additionalInfo}</p>
              </div>
            )}

            {/* Feedback Rating Section - Only show for completed applications with valid IDs */}
            {String(app.status).toUpperCase().includes('COMPLET') && app.institutionId && app.serviceId && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-4 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{t.rate_this_service || (lang === 'am' ? 'ይህንን አገልግሎት ይገምግሙ' : 'Rate This Service')}</span>
                </h3>
                <FeedbackRating
                  applicationId={app.id}
                  institutionId={app.institutionId}
                  serviceId={app.serviceId}
                  institutionName={displayInstitution}
                  serviceName={displayService}
                />
              </div>
            )}
            
            {/* Show info message for completed applications without valid IDs */}
            {String(app.status).toUpperCase().includes('COMPLET') && (!app.institutionId || !app.serviceId) && (
              <div className="border-t border-slate-100 pt-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
                  <p className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {t.feedback_not_available || (lang === 'am' 
                        ? 'ለዚህ ማመልከቻ የአገልግሎት መረጃ ስለጎደለ ግምገማ መስጠት አይቻልም።' 
                        : 'Feedback is not available for this application as it is missing service information.')}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Applications list view
  return (
    <>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {t.my_applications || (lang === 'am' ? 'ማመልከቻዎቼ' : 'My Applications')}
          </h2>
          <p className="text-sm text-slate-500">
            {t.track_manage_applications || (lang === 'am' ? 'የአገልግሎት ማመልከቻዎችዎን ይከታተሉ እና ያስተዳድሩ' : 'Track and manage your service applications')}
          </p>
        </div>
        <button
          onClick={() => setActiveSection('apply')}
          className="px-5 py-2.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition text-sm font-semibold flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {t.new_application || (lang === 'am' ? 'አዲስ ማመልከቻ' : 'New Application')}
        </button>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 mb-6 flex gap-2 flex-wrap shadow-xs">
        {filterOptions.map(opt => {
          const count = opt.key === 'All' 
            ? applications.length 
            : applications.filter(a => {
                const norm = String(a.status).toUpperCase();
                if (opt.key === 'Submitted') return norm.includes('SUBMIT');
                if (opt.key === 'Under Review') return norm.includes('REVIEW');
                if (opt.key === 'Approved') return norm.includes('APPROV') || norm.includes('ACKNOW');
                if (opt.key === 'Completed') return norm.includes('COMPLET');
                if (opt.key === 'Rejected') return norm.includes('REJECT');
                return a.status === opt.key;
              }).length;

          return (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                statusFilter === opt.key
                  ? 'bg-[#314ea1] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
              }`}
            >
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="table-container border-0 rounded-none overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200/80">
                <th className="px-5 py-3 text-left">{t.app_number_col || 'Application ID'}</th>
                <th className="px-5 py-3 text-left">{t.service_col || 'Service'}</th>
                <th className="px-5 py-3 text-left">{t.institution_col || 'Institution'}</th>
                <th className="px-5 py-3 text-left">{t.status_col || 'Status'}</th>
                <th className="px-5 py-3 text-left">{t.submitted_col || 'Submitted'}</th>
                <th className="px-5 py-3 text-left">{t.last_updated || 'Last Updated'}</th>
                <th className="px-5 py-3 text-left">{t.actions_col || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-12 px-4">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 text-[#314ea1] border border-blue-100 flex items-center justify-center">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">
                      {lang === 'am' ? 'ምንም ማመልከቻዎች አልተገኙም' : 'No applications found'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {statusFilter === 'All' 
                        ? (lang === 'am' ? 'የመጀመሪያ ማመልከቻዎን ለማስገባት "አዲስ ማመልከቻ" የሚለውን ይጫኑ' : 'Click "New Application" to submit your first application')
                        : (lang === 'am' ? 'በዚህ ሁኔታ ውስጥ ምንም ማመልከቻ የለም' : `No applications with this status`)
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => {
                  const displayService = lang === 'am' ? (app.serviceName_am || app.service_am || app.service) : app.service;
                  const displayInstitution = lang === 'am' ? (app.institutionName_am || app.institution_am || app.institution) : app.institution;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 text-sm font-mono">{app.id}</td>
                      <td className="px-5 py-3.5 text-slate-800 text-sm font-medium">{displayService}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-sm">{displayInstitution}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          String(app.status).toUpperCase().includes('SUBMIT') ? 'bg-blue-50 text-[#1e3a8a] border-blue-200' :
                          String(app.status).toUpperCase().includes('REVIEW') ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          String(app.status).toUpperCase().includes('NEED') ? 'bg-orange-50 text-orange-800 border-orange-200' :
                          String(app.status).toUpperCase().includes('APPROV') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          String(app.status).toUpperCase().includes('COMPLET') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {getStatusLabel(app.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">{app.submittedDate}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">{app.lastUpdated}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setSelectedApp(app.id)}
                          className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold cursor-pointer"
                        >
                          {lang === 'am' ? 'ዝርዝር ይመልከቱ' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Apply for Service Section Component ──────────────────────────
function ApplyForServiceSection({ user, setActiveSection }) {
  const { t, lang, getStatusLabel } = useApp();
  const { createApplication } = useApplications();
  const { institutions, getServicesByInstitution, loading: servicesLoading } = useServices();
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    additionalInfo: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deduplicate institutions to avoid repeated items
  const uniqueInstitutions = useMemo(() => {
    const seen = new Set();
    return institutions.filter(inst => {
      if (!inst?.id || seen.has(inst.id)) return false;
      seen.add(inst.id);
      return true;
    });
  }, [institutions]);

  // Filter institutions based on search query
  const filteredInstitutions = useMemo(() => {
    if (!searchQuery.trim()) return uniqueInstitutions;
    
    const q = searchQuery.toLowerCase();
    return uniqueInstitutions.filter(inst => {
      const instServices = getServicesByInstitution(inst.id);
      return (
        inst.name_en?.toLowerCase().includes(q) ||
        inst.name_am?.toLowerCase().includes(q) ||
        instServices.some(s => 
          s.name?.toLowerCase().includes(q) || 
          s.name_am?.toLowerCase().includes(q)
        )
      );
    });
  }, [uniqueInstitutions, searchQuery, getServicesByInstitution]);

  // Services list view (after institution selected)
  const institutionServices = useMemo(() => {
    if (!selectedInstitution?.id) return [];
    const rawServices = getServicesByInstitution(selectedInstitution.id);
    const seen = new Set();
    return rawServices.filter(svc => {
      if (!svc?.id || seen.has(svc.id)) return false;
      seen.add(svc.id);
      return true;
    });
  }, [selectedInstitution, getServicesByInstitution]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = lang === 'am' ? 'ሙሉ ስም ያስፈልጋል' : 'Full name is required';
    }
    if (!formData.email.trim()) {
      errors.email = lang === 'am' ? 'ኢሜይል ያስፈልጋል' : 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = lang === 'am' ? 'እባክዎ ልክ ያለ ኢሜይል ያስገቡ' : 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      errors.phone = lang === 'am' ? 'ስልክ ቁጥር ያስፈልጋል' : 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const applicationData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        additionalInfo: formData.additionalInfo,
        serviceName: selectedService.name || selectedService.title_en || 'Service',
        institutionName: selectedInstitution.name_en || selectedInstitution.name || 'Institution',
        serviceDetails: {
          time: selectedService.processing_time,
          fee: selectedService.fee_amount,
          requiredDocs: []
        }
      };

      const result = await createApplication(
        selectedService.id,
        selectedInstitution.id, 
        applicationData, 
        []
      );
      
      if (result.success) {
        setSubmissionSuccess(result.application);
        setShowApplicationForm(false);
        setFormData({
          fullName: user?.name || '',
          email: user?.email || '',
          phone: '',
          address: '',
          additionalInfo: ''
        });
      } else if (result.isDuplicate && result.existingApplication) {
        const refNum = result.existingApplication.applicationNumber || result.existingApplication.referenceNumber;
        const status = result.existingApplication.status;
        alert(
          lang === 'am'
            ? `ለዚህ አገልግሎት ንቁ ወይም የተጠናቀቀ ማመልከቻ ቀድሞውኑ አለዎት (መለያ: ${refNum}፣ ሁኔታ: ${status})። ተደጋጋሚ ምዝገባ አይፈቀድም።`
            : `An active or completed registration already exists for this service (Reference: ${refNum}, Status: ${status}). Duplicate registrations are not permitted.`
        );
      } else {
        alert(result.message || (lang === 'am' ? 'ማመልከቻውን ማስገባት አልተሳካም። እባክዎ እንደገና ይሞክሩ።' : 'Failed to submit application. Please try again.'));
      }

    } catch (err) {
      console.error('Failed to submit application:', err);
      alert(lang === 'am' ? 'ማመልከቻውን ማስገባት አልተሳካም። እባክዎ እንደገና ይሞክሩ።' : 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success confirmation view
  if (submissionSuccess) {
    const sService = lang === 'am' 
      ? (submissionSuccess.serviceName_am || submissionSuccess.service_am || submissionSuccess.service) 
      : submissionSuccess.service;
    const sInstitution = lang === 'am' 
      ? (submissionSuccess.institutionName_am || submissionSuccess.institution_am || submissionSuccess.institution) 
      : submissionSuccess.institution;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.app_submitted_success || (lang === 'am' ? 'ማመልከቻዎ በተሳካ ሁኔታ ቀርቧል!' : 'Application Submitted Successfully!')}
          </h2>
          <p className="text-gray-600 mb-6">
            {lang === 'am' ? 'ማመልከቻዎ ደርሶናል፤ በሂደት ላይ ይገኛል።' : 'Your application has been received and is being processed.'}
          </p>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">
              {t.app_ref_number_is || (lang === 'am' ? 'የማመልከቻ መለያ ቁጥርዎ:' : 'Your Reference Number:')}
            </p>
            <p className="text-3xl font-bold text-blue-600">{submissionSuccess.referenceNumber}</p>
            <p className="text-xs text-gray-500 mt-2">
              {lang === 'am' ? 'እባክዎ ይህን መለያ ቁጥር ለማመልከቻ ክትትል ያስቀምጡ' : 'Please save this reference number for tracking'}
            </p>
          </div>

          <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t.service || 'Service'}:</span>
              <span className="font-medium text-gray-900">{sService}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t.institution || 'Institution'}:</span>
              <span className="font-medium text-gray-900">{sInstitution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t.submitted || 'Submitted'}:</span>
              <span className="font-medium text-gray-900">{submissionSuccess.submittedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t.status || 'Status'}:</span>
              <span className="badge bg-blue-100 text-blue-800">{getStatusLabel(submissionSuccess.status)}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setActiveSection('applications')}
              className="px-6 py-3 bg-[#1e3a8a] text-white rounded-xl hover:bg-[#172554] transition font-semibold text-sm cursor-pointer shadow-xs"
            >
              {t.view_my_applications || (lang === 'am' ? 'ማመልከቻዎቼን ይመልከቱ' : 'View My Applications')}
            </button>
            <button
              onClick={() => {
                setSubmissionSuccess(null);
                setSelectedInstitution(null);
                setSelectedService(null);
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium text-sm cursor-pointer"
            >
              {t.apply_another_service || (lang === 'am' ? 'ለሌላ አገልግሎት ያመልክቱ' : 'Submit Another')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Application form modal
  if (showApplicationForm && selectedService && selectedInstitution) {
    const serviceName = lang === 'am' 
      ? (selectedService.name_am || selectedService.title_am || selectedService.name || selectedService.title_en)
      : (selectedService.name || selectedService.title_en || 'Service');
    const instName = lang === 'am'
      ? (selectedInstitution.name_am || selectedInstitution.name_en)
      : (selectedInstitution.name_en || selectedInstitution.name || 'Institution');

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setShowApplicationForm(false)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t.back_to_service_details || (lang === 'am' ? 'ወደ አገልግሎት ዝርዝር ተመለስ' : 'Back to Service Details')}
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/80">
              <h2 className="text-xl font-bold text-slate-900 mb-1">{serviceName}</h2>
              <p className="text-sm text-slate-600">{serviceName} — {instName}</p>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    {t.full_name || (lang === 'am' ? 'ሙሉ ስም' : 'Full Name')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${formErrors.fullName ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'} bg-white focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 placeholder:text-slate-400 text-sm`}
                    placeholder={lang === 'am' ? 'ሙሉ ስምዎን ያስገቡ' : 'Enter your full name'}
                  />
                  {formErrors.fullName && <p className="text-xs text-rose-600 mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    {t.email || (lang === 'am' ? 'ኢሜይል' : 'Email')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${formErrors.email ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'} bg-white focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 placeholder:text-slate-400 text-sm`}
                    placeholder="your.email@example.com"
                  />
                  {formErrors.email && <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    {t.phone || (lang === 'am' ? 'ስልክ ቁጥር' : 'Phone Number')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${formErrors.phone ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'} bg-white focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 placeholder:text-slate-400 text-sm`}
                    placeholder="+251 91 234 5678"
                  />
                  {formErrors.phone && <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    {t.address || (lang === 'am' ? 'አድራሻ' : 'Address')}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 placeholder:text-slate-400 text-sm"
                    placeholder={lang === 'am' ? 'አድራሻዎ' : 'Your address'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  {t.additional_information || (lang === 'am' ? 'ተጨማሪ መረጃ' : 'Additional Information')}
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none text-slate-900 text-sm"
                  placeholder={lang === 'am' ? 'ተጨማሪ መረጃ ወይም ልዩ መስፈርቶች ካሉ እዚህ ይጻፉ...' : 'Any additional information or special requirements...'}
                />
              </div>

              {user?.emailVerified === false && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-xs font-bold text-amber-900 uppercase">
                      {lang === 'am' ? 'የኢሜይል ማረጋገጫ ያስፈልጋል' : 'Email Verification Required'}
                    </p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {lang === 'am'
                        ? 'ማመልከቻ ለማስገባት እባክዎ መጀመሪያ ኢሜይልዎን ያረጋግጡ።'
                        : 'Please verify your registered email address before submitting service applications.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">
                  {lang === 'am' ? 'የማመልከቻ መረጃ:' : 'Application Information:'}
                </p>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  {t.app_info_note || (lang === 'am' 
                    ? 'እባክዎ ከማስገባትዎ በፊት አስፈላጊ የሆኑ ሰነዶችን በሙሉ ያዘጋጁ። ለተጨማሪ መስፈርቶች በተቋሙ በኩል ሊገናኙዎት ይችላሉ።' 
                    : 'Please ensure you have all necessary documents ready for submission. You may be contacted by the institution for additional requirements.')}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || user?.emailVerified === false}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {user?.emailVerified === false 
                    ? (lang === 'am' ? 'ኢሜይል ማረጋገጥ ያስፈልጋል' : 'Email Verification Required')
                    : isSubmitting ? (t.submitting || 'Submitting...') : (t.submit_application || (lang === 'am' ? 'ማመልከቻ አስገባ' : 'Submit Application'))}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm cursor-pointer"
                >
                  {t.cancel || (lang === 'am' ? 'ሰርዝ' : 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Service details view
  if (selectedService && selectedInstitution) {
    const serviceName = lang === 'am' 
      ? (selectedService.name_am || selectedService.title_am || selectedService.name || selectedService.title_en)
      : (selectedService.name || selectedService.title_en || 'Service');
    const instName = lang === 'am'
      ? (selectedInstitution.name_am || selectedInstitution.name_en)
      : (selectedInstitution.name_en || selectedInstitution.name || 'Institution');
    const serviceDesc = lang === 'am'
      ? (selectedService.description_am || selectedService.description)
      : selectedService.description;

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedService(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {lang === 'am' ? 'ወደ አገልግሎቶች ተመለስ' : 'Back to Services'}
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/80">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{serviceName}</h2>
              <p className="text-sm text-slate-600">{instName}</p>
            </div>

            <div className="p-6 space-y-6">
              {serviceDesc && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#314ea1]" />
                    <span>{t.description || (lang === 'am' ? 'መግለጫ' : 'Description')}</span>
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{serviceDesc}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {t.processing_time || (lang === 'am' ? 'የማስኬጃ ጊዜ' : 'Processing Time')}
                  </p>
                  <p className="font-bold text-[#1e3a8a] text-base">{selectedService.processing_time || 'N/A'}</p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {t.service_fee || (lang === 'am' ? 'የአገልግሎት ክፍያ' : 'Service Fee')}
                  </p>
                  <p className="font-bold text-emerald-800 text-base">
                    {selectedService.fee_amount ? `${selectedService.fee_amount} ${t.etb || 'ETB'}` : (t.free || (lang === 'am' ? 'ነፃ' : 'Free'))}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f4b51a]" />
                  <span>{t.service_information || (lang === 'am' ? 'የአገልግሎት መረጃ' : 'Service Information')}</span>
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t.service_info_desc || (lang === 'am' 
                    ? 'እባክዎ ከማመልከትዎ በፊት አስፈላጊ ሰነዶችን በሙሉ ያዘጋጁ። ለተጨማሪ መስፈርቶች ተቋሙን ማነጋገር ይችላሉ።' 
                    : 'Please prepare all necessary documents before applying. You can check with the institution for specific requirements.')}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white rounded-xl shadow-xs transition font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t.apply_for_this_service || (lang === 'am' ? 'ለዚህ አገልግሎት ያመልክቱ' : 'Apply for this Service')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (selectedInstitution) {
    const instName = lang === 'am'
      ? (selectedInstitution.name_am || selectedInstitution.name_en)
      : (selectedInstitution.name_en || selectedInstitution.name);

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedInstitution(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t.back_to_institutions || (lang === 'am' ? 'ወደ ተቋማት ተመለስ' : 'Back to Institutions')}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] shadow-xs">
              <span className="text-2xl font-bold">
                {instName?.charAt(0) || 'I'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{instName}</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {institutionServices.length} {t.services_available || (lang === 'am' ? 'አገልግሎቶች ይገኛሉ' : 'services available')}
              </p>
            </div>
          </div>
          {selectedInstitution.website_url && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <a
                href={selectedInstitution.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {t.visit_official_website || (lang === 'am' ? 'ኦፊሴላዊ ድህረ ገጽን ይጎብኙ' : 'Visit Official Website')}
              </a>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {institutionServices.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-white rounded-2xl border border-slate-200/90 p-8">
              {t.no_services_available || (lang === 'am' ? 'ለዚህ ተቋም ምንም አገልግሎቶች አልተገኙም' : 'No services available for this institution')}
            </div>
          ) : (
            institutionServices.map((service) => {
              const svcName = lang === 'am' 
                ? (service.name_am || service.title_am || service.name || service.title_en)
                : (service.name || service.title_en);

              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md hover:border-[#314ea1] transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 group-hover:text-[#314ea1] transition-colors mb-2 text-base">
                        {svcName}
                      </h3>
                      <div className="flex gap-4 text-xs sm:text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {service.processing_time || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-[#1e3a8a]">
                          <svg className="w-4 h-4 text-[#314ea1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {service.fee_amount ? `${service.fee_amount} ${t.etb || 'ETB'}` : (t.free || (lang === 'am' ? 'ነፃ' : 'Free'))}
                        </span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-[#314ea1] group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  }

  // Institutions list view (default)
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          {t.apply_for_service || (lang === 'am' ? 'ለአገልግሎት ማመልከቻ' : 'Apply for a Service')}
        </h2>
        <p className="text-sm text-slate-500">
          {t.select_institution_subtitle || (lang === 'am' ? 'አገልግሎቶችን ለማየት ተቋም ይምረጡ' : 'Select an institution to view available services')}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search_institutions_services || (lang === 'am' ? 'ተቋማትን ወይም አገልግሎቶችን ይፈልጉ...' : 'Search institutions or services...')}
            className="w-full px-4 py-3 pl-11 rounded-2xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none shadow-2xs text-sm"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Institutions Grid */}
      {servicesLoading ? (
        <div className="col-span-full text-center text-slate-500 py-12">
          <div className="animate-pulse">
            {lang === 'am' ? 'ተቋማትን በመጫን ላይ...' : 'Loading institutions...'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstitutions.length === 0 ? (
            <div className="col-span-full text-center text-slate-400 py-12 bg-white rounded-2xl border border-slate-200/90 p-8">
              <p className="font-semibold text-slate-600">
                {t.no_institutions_found || (lang === 'am' ? 'ምንም ተቋማት አልተገኙም' : 'No institutions found')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t.try_diff_search || (lang === 'am' ? 'ሌላ የፍለጋ ቃል ይሞክሩ' : 'Try a different search term')}
              </p>
            </div>
          ) : (
            filteredInstitutions.map(inst => {
              const instServices = getServicesByInstitution(inst.id);
              const instName = lang === 'am' ? (inst.name_am || inst.name_en) : (inst.name_en || inst.name);

              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInstitution(inst)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md hover:border-[#314ea1] transition-all cursor-pointer group"
                >
                  <div className="w-full h-32 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf4fc] border border-slate-100 mb-4 p-3">
                    {inst.logo_url ? (
                      <img
                        src={inst.logo_url}
                        alt={instName}
                        className="max-w-full max-h-full object-contain p-2"
                        onError={(e) => { 
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={inst.logo_url ? "hidden" : "flex"} style={{display: inst.logo_url ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                      <span className="text-4xl font-bold text-[#314ea1]">
                        {instName?.charAt(0) || 'I'}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-[#314ea1] transition-colors mb-2 text-center text-base">{instName}</h3>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-[#1e3a8a] bg-blue-50/80 border border-blue-200/70 px-3 py-1 rounded-full text-center inline-block">
                      {instServices.length} {t.services || (lang === 'am' ? 'አገልግሎቶች' : (instServices.length === 1 ? 'service' : 'services'))}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}

// ─── My Feedback Section Component ────────────────────────────────
function MyFeedbackSection() {
  const { t, lang } = useApp();
  const { myFeedback, loading, fetchMyFeedback } = useFeedback();
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Fetch feedback on mount
  useEffect(() => {
    fetchMyFeedback();
  }, [fetchMyFeedback]);

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  const getRatingMeaning = (rating) => {
    const meanings = {
      1: t.poor || 'Poor',
      2: t.good || 'Good',
      3: t.very_good || 'Very Good',
      4: t.excellent || 'Excellent',
      5: t.fantastic || 'Fantastic'
    };
    return meanings[rating] || '';
  };

  // Feedback detail view
  if (selectedFeedback) {
    const feedback = myFeedback.find(f => f.id === selectedFeedback);
    if (!feedback) {
      setSelectedFeedback(null);
      return null;
    }

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelectedFeedback(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t.back_to_feedback || (lang === 'am' ? 'ወደ አስተያየቶቼ ተመለስ' : 'Back to My Feedback')}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-amber-100/90 bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-amber-50/80">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{feedback.service_name}</h2>
                <p className="text-sm text-slate-600">{feedback.institution_name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl mb-1">{getRatingStars(feedback.rating)}</div>
                <p className="text-xs sm:text-sm font-semibold text-amber-900">{feedback.rating}/5 — {getRatingMeaning(feedback.rating)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {t.rating || (lang === 'am' ? 'ደረጃ' : 'Rating')}
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {getRatingStars(feedback.rating)} {feedback.rating}/5 — {getRatingMeaning(feedback.rating)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {lang === 'am' ? 'ምንጭ' : 'Source'}
                </p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  feedback.source === 'WEBSITE' ? 'bg-blue-50 text-[#1e3a8a] border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {feedback.source === 'WEBSITE' ? (lang === 'am' ? 'ድህረ ገጽ' : 'Website Portal') : 'Telegram Bot'}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {t.submitted || (lang === 'am' ? 'የቀረበበት ቀን' : 'Submitted')}
                </p>
                <p className="font-medium text-slate-800 text-sm">{new Date(feedback.created_at).toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {t.time || (lang === 'am' ? 'ሰዓት' : 'Time')}
                </p>
                <p className="font-medium text-slate-800 text-sm">{new Date(feedback.created_at).toLocaleTimeString()}</p>
              </div>
            </div>

            {feedback.comment && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f4b51a]" />
                  <span>{lang === 'am' ? 'የእርስዎ አስተያየት' : 'Your Feedback Comment'}</span>
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">{feedback.comment}</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Feedback list view
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          {t.my_feedback || (lang === 'am' ? 'የኔ አስተያየቶች' : 'My Feedback')}
        </h2>
        <p className="text-sm text-slate-500">
          {lang === 'am' ? 'የአገልግሎት ደረጃ አሰጣጥዎን እና የአስተያየት ታሪክዎን ይመልከቱ' : 'View your service ratings and feedback history'}
        </p>
      </div>

      {loading && myFeedback.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          {lang === 'am' ? 'አስተያየቶችን በመጫን ላይ...' : 'Loading your feedback...'}
        </div>
      )}

      {!loading && myFeedback.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700 text-sm">
            {lang === 'am' ? 'እስካሁን ምንም አስተያየት አልቀረበም' : 'No feedback submitted yet'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'am' ? 'አገልግሎት ከጨረሱ በኋላ ልምድዎን እዚህ ደረጃ መስጠት ይችላሉ።' : 'After completing a service, you can rate your experience here.'}
          </p>
        </div>
      )}

      {myFeedback.length > 0 && (
        <div className="space-y-3">
          {myFeedback.map(feedback => (
            <div
              key={feedback.id}
              onClick={() => setSelectedFeedback(feedback.id)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">{feedback.service_name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      feedback.source === 'WEBSITE' ? 'bg-blue-50 text-[#1e3a8a] border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {feedback.source === 'WEBSITE' ? (lang === 'am' ? 'ድህረ ገጽ' : 'Website') : 'Telegram'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{feedback.institution_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getRatingStars(feedback.rating)}</span>
                    <span className="text-xs font-semibold text-amber-900">{feedback.rating}/5 — {getRatingMeaning(feedback.rating)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{new Date(feedback.created_at).toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US')}</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Customer Announcements Component ──────────────────────────────
function CustomerAnnouncements() {
  const { t, lang } = useApp();
  const { announcements, loading } = useAnnouncements();
  const [selected, setSelected] = useState(null);

  // Announcement detail view
  if (selected) {
    const ann = announcements.find(a => a.id === selected);
    if (!ann) return null;

    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setSelected(null)}
            className="text-[#314ea1] hover:text-[#1e3a8a] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t.back_to_announcements || (lang === 'am' ? 'ወደ ማስታወቂያዎች ተመለስ' : 'Back to Announcements')}
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">{ann.title}</h2>
            {ann.is_active && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex-shrink-0">
                {t.active || (lang === 'am' ? 'ንቁ' : 'Active')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-4">{new Date(ann.published_at || ann.created_at).toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US')} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
          <p className="text-sm text-slate-700 leading-relaxed">{ann.content}</p>
        </div>
      </>
    );
  }

  // Announcement list view
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          {t.announcements || (lang === 'am' ? 'ማስታወቂያዎች' : 'Announcements')}
        </h2>
        <p className="text-sm text-slate-500">
          {lang === 'am' ? 'ከመሶብ ማዕከል የቅርብ ጊዜ ዝመናዎች እና ማሳሰቢያዎች።' : 'Latest updates and notices from MESOB Center.'}
        </p>
      </div>

      {loading && !announcements.length && (
        <div className="text-center py-8 text-slate-500">
          {lang === 'am' ? 'ማስታወቂያዎችን በመጫን ላይ...' : 'Loading announcements...'}
        </div>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#314ea1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-700 text-sm">
              {lang === 'am' ? 'በአሁኑ ጊዜ ምንም ማስታወቂያ የለም' : 'No announcements at this time'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'am' ? 'ከመሶብ ማዕከል ይፋዊ ዝመናዎች እና ማሳሰቢያዎች እዚህ ይታያሉ።' : 'Official updates and notices from MESOB Center will appear here.'}
            </p>
          </div>
        ) : (
          announcements.map(ann => (
            <div
              key={ann.id}
              onClick={() => setSelected(ann.id)}
              className={`bg-white rounded-2xl border shadow-xs p-5 cursor-pointer hover:shadow-sm hover:border-blue-300 transition-all duration-200 group ${ann.is_active ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {ann.is_active && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#314ea1] transition-colors leading-snug">{ann.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(ann.published_at || ann.created_at).toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US')} {ann.creator?.full_name && `• ${ann.creator.full_name}`}</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-[#314ea1] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

