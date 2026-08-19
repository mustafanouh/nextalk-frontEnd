import { CallUiState } from '../types';

const LABELS: Record<CallUiState, string> = {
  idle: '',
  calling: 'جاري الاتصال...',
  ringing: 'مكالمة واردة...',
  connecting: 'جاري الاتصال...',
  connected: 'متصل',
  ending: 'جاري إنهاء المكالمة...',
  ended: 'انتهت المكالمة',
  rejected: 'تم رفض المكالمة',
  missed: 'مكالمة فائتة',
  failed: 'فشل الاتصال',
};

export function CallStatus({ state }: { state: CallUiState }) {
  return <p className="text-sm text-white/80">{LABELS[state]}</p>;
}
